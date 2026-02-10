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
    const { customerEmail } = req.body;

    if (!customerEmail) {
      return res.status(400).json({ error: 'customerEmail required' });
    }

    // Find customer by email
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 10,
    });

    if (customers.data.length === 0) {
      return res.status(200).json({
        subscriptions: [],
        purchases: [],
        invoices: [],
        hasStripeAccount: false,
      });
    }

    // Collect data from all customer accounts (in case of duplicates)
    const allSubscriptions: any[] = [];
    const allPurchases: any[] = [];
    const allInvoices: any[] = [];

    for (const customer of customers.data) {
      // Get subscriptions
      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 10,
      });
      
      for (const sub of subs.data) {
        // Get the product name from the subscription items
        const items = sub.items.data;
        let productName = 'Abonnement';
        if (items.length > 0 && items[0].price.product) {
          const product = await stripe.products.retrieve(items[0].price.product as string);
          productName = product.name;
        }
        
        allSubscriptions.push({
          id: sub.id,
          status: sub.status,
          productName,
          currentPeriodStart: new Date((sub as any).current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date((sub as any).current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          amount: items[0]?.price?.unit_amount ? items[0].price.unit_amount / 100 : 0,
          currency: items[0]?.price?.currency?.toUpperCase() || 'EUR',
          interval: items[0]?.price?.recurring?.interval || 'month',
        });
      }

      // Get completed checkout sessions (one-time purchases)
      const sessions = await stripe.checkout.sessions.list({
        customer: customer.id,
        limit: 20,
      });

      for (const session of sessions.data) {
        if (session.status === 'complete' && session.mode === 'payment') {
          allPurchases.push({
            id: session.id,
            productName: session.metadata?.productTitle || 'Einmalkauf',
            amount: session.amount_total ? session.amount_total / 100 : 0,
            currency: session.currency?.toUpperCase() || 'EUR',
            createdAt: new Date(session.created * 1000).toISOString(),
          });
        }
      }

      // Get invoices
      const invoices = await stripe.invoices.list({
        customer: customer.id,
        limit: 10,
      });

      for (const invoice of invoices.data) {
        if (invoice.status === 'paid') {
          allInvoices.push({
            id: invoice.id,
            amount: invoice.amount_paid / 100,
            currency: invoice.currency?.toUpperCase() || 'EUR',
            paidAt: invoice.status_transitions?.paid_at 
              ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() 
              : null,
            invoiceUrl: invoice.hosted_invoice_url,
            invoicePdf: invoice.invoice_pdf,
          });
        }
      }
    }

    return res.status(200).json({
      subscriptions: allSubscriptions,
      purchases: allPurchases,
      invoices: allInvoices,
      hasStripeAccount: true,
    });

  } catch (error: any) {
    console.error('Get customer data error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to get customer data' 
    });
  }
}
