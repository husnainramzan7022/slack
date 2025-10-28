"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackService = void 0;
const node_1 = require("@nangohq/node");
const base_integration_1 = require("../common/base-integration");
const types_1 = require("../common/types");
const types_2 = require("./types");
/**
 * Slack Integration Service
 * Handles all Slack API operations using Nango for OAuth management
 */
class SlackService extends base_integration_1.BaseIntegrationClass {
    constructor(nangoSecretKey) {
        super();
        this.id = 'slack';
        this.name = 'Slack';
        this.description = 'Send messages, fetch users, and manage channels in Slack';
        this.version = '1.0.0';
        this.configSchema = types_2.SlackConfigSchema;
        this.nango = new node_1.Nango({ secretKey: nangoSecretKey });
    }
    async initialize(config) {
        try {
            this.config = types_1.IntegrationUtils.validateInput(this.configSchema, config);
            // Test the connection during initialization
            await this.testConnection();
        }
        catch (error) {
            throw new Error(`Failed to initialize Slack integration: ${error.message}`);
        }
    }
    async testConnection() {
        const checks = {
            authentication: false,
            apiAccess: false,
            permissions: false,
        };
        try {
            if (!this.config) {
                throw new Error('Integration not initialized');
            }
            // Test authentication by getting bot info
            const response = await this.makeApiCall('/auth.test');
            if (response.ok) {
                checks.authentication = true;
                checks.apiAccess = true;
                // Test permissions by trying to list channels
                try {
                    await this.makeApiCall('/conversations.list', { limit: 1 });
                    checks.permissions = true;
                }
                catch (permError) {
                    console.warn('Limited permissions detected:', permError);
                }
            }
            const allHealthy = Object.values(checks).every(check => check);
            return {
                status: allHealthy ? 'healthy' : checks.authentication ? 'degraded' : 'unhealthy',
                timestamp: new Date().toISOString(),
                checks,
                details: {
                    connectionId: this.config.nangoConnectionId,
                },
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                checks,
                details: {
                    error: error.message,
                },
            };
        }
    }
    /**
     * Send a message to a Slack channel or user
     */
    async sendMessage(request, authContext) {
        try {
            const validatedRequest = types_1.IntegrationUtils.validateInput(types_2.SendMessageSchema, request);
            if (!this.config) {
                throw new Error('Integration not initialized');
            }
            console.log('Sending message with request:', validatedRequest);
            if (!this.config) {
                throw new Error('Integration not initialized');
            }
            // Use Nango's pre-built triggerAction for sending messages
            // This automatically handles authentication and sends as the connected user
            const response = await this.nango.triggerAction('slack', this.config.nangoConnectionId, 'send-message', {
                channel: validatedRequest.channel,
                text: validatedRequest.text,
            });
            console.log('Send message response:', response);
            // Handle the response from Nango's triggerAction
            if (!response.ok) {
                let errorMessage = `Failed to send message: ${response.error || 'Unknown error'}`;
                let suggestions = '';
                // Provide helpful suggestions based on error type
                switch (response.error) {
                    case 'not_in_channel':
                        suggestions = 'You are not a member of this channel. Please join the channel first.';
                        break;
                    case 'channel_not_found':
                        suggestions = 'The specified channel does not exist or you do not have access to it.';
                        break;
                    case 'access_denied':
                        suggestions = 'You do not have permission to post messages to this channel. Check your channel permissions.';
                        break;
                    case 'account_inactive':
                        suggestions = 'Your Slack account or workspace is inactive.';
                        break;
                    case 'token_expired':
                        suggestions = 'Your authentication token has expired. Please reconnect the integration.';
                        break;
                    case 'restricted_action':
                        suggestions = 'Message posting is restricted in this channel. Contact your workspace admin.';
                        break;
                    default:
                        suggestions = 'Please check the channel ID and ensure you have access to post messages.';
                }
                if (suggestions) {
                    errorMessage += ` ${suggestions}`;
                }
                return this.createResponse(undefined, this.createError(types_1.IntegrationErrorCodes.API_ERROR, errorMessage, {
                    slackError: response.error,
                    suggestions,
                    errorType: response.error,
                    rawResponse: response.raw_json
                }));
            }
            // Success - return the message details
            return this.createResponse({
                messageId: response.ts || '',
                timestamp: response.ts || '',
            });
        }
        catch (error) {
            return this.createResponse(undefined, this.createError(types_1.IntegrationErrorCodes.API_ERROR, `Failed to send message: ${error.message}`));
        }
    }
    /**
     * Get user information by user ID
     */
    async getUserInfo(request, authContext) {
        try {
            const validatedRequest = types_1.IntegrationUtils.validateInput(types_2.GetUserInfoSchema, request);
            const response = await this.makeApiCall('/users.info', validatedRequest);
            if (!response.ok || !response.user) {
                return this.createResponse(undefined, this.createError(types_1.IntegrationErrorCodes.RESOURCE_NOT_FOUND, `User not found: ${response.error}`, { slackError: response.error }));
            }
            const standardUser = types_2.SlackTransformer.toStandardUser(response.user);
            return this.createResponse(standardUser);
        }
        catch (error) {
            return this.createResponse(undefined, this.createError(types_1.IntegrationErrorCodes.API_ERROR, `Failed to get user info: ${error.message}`));
        }
    }
    /**
     * Get list of users in the workspace
     */
    async getUsers(request = {}, authContext) {
        var _a;
        try {
            const validatedRequest = types_1.IntegrationUtils.validateInput(types_2.GetUsersSchema, request);
            const response = await this.makeApiCall('/users.list', validatedRequest);
            if (!response.ok || !response.members) {
                return this.createResponse(undefined, this.createError(types_1.IntegrationErrorCodes.API_ERROR, `Failed to fetch users: ${response.error}`, { slackError: response.error }));
            }
            const standardUsers = response.members.map((user) => types_2.SlackTransformer.toStandardUser(user));
            return this.createResponse({
                users: standardUsers,
                nextCursor: (_a = response.response_metadata) === null || _a === void 0 ? void 0 : _a.next_cursor,
            });
        }
        catch (error) {
            return this.createResponse(undefined, this.createError(types_1.IntegrationErrorCodes.API_ERROR, `Failed to fetch users: ${error.message}`));
        }
    }
    /**
     * Get list of channels in the workspace
     */
    async getChannels(request = {}, authContext) {
        var _a;
        try {
            const validatedRequest = types_1.IntegrationUtils.validateInput(types_2.GetChannelsSchema, request);
            console.log('Fetching channels with request:', validatedRequest);
            const response = await this.makeApiCall('/conversations.list', validatedRequest);
            console.log('Received channels response:', response);
            if (!response.ok || !response.channels) {
                return this.createResponse(undefined, this.createError(types_1.IntegrationErrorCodes.API_ERROR, `Failed to fetch channels: ${response.error}`, { slackError: response.error }));
            }
            const standardChannels = response.channels.map((channel) => types_2.SlackTransformer.toStandardChannel(channel));
            return this.createResponse({
                channels: standardChannels,
                nextCursor: (_a = response.response_metadata) === null || _a === void 0 ? void 0 : _a.next_cursor,
            });
        }
        catch (error) {
            return this.createResponse(undefined, this.createError(types_1.IntegrationErrorCodes.API_ERROR, `Failed to fetch channels: ${error.message}`));
        }
    }
    /**
     * Make API call to Slack using Nango for authentication
     */
    async makeApiCall(endpoint, data, method = 'POST') {
        var _a, _b, _c;
        if (!this.config) {
            throw new Error('Integration not initialized');
        }
        try {
            const response = await this.nango.proxy({
                endpoint,
                method,
                data,
                connectionId: this.config.nangoConnectionId,
                providerConfigKey: 'slack',
            });
            return response.data;
        }
        catch (error) {
            // Handle Nango-specific errors
            if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
                throw new Error('Authentication failed - token may be expired');
            }
            else if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 403) {
                throw new Error('Insufficient permissions');
            }
            else if (((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) === 429) {
                throw new Error('Rate limit exceeded');
            }
            throw new Error(`API call failed: ${error.message}`);
        }
    }
    getSupportedOperations() {
        return [
            'sendMessage',
            'getUserInfo',
            'getUsers',
            'getChannels',
            'testConnection',
        ];
    }
    getRequiredPermissions() {
        return [
            'channels:read',
            'chat:write',
            'users:read',
            'users:read.email',
        ];
    }
    getConfigurationFields() {
        return [
            {
                key: 'nangoConnectionId',
                label: 'Nango Connection ID',
                type: 'string',
                required: true,
                description: 'The connection ID from Nango for this Slack workspace',
            },
            {
                key: 'defaultChannel',
                label: 'Default Channel',
                type: 'string',
                required: false,
                description: 'Default channel for sending messages (optional)',
            },
        ];
    }
}
exports.SlackService = SlackService;
