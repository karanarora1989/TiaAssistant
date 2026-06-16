import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-handler';
import { getPendingCalls, groupByAssignee, executeGroup } from '@/lib/call-scheduler';

export async function GET(req: NextRequest) {
  try {
    console.log('Running call scheduler cron job...');

    const pendingCalls = await getPendingCalls();

    if (pendingCalls.length === 0) {
      console.log('No pending calls to execute');
      return successResponse({ executed: 0, message: 'No pending calls' });
    }

    console.log(`Found ${pendingCalls.length} pending calls`);

    const groups = groupByAssignee(pendingCalls);
    console.log(`Batched into ${groups.length} group(s)`);

    const results = [];
    for (const group of groups) {
      try {
        await executeGroup(group);
        results.push({ callIds: group.calls.map(c => c.callId), status: 'success' });
      } catch (error: any) {
        console.error('Failed to execute group:', error);
        results.push({
          callIds: group.calls.map(c => c.callId),
          status: 'failed',
          error: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    console.log(`Call execution complete: ${successCount} success, ${failedCount} failed`);

    return successResponse({ executed: successCount, failed: failedCount, results });
  } catch (error: any) {
    console.error('Schedule calls cron error:', error);
    return errorResponse(error.message ?? 'Cron job failed', 500);
  }
}
