import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-handler';

export async function GET(req: NextRequest) {
  try {
    const userId = await getAuthUserId();

    const { data: people, error } = await supabaseAdmin
      .from('people')
      .select('*')
      .eq('user_id', userId)
      .order('open_task_count', { ascending: false });

    if (error) {
      console.error('People fetch error:', error);
      return errorResponse('Failed to fetch people', 500);
    }

    return successResponse({
      people: people || [],
      count: people?.length || 0,
    });

  } catch (error: any) {
    console.error('People API error:', error);
    return errorResponse(error.message || 'Failed to fetch people', 500);
  }
}
