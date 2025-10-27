# Pario - Slack MCP Integration

## 🚀 Quick Start

A complete Slack integration with beautiful UI for managing connections, sending messages, and monitoring health status.

### Features
- **OAuth Integration**: Seamless Slack workspace connection via Nango
- **Message Management**: Send messages to channels with rich UI
- **Health Monitoring**: Real-time connection status and health checks  
- **Developer-Friendly**: Modular components and comprehensive error handling
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

### Screenshots

#### Home Dashboard
Clean overview with integration status and quick access buttons.

#### Slack Integration Page  
Two-panel layout with connection management and message sending interface.

## 🏃‍♂️ Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   # .env.local
   NANGO_SECRET_KEY=your_nango_secret_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Navigate to Slack integration**:
   ```
   http://localhost:3000/integrations/slack
   ```

## 📋 Testing Checklist

### Quick Verification
- [ ] Home page loads correctly
- [ ] Slack integration page accessible
- [ ] OAuth "Connect with Slack" button works
- [ ] Manual connection ID input functions
- [ ] Connection status updates properly
- [ ] Channel dropdown populates
- [ ] Message sending works
- [ ] Error alerts display correctly

### Detailed Testing
See `TESTING_GUIDE.md` for comprehensive testing procedures.

## 🎨 UI Components

### Available Components
- **UI Components**: Button, Input, Textarea, Select, Alert, LoadingSpinner, Card
- **Slack Components**: ConnectButton, ConnectionStatus, SendMessageForm
- **Pages**: Home dashboard, Slack integration interface

### Key Features
- **TailwindCSS**: Custom design system with Slack branding
- **TypeScript**: Full type safety throughout
- **Error Handling**: Comprehensive error management with user-friendly messages
- **Loading States**: Visual feedback for all async operations
- **Responsive**: Mobile-first design that works everywhere

## 📚 Documentation

### Available Guides
- **`FRONTEND_DOCS.md`**: Complete UI component documentation and customization guide
- **`TESTING_GUIDE.md`**: Comprehensive testing procedures and checklists
- **`README.md`**: This overview and quick start guide

### API Integration
The frontend connects to your existing Slack MCP backend at:
- `/api/integrations/slack/connect` - OAuth connection
- `/api/integrations/slack/health` - Connection health checks
- `/api/integrations/slack/channels` - Channel list retrieval
- `/api/integrations/slack/send-message` - Message sending

## 🔧 Customization

### Adding New Features
1. Create components in `components/slack/`
2. Add API calls using utilities in `lib/slack-utils.ts`
3. Update main page at `app/integrations/slack/page.tsx`

### Styling
- Customize colors in `tailwind.config.js`
- Add component styles in `app/globals.css`
- Use existing design tokens for consistency

### New Integrations
Follow the Slack pattern:
1. Create `components/[service]/` directory
2. Add page at `app/integrations/[service]/page.tsx`
3. Create utilities at `lib/[service]-utils.ts`
4. Update home page with new integration card

## 🎯 What's Included

### Complete UI System
- ✅ Modern React components with TypeScript
- ✅ TailwindCSS design system
- ✅ Slack OAuth integration flow
- ✅ Message sending interface
- ✅ Connection health monitoring
- ✅ Error handling and retry logic
- ✅ Loading states and visual feedback
- ✅ Responsive mobile-friendly design
- ✅ Developer documentation
- ✅ Testing guides and checklists

### Production Ready
- ✅ Type-safe APIs and components
- ✅ Comprehensive error handling
- ✅ Performance optimized
- ✅ Accessibility compliant
- ✅ Mobile responsive
- ✅ Modular architecture
- ✅ Easy to extend and customize

## 🚨 Troubleshooting

### Common Issues

**Connection not working?**
- Verify `NANGO_SECRET_KEY` is set correctly
- Check Nango dashboard for connection status
- Ensure Slack app has required permissions

**Channels not loading?**
- Verify bot has access to channels
- Check API rate limits in Slack dashboard
- Ensure connection has `channels:read` scope

**Messages not sending?**
- Check bot has `chat:write` permission
- Verify channel accessibility
- Validate message format and length

**UI not loading?**
- Check browser console for JavaScript errors
- Verify all dependencies installed
- Ensure TailwindCSS is configured properly

### Debug Mode
Set `NODE_ENV=development` for additional debugging information in the UI.

## 🎉 Success!

You now have a complete Slack integration with:

- **Beautiful UI**: Modern design with Slack branding
- **Full Functionality**: OAuth, messaging, health monitoring
- **Developer Experience**: Well-documented, type-safe, and extensible
- **Production Ready**: Error handling, loading states, responsive design

### Next Steps
1. Test the integration with your Slack workspace
2. Customize the UI to match your brand
3. Add additional Slack features (user management, file uploads, etc.)
4. Extend to other integrations (Notion, GitHub, Discord, etc.)

---

**Need help?** Check the detailed documentation in `FRONTEND_DOCS.md` or testing procedures in `TESTING_GUIDE.md`.

---

## 🏗️ Original Architecture Overview (Backend Integration System)

## 🏗️ Architecture Overview

### Directory Structure

```
/
├── app/
│   ├── api/
│   │   └── integrations/
│   │       └── slack/
│   │           ├── send-message/route.ts
│   │           ├── users/route.ts
│   │           ├── channels/route.ts
│   │           ├── user-info/route.ts
│   │           └── health/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── integrations/
│   ├── common/
│   │   ├── base-integration.ts      # Base interface for all integrations
│   │   ├── types.ts                 # Common types and utilities
│   │   └── index.ts                 # Integration registry
│   └── slack/
│       ├── types.ts                 # Slack-specific types
│       ├── service.ts               # Main Slack service class
│       └── index.ts                 # Slack integration factory
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

### Key Components

1. **BaseIntegration**: Abstract class that all integrations must extend
2. **IntegrationRegistry**: Central registry for managing all integrations
3. **SlackService**: Implementation of Slack-specific functionality
4. **API Routes**: Next.js App Router endpoints for external consumption
5. **Type System**: Comprehensive TypeScript definitions for type safety

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A Nango account with Slack provider configured
- Slack app with appropriate permissions

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env.local
```

Fill in your environment variables (see Environment Configuration section).

3. **Configure Nango:**

Set up your Slack provider in Nango with these scopes:
- `channels:read`
- `chat:write`
- `users:read`
- `users:read.email`

4. **Start the development server:**

```bash
npm run dev
```

## 🔧 Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NANGO_SECRET_KEY` | Your Nango secret key | `nango_sk_...` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SLACK_DEFAULT_CHANNEL` | Default channel for messages | `#general` |

## 📡 API Endpoints

All endpoints follow a consistent structure:

### Base URL
```
http://localhost:3000/api/integrations/slack
```

### Authentication
All endpoints require a `nangoConnectionId` in the request body, which represents an authenticated Slack workspace connection managed by Nango.

### Standard Response Format

```typescript
{
  "success": boolean,
  "data": any,           // Present on success
  "error": {             // Present on failure
    "code": string,
    "message": string,
    "details": object
  },
  "meta": {
    "timestamp": string,
    "integration": "slack",
    "version": "1.0.0"
  }
}
```

### Endpoints

#### 1. Send Message
**POST** `/api/integrations/slack/send-message`

Send a message to a Slack channel or user.

**Request Body:**
```json
{
  "nangoConnectionId": "conn_123",
  "channel": "#general",
  "text": "Hello, World!",
  "thread_ts": "1234567890.123456",  // optional
  "username": "Bot Name",            // optional
  "icon_emoji": ":robot_face:"       // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "1234567890.123456",
    "timestamp": "1234567890.123456"
  }
}
```

#### 2. Get Users
**POST** `/api/integrations/slack/users`

Retrieve list of users from the Slack workspace.

**Request Body:**
```json
{
  "nangoConnectionId": "conn_123",
  "limit": 50,              // optional, default 100
  "cursor": "dXNlcjpVMDR",  // optional, for pagination
  "include_locale": true    // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "U1234567890",
        "name": "John Doe",
        "email": "john@example.com",
        "avatar": "https://...",
        "status": "online",
        "metadata": {
          "isBot": false,
          "statusText": "Working from home",
          "statusEmoji": ":house:"
        }
      }
    ],
    "nextCursor": "dXNlcjpVMDR"
  }
}
```

#### 3. Get Channels
**POST** `/api/integrations/slack/channels`

Retrieve list of channels from the Slack workspace.

**Request Body:**
```json
{
  "nangoConnectionId": "conn_123",
  "limit": 50,                                    // optional, default 100
  "cursor": "dXNlcjpVMDR",                       // optional
  "exclude_archived": true,                       // optional, default true
  "types": "public_channel,private_channel"       // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "id": "C1234567890",
        "name": "general",
        "description": "Company-wide announcements",
        "type": "public",
        "memberCount": 150,
        "metadata": {
          "isArchived": false,
          "isGeneral": true,
          "isMember": true
        }
      }
    ],
    "nextCursor": "dXNlcjpVMDR"
  }
}
```

#### 4. Get User Info
**POST** `/api/integrations/slack/user-info`

Get detailed information about a specific user.

**Request Body:**
```json
{
  "nangoConnectionId": "conn_123",
  "user": "U1234567890",
  "include_locale": true  // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "U1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://...",
    "status": "online",
    "metadata": {
      "isBot": false,
      "statusText": "In a meeting",
      "statusEmoji": ":calendar:"
    }
  }
}
```

#### 5. Health Check
**POST** `/api/integrations/slack/health`

Check the health and connectivity of the Slack integration.

**Request Body:**
```json
{
  "nangoConnectionId": "conn_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "checks": {
      "authentication": true,
      "apiAccess": true,
      "permissions": true
    },
    "details": {
      "connectionId": "conn_123"
    }
  }
}
```

## 🛠️ Usage Examples

### Using the Service Directly

```typescript
import { SlackService } from '@/integrations/slack/service';

// Initialize service
const slackService = new SlackService(process.env.NANGO_SECRET_KEY!);

// Configure for a specific workspace
await slackService.initialize({
  nangoConnectionId: 'your-connection-id'
});

// Send a message
const result = await slackService.sendMessage({
  channel: '#general',
  text: 'Hello from the integration system!'
}, {
  userId: 'user123',
  accessToken: '' // Managed by Nango
});

console.log(result);
```

### Using via HTTP API

```javascript
// Send a message
const response = await fetch('/api/integrations/slack/send-message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    nangoConnectionId: 'conn_123',
    channel: '#general',
    text: 'Hello, World!'
  })
});

const result = await response.json();
console.log(result);
```

### Integration Registry Usage

```typescript
import { IntegrationRegistry } from '@/integrations/common';
import { createSlackIntegration } from '@/integrations/slack';

// Create and register Slack integration
const slackService = createSlackIntegration(process.env.NANGO_SECRET_KEY!);

// Get all registered integrations
const registry = IntegrationRegistry.getInstance();
const allIntegrations = registry.getAll();

// Get specific integration
const slack = registry.get('slack');
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit sensitive keys to version control
2. **HTTPS Only**: Use HTTPS in production for all API calls
3. **Input Validation**: All inputs are validated using Zod schemas
4. **Error Handling**: Errors are properly sanitized before returning to clients
5. **Rate Limiting**: Consider implementing rate limiting for public APIs

## 🚀 Extending the System

### Adding a New Integration

1. **Create integration directory:**
```bash
mkdir integrations/your-integration
```

2. **Implement the integration class:**
```typescript
// integrations/your-integration/service.ts
import { BaseIntegrationClass } from '../common/base-integration';

export class YourIntegrationService extends BaseIntegrationClass {
  public readonly id = 'your-integration';
  public readonly name = 'Your Integration';
  // ... implement required methods
}
```

3. **Add API routes:**
```bash
mkdir app/api/integrations/your-integration
```

4. **Register the integration:**
```typescript
// integrations/your-integration/index.ts
import { IntegrationRegistry } from '../common';
import { YourIntegrationService } from './service';

export function createYourIntegration(): YourIntegrationService {
  const service = new YourIntegrationService();
  IntegrationRegistry.getInstance().register(service);
  return service;
}
```

### Customizing Error Handling

```typescript
// Add custom error codes
export const CustomErrorCodes = {
  ...IntegrationErrorCodes,
  CUSTOM_ERROR: 'CUSTOM_ERROR',
} as const;
```

## 🧪 Testing

### Running Tests

```bash
npm test
```

### Testing Individual Endpoints

```bash
# Test health endpoint
curl -X POST http://localhost:3000/api/integrations/slack/health \
  -H "Content-Type: application/json" \
  -d '{"nangoConnectionId": "your-connection-id"}'
```

## 📚 Integration with AI Workflow Systems

This Slack MCP is designed to be consumed by AI workflow engines. Here's how to integrate:

### Workflow Engine Integration

```typescript
// Example: Using in an AI workflow
import { IntegrationRegistry } from '@/integrations/common';

class WorkflowEngine {
  private integrations = IntegrationRegistry.getInstance();

  async executeSlackAction(action: string, params: any, connectionId: string) {
    const slack = this.integrations.get('slack') as SlackService;
    
    if (!slack) {
      throw new Error('Slack integration not available');
    }

    await slack.initialize({ nangoConnectionId: connectionId });

    switch (action) {
      case 'send_message':
        return await slack.sendMessage(params, { userId: 'workflow' });
      case 'get_users':
        return await slack.getUsers(params, { userId: 'workflow' });
      // ... other actions
    }
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions and support:
- Create an issue in the GitHub repository
- Check the documentation for common solutions
- Review the error codes and responses for debugging

---

**Note**: This integration system is designed for scalability. Each integration follows the same pattern, making it easy to add new services like Notion, GitHub, Discord, and more.