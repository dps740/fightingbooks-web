import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const { tier } = await request.json();

    // v2: single paid tier at $3.99
    if (tier !== 'paid') {
      return NextResponse.json(
        { error: 'Invalid tier.' },
        { status: 400 }
      );
    }

    // Get user from session
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Check user's current tier
    const { data: profile } = await supabase
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .single();

    const currentTier = profile?.tier || 'free';

    // Already paid (including legacy tiers)
    if (currentTier === 'paid' || currentTier === 'tier2' || currentTier === 'tier3') {
      return NextResponse.json(
        { error: 'You already have Full Access!' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session — $3.99 one-time
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'FightingBooks Full Access',
              description: 'All 47 animals, Adventure mode, Tournaments — forever!',
            },
            unit_amount: 499, // $4.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whowouldwinbooks.com'}/dashboard?success=true&tier=paid&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whowouldwinbooks.com'}/dashboard?canceled=true`,
      metadata: {
        userId: user.id,
        tier: 'paid',
        purchaseType: 'full_access',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Checkout error:', errMsg, error);
    return NextResponse.json({ error: `Checkout failed: ${errMsg}` }, { status: 500 });
  }
}
