import Stripe from 'stripe';

// Initialize Stripe with secret key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia' as any,
});

// Vercel serverless function types
type VercelRequest = any;
type VercelResponse = any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      title, 
      description, 
      price, 
      currency = 'eur',
      interval = 'month',
      productId // Our internal product ID for reference
    } = req.body;

    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price are required' });
    }

    // 1. Create Stripe Product
    const stripeProduct = await stripe.products.create({
      name: title,
      description: description || undefined,
      metadata: {
        greenlight_product_id: productId || '',
      },
    });

    console.log('Created Stripe product:', stripeProduct.id);

    // 2. Create Stripe Price
    const isRecurring = interval !== 'onetime';
    
    const priceData: Stripe.PriceCreateParams = {
      product: stripeProduct.id,
      unit_amount: Math.round(price * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        greenlight_product_id: productId || '',
      },
    };

    if (isRecurring) {
      priceData.recurring = {
        interval: interval === 'year' ? 'year' : 'month',
      };
    }

    const stripePrice = await stripe.prices.create(priceData);

    console.log('Created Stripe price:', stripePrice.id);

    return res.status(200).json({
      success: true,
      stripe_product_id: stripeProduct.id,
      stripe_price_id: stripePrice.id,
    });

  } catch (error: any) {
    console.error('Stripe error:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to create Stripe product' 
    });
  }
}
