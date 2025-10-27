/**
 * Frontend utilities for the Slack integration UI
 * These utilities handle common API interactions, error handling, and state management
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    integration: string;
    version: string;
  };
}

export interface SlackChannel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'direct' | 'group';
  memberCount?: number;
  metadata?: Record<string, any>;
}

export interface SlackUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  metadata?: Record<string, any>;
}

/**
 * API client for Slack integration endpoints
 */
export class SlackApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/integrations/slack') {
    this.baseUrl = baseUrl;
  }

  /**
   * Send a message to Slack
   */
  async sendMessage(params: {
    nangoConnectionId: string;
    channel: string;
    text: string;
    username?: string;
    icon_emoji?: string;
    thread_ts?: string;
  }): Promise<ApiResponse<{ messageId: string; timestamp: string }>> {
    return this.makeRequest('send-message', params);
  }

  /**
   * Get channels from Slack workspace
   */
  async getChannels(params: {
    nangoConnectionId: string;
    limit?: number;
    cursor?: string;
    exclude_archived?: boolean;
    types?: string;
  }): Promise<ApiResponse<{ channels: SlackChannel[]; nextCursor?: string }>> {
    return this.makeRequest('channels', params);
  }

  /**
   * Get users from Slack workspace
   */
  async getUsers(params: {
    nangoConnectionId: string;
    limit?: number;
    cursor?: string;
    include_locale?: boolean;
  }): Promise<ApiResponse<{ users: SlackUser[]; nextCursor?: string }>> {
    return this.makeRequest('users', params);
  }

  /**
   * Get specific user info
   */
  async getUserInfo(params: {
    nangoConnectionId: string;
    user: string;
    include_locale?: boolean;
  }): Promise<ApiResponse<SlackUser>> {
    return this.makeRequest('user-info', params);
  }

  /**
   * Check connection health
   */
  async checkHealth(params: {
    nangoConnectionId: string;
  }): Promise<ApiResponse<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    checks: {
      authentication: boolean;
      apiAccess: boolean;
      permissions: boolean;
    };
  }>> {
    return this.makeRequest('health', params);
  }

  /**
   * Make a request to the Slack API
   */
  private async makeRequest<T>(endpoint: string, params: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Slack API request failed (${endpoint}):`, error);
      throw error;
    }
  }
}

/**
 * Hook for managing Slack API interactions
 */
export function useSlackApi() {
  const client = new SlackApiClient();

  return {
    sendMessage: client.sendMessage.bind(client),
    getChannels: client.getChannels.bind(client),
    getUsers: client.getUsers.bind(client),
    getUserInfo: client.getUserInfo.bind(client),
    checkHealth: client.checkHealth.bind(client),
  };
}

/**
 * Error handling utilities
 */
export class SlackErrorHandler {
  static getErrorMessage(error: any): string {
    if (typeof error === 'string') return error;
    if (error?.error?.message) return error.error.message;
    if (error?.message) return error.message;
    return 'An unknown error occurred';
  }

  static getErrorCode(error: any): string {
    if (error?.error?.code) return error.error.code;
    return 'UNKNOWN_ERROR';
  }

  static isConnectionError(error: any): boolean {
    const code = this.getErrorCode(error);
    return ['AUTHENTICATION_FAILED', 'TOKEN_EXPIRED', 'INSUFFICIENT_PERMISSIONS'].includes(code);
  }

  static isNetworkError(error: any): boolean {
    return error instanceof TypeError && error.message.includes('fetch');
  }

  static shouldRetry(error: any): boolean {
    const code = this.getErrorCode(error);
    return ['RATE_LIMITED', 'SERVICE_UNAVAILABLE', 'API_ERROR'].includes(code);
  }
}

/**
 * Local storage utilities for connection management
 */
export class SlackStorageManager {
  private static CONNECTION_KEY = 'slack-connection-id';
  private static LAST_HEALTH_CHECK_KEY = 'slack-last-health-check';

  static saveConnectionId(connectionId: string): void {
    try {
      localStorage.setItem(this.CONNECTION_KEY, connectionId);
    } catch (error) {
      console.warn('Failed to save connection ID to localStorage:', error);
    }
  }

  static getConnectionId(): string | null {
    try {
      return localStorage.getItem(this.CONNECTION_KEY);
    } catch (error) {
      console.warn('Failed to retrieve connection ID from localStorage:', error);
      return null;
    }
  }

  static clearConnectionId(): void {
    try {
      localStorage.removeItem(this.CONNECTION_KEY);
    } catch (error) {
      console.warn('Failed to clear connection ID from localStorage:', error);
    }
  }

  static saveLastHealthCheck(timestamp: string): void {
    try {
      localStorage.setItem(this.LAST_HEALTH_CHECK_KEY, timestamp);
    } catch (error) {
      console.warn('Failed to save health check timestamp:', error);
    }
  }

  static getLastHealthCheck(): string | null {
    try {
      return localStorage.getItem(this.LAST_HEALTH_CHECK_KEY);
    } catch (error) {
      console.warn('Failed to retrieve health check timestamp:', error);
      return null;
    }
  }
}

/**
 * Validation utilities
 */
export class SlackValidator {
  static isValidConnectionId(connectionId: string): boolean {
    return typeof connectionId === 'string' && connectionId.trim().length > 0;
  }

  static isValidChannelId(channelId: string): boolean {
    const trimmed = channelId.trim();
    // Valid patterns: #channel-name, @username, C1234567890, D1234567890, G1234567890
    return /^[#@][\w-]+$|^[CDG][A-Z0-9]{8,}$/.test(trimmed);
  }

  static isValidMessage(message: string): boolean {
    const trimmed = message.trim();
    return trimmed.length > 0 && trimmed.length <= 4000;
  }

  static validateSendMessageParams(params: {
    nangoConnectionId: string;
    channel: string;
    text: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.isValidConnectionId(params.nangoConnectionId)) {
      errors.push('Invalid connection ID');
    }

    if (!this.isValidChannelId(params.channel)) {
      errors.push('Invalid channel ID format');
    }

    if (!this.isValidMessage(params.text)) {
      errors.push('Message must be between 1 and 4000 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Retry utility with exponential backoff
 */
export class RetryManager {
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      baseDelay?: number;
      maxDelay?: number;
      backoffFactor?: number;
      shouldRetry?: (error: any) => boolean;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      shouldRetry = SlackErrorHandler.shouldRetry,
    } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts || !shouldRetry(error)) {
          break;
        }

        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt - 1),
          maxDelay
        );

        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

/**
 * Development utilities
 */
export class DevUtils {
  static log(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Slack Integration] ${message}`, data || '');
    }
  }

  static warn(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Slack Integration] ${message}`, data || '');
    }
  }

  static error(message: string, error?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[Slack Integration] ${message}`, error || '');
    }
  }

  static mockApiResponse<T>(data: T, delay: number = 1000): Promise<ApiResponse<T>> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          success: true,
          data,
          meta: {
            timestamp: new Date().toISOString(),
            integration: 'slack',
            version: '1.0.0',
          },
        });
      }, delay);
    });
  }
}

// Export singleton instance
export const slackApi = new SlackApiClient();