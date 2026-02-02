import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://lfpcyhrccefbeowsgojv.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Webhook secret from Stripe Dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body
  },
};

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } else {
      // For testing without webhook signature verification
      event = JSON.parse(buf.toString()) as Stripe.Event;
      console.warn('⚠️ Webhook signature verification skipped (no secret configured)');
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('📥 Stripe webhook received:', event.type);

  try {
    switch (event.type) {
      // ===== PAYMENT SUCCESS =====
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ Checkout completed:', session.id);
        
        // Get product ID from metadata
        const productId = session.metadata?.productId;
        const customerEmail = session.customer_email || session.customer_details?.email;
        
        if (productId && customerEmail) {
          // Find user by email
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customerEmail)
            .single();
          
          if (profile) {
            // Record the purchase
            await supabase.from('purchases').insert({
              user_id: profile.id,
              product_id: productId,
              stripe_session_id: session.id,
              stripe_customer_id: session.customer as string,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              currency: session.currency,
              status: 'completed',
            });
            
            console.log('💾 Purchase recorded for user:', profile.id);
          }
        }
        break;
      }

      // ===== SUBSCRIPTION EVENTS =====
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        console.log('📋 Subscription updated:', subscription.id, subscription.status);
        
        // Update subscription status in database
        await supabase
          .from('subscriptions')
          .upsert({
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer as string,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          }, { onConflict: 'stripe_subscription_id' });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('❌ Subscription canceled:', subscription.id);
        
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);
        break;
      }

      // ===== INVOICE EVENTS =====
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('💰 Invoice paid:', invoice.id);
        
        await supabase.from('invoices').insert({
          stripe_invoice_id: invoice.id,
          stripe_customer_id: invoice.customer as string,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          status: 'paid',
          invoice_url: invoice.hosted_invoice_url,
          invoice_pdf: invoice.invoice_pdf,
          paid_at: new Date().toISOString(),
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('⚠️ Invoice payment failed:', invoice.id);
        
        // Could send notification to user here
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
