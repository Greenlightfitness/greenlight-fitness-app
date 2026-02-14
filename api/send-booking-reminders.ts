/**
 * Vercel Cron: Send booking reminder emails 15 minutes before appointments.
 * Runs every 5 minutes. Checks for appointments starting in the next 10-20 min window
 * that haven't had a reminder sent yet.
 */

interface VercelRequest {
  method?: string;
  headers: Record<string, string | undefined>;
  query: Record<string, string | undefined>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(data: any): void;
}

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { emailTemplates } from '../emails/templates';

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Greenlight Fitness <noreply@greenlight-fitness.de>';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET (cron) or POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = new Date();
    // Window: appointments starting between 10 and 20 minutes from now
    const windowStart = new Date(now.getTime() + 10 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 20 * 60 * 1000);

    const todayStr = now.toISOString().split('T')[0];
    const tomorrowStr = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Find appointments in the window that haven't been reminded
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('id, coach_id, calendar_id, date, time, duration_minutes, booker_name, booker_email, reminder_sent_at')
      .in('date', [todayStr, tomorrowStr])
      .in('status', ['PENDING', 'CONFIRMED'])
      .is('reminder_sent_at', null)
      .not('booker_email', 'is', null);

    if (error) {
      console.error('[REMINDER] Error fetching appointments:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!appointments || appointments.length === 0) {
      return res.status(200).json({ message: 'No reminders to send', count: 0 });
    }

    // Filter to only appointments in the 10-20 min window
    const toRemind = appointments.filter(apt => {
      const [h, m] = (apt.time || '00:00').split(':').map(Number);
      const aptDate = new Date(apt.date + 'T00:00:00');
      aptDate.setHours(h, m, 0, 0);
      return aptDate >= windowStart && aptDate <= windowEnd;
    });

    if (toRemind.length === 0) {
      return res.status(200).json({ message: 'No reminders in window', count: 0 });
    }

    // Fetch coach names for the reminder emails
    const coachIds = [...new Set(toRemind.map(a => a.coach_id))];
    const { data: coaches } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, nickname, email')
      .in('id', coachIds);

    const coachMap = new Map<string, string>();
    (coaches || []).forEach(c => {
      const name = c.first_name ? `${c.first_name} ${c.last_name || ''}`.trim() : c.nickname || c.email?.split('@')[0] || 'Coach';
      coachMap.set(c.id, name);
    });

    // Fetch calendar names
    const calendarIds = [...new Set(toRemind.map(a => a.calendar_id).filter(Boolean))];
    const { data: calendars } = await supabase
      .from('coach_calendars')
      .select('id, name')
      .in('id', calendarIds);

    const calendarMap = new Map<string, string>();
    (calendars || []).forEach(c => calendarMap.set(c.id, c.name));

    let sent = 0;
    let failed = 0;

    for (const apt of toRemind) {
      try {
        const coachName = coachMap.get(apt.coach_id) || 'Coach';
        const calendarName = calendarMap.get(apt.calendar_id) || 'Termin';

        const { subject, html } = emailTemplates.booking_reminder({
          bookerName: apt.booker_name || 'Teilnehmer',
          coachName,
          calendarName,
          date: apt.date,
          time: apt.time,
          durationMinutes: apt.duration_minutes || 30,
        });

        await resend.emails.send({
          from: FROM_EMAIL,
          to: [apt.booker_email],
          subject,
          html,
        });

        // Mark as sent
        await supabase
          .from('appointments')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', apt.id);

        sent++;
        console.log(`[REMINDER] Sent to ${apt.booker_email.substring(0, 3)}*** for ${apt.date} ${apt.time}`);
      } catch (emailErr) {
        console.error(`[REMINDER] Failed for appointment ${apt.id}:`, emailErr);
        failed++;
      }
    }

    return res.status(200).json({
      message: `Reminders processed`,
      total: toRemind.length,
      sent,
      failed,
    });
  } catch (err) {
    console.error('[REMINDER] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
