import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { callClaude, parseClaudeJSON } from '@/lib/claude';
import { successResponse, errorResponse } from '@/lib/api-handler';
import { clerkClient } from '@clerk/nextjs/server';

// Force fresh build - using currentUser() for auth without middleware
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await req.json();
    
    const {
      assistantName,
      role,
      people = [],
      phoneNumber,
      communicationStyle,
      sensitiveHandling,
      sensitivityLevel,
      nudgeFrequency,
    } = body;

    // Build Soul document using Claude
    const soulPrompt = `You are synthesizing a Soul document for an AI assistant named ${assistantName}.

The master provided this information during onboarding:
- Role: ${role}
- Key people: ${JSON.stringify(people)}
- Communication style preference: ${communicationStyle}
- Sensitive handling notes: ${sensitiveHandling || 'None provided'}
- Sensitivity level: ${sensitivityLevel}
- Nudge frequency: ${nudgeFrequency}

Generate a complete Soul document in JSON format with these sections:
1. identity (name, role, organization_context, operating_pressure, biggest_recurring_challenge)
2. communication_fingerprint (register, message_length, vocabulary, signature_phrases, context_density, example_messages)
3. delegation_model (style, context_given, deadline_style, escalation_threshold)
4. values (non_negotiables, protects, stress_signals)
5. tia_behaviour_rules (when_talking_to_master, when_acting_as_master)
6. preferences (nudge_style, nudge_frequency, default_assignees)
7. sensitivities (array of people with sensitivity notes)

Return ONLY valid JSON, no markdown.`;

    const soulResponse = await callClaude(
      'You are an expert at building psychological profiles and communication models.',
      [{ role: 'user', content: soulPrompt }],
      { maxTokens: 2000, temperature: 0.7 }
    );

    const soulDocument = parseClaudeJSON<any>(soulResponse.content);
    soulDocument.version = 1;
    soulDocument.persona_name = assistantName;
    soulDocument.onboarding_complete = true;

    // Insert Soul
    await supabaseAdmin
      .from('soul')
      .upsert({
        user_id: userId,
        document: soulDocument,
        version: 1,
        last_updated: new Date().toISOString(),
      });

    // Insert People
    if (people.length > 0) {
      const peopleRows = people.map((p: any) => ({
        user_id: userId,
        name: p.name,
        role: p.role || null,
        sensitivity: sensitivityLevel || 'normal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await supabaseAdmin
        .from('people')
        .insert(peopleRows);
    }

    // Initialize Brain with basic summary
    const brainSummary = {
      role_context: role === 'pm' ? 'Product Manager' : role === 'doctor' ? 'Doctor/Clinician' : 'Professional',
      persona: role,
      open_task_count: 0,
      overdue_count: 0,
      carried_over_count: 0,
      top_entities: [],
      key_people: people.map((p: any) => ({
        name: p.name,
        role: p.role || 'colleague',
        open_tasks_with: 0,
        sensitivity: sensitivityLevel || 'normal',
      })),
      patterns: {
        delegation_ratio: 0,
        tasks_created_last_7_days: 0,
        tasks_closed_last_7_days: 0,
        carry_over_rate: 0,
      },
      last_interaction: new Date().toISOString(),
    };

    await supabaseAdmin
      .from('brain')
      .upsert({
        user_id: userId,
        summary: brainSummary,
        last_updated: new Date().toISOString(),
      });

    // Update Clerk metadata with phone number
    try {
      const client = await clerkClient();
      await client.users.updateUser(userId, {
        publicMetadata: {
          onboarding_complete: true,
          plan: 'free',
          phone_number: phoneNumber || null,
        },
      });
    } catch (clerkError: any) {
      console.error('Clerk metadata update failed (non-critical):', clerkError);
      // Continue anyway - onboarding data is saved in Supabase
    }

    return successResponse({ success: true }, 'Onboarding completed successfully');
  } catch (error: any) {
    console.error('Onboarding completion error:', error);
    return errorResponse(error.message || 'Failed to complete onboarding', 500);
  }
}
