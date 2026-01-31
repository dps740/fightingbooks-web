import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const { animalA, animalB, reason, details } = await request.json();
    
    if (!animalA || !animalB) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    
    // Store the report
    const { error } = await supabase
      .from('content_reports')
      .insert({
        animal_a: animalA,
        animal_b: animalB,
        reason: reason || 'unspecified',
        details: details || null,
        reported_at: new Date().toISOString(),
        ip_hash: request.headers.get('x-forwarded-for')?.split(',')[0]?.slice(-8) || 'unknown', // Last 8 chars only for privacy
      });
    
    if (error) {
      console.error('Report error:', error);
      // Don't fail - reports are not critical
    }
    
    return NextResponse.json({ success: true, message: 'Thank you for your report!' });
    
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ success: true, message: 'Report received' }); // Don't show errors to user
  }
}
