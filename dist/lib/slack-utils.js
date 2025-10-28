"use strict";
/**
 * Frontend utilities for the Slack integration UI
 * These utilities handle common API interactions, error handling, and state management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.slackApi = exports.DevUtils = exports.RetryManager = exports.SlackValidator = exports.SlackStorageManager = exports.SlackErrorHandler = exports.SlackApiClient = void 0;
exports.useSlackApi = useSlackApi;
/**
 * API client for Slack integration endpoints
 */
class SlackApiClient {
    constructor(baseUrl = '/api/integrations/slack') {
        this.baseUrl = baseUrl;
    }
    /**
     * Send a message to Slack
     */
    async sendMessage(params) {
        return this.makeRequest('send-message', params);
    }
    /**
     * Get channels from Slack workspace
     */
    async getChannels(params) {
        return this.makeRequest('channels', params);
    }
    /**
     * Get users from Slack workspace
     */
    async getUsers(params) {
        return this.makeRequest('users', params);
    }
    /**
     * Get specific user info
     */
    async getUserInfo(params) {
        return this.makeRequest('user-info', params);
    }
    /**
     * Check connection health
     */
    async checkHealth(params) {
        return this.makeRequest('health', params);
    }
    /**
     * Make a request to the Slack API
     */
    async makeRequest(endpoint, params) {
        try {
            const response = await fetch(`${this.baseUrl}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error(`Slack API request failed (${endpoint}):`, error);
            throw error;
        }
    }
}
exports.SlackApiClient = SlackApiClient;
/**
 * Hook for managing Slack API interactions
 */
function useSlackApi() {
    const client = new SlackApiClient();
    return {
        sendMessage: client.sendMessage.bind(client),
        getChannels: client.getChannels.bind(client),
        getUsers: client.getUsers.bind(client),
        getUserInfo: client.getUserInfo.bind(client),
        checkHealth: client.checkHealth.bind(client),
    };
}
/**
 * Error handling utilities
 */
class SlackErrorHandler {
    static getErrorMessage(error) {
        var _a;
        if (typeof error === 'string')
            return error;
        if ((_a = error === null || error === void 0 ? void 0 : error.error) === null || _a === void 0 ? void 0 : _a.message)
            return error.error.message;
        if (error === null || error === void 0 ? void 0 : error.message)
            return error.message;
        return 'An unknown error occurred';
    }
    static getErrorCode(error) {
        var _a;
        if ((_a = error === null || error === void 0 ? void 0 : error.error) === null || _a === void 0 ? void 0 : _a.code)
            return error.error.code;
        return 'UNKNOWN_ERROR';
    }
    static isConnectionError(error) {
        const code = this.getErrorCode(error);
        return ['AUTHENTICATION_FAILED', 'TOKEN_EXPIRED', 'INSUFFICIENT_PERMISSIONS'].includes(code);
    }
    static isNetworkError(error) {
        return error instanceof TypeError && error.message.includes('fetch');
    }
    static shouldRetry(error) {
        const code = this.getErrorCode(error);
        return ['RATE_LIMITED', 'SERVICE_UNAVAILABLE', 'API_ERROR'].includes(code);
    }
}
exports.SlackErrorHandler = SlackErrorHandler;
/**
 * Local storage utilities for connection management
 */
class SlackStorageManager {
    static saveConnectionId(connectionId) {
        try {
            localStorage.setItem(this.CONNECTION_KEY, connectionId);
        }
        catch (error) {
            console.warn('Failed to save connection ID to localStorage:', error);
        }
    }
    static getConnectionId() {
        try {
            return localStorage.getItem(this.CONNECTION_KEY);
        }
        catch (error) {
            console.warn('Failed to retrieve connection ID from localStorage:', error);
            return null;
        }
    }
    static clearConnectionId() {
        try {
            localStorage.removeItem(this.CONNECTION_KEY);
        }
        catch (error) {
            console.warn('Failed to clear connection ID from localStorage:', error);
        }
    }
    static saveLastHealthCheck(timestamp) {
        try {
            localStorage.setItem(this.LAST_HEALTH_CHECK_KEY, timestamp);
        }
        catch (error) {
            console.warn('Failed to save health check timestamp:', error);
        }
    }
    static getLastHealthCheck() {
        try {
            return localStorage.getItem(this.LAST_HEALTH_CHECK_KEY);
        }
        catch (error) {
            console.warn('Failed to retrieve health check timestamp:', error);
            return null;
        }
    }
}
exports.SlackStorageManager = SlackStorageManager;
SlackStorageManager.CONNECTION_KEY = 'slack-connection-id';
SlackStorageManager.LAST_HEALTH_CHECK_KEY = 'slack-last-health-check';
/**
 * Validation utilities
 */
class SlackValidator {
    static isValidConnectionId(connectionId) {
        return typeof connectionId === 'string' && connectionId.trim().length > 0;
    }
    static isValidChannelId(channelId) {
        const trimmed = channelId.trim();
        // Valid patterns: #channel-name, @username, C1234567890, D1234567890, G1234567890
        return /^[#@][\w-]+$|^[CDG][A-Z0-9]{8,}$/.test(trimmed);
    }
    static isValidMessage(message) {
        const trimmed = message.trim();
        return trimmed.length > 0 && trimmed.length <= 4000;
    }
    static validateSendMessageParams(params) {
        const errors = [];
        if (!this.isValidConnectionId(params.nangoConnectionId)) {
            errors.push('Invalid connection ID');
        }
        if (!this.isValidChannelId(params.channel)) {
            errors.push('Invalid channel ID format');
        }
        if (!this.isValidMessage(params.text)) {
            errors.push('Message must be between 1 and 4000 characters');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
exports.SlackValidator = SlackValidator;
/**
 * Retry utility with exponential backoff
 */
class RetryManager {
    static async withRetry(fn, options = {}) {
        const { maxAttempts = 3, baseDelay = 1000, maxDelay = 10000, backoffFactor = 2, shouldRetry = SlackErrorHandler.shouldRetry, } = options;
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                if (attempt === maxAttempts || !shouldRetry(error)) {
                    break;
                }
                const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
                console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        throw lastError;
    }
}
exports.RetryManager = RetryManager;
/**
 * Development utilities
 */
class DevUtils {
    static log(message, data) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Slack Integration] ${message}`, data || '');
        }
    }
    static warn(message, data) {
        if (process.env.NODE_ENV === 'development') {
            console.warn(`[Slack Integration] ${message}`, data || '');
        }
    }
    static error(message, error) {
        if (process.env.NODE_ENV === 'development') {
            console.error(`[Slack Integration] ${message}`, error || '');
        }
    }
    static mockApiResponse(data, delay = 1000) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data,
                    meta: {
                        timestamp: new Date().toISOString(),
                        integration: 'slack',
                        version: '1.0.0',
                    },
                });
            }, delay);
        });
    }
}
exports.DevUtils = DevUtils;
// Export singleton instance
exports.slackApi = new SlackApiClient();
