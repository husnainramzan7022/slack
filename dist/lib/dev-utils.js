"use strict";
/**
 * Development utilities for the Pario Integration System
 * These utilities help with testing, debugging, and development workflows
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.devCommands = exports.DevHelper = exports.DevConfig = void 0;
const slack_1 = require("../integrations/slack");
const common_1 = require("../integrations/common");
/**
 * Development configuration
 */
exports.DevConfig = {
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
class DevHelper {
    constructor() {
        this.initializeServices();
    }
    initializeServices() {
        const nangoSecretKey = process.env.NANGO_SECRET_KEY;
        if (nangoSecretKey) {
            this.slackService = (0, slack_1.createSlackIntegration)(nangoSecretKey);
        }
    }
    /**
     * Test all Slack operations
     */
    async testSlackOperations(connectionId = exports.DevConfig.TEST_SLACK_CONNECTION_ID) {
        var _a, _b, _c, _d;
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
                console.log(`✅ Retrieved ${(_a = usersResult.data) === null || _a === void 0 ? void 0 : _a.users.length} users`);
            }
            else {
                console.log('❌ Failed to get users:', (_b = usersResult.error) === null || _b === void 0 ? void 0 : _b.message);
            }
            // Get channels
            const channelsResult = await this.slackService.getChannels({ limit: 5, exclude_archived: true, types: 'public_channel' }, { userId: 'dev-test' });
            if (channelsResult.success) {
                console.log(`✅ Retrieved ${(_c = channelsResult.data) === null || _c === void 0 ? void 0 : _c.channels.length} channels`);
            }
            else {
                console.log('❌ Failed to get channels:', (_d = channelsResult.error) === null || _d === void 0 ? void 0 : _d.message);
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
        }
        catch (error) {
            console.error('❌ Test failed:', error);
        }
    }
    /**
     * Test HTTP API endpoints
     */
    async testAPIEndpoints(connectionId = exports.DevConfig.TEST_SLACK_CONNECTION_ID) {
        var _a, _b, _c, _d, _e;
        console.log('🧪 Testing HTTP API Endpoints...\n');
        const baseUrl = `${exports.DevConfig.API_BASE_URL}/api/integrations/slack`;
        try {
            // Test health endpoint
            const healthResponse = await fetch(`${baseUrl}/health`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nangoConnectionId: connectionId })
            });
            if (healthResponse.ok) {
                const health = await healthResponse.json();
                console.log('✅ Health endpoint working:', (_a = health.data) === null || _a === void 0 ? void 0 : _a.status);
            }
            else {
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
                console.log(`✅ Users endpoint working: ${((_c = (_b = users.data) === null || _b === void 0 ? void 0 : _b.users) === null || _c === void 0 ? void 0 : _c.length) || 0} users`);
            }
            else {
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
                console.log(`✅ Channels endpoint working: ${((_e = (_d = channels.data) === null || _d === void 0 ? void 0 : _d.channels) === null || _e === void 0 ? void 0 : _e.length) || 0} channels`);
            }
            else {
                console.log('❌ Channels endpoint failed:', channelsResponse.status);
            }
            console.log('\n🎉 API tests completed!');
        }
        catch (error) {
            console.error('❌ API test failed:', error);
        }
    }
    /**
     * Show integration registry status
     */
    showRegistryStatus() {
        console.log('📋 Integration Registry Status:\n');
        const registry = common_1.IntegrationRegistry.getInstance();
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
    generateExamples(connectionId = exports.DevConfig.TEST_SLACK_CONNECTION_ID) {
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
            console.log(`curl -X ${example.method} ${exports.DevConfig.API_BASE_URL}${example.url} \\`);
            console.log(`  -H "Content-Type: application/json" \\`);
            console.log(`  -d '${JSON.stringify(example.body, null, 2)}'`);
            console.log('');
        });
    }
}
exports.DevHelper = DevHelper;
/**
 * Quick development commands
 */
exports.devCommands = {
    /**
     * Initialize and test everything
     */
    async runFullTest(connectionId) {
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
    async quickHealthCheck(connectionId) {
        const helper = new DevHelper();
        await helper.testSlackOperations(connectionId);
    },
    /**
     * Test API endpoints only
     */
    async testAPI(connectionId) {
        const helper = new DevHelper();
        await helper.testAPIEndpoints(connectionId);
    },
    /**
     * Show examples
     */
    showExamples(connectionId) {
        const helper = new DevHelper();
        helper.generateExamples(connectionId);
    }
};
// Export for use in development console
if (typeof window !== 'undefined') {
    window.devHelper = new DevHelper();
    window.devCommands = exports.devCommands;
}
