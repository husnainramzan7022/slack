import { z } from 'zod';

/**
 * Base interface that all integrations must implement
 * This provides a consistent structure for all MCP integrations
 */
export interface BaseIntegration {
  /** Unique identifier for the integration */
  id: string;
  /** Human-readable name */
  name: string;
  /** Integration description */
  description: string;
  /** Version of the integration */
  version: string;
  /** Whether the integration is currently enabled */
  enabled: boolean;
  /** Configuration schema for the integration */
  configSchema: z.ZodSchema<any>;
  /** Initialize the integration with configuration */
  initialize(config: any): Promise<void>;
  /** Test the integration connection */
  testConnection(): Promise<IntegrationHealthCheck>;
  /** Get integration metadata */
  getMetadata(): IntegrationMetadata;
}

/**
 * Standard response format for all integration API calls
 */
export interface IntegrationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: IntegrationError;
  meta?: {
    timestamp: string;
    requestId?: string;
    integration: string;
    version: string;
  };
}

/**
 * Standard error structure for integrations
 */
export interface IntegrationError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

/**
 * Health check response structure
 */
export interface IntegrationHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    authentication: boolean;
    apiAccess: boolean;
    permissions: boolean;
  };
  details?: Record<string, any>;
}

/**
 * Integration metadata structure
 */
export interface IntegrationMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  homepage?: string;
  documentation?: string;
  supportedOperations: string[];
  requiredPermissions: string[];
  configurationFields: ConfigurationField[];
}

/**
 * Configuration field definition
 */
export interface ConfigurationField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'password';
  required: boolean;
  description?: string;
  defaultValue?: any;
  options?: { label: string; value: any }[];
}

/**
 * OAuth configuration for integrations that support it
 */
export interface OAuthConfig {
  authUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  redirectUri: string;
}

/**
 * Authentication context passed to integration methods
 */
export interface AuthContext {
  userId: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
  metadata?: Record<string, any>;
}

/**
 * Base class that provides common functionality for all integrations
 */
export abstract class BaseIntegrationClass implements BaseIntegration {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract version: string;
  abstract configSchema: z.ZodSchema<any>;
  
  enabled: boolean = true;

  constructor() {
    // Common initialization logic
  }

  abstract initialize(config: any): Promise<void>;
  abstract testConnection(): Promise<IntegrationHealthCheck>;

  getMetadata(): IntegrationMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      version: this.version,
      author: 'Pario Integration System',
      supportedOperations: this.getSupportedOperations(),
      requiredPermissions: this.getRequiredPermissions(),
      configurationFields: this.getConfigurationFields(),
    };
  }

  protected abstract getSupportedOperations(): string[];
  protected abstract getRequiredPermissions(): string[];
  protected abstract getConfigurationFields(): ConfigurationField[];

  /**
   * Create a standardized response
   */
  protected createResponse<T>(
    data?: T,
    error?: IntegrationError
  ): IntegrationResponse<T> {
    return {
      success: !error,
      data: error ? undefined : data,
      error,
      meta: {
        timestamp: new Date().toISOString(),
        integration: this.id,
        version: this.version,
      },
    } as IntegrationResponse<T>;
  }

  /**
   * Create a standardized error
   */
  protected createError(
    code: string,
    message: string,
    details?: Record<string, any>
  ): IntegrationError {
    return {
      code,
      message,
      details,
      stack: process.env.NODE_ENV === 'development' ? new Error().stack : undefined,
    };
  }
}