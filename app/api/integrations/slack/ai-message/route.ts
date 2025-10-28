import { NextRequest, NextResponse } from 'next/server';
import { SlackService } from '../../../../../integrations/slack/service';
import { IntegrationErrorCodes } from '../../../../../integrations/common/types';

// Initialize Slack service
const getSlackService = (): SlackService => {
  const nangoSecretKey = process.env.NANGO_SECRET_KEY;
  if (!nangoSecretKey) {
    throw new Error('NANGO_SECRET_KEY environment variable is required');
  }
  return new SlackService(nangoSecretKey);
};

/**
 * Parse natural language commands for sending Slack messages
 * Examples:
 * - "Hey send 'Hello' to obaidmuneer"
 * - "Send 'Good morning team!' to #general"
 * - "Message 'Meeting in 5 minutes' to the development channel"
 */
function parseAICommand(input: string): { message: string; channel: string } | null {
  const command = input.toLowerCase().trim();
  
  // Pattern 1: "send 'message' to channel/user"
  const pattern1 = /(?:hey\s+)?(?:send|message)\s+['"`]([^'"`]+)['"`]\s+to\s+(.+)/i;
  const match1 = command.match(pattern1);
  
  if (match1) {
    const message = match1[1].trim();
    let channel = match1[2].trim();
    
    // Clean up channel reference and extract proper channel names
    if (channel.includes('/')) {
      // Handle "obaidmuneer/in some channel" -> extract channel part
      const parts = channel.split('/');
      if (parts.length > 1 && parts[1].includes('channel')) {
        // Try to extract channel name from "in some channel"
        const channelPart = parts[1];
        const channelMatch = channelPart.match(/(?:in\s+)?(?:the\s+)?(.+?)(?:\s+channel)?$/);
        if (channelMatch) {
          channel = channelMatch[1].trim();
        }
      } else {
        // Use the first part as username
        channel = `@${parts[0]}`;
      }
    }
    
    // Smart channel name extraction from natural language
    if (!channel.startsWith('#') && !channel.startsWith('@') && !channel.startsWith('C') && !channel.startsWith('D')) {
      // Remove common words and extract the actual channel name
      let cleanChannel = channel.toLowerCase()
        .replace(/^(the\s+|a\s+|an\s+)/, '') // Remove articles
        .replace(/\s+channel$/, '') // Remove trailing "channel"
        .replace(/\s+room$/, '') // Remove trailing "room"
        .replace(/\s+/, '-') // Replace spaces with hyphens (common in Slack)
        .trim();
      
      // Map common natural language terms to actual channel names
      const channelMappings: { [key: string]: string } = {
        'development': 'dev',
        'developer': 'dev',
        'developers': 'dev',
        'programming': 'dev',
        'coding': 'dev',
        'general': 'general',
        'random': 'random',
        'team': 'team',
        'announcements': 'announcements',
        'announce': 'announcements',
        'marketing': 'marketing',
        'sales': 'sales',
        'support': 'support',
        'help': 'support',
        'design': 'design',
        'product': 'product',
        'engineering': 'engineering',
        'tech': 'tech',
        'technology': 'tech'
      };
      
      // Apply mapping if exists
      if (channelMappings[cleanChannel]) {
        cleanChannel = channelMappings[cleanChannel];
      }
      
      channel = `#${cleanChannel}`;
    }
    
    return { message, channel };
  }
  
  // Pattern 2: "tell channel that message"
  const pattern2 = /(?:tell|notify)\s+(.+?)\s+(?:that\s+)?['"`]?([^'"`]+)['"`]?$/i;
  const match2 = command.match(pattern2);
  
  if (match2) {
    let channel = match2[1].trim();
    const message = match2[2].trim();
    
    // Add # prefix for channel names
    if (!channel.startsWith('#') && !channel.startsWith('@') && !channel.startsWith('C') && !channel.startsWith('D')) {
      channel = `#${channel}`;
    }
    
    return { message, channel };
  }
  
  return null;
}

/**
 * AI-driven message sending endpoint
 * POST /api/integrations/slack/ai-message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nangoConnectionId, command, userId } = body;

    if (!nangoConnectionId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: IntegrationErrorCodes.MISSING_REQUIRED_FIELD,
            message: 'nangoConnectionId is required',
          },
        },
        { status: 400 }
      );
    }

    if (!command) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: IntegrationErrorCodes.MISSING_REQUIRED_FIELD,
            message: 'command is required',
          },
        },
        { status: 400 }
      );
    }

    // Try MCP first
    console.log('AI-MESSAGE: Attempting MCP execution...');
    
    try {
      const { executeMCPTool } = await import('../../../../../lib/mcp-loader');
      const mcpResult = await executeMCPTool(
        'slack-mcp',
        'slack_ai_message',
        { connectionId: nangoConnectionId, command }
      );
      
      console.log('AI-MESSAGE: MCP result:', mcpResult);
      
      if (mcpResult.success && mcpResult.result && !mcpResult.result.isError) {
        console.log('AI-MESSAGE: SUCCESS - Returning MCP result');
        // Parse MCP response - it includes descriptive text + JSON
        const mcpContent = mcpResult.result.content?.[0]?.text;
        let aiMessageData;
        try {
          const jsonStart = mcpContent.indexOf('{');
          if (jsonStart !== -1) {
            const jsonPart = mcpContent.substring(jsonStart);
            aiMessageData = JSON.parse(jsonPart);
          } else {
            throw new Error('No JSON found in MCP content');
          }
        } catch (parseErr) {
          console.log('AI-MESSAGE: Failed to parse MCP content, using fallback');
          aiMessageData = {};
        }
        
        // Return the exact format expected by the frontend
        return NextResponse.json({ 
          success: true, 
          data: {
            messageId: aiMessageData?.result?.messageId || aiMessageData?.result?.timestamp || 'mcp-ai-success',
            timestamp: aiMessageData?.result?.timestamp || new Date().toISOString(),
            parsedCommand: {
              originalCommand: aiMessageData?.originalCommand || command,
              extractedMessage: aiMessageData?.parsedMessage || 'Message sent via MCP',
              extractedChannel: aiMessageData?.parsedChannel || 'Unknown channel'
            }
          }
        });
      } else {
        console.warn('AI-MESSAGE: MCP returned error/empty, falling back to SlackService', mcpResult);
      }
    } catch (mcpErr) {
      console.warn('AI-MESSAGE: MCP execution failed, falling back to SlackService', (mcpErr as any)?.message || mcpErr);
    }

    // Fallback: Parse the AI command manually and use SlackService
    console.log('AI-MESSAGE: Executing via SlackService fallback');
    const parsed = parseAICommand(command);
    
    if (!parsed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: IntegrationErrorCodes.INVALID_REQUEST,
            message: 'Could not understand the command. Try formats like: "send \'Hello\' to #general" or "message \'Hi there\' to @username"',
            details: {
              examples: [
                "send 'Hello team!' to #general",
                "message 'Meeting in 5 minutes' to @john",
                "send 'Good morning' to the development channel"
              ]
            }
          },
        },
        { status: 400 }
      );
    }

    const slackService = getSlackService();
    
    // Initialize with the connection ID
    await slackService.initialize({ nangoConnectionId });

    // Create auth context
    const authContext = {
      userId: userId || 'ai-system',
      accessToken: '', // Nango handles this
    };

    // Send the message using the parsed command
    const result = await slackService.sendMessage(
      {
        channel: parsed.channel,
        text: parsed.message,
      },
      authContext
    );

    if (!result.success) {
      // Provide helpful error messages for common issues
      let errorMessage = result.error?.message || 'Unknown error';
      let suggestions: string[] = [];
      
      if (errorMessage.includes('channel_not_found')) {
        errorMessage = `Channel "${parsed.channel}" not found or not accessible`;
        suggestions = [
          `Try using exact channel names like #general, #dev, or #random`,
          `Make sure you're a member of the channel "${parsed.channel}"`,
          `Use @username for direct messages instead of channel names`
        ];
      } else if (errorMessage.includes('not_in_channel')) {
        errorMessage = `You're not a member of channel "${parsed.channel}"`;
        suggestions = [
          `Ask an admin to invite you to ${parsed.channel}`,
          `Try a public channel you're already in like #general`
        ];
      }
      
      return NextResponse.json({
        success: false,
        error: {
          ...result.error,
          message: errorMessage,
          details: {
            originalChannel: parsed.channel,
            suggestions,
            parsedCommand: {
              originalCommand: command,
              extractedMessage: parsed.message,
              extractedChannel: parsed.channel,
            }
          }
        }
      }, { 
        status: result.error?.code === IntegrationErrorCodes.AUTHENTICATION_FAILED ? 401 : 400 
      });
    }

    // Return success with parsed details
    return NextResponse.json({
      ...result,
      data: {
        ...result.data,
        parsedCommand: {
          originalCommand: command,
          extractedMessage: parsed.message,
          extractedChannel: parsed.channel,
        }
      }
    });
  } catch (error) {
    console.error('Error processing AI message command:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: IntegrationErrorCodes.API_ERROR,
          message: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? { error: (error as Error).message } : {},
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Get AI command examples and help
 * GET /api/integrations/slack/ai-message
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      description: 'AI-driven message sending for Slack',
      examples: [
        {
          command: "send 'Hello team!' to #general",
          description: "Send a message to a public channel"
        },
        {
          command: "message 'Meeting in 5 minutes' to @john",
          description: "Send a direct message to a user"
        },
        {
          command: "send 'Good morning' to #dev",
          description: "Send to development channel (maps to #dev)"
        },
        {
          command: "tell #random that 'Coffee break!'",
          description: "Alternative command format"
        }
      ],
      supportedPatterns: [
        "send '[message]' to [channel/user]",
        "message '[message]' to [channel/user]", 
        "tell [channel/user] that '[message]'"
      ],
      channelFormats: [
        "#channelname - for public channels",
        "@username - for direct messages",
        "channel name - will auto-add # prefix for common channels"
      ]
    }
  });
}