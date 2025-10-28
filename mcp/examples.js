/**
 * Example: AI Brain Integration with Slack MCP
 * Demonstrates how to use the MCP server in your AI workflows
 */

// This is how you would integrate the MCP server with your AI Brain
// Import the MCP interface (when built and available)
// import { aiBrainMCP, toolRegistry, initializeMCP } from './mcp';

/**
 * Example AI Brain Workflow using Slack MCP
 */
class SlackAIWorkflow {
  constructor() {
    this.initialized = false;
    this.mcpInterface = null;
  }

  /**
   * Initialize the MCP interface
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // This would initialize the MCP server connection
      // const { aiBrainMCP } = await import('./mcp');
      // await aiBrainMCP.initialize();
      // this.mcpInterface = aiBrainMCP;
      
      console.log('✅ MCP interface would be initialized here');
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize MCP interface:', error);
      throw error;
    }
  }

  /**
   * Send a message using natural language
   */
  async sendMessage(instruction) {
    await this.initialize();

    // Example: "send hello world to the general channel"
    const result = {
      instruction,
      parsedCommand: this.parseInstruction(instruction),
      status: 'would execute via MCP'
    };

    console.log('📤 AI Message Command:', result);
    return result;

    // Actual implementation would be:
    // return await this.mcpInterface.executeTool(
    //   'slack-mcp',
    //   'slack_ai_message',
    //   { command: instruction }
    // );
  }

  /**
   * Get available channels
   */
  async getChannels() {
    await this.initialize();

    const mockChannels = [
      { id: 'C1234', name: 'general', type: 'public' },
      { id: 'C5678', name: 'development', type: 'private' },
      { id: 'C9012', name: 'announcements', type: 'public' }
    ];

    console.log('📋 Available Channels:', mockChannels);
    return mockChannels;

    // Actual implementation would be:
    // return await this.mcpInterface.executeTool(
    //   'slack-mcp', 
    //   'slack_get_channels',
    //   { limit: 50 }
    // );
  }

  /**
   * Check health of Slack integration
   */
  async healthCheck() {
    await this.initialize();

    const mockHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        authentication: true,
        apiAccess: true,
        permissions: true
      }
    };

    console.log('🏥 Health Check:', mockHealth);
    return mockHealth;

    // Actual implementation would be:
    // return await this.mcpInterface.executeTool(
    //   'slack-mcp',
    //   'slack_health_check',
    //   {}
    // );
  }

  /**
   * Parse natural language instruction
   */
  parseInstruction(instruction) {
    const patterns = {
      channel: /#([a-zA-Z0-9\-_]+)|to ([a-zA-Z0-9\-_]+) channel/,
      user: /@([a-zA-Z0-9\-_.]+)|message ([a-zA-Z0-9\-_.]+)/,
      message: /send (?:"([^"]+)"|'([^']+)'|([^"'].+?)) (?:to|in|@)/
    };

    const result = {
      channel: null,
      user: null,
      message: null,
      action: 'send'
    };

    // Extract channel
    const channelMatch = instruction.match(patterns.channel);
    if (channelMatch) {
      result.channel = channelMatch[1] || channelMatch[2];
    }

    // Extract user
    const userMatch = instruction.match(patterns.user);
    if (userMatch) {
      result.user = userMatch[1] || userMatch[2];
    }

    // Extract message
    const messageMatch = instruction.match(patterns.message);
    if (messageMatch) {
      result.message = messageMatch[1] || messageMatch[2] || messageMatch[3];
    }

    return result;
  }

  /**
   * Demonstrate workflow capabilities
   */
  async demo() {
    console.log('🚀 Starting Slack AI Workflow Demo\n');

    try {
      // Initialize
      await this.initialize();

      // Health check
      await this.healthCheck();
      console.log('');

      // Get channels
      await this.getChannels();
      console.log('');

      // Send messages with different patterns
      const commands = [
        "send hello world to the general channel",
        "message @john about the meeting", 
        "tell the team 'Good morning!' in #announcements"
      ];

      for (const command of commands) {
        await this.sendMessage(command);
        console.log('');
      }

      console.log('✅ Demo completed successfully!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }
}

/**
 * Tool Registry Usage Example
 */
class MCPToolRegistryExample {
  static async demo() {
    console.log('🔧 MCP Tool Registry Demo\n');

    // Mock registry data (actual would come from MCP server)
    const mockTools = [
      {
        serverId: 'slack-mcp',
        serverName: 'Slack Integration',
        toolName: 'slack_send_message',
        toolDescription: 'Send a message to a Slack channel or user',
        capabilities: ['messaging'],
        authentication: 'nango-oauth'
      },
      {
        serverId: 'slack-mcp', 
        serverName: 'Slack Integration',
        toolName: 'slack_ai_message',
        toolDescription: 'Send a message using natural language command parsing',
        capabilities: ['messaging', 'ai-commands'],
        authentication: 'nango-oauth'
      }
    ];

    console.log('Available Tools:');
    mockTools.forEach(tool => {
      console.log(`  • ${tool.toolName}: ${tool.toolDescription}`);
      console.log(`    Capabilities: ${tool.capabilities.join(', ')}`);
      console.log(`    Authentication: ${tool.authentication}`);
      console.log('');
    });

    // Actual implementation would be:
    // const { toolRegistry } = await import('./mcp');
    // await toolRegistry.initialize();
    // const tools = toolRegistry.getAllTools();
    // const messagingTools = toolRegistry.getToolsByCapability('messaging');
  }
}

/**
 * Integration Points for AI Brain
 */
class AIBrainIntegrationPoints {
  static getIntegrationCode() {
    return `
// 1. Initialize MCP in your AI Brain startup
import { aiBrainMCP } from './mcp';
await aiBrainMCP.initialize();

// 2. Get available tools for dynamic discovery
const tools = await aiBrainMCP.getAvailableTools();
const slackTools = tools.filter(t => t.serverId === 'slack-mcp');

// 3. Execute tools in your AI workflows
async function sendSlackMessage(instruction) {
  return await aiBrainMCP.executeTool(
    'slack-mcp',
    'slack_ai_message', 
    { command: instruction }
  );
}

// 4. Search for relevant tools
const messagingTools = await aiBrainMCP.getToolsByCapability('messaging');
const channelTools = await aiBrainMCP.searchTools('channel');

// 5. Health monitoring
const health = await aiBrainMCP.healthCheck();
if (health['slack-mcp'].status !== 'healthy') {
  console.warn('Slack integration is unhealthy');
}
    `.trim();
  }

  static demo() {
    console.log('💡 AI Brain Integration Code:\n');
    console.log(this.getIntegrationCode());
    console.log('\n');
  }
}

// Run demos if called directly
async function runDemo() {
  console.log('🎯 Slack MCP Server Integration Examples\n');
  console.log('=' .repeat(50));
  console.log('');

  // Workflow demo
  const workflow = new SlackAIWorkflow();
  await workflow.demo();
  
  console.log('\n' + '='.repeat(50));
  console.log('');

  // Registry demo  
  await MCPToolRegistryExample.demo();
  
  console.log('='.repeat(50));
  console.log('');

  // Integration points
  AIBrainIntegrationPoints.demo();

  console.log('🎉 All demos completed!');
  console.log('\nNext steps:');
  console.log('1. Build MCP server: npm run mcp:build');
  console.log('2. Start MCP server: npm run mcp:slack');
  console.log('3. Import in AI Brain: import { aiBrainMCP } from "./mcp"');
  console.log('4. Use tools in workflows: await aiBrainMCP.executeTool(...)');
}

if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = {
  SlackAIWorkflow,
  MCPToolRegistryExample,
  AIBrainIntegrationPoints,
  runDemo
};