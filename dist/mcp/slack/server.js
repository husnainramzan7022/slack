"use strict";
/**
 * Slack MCP Server
 * Provides MCP tools for Slack integration using Nango for authentication
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackMCPServer = void 0;
exports.createSlackMCPServer = createSlackMCPServer;
const base_1 = require("../base");
const service_1 = require("../../integrations/slack/service");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
/**
 * Slack MCP Server implementation
 */
class SlackMCPServer extends base_1.BaseMCPServer {
    constructor(config) {
        super({
            ...config,
            name: 'slack-mcp',
            version: '1.0.0',
            description: 'MCP server for Slack integration with messaging, channels, and user management',
            capabilities: {
                tools: true,
                resources: false,
                prompts: false,
            },
        });
        this.nangoSecretKey = config.nangoSecretKey;
        this.defaultConnectionId = config.defaultConnectionId;
        this.slackService = new service_1.SlackService(this.nangoSecretKey);
        base_1.MCPUtils.log('slack-mcp', 'Slack MCP Server initialized');
    }
    /**
     * Get available tools
     */
    async getTools() {
        return [
            {
                name: 'slack_send_message',
                description: 'Send a message to a Slack channel or user',
                inputSchema: base_1.MCPUtils.createToolSchema({
                    connectionId: {
                        type: 'string',
                        description: 'Nango connection ID for the Slack workspace (optional if default is set)',
                    },
                    channel: {
                        type: 'string',
                        description: 'Channel ID, channel name (#general), or user ID (@username) to send message to',
                    },
                    text: {
                        type: 'string',
                        description: 'The message text to send',
                    },
                    thread_ts: {
                        type: 'string',
                        description: 'Optional: Reply to a specific thread by providing the thread timestamp',
                    },
                    username: {
                        type: 'string',
                        description: 'Optional: Custom username for the message',
                    },
                    icon_emoji: {
                        type: 'string',
                        description: 'Optional: Custom emoji icon for the message (e.g., :robot_face:)',
                    },
                }, ['channel', 'text']),
            },
            {
                name: 'slack_get_channels',
                description: 'Get a list of channels in the Slack workspace',
                inputSchema: base_1.MCPUtils.createToolSchema({
                    connectionId: {
                        type: 'string',
                        description: 'Nango connection ID for the Slack workspace (optional if default is set)',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of channels to return (default: 100)',
                    },
                    cursor: {
                        type: 'string',
                        description: 'Pagination cursor for getting next page of results',
                    },
                    exclude_archived: {
                        type: 'boolean',
                        description: 'Whether to exclude archived channels (default: true)',
                    },
                    types: {
                        type: 'string',
                        description: 'Channel types to include: public_channel,private_channel,mpim,im (default: public_channel,private_channel)',
                    },
                }, []),
            },
            {
                name: 'slack_get_users',
                description: 'Get a list of users in the Slack workspace',
                inputSchema: base_1.MCPUtils.createToolSchema({
                    connectionId: {
                        type: 'string',
                        description: 'Nango connection ID for the Slack workspace (optional if default is set)',
                    },
                    limit: {
                        type: 'number',
                        description: 'Maximum number of users to return (default: 100)',
                    },
                    cursor: {
                        type: 'string',
                        description: 'Pagination cursor for getting next page of results',
                    },
                    include_locale: {
                        type: 'boolean',
                        description: 'Whether to include user locale information (default: false)',
                    },
                }, []),
            },
            {
                name: 'slack_get_user_info',
                description: 'Get detailed information about a specific user',
                inputSchema: base_1.MCPUtils.createToolSchema({
                    connectionId: {
                        type: 'string',
                        description: 'Nango connection ID for the Slack workspace (optional if default is set)',
                    },
                    user: {
                        type: 'string',
                        description: 'User ID or username to get information for',
                    },
                    include_locale: {
                        type: 'boolean',
                        description: 'Whether to include user locale information (default: false)',
                    },
                }, ['user']),
            },
            {
                name: 'slack_health_check',
                description: 'Check the health and connectivity of the Slack integration',
                inputSchema: base_1.MCPUtils.createToolSchema({
                    connectionId: {
                        type: 'string',
                        description: 'Nango connection ID for the Slack workspace (optional if default is set)',
                    },
                }, []),
            },
            {
                name: 'slack_ai_message',
                description: 'Send a message using natural language command parsing (e.g., "send hello to general channel")',
                inputSchema: base_1.MCPUtils.createToolSchema({
                    connectionId: {
                        type: 'string',
                        description: 'Nango connection ID for the Slack workspace (optional if default is set)',
                    },
                    command: {
                        type: 'string',
                        description: 'Natural language command describing what message to send where (e.g., "send hello world to the general channel")',
                    },
                }, ['command']),
            },
        ];
    }
    /**
     * Execute a tool
     */
    async executeTool(name, args) {
        try {
            // Get connection ID (use provided or default)
            const connectionId = args.connectionId || this.defaultConnectionId;
            if (!connectionId) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, 'No connection ID provided and no default connection ID configured');
            }
            // Initialize Slack service with connection
            await this.slackService.initialize({ nangoConnectionId: connectionId });
            // Create auth context
            const authContext = {
                userId: args.userId || 'mcp-user',
                accessToken: '', // Handled by Nango
            };
            switch (name) {
                case 'slack_send_message':
                    return await this.handleSendMessage(args, authContext);
                case 'slack_get_channels':
                    return await this.handleGetChannels(args, authContext);
                case 'slack_get_users':
                    return await this.handleGetUsers(args, authContext);
                case 'slack_get_user_info':
                    return await this.handleGetUserInfo(args, authContext);
                case 'slack_health_check':
                    return await this.handleHealthCheck();
                case 'slack_ai_message':
                    return await this.handleAIMessage(args, authContext);
                default:
                    throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
            }
        }
        catch (error) {
            base_1.MCPUtils.logError('slack-mcp', `Tool execution failed: ${name}`, error);
            if (error instanceof types_js_1.McpError) {
                throw error;
            }
            return this.createErrorResult(`Failed to execute ${name}: ${base_1.MCPUtils.formatError(error)}`, { error: error instanceof Error ? error.message : String(error) });
        }
    }
    /**
     * Handle send message tool
     */
    async handleSendMessage(args, authContext) {
        var _a;
        this.validateArgs(args, ['channel', 'text']);
        const result = await this.slackService.sendMessage({
            channel: args.channel,
            text: args.text,
            thread_ts: args.thread_ts,
            username: args.username,
            icon_emoji: args.icon_emoji,
        }, authContext);
        if (!result.success) {
            return this.createErrorResult(`Failed to send message: ${(_a = result.error) === null || _a === void 0 ? void 0 : _a.message}`, result.error);
        }
        return this.createSuccessResult(`Message sent successfully to ${args.channel}`, result.data);
    }
    /**
     * Handle get channels tool
     */
    async handleGetChannels(args, authContext) {
        var _a, _b, _c, _d;
        const result = await this.slackService.getChannels({
            limit: args.limit || 100,
            cursor: args.cursor,
            exclude_archived: (_a = args.exclude_archived) !== null && _a !== void 0 ? _a : true,
            types: args.types || 'public_channel,private_channel',
        }, authContext);
        if (!result.success) {
            return this.createErrorResult(`Failed to get channels: ${(_b = result.error) === null || _b === void 0 ? void 0 : _b.message}`, result.error);
        }
        const channels = ((_c = result.data) === null || _c === void 0 ? void 0 : _c.channels) || [];
        return this.createSuccessResult(`Retrieved ${channels.length} channels`, {
            channels: channels.map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type,
                memberCount: channel.memberCount,
            })),
            nextCursor: (_d = result.data) === null || _d === void 0 ? void 0 : _d.nextCursor,
            total: channels.length,
        });
    }
    /**
     * Handle get users tool
     */
    async handleGetUsers(args, authContext) {
        var _a, _b, _c;
        const result = await this.slackService.getUsers({
            limit: args.limit || 100,
            cursor: args.cursor,
            include_locale: args.include_locale || false,
        }, authContext);
        if (!result.success) {
            return this.createErrorResult(`Failed to get users: ${(_a = result.error) === null || _a === void 0 ? void 0 : _a.message}`, result.error);
        }
        const users = ((_b = result.data) === null || _b === void 0 ? void 0 : _b.users) || [];
        return this.createSuccessResult(`Retrieved ${users.length} users`, {
            users: users.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                status: user.status,
            })),
            nextCursor: (_c = result.data) === null || _c === void 0 ? void 0 : _c.nextCursor,
            total: users.length,
        });
    }
    /**
     * Handle get user info tool
     */
    async handleGetUserInfo(args, authContext) {
        var _a;
        this.validateArgs(args, ['user']);
        const result = await this.slackService.getUserInfo({
            user: args.user,
            include_locale: args.include_locale || false,
        }, authContext);
        if (!result.success) {
            return this.createErrorResult(`Failed to get user info: ${(_a = result.error) === null || _a === void 0 ? void 0 : _a.message}`, result.error);
        }
        return this.createSuccessResult(`Retrieved user information for ${args.user}`, result.data);
    }
    /**
     * Handle health check tool
     */
    async handleHealthCheck() {
        const result = await this.slackService.testConnection();
        return this.createSuccessResult(`Health check completed - Status: ${result.status}`, {
            status: result.status,
            timestamp: result.timestamp,
            checks: result.checks,
            details: result.details,
        });
    }
    /**
     * Handle AI message tool with natural language parsing
     */
    async handleAIMessage(args, authContext) {
        var _a;
        this.validateArgs(args, ['command']);
        try {
            // Parse the natural language command
            const parsed = this.parseAICommand(args.command);
            if (!parsed.channel || !parsed.message) {
                return this.createErrorResult('Could not parse the command. Please specify both a channel/user and a message.', {
                    command: args.command,
                    parsed,
                    suggestion: 'Try: "send hello world to the general channel" or "message @john about the meeting"'
                });
            }
            // Send the message using parsed data
            const result = await this.slackService.sendMessage({
                channel: parsed.channel,
                text: parsed.message,
            }, authContext);
            if (!result.success) {
                return this.createErrorResult(`Failed to send AI message: ${(_a = result.error) === null || _a === void 0 ? void 0 : _a.message}`, { ...result.error, originalCommand: args.command, parsed });
            }
            return this.createSuccessResult(`AI message sent successfully to ${parsed.channel}`, {
                originalCommand: args.command,
                parsedChannel: parsed.channel,
                parsedMessage: parsed.message,
                result: result.data,
            });
        }
        catch (error) {
            return this.createErrorResult(`Failed to process AI command: ${base_1.MCPUtils.formatError(error)}`, { command: args.command, error: base_1.MCPUtils.formatError(error) });
        }
    }
    /**
     * Parse natural language commands for AI messaging
     */
    parseAICommand(command) {
        const normalizedCommand = command.toLowerCase().trim();
        // Channel patterns to look for
        const channelPatterns = [
            /(?:to|in) (?:the )?#([a-zA-Z0-9\-_]+)/, // "to #general" or "in the #random"
            /(?:to|in) (?:the )?([a-zA-Z0-9\-_]+) channel/, // "to general channel"
            /@([a-zA-Z0-9\-_.]+)/, // "@username"
            /(?:to|message) ([a-zA-Z0-9\-_.]+)/, // "to john" or "message alice"
        ];
        let channel;
        let message;
        // Find channel
        for (const pattern of channelPatterns) {
            const match = normalizedCommand.match(pattern);
            if (match) {
                const channelName = match[1];
                // Format channel appropriately
                if (normalizedCommand.includes('@') || normalizedCommand.includes('message ')) {
                    channel = channelName.startsWith('@') ? channelName : `@${channelName}`;
                }
                else {
                    channel = channelName.startsWith('#') ? channelName : `#${channelName}`;
                }
                break;
            }
        }
        // Extract message content
        const messagePatterns = [
            /^(?:send|message|tell|say) (?:"([^"]+)"|'([^']+)'|([^"'].+?)) (?:to|in)/, // "send 'hello' to"
            /^(?:send|message|tell|say) (.+?) (?:to|in|@)/, // "send hello world to"
            /"([^"]+)"/, // Quoted message
            /'([^']+)'/, // Single quoted message
        ];
        for (const pattern of messagePatterns) {
            const match = command.match(pattern);
            if (match) {
                message = match[1] || match[2] || match[3];
                if (message) {
                    message = message.trim();
                    break;
                }
            }
        }
        // Fallback: if no specific patterns match, try to split on common words
        if (!message && channel) {
            const splitWords = ['to', 'in', '@'];
            for (const word of splitWords) {
                const parts = command.split(new RegExp(`\\s+${word}\\s+`, 'i'));
                if (parts.length >= 2) {
                    message = parts[0].replace(/^(?:send|message|tell|say)\s+/i, '').trim();
                    break;
                }
            }
        }
        return { channel, message };
    }
    /**
     * Get server information with tool details
     */
    getServerInfo() {
        const baseInfo = super.getServerInfo();
        return {
            ...baseInfo,
            tools: [
                'slack_send_message',
                'slack_get_channels',
                'slack_get_users',
                'slack_get_user_info',
                'slack_health_check',
                'slack_ai_message',
            ],
            capabilities: {
                messaging: true,
                channelManagement: true,
                userManagement: true,
                healthChecking: true,
                aiCommands: true,
            },
            authentication: 'nango-oauth',
        };
    }
}
exports.SlackMCPServer = SlackMCPServer;
/**
 * Create and configure Slack MCP Server
 */
function createSlackMCPServer(config) {
    // Validate environment
    const env = base_1.MCPUtils.validateEnvironment(['NANGO_SECRET_KEY']);
    const serverConfig = {
        name: 'slack-mcp',
        version: '1.0.0',
        description: 'MCP server for Slack integration',
        nangoSecretKey: env.NANGO_SECRET_KEY,
        defaultConnectionId: process.env.SLACK_DEFAULT_CONNECTION_ID,
        ...config,
    };
    return new SlackMCPServer(serverConfig);
}
