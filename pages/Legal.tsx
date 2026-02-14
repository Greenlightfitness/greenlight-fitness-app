import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const COMPANY = {
  name: 'Greenlight Fitness GmbH',
  legalForm: 'Gesellschaft mit beschränkter Haftung (GmbH)',
  street: 'Musterstraße 11',
  zip: '10115',
  city: 'Berlin',
  country: 'Deutschland',
  phone: '+49 (0) 123 44 55 66',
  email: 'info@greenlight-fitness.de',
  privacyEmail: 'datenschutz@greenlight-fitness.de',
  supportEmail: 'support@greenlight-fitness.de',
  representative: 'Max Mustermann',
  register: 'Amtsgericht Charlottenburg, HRB 000000',
  vatId: 'DE000000000',
  website: 'https://greenlight-fitness.de',
  appUrl: 'https://app.greenlight-fitness.de',
};

const Legal: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const path = location.pathname;
  const isPrivacy = path.includes('privacy');
  const isTerms = path.includes('terms');
  const isTransparency = path.includes('transparency');

  const handleBack = () => {
    // If user is logged in, go back in history or to dashboard
    // If not logged in, go to login
    if (window.history.length > 2) {
      navigate(-1);
    } else if (user) {
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  const renderPrivacy = () => (
    <>
      <h1 className="text-3xl font-bold text-white mb-2">Datenschutzerklärung</h1>
      <p className="text-zinc-500 mb-8">Stand: Februar 2026 | Version 2.0 | Gültig ab: 01.02.2026</p>

      {/* §1 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">1. Datenschutz auf einen Blick</h2>
        <h3 className="text-lg font-semibold text-zinc-200 mb-2">Allgemeine Hinweise</h3>
        <p className="mb-4">Die folgenden Hinweise geben einen umfassenden Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie die Greenlight Fitness Plattform (nachfolgend „Plattform" oder „App") nutzen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können (Art. 4 Nr. 1 DSGVO).</p>
        <p className="mb-4">Diese Datenschutzerklärung informiert Sie gemäß Art. 13 und Art. 14 der Datenschutz-Grundverordnung (DSGVO), dem Bundesdatenschutzgesetz (BDSG), dem Telekommunikation-Telemedien-Datenschutz-Gesetz (TTDSG) sowie der Verordnung (EU) 2024/1689 (EU AI Act) über die Verarbeitung Ihrer Daten.</p>
        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="text-white font-semibold mb-2">Zusammenfassung der Kernpunkte:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Wir speichern nur Daten, die für den Betrieb der Plattform notwendig sind</li>
            <li>Gesundheitsdaten (Art. 9 DSGVO) werden nur mit Ihrer ausdrücklichen Einwilligung verarbeitet</li>
            <li>Wir verwenden <strong className="text-white">keine</strong> Tracking-Cookies oder Drittanbieter-Analysetools</li>
            <li>Sie können Ihre Daten jederzeit exportieren oder löschen lassen</li>
            <li>E-Mail-Benachrichtigungen können granular pro Typ abgewählt werden</li>
            <li>KI-Funktionen (Google Gemini) verarbeiten keine personenbezogenen Daten</li>
            <li>Datenübertragung in Drittländer erfolgt nur mit Standardvertragsklauseln (SCCs)</li>
          </ul>
        </div>
      </section>

      {/* §2 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">2. Verantwortliche Stelle</h2>
        <p className="mb-4">Verantwortlich für die Datenverarbeitung im Sinne der DSGVO ist:</p>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <p className="font-semibold text-white">{COMPANY.name}</p>
          <p>{COMPANY.street}</p>
          <p>{COMPANY.zip} {COMPANY.city}, {COMPANY.country}</p>
          <p className="mt-2">Vertreten durch: {COMPANY.representative} (Geschäftsführer)</p>
          <p className="mt-2">E-Mail: <a href={`mailto:${COMPANY.email}`} className="text-[#00FF00]">{COMPANY.email}</a></p>
          <p>Telefon: {COMPANY.phone}</p>
          <p>Handelsregister: {COMPANY.register}</p>
          <p>USt-IdNr.: {COMPANY.vatId}</p>
        </div>
      </section>

      {/* §3 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">3. Datenschutzbeauftragter</h2>
        <p className="mb-4">Für Fragen zum Datenschutz erreichen Sie unseren Datenschutzbeauftragten unter:</p>
        <div className="bg-zinc-900 p-4 rounded-xl">
          <p>E-Mail: <a href={`mailto:${COMPANY.privacyEmail}`} className="text-[#00FF00]">{COMPANY.privacyEmail}</a></p>
          <p>Post: {COMPANY.name}, z.Hd. Datenschutzbeauftragter, {COMPANY.street}, {COMPANY.zip} {COMPANY.city}</p>
        </div>
      </section>

      {/* §4 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">4. Ihre Rechte (DSGVO Art. 15–22)</h2>
        <p className="mb-4">Sie haben jederzeit folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
        <ul className="list-disc list-inside space-y-3 mb-4">
          <li><strong className="text-white">Auskunftsrecht (Art. 15 DSGVO)</strong>: Sie können jederzeit Auskunft darüber verlangen, welche personenbezogenen Daten wir über Sie speichern, zu welchem Zweck diese verarbeitet werden und an wen sie weitergegeben wurden. Wir stellen Ihnen auf Anfrage eine kostenlose Kopie Ihrer Daten zur Verfügung.</li>
          <li><strong className="text-white">Berichtigungsrecht (Art. 16 DSGVO)</strong>: Sie können die Berichtigung unrichtiger oder die Vervollständigung unvollständiger personenbezogener Daten verlangen.</li>
          <li><strong className="text-white">Löschungsrecht / Recht auf Vergessenwerden (Art. 17 DSGVO)</strong>: Sie können die Löschung Ihrer personenbezogenen Daten verlangen, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen. In der App können Sie dies direkt über Profil → Datenschutz-Einstellungen → Löschantrag veranlassen.</li>
          <li><strong className="text-white">Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</strong>: Sie können die Einschränkung der Verarbeitung Ihrer Daten verlangen, z.B. wenn Sie die Richtigkeit der Daten bestreiten.</li>
          <li><strong className="text-white">Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</strong>: Sie haben das Recht, die Sie betreffenden personenbezogenen Daten in einem strukturierten, gängigen und maschinenlesbaren Format (JSON) zu erhalten. In der App: Profil → Daten exportieren.</li>
          <li><strong className="text-white">Widerspruchsrecht (Art. 21 DSGVO)</strong>: Sie können jederzeit Widerspruch gegen die Verarbeitung Ihrer Daten einlegen, die auf Art. 6 Abs. 1 lit. e oder f DSGVO beruht. Dies betrifft insbesondere die Verarbeitung zu Direktwerbungszwecken.</li>
          <li><strong className="text-white">Recht auf Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO)</strong>: Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die Zukunft widerrufen. Die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt.</li>
          <li><strong className="text-white">Recht auf Beschwerde (Art. 77 DSGVO)</strong>: Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren (siehe Abschnitt 16).</li>
        </ul>
        <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 p-4 rounded-xl mb-4">
          <p className="text-[#00FF00] font-semibold mb-2">So üben Sie Ihre Rechte aus:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>In der App:</strong> Profil → Datenschutz-Einstellungen → Daten exportieren / Löschantrag</li>
            <li><strong>E-Mail-Einstellungen:</strong> Profil → Benachrichtigungen → Per-Typ An/Abwählen</li>
            <li><strong>One-Click Abmeldung:</strong> In jeder E-Mail unten „Alle E-Mails abbestellen"</li>
            <li><strong>Per E-Mail:</strong> <a href={`mailto:${COMPANY.privacyEmail}`} className="text-[#00FF00]">{COMPANY.privacyEmail}</a></li>
          </ul>
          <p className="text-sm mt-2">Wir beantworten Anfragen innerhalb von 30 Tagen (Art. 12 Abs. 3 DSGVO).</p>
        </div>
      </section>

      {/* §5 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">5. Welche Daten wir erheben</h2>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.1 Registrierungsdaten</h3>
        <ul className="list-disc list-inside mb-2">
          <li>E-Mail-Adresse (Pflichtfeld)</li>
          <li>Passwort (verschlüsselt mit bcrypt, nie im Klartext gespeichert)</li>
          <li>Nutzerolle (Athlet / Coach / Admin)</li>
          <li>Zeitstempel der Registrierung</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.2 Profildaten (freiwillig)</h3>
        <ul className="list-disc list-inside mb-2">
          <li>Vorname, Nachname, Nickname</li>
          <li>Profilbild (Upload in Supabase Storage)</li>
          <li>Geburtsdatum, Geschlecht</li>
          <li>Spracheinstellung</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch freiwillige Eingabe)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.3 Gesundheits- und Körperdaten (besondere Kategorien, Art. 9 DSGVO)</h3>
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-4">
          <p className="text-red-300 text-sm mb-2"><strong>Wichtiger Hinweis:</strong> Gesundheitsdaten gelten als besondere Kategorien personenbezogener Daten (Art. 9 Abs. 1 DSGVO). Diese Daten werden <strong>ausschließlich mit Ihrer ausdrücklichen Einwilligung</strong> (Art. 9 Abs. 2 lit. a DSGVO) verarbeitet, die Sie bei der Eingabe erteilen.</p>
        </div>
        <ul className="list-disc list-inside mb-2">
          <li>Körpergröße, Körpergewicht, Körperfettanteil</li>
          <li>Ruheherzfrequenz, maximale Herzfrequenz</li>
          <li>BMI (berechnet, nicht eingegeben)</li>
          <li>Zielgewicht, Trainingsziele</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 9 Abs. 2 lit. a DSGVO (ausdrückliche Einwilligung)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.4 Trainingsdaten</h3>
        <ul className="list-disc list-inside mb-2">
          <li>Trainingspläne (zugewiesene und selbst erstellte)</li>
          <li>Trainingseinheiten (Sessions) mit Übungen, Sätzen, Wiederholungen, Gewichten</li>
          <li>Trainings-Logs und Workout-Historie</li>
          <li>Personal Records (PRs)</li>
          <li>Fortschritte und Statistiken</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung — Kern der Dienstleistung)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.5 Check-In / Wellness-Daten</h3>
        <ul className="list-disc list-inside mb-2">
          <li>Tägliche Check-Ins: Stimmung, Energielevel, Schlafqualität (Skalenwerte 1–5)</li>
          <li>Stresslevel, Muskelkater, Ernährungsqualität</li>
          <li>Tagesgewicht (optional)</li>
          <li>Freitext-Notizen</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 9 Abs. 2 lit. a DSGVO (ausdrückliche Einwilligung, da Gesundheitsbezug)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.6 Kommunikationsdaten</h3>
        <ul className="list-disc list-inside mb-2">
          <li>Chat-Nachrichten zwischen Athlet und Coach (Ende-zu-Ende innerhalb Supabase)</li>
          <li>Coaching-Anfragen und deren Status</li>
          <li>Systembenachrichtigungen (automatische Nachrichten bei Aufmerksamkeits-Alerts)</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung — Coaching-Dienstleistung)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.7 Zahlungsdaten</h3>
        <ul className="list-disc list-inside mb-2">
          <li>Stripe Customer ID (anonymisiert)</li>
          <li>Abonnement-Status, Produktkäufe</li>
          <li>Rechnungsdaten (über Stripe verwaltet)</li>
        </ul>
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl mb-4">
          <p className="text-blue-300 text-sm"><strong>Hinweis:</strong> Kreditkartennummern, Bankdaten und andere sensible Zahlungsinformationen werden <strong>ausschließlich von Stripe</strong> (PCI DSS Level 1 zertifiziert) verarbeitet und niemals auf unseren Servern gespeichert.</p>
        </div>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.8 Technische Daten</h3>
        <ul className="list-disc list-inside mb-2">
          <li>IP-Adresse (in Server-Logs, automatisch nach 30 Tagen gelöscht)</li>
          <li>Browser-Typ und -Version, Betriebssystem</li>
          <li>Geräteinformationen (Bildschirmauflösung, Sprache)</li>
          <li>Zugriffszeitpunkte und Referrer-URLs</li>
          <li>Service-Worker-Registrierungen (für Push-Benachrichtigungen)</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse — Sicherheit und Funktionalität)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.9 Coach-spezifische Daten</h3>
        <p className="mb-2">Wenn Sie die Plattform als Coach nutzen, werden zusätzlich erhoben:</p>
        <ul className="list-disc list-inside mb-2">
          <li>Berufsbezeichnung, Biografie, Spezialisierungen, Erfahrung</li>
          <li>Profilbild (öffentlich sichtbar auf der Buchungsseite)</li>
          <li>Kontaktdaten: Telefonnummer, Website, Social-Media-Profile</li>
          <li>Persönlicher Buchungslink und Verfügbarkeitszeiten</li>
          <li>Terminbuchungen von Kunden (als gemeinsam Verantwortlicher)</li>
          <li>Coaching-Beziehungen und Athleten-Zuweisungen</li>
        </ul>
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl mb-4">
          <p className="text-blue-300 text-sm"><strong>Auftragsverarbeitung (Art. 28 DSGVO):</strong> Coaches agieren hinsichtlich der personenbezogenen Daten ihrer Athleten als Auftragsverarbeiter. Sie verpflichten sich, diese Daten ausschließlich im Rahmen des Coaching-Verhältnisses zu verarbeiten, vertraulich zu behandeln, angemessene Sicherheitsmaßnahmen zu treffen und nach Beendigung der Zusammenarbeit zu löschen oder zurückzugeben. Die Details regelt ein separater Auftragsverarbeitungsvertrag (AVV).</p>
        </div>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) + Art. 28 DSGVO (Auftragsverarbeitung)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.10 Admin-spezifische Datenverarbeitung</h3>
        <p className="mb-2">Administratoren haben erweiterten Zugriff auf:</p>
        <ul className="list-disc list-inside mb-2">
          <li>Nutzerverwaltung: Profile, Rollen, Zuweisungen, Kontostatus</li>
          <li>CRM-Daten: Coaching-Beziehungen, Käufe, zugewiesene Pläne</li>
          <li>Abrechnungsdaten: Stripe-Transaktionen, Rechnungen, Abonnements</li>
          <li>Audit-Logs und Systemprotokolle</li>
          <li>Business-KPIs: Umsatz, Churn-Rate, Conversion-Rates (aggregiert)</li>
          <li>Coach-Performance-Metriken: Retention-Rate, Athleten-Zufriedenheit (aggregiert)</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse — Plattformbetrieb und -sicherheit)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.11 Push-Benachrichtigungen</h3>
        <ul className="list-disc list-inside mb-2">
          <li>Push-Subscription-Endpoint (VAPID-basiert, Web Push Protocol)</li>
          <li>Verschlüsselungsschlüssel für die Push-Subscription</li>
          <li>Benachrichtigungs-Präferenzen (Push an/aus)</li>
        </ul>
        <p className="mb-2 text-sm">Die Aktivierung von Push-Benachrichtigungen erfordert eine explizite Bestätigung im Browser (Berechtigungsdialog). Sie können Push-Benachrichtigungen jederzeit in den Profileinstellungen oder über Ihre Browser-Einstellungen deaktivieren.</p>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung durch Browser-Permission-Dialog)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.12 E-Mail-Benachrichtigungen & Reattention</h3>
        <p className="mb-2">Wir versenden folgende Kategorien von E-Mails:</p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-2 text-white">Kategorie</th>
                <th className="text-left py-2 text-white">Beispiele</th>
                <th className="text-left py-2 text-white">Rechtsgrundlage</th>
                <th className="text-left py-2 text-white">Abwählbar?</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              <tr className="border-b border-zinc-800"><td className="py-2">Transaktional</td><td>Kaufbestätigung, Kündigung, Passwort-Reset</td><td>Art. 6(1)(b)</td><td className="text-red-400">Nein (gesetzlich)</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">Service</td><td>Coaching genehmigt, Plan zugewiesen</td><td>Art. 6(1)(b)</td><td className="text-red-400">Nein</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">Training</td><td>Training-Reminder, Check-In-Reminder</td><td>Art. 6(1)(f)</td><td className="text-[#00FF00]">Ja</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">Fortschritt</td><td>Wöchentlicher Report, Inaktivitäts-Alert</td><td>Art. 6(1)(f)</td><td className="text-[#00FF00]">Ja</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">Coach-Reports</td><td>Athleten-KPIs, Churn-Risk-Alerts</td><td>Art. 6(1)(b)/(f)</td><td className="text-[#00FF00]">Ja</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">Admin-Reports</td><td>Business-KPIs, Churn-Alerts</td><td>Art. 6(1)(f)</td><td className="text-[#00FF00]">Ja</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm mb-2">Jede abwählbare E-Mail kann in den <a href="/profile#notifications" className="text-[#00FF00]">Benachrichtigungs-Einstellungen</a> einzeln deaktiviert werden. Alternativ enthält jede E-Mail einen One-Click-Abmeldelink im Footer.</p>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse, mit Opt-out) bzw. Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung bei transaktionalen Mails)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.13 Benachrichtigungs-Präferenzen</h3>
        <ul className="list-disc list-inside mb-2">
          <li>Globaler E-Mail An/Aus-Status</li>
          <li>Globaler Push An/Aus-Status</li>
          <li>Einzelne Toggles pro Benachrichtigungstyp (siehe Tabelle oben)</li>
          <li>Bevorzugte Sendezeit (Stunde, Zeitzone)</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) + Art. 7 Abs. 3 DSGVO (jederzeitiger Widerruf)</p>
      </section>

      {/* §6 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">6. Rechtsgrundlagen der Verarbeitung (Übersicht)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-2 text-white">Rechtsgrundlage</th>
                <th className="text-left py-2 text-white">Anwendungsbereich</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              <tr className="border-b border-zinc-800"><td className="py-2 text-white">Art. 6(1)(a) — Einwilligung</td><td>Profildaten, Gesundheitsdaten, Push-Benachrichtigungen, KI-Funktionen, optionale E-Mails</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2 text-white">Art. 6(1)(b) — Vertragserfüllung</td><td>Registrierung, Training, Coaching, Zahlungen, Chat, transaktionale E-Mails</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2 text-white">Art. 6(1)(c) — Rechtliche Verpflichtung</td><td>Steuerliche Aufbewahrungspflichten, Handelsrechtliche Pflichten</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2 text-white">Art. 6(1)(f) — Berechtigtes Interesse</td><td>Technische Daten, Sicherheit, Admin-Funktionen, Reattention-Mails (mit Opt-out)</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2 text-white">Art. 9(2)(a) — Ausdrückliche Einwilligung</td><td>Gesundheitsdaten, Körperdaten, Wellness-Check-Ins</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* §7 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">7. Datenverarbeitung durch Dritte (Auftragsverarbeiter)</h2>
        <p className="mb-4">Wir setzen folgende Dienstleister ein, mit denen Auftragsverarbeitungsverträge (AVV) gem. Art. 28 DSGVO geschlossen wurden:</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">7.1 Supabase (Datenbank, Authentifizierung, Speicher)</h3>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <p><strong>Anbieter:</strong> Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992</p>
          <p><strong>Zweck:</strong> Datenbankspeicherung (PostgreSQL), Benutzer-Authentifizierung, Datei-Speicher (Profilbilder), Row Level Security</p>
          <p><strong>Verarbeitete Daten:</strong> Alle in Abschnitt 5 genannten Daten (verschlüsselt at-rest und in-transit)</p>
          <p><strong>Serverstandort:</strong> EU (Frankfurt) — soweit vom Kunden konfiguriert</p>
          <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO + Art. 28 DSGVO + Standardvertragsklauseln (SCCs)</p>
          <p className="mt-2"><a href="https://supabase.com/privacy" target="_blank" rel="noopener" className="text-[#00FF00]">→ Supabase Datenschutzerklärung</a></p>
        </div>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">7.2 Vercel (Hosting, Serverless Functions)</h3>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <p><strong>Anbieter:</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
          <p><strong>Zweck:</strong> Hosting der Webanwendung, Ausführung von API-Routen (Serverless Functions), CDN</p>
          <p><strong>Verarbeitete Daten:</strong> IP-Adressen, HTTP-Request-Daten, Zugriffs-Logs</p>
          <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO + Standardvertragsklauseln (SCCs) + EU-US Data Privacy Framework</p>
          <p className="mt-2"><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener" className="text-[#00FF00]">→ Vercel Datenschutzerklärung</a></p>
        </div>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">7.3 Stripe (Zahlungsabwicklung)</h3>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <p><strong>Anbieter:</strong> Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irland</p>
          <p><strong>Zweck:</strong> Zahlungsabwicklung, Abonnement-Verwaltung, Rechnungsstellung</p>
          <p><strong>Verarbeitete Daten:</strong> E-Mail-Adresse, Stripe Customer ID, Zahlungsdaten (von Stripe direkt verwaltet)</p>
          <p><strong>PCI DSS:</strong> Level 1 Service Provider — höchste Sicherheitsstufe</p>
          <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Zahlungsabwicklung)</p>
          <p className="mt-2"><a href="https://stripe.com/de/privacy" target="_blank" rel="noopener" className="text-[#00FF00]">→ Stripe Datenschutzerklärung</a></p>
        </div>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">7.4 Resend (E-Mail-Versand)</h3>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <p><strong>Anbieter:</strong> Resend Inc., San Francisco, CA, USA</p>
          <p><strong>Zweck:</strong> Versand von Transaktions- und Benachrichtigungs-E-Mails</p>
          <p><strong>Verarbeitete Daten:</strong> E-Mail-Adresse, Vorname (für Personalisierung), E-Mail-Betreff und -Inhalt</p>
          <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b/f DSGVO + Standardvertragsklauseln (SCCs)</p>
          <p className="mt-2"><a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener" className="text-[#00FF00]">→ Resend Datenschutzerklärung</a></p>
        </div>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">7.5 Google Gemini AI (KI-Unterstützung)</h3>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <p><strong>Anbieter:</strong> Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland</p>
          <p><strong>Zweck:</strong> KI-generierte Übungsbeschreibungen, Illustrationen, Trainingsvorschläge</p>
          <p><strong>Verarbeitete Daten:</strong> Übungsnamen und -beschreibungen — <strong>keine personenbezogenen Daten</strong></p>
          <p><strong>EU AI Act Risikokategorie:</strong> Minimales Risiko (keine Hochrisiko-Anwendung, keine biometrische Identifizierung)</p>
          <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung bei Nutzung der KI-Funktion)</p>
          <p className="mt-2 text-sm text-zinc-500">Weitere Details zur KI-Nutzung finden Sie in unserer <Link to="/legal/transparency" className="text-[#00FF00]">Transparenzerklärung</Link>.</p>
        </div>
      </section>

      {/* §8 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">8. Internationale Datenübermittlung</h2>
        <p className="mb-4">Einige unserer Auftragsverarbeiter haben ihren Sitz außerhalb der EU/des EWR. Die Datenübermittlung in diese Drittländer erfolgt auf Grundlage von:</p>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <li><strong className="text-white">Angemessenheitsbeschluss:</strong> Für Länder, für die die Europäische Kommission ein angemessenes Datenschutzniveau festgestellt hat</li>
          <li><strong className="text-white">Standardvertragsklauseln (SCCs):</strong> Gem. Art. 46 Abs. 2 lit. c DSGVO — von der EU-Kommission genehmigte Vertragsklauseln (Durchführungsbeschluss (EU) 2021/914)</li>
          <li><strong className="text-white">EU-US Data Privacy Framework:</strong> Für US-Unternehmen, die unter dem DPF zertifiziert sind (Angemessenheitsbeschluss der EU-Kommission vom 10.07.2023)</li>
        </ul>
        <p className="text-sm text-zinc-500">Kopien der Standardvertragsklauseln können Sie bei uns anfordern: {COMPANY.privacyEmail}</p>
      </section>

      {/* §9 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">9. Cookies, Local Storage & ähnliche Technologien</h2>
        <p className="mb-4">Wir verwenden gemäß § 25 TTDSG:</p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-2 text-white">Technologie</th>
                <th className="text-left py-2 text-white">Zweck</th>
                <th className="text-left py-2 text-white">Kategorie</th>
                <th className="text-left py-2 text-white">Speicherdauer</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              <tr className="border-b border-zinc-800"><td className="py-2">Supabase Auth Token</td><td>Authentifizierung (Login)</td><td>Technisch notwendig</td><td>Bis Logout</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">Spracheinstellung</td><td>Bevorzugte Anzeigesprache</td><td>Funktional</td><td>Unbegrenzt</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">SW Registration</td><td>Push-Benachrichtigungen</td><td>Funktional (Einwilligung)</td><td>Bis Deregistrierung</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">PWA Cache</td><td>Offline-Funktionalität</td><td>Technisch notwendig</td><td>Bis Cache-Invalidierung</td></tr>
            </tbody>
          </table>
        </div>
        <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 p-4 rounded-xl">
          <p className="text-[#00FF00] font-semibold">Keine Tracking-Cookies!</p>
          <p className="text-sm mt-1">Wir verwenden <strong>keine</strong> Tracking-Cookies, keine Drittanbieter-Analysetools (kein Google Analytics, kein Facebook Pixel, kein Matomo) und kein User-Fingerprinting. Ihr Nutzungsverhalten wird nicht zu Werbezwecken analysiert.</p>
        </div>
      </section>

      {/* §10 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">10. Automatisierte Entscheidungsfindung und Profiling</h2>
        <p className="mb-4">Gemäß Art. 22 DSGVO informieren wir Sie über automatisierte Verarbeitungsvorgänge:</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">10.1 Churn-Erkennung (Abwanderungsrisiko)</h3>
        <p className="mb-2">Unser System analysiert automatisch Aktivitätsmuster von Athleten (Tage seit letztem Check-In, Trainingserfüllung), um Coaches frühzeitig über mögliches Desengagement zu informieren.</p>
        <ul className="list-disc list-inside mb-2 text-sm">
          <li><strong className="text-white">Input-Daten:</strong> Datum des letzten Check-Ins, Trainingserfüllung (aggregiert)</li>
          <li><strong className="text-white">Output:</strong> Risikostufe (niedrig/mittel/hoch/kritisch) → E-Mail an Coach</li>
          <li><strong className="text-white">Konsequenz:</strong> Informativ — keine automatische Kündigung oder Einschränkung</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Dies stellt <strong>kein</strong> Profiling im Sinne von Art. 22 Abs. 1 DSGVO dar, da keine rechtsverbindliche oder ähnlich erheblich beeinträchtigende Entscheidung getroffen wird.</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">10.2 KPI-Berechnungen</h3>
        <p className="mb-2 text-sm">Für Coaches und Admins berechnen wir aggregierte Kennzahlen (Check-In-Rate, Trainingserfüllung, Churn-Rate). Diese dienen ausschließlich informativen Zwecken und haben keine automatisierten Konsequenzen für einzelne Nutzer.</p>

        <p className="text-sm mt-4">Weitere Details finden Sie in unserer <Link to="/legal/transparency" className="text-[#00FF00]">Transparenzerklärung</Link>.</p>
      </section>

      {/* §11 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">11. Speicherdauer und Löschung</h2>
        <p className="mb-4">Wir speichern Ihre Daten nur so lange, wie es für die jeweiligen Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-2 text-white">Datenkategorie</th>
                <th className="text-left py-2 text-white">Speicherdauer</th>
                <th className="text-left py-2 text-white">Grundlage</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              <tr className="border-b border-zinc-800"><td className="py-2">Account- und Profildaten</td><td>Bis zur Kontolöschung</td><td>Vertragserfüllung</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">Trainings- und Check-In-Daten</td><td>Bis zur Kontolöschung</td><td>Vertragserfüllung</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">Chat-Nachrichten</td><td>Bis zur Kontolöschung oder 1 Jahr nach Coaching-Ende</td><td>Vertragserfüllung</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">Zahlungsdaten (Stripe)</td><td>10 Jahre nach Transaktion</td><td>§ 147 AO, § 257 HGB</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">Einwilligungs-Logs</td><td>3 Jahre nach Widerruf</td><td>Nachweispflicht</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">Audit-Logs</td><td>1 Jahr</td><td>Berechtigtes Interesse (Sicherheit)</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">Benachrichtigungs-Logs</td><td>1 Jahr</td><td>Berechtigtes Interesse</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">Server-Logs (IP etc.)</td><td>30 Tage</td><td>Berechtigtes Interesse (Sicherheit)</td></tr>
              <tr className="border-b border-zinc-800"><td className="py-2">Gelöschte Konten (Backup)</td><td>30 Tage nach Löschung</td><td>Technische Notwendigkeit</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* §12 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">12. Datensicherheit (Art. 32 DSGVO)</h2>
        <p className="mb-4">Wir setzen folgende technische und organisatorische Maßnahmen (TOM) ein, um Ihre Daten gemäß dem Stand der Technik zu schützen:</p>
        <h3 className="text-lg font-semibold text-zinc-200 mb-2">Technische Maßnahmen</h3>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>SSL/TLS-Verschlüsselung (HTTPS) für alle Datenübertragungen</li>
          <li>Verschlüsselung ruhender Daten (AES-256 at-rest via Supabase)</li>
          <li>Passwort-Hashing mit bcrypt (Salted, Rounds ≥ 10)</li>
          <li>Row-Level-Security (RLS) in PostgreSQL — Nutzer sehen nur eigene Daten</li>
          <li>VAPID-basierte Push-Verschlüsselung (RFC 8291)</li>
          <li>Rate-Limiting auf API-Endpunkten (Schutz vor Brute-Force)</li>
          <li>Content Security Policy (CSP) Header</li>
          <li>Automatische Session-Invalidierung</li>
        </ul>
        <h3 className="text-lg font-semibold text-zinc-200 mb-2">Organisatorische Maßnahmen</h3>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>Zugangsbeschränkungen nach Least-Privilege-Prinzip</li>
          <li>Rollenbasierte Zugriffskontrolle (RBAC: Athlet, Coach, Admin)</li>
          <li>Audit-Logging aller sicherheitsrelevanten Aktionen</li>
          <li>Regelmäßige Sicherheitsüberprüfungen und Dependency-Updates</li>
          <li>Vertraulichkeitsvereinbarungen mit allen Mitarbeitern</li>
          <li>Incident-Response-Prozess gem. Art. 33/34 DSGVO (Meldung innerhalb 72h)</li>
        </ul>
      </section>

      {/* §13 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">13. Minderjährige</h2>
        <p className="mb-4">Die Nutzung der Plattform ist Personen ab 16 Jahren gestattet (Art. 8 DSGVO). Für Personen zwischen 16 und 18 Jahren ist die Einwilligung eines Erziehungsberechtigten erforderlich, sofern besondere Kategorien personenbezogener Daten (Gesundheitsdaten) verarbeitet werden.</p>
        <p className="text-sm">Personen unter 16 Jahren dürfen die Plattform nicht nutzen. Sollten wir Kenntnis davon erlangen, dass Daten von Personen unter 16 Jahren gespeichert wurden, werden diese unverzüglich gelöscht.</p>
      </section>

      {/* §14 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">14. Keine Weitergabe an Dritte zu Werbezwecken</h2>
        <p>Wir verkaufen, vermieten oder tauschen Ihre personenbezogenen Daten <strong className="text-white">nicht</strong> an oder mit Dritten zu Werbezwecken. Eine Weitergabe erfolgt ausschließlich an die in Abschnitt 7 genannten Auftragsverarbeiter und nur im für die Dienstleistung erforderlichen Umfang.</p>
      </section>

      {/* §15 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">15. Datenschutz-Folgenabschätzung (DSFA)</h2>
        <p className="mb-2">Für die Verarbeitung besonderer Kategorien personenbezogener Daten (Gesundheitsdaten, Art. 9 DSGVO) haben wir eine Datenschutz-Folgenabschätzung gemäß Art. 35 DSGVO durchgeführt. Diese kommt zu dem Ergebnis, dass die Risiken für die Rechte und Freiheiten der betroffenen Personen durch die implementierten technischen und organisatorischen Maßnahmen (Abschnitt 12) auf ein angemessenes Niveau reduziert werden.</p>
      </section>

      {/* §16 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">16. Beschwerderecht bei der Aufsichtsbehörde</h2>
        <p className="mb-4">Gemäß Art. 77 DSGVO haben Sie das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, wenn Sie der Ansicht sind, dass die Verarbeitung Ihrer Daten gegen die DSGVO verstößt. Die für uns zuständige Aufsichtsbehörde ist:</p>
        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="font-semibold text-white">Berliner Beauftragte für Datenschutz und Informationsfreiheit</p>
          <p>Friedrichstr. 219, 10969 Berlin</p>
          <p>Telefon: +49 30 13889-0</p>
          <p>E-Mail: mailbox@datenschutz-berlin.de</p>
          <p className="mt-2"><a href="https://www.datenschutz-berlin.de" target="_blank" rel="noopener" className="text-[#00FF00]">→ www.datenschutz-berlin.de</a></p>
        </div>
      </section>

      {/* §17 */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">17. Änderungen dieser Datenschutzerklärung</h2>
        <p className="mb-2">Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie stets den aktuellen rechtlichen Anforderungen anzupassen oder um Änderungen unserer Leistungen in der Datenschutzerklärung umzusetzen.</p>
        <p className="mb-2">Bei wesentlichen Änderungen informieren wir Sie per E-Mail mindestens 30 Tage vor Inkrafttreten. Die aktuelle Version ist stets auf dieser Seite verfügbar.</p>
        <p className="text-sm text-zinc-500">Letzte Aktualisierung: Februar 2026</p>
      </section>
    </>
  );

  const renderTerms = () => (
    <>
      <h1 className="text-3xl font-bold text-white mb-2">Allgemeine Geschäftsbedingungen (AGB)</h1>
      <p className="text-zinc-500 mb-8">Stand: Februar 2026 | Version 2.0 | Gültig ab: 01.02.2026</p>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 1 Geltungsbereich</h2>
        <p className="mb-2">(1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") gelten für die Nutzung der Greenlight Fitness Plattform (nachfolgend „Plattform" oder „App"), bereitgestellt von {COMPANY.name}, {COMPANY.street}, {COMPANY.zip} {COMPANY.city} (nachfolgend „Anbieter", „wir" oder „uns").</p>
        <p className="mb-2">(2) Die AGB gelten für alle Nutzer der Plattform, unabhängig davon, ob sie die Plattform als Athlet, Coach oder Administrator nutzen.</p>
        <p className="mb-2">(3) Abweichende Bedingungen des Nutzers werden nicht anerkannt, es sei denn, wir stimmen ihrer Geltung ausdrücklich schriftlich zu.</p>
        <p>(4) Ergänzend gelten unsere <Link to="/legal/privacy" className="text-[#00FF00]">Datenschutzerklärung</Link> und <Link to="/legal/transparency" className="text-[#00FF00]">Transparenzerklärung</Link>.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 2 Vertragsschluss und Registrierung</h2>
        <p className="mb-2">(1) Mit der erfolgreichen Registrierung kommt ein Nutzungsvertrag zwischen dem Nutzer und dem Anbieter zustande. Die Registrierung erfolgt über eine E-Mail-Adresse und ein Passwort.</p>
        <p className="mb-2">(2) Die Registrierung ist nur natürlichen Personen ab 16 Jahren gestattet. Personen zwischen 16 und 18 Jahren benötigen die Zustimmung eines Erziehungsberechtigten.</p>
        <p className="mb-2">(3) Der Nutzer versichert, bei der Registrierung wahrheitsgemäße und vollständige Angaben zu machen und diese aktuell zu halten.</p>
        <p className="mb-2">(4) Jeder Nutzer darf nur ein Konto erstellen. Die Erstellung mehrerer Konten ist untersagt.</p>
        <p>(5) Wir behalten uns vor, Registrierungen ohne Angabe von Gründen abzulehnen.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 3 Leistungsbeschreibung</h2>
        <p className="mb-2">(1) {COMPANY.name} betreibt eine webbasierte Plattform (Progressive Web App) für Fitness-Coaching, Trainingsplanung und Fortschrittstracking.</p>
        <p className="mb-2">(2) Die Plattform bietet folgende Kernfunktionen:</p>
        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
          <li>Erstellung und Verwaltung von Trainingsplänen</li>
          <li>Übungsdatenbank mit KI-generierten Beschreibungen</li>
          <li>Tägliche Wellness-Check-Ins mit Stimmungs- und Gesundheitstracking</li>
          <li>Workout-Logging und Fortschrittsverfolgung</li>
          <li>Coach-Athleten-Matching und Chat-Kommunikation</li>
          <li>Terminbuchung und Kalender-Management</li>
          <li>Shop für Trainingspläne und Coaching-Pakete</li>
          <li>Automatisierte Benachrichtigungen (E-Mail und Push)</li>
          <li>Datenexport und Datenschutz-Management</li>
        </ul>
        <p className="mb-2">(3) Die Basis-Funktionen sind kostenlos nutzbar. Erweiterte Funktionen, Trainingspläne und Coaching-Pakete können kostenpflichtig sein und werden im Shop transparent ausgewiesen.</p>
        <p>(4) Wir bemühen uns um eine hohe Verfügbarkeit der Plattform, schulden jedoch keine bestimmte Verfügbarkeit (siehe § 13).</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 4 Nutzerrollen</h2>
        <p className="mb-4">Die Plattform unterscheidet drei Nutzerrollen mit unterschiedlichem Funktionsumfang:</p>
        <h3 className="text-lg font-semibold text-zinc-200 mb-2">4.1 Athlet</h3>
        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
          <li>Nutzung zugewiesener Trainingspläne und Eigenerstellung</li>
          <li>Tägliche Wellness-Check-Ins</li>
          <li>Workout-Logging, Fortschrittstracking, Workout-Historie</li>
          <li>Chat-Kommunikation mit zugewiesenem Coach</li>
          <li>Kauf von Produkten im Shop</li>
          <li>Profilbearbeitung und Datenschutz-Einstellungen</li>
        </ul>
        <h3 className="text-lg font-semibold text-zinc-200 mb-2">4.2 Coach</h3>
        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
          <li>Alle Athleten-Funktionen</li>
          <li>Erstellung und Zuweisung von Trainingsplänen an Athleten</li>
          <li>Übungsdatenbank-Verwaltung (eigene und System-Übungen)</li>
          <li>Athleten-Betreuung und -Monitoring (Check-In-Daten, Trainingserfüllung)</li>
          <li>Chat mit zugewiesenen Athleten</li>
          <li>Öffentliches Coaching-Profil und Buchungsseite</li>
          <li>Terminverwaltung und Kalender-Management</li>
          <li>CRM-Zugriff auf eigene Athleten</li>
        </ul>
        <h3 className="text-lg font-semibold text-zinc-200 mb-2">4.3 Administrator</h3>
        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
          <li>Alle Coach-Funktionen</li>
          <li>Nutzerverwaltung (Rollen, Zuweisungen, Sperrungen)</li>
          <li>Produktmanagement und Preisgestaltung</li>
          <li>CRM mit Zugriff auf alle Nutzerprofile</li>
          <li>Business-KPIs und Reporting (Umsatz, Churn-Rate, Conversion)</li>
          <li>Coach-Performance-Auswertung</li>
          <li>Abrechnungsübersicht (Stripe-Integration)</li>
          <li>Einladungs-Management</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 5 Besondere Bedingungen für Coaches</h2>
        <p className="mb-2">(1) Coaches erstellen im Rahmen des Onboardings ein öffentliches Profil mit Berufsbezeichnung, Biografie, Spezialisierungen und Profilbild. Dieses Profil ist über eine öffentliche Buchungsseite erreichbar.</p>
        <p className="mb-2">(2) Der Coach ist allein verantwortlich für die Richtigkeit seiner Profilangaben, insbesondere hinsichtlich Qualifikationen, Zertifizierungen und Spezialisierungen. Die Angabe irreführender oder falscher Qualifikationen ist untersagt und kann zum sofortigen Ausschluss führen.</p>
        <p className="mb-2">(3) Coaches erhalten einen persönlichen Buchungslink. Der Coach ist für die korrekte Pflege seiner Verfügbarkeitszeiten und die Einhaltung gebuchter Termine verantwortlich.</p>
        <p className="mb-2">(4) Coaches verarbeiten im Rahmen ihrer Tätigkeit personenbezogene Daten von Athleten (Gesundheitsdaten, Trainingsdaten, Kommunikation). Sie verpflichten sich:</p>
        <ul className="list-disc list-inside ml-4 space-y-1 mb-2">
          <li>zur vertraulichen Behandlung aller Athletendaten gem. DSGVO Art. 28</li>
          <li>Daten ausschließlich im Rahmen des Coaching-Verhältnisses zu verarbeiten</li>
          <li>angemessene Sicherheitsmaßnahmen zu treffen</li>
          <li>nach Beendigung der Zusammenarbeit Athletendaten nicht weiterzuverwenden</li>
        </ul>
        <p className="mb-2">(5) Die Coaching-Beziehung zwischen Coach und Athlet basiert auf gegenseitigem Einverständnis. Beide Seiten können die Zusammenarbeit jederzeit über die Plattform beenden.</p>
        <p>(6) Der Coach ist kein Angestellter des Anbieters. Das Coaching-Verhältnis besteht direkt zwischen Coach und Athlet. Der Anbieter stellt lediglich die technische Infrastruktur bereit.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 6 Besondere Bedingungen für Administratoren</h2>
        <p className="mb-2">(1) Administratoren haben erweiterten Zugriff auf alle Plattformfunktionen, einschließlich Nutzerverwaltung, Abrechnungsdaten, CRM und Systemkonfiguration.</p>
        <p className="mb-2">(2) Mit dem erweiterten Zugriff geht eine besondere Sorgfaltspflicht einher. Administratoren verpflichten sich, Nutzerdaten ausschließlich im Rahmen des berechtigten Plattformbetriebs zu verarbeiten und die Grundsätze der Datenminimierung zu beachten.</p>
        <p className="mb-2">(3) Der Missbrauch von Admin-Berechtigungen, insbesondere unbefugte Datenweitergabe an Dritte, unbefugte Rollenänderungen oder Manipulation von Abrechnungsdaten, führt zum sofortigen Entzug der Admin-Rolle und berechtigt zur fristlosen Kündigung. Schadensersatzansprüche bleiben vorbehalten.</p>
        <p>(4) Alle administrativen Aktionen werden in Audit-Logs protokolliert.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 6a Besondere Bedingungen für 1:1 Coaching</h2>
        <p className="mb-2">(1) 1:1 Coaching-Produkte umfassen die persönliche Betreuung eines Athleten durch einen zugewiesenen Coach. Der Leistungsumfang (Anzahl Sessions pro Woche, Coaching-Dauer, enthaltene Leistungen) ergibt sich aus der jeweiligen Produktbeschreibung im Shop.</p>
        <p className="mb-2">(2) Nach dem Kauf eines 1:1 Coaching-Produkts wird dem Athleten innerhalb von 24 Stunden ein persönlicher Coach zugewiesen. Der Athlet erhält eine Benachrichtigung über die Zuweisung.</p>
        <p className="mb-2">(3) Der Athlet wird aufgefordert, einen Intake-Fragebogen auszufüllen, sofern dies für das gekaufte Produkt vorgesehen ist. Der Fragebogen dient der Erfassung relevanter Informationen (Trainingserfahrung, Verletzungen, Ziele, verfügbare Trainingszeiten, Übungsvorlieben) zur Erstellung eines individuellen Trainingsplans.</p>
        <p className="mb-2">(4) Der Coach erstellt auf Basis des Intake-Fragebogens und in Abstimmung mit dem Athleten einen maßgeschneiderten Trainingsplan. Anpassungen des Plans erfolgen im Rahmen der regelmäßigen Coaching-Betreuung.</p>
        <p className="mb-2">(5) Die Kommunikation zwischen Coach und Athlet erfolgt über die plattformeigene Chat-Funktion. Coaches sind nicht verpflichtet, außerhalb der Plattform erreichbar zu sein.</p>
        <p className="mb-2">(6) Das Coaching-Verhältnis kann von beiden Seiten jederzeit beendet werden. Bei Abonnements gelten die Kündigungsfristen gem. § 7 Abs. 4. Eine vorzeitige Kündigung durch den Athleten begründet keinen anteiligen Erstattungsanspruch für die laufende Abrechnungsperiode, es sei denn, es liegt ein wichtiger Grund vor.</p>
        <p className="mb-2">(7) Der Anbieter garantiert nicht den Erfolg bestimmter Trainingsziele. Die Erreichung von Fitnesszielen hängt von zahlreichen Faktoren ab, die außerhalb des Einflussbereichs des Coaches liegen (Ernährung, Schlaf, Konsistenz, individuelle Voraussetzungen).</p>
        <p>(8) Coaching-Notizen, Intake-Daten und trainingsrelevante Informationen werden vertraulich behandelt und unterliegen den Regelungen der Datenschutzerklärung (Art. 9 DSGVO für Gesundheitsdaten).</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 6b Kaufbestätigung und Vertragsbestätigung (§312i BGB)</h2>
        <p className="mb-2">(1) Nach jedem erfolgreichen Kauf (Trainingsplan, Coaching-Paket, Abonnement) erhält der Nutzer unverzüglich eine elektronische Kaufbestätigung mit einer eindeutigen Bestätigungsnummer, den wesentlichen Vertragsbestandteilen (Produktbezeichnung, Preis, Zahlungsintervall) und dem Datum des Vertragsschlusses.</p>
        <p className="mb-2">(2) Die Kaufbestätigung wird in der App dauerhaft unter „Meine Käufe" abrufbar gespeichert und kann als Nachweis des Vertragsschlusses herangezogen werden.</p>
        <p className="mb-2">(3) Bei 1:1 Coaching-Produkten enthält die Kaufbestätigung zusätzlich eine Checkliste der nächsten Schritte (Coach-Zuordnung, Intake-Fragebogen, Planungsbeginn) sowie den Hinweis auf die 24-Stunden-Frist für die Coach-Zuweisung.</p>
        <p>(4) Der Nutzer wird auf sein Widerrufsrecht (§ 8), die geltenden AGB und die Datenschutzerklärung hingewiesen.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 7 Zahlungen und Abonnements</h2>
        <p className="mb-2">(1) Kostenpflichtige Leistungen (Trainingspläne, Coaching-Pakete, Abonnements) werden über den integrierten Shop angeboten. Preise werden inkl. gesetzlicher MwSt. angezeigt.</p>
        <p className="mb-2">(2) Die Zahlungsabwicklung erfolgt über Stripe Payments Europe, Ltd. Der Nutzer akzeptiert mit Nutzung des Zahlungsdienstes die <a href="https://stripe.com/de/legal" target="_blank" rel="noopener" className="text-[#00FF00]">Stripe Nutzungsbedingungen</a>.</p>
        <p className="mb-2">(3) Abonnements verlängern sich automatisch um die vereinbarte Laufzeit, sofern sie nicht vor Ablauf der aktuellen Periode gekündigt werden.</p>
        <p className="mb-2">(4) Die Kündigung eines Abonnements ist jederzeit zum Ende der aktuellen Abrechnungsperiode möglich über: Profil → Mitgliedschaft → Kündigen, oder über das Stripe Kundenportal.</p>
        <p className="mb-2">(5) Bei fehlgeschlagenen Zahlungen wird der Nutzer per E-Mail benachrichtigt. Nach drei fehlgeschlagenen Zahlungsversuchen kann der Zugang zu Premium-Funktionen eingeschränkt werden.</p>
        <p>(6) Bereits bezahlte Leistungen werden bis zum Ende der Abrechnungsperiode bereitgestellt.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 8 Widerrufsrecht für Verbraucher</h2>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <p className="text-white font-bold mb-2">Widerrufsbelehrung</p>
          <p className="mb-2"><strong className="text-white">Widerrufsrecht:</strong> Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.</p>
          <p className="mb-2">Um Ihr Widerrufsrecht auszuüben, müssen Sie uns ({COMPANY.name}, {COMPANY.street}, {COMPANY.zip} {COMPANY.city}, E-Mail: {COMPANY.email}) mittels einer eindeutigen Erklärung (z.B. per E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.</p>
          <p className="mb-2"><strong className="text-white">Folgen des Widerrufs:</strong> Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen zurückzuzahlen.</p>
          <p><strong className="text-white">Vorzeitiges Erlöschen:</strong> Das Widerrufsrecht erlischt bei digitalen Inhalten vorzeitig, wenn die Ausführung mit ausdrücklicher Zustimmung des Verbrauchers begonnen hat und dieser bestätigt hat, dass er von dem vorzeitigen Erlöschen seines Widerrufsrechts Kenntnis hat (§ 356 Abs. 5 BGB).</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 9 Preisänderungen</h2>
        <p className="mb-2">(1) Preisänderungen für bestehende Abonnements werden mindestens 30 Tage vor Inkrafttreten per E-Mail angekündigt.</p>
        <p className="mb-2">(2) Bei Preiserhöhungen hat der Nutzer das Recht, das Abonnement vor Inkrafttreten der Erhöhung zum Ende der aktuellen Abrechnungsperiode zu kündigen.</p>
        <p>(3) Wird nicht gekündigt, gilt die Preisänderung als akzeptiert.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 10 Nutzerrechte und -pflichten</h2>
        <p className="mb-2">(1) Der Nutzer erhält ein einfaches, nicht übertragbares, nicht unterlizenzierbares Nutzungsrecht an der Plattform für die Dauer des Vertragsverhältnisses.</p>
        <p className="mb-2">(2) Der Nutzer ist für die Geheimhaltung seiner Zugangsdaten (E-Mail, Passwort) allein verantwortlich. Bei Verdacht auf unbefugten Zugriff ist das Passwort unverzüglich zu ändern und der Anbieter zu informieren.</p>
        <p className="mb-2">(3) Der Nutzer verpflichtet sich, die Plattform nur für den bestimmungsgemäßen Zweck zu nutzen und keine rechtswidrigen Inhalte hochzuladen oder zu verbreiten.</p>
        <p>(4) Der Nutzer ist für die Richtigkeit seiner Angaben verantwortlich, insbesondere bei Gesundheitsdaten, die für die Trainingsplanung relevant sein können.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 11 Verbotene Nutzung</h2>
        <p className="mb-2">Folgende Handlungen sind untersagt:</p>
        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
          <li>Missbrauch der Plattform für rechtswidrige Zwecke</li>
          <li>Verbreitung von beleidigenden, diskriminierenden oder gewaltverherrlichenden Inhalten</li>
          <li>Automatisierte Zugriffe (Scraping, Bots) ohne ausdrückliche Genehmigung</li>
          <li>Weitergabe von Athleten- oder Nutzerdaten an Dritte ohne Einwilligung</li>
          <li>Reverse Engineering, Dekompilierung oder Disassemblierung der Software</li>
          <li>Umgehung von Sicherheitsmaßnahmen oder Zugriffsbeschränkungen</li>
          <li>Impersonation anderer Nutzer oder Vortäuschung falscher Identitäten</li>
          <li>Spam, Phishing oder andere unerwünschte Kommunikation über die Chat-Funktion</li>
          <li>Upload von Schadsoftware oder schädlichen Inhalten</li>
        </ul>
        <p>Verstöße können zur sofortigen Sperrung des Kontos, fristlosen Kündigung und ggf. zur Erstattung von Strafanzeigen führen.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 12 Geistiges Eigentum</h2>
        <p className="mb-2">(1) Die Plattform, einschließlich Design, Code, Texte, Grafiken und Logo, ist urheberrechtlich geschützt und Eigentum des Anbieters.</p>
        <p className="mb-2">(2) System-Übungen und deren KI-generierte Beschreibungen und Illustrationen sind Eigentum des Anbieters.</p>
        <p className="mb-2">(3) Von Coaches erstellte Trainingspläne und Übungen bleiben geistiges Eigentum des jeweiligen Coaches. Der Coach räumt dem Anbieter ein einfaches Nutzungsrecht ein, soweit es für die Bereitstellung der Plattform erforderlich ist.</p>
        <p>(4) Athleten behalten die Rechte an ihren eigenen Eingaben (Check-Ins, Notizen, selbst erstellte Pläne).</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 13 Verfügbarkeit der Plattform</h2>
        <p className="mb-2">(1) Wir bemühen uns um eine Verfügbarkeit der Plattform von 99% im Jahresmittel. Geplante Wartungsarbeiten werden nach Möglichkeit vorab angekündigt.</p>
        <p className="mb-2">(2) Nicht als Ausfallzeiten gelten: geplante Wartungsarbeiten, Störungen bei Drittanbietern (Supabase, Vercel, Stripe), höhere Gewalt.</p>
        <p>(3) Schadensersatzansprüche aufgrund von Ausfallzeiten bestehen nur bei Vorsatz oder grober Fahrlässigkeit.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 14 Gesundheitshinweis und Haftungsausschluss</h2>
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-4">
          <p className="text-red-300 font-bold mb-2">Wichtiger Gesundheitshinweis</p>
          <p className="text-red-300 text-sm">(1) Die Plattform und die darüber angebotenen Trainingspläne ersetzen <strong>keine</strong> ärztliche Beratung, Diagnose oder Behandlung. Vor Beginn eines Trainingsprogramms sollten Sie Ihren Arzt konsultieren, insbesondere bei bestehenden Vorerkrankungen.</p>
        </div>
        <p className="mb-2">(2) Coaches auf der Plattform sind in der Regel keine Ärzte oder Therapeuten. Ihre Beratung stellt keine medizinische Leistung dar.</p>
        <p className="mb-2">(3) Die Nutzung von Trainingsplänen und die Durchführung von Übungen erfolgt auf eigenes Risiko des Nutzers.</p>
        <p>(4) Der Anbieter übernimmt keine Haftung für Gesundheitsschäden, die aus der Nutzung der Plattform oder der Befolgung von Trainingsplänen resultieren, soweit dies gesetzlich zulässig ist.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 15 Haftungsbeschränkung</h2>
        <p className="mb-2">(1) Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei der Verletzung von Leben, Körper und Gesundheit.</p>
        <p className="mb-2">(2) Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten). Die Haftung ist dabei auf den vertragstypisch vorhersehbaren Schaden begrenzt.</p>
        <p className="mb-2">(3) Die vorstehenden Haftungsbeschränkungen gelten nicht für Ansprüche nach dem Produkthaftungsgesetz (ProdHaftG) oder bei arglistig verschwiegenen Mängeln.</p>
        <p>(4) Die Haftung für den Verlust von Daten ist auf den typischen Wiederherstellungsaufwand beschränkt, der bei regelmäßiger und gefahrentsprechender Anfertigung von Sicherungskopien eingetreten wäre. Die Plattform bietet eine Datenexport-Funktion.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 16 Benachrichtigungen und E-Mail-Kommunikation</h2>
        <p className="mb-2">(1) Mit der Registrierung erklärt sich der Nutzer einverstanden, transaktionale E-Mails zu erhalten (Kaufbestätigungen, Sicherheitshinweise, Passwort-Reset). Diese sind für den Betrieb notwendig und nicht abwählbar.</p>
        <p className="mb-2">(2) Zusätzliche Benachrichtigungen (Trainings-Erinnerungen, Wochen-Reports, Churn-Alerts) können jederzeit einzeln in den Benachrichtigungs-Einstellungen oder per One-Click-Abmeldelink in der E-Mail deaktiviert werden (Art. 7 Abs. 3 DSGVO).</p>
        <p>(3) Push-Benachrichtigungen erfordern eine explizite Browser-Berechtigung und können jederzeit deaktiviert werden.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 17 Datenschutz</h2>
        <p className="mb-2">(1) Der Schutz Ihrer personenbezogenen Daten ist uns wichtig. Einzelheiten zur Datenverarbeitung finden Sie in unserer <Link to="/legal/privacy" className="text-[#00FF00]">Datenschutzerklärung</Link>.</p>
        <p className="mb-2">(2) Informationen zur Nutzung automatisierter Systeme und KI finden Sie in unserer <Link to="/legal/transparency" className="text-[#00FF00]">Transparenzerklärung</Link>.</p>
        <p>(3) Beide Dokumente sind Bestandteil dieser AGB.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 18 Kündigung und Kontolöschung</h2>
        <p className="mb-2">(1) Der Nutzer kann seinen Account jederzeit und ohne Angabe von Gründen löschen. Die Löschung erfolgt über: Profil → Datenschutz-Einstellungen → Löschantrag, oder per E-Mail an {COMPANY.privacyEmail}.</p>
        <p className="mb-2">(2) Kostenpflichtige Abonnements müssen separat vor der Kontolöschung gekündigt werden. Eine Kontolöschung führt nicht automatisch zur Kündigung laufender Abonnements bei Stripe.</p>
        <p className="mb-2">(3) Der Anbieter kann den Nutzungsvertrag bei Verstoß gegen diese AGB (insbesondere § 11) fristlos kündigen.</p>
        <p className="mb-2">(4) Nach Kündigung/Löschung werden alle personenbezogenen Daten gemäß der Datenschutzerklärung gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten bestehen.</p>
        <p>(5) Im Falle der Kontolöschung eines Coaches werden alle aktiven Coaching-Beziehungen beendet und die Athleten benachrichtigt.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 19 Änderungen der AGB</h2>
        <p className="mb-2">(1) Wir behalten uns vor, diese AGB mit angemessener Ankündigungsfrist zu ändern. Änderungen werden mindestens 30 Tage vor Inkrafttreten per E-Mail an die hinterlegte E-Mail-Adresse angekündigt.</p>
        <p className="mb-2">(2) Widerspricht der Nutzer den geänderten AGB nicht innerhalb von vier Wochen nach Zugang der Mitteilung, gelten die geänderten AGB als angenommen.</p>
        <p>(3) Auf das Widerspruchsrecht und die Folgen des Schweigens wird in der Mitteilung gesondert hingewiesen. Bei Widerspruch kann der Vertrag zum Zeitpunkt des Inkrafttretens der Änderung gekündigt werden.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 20 Streitbeilegung</h2>
        <p className="mb-2">(1) Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener" className="text-[#00FF00]">https://ec.europa.eu/consumers/odr/</a></p>
        <p className="mb-2">(2) Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).</p>
        <p>(3) Bei Fragen oder Beschwerden wenden Sie sich bitte zunächst an: <a href={`mailto:${COMPANY.supportEmail}`} className="text-[#00FF00]">{COMPANY.supportEmail}</a></p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 21 Schlussbestimmungen</h2>
        <p className="mb-2">(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG). Bei Verbrauchern gelten zwingende Verbraucherschutzvorschriften des Aufenthaltsstaates vorrangig.</p>
        <p className="mb-2">(2) Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesen AGB ist Berlin, soweit der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist oder keinen allgemeinen Gerichtsstand in Deutschland hat.</p>
        <p className="mb-2">(3) Sollten einzelne Bestimmungen dieser AGB ganz oder teilweise unwirksam sein oder werden, so bleibt die Wirksamkeit der übrigen Bestimmungen hiervon unberührt (Salvatorische Klausel). An die Stelle der unwirksamen Bestimmung tritt die gesetzliche Regelung.</p>
        <p>(4) Die Vertragssprache ist Deutsch. Bei Übersetzungen ist die deutsche Fassung maßgeblich.</p>
      </section>
    </>
  );

  const renderTransparency = () => (
    <>
      <h1 className="text-3xl font-bold text-white mb-2">Transparenzerklärung</h1>
      <p className="text-zinc-500 mb-4">Gemäß Verordnung (EU) 2024/1689 (EU AI Act), DSGVO Art. 13/14/22</p>
      <p className="text-zinc-500 mb-8">Stand: Februar 2026 | Version 1.0</p>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">1. Zweck dieser Erklärung</h2>
        <p className="mb-4">Diese Transparenzerklärung informiert Sie gemäß der Verordnung (EU) 2024/1689 über Künstliche Intelligenz (EU AI Act) und den Artikeln 13, 14 und 22 der DSGVO über den Einsatz automatisierter Systeme und KI-Technologien auf der Greenlight Fitness Plattform.</p>
        <p className="mb-4">Wir verpflichten uns zu vollständiger Transparenz darüber, wo und wie automatisierte Verarbeitung, algorithmische Systeme und KI-Modelle in unserer Plattform zum Einsatz kommen, welche Daten dabei verarbeitet werden und welche Rechte Sie als Nutzer haben.</p>
        <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 p-4 rounded-xl">
          <p className="text-[#00FF00] font-semibold mb-2">Unsere Grundsätze für KI und Automatisierung:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Transparenz:</strong> Wir informieren klar über jeden Einsatz automatisierter Systeme</li>
            <li><strong>Menschliche Aufsicht:</strong> Automatisierte Systeme unterstützen, ersetzen aber nicht menschliche Entscheidungen</li>
            <li><strong>Keine Diskriminierung:</strong> Unsere Algorithmen sind frei von diskriminierenden Kriterien</li>
            <li><strong>Datenminimierung:</strong> KI-Systeme verarbeiten nur die minimal notwendigen Daten</li>
            <li><strong>Datensouveränität:</strong> Nutzer behalten die volle Kontrolle über ihre Daten</li>
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">2. Eingesetzte KI-Systeme</h2>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">2.1 Google Gemini AI — Übungsgenerierung</h3>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="text-zinc-400">
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white w-1/3">KI-Modell</td><td>Google Gemini (via Google AI API)</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Anbieter</td><td>Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Zweck</td><td>Generierung von Übungsbeschreibungen, Ausführungshinweisen, Schwierigkeitseinordnungen und illustrativen Bildbeschreibungen für die Übungsdatenbank</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Input-Daten</td><td>Übungsname, Kategorie, Muskelgruppe, Equipment — <strong className="text-[#00FF00]">keine personenbezogenen Daten</strong></td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Output</td><td>Generierter Text (Beschreibung, Anleitung) und Illustrationsprompts</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">EU AI Act Risikokategorie</td><td>Minimales Risiko (Kapitel IV, Art. 52) — keine Hochrisiko-Anwendung</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Menschliche Aufsicht</td><td>Generierte Inhalte werden von Coaches/Admins vor Veröffentlichung überprüft und können bearbeitet werden</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Nutzereinwilligung</td><td>Aktive Auslösung durch den Nutzer (Coach/Admin) durch Klick auf „KI-Beschreibung generieren"</td></tr>
                <tr><td className="py-2 font-semibold text-white">Kennzeichnung</td><td>KI-generierte Inhalte werden in der App als solche gekennzeichnet</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl mb-4">
          <p className="text-blue-300 text-sm"><strong>Art. 52 EU AI Act — Transparenzpflicht:</strong> Da es sich um ein KI-System handelt, das zur Generierung von Textinhalten eingesetzt wird, kennzeichnen wir die generierten Inhalte als maschinell erzeugt. Nutzer werden vor der Nutzung der KI-Funktion darüber informiert, dass KI zum Einsatz kommt.</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">3. Automatisierte Datenverarbeitung (ohne KI)</h2>
        <p className="mb-4">Neben KI-Systemen setzen wir folgende regelbasierte automatisierte Verarbeitungen ein:</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">3.1 Churn-Erkennung (Abwanderungsrisiko-Analyse)</h3>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="text-zinc-400">
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white w-1/3">Typ</td><td>Regelbasierter Algorithmus (keine KI/ML)</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Zweck</td><td>Frühzeitige Information an Coaches über möglicherweise desengagierte Athleten</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Input-Daten</td><td>Tage seit letztem Check-In, Trainingserfüllungsrate (aggregiert)</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Logik</td><td>Schwellenwerte: 3 Tage → niedrig, 7 Tage → mittel, 14 Tage → hoch, 21+ Tage → kritisch</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Output</td><td>Risikostufe + Benachrichtigung an den Coach (E-Mail/Push)</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Konsequenz für Athleten</td><td><strong className="text-[#00FF00]">Keine</strong> — rein informativer Hinweis an den Coach. Kein automatischer Eingriff in das Konto oder die Rechte des Athleten.</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Art. 22 DSGVO</td><td>Kein Profiling i.S.v. Art. 22 Abs. 1, da keine rechtsverbindliche oder ähnlich erheblich beeinträchtigende Entscheidung getroffen wird</td></tr>
                <tr><td className="py-2 font-semibold text-white">Abwählbar</td><td>Coaches können Churn-Alerts in den Benachrichtigungseinstellungen deaktivieren</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">3.2 KPI-Berechnungen und Aggregationen</h3>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <p className="mb-2"><strong className="text-white">Für Coaches:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-sm mb-3">
            <li>Check-In-Rate (% der Athleten mit täglichem Check-In)</li>
            <li>Trainingserfüllung (% abgeschlossener Sessions vs. geplanter)</li>
            <li>Top-Performer und Risiko-Athleten (basierend auf objektiven Metriken)</li>
            <li>Athleten-Aktivitätstrend (7-Tage-Fenster)</li>
          </ul>
          <p className="mb-2"><strong className="text-white">Für Admins:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-sm mb-3">
            <li>Umsatz und MRR (Monthly Recurring Revenue)</li>
            <li>Churn-Rate (Abwanderungsrate)</li>
            <li>Conversion-Rate (Registrierung → bezahltes Abo)</li>
            <li>Coach-Performance (Retention, Athleten-Zufriedenheit — aggregiert)</li>
          </ul>
          <p className="text-sm text-zinc-500">Alle KPIs werden aus aggregierten Daten berechnet. Sie dienen ausschließlich informativen Zwecken und führen zu keinen automatisierten Entscheidungen über einzelne Nutzer.</p>
        </div>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">3.3 Automatisierte E-Mail-Dispatch (Reattention-System)</h3>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="text-zinc-400">
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white w-1/3">Typ</td><td>Cron-basiertes Dispatch-System (zeitgesteuert)</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Zweck</td><td>Versand von Trainings-Erinnerungen, Check-In-Reminders, Wochen-Reports</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Frequenz</td><td>Täglich (Reminders), Wöchentlich (Reports), Aktivitätsbasiert (Inaktivitäts-Alerts)</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Präferenz-Check</td><td>Vor jedem Versand wird die notification_preferences-Tabelle geprüft. E-Mails werden nur gesendet, wenn der Nutzer den entsprechenden Typ aktiviert hat.</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Dedup-Logik</td><td>Maximal 1 E-Mail pro Typ pro 20 Stunden (verhindert Spam)</td></tr>
                <tr className="border-b border-zinc-800"><td className="py-2 font-semibold text-white">Rate-Limiting</td><td>Max. 100 E-Mails/Stunde, max. 1.000/Tag</td></tr>
                <tr><td className="py-2 font-semibold text-white">Abwählbar</td><td>Jeder Typ einzeln in den Einstellungen + globaler E-Mail-Killswitch + One-Click-Unsubscribe in jeder E-Mail</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">3.4 Automatisierte Aufmerksamkeits-Benachrichtigungen</h3>
        <p className="mb-2 text-sm">Bei kritischen Wellness-Check-In-Werten (z.B. extrem niedriges Energielevel, hoher Stresslevel) wird automatisch eine Systemnachricht im Coach-Chat generiert, um den Coach auf den Zustand des Athleten aufmerksam zu machen.</p>
        <ul className="list-disc list-inside text-sm space-y-1 mb-4">
          <li><strong className="text-white">Input:</strong> Check-In-Werte (Stimmung, Energie, Stress — Skalenwerte 1–5)</li>
          <li><strong className="text-white">Schwellenwert:</strong> Werte ≤ 2 lösen eine Attention-Meldung aus</li>
          <li><strong className="text-white">Output:</strong> Systemnachricht im Coach-Chat (keine automatische Handlung)</li>
          <li><strong className="text-white">Konsequenz:</strong> Rein informativ — der Coach entscheidet über weitere Schritte</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">4. EU AI Act — Risikobewertung und Klassifizierung</h2>
        <p className="mb-4">Gemäß der Verordnung (EU) 2024/1689 klassifizieren wir unsere KI-Systeme wie folgt:</p>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left py-2 text-white">System</th>
                <th className="text-left py-2 text-white">Risikokategorie</th>
                <th className="text-left py-2 text-white">Begründung</th>
                <th className="text-left py-2 text-white">Pflichten</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              <tr className="border-b border-zinc-800">
                <td className="py-2">Google Gemini (Textgenerierung)</td>
                <td className="text-[#00FF00] font-semibold">Minimales Risiko</td>
                <td>Generiert Übungsbeschreibungen, keine Entscheidungen über Personen, keine biometrische Identifizierung</td>
                <td>Transparenz + Kennzeichnung (Art. 52)</td>
              </tr>
              <tr className="border-b border-zinc-800">
                <td className="py-2">Churn-Erkennung</td>
                <td className="text-[#00FF00] font-semibold">Minimales Risiko</td>
                <td>Regelbasiert (keine ML), rein informativer Output ohne Konsequenzen für Betroffene</td>
                <td>Transparenz</td>
              </tr>
              <tr className="border-b border-zinc-800">
                <td className="py-2">E-Mail-Dispatch</td>
                <td className="text-[#00FF00] font-semibold">Minimales Risiko</td>
                <td>Zeitgesteuerte Automatisierung, keine KI, vollständig abwählbar</td>
                <td>Transparenz + Opt-out</td>
              </tr>
              <tr className="border-b border-zinc-800">
                <td className="py-2">Attention-Alerts</td>
                <td className="text-[#00FF00] font-semibold">Minimales Risiko</td>
                <td>Regelbasierter Schwellenwert, informativ, keine automatische Handlung</td>
                <td>Transparenz</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 p-4 rounded-xl">
          <p className="text-[#00FF00] font-semibold">Keine Hochrisiko-KI-Systeme</p>
          <p className="text-sm mt-1">Die Greenlight Fitness Plattform setzt <strong>keine</strong> Hochrisiko-KI-Systeme ein (Anhang III EU AI Act). Insbesondere setzen wir <strong>keine</strong> biometrische Identifizierung, Emotionserkennung, Social Scoring, automatisierte Bewerbungsbewertung oder Kreditwürdigkeitsprüfung ein.</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">5. Menschliche Aufsicht und Kontrolle</h2>
        <p className="mb-4">Für alle automatisierten Systeme stellen wir sicher:</p>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <li><strong className="text-white">KI-generierte Übungen:</strong> Coaches und Admins überprüfen und bearbeiten generierte Inhalte vor der Veröffentlichung. Die KI generiert Vorschläge, die finale Entscheidung liegt beim Menschen.</li>
          <li><strong className="text-white">Churn-Alerts:</strong> Der Coach erhält eine Information und entscheidet selbstständig über eine Kontaktaufnahme. Es erfolgt keine automatische Kündigung, Sperrung oder andere Benachteiligung des Athleten.</li>
          <li><strong className="text-white">E-Mail-Dispatch:</strong> Das System versendet nur E-Mails, für die der Nutzer sich nicht abgemeldet hat. Nutzer behalten volle Kontrolle über ihre Benachrichtigungspräferenzen.</li>
          <li><strong className="text-white">Attention-Alerts:</strong> Der Coach wird informiert, trifft aber alle weiteren Entscheidungen eigenverantwortlich.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">6. Ihre Rechte bezüglich automatisierter Verarbeitung</h2>
        <p className="mb-4">Sie haben gemäß DSGVO und EU AI Act folgende Rechte:</p>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <li><strong className="text-white">Recht auf Erklärung (Art. 22 Abs. 3 DSGVO):</strong> Sie können eine Erklärung über die Logik automatisierter Entscheidungsfindung anfordern.</li>
          <li><strong className="text-white">Recht auf menschliches Eingreifen:</strong> Sie können verlangen, dass eine automatisierte Entscheidung von einer natürlichen Person überprüft wird.</li>
          <li><strong className="text-white">Widerspruchsrecht (Art. 21 DSGVO):</strong> Sie können jederzeit Widerspruch gegen automatisierte Verarbeitung einlegen.</li>
          <li><strong className="text-white">Opt-out-Recht:</strong> Sie können alle abwählbaren automatisierten Benachrichtigungen in Ihren <a href="/profile#notifications" className="text-[#00FF00]">Einstellungen</a> deaktivieren.</li>
          <li><strong className="text-white">Recht auf Nicht-Diskriminierung:</strong> Sie dürfen aufgrund der Ausübung Ihrer Rechte nicht benachteiligt werden.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">7. Datenminimierung bei automatisierter Verarbeitung</h2>
        <p className="mb-4">Wir beachten bei allen automatisierten Systemen strikt den Grundsatz der Datenminimierung (Art. 5 Abs. 1 lit. c DSGVO):</p>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>Die KI-Funktion (Gemini) erhält <strong className="text-white">keine personenbezogenen Daten</strong> — nur generische Übungsinformationen</li>
          <li>Die Churn-Erkennung verwendet nur zwei aggregierte Datenpunkte (Tage seit Check-In, Trainingserfüllung)</li>
          <li>E-Mail-Templates werden serverseitig befüllt — der E-Mail-Provider (Resend) erhält nur E-Mail-Adresse und Vorname</li>
          <li>Keine Profilbildung (Profiling) zu Werbezwecken</li>
          <li>Keine Zusammenführung von Daten verschiedener Nutzer für algorithmische Zwecke</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">8. Zukunftsplanung und Updates</h2>
        <p className="mb-4">Bei Einführung neuer KI-Systeme oder wesentlicher Änderungen bestehender automatisierter Verarbeitungen werden wir:</p>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>Diese Transparenzerklärung aktualisieren</li>
          <li>Betroffene Nutzer per E-Mail informieren (mindestens 30 Tage im Voraus)</li>
          <li>Eine erneute Risikobewertung nach EU AI Act durchführen</li>
          <li>Ggf. eine Datenschutz-Folgenabschätzung (DSFA) gem. Art. 35 DSGVO durchführen</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">9. Kontakt</h2>
        <p className="mb-4">Für Fragen zu automatisierten Systemen, KI oder dieser Transparenzerklärung:</p>
        <div className="bg-zinc-900 p-4 rounded-xl">
          <p>E-Mail: <a href={`mailto:${COMPANY.privacyEmail}`} className="text-[#00FF00]">{COMPANY.privacyEmail}</a></p>
          <p>Post: {COMPANY.name}, z.Hd. Datenschutzbeauftragter, {COMPANY.street}, {COMPANY.zip} {COMPANY.city}</p>
          <p className="mt-2 text-sm text-zinc-500">Wir beantworten Anfragen innerhalb von 30 Tagen.</p>
        </div>
      </section>
    </>
  );

  const renderImprint = () => (
    <>
      <h1 className="text-3xl font-bold text-white mb-8">Impressum</h1>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Angaben gemäß § 5 TMG / § 5 DDG</h2>
        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="font-semibold text-white">{COMPANY.name}</p>
          <p>{COMPANY.legalForm}</p>
          <p>{COMPANY.street}</p>
          <p>{COMPANY.zip} {COMPANY.city}</p>
          <p>{COMPANY.country}</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Vertreten durch</h2>
        <p>Geschäftsführer: {COMPANY.representative}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Kontakt</h2>
        <p>Telefon: {COMPANY.phone}</p>
        <p>E-Mail: <a href={`mailto:${COMPANY.email}`} className="text-[#00FF00]">{COMPANY.email}</a></p>
        <p>Support: <a href={`mailto:${COMPANY.supportEmail}`} className="text-[#00FF00]">{COMPANY.supportEmail}</a></p>
        <p>Datenschutz: <a href={`mailto:${COMPANY.privacyEmail}`} className="text-[#00FF00]">{COMPANY.privacyEmail}</a></p>
        <p>Website: <a href={COMPANY.website} className="text-[#00FF00]">{COMPANY.website}</a></p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Registereintrag</h2>
        <p>Registergericht: {COMPANY.register}</p>
        <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {COMPANY.vatId}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Inhaltlich Verantwortlicher gemäß § 18 Abs. 2 MStV</h2>
        <p>{COMPANY.representative}</p>
        <p>{COMPANY.street}</p>
        <p>{COMPANY.zip} {COMPANY.city}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">EU-Streitschlichtung</h2>
        <p className="mb-2">Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:</p>
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener" className="text-[#00FF00]">https://ec.europa.eu/consumers/odr/</a>
        <p className="mt-4 mb-2">Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Verbraucherstreitbeilegung (VSBG)</h2>
        <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 Abs. 1 VSBG).</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Haftung für Inhalte</h2>
        <p className="mb-2">Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.</p>
        <p>Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Haftung für Links</h2>
        <p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich. Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Urheberrecht</h2>
        <p className="mb-2">Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.</p>
        <p>Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.</p>
      </section>

      <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl mt-8">
        <p className="text-yellow-500 text-sm">⚠️ Dies ist ein Platzhalter-Impressum für die Entwicklungsphase. Vor dem Live-Gang müssen die Unternehmensdaten (Name, Adresse, Handelsregister, USt-IdNr., Geschäftsführer) durch echte Daten ersetzt werden.</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-300 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <button onClick={handleBack} className="inline-flex items-center text-[#00FF00] hover:text-white mb-8 transition-colors font-bold">
          <ChevronLeft size={20} /> Zurück
        </button>

        <nav className="flex flex-wrap gap-2 md:gap-4 mb-8 border-b border-zinc-800 pb-4">
          <Link to="/legal/privacy" className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${isPrivacy ? 'bg-[#00FF00] text-black' : 'text-zinc-400 hover:text-white'}`}>
            Datenschutz
          </Link>
          <Link to="/legal/terms" className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${isTerms ? 'bg-[#00FF00] text-black' : 'text-zinc-400 hover:text-white'}`}>
            AGB
          </Link>
          <Link to="/legal/transparency" className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${isTransparency ? 'bg-[#00FF00] text-black' : 'text-zinc-400 hover:text-white'}`}>
            Transparenz
          </Link>
          <Link to="/legal/imprint" className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${!isPrivacy && !isTerms && !isTransparency ? 'bg-[#00FF00] text-black' : 'text-zinc-400 hover:text-white'}`}>
            Impressum
          </Link>
        </nav>

        <div className="prose prose-invert prose-green max-w-none">
          {isPrivacy && renderPrivacy()}
          {isTerms && renderTerms()}
          {isTransparency && renderTransparency()}
          {!isPrivacy && !isTerms && !isTransparency && renderImprint()}
        </div>
        
        <footer className="mt-12 pt-8 border-t border-zinc-800 text-center text-zinc-600 text-sm">
          <p>© {new Date().getFullYear()} {COMPANY.name}. Alle Rechte vorbehalten.</p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Link to="/legal/privacy" className="hover:text-white">Datenschutz</Link>
            <Link to="/legal/terms" className="hover:text-white">AGB</Link>
            <Link to="/legal/transparency" className="hover:text-white">Transparenz</Link>
            <Link to="/legal/imprint" className="hover:text-white">Impressum</Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Legal;