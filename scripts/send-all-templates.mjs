/**
 * Sendet alle E-Mail Templates einzeln
 * OPTIMIERT für maximale E-Mail-Client Kompatibilität (Table-basiert)
 * 
 * Verwendung: node scripts/send-all-templates.mjs
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_EgDdSN3B_6FByK2mukgRGTmCczBKbd8ot';
const resend = new Resend(RESEND_API_KEY);

const FROM_EMAIL = 'Greenlight Fitness <noreply@mail.greenlight-fitness.de>';
const TO_EMAIL = 'info@greenlight-fitness.de';

const accentColor = '#00FF00';

// =============================================================================
// KOMPATIBLE HELPER-KOMPONENTEN (Table-basiert, kein Flexbox)
// =============================================================================

const cardStyles = `
  background: linear-gradient(180deg, #1C1C1E 0%, #0A0A0A 100%);
  border: 1px solid #27272A;
  border-radius: 16px;
  padding: 24px;
  margin: 16px 0;
`;

// Icon-Container (Table-basiert)
const iconBox = (emoji, bgColor, size = 64) => `
  <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto 16px auto;">
    <tr>
      <td align="center" valign="middle" style="width: ${size}px; height: ${size}px; background: ${bgColor}; border-radius: 16px;">
        <span style="font-size: ${Math.round(size / 2)}px; line-height: 1;">${emoji}</span>
      </td>
    </tr>
  </table>
`;

// Feature-Tile (Icon + Text nebeneinander)
const featureTile = (emoji, bgColor, title, subtitle) => `
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

// Data-Row (Label + Wert)
const dataRow = (label, value, valueColor = '#FFFFFF', isLast = false) => `
  <tr>
    <td style="padding: 12px 0; ${!isLast ? 'border-bottom: 1px solid #3F3F46;' : ''}">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="color: #71717A; font-size: 13px;">${label}</td>
          <td align="right" style="color: ${valueColor}; font-size: 13px; font-weight: bold;">${value}</td>
        </tr>
      </table>
    </td>
  </tr>
`;

// Step-Item (Nummerierter Schritt)
const stepItem = (num, text, color = accentColor) => `
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

// Info-Box
const infoBox = (emoji, text, bgColor, textColor) => `
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

// Primary Button
const primaryButton = (text, href) => `
  <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 32px auto;">
    <tr>
      <td align="center" style="background: ${accentColor}; border-radius: 12px;">
        <a href="${href}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none;">${text}</a>
      </td>
    </tr>
  </table>
`;

// Secondary Button
const secondaryButton = (text, href, color = '#3B82F6') => `
  <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 16px auto;">
    <tr>
      <td align="center" style="background: ${color}; border-radius: 10px;">
        <a href="${href}" target="_blank" style="display: inline-block; padding: 12px 24px; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none;">${text}</a>
      </td>
    </tr>
  </table>
`;

// Avatar Circle
const avatarCircle = (initial, size = 48) => `
  <table cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" valign="middle" style="width: ${size}px; height: ${size}px; background: rgba(0, 255, 0, 0.1); border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 50%;">
        <span style="color: ${accentColor}; font-size: ${Math.round(size / 2.4)}px; font-weight: bold; line-height: 1;">${initial}</span>
      </td>
    </tr>
  </table>
`;

// Footer (Table-basiert)
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
  </table>
`;

// ============================================================================
// ALLE E-MAIL TEMPLATES MIT BEISPIELDATEN
// ============================================================================

const templates = [
  {
    name: '1. Willkommen',
    subject: '🎉 Willkommen bei Greenlight Fitness!',
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
        <span style="font-size: 40px;">🎉</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 28px; font-weight: bold; margin: 0 0 8px 0;">Willkommen, Max!</h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">Dein Fitness-Journey beginnt jetzt</p>
    </div>
    <div style="${cardStyles} border-color: ${accentColor};">
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 20px 0;">
        Schön, dass du dabei bist! Mit Greenlight Fitness hast du alles, was du für dein Training brauchst.
      </p>
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
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://dev.greenlight-fitness.de" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold; box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);">
        Jetzt starten →
      </a>
    </div>
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
    `
  },
  {
    name: '2. Preisänderung',
    subject: '⚠️ Wichtig: Änderung deines Pro-Coaching-Abonnements',
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
      <div style="width: 64px; height: 64px; background: rgba(251, 191, 36, 0.1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 32px;">⚠️</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Wichtige Änderung</h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">Dein Abonnement wird angepasst</p>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo Max,</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">wir möchten dich über eine bevorstehende Änderung deines Abonnements informieren.</p>
    <div style="${cardStyles}">
      <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">PREISÄNDERUNG</p>
      <div style="margin-bottom: 12px;">
        <p style="color: #71717A; font-size: 12px; margin: 0 0 4px 0;">Produkt</p>
        <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0;">Pro Coaching Paket</p>
      </div>
      <div style="background: #27272A; border-radius: 12px; padding: 16px; margin-top: 16px;">
        <div style="display: flex; align-items: center; justify-content: space-between; text-align: center;">
          <div>
            <p style="color: #71717A; font-size: 10px; margin: 0 0 4px 0;">ALTER PREIS</p>
            <p style="color: #EF4444; font-size: 18px; font-weight: bold; margin: 0; text-decoration: line-through;">79,99 €</p>
            <p style="color: #71717A; font-size: 10px; margin: 4px 0 0 0;">/ Monat</p>
          </div>
          <div style="color: #71717A; font-size: 20px;">→</div>
          <div>
            <p style="color: #71717A; font-size: 10px; margin: 0 0 4px 0;">NEUER PREIS</p>
            <p style="color: ${accentColor}; font-size: 18px; font-weight: bold; margin: 0;">89,99 €</p>
            <p style="color: #71717A; font-size: 10px; margin: 4px 0 0 0;">/ Monat</p>
          </div>
        </div>
      </div>
      <p style="color: #71717A; font-size: 12px; margin: 16px 0 0 0; text-align: center;">
        Gültig ab: <strong style="color: #FFFFFF;">01.04.2026</strong>
      </p>
    </div>
    <div style="${cardStyles} border-color: #3B82F6;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 20px;">📋</span>
        <div>
          <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">Dein Sonderkündigungsrecht</p>
          <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 12px 0;">
            Aufgrund dieser Preisänderung hast du das Recht, dein Abonnement <strong style="color: #FFFFFF;">bis zum 25.03.2026</strong> zu kündigen.
          </p>
          <a href="https://billing.stripe.com/portal" style="display: inline-block; background: #3B82F6; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold;">
            Zur Kündigung →
          </a>
        </div>
      </div>
    </div>
    <p style="color: #71717A; font-size: 13px; margin: 24px 0;">
      Wenn du nichts unternimmst, wird dein Abonnement ab dem 01.04.2026 zum neuen Preis fortgeführt.
    </p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
    `
  },
  {
    name: '3. Kündigung bestätigt',
    subject: '✓ Bestätigung deiner Kündigung',
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
      <div style="width: 64px; height: 64px; background: rgba(239, 68, 68, 0.1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 32px;">✓</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Kündigung bestätigt</h1>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo Max,</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">wir bestätigen hiermit die Kündigung deines Abonnements.</p>
    <div style="${cardStyles}">
      <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">KÜNDIGUNGSBESTÄTIGUNG</p>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Produkt</span>
          <span style="color: #FFFFFF; font-size: 13px; font-weight: bold;">Pro Coaching Paket</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Gekündigt am</span>
          <span style="color: #FFFFFF; font-size: 13px;">03.02.2026</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Zugang bis</span>
          <span style="color: ${accentColor}; font-size: 13px; font-weight: bold;">03.03.2026</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Referenz-Nr.</span>
          <span style="color: #71717A; font-size: 13px; font-family: monospace;">CANC-2026-ABC123</span>
        </div>
      </div>
    </div>
    <p style="color: #A1A1AA; font-size: 13px; margin: 24px 0;">
      Du hast noch bis zum <strong style="color: #FFFFFF;">03.03.2026</strong> vollen Zugriff auf alle Funktionen deines Pakets.
    </p>
    <p style="color: #71717A; font-size: 13px; margin: 24px 0;">Wir würden uns freuen, dich in Zukunft wieder begrüßen zu dürfen!</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
    `
  },
  {
    name: '4. Coaching-Anfrage (an Coach)',
    subject: '🏋️ Neue Coaching-Anfrage von Lisa Schmidt',
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
        <span style="font-size: 32px;">🏋️</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Neue Coaching-Anfrage</h1>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo Coach Thomas,</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">du hast eine neue Coaching-Anfrage erhalten!</p>
    <div style="${cardStyles} border-color: ${accentColor};">
      <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">NEUE ANFRAGE</p>
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
        <div style="width: 48px; height: 48px; background: rgba(0, 255, 0, 0.1); border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
          <span style="color: ${accentColor}; font-size: 20px; font-weight: bold;">L</span>
        </div>
        <div>
          <p style="color: #FFFFFF; font-size: 16px; font-weight: bold; margin: 0;">Lisa Schmidt</p>
          <p style="color: #71717A; font-size: 13px; margin: 4px 0 0 0;">lisa.schmidt@example.com</p>
        </div>
      </div>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #71717A; font-size: 13px;">Paket</span>
          <span style="color: #FFFFFF; font-size: 13px; font-weight: bold;">1:1 Premium Coaching</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Angefragt am</span>
          <span style="color: #71717A; font-size: 13px;">03.02.2026</span>
        </div>
      </div>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://dev.greenlight-fitness.de/coach/dashboard" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
        Zum Dashboard →
      </a>
    </div>
    <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 16px; text-align: center;">
      <p style="color: #FCD34D; font-size: 13px; margin: 0;">⏰ Bitte antworte innerhalb von <strong>48 Stunden</strong></p>
    </div>
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
    `
  },
  {
    name: '5. Coaching genehmigt (an Athlet)',
    subject: '✅ Dein Coaching wurde genehmigt!',
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
      <h1 style="color: ${accentColor}; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Coaching genehmigt!</h1>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo Lisa,</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">großartige Neuigkeiten! <strong style="color: #FFFFFF;">Coach Thomas</strong> hat deine Coaching-Anfrage angenommen.</p>
    <div style="${cardStyles} border-color: ${accentColor};">
      <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">COACHING GESTARTET</p>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Coach</span>
          <span style="color: #FFFFFF; font-size: 13px; font-weight: bold;">Thomas Müller</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Paket</span>
          <span style="color: #FFFFFF; font-size: 13px;">1:1 Premium Coaching</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Start</span>
          <span style="color: ${accentColor}; font-size: 13px; font-weight: bold;">05.02.2026</span>
        </div>
      </div>
    </div>
    <div style="margin: 24px 0;">
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">🚀 Nächste Schritte</p>
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
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://dev.greenlight-fitness.de/dashboard" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
        Zum Dashboard →
      </a>
    </div>
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
    `
  },
  {
    name: '6. Coaching abgelehnt (an Athlet)',
    subject: 'Information zu deiner Coaching-Anfrage',
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
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Coaching-Anfrage</h1>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo Lisa,</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">leider konnte <strong style="color: #FFFFFF;">Coach Thomas</strong> deine Coaching-Anfrage nicht annehmen.</p>
    <div style="${cardStyles} border-color: #EF4444;">
      <p style="color: #EF4444; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">ANFRAGE NICHT ANGENOMMEN</p>
      <p style="color: #A1A1AA; font-size: 13px; margin: 0;">
        <strong style="color: #FFFFFF;">Grund:</strong> Kapazitäten aktuell erschöpft. Bitte versuche es in 2-3 Wochen erneut.
      </p>
    </div>
    <div style="background: rgba(0, 255, 0, 0.05); border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 12px; padding: 16px; margin: 24px 0;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <span style="font-size: 20px;">💰</span>
        <div>
          <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 4px 0;">Erstattung</p>
          <p style="color: #A1A1AA; font-size: 13px; margin: 0;">Deine Zahlung wird innerhalb von 5-10 Werktagen erstattet.</p>
        </div>
      </div>
    </div>
    <div style="margin: 24px 0;">
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">🔄 Alternativen</p>
      <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 16px 0;">Du kannst gerne ein anderes Coaching-Paket buchen oder dich an unseren Support wenden.</p>
      <a href="https://greenlight-fitness.de/shop" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: bold;">
        Zum Shop →
      </a>
    </div>
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
    `
  },
  {
    name: '7. Zahlung fehlgeschlagen',
    subject: '⚠️ Zahlung fehlgeschlagen - Aktion erforderlich',
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
      <div style="width: 64px; height: 64px; background: rgba(239, 68, 68, 0.1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
        <span style="font-size: 32px;">⚠️</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Zahlung fehlgeschlagen</h1>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo Max,</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">wir konnten deine letzte Zahlung leider nicht einziehen.</p>
    <div style="${cardStyles} border-color: #EF4444;">
      <p style="color: #EF4444; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">ZAHLUNGSPROBLEM</p>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Produkt</span>
          <span style="color: #FFFFFF; font-size: 13px; font-weight: bold;">Pro Coaching Paket</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Betrag</span>
          <span style="color: #EF4444; font-size: 13px; font-weight: bold;">89,99 €</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Fällig seit</span>
          <span style="color: #71717A; font-size: 13px;">01.02.2026</span>
        </div>
      </div>
    </div>
    <div style="margin: 24px 0;">
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">🔧 So behebst du das Problem</p>
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
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://billing.stripe.com/portal" style="display: inline-block; background: #3B82F6; color: #FFFFFF; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
        Zahlungsmethode aktualisieren →
      </a>
    </div>
    <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 16px; text-align: center;">
      <p style="color: #FCD34D; font-size: 13px; margin: 0;">⏰ Bitte aktualisiere deine Daten innerhalb von <strong>7 Tagen</strong>, um eine Unterbrechung zu vermeiden.</p>
    </div>
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
    `
  },
  {
    name: '8. Account gelöscht (DSGVO)',
    subject: '✓ Bestätigung: Dein Account wurde gelöscht',
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
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Account gelöscht</h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">Gemäß DSGVO Art. 17</p>
    </div>
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo Max,</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">hiermit bestätigen wir die Löschung deines Accounts gemäß deiner Anfrage.</p>
    <div style="${cardStyles}">
      <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">LÖSCHBESTÄTIGUNG</p>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Gelöscht am</span>
          <span style="color: #FFFFFF; font-size: 13px;">03.02.2026</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Referenz-Nr.</span>
          <span style="color: #71717A; font-size: 13px; font-family: monospace;">DEL-2026-XYZ789</span>
        </div>
      </div>
    </div>
    <div style="margin: 24px 0;">
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">📋 Gelöschte Daten</p>
      <div style="background: #18181B; border-radius: 12px; padding: 16px;">
        <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 8px 0;">• Profildaten und Einstellungen</p>
        <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 8px 0;">• Trainingspläne und Logs</p>
        <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 8px 0;">• Wellness-Daten</p>
        <p style="color: #A1A1AA; font-size: 13px; margin: 0;">• Coaching-Beziehungen</p>
      </div>
    </div>
    <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 16px; margin: 24px 0;">
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">📋 Aufbewahrte Daten (Gesetzliche Pflicht)</p>
      <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 4px 0;">• Rechnungen (10 Jahre - Steuerrecht)</p>
      <p style="color: #A1A1AA; font-size: 13px; margin: 0;">• Zahlungshistorie (6 Jahre - HGB)</p>
    </div>
    <p style="color: #71717A; font-size: 13px; margin: 24px 0;">
      Bei Fragen wende dich an: <a href="mailto:datenschutz@greenlight-fitness.de" style="color: #3B82F6;">datenschutz@greenlight-fitness.de</a>
    </p>
    ${getFooter()}
  </div>
</body>
</html>
    `
  }
];

// ============================================================================
// SENDEN
// ============================================================================

async function sendAllTemplates() {
  console.log('📧 Sende alle E-Mail Templates an:', TO_EMAIL);
  console.log('━'.repeat(50));

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    console.log(`\n[${i + 1}/${templates.length}] Sende: ${template.name}...`);

    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject: `[TEST ${i + 1}/8] ${template.subject}`,
        html: template.html,
      });

      if (result.data?.id) {
        console.log(`   ✅ Erfolgreich! ID: ${result.data.id}`);
      } else if (result.error) {
        console.log(`   ❌ Fehler: ${result.error.message}`);
      }

      // 1 Sekunde warten (Rate Limit)
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`   ❌ Fehler:`, error.message);
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log('✅ Alle E-Mails versendet!');
  console.log('📬 Prüfe deinen Posteingang bei info@p-a.llc');
}

sendAllTemplates();
