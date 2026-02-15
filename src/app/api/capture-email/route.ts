import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from('email_captures').upsert(
      { email: email.toLowerCase().trim(), source: source || 'custom_book_gate' },
      { onConflict: 'email' }
    );

    if (error) {
      // If upsert fails due to no unique constraint, just insert
      const { error: insertError } = await supabase.from('email_captures').insert({
        email: email.toLowerCase().trim(),
        source: source || 'custom_book_gate',
      });
      if (insertError) {
        console.error('Email capture error:', insertError);
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Email capture error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
