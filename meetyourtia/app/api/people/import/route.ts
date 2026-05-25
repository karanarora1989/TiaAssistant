import { NextRequest } from 'next/server';
import { getAuthUserId } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api-handler';

interface ImportContact {
  name: string;
  email?: string;
  phone?: string;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthUserId();
    const body = await req.json();
    const { contacts } = body as { contacts: ImportContact[] };

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return errorResponse('No contacts provided', 400);
    }

    // Validate contacts
    const validContacts = contacts.filter(c => c.name && c.name.trim().length > 0);

    if (validContacts.length === 0) {
      return errorResponse('No valid contacts to import', 400);
    }

    // Get existing people to check for duplicates
    const { data: existingPeople } = await supabaseAdmin
      .from('people')
      .select('name')
      .eq('user_id', userId);

    const existingNames = new Set(
      (existingPeople || []).map((p: any) => p.name.toLowerCase().trim())
    );

    // Filter out duplicates
    const newContacts = validContacts.filter(
      c => !existingNames.has(c.name.toLowerCase().trim())
    );

    const duplicates = validContacts.filter(
      c => existingNames.has(c.name.toLowerCase().trim())
    );

    // Bulk insert new contacts
    if (newContacts.length > 0) {
      const { data: insertedPeople, error: insertError } = await supabaseAdmin
        .from('people')
        .insert(
          newContacts.map(c => ({
            user_id: userId,
            name: c.name.trim(),
            email: c.email?.trim() || null,
            phone_number: c.phone?.trim() || null,
            sensitivity: 'medium',
            created_at: new Date().toISOString(),
          }))
        )
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        return errorResponse('Failed to import contacts', 500);
      }

      return successResponse({
        imported: newContacts.length,
        skipped: duplicates.length,
        duplicates: duplicates.map(d => d.name),
        people: insertedPeople,
      }, `Imported ${newContacts.length} contact${newContacts.length > 1 ? 's' : ''}`);
    }

    return successResponse({
      imported: 0,
      skipped: duplicates.length,
      duplicates: duplicates.map(d => d.name),
      people: [],
    }, 'All contacts already exist');

  } catch (error: any) {
    console.error('Import API error:', error);
    return errorResponse(error.message || 'Failed to import contacts', 500);
  }
}
