"use strict";
/**
 * MCP Main Entry Point
 * Exports all MCP functionality for easy importing by AI Brain and workflows
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiBrainMCP = exports.AIBrainMCPInterface = exports.mcpConfig = exports.MCPConfigManager = exports.MCPServerType = exports.initializeMCPRegistry = exports.toolRegistry = exports.MCPToolRegistry = exports.createSlackMCPServer = exports.SlackMCPServer = exports.MCPUtils = exports.mcpRegistry = exports.MCPServerRegistry = exports.BaseMCPServer = void 0;
exports.initializeMCP = initializeMCP;
// Core MCP functionality
var base_1 = require("./base");
Object.defineProperty(exports, "BaseMCPServer", { enumerable: true, get: function () { return base_1.BaseMCPServer; } });
Object.defineProperty(exports, "MCPServerRegistry", { enumerable: true, get: function () { return base_1.MCPServerRegistry; } });
Object.defineProperty(exports, "mcpRegistry", { enumerable: true, get: function () { return base_1.mcpRegistry; } });
Object.defineProperty(exports, "MCPUtils", { enumerable: true, get: function () { return base_1.MCPUtils; } });
// Slack MCP server
var server_1 = require("./slack/server");
Object.defineProperty(exports, "SlackMCPServer", { enumerable: true, get: function () { return server_1.SlackMCPServer; } });
Object.defineProperty(exports, "createSlackMCPServer", { enumerable: true, get: function () { return server_1.createSlackMCPServer; } });
// Tool registry
var registry_1 = require("./registry");
Object.defineProperty(exports, "MCPToolRegistry", { enumerable: true, get: function () { return registry_1.MCPToolRegistry; } });
Object.defineProperty(exports, "toolRegistry", { enumerable: true, get: function () { return registry_1.toolRegistry; } });
Object.defineProperty(exports, "initializeMCPRegistry", { enumerable: true, get: function () { return registry_1.initializeMCPRegistry; } });
Object.defineProperty(exports, "MCPServerType", { enumerable: true, get: function () { return registry_1.MCPServerType; } });
// Configuration management
var config_1 = require("./config");
Object.defineProperty(exports, "MCPConfigManager", { enumerable: true, get: function () { return config_1.MCPConfigManager; } });
Object.defineProperty(exports, "mcpConfig", { enumerable: true, get: function () { return config_1.mcpConfig; } });
/**
 * Quick initialization function for AI Brain integration
 */
async function initializeMCP() {
    // Import at runtime to avoid circular dependencies
    const { mcpConfig } = await Promise.resolve().then(() => __importStar(require('./config')));
    const { initializeMCPRegistry } = await Promise.resolve().then(() => __importStar(require('./registry')));
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
class AIBrainMCPInterface {
    constructor() {
        this.registry = null;
        this.initialized = false;
    }
    /**
     * Initialize the MCP interface
     */
    async initialize() {
        if (this.initialized)
            return;
        const { registry } = await initializeMCP();
        this.registry = registry;
        this.initialized = true;
    }
    /**
     * Get all available tools for AI Brain
     */
    async getAvailableTools() {
        await this.initialize();
        return this.registry.getAllTools();
    }
    /**
     * Search for tools by query
     */
    async searchTools(query) {
        await this.initialize();
        return this.registry.searchTools(query);
    }
    /**
     * Execute a tool
     */
    async executeTool(serverId, toolName, args) {
        await this.initialize();
        return this.registry.executeTool(serverId, toolName, args);
    }
    /**
     * Get tool by name (for AI Brain tool resolution)
     */
    async getTool(serverId, toolName) {
        await this.initialize();
        return this.registry.getTool(serverId, toolName);
    }
    /**
     * Get tools by capability
     */
    async getToolsByCapability(capability) {
        await this.initialize();
        return this.registry.getToolsByCapability(capability);
    }
    /**
     * Health check all services
     */
    async healthCheck() {
        await this.initialize();
        return this.registry.healthCheckAll();
    }
    /**
     * Get registry information
     */
    async getRegistryInfo() {
        await this.initialize();
        return this.registry.getRegistryInfo();
    }
}
exports.AIBrainMCPInterface = AIBrainMCPInterface;
/**
 * Export singleton AI Brain interface
 */
exports.aiBrainMCP = new AIBrainMCPInterface();
