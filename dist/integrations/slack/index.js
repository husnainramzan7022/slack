"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackIntegrationMeta = void 0;
exports.createSlackIntegration = createSlackIntegration;
// Export all Slack integration components
__exportStar(require("./types"), exports);
__exportStar(require("./service"), exports);
const service_1 = require("./service");
const common_1 = require("../common");
/**
 * Factory function to create and register Slack integration
 */
function createSlackIntegration(nangoSecretKey) {
    const slackService = new service_1.SlackService(nangoSecretKey);
    // Register with the global registry
    const registry = common_1.IntegrationRegistry.getInstance();
    registry.register(slackService);
    return slackService;
}
/**
 * Integration metadata for registration
 */
exports.SlackIntegrationMeta = {
    id: 'slack',
    name: 'Slack',
    description: 'Send messages, fetch users, and manage channels in Slack',
    version: '1.0.0',
    author: 'Pario Integration System',
    homepage: 'https://slack.com',
    documentation: 'https://api.slack.com',
    requiredEnvVars: [
        'NANGO_SECRET_KEY',
    ],
    optionalEnvVars: [
        'SLACK_DEFAULT_CHANNEL',
    ],
    nangoProvider: {
        name: 'slack',
        authMode: 'OAUTH2',
        scopes: [
            'channels:read',
            'chat:write',
            'users:read',
            'users:read.email',
        ],
    },
};
