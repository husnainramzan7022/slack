"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseIntegrationClass = void 0;
/**
 * Base class that provides common functionality for all integrations
 */
class BaseIntegrationClass {
    constructor() {
        this.enabled = true;
        // Common initialization logic
    }
    getMetadata() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            version: this.version,
            author: 'Pario Integration System',
            supportedOperations: this.getSupportedOperations(),
            requiredPermissions: this.getRequiredPermissions(),
            configurationFields: this.getConfigurationFields(),
        };
    }
    /**
     * Create a standardized response
     */
    createResponse(data, error) {
        return {
            success: !error,
            data: error ? undefined : data,
            error,
            meta: {
                timestamp: new Date().toISOString(),
                integration: this.id,
                version: this.version,
            },
        };
    }
    /**
     * Create a standardized error
     */
    createError(code, message, details) {
        return {
            code,
            message,
            details,
            stack: process.env.NODE_ENV === 'development' ? new Error().stack : undefined,
        };
    }
}
exports.BaseIntegrationClass = BaseIntegrationClass;
