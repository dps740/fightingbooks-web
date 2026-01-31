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
    const credits = parseInt(session.metadata?.credits || '0');

    if (userId && credits > 0) {
      // Add credits to user
      const { data: user } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      await supabase
        .from('users')
        .update({ credits: (user?.credits || 0) + credits })
        .eq('id', userId);

      // Record payment
      await supabase
        .from('payments')
        .insert({
          user_id: userId,
          amount: session.amount_total,
          credits: credits,
          stripe_session_id: session.id,
        });

      console.log(`Added ${credits} credits to user ${userId}`);
    }
  }

  return NextResponse.json({ received: true });
}
