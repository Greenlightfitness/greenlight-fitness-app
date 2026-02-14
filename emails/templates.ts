/**
 * Greenlight Fitness - E-Mail Templates
 * 
 * DSGVO-konforme E-Mail-Templates mit Kachel-Design
 * Verwendung mit Resend API
 * 
 * KOMPATIBILITÄT: Optimiert für alle E-Mail-Clients (Outlook, Gmail, Apple Mail, etc.)
 * - Kein Flexbox (nicht unterstützt in Outlook)
 * - Table-basierte Layouts
 * - Inline Styles
 * - MSO Conditional Comments für Outlook
 */

import {
  athleteTrainingReminder,
  athleteCheckInReminder,
  athleteInactivityAlert,
  athleteWeeklyProgress,
  coachWeeklySummary,
  coachChurnRiskAlert,
  adminWeeklyReport,
  adminChurnAlert,
} from './reattention';

export type {
  AthleteTrainingReminderData,
  AthleteCheckInReminderData,
  AthleteInactivityAlertData,
  AthleteWeeklyProgressData,
  CoachWeeklySummaryData,
  CoachChurnRiskAlertData,
  AdminWeeklyReportData,
  AdminChurnAlertData,
} from './reattention';

// Base styles for consistent design
const baseStyles = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  backgroundColor: '#0A0A0A',
  color: '#FFFFFF',
};

const cardStyles = `
  background: linear-gradient(180deg, #1C1C1E 0%, #0A0A0A 100%);
  border: 1px solid #27272A;
  border-radius: 16px;
  padding: 24px;
  margin: 16px 0;
`;

const accentColor = '#00FF00';

// =============================================================================
// KOMPATIBLE HELPER-KOMPONENTEN (Table-basiert)
// =============================================================================

/**
 * Icon-Container: Zentriertes Icon in einem farbigen Quadrat
 * Ersetzt: display: inline-flex; align-items: center; justify-content: center;
 */
const iconBox = (emoji: string, bgColor: string, size: number = 64) => `
  <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 16px auto;">
    <tr>
      <td align="center" valign="middle" style="width: ${size}px; height: ${size}px; background: ${bgColor}; border-radius: 16px;">
        <span style="font-size: ${Math.round(size / 2)}px; line-height: 1;">${emoji}</span>
      </td>
    </tr>
  </table>
`;

/**
 * Avatar-Circle: Runder Avatar mit Initiale
 */
const avatarCircle = (initial: string, size: number = 48) => `
  <table cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" valign="middle" style="width: ${size}px; height: ${size}px; background: rgba(0, 255, 0, 0.1); border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 50%;">
        <span style="color: ${accentColor}; font-size: ${Math.round(size / 2.4)}px; font-weight: bold; line-height: 1;">${initial}</span>
      </td>
    </tr>
  </table>
`;

/**
 * Feature-Tile: Icon + Text nebeneinander
 * Ersetzt: display: flex; align-items: center; gap: 12px;
 */
const featureTile = (emoji: string, bgColor: string, title: string, subtitle: string) => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #27272A; border-radius: 12px; margin-bottom: 12px;">
    <tr>
      <td style="padding: 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="52" valign="middle">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" valign="middle" style="width: 40px; height: 40px; background: ${bgColor}; border-radius: 10px;">
                    <span style="font-size: 20px; line-height: 1;">${emoji}</span>
                  </td>
                </tr>
              </table>
            </td>
            <td valign="middle" style="padding-left: 12px;">
              <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0;">${title}</p>
              <p style="color: #71717A; font-size: 12px; margin: 4px 0 0 0;">${subtitle}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

/**
 * Data-Row: Label + Wert nebeneinander
 * Ersetzt: display: flex; justify-content: space-between;
 */
const dataRow = (label: string, value: string, valueColor: string = '#FFFFFF', isLast: boolean = false) => `
  <tr>
    <td style="padding: 12px 0; ${!isLast ? 'border-bottom: 1px solid #3F3F46;' : ''}">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="color: #71717A; font-size: 13px;">${label}</td>
          <td align="right" style="color: ${valueColor}; font-size: 13px; font-weight: ${valueColor !== '#71717A' ? 'bold' : 'normal'};">${value}</td>
        </tr>
      </table>
    </td>
  </tr>
`;

/**
 * Step-Item: Nummerierter Schritt
 * Ersetzt: display: flex; align-items: center; gap: 12px;
 */
const stepItem = (num: number, text: string, color: string = accentColor) => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
    <tr>
      <td width="40" valign="middle">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" valign="middle" style="width: 24px; height: 24px; background: ${color === accentColor ? 'rgba(0, 255, 0, 0.1)' : 'rgba(59, 130, 246, 0.1)'}; border-radius: 6px;">
              <span style="color: ${color}; font-size: 12px; font-weight: bold; line-height: 1;">${num}</span>
            </td>
          </tr>
        </table>
      </td>
      <td valign="middle" style="color: #A1A1AA; font-size: 13px;">${text}</td>
    </tr>
  </table>
`;

/**
 * Info-Box: Farbige Box mit Icon + Text
 */
const infoBox = (emoji: string, text: string, bgColor: string, textColor: string) => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: ${bgColor}; border: 1px solid ${textColor}33; border-radius: 12px; margin: 16px 0;">
    <tr>
      <td style="padding: 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="30" valign="top" style="font-size: 18px;">${emoji}</td>
            <td valign="middle" style="color: ${textColor}; font-size: 13px;">${text}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

/**
 * Primary Button (CTA)
 */
const primaryButton = (text: string, href: string) => `
  <table cellpadding="0" cellspacing="0" border="0" style="margin: 32px auto;">
    <tr>
      <td align="center" style="background: ${accentColor}; border-radius: 12px;">
        <a href="${href}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none;">${text}</a>
      </td>
    </tr>
  </table>
`;

/**
 * Secondary Button
 */
const secondaryButton = (text: string, href: string, color: string = '#3B82F6') => `
  <table cellpadding="0" cellspacing="0" border="0" style="margin: 16px auto;">
    <tr>
      <td align="center" style="background: ${color}; border-radius: 10px;">
        <a href="${href}" target="_blank" style="display: inline-block; padding: 12px 24px; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none;">${text}</a>
      </td>
    </tr>
  </table>
`;

// Footer with legal requirements (DSGVO Art. 7(3), Art. 13/14, ePrivacy)
const getFooter = () => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #27272A;">
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
        &nbsp;•&nbsp;
        <a href="mailto:support@greenlight-fitness.de" style="color: #71717A; text-decoration: underline;">Kontakt</a>
      </td>
    </tr>
    <tr>
      <td align="center" style="color: #52525B; font-size: 11px; padding-top: 12px;">
        Du erhältst diese E-Mail, weil du ein Greenlight Fitness Konto hast.<br>
        <a href="https://app.greenlight-fitness.de/profile#notifications" style="color: #52525B; text-decoration: underline;">E-Mail-Einstellungen ändern</a>
        &nbsp;•&nbsp;
        <a href="https://app.greenlight-fitness.de/api/unsubscribe" style="color: #52525B; text-decoration: underline;">Alle E-Mails abbestellen</a>
      </td>
    </tr>
  </table>
`;

// =============================================================================
// E-Mail Template Interfaces
// =============================================================================

export interface PriceChangeNoticeData {
  firstName: string;
  productName: string;
  oldPrice: string;
  newPrice: string;
  interval: string;
  effectiveDate: string;
  cancellationDeadline: string;
  portalLink: string;
}

export interface CancellationConfirmedData {
  firstName: string;
  productName: string;
  cancellationDate: string;
  accessUntilDate: string;
  cancellationId: string;
}

export interface CoachingRequestCoachData {
  coachName: string;
  athleteName: string;
  athleteEmail: string;
  productName: string;
  requestDate: string;
  dashboardLink: string;
}

export interface CoachingApprovedData {
  athleteName: string;
  coachName: string;
  productName: string;
  startDate: string;
  dashboardLink: string;
}

export interface CoachingRejectedData {
  athleteName: string;
  coachName: string;
  rejectionReason: string;
  shopLink: string;
}

export interface PaymentFailedData {
  firstName: string;
  productName: string;
  amount: string;
  dueDate: string;
  portalLink: string;
}

export interface DataDeletionConfirmData {
  firstName: string;
  deletionDate: string;
  deletionId: string;
}

// =============================================================================
// E-Mail Templates
// =============================================================================

/**
 * 🔴 KRITISCH: Preisänderungs-Ankündigung
 * Muss 30+ Tage vor Änderung versendet werden!
 */
export const priceChangeNotice = (data: PriceChangeNoticeData): { subject: string; html: string } => ({
  subject: `Wichtig: Änderung deines ${data.productName}-Abonnements`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(251, 191, 36, 0.1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 32px;">⚠️</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">
        Wichtige Änderung
      </h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">
        Dein Abonnement wird angepasst
      </p>
    </div>

    <!-- Greeting -->
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">
      Hallo ${data.firstName},
    </p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      wir möchten dich über eine bevorstehende Änderung deines Abonnements informieren.
    </p>

    <!-- Price Change Card -->
    <div style="${cardStyles}">
      <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">
        PREISÄNDERUNG
      </p>
      
      <div style="display: flex; margin-bottom: 12px;">
        <div style="flex: 1;">
          <p style="color: #71717A; font-size: 12px; margin: 0 0 4px 0;">Produkt</p>
          <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0;">${data.productName}</p>
        </div>
      </div>
      
      <div style="background: #27272A; border-radius: 12px; padding: 16px; margin-top: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="text-align: center;">
            <p style="color: #71717A; font-size: 10px; margin: 0 0 4px 0;">ALTER PREIS</p>
            <p style="color: #EF4444; font-size: 18px; font-weight: bold; margin: 0; text-decoration: line-through;">${data.oldPrice}</p>
            <p style="color: #71717A; font-size: 10px; margin: 4px 0 0 0;">/ ${data.interval}</p>
          </div>
          <div style="color: #71717A; font-size: 20px;">→</div>
          <div style="text-align: center;">
            <p style="color: #71717A; font-size: 10px; margin: 0 0 4px 0;">NEUER PREIS</p>
            <p style="color: ${accentColor}; font-size: 18px; font-weight: bold; margin: 0;">${data.newPrice}</p>
            <p style="color: #71717A; font-size: 10px; margin: 4px 0 0 0;">/ ${data.interval}</p>
          </div>
        </div>
      </div>
      
      <p style="color: #71717A; font-size: 12px; margin: 16px 0 0 0; text-align: center;">
        Gültig ab: <strong style="color: #FFFFFF;">${data.effectiveDate}</strong>
      </p>
    </div>

    <!-- Cancellation Right Card -->
    <div style="${cardStyles} border-color: #3B82F6;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 20px;">📋</span>
        <div>
          <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">
            Dein Sonderkündigungsrecht
          </p>
          <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 12px 0;">
            Aufgrund dieser Preisänderung hast du das Recht, dein Abonnement 
            <strong style="color: #FFFFFF;">bis zum ${data.cancellationDeadline}</strong> zu kündigen.
          </p>
          <a href="${data.portalLink}" style="display: inline-block; background: #3B82F6; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">
            Zur Kündigung →
          </a>
        </div>
      </div>
    </div>

    <!-- Info -->
    <p style="color: #71717A; font-size: 13px; margin: 24px 0;">
      Wenn du nichts unternimmst, wird dein Abonnement ab dem ${data.effectiveDate} zum neuen Preis fortgeführt.
    </p>

    <!-- Signature -->
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0;">
      Sportliche Grüße,<br>
      <strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>

    ${getFooter()}
  </div>
</body>
</html>
  `,
});

/**
 * 🔴 KRITISCH: Kündigungsbestätigung
 */
export const cancellationConfirmed = (data: CancellationConfirmedData): { subject: string; html: string } => ({
  subject: `Bestätigung deiner Kündigung`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(239, 68, 68, 0.1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 32px;">✓</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">
        Kündigung bestätigt
      </h1>
    </div>

    <!-- Greeting -->
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">
      Hallo ${data.firstName},
    </p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      wir bestätigen hiermit die Kündigung deines Abonnements.
    </p>

    <!-- Cancellation Details Card -->
    <div style="${cardStyles}">
      <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">
        KÜNDIGUNGSBESTÄTIGUNG
      </p>
      
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Produkt</span>
          <span style="color: #FFFFFF; font-size: 13px; font-weight: bold;">${data.productName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Gekündigt am</span>
          <span style="color: #FFFFFF; font-size: 13px;">${data.cancellationDate}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Zugang bis</span>
          <span style="color: ${accentColor}; font-size: 13px; font-weight: bold;">${data.accessUntilDate}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Referenz-Nr.</span>
          <span style="color: #71717A; font-size: 13px; font-family: monospace;">${data.cancellationId}</span>
        </div>
      </div>
    </div>

    <!-- Info -->
    <p style="color: #A1A1AA; font-size: 13px; margin: 24px 0;">
      Du hast noch bis zum <strong style="color: #FFFFFF;">${data.accessUntilDate}</strong> vollen Zugriff 
      auf alle Funktionen deines Pakets.
    </p>

    <p style="color: #71717A; font-size: 13px; margin: 24px 0;">
      Wir würden uns freuen, dich in Zukunft wieder begrüßen zu dürfen!
    </p>

    <!-- Signature -->
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0;">
      Sportliche Grüße,<br>
      <strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>

    ${getFooter()}
  </div>
</body>
</html>
  `,
});

/**
 * 🟡 WICHTIG: Coaching-Anfrage an Coach
 */
export const coachingRequestCoach = (data: CoachingRequestCoachData): { subject: string; html: string } => ({
  subject: `🏋️ Neue Coaching-Anfrage von ${data.athleteName}`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(0, 255, 0, 0.1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 32px;">🏋️</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">
        Neue Coaching-Anfrage
      </h1>
    </div>

    <!-- Greeting -->
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">
      Hallo ${data.coachName},
    </p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      du hast eine neue Coaching-Anfrage erhalten!
    </p>

    <!-- Request Card -->
    <div style="${cardStyles} border-color: ${accentColor};">
      <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">
        NEUE ANFRAGE
      </p>
      
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
        <div style="width: 48px; height: 48px; background: rgba(0, 255, 0, 0.1); border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <span style="color: ${accentColor}; font-size: 20px; font-weight: bold;">${data.athleteName.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <p style="color: #FFFFFF; font-size: 16px; font-weight: bold; margin: 0;">${data.athleteName}</p>
          <p style="color: #71717A; font-size: 13px; margin: 4px 0 0 0;">${data.athleteEmail}</p>
        </div>
      </div>
      
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #71717A; font-size: 13px;">Paket</span>
          <span style="color: #FFFFFF; font-size: 13px; font-weight: bold;">${data.productName}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Angefragt am</span>
          <span style="color: #71717A; font-size: 13px;">${data.requestDate}</span>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.dashboardLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
        Zum Dashboard →
      </a>
    </div>

    <!-- Warning -->
    <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 16px; text-align: center;">
      <p style="color: #FCD34D; font-size: 13px; margin: 0;">
        ⏰ Bitte antworte innerhalb von <strong>48 Stunden</strong>
      </p>
    </div>

    <!-- Signature -->
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0;">
      Sportliche Grüße,<br>
      <strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>

    ${getFooter()}
  </div>
</body>
</html>
  `,
});

/**
 * 🟡 WICHTIG: Coaching genehmigt (an Athlet)
 */
export const coachingApproved = (data: CoachingApprovedData): { subject: string; html: string } => ({
  subject: `✅ Dein Coaching wurde genehmigt!`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(0, 255, 0, 0.1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 32px;">🎉</span>
      </div>
      <h1 style="color: ${accentColor}; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">
        Coaching genehmigt!
      </h1>
    </div>

    <!-- Greeting -->
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">
      Hallo ${data.athleteName},
    </p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      großartige Neuigkeiten! <strong style="color: #FFFFFF;">${data.coachName}</strong> hat deine Coaching-Anfrage angenommen.
    </p>

    <!-- Coaching Started Card -->
    <div style="${cardStyles} border-color: ${accentColor};">
      <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">
        COACHING GESTARTET
      </p>
      
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Coach</span>
          <span style="color: #FFFFFF; font-size: 13px; font-weight: bold;">${data.coachName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Paket</span>
          <span style="color: #FFFFFF; font-size: 13px;">${data.productName}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Start</span>
          <span style="color: ${accentColor}; font-size: 13px; font-weight: bold;">${data.startDate}</span>
        </div>
      </div>
    </div>

    <!-- Next Steps -->
    <div style="margin: 24px 0;">
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">
        🚀 Nächste Schritte
      </p>
      <div style="background: #18181B; border-radius: 12px; padding: 16px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="width: 24px; height: 24px; background: rgba(0, 255, 0, 0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: ${accentColor}; font-size: 12px; font-weight: bold;">1</div>
          <span style="color: #A1A1AA; font-size: 13px;">Öffne dein Dashboard</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="width: 24px; height: 24px; background: rgba(0, 255, 0, 0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: ${accentColor}; font-size: 12px; font-weight: bold;">2</div>
          <span style="color: #A1A1AA; font-size: 13px;">Vervollständige dein Athleten-Profil</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 24px; height: 24px; background: rgba(0, 255, 0, 0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: ${accentColor}; font-size: 12px; font-weight: bold;">3</div>
          <span style="color: #A1A1AA; font-size: 13px;">Warte auf deinen ersten Trainingsplan</span>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.dashboardLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
        Zum Dashboard →
      </a>
    </div>

    <!-- Signature -->
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0;">
      Sportliche Grüße,<br>
      <strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>

    ${getFooter()}
  </div>
</body>
</html>
  `,
});

/**
 * 🟡 WICHTIG: Coaching abgelehnt (an Athlet)
 */
export const coachingRejected = (data: CoachingRejectedData): { subject: string; html: string } => ({
  subject: `Information zu deiner Coaching-Anfrage`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">
        Coaching-Anfrage
      </h1>
    </div>

    <!-- Greeting -->
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">
      Hallo ${data.athleteName},
    </p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      leider konnte <strong style="color: #FFFFFF;">${data.coachName}</strong> deine Coaching-Anfrage nicht annehmen.
    </p>

    <!-- Rejection Card -->
    <div style="${cardStyles} border-color: #EF4444;">
      <p style="color: #EF4444; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        ANFRAGE NICHT ANGENOMMEN
      </p>
      <p style="color: #A1A1AA; font-size: 13px; margin: 0;">
        <strong style="color: #FFFFFF;">Grund:</strong> ${data.rejectionReason}
      </p>
    </div>

    <!-- Refund Info -->
    <div style="background: rgba(0, 255, 0, 0.05); border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 12px; padding: 16px; margin: 24px 0;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 20px;">💰</span>
        <div>
          <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 4px 0;">Erstattung</p>
          <p style="color: #A1A1AA; font-size: 13px; margin: 0;">
            Deine Zahlung wird innerhalb von 5-10 Werktagen erstattet.
          </p>
        </div>
      </div>
    </div>

    <!-- Alternatives -->
    <div style="margin: 24px 0;">
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">
        🔄 Alternativen
      </p>
      <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 16px 0;">
        Du kannst gerne ein anderes Coaching-Paket buchen oder dich an unseren Support wenden.
      </p>
      <a href="${data.shopLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: bold;">
        Zum Shop →
      </a>
    </div>

    <!-- Signature -->
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0;">
      Sportliche Grüße,<br>
      <strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>

    ${getFooter()}
  </div>
</body>
</html>
  `,
});

/**
 * 🟡 WICHTIG: Zahlung fehlgeschlagen
 */
export const paymentFailed = (data: PaymentFailedData): { subject: string; html: string } => ({
  subject: `⚠️ Zahlung fehlgeschlagen - Aktion erforderlich`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(239, 68, 68, 0.1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 32px;">⚠️</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">
        Zahlung fehlgeschlagen
      </h1>
    </div>

    <!-- Greeting -->
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">
      Hallo ${data.firstName},
    </p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      wir konnten deine letzte Zahlung leider nicht einziehen.
    </p>

    <!-- Payment Problem Card -->
    <div style="${cardStyles} border-color: #EF4444;">
      <p style="color: #EF4444; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">
        ZAHLUNGSPROBLEM
      </p>
      
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Produkt</span>
          <span style="color: #FFFFFF; font-size: 13px; font-weight: bold;">${data.productName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Betrag</span>
          <span style="color: #EF4444; font-size: 13px; font-weight: bold;">${data.amount}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Fällig seit</span>
          <span style="color: #71717A; font-size: 13px;">${data.dueDate}</span>
        </div>
      </div>
    </div>

    <!-- Fix Steps -->
    <div style="margin: 24px 0;">
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">
        🔧 So behebst du das Problem
      </p>
      <div style="background: #18181B; border-radius: 12px; padding: 16px;">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="width: 24px; height: 24px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #3B82F6; font-size: 12px; font-weight: bold;">1</div>
          <span style="color: #A1A1AA; font-size: 13px;">Prüfe deine Zahlungsmethode</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div style="width: 24px; height: 24px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #3B82F6; font-size: 12px; font-weight: bold;">2</div>
          <span style="color: #A1A1AA; font-size: 13px;">Stelle sicher, dass genug Guthaben vorhanden ist</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 24px; height: 24px; background: rgba(59, 130, 246, 0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #3B82F6; font-size: 12px; font-weight: bold;">3</div>
          <span style="color: #A1A1AA; font-size: 13px;">Aktualisiere ggf. deine Kartendaten</span>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.portalLink}" style="display: inline-block; background: #3B82F6; color: #FFFFFF; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
        Zahlungsmethode aktualisieren →
      </a>
    </div>

    <!-- Warning -->
    <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 16px; text-align: center;">
      <p style="color: #FCD34D; font-size: 13px; margin: 0;">
        ⏰ Bitte aktualisiere deine Daten innerhalb von <strong>7 Tagen</strong>, um eine Unterbrechung zu vermeiden.
      </p>
    </div>

    <!-- Signature -->
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0;">
      Sportliche Grüße,<br>
      <strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>

    ${getFooter()}
  </div>
</body>
</html>
  `,
});

/**
 * 🔴 KRITISCH: Account-Löschung bestätigt (DSGVO Art. 17)
 */
export const dataDeletionConfirm = (data: DataDeletionConfirmData): { subject: string; html: string } => ({
  subject: `Bestätigung: Dein Account wurde gelöscht`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">
        Account gelöscht
      </h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">
        Gemäß DSGVO Art. 17
      </p>
    </div>

    <!-- Greeting -->
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">
      Hallo ${data.firstName},
    </p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      hiermit bestätigen wir die Löschung deines Accounts gemäß deiner Anfrage.
    </p>

    <!-- Deletion Confirmation Card -->
    <div style="${cardStyles}">
      <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">
        LÖSCHBESTÄTIGUNG
      </p>
      
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Gelöscht am</span>
          <span style="color: #FFFFFF; font-size: 13px;">${data.deletionDate}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Referenz-Nr.</span>
          <span style="color: #71717A; font-size: 13px; font-family: monospace;">${data.deletionId}</span>
        </div>
      </div>
    </div>

    <!-- Deleted Data -->
    <div style="margin: 24px 0;">
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">
        📋 Gelöschte Daten
      </p>
      <div style="background: #18181B; border-radius: 12px; padding: 16px;">
        <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 8px 0;">• Profildaten und Einstellungen</p>
        <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 8px 0;">• Trainingspläne und Logs</p>
        <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 8px 0;">• Wellness-Daten</p>
        <p style="color: #A1A1AA; font-size: 13px; margin: 0;">• Coaching-Beziehungen</p>
      </div>
    </div>

    <!-- Retained Data -->
    <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 16px; margin: 24px 0;">
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">
        📋 Aufbewahrte Daten (Gesetzliche Pflicht)
      </p>
      <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 4px 0;">• Rechnungen (10 Jahre - Steuerrecht)</p>
      <p style="color: #A1A1AA; font-size: 13px; margin: 0;">• Zahlungshistorie (6 Jahre - HGB)</p>
    </div>

    <!-- Contact -->
    <p style="color: #71717A; font-size: 13px; margin: 24px 0;">
      Bei Fragen wende dich an: <a href="mailto:datenschutz@greenlight-fitness.de" style="color: #3B82F6;">datenschutz@greenlight-fitness.de</a>
    </p>

    ${getFooter()}
  </div>
</body>
</html>
  `,
});

// =============================================================================
// Template Map for easy access
// =============================================================================

/**
 * 🟢 Willkommens-E-Mail nach Registrierung
 */
export interface WelcomeData {
  firstName: string;
  dashboardLink: string;
}

export const welcome = (data: WelcomeData): { subject: string; html: string } => ({
  subject: `Willkommen bei Greenlight Fitness! 🎉`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, rgba(0, 255, 0, 0.2), rgba(0, 255, 0, 0.05)); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 40px;">🎉</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 28px; font-weight: bold; margin: 0 0 8px 0;">
        Willkommen, ${data.firstName}!
      </h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">
        Dein Fitness-Journey beginnt jetzt
      </p>
    </div>

    <!-- Welcome Card -->
    <div style="${cardStyles} border-color: ${accentColor};">
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 20px 0;">
        Schön, dass du dabei bist! Mit Greenlight Fitness hast du alles, was du für dein Training brauchst.
      </p>
      
      <!-- Features Grid -->
      <div style="display: grid; gap: 12px;">
        <div style="background: #27272A; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; background: rgba(59, 130, 246, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 20px;">📊</span>
          </div>
          <div>
            <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0;">Trainingsplanung</p>
            <p style="color: #71717A; font-size: 12px; margin: 4px 0 0 0;">Erstelle und verwalte deine Pläne</p>
          </div>
        </div>
        
        <div style="background: #27272A; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; background: rgba(168, 85, 247, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 20px;">💪</span>
          </div>
          <div>
            <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0;">Wellness-Tracking</p>
            <p style="color: #71717A; font-size: 12px; margin: 4px 0 0 0;">Verfolge Schlaf, Energie & Stimmung</p>
          </div>
        </div>
        
        <div style="background: #27272A; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; background: rgba(0, 255, 0, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 20px;">🏆</span>
          </div>
          <div>
            <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0;">Personal Bests</p>
            <p style="color: #71717A; font-size: 12px; margin: 4px 0 0 0;">Tracke deine Rekorde & Fortschritte</p>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.dashboardLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold; box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);">
        Jetzt starten →
      </a>
    </div>

    <!-- Signature -->
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br>
      <strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>

    ${getFooter()}
  </div>
</body>
</html>
  `,
});

/**
 * 🎨 Design Showcase E-Mail (nur für Tests)
 * Zeigt alle Design-Elemente auf einen Blick
 */
export interface DesignShowcaseData {
  recipientName: string;
}

export const designShowcase = (data: DesignShowcaseData): { subject: string; html: string } => ({
  subject: `🎨 Greenlight Fitness - E-Mail Design Showcase`,
  html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    
    <!-- ========== LOGO ========== -->
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 28px; font-weight: bold;">⚡ GREENLIGHT</span>
      <p style="color: #71717A; font-size: 11px; margin: 8px 0 0 0; letter-spacing: 2px;">FITNESS</p>
    </div>

    <!-- ========== HERO SECTION ========== -->
    <div style="text-align: center; margin-bottom: 40px; padding: 40px 20px; background: linear-gradient(180deg, rgba(0, 255, 0, 0.1) 0%, transparent 100%); border-radius: 24px;">
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, rgba(0, 255, 0, 0.3), rgba(0, 255, 0, 0.1)); border: 2px solid rgba(0, 255, 0, 0.3); border-radius: 24px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <span style="font-size: 40px;">🎨</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 32px; font-weight: bold; margin: 0 0 12px 0;">
        Design Showcase
      </h1>
      <p style="color: #A1A1AA; font-size: 16px; margin: 0;">
        Alle E-Mail-Elemente auf einen Blick
      </p>
    </div>

    <!-- ========== GREETING ========== -->
    <p style="color: #FFFFFF; font-size: 18px; margin: 0 0 8px 0;">
      Hallo <strong style="color: ${accentColor};">${data.recipientName}</strong>,
    </p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 32px 0;">
      diese E-Mail zeigt alle Design-Elemente unseres E-Mail-Systems.
    </p>

    <!-- ========== SECTION TITLE ========== -->
    <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #27272A;">
      📦 Karten-Komponenten
    </p>

    <!-- ========== STANDARD CARD ========== -->
    <div style="${cardStyles} margin-bottom: 16px;">
      <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        STANDARD KARTE
      </p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0;">
        Dies ist eine Standard-Karte mit dunklem Hintergrund und dezenter Border.
      </p>
    </div>

    <!-- ========== SUCCESS CARD ========== -->
    <div style="${cardStyles} border-color: ${accentColor}; margin-bottom: 16px;">
      <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        ✅ ERFOLGS-KARTE
      </p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0;">
        Grüner Rand für positive Nachrichten und Bestätigungen.
      </p>
    </div>

    <!-- ========== WARNING CARD ========== -->
    <div style="${cardStyles} border-color: #F59E0B; margin-bottom: 16px;">
      <p style="color: #F59E0B; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        ⚠️ WARNUNGS-KARTE
      </p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0;">
        Gelber Rand für wichtige Hinweise und Warnungen.
      </p>
    </div>

    <!-- ========== ERROR CARD ========== -->
    <div style="${cardStyles} border-color: #EF4444; margin-bottom: 32px;">
      <p style="color: #EF4444; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">
        ❌ FEHLER-KARTE
      </p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0;">
        Roter Rand für Fehler und kritische Informationen.
      </p>
    </div>

    <!-- ========== DATA DISPLAY ========== -->
    <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #27272A;">
      📊 Daten-Anzeige
    </p>

    <div style="${cardStyles} margin-bottom: 32px;">
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Label 1</span>
          <span style="color: #FFFFFF; font-size: 13px; font-weight: bold;">Wert 1</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Label 2</span>
          <span style="color: ${accentColor}; font-size: 13px; font-weight: bold;">Wert (grün)</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Label 3</span>
          <span style="color: #EF4444; font-size: 13px; text-decoration: line-through;">Alter Wert</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Referenz-Nr.</span>
          <span style="color: #71717A; font-size: 13px; font-family: monospace;">ABC-123-XYZ</span>
        </div>
      </div>
    </div>

    <!-- ========== PRICE COMPARISON ========== -->
    <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #27272A;">
      💰 Preis-Vergleich
    </p>

    <div style="${cardStyles} margin-bottom: 32px;">
      <div style="background: #27272A; border-radius: 12px; padding: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-around; text-align: center;">
          <div>
            <p style="color: #71717A; font-size: 10px; margin: 0 0 4px 0;">ALTER PREIS</p>
            <p style="color: #EF4444; font-size: 24px; font-weight: bold; margin: 0; text-decoration: line-through;">29,99 €</p>
            <p style="color: #71717A; font-size: 10px; margin: 4px 0 0 0;">/ Monat</p>
          </div>
          <div style="color: #71717A; font-size: 24px;">→</div>
          <div>
            <p style="color: #71717A; font-size: 10px; margin: 0 0 4px 0;">NEUER PREIS</p>
            <p style="color: ${accentColor}; font-size: 24px; font-weight: bold; margin: 0;">39,99 €</p>
            <p style="color: #71717A; font-size: 10px; margin: 4px 0 0 0;">/ Monat</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ========== FEATURE TILES ========== -->
    <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #27272A;">
      🧩 Feature-Kacheln
    </p>

    <div style="margin-bottom: 32px;">
      <div style="background: #18181B; border: 1px solid #27272A; border-radius: 12px; padding: 16px; margin-bottom: 12px; display: flex; align-items: center; gap: 16px;">
        <div style="width: 48px; height: 48px; background: rgba(59, 130, 246, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24px;">📊</span>
        </div>
        <div>
          <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0;">Feature Titel</p>
          <p style="color: #71717A; font-size: 12px; margin: 4px 0 0 0;">Kurze Beschreibung des Features</p>
        </div>
      </div>

      <div style="background: #18181B; border: 1px solid #27272A; border-radius: 12px; padding: 16px; margin-bottom: 12px; display: flex; align-items: center; gap: 16px;">
        <div style="width: 48px; height: 48px; background: rgba(168, 85, 247, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24px;">💪</span>
        </div>
        <div>
          <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0;">Weiteres Feature</p>
          <p style="color: #71717A; font-size: 12px; margin: 4px 0 0 0;">Mit andersfarbigem Icon</p>
        </div>
      </div>

      <div style="background: #18181B; border: 1px solid #27272A; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 16px;">
        <div style="width: 48px; height: 48px; background: rgba(0, 255, 0, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 24px;">🏆</span>
        </div>
        <div>
          <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0;">Grünes Feature</p>
          <p style="color: #71717A; font-size: 12px; margin: 4px 0 0 0;">Im Greenlight-Style</p>
        </div>
      </div>
    </div>

    <!-- ========== NUMBERED STEPS ========== -->
    <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #27272A;">
      🚀 Nummerierte Schritte
    </p>

    <div style="background: #18181B; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <div style="width: 28px; height: 28px; background: rgba(0, 255, 0, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: ${accentColor}; font-size: 14px; font-weight: bold;">1</div>
        <span style="color: #A1A1AA; font-size: 14px;">Erster Schritt der Anleitung</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <div style="width: 28px; height: 28px; background: rgba(0, 255, 0, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: ${accentColor}; font-size: 14px; font-weight: bold;">2</div>
        <span style="color: #A1A1AA; font-size: 14px;">Zweiter Schritt mit mehr Text</span>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 28px; height: 28px; background: rgba(0, 255, 0, 0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: ${accentColor}; font-size: 14px; font-weight: bold;">3</div>
        <span style="color: #A1A1AA; font-size: 14px;">Dritter und letzter Schritt</span>
      </div>
    </div>

    <!-- ========== AVATAR / USER CARD ========== -->
    <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #27272A;">
      👤 Benutzer-Karte
    </p>

    <div style="${cardStyles} margin-bottom: 32px;">
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="width: 56px; height: 56px; background: rgba(0, 255, 0, 0.1); border: 2px solid rgba(0, 255, 0, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">M</span>
        </div>
        <div>
          <p style="color: #FFFFFF; font-size: 18px; font-weight: bold; margin: 0;">Max Mustermann</p>
          <p style="color: #71717A; font-size: 13px; margin: 4px 0 0 0;">max@example.com</p>
        </div>
      </div>
    </div>

    <!-- ========== INFO BOXES ========== -->
    <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #27272A;">
      💡 Info-Boxen
    </p>

    <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 12px;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 18px;">ℹ️</span>
        <p style="color: #60A5FA; font-size: 13px; margin: 0;">
          <strong>Info:</strong> Dies ist eine blaue Info-Box für neutrale Hinweise.
        </p>
      </div>
    </div>

    <div style="background: rgba(0, 255, 0, 0.05); border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 12px;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 18px;">💰</span>
        <p style="color: ${accentColor}; font-size: 13px; margin: 0;">
          <strong>Tipp:</strong> Grüne Box für positive Hinweise wie Erstattungen.
        </p>
      </div>
    </div>

    <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 32px;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 18px;">⏰</span>
        <p style="color: #FCD34D; font-size: 13px; margin: 0;">
          <strong>Frist:</strong> Gelbe Box für zeitkritische Hinweise.
        </p>
      </div>
    </div>

    <!-- ========== BUTTONS ========== -->
    <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #27272A;">
      🔘 Buttons
    </p>

    <div style="text-align: center; margin-bottom: 32px;">
      <a href="#" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold; margin-bottom: 12px; box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);">
        Primärer Button →
      </a>
      <br><br>
      <a href="#" style="display: inline-block; background: #3B82F6; color: #FFFFFF; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: bold; margin-bottom: 12px;">
        Sekundärer Button →
      </a>
      <br><br>
      <a href="#" style="display: inline-block; background: #27272A; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">
        Tertiärer Button
      </a>
    </div>

    <!-- ========== TYPOGRAPHY ========== -->
    <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #27272A;">
      ✏️ Typografie
    </p>

    <div style="margin-bottom: 32px;">
      <h1 style="color: #FFFFFF; font-size: 28px; font-weight: bold; margin: 0 0 8px 0;">Überschrift H1</h1>
      <h2 style="color: #FFFFFF; font-size: 22px; font-weight: bold; margin: 0 0 8px 0;">Überschrift H2</h2>
      <h3 style="color: #FFFFFF; font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">Überschrift H3</h3>
      <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 8px 0;">Fließtext in Weiß</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 8px 0;">Sekundärtext in Grau</p>
      <p style="color: #71717A; font-size: 12px; margin: 0 0 8px 0;">Kleintext / Labels</p>
      <p style="color: ${accentColor}; font-size: 14px; font-weight: bold; margin: 0;">Akzent-Text in Grün</p>
    </div>

    <!-- ========== COLOR PALETTE ========== -->
    <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #27272A;">
      🎨 Farbpalette
    </p>

    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 32px;">
      <div style="text-align: center;">
        <div style="width: 50px; height: 50px; background: ${accentColor}; border-radius: 8px; margin-bottom: 4px;"></div>
        <p style="color: #71717A; font-size: 10px; margin: 0;">Primary</p>
      </div>
      <div style="text-align: center;">
        <div style="width: 50px; height: 50px; background: #3B82F6; border-radius: 8px; margin-bottom: 4px;"></div>
        <p style="color: #71717A; font-size: 10px; margin: 0;">Blue</p>
      </div>
      <div style="text-align: center;">
        <div style="width: 50px; height: 50px; background: #A855F7; border-radius: 8px; margin-bottom: 4px;"></div>
        <p style="color: #71717A; font-size: 10px; margin: 0;">Purple</p>
      </div>
      <div style="text-align: center;">
        <div style="width: 50px; height: 50px; background: #F59E0B; border-radius: 8px; margin-bottom: 4px;"></div>
        <p style="color: #71717A; font-size: 10px; margin: 0;">Warning</p>
      </div>
      <div style="text-align: center;">
        <div style="width: 50px; height: 50px; background: #EF4444; border-radius: 8px; margin-bottom: 4px;"></div>
        <p style="color: #71717A; font-size: 10px; margin: 0;">Error</p>
      </div>
    </div>

    <!-- ========== SIGNATURE ========== -->
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br>
      <strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>

    ${getFooter()}
  </div>
</body>
</html>
  `,
});

// =============================================================================
// NEUE TEMPLATES: Passwort, E-Mail-Verifizierung, Einladung, etc.
// =============================================================================

/**
 * 🔴 KRITISCH: Passwort zurücksetzen
 */
export interface PasswordResetData {
  firstName: string;
  resetLink: string;
  expiresIn: string;
}

export const passwordReset = (data: PasswordResetData): { subject: string; html: string } => ({
  subject: `🔐 Passwort zurücksetzen`,
  html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(59, 130, 246, 0.1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 32px;">🔐</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Passwort zurücksetzen</h1>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.firstName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den Button unten, um ein neues Passwort zu erstellen.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.resetLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold; box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);">
        Neues Passwort erstellen →
      </a>
    </div>
    <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0;">
      <p style="color: #FCD34D; font-size: 13px; margin: 0;">
        ⏰ Dieser Link ist <strong>${data.expiresIn}</strong> gültig
      </p>
    </div>
    <div style="${cardStyles}">
      <p style="color: #71717A; font-size: 12px; margin: 0;">
        Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren. Dein Passwort bleibt unverändert.
      </p>
    </div>
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
  `,
});

/**
 * 🔴 KRITISCH: E-Mail-Adresse bestätigen
 */
export interface EmailVerificationData {
  firstName: string;
  verificationLink: string;
}

export const emailVerification = (data: EmailVerificationData): { subject: string; html: string } => ({
  subject: `✉️ Bestätige deine E-Mail-Adresse`,
  html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(0, 255, 0, 0.1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 32px;">✉️</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">E-Mail bestätigen</h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">Nur noch ein Schritt!</p>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.firstName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      vielen Dank für deine Registrierung! Bitte bestätige deine E-Mail-Adresse, um deinen Account zu aktivieren.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.verificationLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold; box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);">
        E-Mail bestätigen →
      </a>
    </div>
    <div style="${cardStyles}">
      <p style="color: #71717A; font-size: 12px; margin: 0;">
        Falls du dich nicht bei Greenlight Fitness registriert hast, kannst du diese E-Mail ignorieren.
      </p>
    </div>
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
  `,
});

/**
 * 🟡 WICHTIG: Einladung (Coach/Admin lädt Athleten ein)
 */
export interface InvitationData {
  inviterName: string;
  inviterRole: string;
  recipientEmail: string;
  personalMessage?: string;
  invitationLink: string;
  expiresAt: string;
}

export const invitation = (data: InvitationData): { subject: string; html: string } => ({
  subject: `🎯 ${data.inviterName} lädt dich zu Greenlight Fitness ein!`,
  html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, rgba(0, 255, 0, 0.2), rgba(0, 255, 0, 0.05)); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 40px;">🎯</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Du bist eingeladen!</h1>
    </div>
    <div style="${cardStyles} border-color: ${accentColor};">
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
        <div style="width: 48px; height: 48px; background: rgba(0, 255, 0, 0.1); border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <span style="color: ${accentColor}; font-size: 20px; font-weight: bold;">${data.inviterName.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <p style="color: #FFFFFF; font-size: 16px; font-weight: bold; margin: 0;">${data.inviterName}</p>
          <p style="color: #71717A; font-size: 13px; margin: 4px 0 0 0;">${data.inviterRole}</p>
        </div>
      </div>
      ${data.personalMessage ? `
      <div style="background: #27272A; border-radius: 12px; padding: 16px; margin-top: 16px;">
        <p style="color: #71717A; font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 0 0 8px 0;">Persönliche Nachricht</p>
        <p style="color: #A1A1AA; font-size: 14px; margin: 0; font-style: italic;">"${data.personalMessage}"</p>
      </div>
      ` : ''}
    </div>
    <p style="color: #A1A1AA; font-size: 14px; margin: 24px 0;">
      <strong style="color: #FFFFFF;">${data.inviterName}</strong> möchte, dass du Teil von Greenlight Fitness wirst. 
      Starte jetzt mit deinem personalisierten Trainingserlebnis!
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.invitationLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold; box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);">
        Einladung annehmen →
      </a>
    </div>
    <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 16px; text-align: center;">
      <p style="color: #FCD34D; font-size: 13px; margin: 0;">
        ⏰ Diese Einladung ist gültig bis <strong>${data.expiresAt}</strong>
      </p>
    </div>
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
  `,
});

/**
 * 🟡 WICHTIG: Trainingsplan zugewiesen
 */
export interface PlanAssignedData {
  athleteName: string;
  coachName: string;
  planName: string;
  startDate: string;
  weeksCount: number;
  dashboardLink: string;
}

export const planAssigned = (data: PlanAssignedData): { subject: string; html: string } => ({
  subject: `📋 Neuer Trainingsplan: ${data.planName}`,
  html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(0, 255, 0, 0.1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 32px;">📋</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Neuer Trainingsplan!</h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">Dein Coach hat dir einen Plan zugewiesen</p>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.athleteName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      <strong style="color: #FFFFFF;">${data.coachName}</strong> hat dir einen neuen Trainingsplan zugewiesen. Zeit, durchzustarten!
    </p>
    <div style="${cardStyles} border-color: ${accentColor};">
      <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">DEIN NEUER PLAN</p>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Planname</span>
          <span style="color: #FFFFFF; font-size: 13px; font-weight: bold;">${data.planName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Coach</span>
          <span style="color: #FFFFFF; font-size: 13px;">${data.coachName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Start</span>
          <span style="color: ${accentColor}; font-size: 13px; font-weight: bold;">${data.startDate}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Dauer</span>
          <span style="color: #FFFFFF; font-size: 13px;">${data.weeksCount} Wochen</span>
        </div>
      </div>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.dashboardLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
        Plan ansehen →
      </a>
    </div>
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
  `,
});

/**
 * 🟡 WICHTIG: Kauf bestätigt
 */
export interface PurchaseConfirmedData {
  firstName: string;
  productName: string;
  price: string;
  isSubscription: boolean;
  interval?: string;
  receiptLink: string;
  dashboardLink: string;
}

export const purchaseConfirmed = (data: PurchaseConfirmedData): { subject: string; html: string } => ({
  subject: `🎉 Kauf bestätigt: ${data.productName}`,
  html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(0, 255, 0, 0.1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 32px;">🎉</span>
      </div>
      <h1 style="color: ${accentColor}; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Kauf erfolgreich!</h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">Vielen Dank für deinen Einkauf</p>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.firstName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      dein Kauf wurde erfolgreich abgeschlossen. Hier sind die Details:
    </p>
    <div style="${cardStyles} border-color: ${accentColor};">
      <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">KAUFBESTÄTIGUNG</p>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Produkt</span>
          <span style="color: #FFFFFF; font-size: 13px; font-weight: bold;">${data.productName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Preis</span>
          <span style="color: ${accentColor}; font-size: 13px; font-weight: bold;">${data.price}${data.isSubscription ? ` / ${data.interval}` : ''}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Typ</span>
          <span style="color: #FFFFFF; font-size: 13px;">${data.isSubscription ? 'Abonnement' : 'Einmalkauf'}</span>
        </div>
      </div>
    </div>
    <div style="display: flex; gap: 12px; justify-content: center; margin: 32px 0;">
      <a href="${data.dashboardLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
        Zum Dashboard →
      </a>
      <a href="${data.receiptLink}" style="display: inline-block; background: #27272A; color: #FFFFFF; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
        Rechnung →
      </a>
    </div>
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
  `,
});

/**
 * 🟢 NICE-TO-HAVE: Abo verlängert
 */
export interface SubscriptionRenewedData {
  firstName: string;
  productName: string;
  price: string;
  nextBillingDate: string;
  portalLink: string;
}

export const subscriptionRenewed = (data: SubscriptionRenewedData): { subject: string; html: string } => ({
  subject: `✅ Abo verlängert: ${data.productName}`,
  html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(0, 255, 0, 0.1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 32px;">✅</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Abo verlängert</h1>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.firstName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      dein Abonnement wurde erfolgreich verlängert. Vielen Dank für deine Treue!
    </p>
    <div style="${cardStyles}">
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Produkt</span>
          <span style="color: #FFFFFF; font-size: 13px; font-weight: bold;">${data.productName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Betrag</span>
          <span style="color: ${accentColor}; font-size: 13px; font-weight: bold;">${data.price}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Nächste Abbuchung</span>
          <span style="color: #FFFFFF; font-size: 13px;">${data.nextBillingDate}</span>
        </div>
      </div>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.portalLink}" style="display: inline-block; background: #27272A; color: #FFFFFF; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: bold;">
        Abo verwalten →
      </a>
    </div>
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
  `,
});

// =============================================================================
// Admin: New Purchase Notification
// =============================================================================

export interface AdminNewPurchaseData {
  adminName: string;
  customerEmail: string;
  customerName: string;
  productName: string;
  amount: string;
  purchaseDate: string;
  dashboardLink: string;
}

export const adminNewPurchase = (data: AdminNewPurchaseData): { subject: string; html: string } => ({
  subject: `💰 Neuer Kauf: ${data.productName} von ${data.customerName || data.customerEmail}`,
  html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>
    <div style="text-align: center; margin-bottom: 32px;">
      ${iconBox('💰', 'rgba(0, 255, 0, 0.1)')}
      <h1 style="color: ${accentColor}; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Neuer Kauf!</h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">Ein Kunde hat soeben eingekauft</p>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.adminName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      es gibt eine neue Bestellung in deinem Shop!
    </p>
    <div style="${cardStyles} border-color: ${accentColor};">
      <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">KAUFDETAILS</p>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        ${dataRow('Kunde', data.customerName || data.customerEmail, '#FFFFFF')}
        ${dataRow('E-Mail', data.customerEmail, '#71717A')}
        ${dataRow('Produkt', data.productName, '#FFFFFF')}
        ${dataRow('Betrag', data.amount, accentColor)}
        ${dataRow('Datum', data.purchaseDate, '#71717A', true)}
      </div>
    </div>
    ${primaryButton('Zum Dashboard →', data.dashboardLink)}
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness System</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
  `,
});

// =============================================================================
// Coach: New Athlete Assigned Notification
// =============================================================================

export interface CoachNewAthleteData {
  coachName: string;
  athleteName: string;
  athleteEmail: string;
  assignDate: string;
  reason: string;
  dashboardLink: string;
}

export const coachNewAthlete = (data: CoachNewAthleteData): { subject: string; html: string } => ({
  subject: `🆕 Neuer Athlet zugewiesen: ${data.athleteName}`,
  html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>
    <div style="text-align: center; margin-bottom: 32px;">
      ${iconBox('🆕', 'rgba(59, 130, 246, 0.1)')}
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Neuer Athlet!</h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">Dir wurde ein neuer Athlet zugewiesen</p>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.coachName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      dir wurde ein neuer Athlet zugewiesen. Mach dich mit dem Profil vertraut und lege los!
    </p>
    <div style="${cardStyles} border-color: #3B82F6;">
      <p style="color: #3B82F6; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">NEUER ATHLET</p>
      <div style="margin-bottom: 16px; text-align: center;">
        ${avatarCircle(data.athleteName.charAt(0).toUpperCase(), 56)}
      </div>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        ${dataRow('Name', data.athleteName, '#FFFFFF')}
        ${dataRow('E-Mail', data.athleteEmail, '#71717A')}
        ${dataRow('Zugewiesen am', data.assignDate, '#71717A')}
        ${dataRow('Grund', data.reason, '#71717A', true)}
      </div>
    </div>
    ${primaryButton('Athlet ansehen →', data.dashboardLink)}
    ${infoBox('💡', 'Tipp: Sende deinem neuen Athleten eine Willkommensnachricht über den Chat!', 'rgba(0, 255, 0, 0.05)', accentColor)}
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness System</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
  `,
});

// =============================================================================
// BOOKING EMAILS
// =============================================================================

export interface BookingConfirmationData {
  bookerName: string;
  coachName: string;
  calendarName: string;
  date: string;       // "2026-02-20"
  time: string;       // "10:00"
  durationMinutes: number;
  notes?: string;
  // Pre-built by caller:
  googleCalendarUrl: string;
  outlookCalendarUrl: string;
  icsDownloadUrl: string;
}

export interface BookingReminderData {
  bookerName: string;
  coachName: string;
  calendarName: string;
  date: string;
  time: string;
  durationMinutes: number;
}

const formatBookingDate = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  return `${days[d.getDay()]}, ${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const bookingConfirmation = (data: BookingConfirmationData) => ({
  subject: `Termin bestätigt: ${data.calendarName} am ${formatBookingDate(data.date)}`,
  html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: ${baseStyles.backgroundColor}; font-family: ${baseStyles.fontFamily};">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 24px;">
    <div style="text-align: center; margin-bottom: 32px;">
      ${iconBox('✅', 'rgba(0, 255, 0, 0.1)')}
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Termin bestätigt!</h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">Dein Termin wurde erfolgreich gebucht</p>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.bookerName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      dein Termin bei <strong style="color: #FFFFFF;">${data.coachName}</strong> ist bestätigt. Hier sind die Details:
    </p>
    <div style="${cardStyles} border-color: ${accentColor};">
      <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">TERMINDETAILS</p>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${dataRow('Terminart', data.calendarName, '#FFFFFF')}
          ${dataRow('Datum', formatBookingDate(data.date), '#FFFFFF')}
          ${dataRow('Uhrzeit', data.time + ' Uhr', '#FFFFFF')}
          ${dataRow('Dauer', data.durationMinutes + ' Minuten', '#71717A')}
          ${dataRow('Coach', data.coachName, '#71717A', !data.notes)}
          ${data.notes ? dataRow('Nachricht', data.notes, '#71717A', true) : ''}
        </table>
      </div>
    </div>

    <!-- Calendar Integration -->
    <div style="${cardStyles}">
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 16px 0;">📅 Zum Kalender hinzufügen</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="padding: 6px 0;">
            <a href="${data.googleCalendarUrl}" target="_blank" style="display: inline-block; padding: 12px 20px; background: #27272A; border: 1px solid #3F3F46; border-radius: 10px; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; width: 100%; box-sizing: border-box; text-align: center;">
              📎 Google Kalender
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0;">
            <a href="${data.outlookCalendarUrl}" target="_blank" style="display: inline-block; padding: 12px 20px; background: #27272A; border: 1px solid #3F3F46; border-radius: 10px; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; width: 100%; box-sizing: border-box; text-align: center;">
              📎 Outlook / Office 365
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0;">
            <a href="${data.icsDownloadUrl}" target="_blank" style="display: inline-block; padding: 12px 20px; background: #27272A; border: 1px solid #3F3F46; border-radius: 10px; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; width: 100%; box-sizing: border-box; text-align: center;">
              📎 Apple Kalender / ICS-Datei
            </a>
          </td>
        </tr>
      </table>
    </div>

    ${infoBox('⏰', 'Du erhältst 15 Minuten vor dem Termin eine Erinnerung per E-Mail.', 'rgba(59, 130, 246, 0.05)', '#3B82F6')}
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
  `,
});

const bookingReminder = (data: BookingReminderData) => ({
  subject: `⏰ In 15 Min: ${data.calendarName} mit ${data.coachName}`,
  html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: ${baseStyles.backgroundColor}; font-family: ${baseStyles.fontFamily};">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 24px;">
    <div style="text-align: center; margin-bottom: 32px;">
      ${iconBox('⏰', 'rgba(234, 179, 8, 0.1)')}
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Termin in 15 Minuten!</h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">Dein Termin beginnt gleich</p>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.bookerName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      dein Termin bei <strong style="color: #FFFFFF;">${data.coachName}</strong> beginnt in <strong style="color: #EAB308;">15 Minuten</strong>.
    </p>
    <div style="${cardStyles} border-color: #EAB308;">
      <p style="color: #EAB308; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">DEIN TERMIN</p>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${dataRow('Terminart', data.calendarName, '#FFFFFF')}
          ${dataRow('Uhrzeit', data.time + ' Uhr', '#FFFFFF')}
          ${dataRow('Dauer', data.durationMinutes + ' Minuten', '#71717A')}
          ${dataRow('Coach', data.coachName, '#71717A', true)}
        </table>
      </div>
    </div>
    ${infoBox('💡', 'Stelle sicher, dass du pünktlich bereit bist. Bei Fragen melde dich direkt bei deinem Coach.', 'rgba(0, 255, 0, 0.05)', accentColor)}
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Viel Erfolg!<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
  `,
});

export const emailTemplates = {
  price_change_notice: priceChangeNotice,
  cancellation_confirmed: cancellationConfirmed,
  coaching_request_coach: coachingRequestCoach,
  coaching_approved: coachingApproved,
  coaching_rejected: coachingRejected,
  payment_failed: paymentFailed,
  data_deletion_confirm: dataDeletionConfirm,
  welcome: welcome,
  design_showcase: designShowcase,
  password_reset: passwordReset,
  email_verification: emailVerification,
  invitation: invitation,
  plan_assigned: planAssigned,
  purchase_confirmed: purchaseConfirmed,
  subscription_renewed: subscriptionRenewed,
  // Reattention Templates
  athlete_training_reminder: athleteTrainingReminder,
  athlete_checkin_reminder: athleteCheckInReminder,
  athlete_inactivity_alert: athleteInactivityAlert,
  athlete_weekly_progress: athleteWeeklyProgress,
  coach_weekly_summary: coachWeeklySummary,
  coach_churn_risk_alert: coachChurnRiskAlert,
  admin_weekly_report: adminWeeklyReport,
  admin_churn_alert: adminChurnAlert,
  // Admin & Coach Notifications
  admin_new_purchase: adminNewPurchase,
  coach_new_athlete: coachNewAthlete,
  // Booking Emails
  booking_confirmation: bookingConfirmation,
  booking_reminder: bookingReminder,
};

export type EmailType = keyof typeof emailTemplates;
