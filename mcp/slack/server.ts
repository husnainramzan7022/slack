/**
 * Slack MCP Server
 * Provides MCP tools for Slack integration using Nango for authentication
 */

import { BaseMCPServer, MCPServerConfig, MCPTool, MCPToolResult, MCPUtils } from '../base';
import { SlackService } from '../../integrations/slack/service';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

/**
 * Slack MCP Server Configuration
 */
export interface SlackMCPConfig extends MCPServerConfig {
  nangoSecretKey: string;
  defaultConnectionId?: string;
}

/**
 * Slack MCP Server implementation
 */
export class SlackMCPServer extends BaseMCPServer {
  private slackService: SlackService;
  private nangoSecretKey: string;
  private defaultConnectionId?: string;

  constructor(config: SlackMCPConfig) {
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
    this.slackService = new SlackService(this.nangoSecretKey);

    MCPUtils.log('slack-mcp', 'Slack MCP Server initialized');
  }

  /**
   * Get available tools
   */
  protected async getTools(): Promise<MCPTool[]> {
    return [
      {
        name: 'slack_send_message',
        description: 'Send a message to a Slack channel or user',
        inputSchema: MCPUtils.createToolSchema({
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
        inputSchema: MCPUtils.createToolSchema({
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
        inputSchema: MCPUtils.createToolSchema({
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
        inputSchema: MCPUtils.createToolSchema({
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
        inputSchema: MCPUtils.createToolSchema({
          connectionId: {
            type: 'string',
            description: 'Nango connection ID for the Slack workspace (optional if default is set)',
          },
        }, []),
      },
      {
        name: 'slack_ai_message',
        description: 'Send a message using natural language command parsing (e.g., "send hello to general channel")',
        inputSchema: MCPUtils.createToolSchema({
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
  protected async executeTool(name: string, args: any): Promise<MCPToolResult> {
    try {
      // Get connection ID (use provided or default)
      const connectionId = args.connectionId || this.defaultConnectionId;
      if (!connectionId) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'No connection ID provided and no default connection ID configured'
        );
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
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error) {
      MCPUtils.logError('slack-mcp', `Tool execution failed: ${name}`, error);
      
      if (error instanceof McpError) {
        throw error;
      }

      return this.createErrorResult(
        `Failed to execute ${name}: ${MCPUtils.formatError(error)}`,
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * Handle send message tool
   */
  private async handleSendMessage(args: any, authContext: any): Promise<MCPToolResult> {
    this.validateArgs(args, ['channel', 'text']);

    const result = await this.slackService.sendMessage({
      channel: args.channel,
      text: args.text,
      thread_ts: args.thread_ts,
      username: args.username,
      icon_emoji: args.icon_emoji,
    }, authContext);

    if (!result.success) {
      return this.createErrorResult(
        `Failed to send message: ${result.error?.message}`,
        result.error
      );
    }

    return this.createSuccessResult(
      `Message sent successfully to ${args.channel}`,
      result.data
    );
  }

  /**
   * Handle get channels tool
   */
  private async handleGetChannels(args: any, authContext: any): Promise<MCPToolResult> {
    const result = await this.slackService.getChannels({
      limit: args.limit || 100,
      cursor: args.cursor,
      exclude_archived: args.exclude_archived ?? true,
      types: args.types || 'public_channel,private_channel',
    }, authContext);

    if (!result.success) {
      return this.createErrorResult(
        `Failed to get channels: ${result.error?.message}`,
        result.error
      );
    }

    const channels = result.data?.channels || [];
    return this.createSuccessResult(
      `Retrieved ${channels.length} channels`,
      {
        channels: channels.map(channel => ({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          memberCount: channel.memberCount,
        })),
        nextCursor: result.data?.nextCursor,
        total: channels.length,
      }
    );
  }

  /**
   * Handle get users tool
   */
  private async handleGetUsers(args: any, authContext: any): Promise<MCPToolResult> {
    const result = await this.slackService.getUsers({
      limit: args.limit || 100,
      cursor: args.cursor,
      include_locale: args.include_locale || false,
    }, authContext);

    if (!result.success) {
      return this.createErrorResult(
        `Failed to get users: ${result.error?.message}`,
        result.error
      );
    }

    const users = result.data?.users || [];
    return this.createSuccessResult(
      `Retrieved ${users.length} users`,
      {
        users: users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          status: user.status,
        })),
        nextCursor: result.data?.nextCursor,
        total: users.length,
      }
    );
  }

  /**
   * Handle get user info tool
   */
  private async handleGetUserInfo(args: any, authContext: any): Promise<MCPToolResult> {
    this.validateArgs(args, ['user']);

    const result = await this.slackService.getUserInfo({
      user: args.user,
      include_locale: args.include_locale || false,
    }, authContext);

    if (!result.success) {
      return this.createErrorResult(
        `Failed to get user info: ${result.error?.message}`,
        result.error
      );
    }

    return this.createSuccessResult(
      `Retrieved user information for ${args.user}`,
      result.data
    );
  }

  /**
   * Handle health check tool
   */
  private async handleHealthCheck(): Promise<MCPToolResult> {
    const result = await this.slackService.testConnection();

    return this.createSuccessResult(
      `Health check completed - Status: ${result.status}`,
      {
        status: result.status,
        timestamp: result.timestamp,
        checks: result.checks,
        details: result.details,
      }
    );
  }

  /**
   * Handle AI message tool with natural language parsing
   */
  private async handleAIMessage(args: any, authContext: any): Promise<MCPToolResult> {
    this.validateArgs(args, ['command']);

    try {
      // Parse the natural language command
      const parsed = this.parseAICommand(args.command);
      
      if (!parsed.channel || !parsed.message) {
        return this.createErrorResult(
          'Could not parse the command. Please specify both a channel/user and a message.',
          {
            command: args.command,
            parsed,
            suggestion: 'Try: "send hello world to the general channel" or "message @john about the meeting"'
          }
        );
      }

      // Send the message using parsed data
      const result = await this.slackService.sendMessage({
        channel: parsed.channel,
        text: parsed.message,
      }, authContext);

      if (!result.success) {
        return this.createErrorResult(
          `Failed to send AI message: ${result.error?.message}`,
          { ...result.error, originalCommand: args.command, parsed }
        );
      }

      return this.createSuccessResult(
        `AI message sent successfully to ${parsed.channel}`,
        {
          originalCommand: args.command,
          parsedChannel: parsed.channel,
          parsedMessage: parsed.message,
          result: result.data,
        }
      );
    } catch (error) {
      return this.createErrorResult(
        `Failed to process AI command: ${MCPUtils.formatError(error)}`,
        { command: args.command, error: MCPUtils.formatError(error) }
      );
    }
  }

  /**
   * Parse natural language commands for AI messaging
   */
  private parseAICommand(command: string): { channel?: string; message?: string } {
    const normalizedCommand = command.toLowerCase().trim();

    // Channel patterns to look for
    const channelPatterns = [
      /(?:to|in) (?:the )?#([a-zA-Z0-9\-_]+)/,  // "to #general" or "in the #random"
      /(?:to|in) (?:the )?([a-zA-Z0-9\-_]+) channel/,  // "to general channel"
      /@([a-zA-Z0-9\-_.]+)/,  // "@username"
      /(?:to|message) ([a-zA-Z0-9\-_.]+)/,  // "to john" or "message alice"
    ];

    let channel: string | undefined;
    let message: string | undefined;

    // Find channel
    for (const pattern of channelPatterns) {
      const match = normalizedCommand.match(pattern);
      if (match) {
        const channelName = match[1];
        
        // Format channel appropriately
        if (normalizedCommand.includes('@') || normalizedCommand.includes('message ')) {
          channel = channelName.startsWith('@') ? channelName : `@${channelName}`;
        } else {
          channel = channelName.startsWith('#') ? channelName : `#${channelName}`;
        }
        break;
      }
    }

    // Extract message content
    const messagePatterns = [
      /^(?:send|message|tell|say) (?:"([^"]+)"|'([^']+)'|([^"'].+?)) (?:to|in)/,  // "send 'hello' to"
      /^(?:send|message|tell|say) (.+?) (?:to|in|@)/,  // "send hello world to"
      /"([^"]+)"/,  // Quoted message
      /'([^']+)'/,  // Single quoted message
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

/**
 * Create and configure Slack MCP Server
 */
export function createSlackMCPServer(config?: Partial<SlackMCPConfig>): SlackMCPServer {
  // Validate environment
  const env = MCPUtils.validateEnvironment(['NANGO_SECRET_KEY']);
  
  const serverConfig: SlackMCPConfig = {
    name: 'slack-mcp',
    version: '1.0.0',
    description: 'MCP server for Slack integration',
    nangoSecretKey: env.NANGO_SECRET_KEY,
    defaultConnectionId: process.env.SLACK_DEFAULT_CONNECTION_ID,
    ...config,
  };

  return new SlackMCPServer(serverConfig);
}