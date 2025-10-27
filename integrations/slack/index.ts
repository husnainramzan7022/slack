// Export all Slack integration components
export * from './types';
export * from './service';

import { SlackService } from './service';
import { IntegrationRegistry } from '../common';

/**
 * Factory function to create and register Slack integration
 */
export function createSlackIntegration(nangoSecretKey: string): SlackService {
  const slackService = new SlackService(nangoSecretKey);
  
  // Register with the global registry
  const registry = IntegrationRegistry.getInstance();
  registry.register(slackService);
  
  return slackService;
}

/**
 * Integration metadata for registration
 */
export const SlackIntegrationMeta = {
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