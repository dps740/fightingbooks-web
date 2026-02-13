import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });
    }

    // Look up promo code
    const { data: promo, error: promoError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (promoError || !promo) {
      return NextResponse.json({ error: 'Invalid promo code' }, { status: 400 });
    }

    // Check if code is still active
    if (!promo.active) {
      return NextResponse.json({ error: 'This code has expired' }, { status: 400 });
    }

    // Check if code has uses remaining
    if (promo.max_uses !== null && promo.times_used >= promo.max_uses) {
      return NextResponse.json({ error: 'This code has been fully redeemed' }, { status: 400 });
    }

    // Check if user already has paid tier
    const { data: profile } = await supabase
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .single();

    if (profile?.tier === 'paid' || profile?.tier === 'tier2' || profile?.tier === 'tier3' || profile?.tier === 'member' || profile?.tier === 'ultimate') {
      return NextResponse.json({ error: 'You already have Member access or higher!' }, { status: 400 });
    }

    // Check if user already redeemed a code
    const { data: existingRedemption } = await supabase
      .from('promo_redemptions')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingRedemption) {
      return NextResponse.json({ error: 'You have already used a promo code' }, { status: 400 });
    }

    // Upgrade user to paid tier
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        tier: 'member',
        tier_purchased_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to upgrade user:', updateError);
      return NextResponse.json({ error: 'Failed to apply code. Try again.' }, { status: 500 });
    }

    // Record the redemption
    await supabase.from('promo_redemptions').insert({
      user_id: user.id,
      promo_code_id: promo.id,
      code: promo.code,
    });

    // Increment usage count
    await supabase
      .from('promo_codes')
      .update({ times_used: (promo.times_used || 0) + 1 })
      .eq('id', promo.id);

    return NextResponse.json({ 
      success: true,
      message: 'Full Access unlocked! Enjoy all 47 animals 🎉',
    });

  } catch (error) {
    console.error('Promo redeem error:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
