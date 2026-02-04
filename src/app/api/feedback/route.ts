import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const { type, message, email } = await request.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!['bug', 'feature', 'general'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Try to get current user (optional - feedback can be anonymous)
    let userId = null;
    let userEmail = email || null;

    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        userEmail = userEmail || user.email;
      }
    }

    // Store feedback in database
    const { error: insertError } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        type,
        message: message.trim(),
        email: userEmail,
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      // If table doesn't exist, just log for now
      console.log('Feedback received (table may not exist):', {
        type,
        message: message.trim(),
        email: userEmail,
        userId,
      });
      
      // Still return success - we logged it
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
