import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-handler';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id: personId } = await params;
    const body = await req.json();
    const { role, phone_number } = body;

    const { data: person } = await supabaseAdmin
      .from('people')
      .select('id')
      .eq('id', personId)
      .eq('user_id', userId)
      .single();

    if (!person) return errorResponse('Person not found', 404);

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (role !== undefined) updates.role = role || null;
    if (phone_number !== undefined) updates.phone_number = phone_number || null;

    const { error } = await supabaseAdmin
      .from('people')
      .update(updates)
      .eq('id', personId);

    if (error) return errorResponse('Failed to update', 500);

    return successResponse({ updated: true });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update', 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId();
    const { id: personId } = await params;

    const { data: person } = await supabaseAdmin
      .from('people')
      .select('id')
      .eq('id', personId)
      .eq('user_id', userId)
      .single();

    if (!person) return errorResponse('Person not found', 404);

    const { error } = await supabaseAdmin
      .from('people')
      .delete()
      .eq('id', personId);

    if (error) return errorResponse('Failed to delete', 500);

    return successResponse({ deleted: true });
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete', 500);
  }
}
