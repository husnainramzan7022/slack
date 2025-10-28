import { Nango } from '@nangohq/node';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Session Token Endpoint
 * Creates a Nango session token for OAuth flow
 * POST /api/nango/session-token
 * 
 * Following the official Nango implementation pattern:
 * Backend → Create a session token with Nango
 * Frontend → Use that token to open the Nango Connect UI
 */
export async function POST(request: NextRequest) {
  try {
    const nangoSecretKey = process.env.NANGO_SECRET_KEY;
    if (!nangoSecretKey) {
      return NextResponse.json(
        { error: 'NANGO_SECRET_KEY environment variable is required' },
        { status: 500 }
      );
    }

    // Initialize Nango with secret key
    const nango = new Nango({ secretKey: nangoSecretKey });

    // Get user info from request body (production-ready)
    const body = await request.json().catch(() => ({}));
    const { userId, email, name } = body;

    // Generate unique identifiers for production
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);

    // Create end user object with dynamic data
    const endUser = {
      id: userId || `user_${timestamp}_${randomId}`, // Unique user ID for production
      email: email || `user_${timestamp}@pario.dev`, // Dynamic email domain
      display_name: name || `Pario User ${new Date().toLocaleDateString()}`, // Dynamic display name with date
      tags: {
        source: 'pario-integration',
        environment: process.env.NODE_ENV || 'production',
        timestamp: new Date().toISOString(),
        sessionId: `session_${timestamp}_${randomId}`
      }
    };


    // Create session token using official Nango SDK method
    const response = await nango.createConnectSession({
      end_user: endUser,
      allowed_integrations: ['slack'], // Only allow Slack integration
    });

    console.log('✅ Session token created successfully');

    return NextResponse.json({ 
      sessionToken: response.data.token 
    });

  } catch (error) {
    console.error('Failed to create session token:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create session token',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}