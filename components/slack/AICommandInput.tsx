'use client';

import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Alert, { AlertType } from '../ui/Alert';

interface AICommandProps {
  connectionId?: string;
  connected?: boolean;
  onMessageSent?: (messageId: string, details: any) => void;
  className?: string;
}

interface AlertState {
  type: AlertType;
  message: string;
  show: boolean;
}

/**
 * AICommandInput Component
 * 
 * Provides an interface for AI-driven message sending using natural language.
 * Users can type commands like "send 'Hello' to #general" and the system
 * will parse and execute them.
 */
const AICommandInput: React.FC<AICommandProps> = ({
  connectionId,
  connected = false,
  onMessageSent,
  className = '',
}) => {
  // Form state
  const [command, setCommand] = useState('');
  const [processingCommand, setProcessingCommand] = useState(false);
  const [alert, setAlert] = useState<AlertState>({ type: 'info', message: '', show: false });

  /**
   * Process AI command and send message
   */
  const handleProcessCommand = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectionId || !connected) {
      showAlert('error', 'Not connected to Slack');
      return;
    }

    if (!command.trim()) {
      showAlert('error', 'Please enter a command');
      return;
    }

    try {
      setProcessingCommand(true);

      const response = await fetch('/api/integrations/slack/ai-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nangoConnectionId: connectionId,
          command: command.trim(),
          userId: 'user-ai', // You can make this dynamic
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.messageId) {
        const parsedDetails = result.data.parsedCommand;
        showAlert('success', 
          `Message sent successfully! Sent "${parsedDetails.extractedMessage}" to ${parsedDetails.extractedChannel}`
        );
        setCommand(''); // Clear the command input
        onMessageSent?.(result.data.messageId, parsedDetails);
      } else {
        const errorMessage = result.error?.message || 'Unknown error';
        const examples = result.error?.details?.examples;
        
        let fullMessage = `Failed to process command: ${errorMessage}`;
        if (examples && examples.length > 0) {
          fullMessage += `\n\nTry these examples:\n${examples.map((ex: string) => `• ${ex}`).join('\n')}`;
        }
        
        showAlert('error', fullMessage);
      }
    } catch (error) {
      showAlert('error', `Network error: ${(error as Error).message}`);
    } finally {
      setProcessingCommand(false);
    }
  };

  /**
   * Shows an alert message
   */
  const showAlert = (type: AlertType, message: string) => {
    setAlert({ type, message, show: true });
    // Auto-hide success alerts after 7 seconds
    if (type === 'success') {
      setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 7000);
    }
  };

  /**
   * Dismisses the current alert
   */
  const dismissAlert = () => {
    setAlert(prev => ({ ...prev, show: false }));
  };

  /**
   * Set example command
   */
  const setExampleCommand = (example: string) => {
    setCommand(example);
  };

  const isFormDisabled = !connected || !connectionId;

  const examples = [
    "send 'Hello team!' to #general",
    "message 'Meeting in 5 minutes' to @john",
    "send 'Good morning' to the development channel"
  ];

  return (
    <Card
      title="AI Command"
      subtitle="Send messages using natural language commands"
      className={className}
    >
      <form onSubmit={handleProcessCommand} className="space-y-4">
        {/* Alert */}
        {alert.show && (
          <Alert
            type={alert.type}
            message={alert.message}
            dismissible
            onDismiss={dismissAlert}
            className="whitespace-pre-line"
          />
        )}

        {/* Command Input */}
        <Input
          label="AI Command"
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="e.g., send 'Hello team!' to #general"
          disabled={isFormDisabled}
          helpText="Type natural language commands to send messages"
        />

        {/* Example Commands */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Quick Examples:
          </label>
          <div className="flex flex-wrap gap-2">
            {examples.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setExampleCommand(example)}
                disabled={isFormDisabled}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-500">
            <strong>Tip:</strong> Use quotes around your message and specify channel with # or user with @
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={processingCommand}
            disabled={
              isFormDisabled ||
              processingCommand ||
              !command.trim()
            }
          >
            {processingCommand ? 'Processing...' : 'Send Command'}
          </Button>
        </div>

        {/* Connection Status Warning */}
        {!connected && (
          <Alert
            type="warning"
            message="Please connect to Slack first to use AI commands"
          />
        )}

        {/* Help Section */}
        <div className="bg-gray-50 rounded-lg p-4 mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Supported Command Formats:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <code>send 'message' to #channel</code> - Send to a channel</li>
            <li>• <code>message 'text' to @username</code> - Send direct message</li>
            <li>• <code>send 'hello' to the general channel</code> - Natural language</li>
            <li>• <code>tell #team that 'meeting starts now'</code> - Alternative format</li>
          </ul>
        </div>
      </form>
    </Card>
  );
};

export default AICommandInput;