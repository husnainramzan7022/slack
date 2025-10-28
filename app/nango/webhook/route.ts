import { NextRequest, NextResponse } from 'next/server';

/**
 * Alternative Nango Webhook Endpoint
 * Handles webhooks from Nango at the expected /nango/webhook path
 * POST /nango/webhook
 */
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();
    
    console.log('🔔 Received Nango webhook at /nango/webhook:', JSON.stringify(event, null, 2));
    
    // Handle different event types
    if (event.type === 'auth' && event.operation === 'creation' && event.success) {
      const connectionId = event.connectionId;
      const userId = event.endUser?.endUserId;
      
      console.log(`✅ New Slack connection: ${connectionId} for user: ${userId}`);
      
    } else if (event.type === 'auth' && event.operation === 'deletion') {
      const connectionId = event.connectionId;
      console.log(`🗑️ Connection deleted: ${connectionId}`);
      
    } else if (event.type === 'sync') {
      const { syncName, connectionId, success, responseResults, syncType } = event;
      
      console.log(`🔄 Sync event: ${syncName} (${syncType})`);
      console.log(`Connection: ${connectionId}, Success: ${success}`);
      
      if (success && responseResults) {
        console.log(`Results - Added: ${responseResults.added}, Updated: ${responseResults.updated}, Deleted: ${responseResults.deleted}`);
      }
      
    } else {
      console.log('ℹ️ Other webhook event:', event.type, event.operation || 'N/A');
    }
    
    // Always respond with 200 OK
    return NextResponse.json({ 
      received: true, 
      timestamp: new Date().toISOString(),
      eventType: event.type 
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Error processing webhook at /nango/webhook:', error);
    
    // Return 200 to avoid webhook retries
    return NextResponse.json({ 
      error: 'Processing failed',
      timestamp: new Date().toISOString() 
    }, { status: 200 });
  }
}

/**
 * Health check for alternative webhook endpoint
 * GET /nango/webhook
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Alternative Nango webhook endpoint is ready',
    endpoint: '/nango/webhook',
    methods: ['POST'],
    timestamp: new Date().toISOString()
  });
}