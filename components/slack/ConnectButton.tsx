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
  
  // Generate or retrieve persistent user session data
  const getUserSessionData = () => {
    // Try to get existing session from localStorage
    let sessionData = localStorage.getItem('pario-user-session');
    
    if (sessionData) {
      return JSON.parse(sessionData);
    }
    
    // Generate new session data for production
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    
    const newSessionData = {
      userId: `user_${timestamp}_${randomId}`,
      email: `user_${timestamp}@pario.dev`,
      name: `Pario User ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      sessionId: `session_${timestamp}_${randomId}`
    };
    
    // Store for future use
    localStorage.setItem('pario-user-session', JSON.stringify(newSessionData));
    
    return newSessionData;
  };

  /**
   * Initiates the Slack OAuth flow following official Nango pattern
   * Backend → Create session token → Frontend → Open Connect UI → Webhook saves connection
   */
  const handleConnect = async () => {
    try {
      setLoading(true);
      
      console.log('🚀 Starting Slack OAuth flow...');
      
      // Get or generate user session data
      const sessionData = getUserSessionData();
      console.log('Using session data:', sessionData);
      
      // Step 1: Get session token from backend
      const res = await fetch('/api/nango/session-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to get session token: ${errorText}`);
      }

      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      console.log('✅ Session token received');
      
      // Step 2: Import Nango frontend SDK and open Connect UI
      const Nango = (await import('@nangohq/frontend')).default;
      const nango = new Nango();
      
      const connect = nango.openConnectUI({
        onEvent: (event: any) => {
          console.log('🔔 Nango Connect Event:', event);
          
          if (event.type === 'connect') {
            const connectionId = event.payload?.connectionId;
            console.log('✅ Connected:', connectionId);
            
            // Store connection ID for future use
            if (connectionId) {
              localStorage.setItem('pario-slack-connection-id', connectionId);
              
              // Also store connection details with user session
              const currentSession = getUserSessionData();
              const connectionData = {
                ...currentSession,
                connectionId,
                connectedAt: new Date().toISOString(),
                provider: 'slack',
                status: 'connected'
              };
              localStorage.setItem('pario-slack-connection-data', JSON.stringify(connectionData));
            }
            
            setLoading(false);
            
            // Notify parent component about successful connection
            if (onConnectionChange) {
              onConnectionChange(true);
            }
            
            // Show success message with connection ID
            alert(`🎉 Slack connected successfully!\nConnection ID: ${connectionId}\nYou can now send messages.`);
            
          } else if (event.type === 'close') {
            console.log('❌ User closed the modal');
            setLoading(false);
          }
        },
      });

      // Step 3: Set the session token to start OAuth flow
      console.log('🔑 Opening Connect UI...');
      connect.setSessionToken(data.sessionToken);
      
    } catch (error) {
      console.error('❌ Failed to initiate Slack connection:', error);
      setLoading(false);
      
      // Show error to user
      alert(`Connection failed: ${(error as Error).message}`);
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