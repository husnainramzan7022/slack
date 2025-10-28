/**
 * Real MCP Tool Execution Test
 * Tests actual MCP tools with your Slack connection
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testMCPTools() {
  console.log('🚀 Testing Slack MCP Tools with Real Connection...\n');

  try {
    // Import the built MCP modules
    const { aiBrainMCP } = require('./dist/mcp/index.js');
    
    console.log('1️⃣ Initializing MCP interface...');
    await aiBrainMCP.initialize();
    console.log('   ✅ MCP interface initialized\n');

    // Test 1: Get available tools
    console.log('2️⃣ Getting available tools...');
    const tools = await aiBrainMCP.getAvailableTools();
    console.log(`   ✅ Found ${tools.length} tools:`);
    tools.forEach(tool => {
      console.log(`      • ${tool.toolName}: ${tool.toolDescription}`);
    });
    console.log('');

    // Get connection ID from environment
    const connectionId = process.env.SLACK_DEFAULT_CONNECTION_ID;
    console.log(`   Using connection ID: ${connectionId ? connectionId.substring(0, 8) + '...' : 'None set'}`);
    
    if (!connectionId) {
      console.log('   ⚠️  No connection ID available, skipping Slack API tests');
      console.log('   Set SLACK_DEFAULT_CONNECTION_ID in .env.local to test with real Slack connection');
      return;
    }

    // Test 2: Health check
    console.log('3️⃣ Running health check...');
    const health = await aiBrainMCP.executeTool(
      'slack-mcp',
      'slack_health_check',
      { connectionId }
    );
    console.log('   Health Check Result:', health);
    console.log('');

    // Test 3: Get channels (limited to avoid spam)
    console.log('4️⃣ Getting Slack channels...');
    const channels = await aiBrainMCP.executeTool(
      'slack-mcp',
      'slack_get_channels',
      { connectionId, limit: 5 }
    );
    console.log('   Channels Result:', channels);
    console.log('');

    // Test 4: AI message parsing (won't send, just parse)
    console.log('5️⃣ Testing AI command parsing...');
    const testCommands = [
      'send hello world to the general channel',
      'message @john about the meeting',
      'tell the team good morning in #announcements'
    ];

    for (const command of testCommands) {
      console.log(`   Testing: "${command}"`);
      const result = await aiBrainMCP.executeTool(
        'slack-mcp',
        'slack_ai_message',
        { connectionId, command }
      );
      console.log('   Result:', result);
      console.log('');
    }

    console.log('✅ All MCP tool tests completed successfully!');
    
  } catch (error) {
    console.error('❌ MCP tool test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  testMCPTools().catch(console.error);
}

module.exports = { testMCPTools };