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
    const { customerId, customerEmail, returnUrl } = req.body;

    if (!customerId && !customerEmail) {
      return res.status(400).json({ error: 'customerId or customerEmail required' });
    }

    let stripeCustomerId = customerId;

    // If no customer ID, find or create customer by email
    if (!stripeCustomerId && customerEmail) {
      const customers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
      } else {
        // Create new customer
        const newCustomer = await stripe.customers.create({
          email: customerEmail,
        });
        stripeCustomerId = newCustomer.id;
      }
    }

    // Create Billing Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl || `${req.headers.origin}/settings`,
    });

    return res.status(200).json({ 
      url: portalSession.url 
    });

  } catch (error: any) {
    console.error('Portal session error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to create portal session' 
    });
  }
}
