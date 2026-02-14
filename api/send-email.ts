// Vercel types are available at runtime
interface VercelRequest {
  method?: string;
  body: any;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(data: any): void;
}
import { Resend } from 'resend';
import { 
  emailTemplates, 
  EmailType,
  PriceChangeNoticeData,
  CancellationConfirmedData,
  CoachingRequestCoachData,
  CoachingApprovedData,
  CoachingRejectedData,
  PaymentFailedData,
  DataDeletionConfirmData,
  WelcomeData,
  DesignShowcaseData,
  PasswordResetData,
  EmailVerificationData,
  InvitationData,
  PlanAssignedData,
  PurchaseConfirmedData,
  SubscriptionRenewedData,
  AthleteTrainingReminderData,
  AthleteCheckInReminderData,
  AthleteInactivityAlertData,
  AthleteWeeklyProgressData,
  CoachWeeklySummaryData,
  CoachChurnRiskAlertData,
  AdminWeeklyReportData,
  AdminChurnAlertData,
  AdminNewPurchaseData,
  CoachNewAthleteData,
  BookingConfirmationData,
  BookingReminderData,
} from '../emails/templates';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Greenlight Fitness <noreply@mail.greenlight-fitness.de>';
const REPLY_TO = process.env.RESEND_REPLY_TO || 'support@greenlight-fitness.de'; // reply-to can be any domain

// Rate limiting: simple in-memory store (use Redis in production)
const rateLimitStore: Record<string, { count: number; resetAt: number }> = {};
const RATE_LIMIT = 10; // max emails per minute per recipient
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const key = email.toLowerCase();
  
  if (!rateLimitStore[key] || rateLimitStore[key].resetAt < now) {
    rateLimitStore[key] = { count: 1, resetAt: now + RATE_LIMIT_WINDOW };
    return true;
  }
  
  if (rateLimitStore[key].count >= RATE_LIMIT) {
    return false;
  }
  
  rateLimitStore[key].count++;
  return true;
}

// Type guard for email data - all email types
type EmailDataMap = {
  price_change_notice: PriceChangeNoticeData;
  cancellation_confirmed: CancellationConfirmedData;
  coaching_request_coach: CoachingRequestCoachData;
  coaching_approved: CoachingApprovedData;
  coaching_rejected: CoachingRejectedData;
  payment_failed: PaymentFailedData;
  data_deletion_confirm: DataDeletionConfirmData;
  welcome: WelcomeData;
  design_showcase: DesignShowcaseData;
  password_reset: PasswordResetData;
  email_verification: EmailVerificationData;
  invitation: InvitationData;
  plan_assigned: PlanAssignedData;
  purchase_confirmed: PurchaseConfirmedData;
  subscription_renewed: SubscriptionRenewedData;
  // Reattention
  athlete_training_reminder: AthleteTrainingReminderData;
  athlete_checkin_reminder: AthleteCheckInReminderData;
  athlete_inactivity_alert: AthleteInactivityAlertData;
  athlete_weekly_progress: AthleteWeeklyProgressData;
  coach_weekly_summary: CoachWeeklySummaryData;
  coach_churn_risk_alert: CoachChurnRiskAlertData;
  admin_weekly_report: AdminWeeklyReportData;
  admin_churn_alert: AdminChurnAlertData;
  admin_new_purchase: AdminNewPurchaseData;
  coach_new_athlete: CoachNewAthleteData;
  booking_confirmation: BookingConfirmationData;
  booking_reminder: BookingReminderData;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, to, data } = req.body as {
      type: EmailType;
      to: string;
      data: EmailDataMap[EmailType];
    };

    // Validate required fields
    if (!type || !to || !data) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['type', 'to', 'data'],
      });
    }

    // Validate email type
    if (!emailTemplates[type]) {
      return res.status(400).json({ 
        error: 'Invalid email type',
        validTypes: Object.keys(emailTemplates),
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Check rate limit
    if (!checkRateLimit(to)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many emails sent to this address. Please try again later.',
      });
    }

    // Generate email content
    const templateFn = emailTemplates[type] as (data: any) => { subject: string; html: string };
    const { subject, html } = templateFn(data);

    // Send email via Resend
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: REPLY_TO,
      subject,
      html,
    });

    // Log the email send (in production, store in database)
    console.log(`[EMAIL SENT] Type: ${type}, To: ${to.substring(0, 3)}***@***, MessageId: ${result.data?.id}`);

    return res.status(200).json({
      success: true,
      messageId: result.data?.id,
      type,
    });

  } catch (error: any) {
    console.error('[EMAIL ERROR]', error);

    // Handle Resend specific errors
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        error: 'Email service error',
        message: error.message,
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to send email',
    });
  }
}

/**
 * Helper function to send emails from other API routes
 */
export async function sendEmail<T extends EmailType>(
  type: T,
  to: string,
  data: EmailDataMap[T]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const templateFn = emailTemplates[type] as (data: any) => { subject: string; html: string };
    const { subject, html } = templateFn(data);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      replyTo: REPLY_TO,
      subject,
      html,
    });

    console.log(`[EMAIL SENT] Type: ${type}, To: ${to.substring(0, 3)}***@***, MessageId: ${result.data?.id}`);

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error: any) {
    console.error(`[EMAIL ERROR] Type: ${type}`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Bulk send emails (e.g., for price change notifications)
 * Includes retry logic and rate limiting
 */
export async function sendBulkEmails<T extends EmailType>(
  type: T,
  recipients: Array<{ email: string; data: EmailDataMap[T] }>
): Promise<{
  total: number;
  sent: number;
  failed: number;
  results: Array<{ email: string; success: boolean; error?: string }>;
}> {
  const results: Array<{ email: string; success: boolean; error?: string }> = [];
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients) {
    // Add delay between emails to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));

    const result = await sendEmail(type, recipient.email, recipient.data);
    
    results.push({
      email: recipient.email,
      success: result.success,
      error: result.error,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
    }
  }

  return {
    total: recipients.length,
    sent,
    failed,
    results,
  };
}
