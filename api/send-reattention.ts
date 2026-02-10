/**
 * Reattention Email Dispatch API
 * 
 * Triggered by Vercel Cron to gather data and send role-specific
 * reattention emails and push notifications.
 * 
 * Endpoints:
 *   POST /api/send-reattention?action=daily    → Training + Check-In reminders (Athletes)
 *   POST /api/send-reattention?action=weekly   → Weekly summaries (All roles)
 *   POST /api/send-reattention?action=churn    → Churn risk checks (Coach + Admin)
 * 
 * Auth: Requires CRON_SECRET header or service_role key
 */

interface VercelRequest {
  method?: string;
  body: any;
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(data: any): void;
}

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import {
  athleteTrainingReminder,
  athleteCheckInReminder,
  athleteInactivityAlert,
  athleteWeeklyProgress,
  coachWeeklySummary,
  coachChurnRiskAlert,
  adminWeeklyReport,
  adminChurnAlert,
  type AthleteTrainingReminderData,
  type AthleteCheckInReminderData,
  type AthleteInactivityAlertData,
  type AthleteWeeklyProgressData,
  type CoachWeeklySummaryData,
  type CoachChurnRiskAlertData,
  type AdminWeeklyReportData,
  type AdminChurnAlertData,
} from '../emails/reattention';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Greenlight Fitness <noreply@greenlight-fitness.de>';
const APP_URL = process.env.APP_URL || 'https://app.greenlight-fitness.de';
const CRON_SECRET = process.env.CRON_SECRET;

// =============================================================================
// AUTH
// =============================================================================

function isAuthorized(req: VercelRequest): boolean {
  if (CRON_SECRET && req.headers['authorization'] === `Bearer ${CRON_SECRET}`) return true;
  if (CRON_SECRET && req.headers['x-cron-secret'] === CRON_SECRET) return true;
  // Allow in development
  if (process.env.NODE_ENV === 'development') return true;
  return false;
}

// =============================================================================
// HELPERS
// =============================================================================

async function sendAndLog(
  userId: string,
  userRole: string,
  email: string,
  templateType: string,
  templateResult: { subject: string; html: string },
  dedupKey: string,
  context: Record<string, any> = {}
): Promise<boolean> {
  try {
    // Check dedup: don't send same type+key within 20 hours
    const { data: existing } = await supabase
      .from('notification_log')
      .select('id')
      .eq('user_id', userId)
      .eq('template_type', templateType)
      .eq('dedup_key', dedupKey)
      .gte('created_at', new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`[REATTENTION] Skipped (dedup): ${templateType} for ${email}`);
      return false;
    }

    // Check user preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (prefs) {
      if (!prefs.email_enabled) return false;
      const prefMap: Record<string, string> = {
        athlete_training_reminder: 'training_reminders',
        athlete_checkin_reminder: 'checkin_reminders',
        athlete_weekly_progress: 'weekly_progress',
        athlete_inactivity_alert: 'inactivity_alerts',
        coach_weekly_summary: 'athlete_summary',
        coach_churn_risk_alert: 'churn_risk_alerts',
        admin_weekly_report: 'business_reports',
        admin_churn_alert: 'churn_alerts',
      };
      const prefKey = prefMap[templateType];
      if (prefKey && prefs[prefKey] === false) return false;
    }

    // Send
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: templateResult.subject,
      html: templateResult.html,
    });

    // Log
    await supabase.from('notification_log').insert({
      user_id: userId,
      user_role: userRole,
      email,
      channel: 'email',
      template_type: templateType,
      subject: templateResult.subject,
      dedup_key: dedupKey,
      status: 'sent',
      provider_message_id: result.data?.id,
      context,
    });

    console.log(`[REATTENTION] Sent: ${templateType} → ${email.substring(0, 3)}***`);
    return true;
  } catch (error: any) {
    console.error(`[REATTENTION] Failed: ${templateType} → ${email}`, error.message);

    try {
      await supabase.from('notification_log').insert({
        user_id: userId,
        user_role: userRole,
        email,
        channel: 'email',
        template_type: templateType,
        dedup_key: dedupKey,
        status: 'failed',
        error_message: error.message,
        context,
      });
    } catch (_) { /* ignore logging failure */ }

    return false;
  }
}

function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// =============================================================================
// DAILY: Training + Check-In Reminders for Athletes
// =============================================================================

async function runDailyReminders(): Promise<{ sent: number; skipped: number }> {
  let sent = 0, skipped = 0;
  const today = new Date().toISOString().slice(0, 10);

  // Get all active athletes with coaching relationships
  const { data: athletes } = await supabase
    .from('profiles')
    .select('id, email, first_name, role')
    .eq('role', 'ATHLETE');

  if (!athletes) return { sent: 0, skipped: 0 };

  for (const athlete of athletes) {
    const firstName = athlete.first_name || 'Athlet';

    // Check if they already did a check-in today
    const { data: todayCheckIn } = await supabase
      .from('check_ins')
      .select('id')
      .eq('athlete_id', athlete.id)
      .eq('date', today)
      .limit(1);

    if (!todayCheckIn || todayCheckIn.length === 0) {
      // Calculate streak
      const { data: recentCheckIns } = await supabase
        .from('check_ins')
        .select('date')
        .eq('athlete_id', athlete.id)
        .order('date', { ascending: false })
        .limit(30);

      let streakDays = 0;
      if (recentCheckIns) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        let checkDate = yesterday;
        for (const ci of recentCheckIns) {
          if (ci.date === checkDate.toISOString().slice(0, 10)) {
            streakDays++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else break;
        }
      }

      const emailData: AthleteCheckInReminderData = {
        firstName,
        streakDays,
        dashboardLink: APP_URL,
      };

      const result = athleteCheckInReminder(emailData);
      const didSend = await sendAndLog(
        athlete.id, 'ATHLETE', athlete.email,
        'athlete_checkin_reminder', result,
        today, { streakDays }
      );
      if (didSend) sent++; else skipped++;
    }

    // Check for scheduled training today
    const { data: assignedPlans } = await supabase
      .from('athlete_plans')
      .select('plan_id, plan_name')
      .eq('athlete_id', athlete.id)
      .eq('schedule_status', 'ACTIVE')
      .limit(1);

    if (assignedPlans && assignedPlans.length > 0) {
      const plan = assignedPlans[0];
      const emailData: AthleteTrainingReminderData = {
        firstName,
        sessionName: 'Deine nächste Session',
        planName: plan.plan_name || 'Trainingsplan',
        dashboardLink: APP_URL,
      };

      const result = athleteTrainingReminder(emailData);
      const didSend = await sendAndLog(
        athlete.id, 'ATHLETE', athlete.email,
        'athlete_training_reminder', result,
        today, { planId: plan.plan_id }
      );
      if (didSend) sent++; else skipped++;
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 50));
  }

  return { sent, skipped };
}

// =============================================================================
// WEEKLY: Summaries for all roles
// =============================================================================

async function runWeeklySummaries(): Promise<{ sent: number; skipped: number }> {
  let sent = 0, skipped = 0;
  const weekNumber = getWeekNumber();
  const dedupKey = `week-${weekNumber}`;
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  // --- ATHLETE WEEKLY PROGRESS ---
  const { data: athletes } = await supabase
    .from('profiles')
    .select('id, email, first_name, role')
    .eq('role', 'ATHLETE');

  if (athletes) {
    for (const athlete of athletes) {
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('*')
        .eq('athlete_id', athlete.id)
        .gte('date', weekAgo.slice(0, 10));

      const checkInsCount = checkIns?.length || 0;
      const avgMood = checkIns && checkIns.length > 0
        ? checkIns.reduce((sum: number, ci: any) => sum + (ci.mood_rating || 0), 0) / checkIns.filter((ci: any) => ci.mood_rating).length || 0
        : undefined;

      const emailData: AthleteWeeklyProgressData = {
        firstName: athlete.first_name || 'Athlet',
        weekNumber,
        workoutsCompleted: 0, // TODO: derive from training_logs
        workoutsPlanned: 0,
        checkInsCompleted: checkInsCount,
        avgMood: avgMood && isFinite(avgMood) ? avgMood : undefined,
        prsThisWeek: 0,
        streakDays: checkInsCount,
        dashboardLink: APP_URL,
      };

      const result = athleteWeeklyProgress(emailData);
      const didSend = await sendAndLog(
        athlete.id, 'ATHLETE', athlete.email,
        'athlete_weekly_progress', result, dedupKey
      );
      if (didSend) sent++; else skipped++;
      await new Promise(r => setTimeout(r, 50));
    }
  }

  // --- COACH WEEKLY SUMMARY ---
  const { data: coaches } = await supabase
    .from('profiles')
    .select('id, email, first_name, role')
    .eq('role', 'COACH');

  if (coaches) {
    for (const coach of coaches) {
      // Get coach's athletes
      const { data: relationships } = await supabase
        .from('coaching_relationships')
        .select('athlete_id, status')
        .eq('coach_id', coach.id)
        .eq('status', 'ACTIVE');

      const athleteIds = relationships?.map(r => r.athlete_id) || [];
      const totalAthletes = athleteIds.length;

      // Activity: check-ins in last 7 days
      let activeAthletes = 0;
      const athletesAtRisk: Array<{ name: string; reason: string }> = [];
      const topPerformers: Array<{ name: string; metric: string }> = [];

      for (const aId of athleteIds) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', aId)
          .single();

        const { data: recentCI } = await supabase
          .from('check_ins')
          .select('id')
          .eq('athlete_id', aId)
          .gte('date', weekAgo.slice(0, 10));

        const name = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Athlet' : 'Athlet';

        if (recentCI && recentCI.length > 0) {
          activeAthletes++;
          if (recentCI.length >= 5) {
            topPerformers.push({ name, metric: `${recentCI.length} Check-Ins` });
          }
        } else {
          athletesAtRisk.push({ name, reason: 'Keine Aktivität diese Woche' });
        }
      }

      const avgCheckInRate = totalAthletes > 0 ? Math.round((activeAthletes / totalAthletes) * 100) : 0;

      const emailData: CoachWeeklySummaryData = {
        coachName: coach.first_name || 'Coach',
        weekNumber,
        totalAthletes,
        activeAthletes,
        inactiveAthletes: totalAthletes - activeAthletes,
        avgCheckInRate,
        avgTrainingCompletion: 0, // TODO
        athletesAtRisk: athletesAtRisk.slice(0, 5),
        topPerformers: topPerformers.slice(0, 3),
        newMessages: 0,
        dashboardLink: `${APP_URL}/admin/crm`,
      };

      const result = coachWeeklySummary(emailData);
      const didSend = await sendAndLog(
        coach.id, 'COACH', coach.email,
        'coach_weekly_summary', result, dedupKey
      );
      if (didSend) sent++; else skipped++;
      await new Promise(r => setTimeout(r, 50));
    }
  }

  // --- ADMIN WEEKLY REPORT ---
  const { data: admins } = await supabase
    .from('profiles')
    .select('id, email, first_name, role')
    .eq('role', 'ADMIN');

  if (admins) {
    // Gather global stats
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: totalAthletes } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'ATHLETE');
    const { count: totalCoaches } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'COACH');

    // Purchases this week
    const { data: weekPurchases } = await supabase
      .from('purchases')
      .select('amount, status')
      .gte('created_at', weekAgo);

    const weeklyRevenue = weekPurchases?.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
    const newSubs = weekPurchases?.filter(p => p.status === 'completed').length || 0;

    // Cancellations
    const { data: weekCancellations } = await supabase
      .from('purchases')
      .select('id')
      .eq('status', 'revoked')
      .gte('updated_at', weekAgo);

    const cancellations = weekCancellations?.length || 0;

    // New signups
    const { data: newProfiles } = await supabase
      .from('profiles')
      .select('id')
      .gte('created_at', weekAgo);

    const newSignups = newProfiles?.length || 0;

    // Active subscriptions (rough: completed purchases)
    const { count: activeSubs } = await supabase
      .from('purchases')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');

    // Coach performance
    const coachPerformance: AdminWeeklyReportData['coachPerformance'] = [];
    if (coaches) {
      for (const c of coaches) {
        const { data: rels } = await supabase
          .from('coaching_relationships')
          .select('athlete_id, status')
          .eq('coach_id', c.id);

        const activeRels = rels?.filter(r => r.status === 'ACTIVE').length || 0;
        const totalRels = rels?.length || 0;
        const retention = totalRels > 0 ? Math.round((activeRels / totalRels) * 100) : 100;

        coachPerformance.push({
          name: c.first_name || 'Coach',
          athletes: activeRels,
          retentionRate: retention,
          avgSatisfaction: 4.0, // TODO: derive from check-in data
        });
      }
    }

    const totalActiveSubs = activeSubs || 0;
    const churnRate = totalActiveSubs > 0 ? Math.round((cancellations / totalActiveSubs) * 100 * 10) / 10 : 0;

    const alerts: AdminWeeklyReportData['alerts'] = [];
    if (churnRate > 10) alerts.push({ type: 'danger', message: `Churn-Rate bei ${churnRate}% — deutlich über Ziel (< 5%)` });
    if (cancellations > newSubs) alerts.push({ type: 'warning', message: `Mehr Kündigungen (${cancellations}) als neue Abos (${newSubs})` });

    for (const admin of admins) {
      const emailData: AdminWeeklyReportData = {
        adminName: admin.first_name || 'Admin',
        weekNumber,
        weeklyRevenue: `${(weeklyRevenue / 100).toFixed(2)} €`,
        revenueChange: 0, // TODO: compare with previous week
        monthlyRevenue: `${(weeklyRevenue / 100).toFixed(2)} €`,
        monthlyForecast: `${((weeklyRevenue / 100) * 4.3).toFixed(2)} €`,
        totalActiveSubscriptions: totalActiveSubs,
        newSubscriptions: newSubs,
        cancellations,
        netGrowth: newSubs - cancellations,
        churnRate,
        newSignups,
        freeToPayingConversions: newSubs,
        conversionRate: newSignups > 0 ? Math.round((newSubs / newSignups) * 100) : 0,
        totalUsers: totalUsers || 0,
        totalAthletes: totalAthletes || 0,
        totalCoaches: totalCoaches || 0,
        activeUsersThisWeek: newSignups, // TODO: from activity logs
        coachPerformance,
        alerts,
        dashboardLink: `${APP_URL}/admin/users`,
      };

      const result = adminWeeklyReport(emailData);
      const didSend = await sendAndLog(
        admin.id, 'ADMIN', admin.email,
        'admin_weekly_report', result, dedupKey
      );
      if (didSend) sent++; else skipped++;
    }
  }

  return { sent, skipped };
}

// =============================================================================
// CHURN: Inactivity detection + coach alerts
// =============================================================================

async function runChurnDetection(): Promise<{ sent: number; skipped: number }> {
  let sent = 0, skipped = 0;
  const today = new Date().toISOString().slice(0, 10);

  // Find athletes inactive for 3+, 7+, 14+ days
  const { data: athletes } = await supabase
    .from('profiles')
    .select('id, email, first_name, role')
    .eq('role', 'ATHLETE');

  if (!athletes) return { sent: 0, skipped: 0 };

  for (const athlete of athletes) {
    // Last check-in
    const { data: lastCI } = await supabase
      .from('check_ins')
      .select('date')
      .eq('athlete_id', athlete.id)
      .order('date', { ascending: false })
      .limit(1);

    if (!lastCI || lastCI.length === 0) continue;

    const inactiveDays = daysSince(lastCI[0].date);
    if (inactiveDays < 3) continue;

    // Get coach
    const { data: coaching } = await supabase
      .from('coaching_relationships')
      .select('coach_id, coach:profiles!coaching_relationships_coach_id_fkey(first_name, email)')
      .eq('athlete_id', athlete.id)
      .eq('status', 'ACTIVE')
      .limit(1);

    const coachData = coaching?.[0];
    const coachName = (coachData?.coach as any)?.first_name;

    // Send athlete inactivity email (3, 7, 14 day tiers)
    const tier = inactiveDays >= 14 ? '14d' : inactiveDays >= 7 ? '7d' : '3d';
    const emailData: AthleteInactivityAlertData = {
      firstName: athlete.first_name || 'Athlet',
      daysSinceLastActivity: inactiveDays,
      lastActivityType: 'Check-In',
      lastActivityDate: new Date(lastCI[0].date).toLocaleDateString('de-DE'),
      coachName,
      dashboardLink: APP_URL,
    };

    const result = athleteInactivityAlert(emailData);
    const didSend = await sendAndLog(
      athlete.id, 'ATHLETE', athlete.email,
      'athlete_inactivity_alert', result,
      `${today}-${tier}`, { inactiveDays, tier }
    );
    if (didSend) sent++; else skipped++;

    // Alert coach about churn risk
    if (coachData && inactiveDays >= 5) {
      const riskLevel = inactiveDays >= 14 ? 'critical' : inactiveDays >= 7 ? 'high' : 'medium';
      const riskFactors: string[] = [];
      if (inactiveDays >= 14) riskFactors.push(`${inactiveDays} Tage ohne Aktivität`);
      if (inactiveDays >= 7) riskFactors.push('Kein Check-In seit über einer Woche');
      riskFactors.push('Trainingsplan möglicherweise nicht mehr aktuell');

      const coachEmail = (coachData.coach as any)?.email;
      if (coachEmail) {
        const churnData: CoachChurnRiskAlertData = {
          coachName: coachName || 'Coach',
          athleteName: athlete.first_name || 'Athlet',
          athleteEmail: athlete.email,
          riskLevel: riskLevel as any,
          riskFactors,
          daysSinceLastActivity: inactiveDays,
          checkInRate: 0,
          trainingCompletion: 0,
          dashboardLink: `${APP_URL}/admin/crm`,
        };

        const churnResult = coachChurnRiskAlert(churnData);
        const didSendCoach = await sendAndLog(
          coachData.coach_id, 'COACH', coachEmail,
          'coach_churn_risk_alert', churnResult,
          `${today}-${athlete.id}`, { athleteId: athlete.id, riskLevel }
        );
        if (didSendCoach) sent++; else skipped++;
      }
    }

    await new Promise(r => setTimeout(r, 50));
  }

  return { sent, skipped };
}

// =============================================================================
// HANDLER
// =============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const action = (req.query.action as string) || req.body?.action;

  if (!action || !['daily', 'weekly', 'churn'].includes(action)) {
    return res.status(400).json({
      error: 'Invalid action',
      validActions: ['daily', 'weekly', 'churn'],
    });
  }

  console.log(`[REATTENTION] Running action: ${action}`);
  const startTime = Date.now();

  try {
    let result: { sent: number; skipped: number };

    switch (action) {
      case 'daily':
        result = await runDailyReminders();
        break;
      case 'weekly':
        result = await runWeeklySummaries();
        break;
      case 'churn':
        result = await runChurnDetection();
        break;
      default:
        return res.status(400).json({ error: 'Unknown action' });
    }

    const duration = Date.now() - startTime;
    console.log(`[REATTENTION] Completed: ${action} — ${result.sent} sent, ${result.skipped} skipped (${duration}ms)`);

    return res.status(200).json({
      success: true,
      action,
      ...result,
      durationMs: duration,
    });
  } catch (error: any) {
    console.error(`[REATTENTION] Error in ${action}:`, error);
    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to run reattention',
    });
  }
}
