# Testing Guide for Slack MCP Server

## 🧪 How to Test the MCP Server

### Prerequisites

1. **Environment Setup**: Your `.env.local` file should have:
```bash
NANGO_SECRET_KEY=your-secret-key
# Optional: SLACK_DEFAULT_CONNECTION_ID=your-connection-id
```

2. **Slack Connection**: You need a Slack workspace connected via Nango OAuth

## 🔧 Testing Methods

### 1. **Quick Demo Test** (No Slack Connection Required)
Tests the MCP server structure and shows example output:

```bash
cd "C:\Users\lenovo\Desktop\Pario"
node mcp/examples.js
```

**What it tests:**
- MCP server initialization
- Tool discovery and registry 
- Natural language command parsing
- AI Brain integration patterns

**Expected Output:**
```
🎯 Slack MCP Server Integration Examples
🚀 Starting Slack AI Workflow Demo
✅ MCP interface would be initialized here
🏥 Health Check: { status: 'healthy', ... }
📋 Available Channels: [...]
📤 AI Message Command: {...}
```

### 2. **Build and Compile Test**
Tests TypeScript compilation:

```bash
npm run mcp:build
```

**What it tests:**
- TypeScript compilation
- Import/export resolution
- Type checking
- Dependency resolution

**Expected Output:**
```
> pario-integration-system@1.0.0 mcp:build
> tsc --project tsconfig.mcp.json
```
(No errors = success)

### 3. **MCP Server Standalone Test** 
Tests the actual MCP server process:

```bash
# First build
npm run mcp:build

# Then start the server
npm run mcp:slack
```

**What it tests:**
- MCP server startup
- Environment variable loading
- Nango SDK initialization
- Tool registration

**Expected Output:**
```
[MCP:slack-mcp] Slack MCP Server initialized
MCP Server 'slack-mcp' started successfully
Slack MCP Server is running and ready for connections
```

### 4. **Registry Integration Test**
Create a test file to test the AI Brain integration:

```javascript
// test-mcp.js
const { createSlackMCPServer } = require('./dist/mcp/slack/server.js');

async function testMCPServer() {
  try {
    console.log('🧪 Testing MCP Server Integration...');
    
    // Create server instance
    const server = createSlackMCPServer();
    console.log('✅ Server created successfully');
    
    // Get server info
    const info = server.getServerInfo();
    console.log('📊 Server Info:', info);
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMCPServer();
```

Run with: `node test-mcp.js`

### 5. **Real Slack Connection Test**
Test with actual Slack workspace (requires connection):

#### Step 1: Get Connection ID
1. Go to your Next.js app: `http://localhost:3000/integrations/slack`
2. Connect a Slack workspace via OAuth
3. Copy the connection ID from browser localStorage or network tab

#### Step 2: Update Environment
```bash
# Add to .env.local
SLACK_DEFAULT_CONNECTION_ID=your-actual-connection-id
```

#### Step 3: Test Tool Execution
Create a test script:

```javascript
// test-slack-tools.js
const { aiBrainMCP } = require('./dist/mcp/index.js');

async function testSlackTools() {
  try {
    console.log('🧪 Testing Slack MCP Tools...');
    
    // Initialize
    await aiBrainMCP.initialize();
    console.log('✅ MCP initialized');
    
    // Test health check
    const health = await aiBrainMCP.executeTool(
      'slack-mcp', 
      'slack_health_check', 
      {}
    );
    console.log('🏥 Health Check:', health);
    
    // Test get channels
    const channels = await aiBrainMCP.executeTool(
      'slack-mcp',
      'slack_get_channels',
      { limit: 5 }
    );
    console.log('📋 Channels:', channels);
    
    // Test AI message (will parse but not send without real connection)
    const aiMessage = await aiBrainMCP.executeTool(
      'slack-mcp',
      'slack_ai_message',
      { command: 'send hello world to the general channel' }
    );
    console.log('🤖 AI Message:', aiMessage);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSlackTools();
```

## 🛠️ Testing Commands Summary

```bash
# 1. Basic structure test
node mcp/examples.js

# 2. Build test
npm run mcp:build

# 3. Server startup test
npm run mcp:slack

# 4. Development test with rebuild
npm run mcp:dev

# 5. Full Next.js app test
npm run dev
# Then visit: http://localhost:3000/integrations/slack
```

## 🔍 What Each Test Validates

### ✅ **examples.js Test**
- MCP server architecture
- Tool definitions and descriptions  
- Natural language parsing logic
- AI Brain integration interface
- Error handling patterns

### ✅ **Build Test** 
- TypeScript compilation
- Import/export correctness
- Dependency resolution
- Type safety

### ✅ **Server Test**
- MCP protocol compliance
- Environment variable loading
- Nango SDK initialization
- Tool registration process

### ✅ **Integration Test**
- AI Brain interface functionality
- Tool discovery mechanism
- Registry system operation
- Configuration management

### ✅ **Real Connection Test**
- Actual Slack API calls
- OAuth token validation
- Permission verification
- Message sending capability

## 🐛 Troubleshooting

### Common Issues:

1. **"Cannot find module" errors**
   ```bash
   # Solution: Build first
   npm run mcp:build
   ```

2. **"NANGO_SECRET_KEY required" errors**
   ```bash
   # Solution: Check .env.local has the key
   echo $NANGO_SECRET_KEY  # Should show your key
   ```

3. **"Connection not found" errors**
   ```bash
   # Solution: Either set SLACK_DEFAULT_CONNECTION_ID or pass connectionId in tool calls
   ```

4. **TypeScript compilation errors**
   ```bash
   # Solution: Check tsconfig.mcp.json and fix import paths
   npm run type-check
   ```

## 📊 Success Indicators

### ✅ **Working MCP Server**
- No TypeScript compilation errors
- Server starts without errors
- Tools are registered successfully
- Health checks pass

### ✅ **Working Integration**
- AI Brain can discover tools
- Tool execution returns proper responses
- Error handling works correctly
- Natural language parsing functions

### ✅ **Working Slack Connection**
- OAuth flow completes successfully
- Channels and users can be fetched
- Messages can be sent
- Health checks report "healthy" status

## 🚀 Next Steps After Testing

1. **If tests pass**: Integrate with your AI Brain workflows
2. **If tests fail**: Check error messages and troubleshooting guide
3. **For production**: Set up proper connection ID management
4. **For extension**: Add more MCP servers (Discord, Notion, etc.)

## 📝 Testing Checklist

- [ ] Environment variables configured
- [ ] `npm run mcp:build` completes successfully
- [ ] `node mcp/examples.js` runs without errors
- [ ] `npm run mcp:slack` starts server successfully  
- [ ] Slack OAuth connection works in Next.js app
- [ ] Health check returns positive results
- [ ] Channel fetching works
- [ ] Message sending works (if connection available)
- [ ] AI Brain can import and use `aiBrainMCP`

Ready to test your MCP server! 🎯