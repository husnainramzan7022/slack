#!/usr/bin/env node

/**
 * Slack MCP Server Entry Point
 * Starts the Slack MCP server for Model Context Protocol communication
 */

import { createSlackMCPServer } from './server';
import { MCPUtils } from '../base';

async function main() {
  try {
    MCPUtils.log('slack-mcp', 'Starting Slack MCP Server...');

    // Create and start the server
    const server = createSlackMCPServer();
    await server.start();

    MCPUtils.log('slack-mcp', 'Slack MCP Server is running and ready for connections');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      MCPUtils.log('slack-mcp', 'Received SIGINT, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      MCPUtils.log('slack-mcp', 'Received SIGTERM, shutting down gracefully...');
      process.exit(0);
    });

  } catch (error) {
    MCPUtils.logError('slack-mcp', 'Failed to start server', error);
    process.exit(1);
  }
}

// Run the server
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});