'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ConnectButton from '../../../components/slack/ConnectButton';
import ConnectionStatus, { ConnectionStatus as ConnectionStatusType } from '../../../components/slack/ConnectionStatus';
import SendMessageForm from '../../../components/slack/SendMessageForm';
import AICommandInput from '../../../components/slack/AICommandInput';
import Card from '../../../components/ui/Card';
import Alert from '../../../components/ui/Alert';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';

/**
 * Slack Integration Dashboard
 * 
 * This page provides a complete interface for managing Slack integration:
 * 1. Connection management (OAuth via Nango)
 * 2. Connection status monitoring
 * 3. Message sending functionality
 * 4. Channel and user management
 * 
 * The page handles the OAuth callback and manages connection state
 * across all child components.
 */
function SlackIntegrationContent() {
  // Connection state
  const [connectionId, setConnectionId] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType | null>(null);
  const [showConnectionInput, setShowConnectionInput] = useState(false);

  // UI state
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string; show: boolean }>({
    type: 'info',
    message: '',
    show: false,
  });

  // URL search params (for OAuth callback handling)
  const searchParams = useSearchParams();

  /**
   * Handle OAuth callback
   * Extracts connection details from URL parameters after OAuth flow
   */
  useEffect(() => {
    const connectionIdFromUrl = searchParams.get('connectionId');
    const error = searchParams.get('error');
    const success = searchParams.get('success');

    if (error) {
      showAlert('error', `OAuth failed: ${decodeURIComponent(error)}`);
    } else if (success && connectionIdFromUrl) {
      setConnectionId(connectionIdFromUrl);
      showAlert('success', 'Successfully connected to Slack!');
      // Clean up URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  /**
   * Load saved connection ID from localStorage on mount
   */
  useEffect(() => {
    const savedConnectionId = localStorage.getItem('slack-connection-id');
    if (savedConnectionId && !connectionId) {
      setConnectionId(savedConnectionId);
    }
  }, []);

  /**
   * Save connection ID to localStorage when it changes
   */
  useEffect(() => {
    if (connectionId) {
      localStorage.setItem('slack-connection-id', connectionId);
    }
  }, [connectionId]);

  /**
   * Handle connection status changes from child components
   */
  const handleConnectionStatusChange = (status: ConnectionStatusType) => {
    setConnectionStatus(status);
    if (!status.connected) {
      showAlert('error', 'Lost connection to Slack. Please reconnect.');
    }
  };

  /**
   * Handle successful message sending
   */
  const handleMessageSent = (messageId: string) => {
    showAlert('success', `Message sent successfully! Message ID: ${messageId}`);
  };

  /**
   * Show alert message
   */
  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({ type, message, show: true });
    if (type === 'success') {
      setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 5000);
    }
  };

  /**
   * Dismiss alert
   */
  const dismissAlert = () => {
    setAlert(prev => ({ ...prev, show: false }));
  };

  /**
   * Handle manual connection ID input
   */
  const handleConnectionIdSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const inputConnectionId = formData.get('connectionId') as string;
    if (inputConnectionId?.trim()) {
      setConnectionId(inputConnectionId.trim());
      setShowConnectionInput(false);
      showAlert('info', 'Connection ID updated. Checking status...');
    }
  };

  /**
   * Clear connection and reset state
   */
  const handleDisconnect = () => {
    setConnectionId('');
    setConnectionStatus(null);
    localStorage.removeItem('slack-connection-id');
    showAlert('info', 'Disconnected from Slack');
  };

  const isConnected = connectionStatus?.connected || false;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="text-slack-500"
                >
                  <path
                    fill="currentColor"
                    d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.521-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.523 2.521h-2.521V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.521A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.523v-2.521h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Slack Integration
                </h1>
                <p className="text-sm text-gray-500">
                  Connect your Slack workspace and send messages manually or with AI commands
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {isConnected && (
                <div className="flex items-center space-x-2 text-sm text-success-600">
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                  <span>Connected</span>
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/'}
              >
                ← Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Global Alert */}
        {alert.show && (
          <Alert
            type={alert.type}
            message={alert.message}
            dismissible
            onDismiss={dismissAlert}
            className="mb-6"
          />
        )}

        {/* Two-column layout for larger screens, single column for mobile */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Connection Management */}
          <div className="space-y-6">
            {/* Connection Setup */}
            <Card
              title="Connection Setup"
              subtitle="Connect your Slack workspace to get started"
            >
              <div className="space-y-4">
                {!connectionId ? (
                  <div className="space-y-4">
                    {!showConnectionInput ? (
                      <div className="space-y-3">
                        <ConnectButton
                          onConnectionChange={(connected) => {
                            if (connected) {
                              showAlert('success', 'Successfully connected to Slack!');
                            }
                          }}
                          className="w-full"
                        />
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => setShowConnectionInput(true)}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                          >
                            Or enter connection ID manually
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleConnectionIdSubmit} className="space-y-3">
                        <div>
                          <label
                            htmlFor="connectionId"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Connection ID
                          </label>
                          <input
                            type="text"
                            name="connectionId"
                            id="connectionId"
                            className="input"
                            placeholder="Enter your Nango connection ID"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            You can find this in your Nango dashboard
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button type="submit" size="sm">
                            Connect
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowConnectionInput(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Connection ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{connectionId}</code>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnect}
                    >
                      Disconnect
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Connection Status */}
            {connectionId && (
              <ConnectionStatus
                connectionId={connectionId}
                onConnectionStatusChange={handleConnectionStatusChange}
              />
            )}

            {/* Development Info */}
            {process.env.NODE_ENV === 'development' && (
              <Card
                title="Developer Info"
                subtitle="Debug information and utilities"
              >
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Connection ID:</span>
                    <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                      {connectionId || 'Not set'}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      isConnected ? 'bg-success-100 text-success-800' : 'bg-error-100 text-error-800'
                    }`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  {connectionStatus?.health && (
                    <div>
                      <span className="font-medium">Health:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        connectionStatus.health.status === 'healthy' ? 'bg-success-100 text-success-800' :
                        connectionStatus.health.status === 'degraded' ? 'bg-warning-100 text-warning-800' :
                        'bg-error-100 text-error-800'
                      }`}>
                        {connectionStatus.health.status}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Middle Column - Manual Message Form */}
          <div className="space-y-6">
            <SendMessageForm
              connectionId={connectionId}
              connected={isConnected}
              onMessageSent={handleMessageSent}
            />
          </div>

          {/* Right Column - AI Command Interface */}
          <div className="space-y-6">
            <AICommandInput
              connectionId={connectionId}
              connected={isConnected}
              onMessageSent={(messageId, details) => {
                handleMessageSent(messageId);
                showAlert('success', `AI Command executed! Sent "${details.extractedMessage}" to ${details.extractedChannel}`);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function SlackPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Loading Slack Integration...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense wrapper
export default function SlackIntegrationPage() {
  return (
    <Suspense fallback={<SlackPageLoading />}>
      <SlackIntegrationContent />
    </Suspense>
  );
}