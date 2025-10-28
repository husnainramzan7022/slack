# Slack MCP Server for Pario Integration System

This is a Model Context Protocol (MCP) server implementation for Slack integration using Nango for OAuth management. It provides AI workflows and the AI Brain with structured access to Slack functionality.

## Features

### 🚀 Core Tools
- **slack_send_message**: Send messages to channels or users
- **slack_get_channels**: List all channels in workspace  
- **slack_get_users**: List all users in workspace
- **slack_get_user_info**: Get detailed user information
- **slack_health_check**: Check integration connectivity
- **slack_ai_message**: Natural language command parsing

### 🧠 AI-Powered Features
- Natural language command processing
- Smart channel name mapping
- Intelligent error suggestions
- Context-aware messaging

### 🔒 Security & Authentication
- OAuth 2.0 via Nango
- Secure connection management
- Input validation and sanitization
- Rate limiting support

## Installation

The MCP server is already integrated into your Pario system. Dependencies are installed automatically:

```bash
npm install  # Installs @modelcontextprotocol/sdk and dependencies
```

## Configuration

### Environment Variables

Required in your `.env.local`:
```bash
# Required for MCP server
NANGO_SECRET_KEY=your-nango-secret-key

# Optional: Default Slack connection
SLACK_DEFAULT_CONNECTION_ID=your-default-connection-id
```

### MCP Configuration

The server uses `mcp/config.json` for configuration:

```json
{
  "servers": {
    "slack": {
      "enabled": true,
      "type": "slack",
      "name": "Slack Integration",
      "capabilities": [
        "messaging",
        "channel-management", 
        "user-management",
        "health-checking",
        "ai-commands"
      ]
    }
  }
}
```

## Usage

### 1. Starting the MCP Server

```bash
# Build and start the Slack MCP server
npm run mcp:build
npm run mcp:slack

# Or for development with auto-rebuild
npm run mcp:dev
```

### 2. AI Brain Integration

```typescript
import { aiBrainMCP } from './mcp';

// Initialize MCP interface
await aiBrainMCP.initialize();

// Get all available tools
const tools = await aiBrainMCP.getAvailableTools();

// Execute a tool
const result = await aiBrainMCP.executeTool(
  'slack-mcp', 
  'slack_send_message',
  {
    connectionId: 'your-connection-id',
    channel: '#general',
    text: 'Hello from AI Brain!'
  }
);
```

### 3. Tool Registry

```typescript
import { toolRegistry } from './mcp';

// Initialize registry
await toolRegistry.initialize();

// Search for tools
const messagingTools = toolRegistry.getToolsByCapability('messaging');

// Get tool details
const sendMessageTool = toolRegistry.getTool('slack-mcp', 'slack_send_message');
```

## Available Tools

### slack_send_message
Send messages to Slack channels or users.

**Parameters:**
- `connectionId` (optional): Nango connection ID
- `channel` (required): Channel ID, #channel-name, or @username  
- `text` (required): Message content
- `thread_ts` (optional): Reply to thread
- `username` (optional): Custom sender name
- `icon_emoji` (optional): Custom emoji icon

**Example:**
```json
{
  "channel": "#general",
  "text": "Hello team! 👋",
  "username": "AI Assistant",
  "icon_emoji": ":robot_face:"
}
```

### slack_get_channels
Retrieve workspace channels.

**Parameters:**
- `connectionId` (optional): Nango connection ID
- `limit` (optional): Max results (default: 100)
- `cursor` (optional): Pagination cursor
- `exclude_archived` (optional): Skip archived channels
- `types` (optional): Channel types to include

### slack_get_users  
Retrieve workspace users.

**Parameters:**
- `connectionId` (optional): Nango connection ID
- `limit` (optional): Max results (default: 100)
- `cursor` (optional): Pagination cursor
- `include_locale` (optional): Include locale info

### slack_get_user_info
Get detailed user information.

**Parameters:**
- `connectionId` (optional): Nango connection ID
- `user` (required): User ID or username
- `include_locale` (optional): Include locale info

### slack_health_check
Check integration connectivity and permissions.

**Parameters:**
- `connectionId` (optional): Nango connection ID

### slack_ai_message
Natural language command processing for messaging.

**Parameters:**
- `connectionId` (optional): Nango connection ID
- `command` (required): Natural language instruction

**Examples:**
- "send hello world to the general channel"
- "message @john about the meeting"
- "tell the team good morning in #announcements"

## AI Command Patterns

The `slack_ai_message` tool understands various natural language patterns:

### Channel Targeting
- "to #channel-name" → `#channel-name`
- "in the general channel" → `#general`  
- "to @username" → `@username`
- "message john" → `@john`

### Message Extraction
- "send 'hello world' to #general"
- "tell the team about the meeting"
- Quoted messages: "send \"Hello!\" to #random"

### Smart Suggestions
When commands fail, the AI provides helpful suggestions:
- Channel access issues
- Permission problems  
- Authentication errors
- Format corrections

## Integration with AI Brain

The MCP server provides a clean interface for AI Brain integration:

```typescript
// Import the AI Brain interface
import { aiBrainMCP } from './mcp';

// In your AI Brain workflow
class SlackWorkflow {
  async sendMessage(instruction: string) {
    // Use natural language processing
    return await aiBrainMCP.executeTool(
      'slack-mcp',
      'slack_ai_message', 
      { command: instruction }
    );
  }
  
  async getChannels() {
    return await aiBrainMCP.executeTool(
      'slack-mcp',
      'slack_get_channels',
      { limit: 50 }
    );
  }
}
```

## Error Handling

The MCP server provides detailed error information:

```typescript
{
  "content": [
    {
      "type": "text", 
      "text": "Failed to send message: Channel not found\n\nSuggestions: Check channel name and permissions"
    }
  ],
  "isError": true
}
```

Common error scenarios:
- **Authentication failed**: Token expired or invalid
- **Channel not found**: Invalid channel ID or no access
- **Insufficient permissions**: Missing required scopes
- **Rate limited**: Too many requests

## Development

### Building
```bash
npm run mcp:build  # Compile TypeScript
```

### Testing
```bash
# Test the server directly
node dist/mcp/slack/index.js

# Test with AI Brain integration
npm run test:mcp
```

### Adding New Tools

1. Add tool definition to `SlackMCPServer.getTools()`
2. Implement handler in `SlackMCPServer.executeTool()`
3. Update configuration in `mcp/config.json`
4. Rebuild: `npm run mcp:build`

## Architecture

```
mcp/
├── base.ts          # Base MCP server classes
├── config.ts        # Configuration management  
├── registry.ts      # Tool discovery and execution
├── index.ts         # Main exports for AI Brain
├── config.json      # Server configuration
└── slack/
    ├── server.ts    # Slack MCP implementation
    └── index.ts     # Server entry point
```

## Deployment

The MCP server runs as a standalone process that communicates via stdio:

```bash
# Production deployment
npm run mcp:build
node dist/mcp/slack/index.js
```

For integration with AI frameworks, the server exposes a Tool Registry that can be imported and used directly in your AI workflows.

## Contributing

1. Add new tools to the Slack server
2. Implement additional MCP servers (Discord, Notion, etc.)
3. Enhance AI command parsing
4. Improve error handling and suggestions

## License

Part of the Pario Integration System - see main project license.