/**
 * MCP Tool Registry
 * Central registry for managing and discovering MCP servers
 * Used by AI Brain and workflows to access available integration tools
 */

import { mcpRegistry, BaseMCPServer, MCPServerConfig } from './base';
import { SlackMCPServer, createSlackMCPServer } from './slack/server';

/**
 * Available MCP server types
 */
export enum MCPServerType {
  SLACK = 'slack',
  // Add more as they're implemented
  // DISCORD = 'discord',
  // NOTION = 'notion',
  // GITHUB = 'github',
}

/**
 * MCP server factory configuration
 */
export interface MCPServerFactoryConfig {
  type: MCPServerType;
  config?: any;
  enabled?: boolean;
}

/**
 * Tool registry entry
 */
export interface ToolRegistryEntry {
  serverId: string;
  serverName: string;
  serverVersion: string;
  toolName: string;
  toolDescription: string;
  inputSchema: any;
  capabilities: string[];
  authentication: string;
}

/**
 * MCP Tool Registry - Main interface for AI Brain integration
 */
export class MCPToolRegistry {
  private static instance: MCPToolRegistry;
  private servers: Map<string, BaseMCPServer> = new Map();
  private tools: Map<string, ToolRegistryEntry> = new Map();
  private initialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): MCPToolRegistry {
    if (!MCPToolRegistry.instance) {
      MCPToolRegistry.instance = new MCPToolRegistry();
    }
    return MCPToolRegistry.instance;
  }

  /**
   * Initialize the registry with available servers
   */
  async initialize(serverConfigs: MCPServerFactoryConfig[] = []): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('[MCP Registry] Initializing tool registry...');

    // Default configurations if none provided
    if (serverConfigs.length === 0) {
      serverConfigs = await this.getDefaultConfigurations();
    }

    // Create and register servers
    for (const config of serverConfigs) {
      if (config.enabled !== false) {
        try {
          const server = await this.createServer(config);
          await this.registerServer(server);
          console.log(`[MCP Registry] Registered ${config.type} server`);
        } catch (error) {
          console.error(`[MCP Registry] Failed to register ${config.type} server:`, error);
        }
      }
    }

    // Build tool index
    await this.buildToolIndex();

    this.initialized = true;
    console.log(`[MCP Registry] Registry initialized with ${this.servers.size} servers and ${this.tools.size} tools`);
  }

  /**
   * Create a server instance based on configuration
   */
  private async createServer(config: MCPServerFactoryConfig): Promise<BaseMCPServer> {
    switch (config.type) {
      case MCPServerType.SLACK:
        return createSlackMCPServer(config.config);
      
      // Add more server types as they're implemented
      default:
        throw new Error(`Unknown server type: ${config.type}`);
    }
  }

  /**
   * Register a server with the registry
   */
  private async registerServer(server: BaseMCPServer): Promise<void> {
    const serverInfo = server.getServerInfo();
    this.servers.set(serverInfo.name, server);
    mcpRegistry.register(server, {
      name: serverInfo.name,
      version: serverInfo.version,
      description: serverInfo.description,
    });
  }

  /**
   * Build tool index from all registered servers
   */
  private async buildToolIndex(): Promise<void> {
    this.tools.clear();
// @ts-ignore
    for (const [serverId, server] of this.servers) {
      try {
        const serverInfo = server.getServerInfo();
        const tools = await (server as any).getTools(); // Access protected method

        for (const tool of tools) {
          const toolKey = `${serverId}.${tool.name}`;
          this.tools.set(toolKey, {
            serverId,
            serverName: serverInfo.name,
            serverVersion: serverInfo.version,
            toolName: tool.name,
            toolDescription: tool.description,
            inputSchema: tool.inputSchema,
            capabilities: Object.keys((serverInfo as any).capabilities || {}),
            authentication: (serverInfo as any).authentication || 'unknown',
          });
        }
      } catch (error) {
        console.error(`[MCP Registry] Failed to index tools for ${serverId}:`, error);
      }
    }
  }

  /**
   * Get default server configurations from environment
   */
  private async getDefaultConfigurations(): Promise<MCPServerFactoryConfig[]> {
    const configs: MCPServerFactoryConfig[] = [];

    // Slack server (if Nango key is available)
    if (process.env.NANGO_SECRET_KEY) {
      configs.push({
        type: MCPServerType.SLACK,
        enabled: true,
        config: {
          defaultConnectionId: process.env.SLACK_DEFAULT_CONNECTION_ID,
        },
      });
    }

    return configs;
  }

  /**
   * Get all available tools
   */
  getAllTools(): ToolRegistryEntry[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by server
   */
  getToolsByServer(serverId: string): ToolRegistryEntry[] {
    return this.getAllTools().filter(tool => tool.serverId === serverId);
  }

  /**
   * Get a specific tool
   */
  getTool(serverId: string, toolName: string): ToolRegistryEntry | undefined {
    return this.tools.get(`${serverId}.${toolName}`);
  }

  /**
   * Search tools by capability
   */
  getToolsByCapability(capability: string): ToolRegistryEntry[] {
    return this.getAllTools().filter(tool => 
      tool.capabilities.includes(capability)
    );
  }

  /**
   * Search tools by description or name
   */
  searchTools(query: string): ToolRegistryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTools().filter(tool =>
      tool.toolName.toLowerCase().includes(lowerQuery) ||
      tool.toolDescription.toLowerCase().includes(lowerQuery) ||
      tool.capabilities.some(cap => cap.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Execute a tool by registry key
   */
  async executeTool(
    serverId: string,
    toolName: string,
    args: any
  ): Promise<any> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server '${serverId}' not found in registry`);
    }

    const tool = this.getTool(serverId, toolName);
    if (!tool) {
      throw new Error(`Tool '${toolName}' not found in server '${serverId}'`);
    }

    // Execute the tool using the server's protected method
    return await (server as any).executeTool(toolName, args);
  }

  /**
   * Get registry statistics
   */
  getRegistryStats(): {
    totalServers: number;
    totalTools: number;
    serversByType: Record<string, number>;
    toolsByCapability: Record<string, number>;
  } {
    const serversByType: Record<string, number> = {};
    const toolsByCapability: Record<string, number> = {};

    // Count servers by type
    for (const serverId of Array.from(this.servers.keys())) {
      const type = serverId.replace('-mcp', ''); // Extract type from server ID
      serversByType[type] = (serversByType[type] || 0) + 1;
    }

    // Count tools by capability
    for (const tool of this.getAllTools()) {
      const capabilities = Array.isArray(tool.capabilities) ? tool.capabilities : [];
      for (const capability of capabilities) {
        toolsByCapability[capability] = (toolsByCapability[capability] || 0) + 1;
      }
    }

    return {
      totalServers: this.servers.size,
      totalTools: this.tools.size,
      serversByType,
      toolsByCapability,
    };
  }

  /**
   * Get detailed registry information for AI Brain
   */
  getRegistryInfo(): {
    initialized: boolean;
    stats: {
      totalServers: number;
      totalTools: number;
      serversByType: Record<string, number>;
      toolsByCapability: Record<string, number>;
    };
    servers: Array<{
      id: string;
      name: string;
      version: string;
      description: string;
      toolCount: number;
      capabilities: string[];
    }>;
    tools: ToolRegistryEntry[];
  } {
    const stats = this.getRegistryStats();
    
    const servers = Array.from(this.servers.entries()).map(([id, server]) => {
      const info = server.getServerInfo();
      const tools = this.getToolsByServer(id);
      
      return {
        id,
        name: info.name,
        version: info.version,
        description: info.description,
        toolCount: tools.length,
        capabilities: Array.from(new Set(tools.flatMap(t => Array.isArray(t.capabilities) ? t.capabilities : []))),
      };
    });

    return {
      initialized: this.initialized,
      stats,
      servers,
      tools: this.getAllTools(),
    };
  }

  /**
   * Health check for all servers
   */
  async healthCheckAll(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};

    const serverEntries = Array.from(this.servers.entries());
    
    for (const [serverId, server] of serverEntries) {
      try {
        // Try to execute health check if available
        const healthTool = this.getTool(serverId, `${serverId.replace('-mcp', '')}_health_check`);
        if (healthTool) {
          results[serverId] = await this.executeTool(serverId, healthTool.toolName, {});
        } else {
          results[serverId] = { status: 'unknown', message: 'No health check available' };
        }
      } catch (error) {
        results[serverId] = {
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return results;
  }

  /**
   * Reload registry (useful for development)
   */
  async reload(serverConfigs?: MCPServerFactoryConfig[]): Promise<void> {
    console.log('[MCP Registry] Reloading registry...');
    this.initialized = false;
    this.servers.clear();
    this.tools.clear();
    await this.initialize(serverConfigs);
  }
}

/**
 * Export singleton instance for AI Brain integration
 */
export const toolRegistry = MCPToolRegistry.getInstance();

/**
 * Helper function to initialize the registry
 */
export async function initializeMCPRegistry(configs?: MCPServerFactoryConfig[]): Promise<MCPToolRegistry> {
  await toolRegistry.initialize(configs);
  return toolRegistry;
}

/**
 * Export types for external use
 */
// Types are already exported above in the interface declarations