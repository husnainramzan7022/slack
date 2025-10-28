#!/usr/bin/env node
/**
 * Quick start script for Slack MCP Server
 * Demonstrates basic usage and testing
 */

const { aiBrainMCP } = require('./dist/mcp/index.js');

async function demo() {
  console.log('🚀 Starting Slack MCP Server Demo...\n');

  try {
    // Initialize the MCP interface
    console.log('Initializing MCP interface...');
    await aiBrainMCP.initialize();
    console.log('✅ MCP interface initialized\n');

    // Get available tools
    console.log('Available tools:');
    const tools = await aiBrainMCP.getAvailableTools();
    tools.forEach(tool => {
      console.log(`  • ${tool.toolName}: ${tool.toolDescription}`);
    });
    console.log('');

    // Get registry information
    console.log('Registry information:');
    const info = await aiBrainMCP.getRegistryInfo();
    console.log(`  • Servers: ${info.stats.totalServers}`);
    console.log(`  • Tools: ${info.stats.totalTools}`);
    console.log(`  • Capabilities: ${Object.keys(info.stats.toolsByCapability).join(', ')}`);
    console.log('');

    // Health check
    console.log('Running health checks...');
    const health = await aiBrainMCP.healthCheck();
    Object.entries(health).forEach(([server, status]) => {
      console.log(`  • ${server}: ${typeof status === 'object' ? JSON.stringify(status) : status}`);
    });
    console.log('');

    console.log('✅ Demo completed successfully!');
    console.log('\nTo use the MCP server:');
    console.log('1. Import: const { aiBrainMCP } = require("./mcp");');
    console.log('2. Initialize: await aiBrainMCP.initialize();');
    console.log('3. Execute tools: await aiBrainMCP.executeTool("slack-mcp", "slack_send_message", {...});');

  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    if (error.message.includes('NANGO_SECRET_KEY')) {
      console.log('\n💡 Make sure NANGO_SECRET_KEY is set in your .env.local file');
    }
  }
}

if (require.main === module) {
  demo().catch(console.error);
}

module.exports = { demo };