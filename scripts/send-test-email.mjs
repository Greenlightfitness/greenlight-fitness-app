/**
 * Test-E-Mail versenden
 * 
 * Verwendung: node scripts/send-test-email.mjs
 * 
 * Benötigt RESEND_API_KEY in .env.local
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_EgDdSN3B_6FByK2mukgRGTmCczBKbd8ot';

const resend = new Resend(RESEND_API_KEY);

// Accent color
const accentColor = '#00FF00';

// Card styles
const cardStyles = `
  background: linear-gradient(180deg, #1C1C1E 0%, #0A0A0A 100%);
  border: 1px solid #27272A;
  border-radius: 16px;
  padding: 24px;
  margin: 16px 0;
`;

// Footer
const getFooter = () => `
  <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #27272A; text-align: center;">
    <p style="color: #71717A; font-size: 12px; margin: 0 0 8px 0;">
      Greenlight Fitness GmbH
    </p>
    <p style="color: #71717A; font-size: 12px; margin: 0;">
      <a href="https://greenlight-fitness.de/impressum" style="color: #71717A; text-decoration: underline;">Impressum</a>
      &nbsp;•&nbsp;
      <a href="https://greenlight-fitness.de/datenschutz" style="color: #71717A; text-decoration: underline;">Datenschutz</a>
      &nbsp;•&nbsp;
      <a href="mailto:support@greenlight-fitness.de" style="color: #71717A; text-decoration: underline;">Kontakt</a>
    </p>
  </div>
`;

// Design Showcase E-Mail Template
const designShowcaseHtml = `
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
      Hallo <strong style="color: ${accentColor};">Greenlight Team</strong>,
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
      <div style="background: #27272A; border-radius: 12px; padding: 20px; text-align: center;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="40%" style="text-align: center; vertical-align: middle;">
              <p style="color: #71717A; font-size: 10px; margin: 0 0 4px 0;">ALTER PREIS</p>
              <p style="color: #EF4444; font-size: 24px; font-weight: bold; margin: 0; text-decoration: line-through;">29,99 €</p>
              <p style="color: #71717A; font-size: 10px; margin: 4px 0 0 0;">/ Monat</p>
            </td>
            <td width="20%" style="text-align: center; vertical-align: middle;">
              <span style="color: #71717A; font-size: 24px;">→</span>
            </td>
            <td width="40%" style="text-align: center; vertical-align: middle;">
              <p style="color: #71717A; font-size: 10px; margin: 0 0 4px 0;">NEUER PREIS</p>
              <p style="color: ${accentColor}; font-size: 24px; font-weight: bold; margin: 0;">39,99 €</p>
              <p style="color: #71717A; font-size: 10px; margin: 4px 0 0 0;">/ Monat</p>
            </td>
          </tr>
        </table>
      </div>
    </div>

    <!-- ========== FEATURE TILES ========== -->
    <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #27272A;">
      🧩 Feature-Kacheln
    </p>

    <div style="margin-bottom: 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #18181B; border: 1px solid #27272A; border-radius: 12px; margin-bottom: 12px;">
        <tr>
          <td style="padding: 16px; width: 64px;">
            <div style="width: 48px; height: 48px; background: rgba(59, 130, 246, 0.1); border-radius: 12px; text-align: center; line-height: 48px;">
              <span style="font-size: 24px;">📊</span>
            </div>
          </td>
          <td style="padding: 16px 16px 16px 0;">
            <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0;">Feature Titel</p>
            <p style="color: #71717A; font-size: 12px; margin: 4px 0 0 0;">Kurze Beschreibung des Features</p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #18181B; border: 1px solid #27272A; border-radius: 12px; margin-bottom: 12px;">
        <tr>
          <td style="padding: 16px; width: 64px;">
            <div style="width: 48px; height: 48px; background: rgba(168, 85, 247, 0.1); border-radius: 12px; text-align: center; line-height: 48px;">
              <span style="font-size: 24px;">💪</span>
            </div>
          </td>
          <td style="padding: 16px 16px 16px 0;">
            <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0;">Weiteres Feature</p>
            <p style="color: #71717A; font-size: 12px; margin: 4px 0 0 0;">Mit andersfarbigem Icon</p>
          </td>
        </tr>
      </table>

      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #18181B; border: 1px solid #27272A; border-radius: 12px;">
        <tr>
          <td style="padding: 16px; width: 64px;">
            <div style="width: 48px; height: 48px; background: rgba(0, 255, 0, 0.1); border-radius: 12px; text-align: center; line-height: 48px;">
              <span style="font-size: 24px;">🏆</span>
            </div>
          </td>
          <td style="padding: 16px 16px 16px 0;">
            <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0;">Grünes Feature</p>
            <p style="color: #71717A; font-size: 12px; margin: 4px 0 0 0;">Im Greenlight-Style</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- ========== NUMBERED STEPS ========== -->
    <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #27272A;">
      🚀 Nummerierte Schritte
    </p>

    <div style="background: #18181B; border-radius: 12px; padding: 20px; margin-bottom: 32px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-bottom: 16px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width: 40px; vertical-align: top;">
                  <div style="width: 28px; height: 28px; background: rgba(0, 255, 0, 0.1); border-radius: 8px; text-align: center; line-height: 28px; color: ${accentColor}; font-size: 14px; font-weight: bold;">1</div>
                </td>
                <td style="color: #A1A1AA; font-size: 14px; vertical-align: middle;">Erster Schritt der Anleitung</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom: 16px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width: 40px; vertical-align: top;">
                  <div style="width: 28px; height: 28px; background: rgba(0, 255, 0, 0.1); border-radius: 8px; text-align: center; line-height: 28px; color: ${accentColor}; font-size: 14px; font-weight: bold;">2</div>
                </td>
                <td style="color: #A1A1AA; font-size: 14px; vertical-align: middle;">Zweiter Schritt mit mehr Text</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td>
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width: 40px; vertical-align: top;">
                  <div style="width: 28px; height: 28px; background: rgba(0, 255, 0, 0.1); border-radius: 8px; text-align: center; line-height: 28px; color: ${accentColor}; font-size: 14px; font-weight: bold;">3</div>
                </td>
                <td style="color: #A1A1AA; font-size: 14px; vertical-align: middle;">Dritter und letzter Schritt</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>

    <!-- ========== AVATAR / USER CARD ========== -->
    <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #27272A;">
      👤 Benutzer-Karte
    </p>

    <div style="${cardStyles} margin-bottom: 32px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width: 72px; vertical-align: middle;">
            <div style="width: 56px; height: 56px; background: rgba(0, 255, 0, 0.1); border: 2px solid rgba(0, 255, 0, 0.3); border-radius: 50%; text-align: center; line-height: 52px;">
              <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">M</span>
            </div>
          </td>
          <td style="vertical-align: middle;">
            <p style="color: #FFFFFF; font-size: 18px; font-weight: bold; margin: 0;">Max Mustermann</p>
            <p style="color: #71717A; font-size: 13px; margin: 4px 0 0 0;">max@example.com</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- ========== INFO BOXES ========== -->
    <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #27272A;">
      💡 Info-Boxen
    </p>

    <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 12px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width: 32px; vertical-align: top;"><span style="font-size: 18px;">ℹ️</span></td>
          <td style="color: #60A5FA; font-size: 13px;"><strong>Info:</strong> Dies ist eine blaue Info-Box für neutrale Hinweise.</td>
        </tr>
      </table>
    </div>

    <div style="background: rgba(0, 255, 0, 0.05); border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 12px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width: 32px; vertical-align: top;"><span style="font-size: 18px;">💰</span></td>
          <td style="color: ${accentColor}; font-size: 13px;"><strong>Tipp:</strong> Grüne Box für positive Hinweise wie Erstattungen.</td>
        </tr>
      </table>
    </div>

    <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 32px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="width: 32px; vertical-align: top;"><span style="font-size: 18px;">⏰</span></td>
          <td style="color: #FCD34D; font-size: 13px;"><strong>Frist:</strong> Gelbe Box für zeitkritische Hinweise.</td>
        </tr>
      </table>
    </div>

    <!-- ========== BUTTONS ========== -->
    <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #27272A;">
      🔘 Buttons
    </p>

    <div style="text-align: center; margin-bottom: 32px;">
      <a href="#" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold; margin-bottom: 16px;">
        Primärer Button →
      </a>
      <br>
      <a href="#" style="display: inline-block; background: #3B82F6; color: #FFFFFF; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: bold; margin-bottom: 16px; margin-top: 8px;">
        Sekundärer Button →
      </a>
      <br>
      <a href="#" style="display: inline-block; background: #27272A; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: bold; margin-top: 8px;">
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

    <table cellpadding="0" cellspacing="8" border="0" style="margin-bottom: 32px;">
      <tr>
        <td style="text-align: center;">
          <div style="width: 50px; height: 50px; background: ${accentColor}; border-radius: 8px;"></div>
          <p style="color: #71717A; font-size: 10px; margin: 4px 0 0 0;">Primary</p>
        </td>
        <td style="text-align: center;">
          <div style="width: 50px; height: 50px; background: #3B82F6; border-radius: 8px;"></div>
          <p style="color: #71717A; font-size: 10px; margin: 4px 0 0 0;">Blue</p>
        </td>
        <td style="text-align: center;">
          <div style="width: 50px; height: 50px; background: #A855F7; border-radius: 8px;"></div>
          <p style="color: #71717A; font-size: 10px; margin: 4px 0 0 0;">Purple</p>
        </td>
        <td style="text-align: center;">
          <div style="width: 50px; height: 50px; background: #F59E0B; border-radius: 8px;"></div>
          <p style="color: #71717A; font-size: 10px; margin: 4px 0 0 0;">Warning</p>
        </td>
        <td style="text-align: center;">
          <div style="width: 50px; height: 50px; background: #EF4444; border-radius: 8px;"></div>
          <p style="color: #71717A; font-size: 10px; margin: 4px 0 0 0;">Error</p>
        </td>
      </tr>
    </table>

    <!-- ========== SIGNATURE ========== -->
    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br>
      <strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>

    ${getFooter()}
  </div>
</body>
</html>
`;

async function sendTestEmail() {
  console.log('📧 Sende Design-Showcase E-Mail...\n');
  console.log('API Key:', RESEND_API_KEY.substring(0, 10) + '...');

  try {
    const result = await resend.emails.send({
      from: 'Greenlight Fitness <noreply@mail.greenlight-fitness.de>',
      to: ['info@p-a.llc'],
      subject: '🎨 Greenlight Fitness - E-Mail Design Showcase',
      html: designShowcaseHtml,
    });

    console.log('\n📨 Resend API Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.data?.id) {
      console.log('\n✅ E-Mail erfolgreich gesendet!');
      console.log(`   Message ID: ${result.data.id}`);
      console.log(`   Empfänger: info@p-a.llc`);
      console.log('\n📬 Bitte überprüfe deinen Posteingang (ggf. auch Spam-Ordner).');
    } else if (result.error) {
      console.log('\n❌ Fehler von Resend:');
      console.log(`   ${result.error.message}`);
      console.log(`   Name: ${result.error.name}`);
    }
  } catch (error) {
    console.error('\n❌ Fehler beim Senden:', error);
  }
}

sendTestEmail();
