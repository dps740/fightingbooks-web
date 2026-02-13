import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
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
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const userId = session.metadata?.userId;
    const tier = session.metadata?.tier;

    if (!userId || !tier) {
      return NextResponse.json({ error: 'Invalid session metadata' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Normalize tier (legacy tier2/tier3/paid → member)
    const normalizedTier = (tier === 'tier2' || tier === 'tier3' || tier === 'paid') ? 'member' : tier;

    // Update user's tier
    const { error: updateError } = await supabase
      .from('users')
      .update({
        tier: normalizedTier,
        tier_purchased_at: new Date().toISOString(),
        stripe_payment_id: session.payment_intent as string,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user tier:', updateError);
      return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 });
    }

    // Record purchase
    await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        tier: tier,
        amount_cents: session.amount_total || 0,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
      });

    return NextResponse.json({ success: true, tier });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Confirm error:', errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
