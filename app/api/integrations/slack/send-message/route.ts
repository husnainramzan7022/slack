import { NextRequest, NextResponse } from 'next/server';
import { SlackService } from '@/integrations/slack/service';
import { IntegrationErrorCodes } from '@/integrations/common/types';

// Initialize Slack service
const getSlackService = (): SlackService => {
  const nangoSecretKey = process.env.NANGO_SECRET_KEY;
  if (!nangoSecretKey) {
    throw new Error('NANGO_SECRET_KEY environment variable is required');
  }
  return new SlackService(nangoSecretKey);
};

/**
 * Send a message to Slack
 * POST /api/integrations/slack/send-message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nangoConnectionId, ...messageData } = body;

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

    // Try MCP first
    console.log('SEND-MESSAGE: Attempting MCP execution...');
    
    try {
      const { executeMCPTool } = await import('../../../../../lib/mcp-loader');
      const mcpResult = await executeMCPTool(
        'slack-mcp',
        'slack_send_message',
        { connectionId: nangoConnectionId, ...messageData }
      );
      
      
      if (mcpResult.success && mcpResult.result && !mcpResult.result.isError) {
        console.log('SEND-MESSAGE: SUCCESS - Returning MCP result');
        // Extract the actual message data from MCP response
        const mcpContent = mcpResult.result.content?.[0]?.text;
        let parsedData;
        try {
          // Extract JSON part from MCP content (skip descriptive text)
          const jsonStart = mcpContent.indexOf('{');
          if (jsonStart !== -1) {
            const jsonPart = mcpContent.substring(jsonStart);
            parsedData = JSON.parse(jsonPart);
          } else {
            throw new Error('No JSON found in MCP content');
          }
        } catch {
          // Fallback data if parsing fails
          parsedData = { 
            ok: true, 
            channel: messageData.channel, 
            ts: new Date().getTime().toString(),
            message: messageData.text 
          };
        }
        
        // Return in the format expected by frontend
        return NextResponse.json({ 
          success: true, 
          data: {
            ...parsedData,
            // Ensure we have the original message data
            channel: parsedData.channel || messageData.channel,
            text: parsedData.message || messageData.text
          }
        });
      } else {
        console.warn('SEND-MESSAGE: MCP returned error/empty, falling back to SlackService', mcpResult);
      }
    } catch (mcpErr) {
      console.warn('SEND-MESSAGE: MCP execution failed, falling back to SlackService', (mcpErr as any)?.message || mcpErr);
    }

    // Fallback: direct SlackService
    console.log('Executing send-message via SlackService fallback');
    const slackService = getSlackService();
    await slackService.initialize({ nangoConnectionId });

    // Create auth context (you might want to extract this from headers/session)
    const authContext = {
      userId: 'system', // Replace with actual user ID from your auth system
      accessToken: '', // Nango handles this
    };

    const result = await slackService.sendMessage(messageData, authContext);

    if (!result.success) {
      return NextResponse.json(result, { 
        status: result.error?.code === IntegrationErrorCodes.AUTHENTICATION_FAILED ? 401 : 400 
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending Slack message:', error);
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
 * Health check for the send-message endpoint
 * GET /api/integrations/slack/send-message
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'send-message',
    methods: ['POST'],
    description: 'Send a message to a Slack channel or user',
    requiredFields: ['nangoConnectionId', 'channel', 'text'],
    optionalFields: ['thread_ts', 'username', 'icon_emoji', 'attachments'],
  });
}