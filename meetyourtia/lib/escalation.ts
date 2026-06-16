/**
 * Escalation Logic
 * Handles escalating failed calls to the user
 */

import { supabaseAdmin } from './supabase';
import { blandAI } from './bland-ai';
import { analyzeTaskUrgency, needsEscalation } from './urgency-detector';

/**
 * Check if call needs escalation and handle it
 */
export async function handleCallEscalation(callId: string) {
  try {
    // Get call and task details
    const { data: call } = await supabaseAdmin
      .from('ai_calls')
      .select('*, tasks(*)')
      .eq('id', callId)
      .single();

    if (!call || call.status !== 'no_answer') {
      return; // Only escalate no-answer calls
    }

    const task = call.tasks;
    const urgency = analyzeTaskUrgency(task);
    
    // Check if escalation is needed
    if (!needsEscalation(task, task.call_attempts || 0, urgency)) {
      console.log(`No escalation needed for task ${task.id}`);
      return;
    }

    // Check if already escalated
    const { data: existingEscalation } = await supabaseAdmin
      .from('call_escalations')
      .select('*')
      .eq('task_id', task.id)
      .eq('user_notified', false)
      .single();

    if (existingEscalation) {
      console.log(`Task ${task.id} already has pending escalation`);
      return;
    }

    // Create escalation record
    const reason = `${call.recipient_name} did not answer after ${task.call_attempts} attempt(s)`;
    
    const { data: escalation } = await supabaseAdmin
      .from('call_escalations')
      .insert({
        task_id: task.id,
        user_id: call.user_id,
        reason,
        user_notified: false,
        user_call_made: false
      })
      .select()
      .single();

    console.log(`Escalation created for task ${task.id}`);

    // If critical, call the user immediately
    if (urgency.urgency === 'critical' && urgency.escalateMethod === 'call') {
      await escalateViaCall(escalation.id, call.user_id, task, reason);
    }

    return escalation;
  } catch (error: any) {
    console.error('Handle escalation error:', error);
    throw error;
  }
}

/**
 * Escalate to user via phone call
 */
async function escalateViaCall(escalationId: string, userId: string, task: any, reason: string) {
  try {
    // Get user phone number
    const { data: soul } = await supabaseAdmin
      .from('soul')
      .select('phone_number, tia_voice_name, user_name')
      .eq('user_id', userId)
      .single();

    if (!soul?.phone_number) {
      console.error('User phone number not found');
      return;
    }

    // Get user name
    const userName = soul?.user_name ?? 'your manager';
    
    const prompt = `You are Tia, an AI assistant calling ${userName} to flag an urgent situation.
Task: "${task.title}" assigned to ${task.assigned_to}.
Issue: ${reason}.
Be brief and clear: explain what happened, mention how many times you tried to reach ${task.assigned_to}, and ask what action ${userName} would like to take. Keep the call under 90 seconds.`;
    
    // Make the call
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/calls/webhook`;
    
    const result = await blandAI.makeCall({
      phone_number: soul.phone_number,
      task: prompt,
      voice: (soul.tia_voice_name || 'Maya').toLowerCase(),
      webhook: webhookUrl,
      metadata: {
        escalation_id: escalationId,
        task_id: task.id,
        user_id: userId,
        call_type: 'user_escalation'
      },
      max_duration: 120 // 2 minutes for escalation
    });

    // Create call record for user escalation
    const { data: userCall } = await supabaseAdmin
      .from('ai_calls')
      .insert({
        task_id: task.id,
        user_id: userId,
        recipient_phone: soul.phone_number,
        recipient_name: userName,
        call_type: 'user_escalation',
        call_urgency: 'critical',
        attempt_number: 1,
        scheduled_at: new Date().toISOString(),
        initiated_at: new Date().toISOString(),
        status: 'calling',
        bland_call_id: result.call_id
      })
      .select()
      .single();

    // Update escalation record
    await supabaseAdmin
      .from('call_escalations')
      .update({
        user_call_made: true,
        user_call_id: userCall.id,
        user_notified: true
      })
      .eq('id', escalationId);

    console.log(`User escalation call made for task ${task.id}`);
  } catch (error: any) {
    console.error('Escalate via call error:', error);
    throw error;
  }
}

/**
 * Get pending escalations for user
 */
export async function getPendingEscalations(userId: string) {
  try {
    const { data: escalations } = await supabaseAdmin
      .from('call_escalations')
      .select('*, tasks(*)')
      .eq('user_id', userId)
      .eq('user_notified', false)
      .order('escalated_at', { ascending: false });

    return escalations || [];
  } catch (error: any) {
    console.error('Get pending escalations error:', error);
    return [];
  }
}

/**
 * Mark escalation as resolved
 */
export async function resolveEscalation(escalationId: string, notes?: string) {
  try {
    await supabaseAdmin
      .from('call_escalations')
      .update({
        user_notified: true,
        resolved_at: new Date().toISOString(),
        resolution_notes: notes
      })
      .eq('id', escalationId);

    console.log(`Escalation ${escalationId} resolved`);
  } catch (error: any) {
    console.error('Resolve escalation error:', error);
    throw error;
  }
}
