import { Resend } from 'resend';

// Initialize Resend with the Environment Variable
// DO NOT HARDCODE THE KEY HERE FOR PRODUCTION
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { email, name } = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'Greenlight Fitness <onboarding@resend.dev>', // Change this to your verify domain on Vercel/Resend later
      to: [email],
      subject: 'Willkommen bei Greenlight Fitness',
      html: `
        <div style="font-family: sans-serif; color: #121212;">
          <h1>Willkommen im Team, ${name || 'Athlet'}!</h1>
          <p>Dein Account wurde erfolgreich erstellt.</p>
          <p>Du kannst jetzt:</p>
          <ul>
            <li>Deine Trainingspläne verwalten</li>
            <li>Übungen aus der Bibliothek nutzen</li>
            <li>Deinen Fortschritt tracken</li>
          </ul>
          <br />
          <p>Stay hard,</p>
          <p>Dein Greenlight Team</p>
          <hr />
          <p style="font-size: 12px; color: #666;">
            Greenlight Fitness App<br />
            Musterstraße 1, 10115 Berlin<br />
            <a href="https://deine-app-url.vercel.app/legal/imprint">Impressum</a> | <a href="https://deine-app-url.vercel.app/legal/privacy">Datenschutz</a>
          </p>
        </div>
      `,
    });

    if (error) {
      return new Response(JSON.stringify({ error }), { status: 400 });
    }

    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}