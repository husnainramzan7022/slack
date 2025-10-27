'use client';

import React, { useState } from 'react';
import Button from '../ui/Button';

interface ConnectButtonProps {
  onConnectionChange?: (connected: boolean) => void;
  className?: string;
}

/**
 * ConnectButton Component
 * 
 * Handles the Slack OAuth connection flow via Nango.
 * When clicked, redirects user to the backend OAuth endpoint.
 */
const ConnectButton: React.FC<ConnectButtonProps> = ({
  onConnectionChange,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);

  /**
   * Initiates the Slack OAuth flow
   * Redirects to the backend endpoint that handles Nango OAuth
   */
  const handleConnect = async () => {
    try {
      setLoading(true);
      
      // Redirect to the backend OAuth endpoint
      // The backend will handle the Nango OAuth flow and redirect back
      window.location.href = '/api/integrations/slack/connect';
      
    } catch (error) {
      console.error('Failed to initiate Slack connection:', error);
      setLoading(false);
    }
  };

  const slackIcon = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="flex-shrink-0"
    >
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.521-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.523 2.521h-2.521V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.521A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.523v-2.521h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );

  return (
    <Button
      variant="slack"
      size="lg"
      loading={loading}
      onClick={handleConnect}
      icon={!loading ? slackIcon : undefined}
      className={className}
    >
      {loading ? 'Connecting...' : 'Connect with Slack'}
    </Button>
  );
};

export default ConnectButton;