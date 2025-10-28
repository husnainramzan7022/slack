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
 * Get channels from Slack workspace
 * POST /api/integrations/slack/channels
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nangoConnectionId, ...queryParams } = body;

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
    console.log('CHANNELS: Attempting MCP execution...');
    
    try {
      const { executeMCPTool } = await import('../../../../../lib/mcp-loader');
      const mcpResult = await executeMCPTool(
        'slack-mcp',
        'slack_get_channels',
        { connectionId: nangoConnectionId, ...queryParams }
      );
      
    //   console.log('CHANNELS: MCP result:', mcpResult);
      
      if (mcpResult.success && mcpResult.result && !mcpResult.result.isError) {
        console.log('CHANNELS: SUCCESS - Returning MCP result');
        
        // Parse MCP response - it includes descriptive text + JSON
        const mcpContent = mcpResult.result.content?.[0]?.text;
        let channelsData;
        try {
          const jsonStart = mcpContent.indexOf('{');
          if (jsonStart !== -1) {
            const jsonPart = mcpContent.substring(jsonStart);
            channelsData = JSON.parse(jsonPart);
          } else {
            throw new Error('No JSON found in MCP content');
          }
        } catch (parseErr) {
          console.log('CHANNELS: Failed to parse MCP content, using fallback');
          channelsData = { channels: [], nextCursor: '', total: 0 };
        }
        
        // Return the exact same format as SlackService would
        return NextResponse.json({ 
          success: true, 
          data: {
            channels: channelsData.channels || [],
            nextCursor: channelsData.nextCursor || '',
            total: channelsData.total || 0
          }
        });
      } else {
        console.warn('CHANNELS: MCP returned error/empty, falling back to SlackService', mcpResult);
      }
    } catch (mcpErr) {
      console.warn('CHANNELS: MCP execution failed, falling back to SlackService', (mcpErr as any)?.message || mcpErr);
    }

    // Fallback: direct SlackService call (preserves existing behavior)
    const slackService = getSlackService();
    await slackService.initialize({ nangoConnectionId });

    // Create auth context
    const authContext = {
      userId: 'system',
      accessToken: '',
    };

    const result = await slackService.getChannels(queryParams, authContext);

    if (!result.success) {
      return NextResponse.json(result, { 
        status: result.error?.code === IntegrationErrorCodes.AUTHENTICATION_FAILED ? 401 : 400 
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching Slack channels:', error);
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
 * Health check for the channels endpoint
 * GET /api/integrations/slack/channels
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'channels',
    methods: ['POST'],
    description: 'Get list of channels from Slack workspace',
    requiredFields: ['nangoConnectionId'],
    optionalFields: ['cursor', 'limit', 'exclude_archived', 'types'],
  });
}