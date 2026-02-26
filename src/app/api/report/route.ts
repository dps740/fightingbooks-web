import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authorizeAdminRequest } from '@/lib/adminAuth';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key || url.includes('your-project')) {
    return null;
  }
  
  return createClient(url, key);
}

// POST: Submit a content report (from book reader)
export async function POST(request: NextRequest) {
  try {
    const { animalA, animalB, pageId, imageUrl, reason, description } = await request.json();
    
    if (!animalA || !animalB) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const supabase = getSupabase();
    if (!supabase) {
      console.log('📋 CONTENT REPORT (no DB):', JSON.stringify({ animalA, animalB, pageId, reason, description }));
      return NextResponse.json({ success: true, message: 'Report received' });
    }

    // Check for duplicate pending report on same page
    if (pageId) {
      const { data: existing } = await supabase
        .from('content_reports')
        .select('id')
        .eq('animal_a', animalA.toLowerCase())
        .eq('animal_b', animalB.toLowerCase())
        .eq('page_id', pageId)
        .eq('status', 'pending')
        .limit(1);
      
      if (existing && existing.length > 0) {
        return NextResponse.json({ success: true, message: 'Already reported — we\'ll review it soon!' });
      }
    }

    const report = {
      animal_a: animalA.toLowerCase(),
      animal_b: animalB.toLowerCase(),
      page_id: pageId || null,
      image_url: imageUrl || null,
      reason: reason || 'unspecified',
      description: description || null,
      status: 'pending',
      reported_at: new Date().toISOString(),
      ip_hash: request.headers.get('x-forwarded-for')?.split(',')[0]?.slice(-8) || 'unknown',
    };

    const { error } = await supabase
      .from('content_reports')
      .insert(report);

    if (error) {
      console.error('Supabase report error:', error);
      return NextResponse.json({ success: true, message: 'Report received' });
    }

    console.log('🚩 CONTENT REPORT:', `${animalA} vs ${animalB} - ${pageId || 'general'} - ${reason}`);
    return NextResponse.json({ success: true, message: 'Thank you! We\'ll review this soon.' });

  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ success: true, message: 'Report received' });
  }
}

// GET: List reports (admin only)
export async function GET(request: NextRequest) {
  const authorized = await authorizeAdminRequest(request.headers.get('authorization'));
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const status = request.nextUrl.searchParams.get('status') || 'pending';
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');

  const { data: reports, error } = await supabase
    .from('content_reports')
    .select('*')
    .eq('status', status)
    .order('reported_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reports: reports || [] });
}

// PATCH: Update report status (admin only)
export async function PATCH(request: NextRequest) {
  const authorized = await authorizeAdminRequest(request.headers.get('authorization'));
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const { id, status, resolution_action, resolution_notes, resolved_by, ai_assessment } = await request.json();
  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
  }

  const update: Record<string, unknown> = { 
    status,
    reviewed: status === 'resolved' || status === 'dismissed',
  };

  if (resolution_action) update.resolution_action = resolution_action;
  if (resolution_notes) update.resolution_notes = resolution_notes;
  if (resolved_by) update.resolved_by = resolved_by;
  if (ai_assessment) update.ai_assessment = ai_assessment;
  if (status === 'resolved' || status === 'dismissed' || status === 'auto_resolved') {
    update.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('content_reports')
    .update(update)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
