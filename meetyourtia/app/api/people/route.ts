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

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await req.json();
    const { people } = body;

    if (!people || !Array.isArray(people) || people.length === 0) {
      return errorResponse('People array is required', 400);
    }

    // Prepare people for insertion
    const peopleToInsert = people.map(person => ({
      user_id: userId,
      name: person.name,
      email: person.email || null,
      phone_number: person.phone || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Insert people (upsert to handle duplicates)
    const { data: insertedPeople, error } = await supabaseAdmin
      .from('people')
      .upsert(peopleToInsert, {
        onConflict: 'user_id,name',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('People insert error:', error);
      return errorResponse('Failed to save people', 500);
    }

    return successResponse({
      people: insertedPeople,
      count: insertedPeople?.length || 0,
    }, `${insertedPeople?.length || 0} people saved successfully`);

  } catch (error: any) {
    console.error('People POST error:', error);
    return errorResponse(error.message || 'Failed to save people', 500);
  }
}
