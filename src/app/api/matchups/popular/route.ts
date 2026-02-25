import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { POPULAR_MATCHUP_SEEDS, toBattleSlug } from '@/data/popularMatchups';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function fallbackPopular() {
  return POPULAR_MATCHUP_SEEDS.map((m) => ({
    animal1: m.animal1,
    animal2: m.animal2,
    reason: m.reason,
    href: `/battles/${toBattleSlug(m.animal1, m.animal2)}`,
    clicks: 0,
    source: 'seed' as const,
  }));
}

function seededReason(animal1: string, animal2: string): string {
  const hit = POPULAR_MATCHUP_SEEDS.find(
    (m) =>
      (m.animal1 === animal1 && m.animal2 === animal2) ||
      (m.animal1 === animal2 && m.animal2 === animal1)
  );
  return hit?.reason || 'Trending matchup based on real battle-link clicks';
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('matchup_popularity')
      .select('slug, animal_a, animal_b, clicks')
      .order('clicks', { ascending: false })
      .limit(12);

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        popular: fallbackPopular(),
        source: 'seed',
        note: 'No tracked clicks yet (or popularity table not initialized).',
      });
    }

    const popular = data.map((row) => ({
      animal1: row.animal_a,
      animal2: row.animal_b,
      reason: seededReason(row.animal_a, row.animal_b),
      href: `/battles/${row.slug || toBattleSlug(row.animal_a, row.animal_b)}`,
      clicks: row.clicks || 0,
      source: 'clicks' as const,
    }));

    return NextResponse.json({ popular, source: 'clicks' });
  } catch (error) {
    console.error('Failed loading popular matchups:', error);
    return NextResponse.json({
      popular: fallbackPopular(),
      source: 'seed',
      note: 'Falling back to seeded popular matchups.',
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const animalA = body?.animal1?.toString()?.trim();
    const animalB = body?.animal2?.toString()?.trim();

    if (!animalA || !animalB) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const slug = toBattleSlug(animalA, animalB);
    const supabase = getSupabase();

    const { data: existing, error: readError } = await supabase
      .from('matchup_popularity')
      .select('id, clicks')
      .eq('slug', slug)
      .maybeSingle();

    if (readError) {
      return NextResponse.json({ ok: true, tracked: false });
    }

    if (!existing) {
      await supabase.from('matchup_popularity').insert({
        slug,
        animal_a: animalA,
        animal_b: animalB,
        clicks: 1,
        last_clicked_at: new Date().toISOString(),
      });
    } else {
      await supabase
        .from('matchup_popularity')
        .update({
          clicks: (existing.clicks || 0) + 1,
          last_clicked_at: new Date().toISOString(),
          animal_a: animalA,
          animal_b: animalB,
        })
        .eq('id', existing.id);
    }

    return NextResponse.json({ ok: true, tracked: true });
  } catch {
    return NextResponse.json({ ok: true, tracked: false });
  }
}
