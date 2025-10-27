'use client';

import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Alert, { AlertType } from '../ui/Alert';

interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'direct' | 'group';
  memberCount?: number;
}

interface SendMessageFormProps {
  connectionId?: string;
  connected?: boolean;
  onMessageSent?: (messageId: string) => void;
  className?: string;
}

interface AlertState {
  type: AlertType;
  message: string;
  show: boolean;
}

/**
 * SendMessageForm Component
 * 
 * Provides an interface for sending messages to Slack channels.
 * Features:
 * - Channel selection (dropdown populated from Slack API)
 * - Manual channel ID input
 * - Message composition with character count
 * - Send functionality with loading states
 * - Success/error feedback
 */
const SendMessageForm: React.FC<SendMessageFormProps> = ({
  connectionId,
  connected = false,
  onMessageSent,
  className = '',
}) => {
  // Form state
  const [selectedChannel, setSelectedChannel] = useState('');
  const [manualChannelId, setManualChannelId] = useState('');
  const [message, setMessage] = useState('');
  const [useManualInput, setUseManualInput] = useState(false);

  // UI state
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [alert, setAlert] = useState<AlertState>({ type: 'info', message: '', show: false });

  /**
   * Fetches available Slack channels from the backend
   */
  const fetchChannels = async () => {
    if (!connectionId || !connected) return;

    try {
      setLoadingChannels(true);
      
      const response = await fetch('/api/integrations/slack/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nangoConnectionId: connectionId,
          limit: 100,
          exclude_archived: true,
          types: 'public_channel,private_channel',
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.channels) {
        setChannels(result.data.channels);
      } else {
        showAlert('error', 'Failed to fetch channels: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (error) {
      showAlert('error', `Network error: ${(error as Error).message}`);
    } finally {
      setLoadingChannels(false);
    }
  };

  /**
   * Sends a message to the selected Slack channel
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connectionId || !connected) {
      showAlert('error', 'Not connected to Slack');
      return;
    }

    const channelId = useManualInput ? manualChannelId.trim() : selectedChannel;
    if (!channelId) {
      showAlert('error', 'Please select a channel or enter a channel ID');
      return;
    }

    if (!message.trim()) {
      showAlert('error', 'Please enter a message');
      return;
    }

    try {
      setSendingMessage(true);

      const response = await fetch('/api/integrations/slack/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nangoConnectionId: connectionId,
          channel: channelId,
          text: message.trim(),
        }),
      });

      const result = await response.json();

      if (result.success && result.data?.messageId) {
        showAlert('success', 'Message sent successfully!');
        setMessage(''); // Clear the message input
        onMessageSent?.(result.data.messageId);
      } else {
        showAlert('error', 'Failed to send message: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (error) {
      showAlert('error', `Network error: ${(error as Error).message}`);
    } finally {
      setSendingMessage(false);
    }
  };

  /**
   * Shows an alert message
   */
  const showAlert = (type: AlertType, message: string) => {
    setAlert({ type, message, show: true });
    // Auto-hide success alerts after 5 seconds
    if (type === 'success') {
      setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 5000);
    }
  };

  /**
   * Dismisses the current alert
   */
  const dismissAlert = () => {
    setAlert(prev => ({ ...prev, show: false }));
  };

  // Fetch channels when component mounts or connection changes
  useEffect(() => {
    if (connected && connectionId && !useManualInput) {
      fetchChannels();
    }
  }, [connected, connectionId, useManualInput]);

  // Prepare channel options for the select dropdown
  const channelOptions = channels.map(channel => ({
    value: channel.id,
    label: `#${channel.name} ${channel.type === 'private' ? '🔒' : ''} (${channel.memberCount || 0} members)`,
  }));

  const isFormDisabled = !connected || !connectionId;
  const messageLength = message.length;
  const maxMessageLength = 4000; // Slack's character limit

  return (
    <Card
      title="Send Message"
      subtitle="Send a message to a Slack channel as yourself"
      className={className}
    >
      <form onSubmit={handleSendMessage} className="space-y-4">
        {/* Alert */}
        {alert.show && (
          <Alert
            type={alert.type}
            message={alert.message}
            dismissible
            onDismiss={dismissAlert}
          />
        )}

        {/* Channel Selection Toggle */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="channelInputType"
              checked={!useManualInput}
              onChange={() => setUseManualInput(false)}
              disabled={isFormDisabled}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Select from channels</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="channelInputType"
              checked={useManualInput}
              onChange={() => setUseManualInput(true)}
              disabled={isFormDisabled}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Enter channel ID manually</span>
          </label>
        </div>

        {/* Channel Selection */}
        {!useManualInput ? (
          <Select
            label="Channel"
            options={channelOptions}
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            placeholder={loadingChannels ? 'Loading channels...' : 'Select a channel...'}
            disabled={isFormDisabled || loadingChannels}
            helpText="Select a channel from your Slack workspace"
          />
        ) : (
          <Input
            label="Channel ID"
            type="text"
            value={manualChannelId}
            onChange={(e) => setManualChannelId(e.target.value)}
            placeholder="e.g., #general, @username, or C1234567890"
            disabled={isFormDisabled}
            helpText="Enter a channel name (#general), user (@username), or channel ID (C1234567890). We'll automatically join the channel if needed."
          />
        )}

        {/* Message Input */}
        <div className="space-y-1">
          <Textarea
            label="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            rows={4}
            disabled={isFormDisabled}
            helpText={`Character count: ${messageLength}/${maxMessageLength}`}
            error={messageLength > maxMessageLength ? 'Message exceeds character limit' : undefined}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            {!useManualInput && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchChannels}
                loading={loadingChannels}
                disabled={isFormDisabled}
              >
                Refresh Channels
              </Button>
            )}
          </div>

          <Button
            type="submit"
            variant="slack"
            loading={sendingMessage}
            disabled={
              isFormDisabled ||
              sendingMessage ||
              !message.trim() ||
              messageLength > maxMessageLength ||
              (!selectedChannel && !manualChannelId.trim())
            }
          >
            {sendingMessage ? 'Sending...' : 'Send Message'}
          </Button>
        </div>

        {/* Connection Status Warning */}
        {!connected && (
          <Alert
            type="warning"
            message="Please connect to Slack first to send messages"
          />
        )}
      </form>
    </Card>
  );
};

export default SendMessageForm;