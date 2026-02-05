import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { UserTier, getTierInfo } from '@/lib/tierAccess';

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Tier pricing configuration
const TIER_CONFIG: Record<string, { priceEnvKey: string; amount: number; name: string }> = {
  tier2: {
    priceEnvKey: 'STRIPE_PRICE_TIER2',
    amount: 999, // $9.99 in cents
    name: 'Real Animals Pack',
  },
  tier3: {
    priceEnvKey: 'STRIPE_PRICE_TIER3',
    amount: 1999, // $19.99 in cents
    name: 'Ultimate Pack',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { tier } = await request.json();

    // Validate tier
    if (!tier || !TIER_CONFIG[tier]) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be tier2 or tier3.' },
        { status: 400 }
      );
    }

    const tierConfig = TIER_CONFIG[tier];

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

    // Check user's current tier - don't let them buy same or lower
    const { data: profile } = await supabase
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .single();

    const currentTier = profile?.tier || 'free';

    // Prevent downgrade or same purchase
    if (currentTier === tier) {
      return NextResponse.json(
        { error: 'You already have this tier!' },
        { status: 400 }
      );
    }

    if (currentTier === 'tier3') {
      return NextResponse.json(
        { error: 'You already have the Ultimate Pack!' },
        { status: 400 }
      );
    }

    if (currentTier === 'tier2' && tier === 'tier2') {
      return NextResponse.json(
        { error: 'You already have the Real Animals Pack!' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const stripe = getStripe();
    const tierInfo = getTierInfo(tier as UserTier);

    // Use Stripe Price ID if configured, otherwise use one-time price
    const priceId = process.env[tierConfig.priceEnvKey];

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];

    if (priceId) {
      // Use pre-configured Stripe price
      lineItems = [{ price: priceId, quantity: 1 }];
    } else {
      // Create one-time price (fallback)
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tierConfig.name,
              description: `Unlock ${tierInfo.animals} animals for FightingBooks`,
            },
            unit_amount: tierConfig.amount,
          },
          quantity: 1,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whowouldwinbooks.com'}/dashboard?success=true&tier=${tier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://whowouldwinbooks.com'}/dashboard?canceled=true`,
      metadata: {
        userId: user.id,
        tier: tier,
        purchaseType: 'tier_upgrade',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
