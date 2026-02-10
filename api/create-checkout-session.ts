import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      productId,
      productTitle,
      price,
      currency = 'eur',
      interval,
      customerId,
      customerEmail,
      successUrl,
      cancelUrl,
      stripePriceId, // If product already has a Stripe price
      trialDays = 0, // Free trial period in days
    } = req.body;

    // Free products don't need Stripe checkout
    if ((!price || Number(price) <= 0) && !stripePriceId) {
      return res.status(200).json({ 
        free: true,
        message: 'Free product - no checkout needed' 
      });
    }

    // Build line items
    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];

    if (stripePriceId) {
      // Use existing Stripe price
      lineItems = [{
        price: stripePriceId,
        quantity: 1,
      }];
    } else {
      // Create price on the fly
      lineItems = [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: productTitle || 'Greenlight Fitness Produkt',
          },
          unit_amount: Math.round(price * 100), // Stripe expects cents
          ...(interval && interval !== 'onetime' ? {
            recurring: {
              interval: interval === 'year' ? 'year' : 'month',
            }
          } : {}),
        },
        quantity: 1,
      }];
    }

    // Determine mode based on interval
    const mode = interval && interval !== 'onetime' ? 'subscription' : 'payment';

    // Create Checkout Session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: mode,
      success_url: successUrl || `${req.headers.origin}/shop?success=true&product=${productId}`,
      cancel_url: cancelUrl || `${req.headers.origin}/shop?canceled=true`,
      metadata: {
        productId: productId || '',
        source: 'greenlight-fitness',
      },
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      // Allow promotion codes
      allow_promotion_codes: true,
      // Billing address collection
      billing_address_collection: 'auto',
      // Free trial period for subscriptions
      ...(mode === 'subscription' && trialDays > 0 ? {
        subscription_data: {
          trial_period_days: Number(trialDays),
        },
      } : {}),
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to create checkout session' 
    });
  }
}
