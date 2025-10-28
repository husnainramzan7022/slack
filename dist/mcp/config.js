"use strict";
/**
 * MCP Configuration Manager
 * Handles loading and validation of MCP server configurations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpConfig = exports.MCPConfigManager = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const registry_1 = require("./registry");
/**
 * MCP Configuration Manager
 */
class MCPConfigManager {
    constructor(configPath) {
        this.config = null;
        this.configPath = configPath || this.getDefaultConfigPath();
    }
    /**
     * Get singleton instance
     */
    static getInstance(configPath) {
        if (!MCPConfigManager.instance) {
            MCPConfigManager.instance = new MCPConfigManager(configPath);
        }
        return MCPConfigManager.instance;
    }
    /**
     * Get default configuration file path
     */
    getDefaultConfigPath() {
        // Try multiple possible locations
        const possiblePaths = [
            process.env.MCP_CONFIG_PATH,
            path_1.default.join(process.cwd(), 'mcp', 'config.json'),
            path_1.default.join(process.cwd(), 'mcp.config.json'),
            path_1.default.join(__dirname, 'config.json'),
        ].filter(Boolean);
        for (const configPath of possiblePaths) {
            if (fs_1.default.existsSync(configPath)) {
                return configPath;
            }
        }
        // Return default path even if it doesn't exist
        return path_1.default.join(process.cwd(), 'mcp', 'config.json');
    }
    /**
     * Load configuration from file
     */
    async loadConfig() {
        if (this.config) {
            return this.config;
        }
        try {
            if (!fs_1.default.existsSync(this.configPath)) {
                console.warn(`[MCP Config] Configuration file not found at ${this.configPath}, using defaults`);
                this.config = this.getDefaultConfig();
                return this.config;
            }
            const configContent = fs_1.default.readFileSync(this.configPath, 'utf-8');
            const parsedConfig = JSON.parse(configContent);
            // Validate and merge with defaults
            this.config = this.validateAndMergeConfig(parsedConfig);
            console.log(`[MCP Config] Configuration loaded from ${this.configPath}`);
            return this.config;
        }
        catch (error) {
            console.error(`[MCP Config] Failed to load configuration: ${error}`);
            console.log('[MCP Config] Using default configuration');
            this.config = this.getDefaultConfig();
            return this.config;
        }
    }
    /**
     * Get default configuration
     */
    getDefaultConfig() {
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
    validateAndMergeConfig(config) {
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
    async getServerConfigurations() {
        const config = await this.loadConfig();
        const serverConfigs = [];
        for (const [serverId, serverConfig] of Object.entries(config.servers)) {
            if (serverConfig.enabled) {
                let serverType;
                switch (serverConfig.type.toLowerCase()) {
                    case 'slack':
                        serverType = registry_1.MCPServerType.SLACK;
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
    getConfig() {
        return this.config;
    }
    /**
     * Update configuration
     */
    async updateConfig(updates) {
        const currentConfig = await this.loadConfig();
        this.config = this.validateAndMergeConfig({ ...currentConfig, ...updates });
        // Save to file if path exists and is writable
        try {
            const configDir = path_1.default.dirname(this.configPath);
            if (!fs_1.default.existsSync(configDir)) {
                fs_1.default.mkdirSync(configDir, { recursive: true });
            }
            fs_1.default.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
            console.log(`[MCP Config] Configuration updated and saved to ${this.configPath}`);
        }
        catch (error) {
            console.error(`[MCP Config] Failed to save configuration: ${error}`);
        }
    }
    /**
     * Reload configuration from file
     */
    async reloadConfig() {
        this.config = null;
        return await this.loadConfig();
    }
    /**
     * Get configuration for specific server
     */
    async getServerConfig(serverId) {
        const config = await this.loadConfig();
        return config.servers[serverId] || null;
    }
    /**
     * Enable/disable a server
     */
    async toggleServer(serverId, enabled) {
        const config = await this.loadConfig();
        if (config.servers[serverId]) {
            config.servers[serverId].enabled = enabled;
            await this.updateConfig(config);
        }
    }
    /**
     * Get environment-specific configuration
     */
    getEnvironmentConfig() {
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
exports.MCPConfigManager = MCPConfigManager;
/**
 * Export singleton instance
 */
exports.mcpConfig = MCPConfigManager.getInstance();
