/**
 * Development utilities for the Pario Integration System
 * These utilities help with testing, debugging, and development workflows
 */

import { SlackService, createSlackIntegration } from '../integrations/slack';
import { IntegrationRegistry } from '../integrations/common';

/**
 * Development configuration
 */
export const DevConfig = {
  // Test connection IDs (replace with your actual test connection IDs)
  TEST_SLACK_CONNECTION_ID: 'test-slack-conn-123',
  
  // Test channels and users
  TEST_CHANNEL: '#dev-testing',
  TEST_USER: 'U1234567890',
  
  // API base URL
  API_BASE_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
};

/**
 * Development helper class for testing integrations
 */
export class DevHelper {
  private slackService?: SlackService;

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    const nangoSecretKey = process.env.NANGO_SECRET_KEY;
    if (nangoSecretKey) {
      this.slackService = createSlackIntegration(nangoSecretKey);
    }
  }

  /**
   * Test all Slack operations
   */
  async testSlackOperations(connectionId: string = DevConfig.TEST_SLACK_CONNECTION_ID) {
    if (!this.slackService) {
      throw new Error('Slack service not initialized - check NANGO_SECRET_KEY');
    }

    console.log('🧪 Testing Slack Integration Operations...\n');

    try {
      // Initialize
      await this.slackService.initialize({ nangoConnectionId: connectionId });
      console.log('✅ Initialization successful');

      // Health check
      const health = await this.slackService.testConnection();
      console.log('✅ Health check:', health.status);
      console.log('   - Authentication:', health.checks.authentication ? '✅' : '❌');
      console.log('   - API Access:', health.checks.apiAccess ? '✅' : '❌');
      console.log('   - Permissions:', health.checks.permissions ? '✅' : '❌');

      // Get users
      const usersResult = await this.slackService.getUsers({ limit: 5 }, { userId: 'dev-test' });
      if (usersResult.success) {
        console.log(`✅ Retrieved ${usersResult.data?.users.length} users`);
      } else {
        console.log('❌ Failed to get users:', usersResult.error?.message);
      }

      // Get channels
      const channelsResult = await this.slackService.getChannels({ limit: 5, exclude_archived: true, types: 'public_channel' }, { userId: 'dev-test' });
      if (channelsResult.success) {
        console.log(`✅ Retrieved ${channelsResult.data?.channels.length} channels`);
      } else {
        console.log('❌ Failed to get channels:', channelsResult.error?.message);
      }

      // Send test message (optional - uncomment to test)
      /*
      const messageResult = await this.slackService.sendMessage({
        channel: DevConfig.TEST_CHANNEL,
        text: `🤖 Dev test message from Pario Integration System - ${new Date().toISOString()}`
      }, { userId: 'dev-test' });
      
      if (messageResult.success) {
        console.log('✅ Test message sent:', messageResult.data?.messageId);
      } else {
        console.log('❌ Failed to send message:', messageResult.error?.message);
      }
      */

      console.log('\n🎉 All tests completed!');
    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  /**
   * Test HTTP API endpoints
   */
  async testAPIEndpoints(connectionId: string = DevConfig.TEST_SLACK_CONNECTION_ID) {
    console.log('🧪 Testing HTTP API Endpoints...\n');

    const baseUrl = `${DevConfig.API_BASE_URL}/api/integrations/slack`;

    try {
      // Test health endpoint
      const healthResponse = await fetch(`${baseUrl}/health`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nangoConnectionId: connectionId })
      });

      if (healthResponse.ok) {
        const health = await healthResponse.json();
        console.log('✅ Health endpoint working:', health.data?.status);
      } else {
        console.log('❌ Health endpoint failed:', healthResponse.status);
      }

      // Test users endpoint
      const usersResponse = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nangoConnectionId: connectionId,
          limit: 3
        })
      });

      if (usersResponse.ok) {
        const users = await usersResponse.json();
        console.log(`✅ Users endpoint working: ${users.data?.users?.length || 0} users`);
      } else {
        console.log('❌ Users endpoint failed:', usersResponse.status);
      }

      // Test channels endpoint
      const channelsResponse = await fetch(`${baseUrl}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nangoConnectionId: connectionId,
          limit: 3
        })
      });

      if (channelsResponse.ok) {
        const channels = await channelsResponse.json();
        console.log(`✅ Channels endpoint working: ${channels.data?.channels?.length || 0} channels`);
      } else {
        console.log('❌ Channels endpoint failed:', channelsResponse.status);
      }

      console.log('\n🎉 API tests completed!');
    } catch (error) {
      console.error('❌ API test failed:', error);
    }
  }

  /**
   * Show integration registry status
   */
  showRegistryStatus() {
    console.log('📋 Integration Registry Status:\n');

    const registry = IntegrationRegistry.getInstance();
    const allIntegrations = registry.getAll();
    const enabledIntegrations = registry.getEnabled();

    console.log(`Total integrations: ${allIntegrations.length}`);
    console.log(`Enabled integrations: ${enabledIntegrations.length}\n`);

    allIntegrations.forEach(integration => {
      console.log(`- ${integration.name} (${integration.id})`);
      console.log(`  Version: ${integration.version}`);
      console.log(`  Enabled: ${integration.enabled ? '✅' : '❌'}`);
      console.log(`  Description: ${integration.description}\n`);
    });
  }

  /**
   * Generate sample API request examples
   */
  generateExamples(connectionId: string = DevConfig.TEST_SLACK_CONNECTION_ID) {
    console.log('📝 Sample API Request Examples:\n');

    const examples = {
      'Send Message': {
        method: 'POST',
        url: '/api/integrations/slack/send-message',
        body: {
          nangoConnectionId: connectionId,
          channel: '#general',
          text: 'Hello from Pario Integration System!',
          username: 'ParioBot',
          icon_emoji: ':robot_face:'
        }
      },
      'Get Users': {
        method: 'POST',
        url: '/api/integrations/slack/users',
        body: {
          nangoConnectionId: connectionId,
          limit: 20,
          include_locale: true
        }
      },
      'Get Channels': {
        method: 'POST',
        url: '/api/integrations/slack/channels',
        body: {
          nangoConnectionId: connectionId,
          limit: 50,
          exclude_archived: true
        }
      },
      'Get User Info': {
        method: 'POST',
        url: '/api/integrations/slack/user-info',
        body: {
          nangoConnectionId: connectionId,
          user: 'U1234567890'
        }
      },
      'Health Check': {
        method: 'POST',
        url: '/api/integrations/slack/health',
        body: {
          nangoConnectionId: connectionId
        }
      }
    };

    Object.entries(examples).forEach(([name, example]) => {
      console.log(`${name}:`);
      console.log(`curl -X ${example.method} ${DevConfig.API_BASE_URL}${example.url} \\`);
      console.log(`  -H "Content-Type: application/json" \\`);
      console.log(`  -d '${JSON.stringify(example.body, null, 2)}'`);
      console.log('');
    });
  }
}

/**
 * Quick development commands
 */
export const devCommands = {
  /**
   * Initialize and test everything
   */
  async runFullTest(connectionId?: string) {
    const helper = new DevHelper();
    
    console.log('🚀 Starting full integration test...\n');
    
    helper.showRegistryStatus();
    await helper.testSlackOperations(connectionId);
    await helper.testAPIEndpoints(connectionId);
    helper.generateExamples(connectionId);
    
    console.log('✨ Full test completed!');
  },

  /**
   * Quick health check
   */
  async quickHealthCheck(connectionId?: string) {
    const helper = new DevHelper();
    await helper.testSlackOperations(connectionId);
  },

  /**
   * Test API endpoints only
   */
  async testAPI(connectionId?: string) {
    const helper = new DevHelper();
    await helper.testAPIEndpoints(connectionId);
  },

  /**
   * Show examples
   */
  showExamples(connectionId?: string) {
    const helper = new DevHelper();
    helper.generateExamples(connectionId);
  }
};

// Export for use in development console
if (typeof window !== 'undefined') {
  (window as any).devHelper = new DevHelper();
  (window as any).devCommands = devCommands;
}