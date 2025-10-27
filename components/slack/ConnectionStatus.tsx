'use client';

import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Alert from '../ui/Alert';
import Button from '../ui/Button';

interface ConnectionStatusProps {
  connectionId?: string;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
  className?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  connectionId?: string;
  workspaceName?: string;
  botUserId?: string;
  error?: string;
  lastChecked: Date;
  health?: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: {
      authentication: boolean;
      apiAccess: boolean;
      permissions: boolean;
    };
  };
}

/**
 * ConnectionStatus Component
 * 
 * Displays the current Slack connection status and provides health check functionality.
 * Automatically checks connection status on mount and provides refresh capability.
 */
const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionId,
  onConnectionStatusChange,
  className = '',
}) => {
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
    lastChecked: new Date(),
  });
  const [loading, setLoading] = useState(false);

  /**
   * Checks the Slack connection health via the backend API
   */
  const checkConnectionStatus = async (showLoading = true) => {
    if (!connectionId) {
      setStatus({
        connected: false,
        error: 'No connection ID provided',
        lastChecked: new Date(),
      });
      return;
    }

    try {
      if (showLoading) setLoading(true);

      const response = await fetch('/api/integrations/slack/health', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nangoConnectionId: connectionId,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const healthData = result.data;
        const newStatus: ConnectionStatus = {
          connected: healthData.status !== 'unhealthy',
          connectionId,
          lastChecked: new Date(),
          health: {
            status: healthData.status,
            checks: healthData.checks,
          },
        };

        setStatus(newStatus);
        onConnectionStatusChange?.(newStatus);
      } else {
        const errorStatus: ConnectionStatus = {
          connected: false,
          connectionId,
          error: result.error?.message || 'Connection check failed',
          lastChecked: new Date(),
        };
        
        setStatus(errorStatus);
        onConnectionStatusChange?.(errorStatus);
      }
    } catch (error) {
      const errorStatus: ConnectionStatus = {
        connected: false,
        connectionId,
        error: `Network error: ${(error as Error).message}`,
        lastChecked: new Date(),
      };
      
      setStatus(errorStatus);
      onConnectionStatusChange?.(errorStatus);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Check connection status on mount and when connectionId changes
  useEffect(() => {
    if (connectionId) {
      checkConnectionStatus();
    }
  }, [connectionId]);

  const getStatusColor = () => {
    if (!status.connected) return 'error';
    if (status.health?.status === 'healthy') return 'success';
    if (status.health?.status === 'degraded') return 'warning';
    return 'error';
  };

  const getStatusMessage = () => {
    if (status.error) return status.error;
    if (!status.connected) return 'Not connected to Slack';
    if (status.health?.status === 'healthy') return 'Connected and fully operational';
    if (status.health?.status === 'degraded') return 'Connected but with limited functionality';
    if (status.health?.status === 'unhealthy') return 'Connected but experiencing issues';
    return 'Connection status unknown';
  };

  const formatLastChecked = () => {
    return status.lastChecked.toLocaleTimeString();
  };

  return (
    <Card
      title="Connection Status"
      subtitle={`Last checked: ${formatLastChecked()}`}
      loading={loading}
      className={className}
    >
      <div className="space-y-4">
        {/* Status Alert */}
        <Alert
          type={getStatusColor()}
          message={getStatusMessage()}
          title={status.connected ? 'Connected' : 'Disconnected'}
        />

        {/* Connection Details */}
        {connectionId && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Connection ID:</span>
              <code className="ml-2 px-2 py-1 bg-white rounded text-xs font-mono border">
                {connectionId}
              </code>
            </div>
          </div>
        )}

        {/* Health Check Details */}
        {status.health && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Health Checks</h4>
            <div className="space-y-1">
              {Object.entries(status.health.checks).map(([check, passed]) => (
                <div key={check} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 capitalize">
                    {check.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                  </span>
                  <span className={`font-medium ${passed ? 'text-success-600' : 'text-error-600'}`}>
                    {passed ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkConnectionStatus()}
            disabled={loading || !connectionId}
          >
            Refresh Status
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ConnectionStatus;