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
    
    // Initialize with the connection ID
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