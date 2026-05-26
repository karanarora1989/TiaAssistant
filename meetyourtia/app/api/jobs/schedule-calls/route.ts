import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-handler';
import { getPendingCalls, executeCall } from '@/lib/call-scheduler';

/**
 * Cron job to execute scheduled calls
 * Should be called every minute by Vercel Cron or similar
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return errorResponse('Unauthorized', 401);
    }

    console.log('Running call scheduler cron job...');

    // Get calls that need to be executed now
    const pendingCalls = await getPendingCalls();

    if (pendingCalls.length === 0) {
      console.log('No pending calls to execute');
      return successResponse({ 
        executed: 0,
        message: 'No pending calls'
      });
    }

    console.log(`Found ${pendingCalls.length} pending calls`);

    // Execute each call
    const results = [];
    for (const call of pendingCalls) {
      try {
        await executeCall(call.id);
        results.push({ callId: call.id, status: 'success' });
      } catch (error: any) {
        console.error(`Failed to execute call ${call.id}:`, error);
        results.push({ callId: call.id, status: 'failed', error: error.message });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    console.log(`Call execution complete: ${successCount} success, ${failedCount} failed`);

    return successResponse({
      executed: successCount,
      failed: failedCount,
      results
    });
  } catch (error: any) {
    console.error('Schedule calls cron error:', error);
    return errorResponse(error.message || 'Cron job failed', 500);
  }
}
