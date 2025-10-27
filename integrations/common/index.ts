// Export all common interfaces and utilities
export * from './base-integration';
export * from './types';

/**
 * Integration registry for managing all available integrations
 */
import { BaseIntegration } from './base-integration';

export class IntegrationRegistry {
  private static instance: IntegrationRegistry;
  private integrations = new Map<string, BaseIntegration>();

  private constructor() {}

  static getInstance(): IntegrationRegistry {
    if (!IntegrationRegistry.instance) {
      IntegrationRegistry.instance = new IntegrationRegistry();
    }
    return IntegrationRegistry.instance;
  }

  /**
   * Register a new integration
   */
  register(integration: BaseIntegration): void {
    if (this.integrations.has(integration.id)) {
      throw new Error(`Integration ${integration.id} is already registered`);
    }
    this.integrations.set(integration.id, integration);
  }

  /**
   * Get an integration by ID
   */
  get(id: string): BaseIntegration | undefined {
    return this.integrations.get(id);
  }

  /**
   * Get all registered integrations
   */
  getAll(): BaseIntegration[] {
    return Array.from(this.integrations.values());
  }

  /**
   * Get all enabled integrations
   */
  getEnabled(): BaseIntegration[] {
    return this.getAll().filter(integration => integration.enabled);
  }

  /**
   * Unregister an integration
   */
  unregister(id: string): boolean {
    return this.integrations.delete(id);
  }

  /**
   * Check if an integration is registered
   */
  has(id: string): boolean {
    return this.integrations.has(id);
  }
}