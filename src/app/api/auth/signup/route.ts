import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error(`Supabase not configured: URL=${!!url}, KEY=${!!key}`);
  }
  
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }
    
    const supabase = getSupabase();

    // Create user with admin API (auto-confirms email, skips unreliable SMTP)
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (adminError) {
      // Handle "already registered" gracefully
      if (adminError.message?.includes('already been registered')) {
        return NextResponse.json({ error: 'An account with this email already exists. Try signing in instead.' }, { status: 400 });
      }
      return NextResponse.json({ error: adminError.message }, { status: 400 });
    }

    if (!adminData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 400 });
    }

    // Create user record with tier: 'free'
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: adminData.user.id,
        email: adminData.user.email,
        tier: 'free',
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    // Now sign in to get a session (admin.createUser doesn't return a session)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      // User created but couldn't auto-login — they'll need to sign in manually
      return NextResponse.json({ 
        success: true, 
        user: { id: adminData.user.id, email: adminData.user.email },
        needsLogin: true,
      });
    }

    // Set session cookies
    const cookieStore = await cookies();
    cookieStore.set('sb-access-token', signInData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });
    cookieStore.set('sb-refresh-token', signInData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({ 
      success: true, 
      user: { id: adminData.user.id, email: adminData.user.email },
    });
  } catch (error) {
    console.error('Signup error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
