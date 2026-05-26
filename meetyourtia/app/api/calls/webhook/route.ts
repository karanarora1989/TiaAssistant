import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-handler';
import { scheduleRetry } from '@/lib/call-scheduler';
import { handleCallEscalation } from '@/lib/escalation';

/**
 * Webhook handler for Bland AI call status updates
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    
    const {
      call_id: blandCallId,
      status,
      duration,
      transcript,
      recording_url,
      metadata
    } = payload;

    console.log('Bland AI webhook received:', { blandCallId, status, metadata });

    // Find our call record
    const { data: call } = await supabaseAdmin
      .from('ai_calls')
      .select('*')
      .eq('bland_call_id', blandCallId)
      .single();

    if (!call) {
      console.error('Call not found for Bland ID:', blandCallId);
      return errorResponse('Call not found', 404);
    }

    // Calculate cost (Bland AI charges $0.09/minute)
    const costPerMinute = 0.09;
    const durationMinutes = duration / 60;
    const cost = durationMinutes * costPerMinute;

    // Map Bland status to our status
    let callStatus = status;
    if (status === 'completed') {
      callStatus = 'completed';
    } else if (status === 'no-answer' || status === 'busy') {
      callStatus = 'no_answer';
    } else if (status === 'failed') {
      callStatus = 'failed';
    }

    // Update call record
    await supabaseAdmin
      .from('ai_calls')
      .update({
        status: callStatus,
        duration_seconds: duration,
        transcript,
        completed_at: new Date().toISOString(),
        cost_usd: cost
      })
      .eq('id', call.id);

    // Handle based on status
    if (callStatus === 'completed') {
      console.log(`Call ${call.id} completed successfully`);
      
      // TODO: Analyze transcript to extract task status updates
      // For now, just log it
      
    } else if (callStatus === 'no_answer') {
      console.log(`Call ${call.id} not answered, scheduling retry`);
      
      // Schedule retry
      await scheduleRetry(call.id);
      
      // Check if escalation needed
      await handleCallEscalation(call.id);
      
    } else if (callStatus === 'failed') {
      console.log(`Call ${call.id} failed`);
      
      // Check if escalation needed
      await handleCallEscalation(call.id);
    }

    return successResponse({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return errorResponse(error.message || 'Webhook processing failed', 500);
  }
}
