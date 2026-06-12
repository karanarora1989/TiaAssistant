/**
 * Call Scheduler
 * Manages scheduling and execution of AI calls
 */

import { supabaseAdmin } from './supabase';
import { blandAI } from './bland-ai';
import {
  analyzeTaskUrgency,
  calculateCallTime,
  calculateNextRetry,
  determineCallType,
  getHoursFromDue
} from './urgency-detector';

interface ScheduleCallParams {
  taskId: string;
  userId: string;
  recipientPhone: string;
  recipientName: string;
}

/**
 * Schedule a call for a task
 */
export async function scheduleCall(params: ScheduleCallParams) {
  try {
    // Get task details
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', params.taskId)
      .single();

    if (!task) {
      throw new Error('Task not found');
    }

    // Analyze urgency
    const urgency = analyzeTaskUrgency(task);
    
    // Calculate call time
    const callTime = calculateCallTime(task, urgency);
    
    // Determine call type
    const callType = determineCallType(task);
    
    // Update task with call info
    await supabaseAdmin
      .from('tasks')
      .update({
        call_urgency: urgency.urgency,
        call_scheduled_at: callTime.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.taskId);
    
    // Create call record
    const { data: callRecord } = await supabaseAdmin
      .from('ai_calls')
      .insert({
        task_id: params.taskId,
        user_id: params.userId,
        recipient_phone: params.recipientPhone,
        recipient_name: params.recipientName,
        call_type: callType,
        call_urgency: urgency.urgency,
        attempt_number: (task.call_attempts || 0) + 1,
        scheduled_at: callTime.toISOString(),
        status: 'scheduled'
      })
      .select()
      .single();
    
    console.log(`Call scheduled for task ${params.taskId} at ${callTime.toISOString()}`);
    
    return callRecord;
  } catch (error: any) {
    console.error('Schedule call error:', error);
    throw error;
  }
}

/**
 * Execute a scheduled call
 */
export async function executeCall(callId: string) {
  try {
    // Get call details
    const { data: call } = await supabaseAdmin
      .from('ai_calls')
      .select('*, tasks(*)')
      .eq('id', callId)
      .single();

    if (!call) {
      throw new Error('Call not found');
    }

    // Get user info for voice name
    const { data: soul } = await supabaseAdmin
      .from('soul')
      .select('tia_voice_name')
      .eq('user_id', call.user_id)
      .single();

    const voiceName = soul?.tia_voice_name || 'Maya';
    
    // Validate required env vars before attempting the call
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const blandApiKey = process.env.BLAND_API_KEY;
    if (!appUrl || !blandApiKey) {
      const missing = [!appUrl && 'NEXT_PUBLIC_APP_URL', !blandApiKey && 'BLAND_API_KEY']
        .filter(Boolean).join(', ');
      await supabaseAdmin.from('ai_calls').update({
        status: 'failed',
        completed_at: new Date().toISOString()
      }).eq('id', callId);
      throw new Error(`Missing required env vars: ${missing}`);
    }

    // Build prompt based on call type
    let prompt = '';
    const task = call.tasks;
    const hoursFromDue = Math.abs(getHoursFromDue(task));
    
    // Get user name from soul or default
    const userName = 'Karan'; // TODO: Get from soul table
    
    switch (call.call_type) {
      case 'assignment':
        prompt = blandAI.buildAssignmentPrompt(task, userName);
        break;
      case 'reminder':
        prompt = blandAI.buildReminderPrompt(task, userName, hoursFromDue);
        break;
      case 'followup':
        prompt = blandAI.buildFollowupPrompt(task, userName, hoursFromDue);
        break;
    }
    
    // Update call status
    await supabaseAdmin
      .from('ai_calls')
      .update({
        status: 'calling',
        initiated_at: new Date().toISOString()
      })
      .eq('id', callId);
    
    // Make the call
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/calls/webhook`;
    
    const result = await blandAI.makeCall({
      phone_number: call.recipient_phone,
      task: prompt,
      voice: voiceName.toLowerCase(),
      webhook: webhookUrl,
      metadata: {
        call_id: callId,
        task_id: call.task_id,
        user_id: call.user_id,
        call_type: call.call_type
      }
    });
    
    // Update with Bland call ID
    await supabaseAdmin
      .from('ai_calls')
      .update({
        bland_call_id: result.call_id
      })
      .eq('id', callId);
    
    // Update task
    await supabaseAdmin
      .from('tasks')
      .update({
        call_attempts: (task.call_attempts || 0) + 1,
        last_call_at: new Date().toISOString()
      })
      .eq('id', call.task_id);
    
    console.log(`Call executed: ${callId}, Bland ID: ${result.call_id}`);
    
    return result;
  } catch (error: any) {
    console.error('Execute call error:', error);
    
    // Mark call as failed
    await supabaseAdmin
      .from('ai_calls')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('id', callId);
    
    throw error;
  }
}

/**
 * Schedule retry for failed call
 */
export async function scheduleRetry(callId: string) {
  try {
    // Get call and task details
    const { data: call } = await supabaseAdmin
      .from('ai_calls')
      .select('*, tasks(*)')
      .eq('id', callId)
      .single();

    if (!call) {
      throw new Error('Call not found');
    }

    const task = call.tasks;
    const urgency = analyzeTaskUrgency(task);
    
    // Calculate next retry time
    const lastCallTime = new Date(call.initiated_at || call.scheduled_at);
    const nextRetry = calculateNextRetry(lastCallTime, call.attempt_number, urgency);
    
    if (!nextRetry) {
      console.log(`No more retries for call ${callId}`);
      return null;
    }
    
    // Update task with next retry time
    await supabaseAdmin
      .from('tasks')
      .update({
        next_retry_at: nextRetry.toISOString()
      })
      .eq('id', task.id);
    
    // Schedule new call
    const newCall = await scheduleCall({
      taskId: task.id,
      userId: call.user_id,
      recipientPhone: call.recipient_phone,
      recipientName: call.recipient_name
    });
    
    console.log(`Retry scheduled for task ${task.id} at ${nextRetry.toISOString()}`);
    
    return newCall;
  } catch (error: any) {
    console.error('Schedule retry error:', error);
    throw error;
  }
}

/**
 * Get calls that need to be executed now
 */
export async function getPendingCalls() {
  try {
    const now = new Date().toISOString();
    
    const { data: calls } = await supabaseAdmin
      .from('ai_calls')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(10);
    
    return calls || [];
  } catch (error: any) {
    console.error('Get pending calls error:', error);
    return [];
  }
}
