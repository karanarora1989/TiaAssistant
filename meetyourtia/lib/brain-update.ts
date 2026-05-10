import { supabaseAdmin } from './supabase';

/**
 * Update Brain summary after task changes
 * Runs async, non-blocking
 */
export async function updateBrain(userId: string): Promise<void> {
  try {
    // Get all open tasks
    const { data: openTasks } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .eq('archived', false);

    // Get all tasks for patterns
    const { data: allTasks } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', false)
      .order('created_at', { ascending: false })
      .limit(100);

    // Get people registry
    const { data: people } = await supabaseAdmin
      .from('people')
      .select('*')
      .eq('user_id', userId)
      .order('open_task_count', { ascending: false })
      .limit(10);

    // Get entities registry
    const { data: entities } = await supabaseAdmin
      .from('entities')
      .select('*')
      .eq('user_id', userId)
      .order('open_task_count', { ascending: false })
      .limit(10);

    // Get soul for role context
    const { data: soul } = await supabaseAdmin
      .from('soul')
      .select('document')
      .eq('user_id', userId)
      .single();

    // Calculate metrics
    const openCount = openTasks?.length || 0;
    const overdueCount = openTasks?.filter(t => {
      if (!t.due_date_iso) return false;
      return new Date(t.due_date_iso) < new Date();
    }).length || 0;
    const carriedOverCount = openTasks?.filter(t => t.carried_over).length || 0;

    // Calculate patterns from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentTasks = allTasks?.filter(t => 
      new Date(t.created_at!) > sevenDaysAgo
    ) || [];
    
    const recentClosed = allTasks?.filter(t => 
      t.status === 'done' && 
      t.updated_at && 
      new Date(t.updated_at) > sevenDaysAgo
    ) || [];

    const delegatedCount = openTasks?.filter(t => 
      t.assigned_to && t.assigned_to.length > 0 && !t.assigned_to.includes('self')
    ).length || 0;
    
    const delegationRatio = openCount > 0 ? delegatedCount / openCount : 0;

    // Build brain summary
    const brainSummary = {
      role_context: soul?.document?.identity?.role || 'Professional',
      persona: soul?.document?.identity?.persona || 'general',
      open_task_count: openCount,
      overdue_count: overdueCount,
      carried_over_count: carriedOverCount,
      top_entities: entities?.slice(0, 5).map(e => ({
        name: e.entity_name,
        type: e.entity_type,
        open_tasks: e.open_task_count || 0,
      })) || [],
      key_people: people?.slice(0, 5).map(p => ({
        name: p.name,
        role: p.role || 'colleague',
        open_tasks_with: p.open_task_count || 0,
        sensitivity: p.sensitivity || 'normal',
      })) || [],
      patterns: {
        delegation_ratio: Math.round(delegationRatio * 100) / 100,
        tasks_created_last_7_days: recentTasks.length,
        tasks_closed_last_7_days: recentClosed.length,
        carry_over_rate: openCount > 0 ? Math.round((carriedOverCount / openCount) * 100) / 100 : 0,
      },
      last_interaction: new Date().toISOString(),
    };

    // Upsert brain
    await supabaseAdmin
      .from('brain')
      .upsert({
        user_id: userId,
        summary: brainSummary,
        last_updated: new Date().toISOString(),
      });

    console.log(`Brain updated for user ${userId}`);
  } catch (error) {
    console.error('Error updating brain:', error);
    // Don't throw - this is non-blocking
  }
}

/**
 * Update people registry counts
 */
export async function updatePeopleCounts(userId: string, personName: string): Promise<void> {
  try {
    // Get task counts for this person
    const { count: totalCount } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .contains('participants', [personName])
      .eq('archived', false);

    const { count: openCount } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .contains('participants', [personName])
      .eq('status', 'open')
      .eq('archived', false);

    // Update person record
    await supabaseAdmin
      .from('people')
      .update({
        task_count: totalCount || 0,
        open_task_count: openCount || 0,
        last_mentioned: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('name', personName);
  } catch (error) {
    console.error('Error updating people counts:', error);
  }
}

/**
 * Update entity registry counts
 */
export async function updateEntityCounts(userId: string, entityName: string): Promise<void> {
  try {
    // Get task counts for this entity
    const { count: totalCount } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('entity_name', entityName)
      .eq('archived', false);

    const { count: openCount } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('entity_name', entityName)
      .eq('status', 'open')
      .eq('archived', false);

    // Update entity record
    await supabaseAdmin
      .from('entities')
      .update({
        task_count: totalCount || 0,
        open_task_count: openCount || 0,
        last_mentioned: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('entity_name', entityName);
  } catch (error) {
    console.error('Error updating entity counts:', error);
  }
}
