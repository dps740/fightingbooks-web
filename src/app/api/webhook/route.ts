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
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  const stripe = getStripe();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getSupabase();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const purchaseType = session.metadata?.purchaseType;
    const tier = session.metadata?.tier;

    if (userId && tier) {
      // Normalize legacy tiers to 'member'
      let normalizedTier = tier;
      if (tier === 'tier2' || tier === 'tier3' || tier === 'paid') {
        normalizedTier = 'member';
      }

      // For ultimate subscriptions, store the subscription ID
      const updateData: Record<string, unknown> = {
        tier: normalizedTier,
        tier_purchased_at: new Date().toISOString(),
      };

      if (purchaseType === 'ultimate_subscription' && session.subscription) {
        updateData.stripe_subscription_id = session.subscription as string;
      }
      if (session.payment_intent) {
        updateData.stripe_payment_id = session.payment_intent as string;
      }

      // Update user's tier
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user tier:', updateError);
      } else {
        console.log(`Upgraded user ${userId} to ${normalizedTier} (type: ${purchaseType})`);
      }

      // Record purchase
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          tier: normalizedTier,
          amount_cents: session.amount_total || 0,
          stripe_session_id: session.id,
          stripe_payment_intent: (session.payment_intent as string) || null,
        });

      if (purchaseError) {
        console.error('Error recording purchase:', purchaseError);
      }
    }
  }

  // Handle subscription cancellation — downgrade ultimate to member
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.userId;

    if (userId) {
      console.log(`Subscription canceled for user ${userId} — downgrading to member`);

      // Check if they had a previous one-time purchase (member tier)
      const { data: purchases } = await supabase
        .from('purchases')
        .select('tier')
        .eq('user_id', userId)
        .in('tier', ['member', 'paid', 'tier2', 'tier3']);

      // If they previously purchased member, downgrade to member; otherwise downgrade to free
      const downgradeTier = (purchases && purchases.length > 0) ? 'member' : 'free';

      const { error: updateError } = await supabase
        .from('users')
        .update({
          tier: downgradeTier,
          stripe_subscription_id: null,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error downgrading user:', updateError);
      } else {
        console.log(`Downgraded user ${userId} to ${downgradeTier}`);
      }
    }
  }

  // Handle failed subscription payment
  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string;

    if (subscriptionId) {
      // Get subscription to find user
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata?.userId;

      if (userId) {
        console.log(`Payment failed for user ${userId} subscription ${subscriptionId}`);
        // Stripe will retry automatically; we just log for now
        // After all retries fail, customer.subscription.deleted will fire
      }
    }
  }

  return NextResponse.json({ received: true });
}
