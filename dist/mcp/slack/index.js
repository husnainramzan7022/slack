#!/usr/bin/env node
"use strict";
/**
 * Slack MCP Server Entry Point
 * Starts the Slack MCP server for Model Context Protocol communication
 */
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const base_1 = require("../base");
async function main() {
    try {
        base_1.MCPUtils.log('slack-mcp', 'Starting Slack MCP Server...');
        // Create and start the server
        const server = (0, server_1.createSlackMCPServer)();
        await server.start();
        base_1.MCPUtils.log('slack-mcp', 'Slack MCP Server is running and ready for connections');
        // Handle graceful shutdown
        process.on('SIGINT', () => {
            base_1.MCPUtils.log('slack-mcp', 'Received SIGINT, shutting down gracefully...');
            process.exit(0);
        });
        process.on('SIGTERM', () => {
            base_1.MCPUtils.log('slack-mcp', 'Received SIGTERM, shutting down gracefully...');
            process.exit(0);
        });
    }
    catch (error) {
        base_1.MCPUtils.logError('slack-mcp', 'Failed to start server', error);
        process.exit(1);
    }
}
// Run the server
main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
