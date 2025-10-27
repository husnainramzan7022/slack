import { z } from 'zod';

/**
 * Common validation schemas used across integrations
 */

// User ID validation
export const userIdSchema = z.string().min(1, 'User ID is required');

// Channel/Room ID validation
export const channelIdSchema = z.string().min(1, 'Channel ID is required');

// Message content validation
export const messageContentSchema = z.string().min(1, 'Message content is required').max(4000, 'Message too long');

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

// Common error codes
export const IntegrationErrorCodes = {
  // Authentication errors
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // API errors
  API_ERROR: 'API_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Validation errors
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Configuration errors
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  INTEGRATION_DISABLED: 'INTEGRATION_DISABLED',
} as const;

export type IntegrationErrorCode = keyof typeof IntegrationErrorCodes;

/**
 * Standard user representation across integrations
 */
export interface StandardUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  metadata?: Record<string, any>;
}

/**
 * Standard channel/room representation
 */
export interface StandardChannel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'direct' | 'group';
  memberCount?: number;
  metadata?: Record<string, any>;
}

/**
 * Standard message representation
 */
export interface StandardMessage {
  id: string;
  content: string;
  sender: StandardUser;
  channel: StandardChannel;
  timestamp: string;
  type?: 'text' | 'file' | 'image' | 'system';
  attachments?: MessageAttachment[];
  metadata?: Record<string, any>;
}

/**
 * Message attachment structure
 */
export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size?: number;
  metadata?: Record<string, any>;
}

/**
 * Utility functions for common operations
 */
export class IntegrationUtils {
  /**
   * Validate and sanitize input data
   */
  static validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Generate a unique request ID
   */
  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay execution for rate limiting
   */
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry logic with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      baseDelay?: number;
      maxDelay?: number;
      backoffFactor?: number;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          break;
        }

        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt - 1),
          maxDelay
        );
        
        await this.delay(delay);
      }
    }

    throw lastError!;
  }
}