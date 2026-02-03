/**
 * API Route: Send Coaching Approval/Rejection Emails
 * 
 * POST /api/send-coaching-email
 * Body: { type: 'approved' | 'rejected' | 'request', data: {...} }
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

// =============================================================================
// E-MAIL TEMPLATES (Table-basiert, optimiert)
// =============================================================================

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

const logoHeader = () => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding-bottom: 32px;">
        <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
      </td>
    </tr>
  </table>
`;

const iconBox = (emoji: string, bgColor: string, size = 64) => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding-bottom: 16px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" valign="middle" style="width: ${size}px; height: ${size}px; background: ${bgColor}; border-radius: 16px;">
              <span style="font-size: ${Math.round(size / 2)}px; line-height: ${size}px;">${emoji}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
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

// =============================================================================
// TEMPLATE: Coaching Approved (an Athlet)
// =============================================================================

interface CoachingApprovedData {
  athleteName: string;
  athleteEmail: string;
  coachName: string;
  productName: string;
}

const coachingApprovedTemplate = (data: CoachingApprovedData) => ({
  subject: '✅ Dein Coaching wurde genehmigt!',
  html: emailWrapper(`
    ${logoHeader()}
    ${iconBox('🎉', 'rgba(0, 255, 0, 0.1)')}
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center">
          <h1 style="color: ${accentColor}; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Coaching genehmigt!</h1>
        </td>
      </tr>
    </table>
    
    <p style="color: #FFFFFF; font-size: 16px; margin: 24px 0 8px 0;">Hallo ${data.athleteName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      großartige Neuigkeiten! <strong style="color: #FFFFFF;">${data.coachName}</strong> hat deine Coaching-Anfrage für 
      <strong style="color: #FFFFFF;">${data.productName}</strong> angenommen.
    </p>
    
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(180deg, #1C1C1E 0%, #141414 100%); border: 1px solid ${accentColor}; border-radius: 16px; margin: 16px 0;">
      <tr>
        <td style="padding: 24px;">
          <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">COACHING GESTARTET</p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #27272A; border-radius: 12px;">
            <tr>
              <td style="padding: 16px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #3F3F46;">
                      <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td style="color: #71717A; font-size: 13px;">Coach</td>
                          <td align="right" style="color: #FFFFFF; font-size: 13px; font-weight: bold;">${data.coachName}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0;">
                      <table cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td style="color: #71717A; font-size: 13px;">Paket</td>
                          <td align="right" style="color: ${accentColor}; font-size: 13px; font-weight: bold;">${data.productName}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 24px 0 12px 0;">🚀 Nächste Schritte</p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #18181B; border-radius: 12px;">
      <tr>
        <td style="padding: 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
            <tr>
              <td width="36" valign="top">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" valign="middle" style="width: 24px; height: 24px; background: rgba(0, 255, 0, 0.1); border-radius: 6px;">
                      <span style="color: ${accentColor}; font-size: 12px; font-weight: bold; line-height: 24px;">1</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td valign="middle" style="color: #A1A1AA; font-size: 13px; padding-left: 8px;">Öffne dein Dashboard</td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
            <tr>
              <td width="36" valign="top">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" valign="middle" style="width: 24px; height: 24px; background: rgba(0, 255, 0, 0.1); border-radius: 6px;">
                      <span style="color: ${accentColor}; font-size: 12px; font-weight: bold; line-height: 24px;">2</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td valign="middle" style="color: #A1A1AA; font-size: 13px; padding-left: 8px;">Vervollständige dein Athleten-Profil</td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="36" valign="top">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" valign="middle" style="width: 24px; height: 24px; background: rgba(0, 255, 0, 0.1); border-radius: 6px;">
                      <span style="color: ${accentColor}; font-size: 12px; font-weight: bold; line-height: 24px;">3</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td valign="middle" style="color: #A1A1AA; font-size: 13px; padding-left: 8px;">Warte auf deinen ersten Trainingsplan</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background: ${accentColor}; border-radius: 12px;">
                <a href="https://dev.greenlight-fitness.de" target="_blank" style="display: inline-block; padding: 16px 40px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none;">Zum Dashboard →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
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

// =============================================================================
// TEMPLATE: Coaching Rejected (an Athlet)
// =============================================================================

interface CoachingRejectedData {
  athleteName: string;
  athleteEmail: string;
  coachName: string;
  productName: string;
  reason: string;
}

const coachingRejectedTemplate = (data: CoachingRejectedData) => ({
  subject: 'Information zu deiner Coaching-Anfrage',
  html: emailWrapper(`
    ${logoHeader()}
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center">
          <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0;">Coaching-Anfrage</h1>
        </td>
      </tr>
    </table>
    
    <p style="color: #FFFFFF; font-size: 16px; margin: 24px 0 8px 0;">Hallo ${data.athleteName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      leider konnte <strong style="color: #FFFFFF;">${data.coachName}</strong> deine Anfrage für 
      <strong style="color: #FFFFFF;">${data.productName}</strong> nicht annehmen.
    </p>
    
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(180deg, #1C1C1E 0%, #141414 100%); border: 1px solid #EF4444; border-radius: 16px; margin: 16px 0;">
      <tr>
        <td style="padding: 24px;">
          <p style="color: #EF4444; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">ANFRAGE NICHT ANGENOMMEN</p>
          <p style="color: #A1A1AA; font-size: 13px; margin: 0;">
            <strong style="color: #FFFFFF;">Grund:</strong> ${data.reason || 'Keine Angabe'}
          </p>
        </td>
      </tr>
    </table>
    
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: rgba(0, 255, 0, 0.05); border: 1px solid ${accentColor}33; border-radius: 12px; margin: 16px 0;">
      <tr>
        <td style="padding: 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="30" valign="top" style="font-size: 18px; line-height: 1;">💰</td>
              <td valign="middle" style="color: ${accentColor}; font-size: 13px; padding-left: 8px;">
                <strong style="color: #FFFFFF;">Erstattung:</strong> Deine Zahlung wird innerhalb von 5-10 Werktagen erstattet.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 24px 0 12px 0;">🔄 Alternativen</p>
    <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 16px 0;">
      Du kannst gerne ein anderes Coaching-Paket buchen oder dich an unseren Support wenden.
    </p>
    
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background: ${accentColor}; border-radius: 12px;">
                <a href="https://greenlight-fitness.de/shop" target="_blank" style="display: inline-block; padding: 16px 40px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none;">Zum Shop →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
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

// =============================================================================
// TEMPLATE: New Coaching Request (an Coach)
// =============================================================================

interface CoachingRequestData {
  coachName: string;
  coachEmail: string;
  athleteName: string;
  athleteEmail: string;
  productName: string;
}

const coachingRequestTemplate = (data: CoachingRequestData) => ({
  subject: `🏋️ Neue Coaching-Anfrage von ${data.athleteName}`,
  html: emailWrapper(`
    ${logoHeader()}
    ${iconBox('🏋️', 'rgba(0, 255, 0, 0.1)')}
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center">
          <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0;">Neue Coaching-Anfrage</h1>
        </td>
      </tr>
    </table>
    
    <p style="color: #FFFFFF; font-size: 16px; margin: 24px 0 8px 0;">Hallo ${data.coachName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">du hast eine neue Coaching-Anfrage erhalten!</p>
    
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(180deg, #1C1C1E 0%, #141414 100%); border: 1px solid ${accentColor}; border-radius: 16px; margin: 16px 0;">
      <tr>
        <td style="padding: 24px;">
          <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">NEUE ANFRAGE</p>
          
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="60" valign="top">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" valign="middle" style="width: 48px; height: 48px; background: rgba(0, 255, 0, 0.1); border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 50%;">
                      <span style="color: ${accentColor}; font-size: 20px; font-weight: bold; line-height: 48px;">${data.athleteName.charAt(0).toUpperCase()}</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td valign="middle">
                <p style="color: #FFFFFF; font-size: 16px; font-weight: bold; margin: 0;">${data.athleteName}</p>
                <p style="color: #71717A; font-size: 13px; margin: 4px 0 0 0;">${data.athleteEmail}</p>
              </td>
            </tr>
          </table>
          
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #27272A; border-radius: 12px; margin-top: 16px;">
            <tr>
              <td style="padding: 16px;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="color: #71717A; font-size: 13px;">Paket</td>
                    <td align="right" style="color: #FFFFFF; font-size: 13px; font-weight: bold;">${data.productName}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" style="background: ${accentColor}; border-radius: 12px;">
                <a href="https://dev.greenlight-fitness.de" target="_blank" style="display: inline-block; padding: 16px 40px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none;">Zum Dashboard →</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: rgba(251, 191, 36, 0.1); border: 1px solid #FCD34D33; border-radius: 12px; margin: 16px 0;">
      <tr>
        <td style="padding: 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td width="30" valign="top" style="font-size: 18px; line-height: 1;">⏰</td>
              <td valign="middle" style="color: #FCD34D; font-size: 13px; padding-left: 8px;">
                Bitte antworte innerhalb von <strong>48 Stunden</strong>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
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

// =============================================================================
// API HANDLER
// =============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({ error: 'Missing type or data' });
    }

    let email: { subject: string; html: string };
    let to: string;

    switch (type) {
      case 'approved':
        email = coachingApprovedTemplate(data as CoachingApprovedData);
        to = data.athleteEmail;
        break;
      
      case 'rejected':
        email = coachingRejectedTemplate(data as CoachingRejectedData);
        to = data.athleteEmail;
        break;
      
      case 'request':
        email = coachingRequestTemplate(data as CoachingRequestData);
        to = data.coachEmail;
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid type', validTypes: ['approved', 'rejected', 'request'] });
    }

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: email.subject,
      html: email.html,
    });

    console.log(`[COACHING EMAIL] Type: ${type}, To: ${to}, ID: ${result.data?.id}`);

    return res.status(200).json({
      success: true,
      messageId: result.data?.id,
      type,
      to,
    });

  } catch (error: any) {
    console.error('[COACHING EMAIL ERROR]', error);
    return res.status(500).json({
      error: 'Failed to send email',
      message: error.message,
    });
  }
}
