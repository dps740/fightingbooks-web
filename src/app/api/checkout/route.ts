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

    if (tier !== 'member' && tier !== 'ultimate') {
      return NextResponse.json(
        { error: 'Invalid tier. Use "member" or "ultimate".' },
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

    // Already at or above requested tier
    if (tier === 'member' && (currentTier === 'member' || currentTier === 'paid' || currentTier === 'tier2' || currentTier === 'tier3' || currentTier === 'ultimate')) {
      return NextResponse.json(
        { error: 'You already have Member access or higher!' },
        { status: 400 }
      );
    }

    if (tier === 'ultimate' && currentTier === 'ultimate') {
      return NextResponse.json(
        { error: 'You already have Ultimate access!' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whowouldwinbooks.com';

    if (tier === 'member') {
      // Member: $4.99 one-time payment
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'FightingBooks Member',
                description: '30 real animals, 435 matchups, tournament mode — forever!',
              },
              unit_amount: 499, // $4.99
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${siteUrl}/dashboard?success=true&tier=member&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/dashboard?canceled=true`,
        metadata: {
          userId: user.id,
          tier: 'member',
          purchaseType: 'member_access',
        },
      });

      return NextResponse.json({ url: session.url });
    } else {
      // Ultimate: $4.99/month subscription
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'FightingBooks Ultimate',
                description: 'All 47+ animals, CYOA, tournaments, create your own, +2 new animals/month!',
              },
              unit_amount: 499, // $4.99/month
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${siteUrl}/dashboard?success=true&tier=ultimate&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/dashboard?canceled=true`,
        metadata: {
          userId: user.id,
          tier: 'ultimate',
          purchaseType: 'ultimate_subscription',
        },
        subscription_data: {
          metadata: {
            userId: user.id,
            tier: 'ultimate',
          },
        },
      });

      return NextResponse.json({ url: session.url });
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Checkout error:', errMsg, error);
    return NextResponse.json({ error: `Checkout failed: ${errMsg}` }, { status: 500 });
  }
}
