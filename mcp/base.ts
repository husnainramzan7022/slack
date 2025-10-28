/**
 * Base MCP Server Types and Interfaces
 * Provides common types and utilities for MCP server implementations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
  CallToolRequest,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Base configuration for MCP servers
 */
export interface MCPServerConfig {
  name: string;
  version: string;
  description: string;
  capabilities?: {
    tools?: boolean;
    resources?: boolean;
    prompts?: boolean;
    notifications?: boolean;
  };
  environment?: Record<string, string>;
}

/**
 * Tool definition for MCP
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * Tool execution context
 */
export interface MCPToolContext {
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * Tool execution result
 */
export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

/**
 * Base MCP Server class with common functionality
 */
export abstract class BaseMCPServer {
  protected server: Server;
  protected config: MCPServerConfig;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.server = new Server(
      {
        name: config.name,
        version: config.version,
      },
      {
        capabilities: {
          tools: config.capabilities?.tools ? {} : undefined,
          resources: config.capabilities?.resources ? {} : undefined,
          prompts: config.capabilities?.prompts ? {} : undefined,
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Setup MCP server handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = await this.getTools();
      return { tools };
    });

    // Execute tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;
      
      try {
        const result = await this.executeTool(name, args || {});
        return {
          content: result.content,
          isError: result.isError,
        };
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });

    // Setup error handling
    this.server.onerror = (error: Error) => {
      console.error('[MCP Server Error]', error);
    };
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log(`MCP Server '${this.config.name}' started successfully`);
  }

  /**
   * Get available tools - to be implemented by subclasses
   */
  protected abstract getTools(): Promise<MCPTool[]>;

  /**
   * Execute a tool - to be implemented by subclasses
   */
  protected abstract executeTool(name: string, args: any): Promise<MCPToolResult>;

  /**
   * Create a successful tool result
   */
  protected createSuccessResult(message: string, data?: any): MCPToolResult {
    const text = data ? `${message}\n\n${JSON.stringify(data, null, 2)}` : message;
    return {
      content: [{ type: 'text', text }],
      isError: false,
    };
  }

  /**
   * Create an error tool result
   */
  protected createErrorResult(message: string, details?: any): MCPToolResult {
    const text = details ? `${message}\n\nDetails: ${JSON.stringify(details, null, 2)}` : message;
    return {
      content: [{ type: 'text', text }],
      isError: true,
    };
  }

  /**
   * Validate required arguments
   */
  protected validateArgs(args: any, required: string[]): void {
    const missing = required.filter(key => !(key in args) || args[key] === undefined || args[key] === null);
    if (missing.length > 0) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Missing required arguments: ${missing.join(', ')}`
      );
    }
  }

  /**
   * Get server information
   */
  getServerInfo(): {
    name: string;
    version: string;
    description: string;
    tools: string[];
  } {
    return {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      tools: [], // Will be populated by subclasses
    };
  }
}

/**
 * MCP Server registry for managing multiple servers
 */
export class MCPServerRegistry {
  private servers: Map<string, BaseMCPServer> = new Map();
  private configs: Map<string, MCPServerConfig> = new Map();

  /**
   * Register an MCP server
   */
  register(server: BaseMCPServer, config: MCPServerConfig): void {
    this.servers.set(config.name, server);
    this.configs.set(config.name, config);
  }

  /**
   * Get a registered server
   */
  getServer(name: string): BaseMCPServer | undefined {
    return this.servers.get(name);
  }

  /**
   * Get all registered servers
   */
  getAllServers(): Array<{ name: string; server: BaseMCPServer; config: MCPServerConfig }> {
    return Array.from(this.servers.entries()).map(([name, server]) => ({
      name,
      server,
      config: this.configs.get(name)!,
    }));
  }

  /**
   * Start all registered servers
   */
  async startAll(): Promise<void> {
    const startPromises = Array.from(this.servers.values()).map(server => server.start());
    await Promise.all(startPromises);
  }

  /**
   * Get registry information
   */
  getRegistryInfo(): {
    totalServers: number;
    servers: Array<{
      name: string;
      version: string;
      description: string;
      tools: string[];
    }>;
  } {
    const servers = this.getAllServers().map(({ server }) => server.getServerInfo());
    return {
      totalServers: this.servers.size,
      servers,
    };
  }
}

/**
 * Utility functions for MCP servers
 */
export class MCPUtils {
  /**
   * Format error for consistent error handling
   */
  static formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Validate environment variables
   */
  static validateEnvironment(required: string[]): Record<string, string> {
    const env: Record<string, string> = {};
    const missing: string[] = [];

    for (const key of required) {
      const value = process.env[key];
      if (!value) {
        missing.push(key);
      } else {
        env[key] = value;
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return env;
  }

  /**
   * Create standard tool schema
   */
  static createToolSchema(properties: Record<string, any>, required: string[] = []): any {
    return {
      type: 'object',
      properties,
      required,
    };
  }

  /**
   * Log MCP server events
   */
  static log(serverName: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [MCP:${serverName}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  /**
   * Log MCP server errors
   */
  static logError(serverName: string, message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [MCP:${serverName}] ERROR: ${message}`, error);
  }
}

// Export singleton registry
export const mcpRegistry = new MCPServerRegistry();