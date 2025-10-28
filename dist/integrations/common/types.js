"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrationUtils = exports.IntegrationErrorCodes = exports.paginationSchema = exports.messageContentSchema = exports.channelIdSchema = exports.userIdSchema = void 0;
const zod_1 = require("zod");
/**
 * Common validation schemas used across integrations
 */
// User ID validation
exports.userIdSchema = zod_1.z.string().min(1, 'User ID is required');
// Channel/Room ID validation
exports.channelIdSchema = zod_1.z.string().min(1, 'Channel ID is required');
// Message content validation
exports.messageContentSchema = zod_1.z.string().min(1, 'Message content is required').max(4000, 'Message too long');
// Pagination schema
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.number().min(1).default(1),
    limit: zod_1.z.number().min(1).max(100).default(20),
    cursor: zod_1.z.string().optional(),
});
// Common error codes
exports.IntegrationErrorCodes = {
    // Authentication errors
    AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    // API errors
    API_ERROR: 'API_ERROR',
    RATE_LIMITED: 'RATE_LIMITED',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    // Validation errors
    INVALID_REQUEST: 'INVALID_REQUEST',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    INVALID_FORMAT: 'INVALID_FORMAT',
    // Resource errors
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
    // Configuration errors
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
    INTEGRATION_DISABLED: 'INTEGRATION_DISABLED',
};
/**
 * Utility functions for common operations
 */
class IntegrationUtils {
    /**
     * Validate and sanitize input data
     */
    static validateInput(schema, data) {
        try {
            return schema.parse(data);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new Error(`Validation failed: ${error.errors.map(e => e.message).join(', ')}`);
            }
            throw error;
        }
    }
    /**
     * Generate a unique request ID
     */
    static generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Delay execution for rate limiting
     */
    static async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Retry logic with exponential backoff
     */
    static async retry(fn, options = {}) {
        const { maxAttempts = 3, baseDelay = 1000, maxDelay = 10000, backoffFactor = 2, } = options;
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (attempt === maxAttempts) {
                    break;
                }
                const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
                await this.delay(delay);
            }
        }
        throw lastError;
    }
}
exports.IntegrationUtils = IntegrationUtils;
