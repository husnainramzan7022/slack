/**
 * MCP Configuration Manager
 * Handles loading and validation of MCP server configurations
 */

import fs from 'fs';
import path from 'path';
import { MCPServerFactoryConfig, MCPServerType } from './registry';

/**
 * Configuration structure for MCP servers
 */
export interface MCPConfig {
  version: string;
  description: string;
  servers: Record<string, MCPServerConfig>;
  registry: MCPRegistryConfig;
  logging: MCPLoggingConfig;
  security: MCPSecurityConfig;
  development: MCPDevelopmentConfig;
}

export interface MCPServerConfig {
  enabled: boolean;
  type: string;
  name: string;
  description: string;
  config: any;
  capabilities: string[];
  tools: Array<{
    name: string;
    description: string;
    category: string;
    requiredParams: string[];
    optionalParams: string[];
    examples?: string[];
  }>;
}

export interface MCPRegistryConfig {
  autoDiscovery: boolean;
  healthCheckInterval: number;
  maxRetries: number;
  timeout: number;
}

export interface MCPLoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableMCPLogs: boolean;
  enableToolLogs: boolean;
  logFile: string | null;
}

export interface MCPSecurityConfig {
  validateInputs: boolean;
  sanitizeOutputs: boolean;
  rateLimiting: {
    enabled: boolean;
    maxRequestsPerMinute: number;
  };
}

export interface MCPDevelopmentConfig {
  hotReload: boolean;
  mockMode: boolean;
  debugMode: boolean;
}

/**
 * MCP Configuration Manager
 */
export class MCPConfigManager {
  private static instance: MCPConfigManager;
  private config: MCPConfig | null = null;
  private configPath: string;

  private constructor(configPath?: string) {
    this.configPath = configPath || this.getDefaultConfigPath();
  }

  /**
   * Get singleton instance
   */
  static getInstance(configPath?: string): MCPConfigManager {
    if (!MCPConfigManager.instance) {
      MCPConfigManager.instance = new MCPConfigManager(configPath);
    }
    return MCPConfigManager.instance;
  }

  /**
   * Get default configuration file path
   */
  private getDefaultConfigPath(): string {
    // Try multiple possible locations
    const possiblePaths = [
      process.env.MCP_CONFIG_PATH,
      path.join(process.cwd(), 'mcp', 'config.json'),
      path.join(process.cwd(), 'mcp.config.json'),
      path.join(__dirname, 'config.json'),
    ].filter(Boolean) as string[];

    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        return configPath;
      }
    }

    // Return default path even if it doesn't exist
    return path.join(process.cwd(), 'mcp', 'config.json');
  }

  /**
   * Load configuration from file
   */
  async loadConfig(): Promise<MCPConfig> {
    if (this.config) {
      return this.config;
    }

    try {
      if (!fs.existsSync(this.configPath)) {
        console.warn(`[MCP Config] Configuration file not found at ${this.configPath}, using defaults`);
        this.config = this.getDefaultConfig();
        return this.config;
      }

      const configContent = fs.readFileSync(this.configPath, 'utf-8');
      const parsedConfig = JSON.parse(configContent) as MCPConfig;
      
      // Validate and merge with defaults
      this.config = this.validateAndMergeConfig(parsedConfig);
      
      console.log(`[MCP Config] Configuration loaded from ${this.configPath}`);
      return this.config;
    } catch (error) {
      console.error(`[MCP Config] Failed to load configuration: ${error}`);
      console.log('[MCP Config] Using default configuration');
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): MCPConfig {
    return {
      version: '1.0.0',
      description: 'Default MCP Configuration',
      servers: {
        slack: {
          enabled: !!process.env.NANGO_SECRET_KEY,
          type: 'slack',
          name: 'Slack Integration',
          description: 'Send messages, manage channels, and interact with Slack workspaces',
          config: {
            defaultConnectionId: process.env.SLACK_DEFAULT_CONNECTION_ID || null,
            requiresAuthentication: true,
            authenticationProvider: 'nango',
          },
          capabilities: ['messaging', 'channel-management', 'user-management', 'health-checking', 'ai-commands'],
          tools: [],
        },
      },
      registry: {
        autoDiscovery: true,
        healthCheckInterval: 300000, // 5 minutes
        maxRetries: 3,
        timeout: 30000, // 30 seconds
      },
      logging: {
        level: 'info',
        enableMCPLogs: true,
        enableToolLogs: true,
        logFile: null,
      },
      security: {
        validateInputs: true,
        sanitizeOutputs: true,
        rateLimiting: {
          enabled: false,
          maxRequestsPerMinute: 60,
        },
      },
      development: {
        hotReload: false,
        mockMode: false,
        debugMode: process.env.NODE_ENV === 'development',
      },
    };
  }

  /**
   * Validate and merge configuration with defaults
   */
  private validateAndMergeConfig(config: Partial<MCPConfig>): MCPConfig {
    const defaultConfig = this.getDefaultConfig();
    
    return {
      version: config.version || defaultConfig.version,
      description: config.description || defaultConfig.description,
      servers: { ...defaultConfig.servers, ...config.servers },
      registry: { ...defaultConfig.registry, ...config.registry },
      logging: { ...defaultConfig.logging, ...config.logging },
      security: { ...defaultConfig.security, ...config.security },
      development: { ...defaultConfig.development, ...config.development },
    };
  }

  /**
   * Get server configurations for registry
   */
  async getServerConfigurations(): Promise<MCPServerFactoryConfig[]> {
    const config = await this.loadConfig();
    const serverConfigs: MCPServerFactoryConfig[] = [];

    for (const [serverId, serverConfig] of Object.entries(config.servers)) {
      if (serverConfig.enabled) {
        let serverType: MCPServerType;
        
        switch (serverConfig.type.toLowerCase()) {
          case 'slack':
            serverType = MCPServerType.SLACK;
            break;
          default:
            console.warn(`[MCP Config] Unknown server type: ${serverConfig.type}`);
            continue;
        }

        serverConfigs.push({
          type: serverType,
          enabled: serverConfig.enabled,
          config: serverConfig.config,
        });
      }
    }

    return serverConfigs;
  }

  /**
   * Get current configuration
   */
  getConfig(): MCPConfig | null {
    return this.config;
  }

  /**
   * Update configuration
   */
  async updateConfig(updates: Partial<MCPConfig>): Promise<void> {
    const currentConfig = await this.loadConfig();
    this.config = this.validateAndMergeConfig({ ...currentConfig, ...updates });
    
    // Save to file if path exists and is writable
    try {
      const configDir = path.dirname(this.configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      console.log(`[MCP Config] Configuration updated and saved to ${this.configPath}`);
    } catch (error) {
      console.error(`[MCP Config] Failed to save configuration: ${error}`);
    }
  }

  /**
   * Reload configuration from file
   */
  async reloadConfig(): Promise<MCPConfig> {
    this.config = null;
    return await this.loadConfig();
  }

  /**
   * Get configuration for specific server
   */
  async getServerConfig(serverId: string): Promise<MCPServerConfig | null> {
    const config = await this.loadConfig();
    return config.servers[serverId] || null;
  }

  /**
   * Enable/disable a server
   */
  async toggleServer(serverId: string, enabled: boolean): Promise<void> {
    const config = await this.loadConfig();
    if (config.servers[serverId]) {
      config.servers[serverId].enabled = enabled;
      await this.updateConfig(config);
    }
  }

  /**
   * Get environment-specific configuration
   */
  getEnvironmentConfig(): {
    isDevelopment: boolean;
    isProduction: boolean;
    debugMode: boolean;
    logLevel: string;
  } {
    const config = this.config || this.getDefaultConfig();
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      isDevelopment,
      isProduction,
      debugMode: config.development.debugMode || isDevelopment,
      logLevel: config.logging.level,
    };
  }
}

/**
 * Export singleton instance
 */
export const mcpConfig = MCPConfigManager.getInstance();