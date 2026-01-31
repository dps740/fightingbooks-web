import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { appendFile } from 'fs/promises';
import { join } from 'path';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key || url.includes('your-project')) {
    return null; // Not configured yet
  }
  
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const { animalA, animalB, reason, details } = await request.json();
    
    if (!animalA || !animalB) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const report = {
      animal_a: animalA,
      animal_b: animalB,
      reason: reason || 'unspecified',
      details: details || null,
      reported_at: new Date().toISOString(),
      ip_hash: request.headers.get('x-forwarded-for')?.split(',')[0]?.slice(-8) || 'unknown',
    };
    
    const supabase = getSupabase();
    
    if (supabase) {
      // Store in Supabase if configured
      const { error } = await supabase
        .from('content_reports')
        .insert(report);
      
      if (error) {
        console.error('Supabase report error:', error);
      }
    } else {
      // Fallback: log to console (visible in Vercel logs)
      console.log('📋 CONTENT REPORT:', JSON.stringify(report));
    }
    
    return NextResponse.json({ success: true, message: 'Thank you for your report!' });
    
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ success: true, message: 'Report received' }); // Don't show errors to user
  }
}
