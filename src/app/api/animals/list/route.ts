import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface CustomAnimal {
  id: string;
  name: string;
  slug: string;
  category: string;
  scope: string;
  status: string;
  images: Record<string, string> | null;
  facts: Record<string, unknown> | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();

    // Try to get authenticated user
    let userId: string | null = null;
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('sb-access-token')?.value;
      if (token) {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) userId = user.id;
      }
    } catch {
      // Not authenticated, that's fine
    }

    // Fetch all global animals with status='ready'
    const { data: globalAnimals, error: globalError } = await supabase
      .from('custom_animals')
      .select('id, name, slug, category, scope, status, images, facts, created_at')
      .eq('scope', 'global')
      .eq('status', 'ready')
      .order('created_at', { ascending: true });

    if (globalError) {
      console.error('Error fetching global animals:', globalError);
      return NextResponse.json({ error: 'Failed to fetch animals' }, { status: 500 });
    }

    // Fetch user's custom animals (any status) if authenticated
    let customAnimals: CustomAnimal[] = [];
    if (userId) {
      const { data: userAnimals, error: userError } = await supabase
        .from('custom_animals')
        .select('id, name, slug, category, scope, status, images, facts, created_at')
        .eq('created_by', userId)
        .eq('scope', 'user')
        .order('created_at', { ascending: false });

      if (userError) {
        console.error('Error fetching user animals:', userError);
      } else {
        customAnimals = userAnimals || [];
      }
    }

    return NextResponse.json({
      global: (globalAnimals || []) as CustomAnimal[],
      custom: customAnimals,
    });
  } catch (error) {
    console.error('[ANIMALS-LIST] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
