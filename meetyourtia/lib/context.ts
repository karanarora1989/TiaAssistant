import { supabaseAdmin } from './supabase';
import { trimContext } from './claude';

/**
 * Build context for Claude from Brain + Soul
 * Returns formatted context string ready for injection into system prompt
 */
export async function buildContext(userId: string): Promise<string> {
  try {
    // Fetch Brain summary
    const { data: brain } = await supabaseAdmin
      .from('brain')
      .select('summary')
      .eq('user_id', userId)
      .single();

    // Fetch Soul document
    const { data: soul } = await supabaseAdmin
      .from('soul')
      .select('document')
      .eq('user_id', userId)
      .single();

    if (!brain || !soul) {
      return 'No context available yet. User is new.';
    }

    // Format context
    const context = `
# MASTER CONTEXT

## Soul — Who the Master Is
${JSON.stringify(soul.document, null, 2)}

## Brain — What Tia Knows About the Master's World
${JSON.stringify(brain.summary, null, 2)}
`.trim();

    // Trim if too long (max ~1800 tokens ≈ 7200 chars)
    return trimContext(context, 1800);
  } catch (error) {
    console.error('Error building context:', error);
    return 'Error loading context. Proceeding without full context.';
  }
}

/**
 * Get recent tasks for context (used in some flows)
 */
export async function getRecentTasks(userId: string, limit: number = 10) {
  const { data: tasks } = await supabaseAdmin
    .from('tasks')
    .select('id, title, status, due_date, assigned_to, entity_name')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  return tasks || [];
}

/**
 * Get open tasks count for free tier check
 */
export async function getOpenTasksCount(userId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'open')
    .eq('archived', false);

  return count || 0;
}
