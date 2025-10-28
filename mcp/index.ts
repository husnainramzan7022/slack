/**
 * MCP Main Entry Point
 * Exports all MCP functionality for easy importing by AI Brain and workflows
 */

// Core MCP functionality
export { BaseMCPServer, MCPServerRegistry, mcpRegistry, MCPUtils } from './base';

// Slack MCP server
export { SlackMCPServer, createSlackMCPServer } from './slack/server';

// Tool registry
export { 
  MCPToolRegistry, 
  toolRegistry, 
  initializeMCPRegistry,
  MCPServerType 
} from './registry';

// Configuration management
export { 
  MCPConfigManager, 
  mcpConfig 
} from './config';

// Types
export type {
  MCPServerConfig,
  MCPTool,
  MCPToolContext,
  MCPToolResult,
} from './base';

export type {
  MCPServerFactoryConfig,
  ToolRegistryEntry,
} from './registry';

export type {
  MCPConfig,
  MCPServerConfig as ConfigServerConfig,
  MCPRegistryConfig,
  MCPLoggingConfig,
  MCPSecurityConfig,
  MCPDevelopmentConfig,
} from './config';

/**
 * Quick initialization function for AI Brain integration
 */
export async function initializeMCP(): Promise<{
  registry: any;
  config: any;
  stats: any;
}> {
  // Import at runtime to avoid circular dependencies
  const { mcpConfig } = await import('./config');
  const { initializeMCPRegistry } = await import('./registry');
  
  // Load configuration
  const config = await mcpConfig.loadConfig();
  
  // Get server configurations
  const serverConfigs = await mcpConfig.getServerConfigurations();
  
  // Initialize registry
  const registry = await initializeMCPRegistry(serverConfigs);
  
  // Get registry stats
  const stats = registry.getRegistryStats();
  
  console.log('[MCP] Initialization complete:', {
    servers: stats.totalServers,
    tools: stats.totalTools,
    serverTypes: Object.keys(stats.serversByType),
  });
  
  return {
    registry,
    config,
    stats,
  };
}

/**
 * AI Brain integration interface
 */
export class AIBrainMCPInterface {
  private registry: any = null;
  private initialized = false;

  /**
   * Initialize the MCP interface
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    const { registry } = await initializeMCP();
    this.registry = registry;
    this.initialized = true;
  }

  /**
   * Get all available tools for AI Brain
   */
  async getAvailableTools(): Promise<any[]> {
    await this.initialize();
    return this.registry!.getAllTools();
  }

  /**
   * Search for tools by query
   */
  async searchTools(query: string): Promise<any[]> {
    await this.initialize();
    return this.registry!.searchTools(query);
  }

  /**
   * Execute a tool
   */
  async executeTool(serverId: string, toolName: string, args: any): Promise<any> {
    await this.initialize();
    return this.registry!.executeTool(serverId, toolName, args);
  }

  /**
   * Get tool by name (for AI Brain tool resolution)
   */
  async getTool(serverId: string, toolName: string): Promise<any> {
    await this.initialize();
    return this.registry!.getTool(serverId, toolName);
  }

  /**
   * Get tools by capability
   */
  async getToolsByCapability(capability: string): Promise<any[]> {
    await this.initialize();
    return this.registry!.getToolsByCapability(capability);
  }

  /**
   * Health check all services
   */
  async healthCheck(): Promise<Record<string, any>> {
    await this.initialize();
    return this.registry!.healthCheckAll();
  }

  /**
   * Get registry information
   */
  async getRegistryInfo(): Promise<any> {
    await this.initialize();
    return this.registry!.getRegistryInfo();
  }
}

/**
 * Export singleton AI Brain interface
 */
export const aiBrainMCP = new AIBrainMCPInterface();