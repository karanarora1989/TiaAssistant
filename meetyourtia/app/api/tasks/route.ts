import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-handler';

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const { searchParams } = new URL(req.url);
    
    const view = searchParams.get('view') || 'today'; // today, upcoming, all
    const status = searchParams.get('status') || 'open'; // open, done, blocked
    const domain = searchParams.get('domain'); // work, personal

    let query = supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    // Filter by status (include both 'open' and 'not_started' for active tasks)
    if (status === 'open') {
      query = query.in('status', ['open', 'not_started']);
    } else if (status) {
      query = query.eq('status', status);
    }

    // Filter by domain
    if (domain) {
      query = query.eq('task_domain', domain);
    }

    // Filter by view
    if (view === 'today') {
      // Show ONLY tasks due today
      const today = new Date().toISOString().split('T')[0];
      query = query.eq('due_date_iso', today);
    } else if (view === 'upcoming') {
      // Show tasks from tomorrow to today+5 (inclusive)
      const tomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const fiveDaysLater = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      query = query.gte('due_date_iso', tomorrow).lte('due_date_iso', fiveDaysLater);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Tasks fetch error:', error);
      return errorResponse('Failed to fetch tasks', 500);
    }

    // Priority ranking logic
    const rankedTasks = tasks.sort((a: any, b: any) => {
      // 1. Carried over tasks first (more days = higher priority)
      const carryDiff = (b.carry_over_count || 0) - (a.carry_over_count || 0);
      if (carryDiff !== 0) return carryDiff;

      // 2. Hard deadlines before soft/flexible
      const timeSensitivityOrder = { hard: 3, soft: 2, flexible: 1 };
      const timeDiff = (timeSensitivityOrder[b.time_sensitivity as keyof typeof timeSensitivityOrder] || 0) - 
                       (timeSensitivityOrder[a.time_sensitivity as keyof typeof timeSensitivityOrder] || 0);
      if (timeDiff !== 0) return timeDiff;

      // 3. Priority (high > medium > low)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                           (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      if (priorityDiff !== 0) return priorityDiff;

      // 4. Due date (earlier first)
      if (a.due_date_iso && b.due_date_iso) {
        return new Date(a.due_date_iso).getTime() - new Date(b.due_date_iso).getTime();
      }

      // 5. Created date (older first)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return successResponse({
      tasks: rankedTasks,
      count: rankedTasks.length,
    });

  } catch (error: any) {
    console.error('Tasks API error:', error);
    return errorResponse(error.message || 'Failed to fetch tasks', 500);
  }
}
