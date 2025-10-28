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
 * Get user info from Slack
 * POST /api/integrations/slack/user-info
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nangoConnectionId, user, ...queryParams } = body;

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

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: IntegrationErrorCodes.MISSING_REQUIRED_FIELD,
            message: 'user ID is required',
          },
        },
        { status: 400 }
      );
    }

    const slackService = getSlackService();
    
    // Try MCP first
    console.log('USER-INFO: Attempting MCP execution...');
    
    try {
      const { executeMCPTool } = await import('../../../../../lib/mcp-loader');
      const mcpResult = await executeMCPTool(
        'slack-mcp',
        'slack_get_user_info',
        { connectionId: nangoConnectionId, user, ...queryParams }
      );
      
      console.log('USER-INFO: MCP result:', mcpResult);
      
      if (mcpResult.success && mcpResult.result && !mcpResult.result.isError) {
        console.log('USER-INFO: SUCCESS - Returning MCP result');
        // Parse MCP response - it includes descriptive text + JSON
        const mcpContent = mcpResult.result.content?.[0]?.text;
        let userInfoData;
        try {
          const jsonStart = mcpContent.indexOf('{');
          if (jsonStart !== -1) {
            const jsonPart = mcpContent.substring(jsonStart);
            userInfoData = JSON.parse(jsonPart);
          } else {
            throw new Error('No JSON found in MCP content');
          }
        } catch (parseErr) {
          console.log('USER-INFO: Failed to parse MCP content, using fallback');
          userInfoData = {};
        }
        
        return NextResponse.json({ success: true, data: userInfoData });
      } else {
        console.warn('USER-INFO: MCP returned error/empty, falling back to SlackService', mcpResult);
      }
    } catch (mcpErr) {
      console.warn('USER-INFO: MCP execution failed, falling back to SlackService', (mcpErr as any)?.message || mcpErr);
    }

    // Fallback to direct SlackService
    await slackService.initialize({ nangoConnectionId });

    // Create auth context
    const authContext = {
      userId: 'system',
      accessToken: '',
    };

    const result = await slackService.getUserInfo({ user, ...queryParams }, authContext);

    if (!result.success) {
      return NextResponse.json(result, { 
        status: result.error?.code === IntegrationErrorCodes.AUTHENTICATION_FAILED ? 401 : 
                result.error?.code === IntegrationErrorCodes.RESOURCE_NOT_FOUND ? 404 : 400 
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching Slack user info:', error);
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
 * Health check for the user-info endpoint
 * GET /api/integrations/slack/user-info
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'user-info',
    methods: ['POST'],
    description: 'Get information about a specific Slack user',
    requiredFields: ['nangoConnectionId', 'user'],
    optionalFields: ['include_locale'],
  });
}