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

  if (event.type === 'checkout.session.completed') {
    const supabase = getSupabase();
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const purchaseType = session.metadata?.purchaseType;

    // Handle tier purchase
    if (purchaseType === 'tier_upgrade' && userId) {
      const tier = session.metadata?.tier;

      if (tier && (tier === 'tier2' || tier === 'tier3')) {
        // Update user's tier
        const { error: updateError } = await supabase
          .from('users')
          .update({
            tier: tier,
            tier_purchased_at: new Date().toISOString(),
            stripe_payment_id: session.payment_intent as string,
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating user tier:', updateError);
        } else {
          console.log(`Upgraded user ${userId} to ${tier}`);
        }

        // Record purchase in purchases table
        const { error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            user_id: userId,
            tier: tier,
            amount_cents: session.amount_total || 0,
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent as string,
          });

        if (purchaseError) {
          console.error('Error recording purchase:', purchaseError);
        }
      }
    }

    // Handle legacy credit purchase (for backwards compatibility)
    const credits = parseInt(session.metadata?.credits || '0');
    if (userId && credits > 0) {
      // Legacy: Add credits to user
      const { data: user } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (user) {
        await supabase
          .from('users')
          .update({ credits: (user.credits || 0) + credits })
          .eq('id', userId);

        // Record payment in legacy payments table (if it exists)
        try {
          await supabase
            .from('payments')
            .insert({
              user_id: userId,
              amount: session.amount_total,
              credits: credits,
              stripe_session_id: session.id,
            });
        } catch (e) {
          // payments table might not exist, ignore
        }

        console.log(`Added ${credits} credits to user ${userId}`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
