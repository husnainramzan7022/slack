import { Nango } from '@nangohq/node';
import {
  BaseIntegrationClass,
  IntegrationResponse,
  IntegrationHealthCheck,
  ConfigurationField,
  AuthContext,
} from '../common/base-integration';
import { IntegrationErrorCodes, IntegrationUtils } from '../common/types';
import {
  SlackConfig,
  SlackConfigSchema,
  SlackApiResponse,
  SlackUser,
  SlackChannel,
  SlackMessage,
  SlackTransformer,
  SendMessageRequest,
  SendMessageSchema,
  GetUsersRequest,
  GetUsersSchema,
  GetChannelsRequest,
  GetChannelsSchema,
  GetUserInfoRequest,
  GetUserInfoSchema,
} from './types';

/**
 * Slack Integration Service
 * Handles all Slack API operations using Nango for OAuth management
 */
export class SlackService extends BaseIntegrationClass {
  public readonly id = 'slack';
  public readonly name = 'Slack';
  public readonly description = 'Send messages, fetch users, and manage channels in Slack';
  public readonly version = '1.0.0';
  public readonly configSchema = SlackConfigSchema;

  private nango: Nango;
  private config?: SlackConfig;

  constructor(nangoSecretKey: string) {
    super();
    this.nango = new Nango({ secretKey: nangoSecretKey });
  }

  async initialize(config: SlackConfig): Promise<void> {
    try {
      this.config = IntegrationUtils.validateInput(this.configSchema, config);
      // Test the connection during initialization
      await this.testConnection();
    } catch (error) {
      throw new Error(`Failed to initialize Slack integration: ${(error as Error).message}`);
    }
  }

  async testConnection(): Promise<IntegrationHealthCheck> {
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
      const response = await this.makeApiCall<{ ok: boolean; user: SlackUser }>('/auth.test');
      
      if (response.ok) {
        checks.authentication = true;
        checks.apiAccess = true;
        
        // Test permissions by trying to list channels
        try {
          await this.makeApiCall('/conversations.list', { limit: 1 });
          checks.permissions = true;
        } catch (permError) {
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
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        checks,
        details: {
          error: (error as Error).message,
        },
      };
    }
  }

  /**
   * Send a message to a Slack channel or user
   */
 async sendMessage(
    request: SendMessageRequest,
    authContext: AuthContext
  ): Promise<IntegrationResponse<{ messageId: string; timestamp: string } | undefined>> {
    try {
      const validatedRequest = IntegrationUtils.validateInput(
        SendMessageSchema,
        request
      );



      if (!this.config) {
        throw new Error('Integration not initialized');
      }



      if (!this.config) {
        throw new Error('Integration not initialized');
      }

      // Use Nango's pre-built triggerAction for sending messages
      // This automatically handles authentication and sends as the connected user
      const response = await this.nango.triggerAction(
        'slack',
        this.config.nangoConnectionId,
        'send-message',
        {
          channel: validatedRequest.channel,
          text: validatedRequest.text,
        }
      ) as any;


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

        return this.createResponse(undefined, this.createError(
          IntegrationErrorCodes.API_ERROR,
          errorMessage,
          { 
            slackError: response.error,
            suggestions,
            errorType: response.error,
            rawResponse: response.raw_json
          }
        ));
      }

      // Success - return the message details
      return this.createResponse({
        messageId: response.ts || '',
        timestamp: response.ts || '',
      });
    } catch (error) {
      return this.createResponse(undefined, this.createError(
        IntegrationErrorCodes.API_ERROR,
        `Failed to send message: ${(error as Error).message}`
      ));
    }
  }

  /**
   * Get user information by user ID
   */
  async getUserInfo(
    request: GetUserInfoRequest,
    authContext: AuthContext
  ): Promise<IntegrationResponse<any | undefined>> {
    try {
      const validatedRequest = IntegrationUtils.validateInput(
        GetUserInfoSchema,
        request
      );

      const response = await this.makeApiCall<{ 
        ok: boolean; 
        user: SlackUser;
        error?: string;
      }>('/users.info', validatedRequest);

      if (!response.ok || !response.user) {
        return this.createResponse(undefined, this.createError(
          IntegrationErrorCodes.RESOURCE_NOT_FOUND,
          `User not found: ${response.error}`,
          { slackError: response.error }
        ));
      }

      const standardUser = SlackTransformer.toStandardUser(response.user);
      return this.createResponse(standardUser);
    } catch (error) {
      return this.createResponse(undefined, this.createError(
        IntegrationErrorCodes.API_ERROR,
        `Failed to get user info: ${(error as Error).message}`
      ));
    }
  }

  /**
   * Get list of users in the workspace
   */
  async getUsers(
    request: GetUsersRequest = {} as GetUsersRequest,
    authContext: AuthContext
  ): Promise<IntegrationResponse<{ users: any[]; nextCursor?: string } | undefined>> {
    try {
      const validatedRequest = IntegrationUtils.validateInput(
        GetUsersSchema,
        request
      );

      const response = await this.makeApiCall<{ 
        ok: boolean;
        members: SlackUser[];
        response_metadata?: { next_cursor?: string };
        error?: string;
      }>('/users.list', validatedRequest);

      if (!response.ok || !response.members) {
        return this.createResponse(undefined, this.createError(
          IntegrationErrorCodes.API_ERROR,
          `Failed to fetch users: ${response.error}`,
          { slackError: response.error }
        ));
      }

      const standardUsers = response.members.map((user: SlackUser) => 
        SlackTransformer.toStandardUser(user)
      );

      return this.createResponse({
        users: standardUsers,
        nextCursor: response.response_metadata?.next_cursor,
      });
    } catch (error) {
      return this.createResponse(undefined, this.createError(
        IntegrationErrorCodes.API_ERROR,
        `Failed to fetch users: ${(error as Error).message}`
      ));
    }
  }

  /**
   * Get list of channels in the workspace
   */
  async getChannels(
    request: GetChannelsRequest = {} as GetChannelsRequest,
    authContext: AuthContext
  ): Promise<IntegrationResponse<{ channels: any[]; nextCursor?: string } | undefined>> {
    try {

      const validatedRequest = IntegrationUtils.validateInput(
        GetChannelsSchema,
        request
      );


      const response = await this.makeApiCall<{
        ok: boolean;
        channels: SlackChannel[];
        response_metadata?: { next_cursor?: string };
        error?: string;
      }>('/conversations.list', validatedRequest);

      if (!response.ok || !response.channels) {
        return this.createResponse(undefined, this.createError(
          IntegrationErrorCodes.API_ERROR,
          `Failed to fetch channels: ${response.error}`,
          { slackError: response.error }
        ));
      }

      const standardChannels = response.channels.map((channel: SlackChannel) =>
        SlackTransformer.toStandardChannel(channel)
      );

      return this.createResponse({
        channels: standardChannels,
        nextCursor: response.response_metadata?.next_cursor,
      });
    } catch (error) {
      return this.createResponse(undefined, this.createError(
        IntegrationErrorCodes.API_ERROR,
        `Failed to fetch channels: ${(error as Error).message}`
      ));
    }
  }

  /**
   * Make API call to Slack using Nango for authentication
   */
  private async makeApiCall<T>(
    endpoint: string,
    data?: any,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<T> {
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

      return response.data as T;
    } catch (error: any) {
      // Handle Nango-specific errors
      if (error.response?.status === 401) {
        throw new Error('Authentication failed - token may be expired');
      } else if (error.response?.status === 403) {
        throw new Error('Insufficient permissions');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  protected getSupportedOperations(): string[] {
    return [
      'sendMessage',
      'getUserInfo',
      'getUsers',
      'getChannels',
      'testConnection',
    ];
  }

  protected getRequiredPermissions(): string[] {
    return [
      'channels:read',
      'chat:write',
      'users:read',
      'users:read.email',
    ];
  }

  protected getConfigurationFields(): ConfigurationField[] {
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