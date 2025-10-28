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
exports.IntegrationRegistry = void 0;
// Export all common interfaces and utilities
__exportStar(require("./base-integration"), exports);
__exportStar(require("./types"), exports);
class IntegrationRegistry {
    constructor() {
        this.integrations = new Map();
    }
    static getInstance() {
        if (!IntegrationRegistry.instance) {
            IntegrationRegistry.instance = new IntegrationRegistry();
        }
        return IntegrationRegistry.instance;
    }
    /**
     * Register a new integration
     */
    register(integration) {
        if (this.integrations.has(integration.id)) {
            throw new Error(`Integration ${integration.id} is already registered`);
        }
        this.integrations.set(integration.id, integration);
    }
    /**
     * Get an integration by ID
     */
    get(id) {
        return this.integrations.get(id);
    }
    /**
     * Get all registered integrations
     */
    getAll() {
        return Array.from(this.integrations.values());
    }
    /**
     * Get all enabled integrations
     */
    getEnabled() {
        return this.getAll().filter(integration => integration.enabled);
    }
    /**
     * Unregister an integration
     */
    unregister(id) {
        return this.integrations.delete(id);
    }
    /**
     * Check if an integration is registered
     */
    has(id) {
        return this.integrations.has(id);
    }
}
exports.IntegrationRegistry = IntegrationRegistry;
