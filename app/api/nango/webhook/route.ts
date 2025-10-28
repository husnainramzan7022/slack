import { NextRequest, NextResponse } from 'next/server';

/**
 * Nango Webhook Endpoint
 * Handles webhooks from Nango when connections are created/modified
 * POST /api/nango/webhook
 * 
 * Following the official Nango implementation pattern:
 * Backend → Handle Nango webhook to save the connection_id
 */
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    
    console.log('🔔 Received Nango webhook:', JSON.stringify(event, null, 2));
    
    // Handle successful connection creation
    if (event.type === 'auth' && event.operation === 'creation' && event.success) {
      const connectionId = event.connectionId;
      const userId = event.endUser?.endUserId;
      const userEmail = event.endUser?.email;
      const userDisplayName = event.endUser?.display_name;
      const userTags = event.endUser?.tags;
      
      console.log(`✅ New Slack connection established`);
      console.log(`User: ${userId} (${userEmail})`);
      console.log(`Connection ID: ${connectionId}`);
      
      // Production-ready connection data structure
      const connectionData = {
        userId,
        userEmail,
        userDisplayName,
        connectionId,
        provider: 'slack', 
        integrationId: event.integrationId || 'slack',
        status: 'connected',
        environment: process.env.NODE_ENV || 'production',
        createdAt: new Date().toISOString(),
        webhook: {
          receivedAt: new Date().toISOString(),
          eventId: event.id,
          eventType: `${event.type}/${event.operation}`
        },
        metadata: {
          userTags,
          sessionInfo: userTags?.sessionId ? {
            sessionId: userTags.sessionId,
            source: userTags.source,
            timestamp: userTags.timestamp
          } : null
        }
      };
      
      // TODO: Save to your production database
      // Example:
      // await db.connections.create(connectionData);
      // await db.users.upsert({
      //   id: userId,
      //   email: userEmail,
      //   displayName: userDisplayName,
      //   lastConnectedAt: new Date()
      // });
      
      // For now, log the structured connection data
      console.log('📊 Production connection data:', JSON.stringify(connectionData, null, 2));
      
    } else if (event.type === 'auth' && event.operation === 'creation' && !event.success) {
      // Connection creation failed
      console.error('❌ Connection failed:', event);
      
    } else if (event.type === 'auth' && event.operation === 'deletion') {
      // Connection deleted
      const connectionId = event.connectionId;
      console.log(`🗑️ Connection deleted: ${connectionId}`);
      
      // TODO: Remove from your database
      // await db.connections.delete({ connectionId });
      
    } else {
      // Other webhook types
      console.log('ℹ️ Other webhook type:', event.type, event.operation);
    }
    
    // Always respond with 200 OK
    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Error processing Nango webhook:', error);
    
    // Still return 200 to avoid webhook retries
    return NextResponse.json({ error: 'Processing failed' }, { status: 200 });
  }
}

/**
 * Health check endpoint for webhook
 * GET /api/nango/webhook
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Nango webhook endpoint is ready',
    endpoint: '/api/nango/webhook',
    methods: ['POST'],
    timestamp: new Date().toISOString()
  });
}