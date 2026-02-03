/**
 * API Route: Send Invitation Email
 * POST /api/send-invitation-email
 */

import { Resend } from 'resend';

interface VercelRequest {
  method?: string;
  body: any;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(data: any): void;
}

const resend = new Resend(process.env.RESEND_API_KEY || 're_EgDdSN3B_6FByK2mukgRGTmCczBKbd8ot');
const FROM_EMAIL = 'Greenlight Fitness <noreply@mail.greenlight-fitness.de>';

const accentColor = '#00FF00';

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0A0A0A;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">
          <tr><td>${content}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const footer = () => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 40px; border-top: 1px solid #27272A; padding-top: 24px;">
    <tr>
      <td align="center" style="color: #71717A; font-size: 12px; padding-bottom: 8px;">
        Greenlight Fitness GmbH
      </td>
    </tr>
    <tr>
      <td align="center" style="color: #71717A; font-size: 12px;">
        <a href="https://greenlight-fitness.de/impressum" style="color: #71717A; text-decoration: underline;">Impressum</a>
        &nbsp;•&nbsp;
        <a href="https://greenlight-fitness.de/datenschutz" style="color: #71717A; text-decoration: underline;">Datenschutz</a>
      </td>
    </tr>
  </table>
`;

interface InvitationEmailData {
  email: string;
  inviterName: string;
  personalMessage?: string;
  inviteLink: string;
  inviteCode: string;
}

const generateInvitationEmail = (data: InvitationEmailData) => ({
  subject: `🎯 ${data.inviterName} lädt dich zu Greenlight Fitness ein!`,
  html: emailWrapper(`
    <!-- Logo -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 32px;">
          <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
        </td>
      </tr>
    </table>
    
    <!-- Hero Icon -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding-bottom: 16px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" valign="middle" style="width: 80px; height: 80px; background: linear-gradient(135deg, rgba(0, 255, 0, 0.2), rgba(0, 255, 0, 0.05)); border-radius: 20px;">
                <span style="font-size: 40px; line-height: 80px;">🎯</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <!-- Title -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center">
          <h1 style="color: #FFFFFF; font-size: 28px; font-weight: bold; margin: 0 0 8px 0;">Du bist eingeladen!</h1>
        </td>
      </tr>
    </table>
    
    <!-- Inviter Card -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(180deg, #1C1C1E 0%, #141414 100%); border: 1px solid ${accentColor}; border-radius: 16px; margin: 24px 0;">
      <tr>
        <td style="padding: 24px;">
          <!-- Avatar + Name -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="60" valign="top">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" valign="middle" style="width: 48px; height: 48px; background: rgba(0, 255, 0, 0.1); border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 50%;">
                      <span style="color: ${accentColor}; font-size: 20px; font-weight: bold; line-height: 48px;">${data.inviterName.charAt(0).toUpperCase()}</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td valign="middle">
                <p style="color: #FFFFFF; font-size: 16px; font-weight: bold; margin: 0;">${data.inviterName}</p>
                <p style="color: #71717A; font-size: 13px; margin: 4px 0 0 0;">Premium Coach</p>
              </td>
            </tr>
          </table>
          
          ${data.personalMessage ? `
          <!-- Personal Message -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #27272A; border-radius: 12px; margin-top: 16px;">
            <tr>
              <td style="padding: 16px;">
                <p style="color: #71717A; font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 0 0 8px 0;">Persönliche Nachricht</p>
                <p style="color: #A1A1AA; font-size: 14px; margin: 0; font-style: italic;">"${data.personalMessage}"</p>
              </td>
            </tr>
          </table>
          ` : ''}
        </td>
      </tr>
    </table>
    
    <!-- Description -->
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0; text-align: center;">
      <strong style="color: #FFFFFF;">${data.inviterName}</strong> möchte, dass du Teil von Greenlight Fitness wirst. 
      Starte jetzt mit deinem personalisierten Trainingserlebnis!
    </p>
    
    <!-- CTA Button -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background: ${accentColor}; border-radius: 12px;">
                <a href="${data.inviteLink}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none;">Einladung annehmen →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <!-- Expiry Notice -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: rgba(251, 191, 36, 0.1); border: 1px solid #FCD34D33; border-radius: 12px; margin: 16px 0;">
      <tr>
        <td style="padding: 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="30" valign="top" style="font-size: 18px; line-height: 1;">⏰</td>
              <td valign="middle" style="color: #FCD34D; font-size: 13px; padding-left: 8px;">
                Diese Einladung ist <strong>7 Tage</strong> gültig
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <!-- Link fallback -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 24px;">
      <tr>
        <td align="center">
          <p style="color: #71717A; font-size: 12px; margin: 0 0 8px 0;">
            Falls der Button nicht funktioniert, kopiere diesen Link:
          </p>
          <p style="color: #3B82F6; font-size: 12px; margin: 0; word-break: break-all;">
            <a href="${data.inviteLink}" style="color: #3B82F6; text-decoration: underline;">${data.inviteLink}</a>
          </p>
        </td>
      </tr>
    </table>
    
    <!-- Signature -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 32px;">
      <tr>
        <td align="center" style="color: #A1A1AA; font-size: 14px;">
          Sportliche Grüße,<br>
          <strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
        </td>
      </tr>
    </table>
    
    ${footer()}
  `)
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body as InvitationEmailData;

    if (!data.email || !data.inviterName || !data.inviteLink) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const email = generateInvitationEmail(data);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.email],
      subject: email.subject,
      html: email.html,
    });

    console.log(`[INVITATION EMAIL] To: ${data.email}, ID: ${result.data?.id}`);

    return res.status(200).json({
      success: true,
      messageId: result.data?.id,
    });

  } catch (error: any) {
    console.error('[INVITATION EMAIL ERROR]', error);
    return res.status(500).json({
      error: 'Failed to send email',
      message: error.message,
    });
  }
}
