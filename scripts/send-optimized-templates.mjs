/**
 * OPTIMIERTE E-Mail Templates - Maximale Kompatibilität
 * 
 * ✅ Table-basierte Layouts (kein Flexbox)
 * ✅ Inline Styles
 * ✅ Kompatibel mit: Outlook, Gmail, Apple Mail, Yahoo, etc.
 * 
 * Verwendung: node scripts/send-optimized-templates.mjs
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_EgDdSN3B_6FByK2mukgRGTmCczBKbd8ot';
const resend = new Resend(RESEND_API_KEY);

const FROM_EMAIL = 'Greenlight Fitness <noreply@mail.greenlight-fitness.de>';
const TO_EMAIL = 'info@greenlight-fitness.de';

const accentColor = '#00FF00';

// =============================================================================
// BASE TEMPLATE WRAPPER
// =============================================================================

const emailWrapper = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0A0A0A;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px;">
          <tr>
            <td>
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// =============================================================================
// KOMPATIBLE KOMPONENTEN
// =============================================================================

// Logo Header
const logoHeader = () => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding-bottom: 32px;">
        <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
      </td>
    </tr>
  </table>
`;

// Icon Box (zentriert)
const iconBox = (emoji, bgColor, size = 64) => `
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

// Title + Subtitle
const heroTitle = (title, subtitle = '') => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center">
        <h1 style="color: #FFFFFF; font-size: 28px; font-weight: bold; margin: 0 0 8px 0;">${title}</h1>
        ${subtitle ? `<p style="color: #71717A; font-size: 14px; margin: 0;">${subtitle}</p>` : ''}
      </td>
    </tr>
  </table>
`;

// Feature Tile (Icon + Text)
const featureTile = (emoji, bgColor, title, subtitle) => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #27272A; border-radius: 12px; margin-bottom: 12px;">
    <tr>
      <td style="padding: 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="52" valign="top">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" valign="middle" style="width: 40px; height: 40px; background: ${bgColor}; border-radius: 10px;">
                    <span style="font-size: 20px; line-height: 40px;">${emoji}</span>
                  </td>
                </tr>
              </table>
            </td>
            <td valign="middle" style="padding-left: 12px;">
              <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 4px 0;">${title}</p>
              <p style="color: #71717A; font-size: 12px; margin: 0;">${subtitle}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

// Card Container
const card = (content, borderColor = '#27272A') => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(180deg, #1C1C1E 0%, #141414 100%); border: 1px solid ${borderColor}; border-radius: 16px; margin: 16px 0;">
    <tr>
      <td style="padding: 24px;">
        ${content}
      </td>
    </tr>
  </table>
`;

// Data Table
const dataTable = (rows) => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #27272A; border-radius: 12px;">
    <tr>
      <td style="padding: 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${rows.map((row, i) => `
            <tr>
              <td style="padding: 12px 0; ${i < rows.length - 1 ? 'border-bottom: 1px solid #3F3F46;' : ''}">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="color: #71717A; font-size: 13px;">${row.label}</td>
                    <td align="right" style="color: ${row.color || '#FFFFFF'}; font-size: 13px; font-weight: ${row.bold ? 'bold' : 'normal'}; ${row.strike ? 'text-decoration: line-through;' : ''}">${row.value}</td>
                  </tr>
                </table>
              </td>
            </tr>
          `).join('')}
        </table>
      </td>
    </tr>
  </table>
`;

// Price Comparison
const priceComparison = (oldPrice, newPrice, oldLabel = 'ALTER PREIS', newLabel = 'NEUER PREIS') => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #27272A; border-radius: 12px;">
    <tr>
      <td style="padding: 20px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td align="center" width="45%">
              <p style="color: #71717A; font-size: 10px; margin: 0 0 4px 0;">${oldLabel}</p>
              <p style="color: #EF4444; font-size: 20px; font-weight: bold; margin: 0; text-decoration: line-through;">${oldPrice}</p>
              <p style="color: #71717A; font-size: 10px; margin: 4px 0 0 0;">/ Monat</p>
            </td>
            <td align="center" width="10%">
              <span style="color: #71717A; font-size: 20px;">→</span>
            </td>
            <td align="center" width="45%">
              <p style="color: #71717A; font-size: 10px; margin: 0 0 4px 0;">${newLabel}</p>
              <p style="color: ${accentColor}; font-size: 20px; font-weight: bold; margin: 0;">${newPrice}</p>
              <p style="color: #71717A; font-size: 10px; margin: 4px 0 0 0;">/ Monat</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

// Step Item
const stepItem = (num, text, color = accentColor) => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 12px;">
    <tr>
      <td width="36" valign="top">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" valign="middle" style="width: 24px; height: 24px; background: ${color === accentColor ? 'rgba(0, 255, 0, 0.1)' : 'rgba(59, 130, 246, 0.1)'}; border-radius: 6px;">
              <span style="color: ${color}; font-size: 12px; font-weight: bold; line-height: 24px;">${num}</span>
            </td>
          </tr>
        </table>
      </td>
      <td valign="middle" style="color: #A1A1AA; font-size: 13px; padding-left: 8px;">${text}</td>
    </tr>
  </table>
`;

// Info Box
const infoBox = (emoji, text, bgColor, textColor) => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: ${bgColor}; border: 1px solid ${textColor}33; border-radius: 12px; margin: 16px 0;">
    <tr>
      <td style="padding: 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="30" valign="top" style="font-size: 18px; line-height: 1;">${emoji}</td>
            <td valign="middle" style="color: ${textColor}; font-size: 13px; padding-left: 8px;">${text}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

// Primary Button
const primaryButton = (text, href) => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="background: ${accentColor}; border-radius: 12px;">
              <a href="${href}" target="_blank" style="display: inline-block; padding: 16px 40px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none;">${text}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

// Secondary Button
const secondaryButton = (text, href, bgColor = '#3B82F6') => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 16px 0;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" style="background: ${bgColor}; border-radius: 10px;">
              <a href="${href}" target="_blank" style="display: inline-block; padding: 12px 24px; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none;">${text}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
`;

// Avatar with Info
const avatarWithInfo = (initial, name, subtitle) => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td width="60" valign="top">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center" valign="middle" style="width: 48px; height: 48px; background: rgba(0, 255, 0, 0.1); border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 50%;">
              <span style="color: ${accentColor}; font-size: 20px; font-weight: bold; line-height: 48px;">${initial}</span>
            </td>
          </tr>
        </table>
      </td>
      <td valign="middle">
        <p style="color: #FFFFFF; font-size: 16px; font-weight: bold; margin: 0;">${name}</p>
        <p style="color: #71717A; font-size: 13px; margin: 4px 0 0 0;">${subtitle}</p>
      </td>
    </tr>
  </table>
`;

// Signature
const signature = () => `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 32px;">
    <tr>
      <td align="center" style="color: #A1A1AA; font-size: 14px;">
        Sportliche Grüße,<br>
        <strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
      </td>
    </tr>
  </table>
`;

// Footer
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
        &nbsp;•&nbsp;
        <a href="mailto:support@greenlight-fitness.de" style="color: #71717A; text-decoration: underline;">Kontakt</a>
      </td>
    </tr>
  </table>
`;

// =============================================================================
// ALLE 14 OPTIMIERTEN TEMPLATES
// =============================================================================

const templates = [
  {
    name: '1. Willkommen',
    subject: '🎉 Willkommen bei Greenlight Fitness!',
    html: emailWrapper(`
      ${logoHeader()}
      ${iconBox('🎉', 'linear-gradient(135deg, rgba(0, 255, 0, 0.2), rgba(0, 255, 0, 0.05))', 80)}
      ${heroTitle('Willkommen, Max!', 'Dein Fitness-Journey beginnt jetzt')}
      
      ${card(`
        <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 20px 0;">
          Schön, dass du dabei bist! Mit Greenlight Fitness hast du alles, was du für dein Training brauchst.
        </p>
        ${featureTile('📊', 'rgba(59, 130, 246, 0.1)', 'Trainingsplanung', 'Erstelle und verwalte deine Pläne')}
        ${featureTile('💪', 'rgba(168, 85, 247, 0.1)', 'Wellness-Tracking', 'Verfolge Schlaf, Energie & Stimmung')}
        ${featureTile('🏆', 'rgba(0, 255, 0, 0.1)', 'Personal Bests', 'Tracke deine Rekorde & Fortschritte')}
      `, accentColor)}
      
      ${primaryButton('Jetzt starten →', 'https://dev.greenlight-fitness.de')}
      ${signature()}
      ${footer()}
    `)
  },
  {
    name: '2. Preisänderung',
    subject: '⚠️ Wichtig: Änderung deines Pro-Coaching-Abonnements',
    html: emailWrapper(`
      ${logoHeader()}
      ${iconBox('⚠️', 'rgba(251, 191, 36, 0.1)')}
      ${heroTitle('Wichtige Änderung', 'Dein Abonnement wird angepasst')}
      
      <p style="color: #FFFFFF; font-size: 16px; margin: 24px 0 8px 0;">Hallo Max,</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">wir möchten dich über eine bevorstehende Änderung deines Abonnements informieren.</p>
      
      ${card(`
        <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">PREISÄNDERUNG</p>
        <p style="color: #71717A; font-size: 12px; margin: 0 0 4px 0;">Produkt</p>
        <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 16px 0;">Pro Coaching Paket</p>
        ${priceComparison('79,99 €', '89,99 €')}
        <p style="color: #71717A; font-size: 12px; margin: 16px 0 0 0; text-align: center;">
          Gültig ab: <strong style="color: #FFFFFF;">01.04.2026</strong>
        </p>
      `)}
      
      ${card(`
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="32" valign="top" style="font-size: 20px;">📋</td>
            <td valign="top" style="padding-left: 12px;">
              <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">Dein Sonderkündigungsrecht</p>
              <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 12px 0;">
                Aufgrund dieser Preisänderung hast du das Recht, dein Abonnement <strong style="color: #FFFFFF;">bis zum 25.03.2026</strong> zu kündigen.
              </p>
            </td>
          </tr>
        </table>
      `, '#3B82F6')}
      
      ${secondaryButton('Zur Kündigung →', 'https://billing.stripe.com/portal')}
      
      <p style="color: #71717A; font-size: 13px; margin: 24px 0;">
        Wenn du nichts unternimmst, wird dein Abonnement ab dem 01.04.2026 zum neuen Preis fortgeführt.
      </p>
      
      ${signature()}
      ${footer()}
    `)
  },
  {
    name: '3. Kündigung bestätigt',
    subject: '✓ Bestätigung deiner Kündigung',
    html: emailWrapper(`
      ${logoHeader()}
      ${iconBox('✓', 'rgba(239, 68, 68, 0.1)')}
      ${heroTitle('Kündigung bestätigt')}
      
      <p style="color: #FFFFFF; font-size: 16px; margin: 24px 0 8px 0;">Hallo Max,</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">wir bestätigen hiermit die Kündigung deines Abonnements.</p>
      
      ${card(`
        <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">KÜNDIGUNGSBESTÄTIGUNG</p>
        ${dataTable([
          { label: 'Produkt', value: 'Pro Coaching Paket', bold: true },
          { label: 'Gekündigt am', value: '03.02.2026' },
          { label: 'Zugang bis', value: '03.03.2026', color: accentColor, bold: true },
          { label: 'Referenz-Nr.', value: 'CANC-2026-ABC123', color: '#71717A' }
        ])}
      `)}
      
      <p style="color: #A1A1AA; font-size: 13px; margin: 24px 0;">
        Du hast noch bis zum <strong style="color: #FFFFFF;">03.03.2026</strong> vollen Zugriff auf alle Funktionen.
      </p>
      <p style="color: #71717A; font-size: 13px;">Wir würden uns freuen, dich in Zukunft wieder begrüßen zu dürfen!</p>
      
      ${signature()}
      ${footer()}
    `)
  },
  {
    name: '4. Coaching-Anfrage (an Coach)',
    subject: '🏋️ Neue Coaching-Anfrage von Lisa Schmidt',
    html: emailWrapper(`
      ${logoHeader()}
      ${iconBox('🏋️', 'rgba(0, 255, 0, 0.1)')}
      ${heroTitle('Neue Coaching-Anfrage')}
      
      <p style="color: #FFFFFF; font-size: 16px; margin: 24px 0 8px 0;">Hallo Coach Thomas,</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">du hast eine neue Coaching-Anfrage erhalten!</p>
      
      ${card(`
        <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">NEUE ANFRAGE</p>
        ${avatarWithInfo('L', 'Lisa Schmidt', 'lisa.schmidt@example.com')}
        <div style="margin-top: 16px;">
          ${dataTable([
            { label: 'Paket', value: '1:1 Premium Coaching', bold: true },
            { label: 'Angefragt am', value: '03.02.2026' }
          ])}
        </div>
      `, accentColor)}
      
      ${primaryButton('Zum Dashboard →', 'https://dev.greenlight-fitness.de/coach/dashboard')}
      
      ${infoBox('⏰', 'Bitte antworte innerhalb von <strong>48 Stunden</strong>', 'rgba(251, 191, 36, 0.1)', '#FCD34D')}
      
      ${signature()}
      ${footer()}
    `)
  },
  {
    name: '5. Coaching genehmigt',
    subject: '✅ Dein Coaching wurde genehmigt!',
    html: emailWrapper(`
      ${logoHeader()}
      ${iconBox('🎉', 'rgba(0, 255, 0, 0.1)')}
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center">
            <h1 style="color: ${accentColor}; font-size: 24px; font-weight: bold; margin: 0;">Coaching genehmigt!</h1>
          </td>
        </tr>
      </table>
      
      <p style="color: #FFFFFF; font-size: 16px; margin: 24px 0 8px 0;">Hallo Lisa,</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">großartige Neuigkeiten! <strong style="color: #FFFFFF;">Coach Thomas</strong> hat deine Coaching-Anfrage angenommen.</p>
      
      ${card(`
        <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">COACHING GESTARTET</p>
        ${dataTable([
          { label: 'Coach', value: 'Thomas Müller', bold: true },
          { label: 'Paket', value: '1:1 Premium Coaching' },
          { label: 'Start', value: '05.02.2026', color: accentColor, bold: true }
        ])}
      `, accentColor)}
      
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 24px 0 12px 0;">🚀 Nächste Schritte</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #18181B; border-radius: 12px;">
        <tr>
          <td style="padding: 16px;">
            ${stepItem(1, 'Öffne dein Dashboard')}
            ${stepItem(2, 'Vervollständige dein Athleten-Profil')}
            ${stepItem(3, 'Warte auf deinen ersten Trainingsplan')}
          </td>
        </tr>
      </table>
      
      ${primaryButton('Zum Dashboard →', 'https://dev.greenlight-fitness.de/dashboard')}
      ${signature()}
      ${footer()}
    `)
  },
  {
    name: '6. Coaching abgelehnt',
    subject: 'Information zu deiner Coaching-Anfrage',
    html: emailWrapper(`
      ${logoHeader()}
      ${heroTitle('Coaching-Anfrage')}
      
      <p style="color: #FFFFFF; font-size: 16px; margin: 24px 0 8px 0;">Hallo Lisa,</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">leider konnte <strong style="color: #FFFFFF;">Coach Thomas</strong> deine Coaching-Anfrage nicht annehmen.</p>
      
      ${card(`
        <p style="color: #EF4444; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">ANFRAGE NICHT ANGENOMMEN</p>
        <p style="color: #A1A1AA; font-size: 13px; margin: 0;">
          <strong style="color: #FFFFFF;">Grund:</strong> Kapazitäten aktuell erschöpft. Bitte versuche es in 2-3 Wochen erneut.
        </p>
      `, '#EF4444')}
      
      ${infoBox('💰', '<strong style="color: #FFFFFF;">Erstattung:</strong> Deine Zahlung wird innerhalb von 5-10 Werktagen erstattet.', 'rgba(0, 255, 0, 0.05)', accentColor)}
      
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 24px 0 12px 0;">🔄 Alternativen</p>
      <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 16px 0;">Du kannst gerne ein anderes Coaching-Paket buchen oder dich an unseren Support wenden.</p>
      
      ${primaryButton('Zum Shop →', 'https://greenlight-fitness.de/shop')}
      ${signature()}
      ${footer()}
    `)
  },
  {
    name: '7. Zahlung fehlgeschlagen',
    subject: '⚠️ Zahlung fehlgeschlagen - Aktion erforderlich',
    html: emailWrapper(`
      ${logoHeader()}
      ${iconBox('⚠️', 'rgba(239, 68, 68, 0.1)')}
      ${heroTitle('Zahlung fehlgeschlagen')}
      
      <p style="color: #FFFFFF; font-size: 16px; margin: 24px 0 8px 0;">Hallo Max,</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">wir konnten deine letzte Zahlung leider nicht einziehen.</p>
      
      ${card(`
        <p style="color: #EF4444; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">ZAHLUNGSPROBLEM</p>
        ${dataTable([
          { label: 'Produkt', value: 'Pro Coaching Paket', bold: true },
          { label: 'Betrag', value: '89,99 €', color: '#EF4444', bold: true },
          { label: 'Fällig seit', value: '01.02.2026' }
        ])}
      `, '#EF4444')}
      
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 24px 0 12px 0;">🔧 So behebst du das Problem</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #18181B; border-radius: 12px;">
        <tr>
          <td style="padding: 16px;">
            ${stepItem(1, 'Prüfe deine Zahlungsmethode', '#3B82F6')}
            ${stepItem(2, 'Stelle sicher, dass genug Guthaben vorhanden ist', '#3B82F6')}
            ${stepItem(3, 'Aktualisiere ggf. deine Kartendaten', '#3B82F6')}
          </td>
        </tr>
      </table>
      
      ${secondaryButton('Zahlungsmethode aktualisieren →', 'https://billing.stripe.com/portal')}
      
      ${infoBox('⏰', 'Bitte aktualisiere deine Daten innerhalb von <strong>7 Tagen</strong>, um eine Unterbrechung zu vermeiden.', 'rgba(251, 191, 36, 0.1)', '#FCD34D')}
      
      ${signature()}
      ${footer()}
    `)
  },
  {
    name: '8. Account gelöscht (DSGVO)',
    subject: '✓ Bestätigung: Dein Account wurde gelöscht',
    html: emailWrapper(`
      ${logoHeader()}
      ${heroTitle('Account gelöscht', 'Gemäß DSGVO Art. 17')}
      
      <p style="color: #FFFFFF; font-size: 16px; margin: 24px 0 8px 0;">Hallo Max,</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">hiermit bestätigen wir die Löschung deines Accounts gemäß deiner Anfrage.</p>
      
      ${card(`
        <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">LÖSCHBESTÄTIGUNG</p>
        ${dataTable([
          { label: 'Gelöscht am', value: '03.02.2026' },
          { label: 'Referenz-Nr.', value: 'DEL-2026-XYZ789', color: '#71717A' }
        ])}
      `)}
      
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 24px 0 12px 0;">📋 Gelöschte Daten</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #18181B; border-radius: 12px;">
        <tr>
          <td style="padding: 16px; color: #A1A1AA; font-size: 13px;">
            • Profildaten und Einstellungen<br>
            • Trainingspläne und Logs<br>
            • Wellness-Daten<br>
            • Coaching-Beziehungen
          </td>
        </tr>
      </table>
      
      ${infoBox('📋', '<strong style="color: #FFFFFF;">Aufbewahrte Daten (Gesetzliche Pflicht):</strong><br>• Rechnungen (10 Jahre - Steuerrecht)<br>• Zahlungshistorie (6 Jahre - HGB)', 'rgba(251, 191, 36, 0.1)', '#FCD34D')}
      
      <p style="color: #71717A; font-size: 13px; margin: 24px 0;">
        Bei Fragen wende dich an: <a href="mailto:datenschutz@greenlight-fitness.de" style="color: #3B82F6;">datenschutz@greenlight-fitness.de</a>
      </p>
      
      ${footer()}
    `)
  },
  {
    name: '9. Passwort zurücksetzen',
    subject: '🔐 Passwort zurücksetzen',
    html: emailWrapper(`
      ${logoHeader()}
      ${iconBox('🔐', 'rgba(59, 130, 246, 0.1)')}
      ${heroTitle('Passwort zurücksetzen')}
      
      <p style="color: #FFFFFF; font-size: 16px; margin: 24px 0 8px 0;">Hallo Max,</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
        du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den Button unten, um ein neues Passwort zu erstellen.
      </p>
      
      ${primaryButton('Neues Passwort erstellen →', 'https://dev.greenlight-fitness.de/reset-password?token=example')}
      
      ${infoBox('⏰', 'Dieser Link ist <strong>1 Stunde</strong> gültig', 'rgba(251, 191, 36, 0.1)', '#FCD34D')}
      
      ${card(`
        <p style="color: #71717A; font-size: 12px; margin: 0;">
          Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren. Dein Passwort bleibt unverändert.
        </p>
      `)}
      
      ${signature()}
      ${footer()}
    `)
  },
  {
    name: '10. E-Mail bestätigen',
    subject: '✉️ Bestätige deine E-Mail-Adresse',
    html: emailWrapper(`
      ${logoHeader()}
      ${iconBox('✉️', 'rgba(0, 255, 0, 0.1)')}
      ${heroTitle('E-Mail bestätigen', 'Nur noch ein Schritt!')}
      
      <p style="color: #FFFFFF; font-size: 16px; margin: 24px 0 8px 0;">Hallo Max,</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
        vielen Dank für deine Registrierung! Bitte bestätige deine E-Mail-Adresse, um deinen Account zu aktivieren.
      </p>
      
      ${primaryButton('E-Mail bestätigen →', 'https://dev.greenlight-fitness.de/verify-email?token=example')}
      
      ${card(`
        <p style="color: #71717A; font-size: 12px; margin: 0;">
          Falls du dich nicht bei Greenlight Fitness registriert hast, kannst du diese E-Mail ignorieren.
        </p>
      `)}
      
      ${signature()}
      ${footer()}
    `)
  },
  {
    name: '11. Einladung',
    subject: '🎯 Coach Thomas lädt dich zu Greenlight Fitness ein!',
    html: emailWrapper(`
      ${logoHeader()}
      ${iconBox('🎯', 'linear-gradient(135deg, rgba(0, 255, 0, 0.2), rgba(0, 255, 0, 0.05))', 80)}
      ${heroTitle('Du bist eingeladen!')}
      
      ${card(`
        ${avatarWithInfo('T', 'Coach Thomas', 'Premium Coach')}
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: #27272A; border-radius: 12px; margin-top: 16px;">
          <tr>
            <td style="padding: 16px;">
              <p style="color: #71717A; font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 0 0 8px 0;">Persönliche Nachricht</p>
              <p style="color: #A1A1AA; font-size: 14px; margin: 0; font-style: italic;">"Hey! Ich freue mich darauf, mit dir zusammenzuarbeiten. Lass uns deine Fitness-Ziele erreichen!"</p>
            </td>
          </tr>
        </table>
      `, accentColor)}
      
      <p style="color: #A1A1AA; font-size: 14px; margin: 24px 0;">
        <strong style="color: #FFFFFF;">Coach Thomas</strong> möchte, dass du Teil von Greenlight Fitness wirst. 
        Starte jetzt mit deinem personalisierten Trainingserlebnis!
      </p>
      
      ${primaryButton('Einladung annehmen →', 'https://dev.greenlight-fitness.de/invite/ABC123')}
      
      ${infoBox('⏰', 'Diese Einladung ist gültig bis <strong>10.02.2026</strong>', 'rgba(251, 191, 36, 0.1)', '#FCD34D')}
      
      ${signature()}
      ${footer()}
    `)
  },
  {
    name: '12. Trainingsplan zugewiesen',
    subject: '📋 Neuer Trainingsplan: Hypertrophy Phase 1',
    html: emailWrapper(`
      ${logoHeader()}
      ${iconBox('📋', 'rgba(0, 255, 0, 0.1)')}
      ${heroTitle('Neuer Trainingsplan!', 'Dein Coach hat dir einen Plan zugewiesen')}
      
      <p style="color: #FFFFFF; font-size: 16px; margin: 24px 0 8px 0;">Hallo Max,</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
        <strong style="color: #FFFFFF;">Coach Thomas</strong> hat dir einen neuen Trainingsplan zugewiesen. Zeit, durchzustarten!
      </p>
      
      ${card(`
        <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">DEIN NEUER PLAN</p>
        ${dataTable([
          { label: 'Planname', value: 'Hypertrophy Phase 1', bold: true },
          { label: 'Coach', value: 'Coach Thomas' },
          { label: 'Start', value: '10.02.2026', color: accentColor, bold: true },
          { label: 'Dauer', value: '8 Wochen' }
        ])}
      `, accentColor)}
      
      ${primaryButton('Plan ansehen →', 'https://dev.greenlight-fitness.de/dashboard')}
      ${signature()}
      ${footer()}
    `)
  },
  {
    name: '13. Kauf bestätigt',
    subject: '🎉 Kauf bestätigt: Pro Coaching Paket',
    html: emailWrapper(`
      ${logoHeader()}
      ${iconBox('🎉', 'rgba(0, 255, 0, 0.1)')}
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td align="center">
            <h1 style="color: ${accentColor}; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Kauf erfolgreich!</h1>
            <p style="color: #71717A; font-size: 14px; margin: 0;">Vielen Dank für deinen Einkauf</p>
          </td>
        </tr>
      </table>
      
      <p style="color: #FFFFFF; font-size: 16px; margin: 24px 0 8px 0;">Hallo Max,</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
        dein Kauf wurde erfolgreich abgeschlossen. Hier sind die Details:
      </p>
      
      ${card(`
        <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">KAUFBESTÄTIGUNG</p>
        ${dataTable([
          { label: 'Produkt', value: 'Pro Coaching Paket', bold: true },
          { label: 'Preis', value: '89,99 € / Monat', color: accentColor, bold: true },
          { label: 'Typ', value: 'Abonnement' }
        ])}
      `, accentColor)}
      
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 32px 0;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-right: 8px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="background: ${accentColor}; border-radius: 12px;">
                        <a href="https://dev.greenlight-fitness.de/dashboard" target="_blank" style="display: inline-block; padding: 14px 24px; color: #000000; font-size: 14px; font-weight: bold; text-decoration: none;">Zum Dashboard</a>
                      </td>
                    </tr>
                  </table>
                </td>
                <td style="padding-left: 8px;">
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="background: #27272A; border-radius: 12px;">
                        <a href="https://billing.stripe.com/receipt" target="_blank" style="display: inline-block; padding: 14px 24px; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none;">Rechnung</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      ${signature()}
      ${footer()}
    `)
  },
  {
    name: '14. Abo verlängert',
    subject: '✅ Abo verlängert: Pro Coaching Paket',
    html: emailWrapper(`
      ${logoHeader()}
      ${iconBox('✅', 'rgba(0, 255, 0, 0.1)')}
      ${heroTitle('Abo verlängert')}
      
      <p style="color: #FFFFFF; font-size: 16px; margin: 24px 0 8px 0;">Hallo Max,</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
        dein Abonnement wurde erfolgreich verlängert. Vielen Dank für deine Treue!
      </p>
      
      ${card(`
        ${dataTable([
          { label: 'Produkt', value: 'Pro Coaching Paket', bold: true },
          { label: 'Betrag', value: '89,99 €', color: accentColor, bold: true },
          { label: 'Nächste Abbuchung', value: '03.03.2026' }
        ])}
      `)}
      
      ${secondaryButton('Abo verwalten →', 'https://billing.stripe.com/portal', '#27272A')}
      ${signature()}
      ${footer()}
    `)
  }
];

// =============================================================================
// SENDEN
// =============================================================================

async function sendAllTemplates() {
  console.log('📧 Sende OPTIMIERTE E-Mail Templates an:', TO_EMAIL);
  console.log('━'.repeat(50));
  console.log('✅ Table-basiert (kein Flexbox)');
  console.log('✅ Outlook-kompatibel');
  console.log('✅ Gmail-kompatibel');
  console.log('━'.repeat(50));

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    console.log(`\n[${i + 1}/${templates.length}] Sende: ${template.name}...`);

    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject: `[OPTIMIERT ${i + 1}/14] ${template.subject}`,
        html: template.html,
      });

      if (result.data?.id) {
        console.log(`   ✅ Erfolgreich! ID: ${result.data.id}`);
      } else if (result.error) {
        console.log(`   ❌ Fehler: ${result.error.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error(`   ❌ Fehler:`, error.message);
    }
  }

  console.log('\n' + '━'.repeat(50));
  console.log('✅ Alle optimierten E-Mails versendet!');
  console.log('📬 Prüfe deinen Posteingang');
}

sendAllTemplates();
