/**
 * API Route: Manage Push Subscriptions
 * 
 * POST /api/push-subscription - Save subscription
 * DELETE /api/push-subscription - Remove subscription
 */

import { createClient } from '@supabase/supabase-js';

interface VercelRequest {
  method?: string;
  body: any;
  headers: { [key: string]: string };
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(data: any): void;
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '' // Service key for server-side operations
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // POST: Save subscription
  if (req.method === 'POST') {
    try {
      const { subscription, userId } = req.body;

      if (!subscription) {
        return res.status(400).json({ error: 'Missing subscription data' });
      }

      // Store subscription in database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          endpoint: subscription.endpoint,
          user_id: userId || null,
          p256dh: subscription.keys?.p256dh,
          auth: subscription.keys?.auth,
          user_agent: req.headers['user-agent'],
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'endpoint'
        });

      if (error) {
        console.error('[Push] Error saving subscription:', error);
        return res.status(500).json({ error: 'Failed to save subscription' });
      }

      console.log('[Push] Subscription saved');
      return res.status(200).json({ success: true });

    } catch (error: any) {
      console.error('[Push] Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE: Remove subscription
  if (req.method === 'DELETE') {
    try {
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({ error: 'Missing endpoint' });
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', endpoint);

      if (error) {
        console.error('[Push] Error removing subscription:', error);
        return res.status(500).json({ error: 'Failed to remove subscription' });
      }

      console.log('[Push] Subscription removed');
      return res.status(200).json({ success: true });

    } catch (error: any) {
      console.error('[Push] Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
