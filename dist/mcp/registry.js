"use strict";
/**
 * MCP Tool Registry
 * Central registry for managing and discovering MCP servers
 * Used by AI Brain and workflows to access available integration tools
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolRegistry = exports.MCPToolRegistry = exports.MCPServerType = void 0;
exports.initializeMCPRegistry = initializeMCPRegistry;
const base_1 = require("./base");
const server_1 = require("./slack/server");
/**
 * Available MCP server types
 */
var MCPServerType;
(function (MCPServerType) {
    MCPServerType["SLACK"] = "slack";
    // Add more as they're implemented
    // DISCORD = 'discord',
    // NOTION = 'notion',
    // GITHUB = 'github',
})(MCPServerType || (exports.MCPServerType = MCPServerType = {}));
/**
 * MCP Tool Registry - Main interface for AI Brain integration
 */
class MCPToolRegistry {
    constructor() {
        this.servers = new Map();
        this.tools = new Map();
        this.initialized = false;
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!MCPToolRegistry.instance) {
            MCPToolRegistry.instance = new MCPToolRegistry();
        }
        return MCPToolRegistry.instance;
    }
    /**
     * Initialize the registry with available servers
     */
    async initialize(serverConfigs = []) {
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
                }
                catch (error) {
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
    async createServer(config) {
        switch (config.type) {
            case MCPServerType.SLACK:
                return (0, server_1.createSlackMCPServer)(config.config);
            // Add more server types as they're implemented
            default:
                throw new Error(`Unknown server type: ${config.type}`);
        }
    }
    /**
     * Register a server with the registry
     */
    async registerServer(server) {
        const serverInfo = server.getServerInfo();
        this.servers.set(serverInfo.name, server);
        base_1.mcpRegistry.register(server, {
            name: serverInfo.name,
            version: serverInfo.version,
            description: serverInfo.description,
        });
    }
    /**
     * Build tool index from all registered servers
     */
    async buildToolIndex() {
        this.tools.clear();
        for (const [serverId, server] of this.servers) {
            try {
                const serverInfo = server.getServerInfo();
                const tools = await server.getTools(); // Access protected method
                for (const tool of tools) {
                    const toolKey = `${serverId}.${tool.name}`;
                    this.tools.set(toolKey, {
                        serverId,
                        serverName: serverInfo.name,
                        serverVersion: serverInfo.version,
                        toolName: tool.name,
                        toolDescription: tool.description,
                        inputSchema: tool.inputSchema,
                        capabilities: Object.keys(serverInfo.capabilities || {}),
                        authentication: serverInfo.authentication || 'unknown',
                    });
                }
            }
            catch (error) {
                console.error(`[MCP Registry] Failed to index tools for ${serverId}:`, error);
            }
        }
    }
    /**
     * Get default server configurations from environment
     */
    async getDefaultConfigurations() {
        const configs = [];
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
    getAllTools() {
        return Array.from(this.tools.values());
    }
    /**
     * Get tools by server
     */
    getToolsByServer(serverId) {
        return this.getAllTools().filter(tool => tool.serverId === serverId);
    }
    /**
     * Get a specific tool
     */
    getTool(serverId, toolName) {
        return this.tools.get(`${serverId}.${toolName}`);
    }
    /**
     * Search tools by capability
     */
    getToolsByCapability(capability) {
        return this.getAllTools().filter(tool => tool.capabilities.includes(capability));
    }
    /**
     * Search tools by description or name
     */
    searchTools(query) {
        const lowerQuery = query.toLowerCase();
        return this.getAllTools().filter(tool => tool.toolName.toLowerCase().includes(lowerQuery) ||
            tool.toolDescription.toLowerCase().includes(lowerQuery) ||
            tool.capabilities.some(cap => cap.toLowerCase().includes(lowerQuery)));
    }
    /**
     * Execute a tool by registry key
     */
    async executeTool(serverId, toolName, args) {
        const server = this.servers.get(serverId);
        if (!server) {
            throw new Error(`Server '${serverId}' not found in registry`);
        }
        const tool = this.getTool(serverId, toolName);
        if (!tool) {
            throw new Error(`Tool '${toolName}' not found in server '${serverId}'`);
        }
        // Execute the tool using the server's protected method
        return await server.executeTool(toolName, args);
    }
    /**
     * Get registry statistics
     */
    getRegistryStats() {
        const serversByType = {};
        const toolsByCapability = {};
        // Count servers by type
        for (const [serverId] of this.servers) {
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
    getRegistryInfo() {
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
    async healthCheckAll() {
        const results = {};
        const serverEntries = Array.from(this.servers.entries());
        for (const [serverId, server] of serverEntries) {
            try {
                // Try to execute health check if available
                const healthTool = this.getTool(serverId, `${serverId.replace('-mcp', '')}_health_check`);
                if (healthTool) {
                    results[serverId] = await this.executeTool(serverId, healthTool.toolName, {});
                }
                else {
                    results[serverId] = { status: 'unknown', message: 'No health check available' };
                }
            }
            catch (error) {
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
    async reload(serverConfigs) {
        console.log('[MCP Registry] Reloading registry...');
        this.initialized = false;
        this.servers.clear();
        this.tools.clear();
        await this.initialize(serverConfigs);
    }
}
exports.MCPToolRegistry = MCPToolRegistry;
/**
 * Export singleton instance for AI Brain integration
 */
exports.toolRegistry = MCPToolRegistry.getInstance();
/**
 * Helper function to initialize the registry
 */
async function initializeMCPRegistry(configs) {
    await exports.toolRegistry.initialize(configs);
    return exports.toolRegistry;
}
/**
 * Export types for external use
 */
// Types are already exported above in the interface declarations
