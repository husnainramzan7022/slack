"use strict";
/**
 * Base MCP Server Types and Interfaces
 * Provides common types and utilities for MCP server implementations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpRegistry = exports.MCPUtils = exports.MCPServerRegistry = exports.BaseMCPServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
/**
 * Base MCP Server class with common functionality
 */
class BaseMCPServer {
    constructor(config) {
        var _a, _b, _c;
        this.config = config;
        this.server = new index_js_1.Server({
            name: config.name,
            version: config.version,
        }, {
            capabilities: {
                tools: ((_a = config.capabilities) === null || _a === void 0 ? void 0 : _a.tools) ? {} : undefined,
                resources: ((_b = config.capabilities) === null || _b === void 0 ? void 0 : _b.resources) ? {} : undefined,
                prompts: ((_c = config.capabilities) === null || _c === void 0 ? void 0 : _c.prompts) ? {} : undefined,
            },
        });
        this.setupHandlers();
    }
    /**
     * Setup MCP server handlers
     */
    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            const tools = await this.getTools();
            return { tools };
        });
        // Execute tool calls
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                const result = await this.executeTool(name, args || {});
                return {
                    content: result.content,
                    isError: result.isError,
                };
            }
            catch (error) {
                if (error instanceof types_js_1.McpError) {
                    throw error;
                }
                throw new types_js_1.McpError(types_js_1.ErrorCode.InternalError, `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        });
        // Setup error handling
        this.server.onerror = (error) => {
            console.error('[MCP Server Error]', error);
        };
    }
    /**
     * Start the MCP server
     */
    async start() {
        const transport = new stdio_js_1.StdioServerTransport();
        await this.server.connect(transport);
        console.log(`MCP Server '${this.config.name}' started successfully`);
    }
    /**
     * Create a successful tool result
     */
    createSuccessResult(message, data) {
        const text = data ? `${message}\n\n${JSON.stringify(data, null, 2)}` : message;
        return {
            content: [{ type: 'text', text }],
            isError: false,
        };
    }
    /**
     * Create an error tool result
     */
    createErrorResult(message, details) {
        const text = details ? `${message}\n\nDetails: ${JSON.stringify(details, null, 2)}` : message;
        return {
            content: [{ type: 'text', text }],
            isError: true,
        };
    }
    /**
     * Validate required arguments
     */
    validateArgs(args, required) {
        const missing = required.filter(key => !(key in args) || args[key] === undefined || args[key] === null);
        if (missing.length > 0) {
            throw new types_js_1.McpError(types_js_1.ErrorCode.InvalidParams, `Missing required arguments: ${missing.join(', ')}`);
        }
    }
    /**
     * Get server information
     */
    getServerInfo() {
        return {
            name: this.config.name,
            version: this.config.version,
            description: this.config.description,
            tools: [], // Will be populated by subclasses
        };
    }
}
exports.BaseMCPServer = BaseMCPServer;
/**
 * MCP Server registry for managing multiple servers
 */
class MCPServerRegistry {
    constructor() {
        this.servers = new Map();
        this.configs = new Map();
    }
    /**
     * Register an MCP server
     */
    register(server, config) {
        this.servers.set(config.name, server);
        this.configs.set(config.name, config);
    }
    /**
     * Get a registered server
     */
    getServer(name) {
        return this.servers.get(name);
    }
    /**
     * Get all registered servers
     */
    getAllServers() {
        return Array.from(this.servers.entries()).map(([name, server]) => ({
            name,
            server,
            config: this.configs.get(name),
        }));
    }
    /**
     * Start all registered servers
     */
    async startAll() {
        const startPromises = Array.from(this.servers.values()).map(server => server.start());
        await Promise.all(startPromises);
    }
    /**
     * Get registry information
     */
    getRegistryInfo() {
        const servers = this.getAllServers().map(({ server }) => server.getServerInfo());
        return {
            totalServers: this.servers.size,
            servers,
        };
    }
}
exports.MCPServerRegistry = MCPServerRegistry;
/**
 * Utility functions for MCP servers
 */
class MCPUtils {
    /**
     * Format error for consistent error handling
     */
    static formatError(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
    /**
     * Validate environment variables
     */
    static validateEnvironment(required) {
        const env = {};
        const missing = [];
        for (const key of required) {
            const value = process.env[key];
            if (!value) {
                missing.push(key);
            }
            else {
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
    static createToolSchema(properties, required = []) {
        return {
            type: 'object',
            properties,
            required,
        };
    }
    /**
     * Log MCP server events
     */
    static log(serverName, message, data) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [MCP:${serverName}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
    /**
     * Log MCP server errors
     */
    static logError(serverName, message, error) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [MCP:${serverName}] ERROR: ${message}`, error);
    }
}
exports.MCPUtils = MCPUtils;
// Export singleton registry
exports.mcpRegistry = new MCPServerRegistry();
