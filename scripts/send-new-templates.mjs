/**
 * Sendet die NEUEN E-Mail Templates an info@p-a.llc
 * 
 * Verwendung: node scripts/send-new-templates.mjs
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_EgDdSN3B_6FByK2mukgRGTmCczBKbd8ot';
const resend = new Resend(RESEND_API_KEY);

const FROM_EMAIL = 'Greenlight Fitness <noreply@mail.greenlight-fitness.de>';
const TO_EMAIL = 'info@greenlight-fitness.de';

const accentColor = '#00FF00';

const cardStyles = `
  background: linear-gradient(180deg, #1C1C1E 0%, #0A0A0A 100%);
  border: 1px solid #27272A;
  border-radius: 16px;
  padding: 24px;
  margin: 16px 0;
`;

const getFooter = () => `
  <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #27272A; text-align: center;">
    <p style="color: #71717A; font-size: 12px; margin: 0 0 8px 0;">Greenlight Fitness GmbH</p>
    <p style="color: #71717A; font-size: 12px; margin: 0;">
      <a href="https://greenlight-fitness.de/impressum" style="color: #71717A; text-decoration: underline;">Impressum</a>
      &nbsp;•&nbsp;
      <a href="https://greenlight-fitness.de/datenschutz" style="color: #71717A; text-decoration: underline;">Datenschutz</a>
      &nbsp;•&nbsp;
      <a href="mailto:support@greenlight-fitness.de" style="color: #71717A; text-decoration: underline;">Kontakt</a>
    </p>
  </div>
`;

const templates = [
  {
    name: '9. Passwort zurücksetzen',
    subject: '🔐 Passwort zurücksetzen',
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
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo Max,</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den Button unten, um ein neues Passwort zu erstellen.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://dev.greenlight-fitness.de/reset-password?token=example" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold; box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);">
        Neues Passwort erstellen →
      </a>
    </div>
    <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0;">
      <p style="color: #FCD34D; font-size: 13px; margin: 0;">
        ⏰ Dieser Link ist <strong>1 Stunde</strong> gültig
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
    `
  },
  {
    name: '10. E-Mail bestätigen',
    subject: '✉️ Bestätige deine E-Mail-Adresse',
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
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo Max,</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      vielen Dank für deine Registrierung! Bitte bestätige deine E-Mail-Adresse, um deinen Account zu aktivieren.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://dev.greenlight-fitness.de/verify-email?token=example" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold; box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);">
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
    `
  },
  {
    name: '11. Einladung',
    subject: '🎯 Coach Thomas lädt dich zu Greenlight Fitness ein!',
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
          <span style="color: ${accentColor}; font-size: 20px; font-weight: bold;">T</span>
        </div>
        <div>
          <p style="color: #FFFFFF; font-size: 16px; font-weight: bold; margin: 0;">Coach Thomas</p>
          <p style="color: #71717A; font-size: 13px; margin: 4px 0 0 0;">Premium Coach</p>
        </div>
      </div>
      <div style="background: #27272A; border-radius: 12px; padding: 16px; margin-top: 16px;">
        <p style="color: #71717A; font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 0 0 8px 0;">Persönliche Nachricht</p>
        <p style="color: #A1A1AA; font-size: 14px; margin: 0; font-style: italic;">"Hey! Ich freue mich darauf, mit dir zusammenzuarbeiten. Lass uns deine Fitness-Ziele erreichen!"</p>
      </div>
    </div>
    <p style="color: #A1A1AA; font-size: 14px; margin: 24px 0;">
      <strong style="color: #FFFFFF;">Coach Thomas</strong> möchte, dass du Teil von Greenlight Fitness wirst. 
      Starte jetzt mit deinem personalisierten Trainingserlebnis!
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://dev.greenlight-fitness.de/invite/ABC123" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold; box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);">
        Einladung annehmen →
      </a>
    </div>
    <div style="background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.2); border-radius: 12px; padding: 16px; text-align: center;">
      <p style="color: #FCD34D; font-size: 13px; margin: 0;">
        ⏰ Diese Einladung ist gültig bis <strong>10.02.2026</strong>
      </p>
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
    name: '12. Trainingsplan zugewiesen',
    subject: '📋 Neuer Trainingsplan: Hypertrophy Phase 1',
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
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo Max,</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      <strong style="color: #FFFFFF;">Coach Thomas</strong> hat dir einen neuen Trainingsplan zugewiesen. Zeit, durchzustarten!
    </p>
    <div style="${cardStyles} border-color: ${accentColor};">
      <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">DEIN NEUER PLAN</p>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Planname</span>
          <span style="color: #FFFFFF; font-size: 13px; font-weight: bold;">Hypertrophy Phase 1</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Coach</span>
          <span style="color: #FFFFFF; font-size: 13px;">Coach Thomas</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Start</span>
          <span style="color: ${accentColor}; font-size: 13px; font-weight: bold;">10.02.2026</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Dauer</span>
          <span style="color: #FFFFFF; font-size: 13px;">8 Wochen</span>
        </div>
      </div>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://dev.greenlight-fitness.de/dashboard" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
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
    `
  },
  {
    name: '13. Kauf bestätigt',
    subject: '🎉 Kauf bestätigt: Pro Coaching Paket',
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
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo Max,</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      dein Kauf wurde erfolgreich abgeschlossen. Hier sind die Details:
    </p>
    <div style="${cardStyles} border-color: ${accentColor};">
      <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">KAUFBESTÄTIGUNG</p>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Produkt</span>
          <span style="color: #FFFFFF; font-size: 13px; font-weight: bold;">Pro Coaching Paket</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Preis</span>
          <span style="color: ${accentColor}; font-size: 13px; font-weight: bold;">89,99 € / Monat</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Typ</span>
          <span style="color: #FFFFFF; font-size: 13px;">Abonnement</span>
        </div>
      </div>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://dev.greenlight-fitness.de/dashboard" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold; margin-right: 8px;">
        Zum Dashboard →
      </a>
      <a href="https://billing.stripe.com/receipt" style="display: inline-block; background: #27272A; color: #FFFFFF; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
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
    `
  },
  {
    name: '14. Abo verlängert',
    subject: '✅ Abo verlängert: Pro Coaching Paket',
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
    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo Max,</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      dein Abonnement wurde erfolgreich verlängert. Vielen Dank für deine Treue!
    </p>
    <div style="${cardStyles}">
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Produkt</span>
          <span style="color: #FFFFFF; font-size: 13px; font-weight: bold;">Pro Coaching Paket</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #3F3F46;">
          <span style="color: #71717A; font-size: 13px;">Betrag</span>
          <span style="color: ${accentColor}; font-size: 13px; font-weight: bold;">89,99 €</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #71717A; font-size: 13px;">Nächste Abbuchung</span>
          <span style="color: #FFFFFF; font-size: 13px;">03.03.2026</span>
        </div>
      </div>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="https://billing.stripe.com/portal" style="display: inline-block; background: #27272A; color: #FFFFFF; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-size: 13px; font-weight: bold;">
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
    `
  }
];

async function sendNewTemplates() {
  console.log('📧 Sende NEUE E-Mail Templates an:', TO_EMAIL);
  console.log('━'.repeat(50));

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    console.log(`\n[${i + 1}/${templates.length}] Sende: ${template.name}...`);

    try {
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject: `[TEST ${9 + i}/14] ${template.subject}`,
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
  console.log('✅ Alle neuen E-Mails versendet!');
  console.log('📬 Prüfe deinen Posteingang bei info@p-a.llc');
}

sendNewTemplates();
