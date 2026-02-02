import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { customerId, customerEmail, limit = 10 } = req.query;

    if (!customerId && !customerEmail) {
      return res.status(400).json({ error: 'customerId or customerEmail required' });
    }

    let stripeCustomerId = customerId as string;

    // Find customer by email if needed
    if (!stripeCustomerId && customerEmail) {
      const customers = await stripe.customers.list({
        email: customerEmail as string,
        limit: 1,
      });

      if (customers.data.length === 0) {
        return res.status(200).json({ invoices: [] });
      }
      stripeCustomerId = customers.data[0].id;
    }

    // Get invoices for customer
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: Number(limit),
    });

    // Format response
    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      created: new Date(invoice.created * 1000).toISOString(),
      paidAt: invoice.status_transitions.paid_at 
        ? new Date(invoice.status_transitions.paid_at * 1000).toISOString() 
        : null,
      invoiceUrl: invoice.hosted_invoice_url,
      pdfUrl: invoice.invoice_pdf,
      description: invoice.description || invoice.lines.data[0]?.description || 'Greenlight Fitness',
    }));

    return res.status(200).json({ 
      invoices: formattedInvoices,
      hasMore: invoices.has_more,
    });

  } catch (error: any) {
    console.error('Get invoices error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to fetch invoices' 
    });
  }
}
