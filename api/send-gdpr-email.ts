import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const COMPANY = {
  name: 'Greenlight Fitness',
  email: 'info@greenlight-fitness.de',
  address: 'Musterstraße 11, 10115 Berlin',
};

type EmailType = 
  | 'deletion_request_received'
  | 'deletion_completed'
  | 'export_ready'
  | 'privacy_update'
  | 'account_created';

interface EmailRequest {
  email: string;
  type: EmailType;
  name?: string;
  data?: Record<string, any>;
}

const templates: Record<EmailType, (data: EmailRequest) => { subject: string; html: string }> = {
  deletion_request_received: ({ email, name }) => ({
    subject: 'Löschantrag eingegangen - Greenlight Fitness',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #000; padding: 24px; text-align: center;">
          <h1 style="color: #00FF00; margin: 0;">GREENLIGHT FITNESS</h1>
        </div>
        <div style="padding: 32px 24px; background: #f9f9f9;">
          <h2 style="color: #000;">Löschantrag bestätigt</h2>
          <p>Hallo ${name || 'Nutzer'},</p>
          <p>wir haben Ihren Antrag auf Löschung Ihrer personenbezogenen Daten erhalten (DSGVO Art. 17).</p>
          <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0;"><strong>Bearbeitungsstatus:</strong> In Bearbeitung</p>
            <p style="margin: 8px 0 0;"><strong>Voraussichtliche Frist:</strong> 30 Tage</p>
          </div>
          <p>Nach Abschluss der Löschung erhalten Sie eine Bestätigung per E-Mail.</p>
          <p style="color: #666; font-size: 14px;">Hinweis: Einige Daten müssen wir aufgrund gesetzlicher Aufbewahrungspflichten möglicherweise länger speichern.</p>
        </div>
        <div style="padding: 16px 24px; background: #000; color: #666; font-size: 12px; text-align: center;">
          <p>${COMPANY.name} | ${COMPANY.address}</p>
          <p><a href="mailto:${COMPANY.email}" style="color: #00FF00;">${COMPANY.email}</a></p>
        </div>
      </div>
    `,
  }),

  deletion_completed: ({ email, name }) => ({
    subject: 'Datenlöschung abgeschlossen - Greenlight Fitness',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #000; padding: 24px; text-align: center;">
          <h1 style="color: #00FF00; margin: 0;">GREENLIGHT FITNESS</h1>
        </div>
        <div style="padding: 32px 24px; background: #f9f9f9;">
          <h2 style="color: #000;">Löschung abgeschlossen ✓</h2>
          <p>Hallo ${name || 'Nutzer'},</p>
          <p>Ihr Antrag auf Löschung Ihrer personenbezogenen Daten wurde erfolgreich bearbeitet.</p>
          <div style="background: #00FF00; color: #000; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
            <strong>Alle Ihre Daten wurden gelöscht.</strong>
          </div>
          <p>Folgende Daten wurden entfernt:</p>
          <ul>
            <li>Profildaten (Name, E-Mail, Körperdaten)</li>
            <li>Trainingspläne und Workouts</li>
            <li>Aktivitäts-Logs</li>
            <li>Hochgeladene Dateien</li>
          </ul>
          <p style="color: #666; font-size: 14px;">Diese E-Mail dient als Nachweis der Löschung gemäß DSGVO Art. 17.</p>
        </div>
        <div style="padding: 16px 24px; background: #000; color: #666; font-size: 12px; text-align: center;">
          <p>${COMPANY.name} | ${COMPANY.address}</p>
        </div>
      </div>
    `,
  }),

  export_ready: ({ email, name, data }) => ({
    subject: 'Ihr Datenexport ist bereit - Greenlight Fitness',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #000; padding: 24px; text-align: center;">
          <h1 style="color: #00FF00; margin: 0;">GREENLIGHT FITNESS</h1>
        </div>
        <div style="padding: 32px 24px; background: #f9f9f9;">
          <h2 style="color: #000;">Datenexport bereit 📦</h2>
          <p>Hallo ${name || 'Nutzer'},</p>
          <p>Ihr Datenexport gemäß DSGVO Art. 20 (Recht auf Datenportabilität) ist jetzt verfügbar.</p>
          <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0;"><strong>Format:</strong> JSON</p>
            <p style="margin: 8px 0 0;"><strong>Gültig bis:</strong> ${data?.expiresAt || '7 Tage'}</p>
          </div>
          <p>Sie können Ihren Export in der App unter <strong>Profil → Datenschutz-Einstellungen</strong> herunterladen.</p>
          <p style="color: #666; font-size: 14px;">Hinweis: Der Download-Link ist aus Sicherheitsgründen nur 7 Tage gültig.</p>
        </div>
        <div style="padding: 16px 24px; background: #000; color: #666; font-size: 12px; text-align: center;">
          <p>${COMPANY.name} | ${COMPANY.address}</p>
          <p><a href="mailto:${COMPANY.email}" style="color: #00FF00;">${COMPANY.email}</a></p>
        </div>
      </div>
    `,
  }),

  privacy_update: ({ email, name }) => ({
    subject: 'Aktualisierung unserer Datenschutzerklärung',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #000; padding: 24px; text-align: center;">
          <h1 style="color: #00FF00; margin: 0;">GREENLIGHT FITNESS</h1>
        </div>
        <div style="padding: 32px 24px; background: #f9f9f9;">
          <h2 style="color: #000;">Datenschutz-Update</h2>
          <p>Hallo ${name || 'Nutzer'},</p>
          <p>wir haben unsere Datenschutzerklärung aktualisiert, um Sie noch besser zu informieren.</p>
          <div style="background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="margin: 0;"><strong>Was ist neu?</strong></p>
            <ul style="margin: 8px 0 0; padding-left: 20px;">
              <li>Klarere Beschreibung der Datenverarbeitung</li>
              <li>Aktualisierte Drittanbieter-Liste</li>
              <li>Verbesserte DSGVO-Rechte-Übersicht</li>
            </ul>
          </div>
          <p>Die vollständige Datenschutzerklärung finden Sie in der App oder unter:</p>
          <p><a href="https://app.greenlight-fitness.de/legal/privacy" style="color: #00FF00;">Datenschutzerklärung lesen →</a></p>
        </div>
        <div style="padding: 16px 24px; background: #000; color: #666; font-size: 12px; text-align: center;">
          <p>${COMPANY.name} | ${COMPANY.address}</p>
          <p><a href="mailto:${COMPANY.email}" style="color: #00FF00;">${COMPANY.email}</a></p>
        </div>
      </div>
    `,
  }),

  account_created: ({ email, name }) => ({
    subject: 'Willkommen bei Greenlight Fitness',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <div style="background: #000; padding: 24px; text-align: center;">
          <h1 style="color: #00FF00; margin: 0;">GREENLIGHT FITNESS</h1>
        </div>
        <div style="padding: 32px 24px; background: #f9f9f9;">
          <h2 style="color: #000;">Willkommen im Team! 💪</h2>
          <p>Hallo ${name || 'Athlet'},</p>
          <p>Dein Account wurde erfolgreich erstellt.</p>
          <div style="background: #000; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="color: #fff; margin: 0 0 16px;">Du kannst jetzt:</p>
            <ul style="color: #fff; text-align: left; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Trainingspläne erstellen und verwalten</li>
              <li style="margin-bottom: 8px;">Übungen aus der Bibliothek nutzen</li>
              <li style="margin-bottom: 8px;">Deinen Fortschritt tracken</li>
            </ul>
          </div>
          <p style="color: #666; font-size: 14px;">
            <strong>Datenschutz:</strong> Mit der Registrierung hast du unserer 
            <a href="https://app.greenlight-fitness.de/legal/privacy" style="color: #00FF00;">Datenschutzerklärung</a> 
            und den <a href="https://app.greenlight-fitness.de/legal/terms" style="color: #00FF00;">AGB</a> zugestimmt.
          </p>
          <p>Stay hard,<br/>Dein Greenlight Team</p>
        </div>
        <div style="padding: 16px 24px; background: #000; color: #666; font-size: 12px; text-align: center;">
          <p>${COMPANY.name} | ${COMPANY.address}</p>
          <p>
            <a href="https://app.greenlight-fitness.de/legal/imprint" style="color: #666;">Impressum</a> | 
            <a href="https://app.greenlight-fitness.de/legal/privacy" style="color: #666;">Datenschutz</a>
          </p>
        </div>
      </div>
    `,
  }),
};

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: EmailRequest = await request.json();
    const { email, type, name, data } = body;

    if (!email || !type) {
      return new Response(JSON.stringify({ error: 'Missing email or type' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const template = templates[type];
    if (!template) {
      return new Response(JSON.stringify({ error: 'Invalid email type' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { subject, html } = template({ email, type, name, data });

    const { data: sendData, error } = await resend.emails.send({
      from: 'Greenlight Fitness <noreply@greenlight-fitness.de>',
      to: [email],
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, id: sendData?.id }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Email handler error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
