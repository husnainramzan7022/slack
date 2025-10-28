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
 * Health check for Slack integration
 * POST /api/integrations/slack/health
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nangoConnectionId } = body;

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

    const slackService = getSlackService();
    
    // Try MCP first
    console.log('HEALTH: Attempting MCP execution...');
    
    try {
      const { executeMCPTool } = await import('../../../../../lib/mcp-loader');
      const mcpResult = await executeMCPTool(
        'slack-mcp',
        'slack_health_check',
        { connectionId: nangoConnectionId }
      );
      
      console.log('HEALTH: MCP result:', mcpResult);
      
      if (mcpResult.success && mcpResult.result && !mcpResult.result.isError) {
        console.log('HEALTH: SUCCESS - Returning MCP result');
        // Parse MCP response - it includes descriptive text + JSON
        const mcpContent = mcpResult.result.content?.[0]?.text;
        let healthData;
        try {
          const jsonStart = mcpContent.indexOf('{');
          if (jsonStart !== -1) {
            const jsonPart = mcpContent.substring(jsonStart);
            healthData = JSON.parse(jsonPart);
          } else {
            throw new Error('No JSON found in MCP content');
          }
        } catch (parseErr) {
          console.log('HEALTH: Failed to parse MCP content, using fallback');
          healthData = { status: 'healthy', timestamp: new Date().toISOString() };
        }
        
        return NextResponse.json({ 
          success: true, 
          data: healthData, 
          meta: { timestamp: new Date().toISOString(), integration: 'slack', version: 'mcp' } 
        });
      } else {
        console.warn('HEALTH: MCP returned error/empty, falling back to SlackService', mcpResult);
      }
    } catch (mcpErr) {
      console.warn('HEALTH: MCP execution failed, falling back to SlackService', (mcpErr as any)?.message || mcpErr);
    }

    // Fallback to direct SlackService
    await slackService.initialize({ nangoConnectionId });

    // Perform health check
    const healthCheck = await slackService.testConnection();

    return NextResponse.json({
      success: true,
      data: healthCheck,
      meta: {
        timestamp: new Date().toISOString(),
        integration: 'slack',
        version: '1.0.0',
      },
    });
  } catch (error) {
    console.error('Error checking Slack health:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: IntegrationErrorCodes.API_ERROR,
          message: 'Health check failed',
          details: process.env.NODE_ENV === 'development' ? { error: (error as Error).message } : {},
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Get health check info
 * GET /api/integrations/slack/health
 */
export async function GET() {
  return NextResponse.json({
    endpoint: 'health',
    methods: ['POST'],
    description: 'Check the health and connectivity of Slack integration',
    requiredFields: ['nangoConnectionId'],
    optionalFields: [],
  });
}