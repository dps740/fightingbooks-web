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

    const currentTier = profile?.tier || 'unregistered';

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

    // Stripe product price IDs (created in Stripe dashboard)
    const MEMBER_PRICE_ID = process.env.STRIPE_MEMBER_PRICE_ID || 'price_1TF4pmJoZTmyptDMt36dswoy';
    const ULTIMATE_PRICE_ID = process.env.STRIPE_ULTIMATE_PRICE_ID || 'price_1TF4pmJoZTmyptDMVLfBHDVy';

    // Find or create Stripe customer
    let customerId: string | undefined;
    const existingCustomers = await stripe.customers.list({ email: user.email!, limit: 1 });
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
    }

    // Save customer ID to our DB
    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);

    if (tier === 'member') {
      // Member: $4.99 one-time payment
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: MEMBER_PRICE_ID, quantity: 1 }],
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
      // Ultimate: $9.99/month subscription
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: ULTIMATE_PRICE_ID, quantity: 1 }],
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
