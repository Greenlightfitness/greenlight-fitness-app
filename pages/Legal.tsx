import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const COMPANY = {
  name: 'Greenlight Fitness',
  street: 'Musterstraße 11',
  city: '10115 Berlin',
  country: 'Deutschland',
  phone: '+49 (0) 123 44 55 66',
  email: 'info@greenlight-fitness.de',
  representative: 'Max Mustermann',
};

const Legal: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const path = location.pathname;
  const isPrivacy = path.includes('privacy');
  const isTerms = path.includes('terms');

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
      <p className="text-zinc-500 mb-8">Stand: Februar 2026 | Version 1.0</p>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">1. Datenschutz auf einen Blick</h2>
        <h3 className="text-lg font-semibold text-zinc-200 mb-2">Allgemeine Hinweise</h3>
        <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie unsere App nutzen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">2. Verantwortliche Stelle</h2>
        <p className="mb-4">Verantwortlich für die Datenverarbeitung ist:</p>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <p className="font-semibold text-white">{COMPANY.name}</p>
          <p>{COMPANY.street}</p>
          <p>{COMPANY.city}, {COMPANY.country}</p>
          <p className="mt-2">E-Mail: <a href={`mailto:${COMPANY.email}`} className="text-[#00FF00]">{COMPANY.email}</a></p>
          <p>Telefon: {COMPANY.phone}</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">3. Ihre Rechte (DSGVO Art. 15-22)</h2>
        <p className="mb-4">Sie haben jederzeit folgende Rechte bezüglich Ihrer Daten:</p>
        <ul className="list-disc list-inside space-y-2 mb-4">
          <li><strong className="text-white">Auskunftsrecht (Art. 15)</strong>: Welche Daten wir über Sie speichern</li>
          <li><strong className="text-white">Berichtigungsrecht (Art. 16)</strong>: Korrektur unrichtiger Daten</li>
          <li><strong className="text-white">Löschungsrecht (Art. 17)</strong>: "Recht auf Vergessenwerden"</li>
          <li><strong className="text-white">Einschränkung (Art. 18)</strong>: Einschränkung der Verarbeitung</li>
          <li><strong className="text-white">Datenportabilität (Art. 20)</strong>: Export Ihrer Daten</li>
          <li><strong className="text-white">Widerspruchsrecht (Art. 21)</strong>: Widerspruch gegen Verarbeitung</li>
        </ul>
        <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 p-4 rounded-xl">
          <p className="text-[#00FF00] font-semibold">So üben Sie Ihre Rechte aus:</p>
          <p>In Ihrem Profil unter "Datenschutz-Einstellungen" können Sie Ihre Daten exportieren oder einen Löschantrag stellen. Alternativ per E-Mail an {COMPANY.email}.</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">4. Welche Daten wir erheben</h2>
        
        <h3 className="text-lg font-semibold text-zinc-200 mb-2">4.1 Registrierungsdaten</h3>
        <ul className="list-disc list-inside mb-4">
          <li>E-Mail-Adresse (Pflicht)</li>
          <li>Passwort (verschlüsselt gespeichert)</li>
          <li>Rolle (Athlet/Coach/Admin)</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">4.2 Profildaten (freiwillig)</h3>
        <ul className="list-disc list-inside mb-4">
          <li>Name, Nickname, Profilbild</li>
          <li>Geburtsdatum, Geschlecht</li>
          <li>Körperdaten: Größe, Gewicht, Körperfett, Herzfrequenz</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">4.3 Trainingsdaten</h3>
        <ul className="list-disc list-inside mb-4">
          <li>Trainingspläne und Workouts</li>
          <li>Übungsausführungen und Fortschritte</li>
          <li>Aktivitäts-Logs</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">4.4 Technische Daten</h3>
        <ul className="list-disc list-inside mb-4">
          <li>IP-Adresse (anonymisiert)</li>
          <li>Browser-Typ, Geräteinformationen</li>
          <li>Zugriffszeitpunkte</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse - Sicherheit)</p>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">4.5 Coach-spezifische Daten</h3>
        <p className="mb-2">Wenn Sie die Plattform als Coach nutzen, werden zusätzlich erhoben:</p>
        <ul className="list-disc list-inside mb-4">
          <li>Berufsbezeichnung, Biografie, Spezialisierungen</li>
          <li>Profilbild (öffentlich sichtbar für Buchungsseite)</li>
          <li>Kontaktdaten: Telefonnummer, Website, Social-Media-Profile</li>
          <li>Buchungslink und Verfügbarkeitszeiten</li>
          <li>Terminbuchungen und Kundendaten (als Auftragsverarbeiter)</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) + Art. 28 DSGVO (Auftragsverarbeitung)</p>
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl mb-4">
          <p className="text-blue-300 text-sm"><strong>Auftragsverarbeitung (Art. 28 DSGVO):</strong> Coaches agieren als Auftragsverarbeiter für die personenbezogenen Daten ihrer Athleten. Sie verpflichten sich, diese Daten nur im Rahmen des Coaching-Verhältnisses zu verarbeiten, vertraulich zu behandeln und nach Beendigung der Zusammenarbeit zu löschen oder zurückzugeben.</p>
        </div>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">4.6 Admin-spezifische Datenverarbeitung</h3>
        <p className="mb-2">Administratoren haben erweiterten Zugriff auf:</p>
        <ul className="list-disc list-inside mb-4">
          <li>Nutzerverwaltung (Profile, Rollen, Zuweisungen)</li>
          <li>Abrechnungsdaten und Stripe-Transaktionen</li>
          <li>Audit-Logs und Systemprotokolle</li>
          <li>Plattformweite Konfigurationen</li>
        </ul>
        <p className="text-sm text-zinc-500 mb-4">Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse - Plattformbetrieb) + Art. 32 DSGVO (Sicherheit der Verarbeitung)</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">5. Datenverarbeitung durch Dritte</h2>
        
        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.1 Supabase (Datenbank & Auth)</h3>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <p><strong>Anbieter:</strong> Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992</p>
          <p><strong>Zweck:</strong> Datenspeicherung, Authentifizierung</p>
          <p><strong>Daten:</strong> Alle App-Daten (verschlüsselt)</p>
          <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO + Standardvertragsklauseln</p>
          <p className="mt-2"><a href="https://supabase.com/privacy" target="_blank" rel="noopener" className="text-[#00FF00]">→ Supabase Datenschutzerklärung</a></p>
        </div>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.2 Vercel (Hosting)</h3>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <p><strong>Anbieter:</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA</p>
          <p><strong>Zweck:</strong> Bereitstellung der Webanwendung</p>
          <p><strong>Daten:</strong> IP-Adressen, Zugriffs-Logs</p>
          <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO + Standardvertragsklauseln</p>
          <p className="mt-2"><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener" className="text-[#00FF00]">→ Vercel Datenschutzerklärung</a></p>
        </div>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.3 Resend (E-Mail-Versand)</h3>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <p><strong>Anbieter:</strong> Resend Inc.</p>
          <p><strong>Zweck:</strong> Versand von Transaktions-E-Mails</p>
          <p><strong>Daten:</strong> E-Mail-Adresse, Name</p>
          <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO</p>
          <p className="mt-2"><a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener" className="text-[#00FF00]">→ Resend Datenschutzerklärung</a></p>
        </div>

        <h3 className="text-lg font-semibold text-zinc-200 mb-2">5.4 Google Gemini AI (optional)</h3>
        <div className="bg-zinc-900 p-4 rounded-xl mb-4">
          <p><strong>Anbieter:</strong> Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA</p>
          <p><strong>Zweck:</strong> KI-generierte Übungsbeschreibungen und Illustrationen</p>
          <p><strong>Daten:</strong> Übungsnamen und -beschreibungen (keine personenbezogenen Daten)</p>
          <p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung bei Nutzung)</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">6. Speicherdauer</h2>
        <ul className="list-disc list-inside space-y-2">
          <li><strong className="text-white">Account-Daten:</strong> Bis zur Löschung des Accounts</li>
          <li><strong className="text-white">Trainingsdaten:</strong> Bis zur Löschung des Accounts</li>
          <li><strong className="text-white">Einwilligungs-Logs:</strong> 3 Jahre nach Widerruf (Nachweispflicht)</li>
          <li><strong className="text-white">Audit-Logs:</strong> 1 Jahr (Sicherheitszwecke)</li>
          <li><strong className="text-white">Löschanträge:</strong> 30 Tage nach Bearbeitung</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">7. Datensicherheit</h2>
        <p className="mb-4">Wir setzen folgende technische und organisatorische Maßnahmen ein:</p>
        <ul className="list-disc list-inside space-y-2">
          <li>SSL/TLS-Verschlüsselung für alle Datenübertragungen</li>
          <li>Verschlüsselte Passwort-Speicherung (bcrypt)</li>
          <li>Row-Level-Security in der Datenbank</li>
          <li>Regelmäßige Sicherheits-Audits</li>
          <li>Zugangsbeschränkungen nach Least-Privilege-Prinzip</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">8. Cookies & Local Storage</h2>
        <p className="mb-4">Wir verwenden:</p>
        <ul className="list-disc list-inside space-y-2">
          <li><strong className="text-white">Session-Token:</strong> Notwendig für Login (Local Storage)</li>
          <li><strong className="text-white">Spracheinstellung:</strong> Ihre bevorzugte Sprache (Local Storage)</li>
        </ul>
        <p className="mt-4 text-sm text-zinc-500">Wir verwenden KEINE Tracking-Cookies oder Analyse-Tools von Drittanbietern.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">9. Beschwerderecht</h2>
        <p>Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Die für uns zuständige Behörde ist:</p>
        <div className="bg-zinc-900 p-4 rounded-xl mt-4">
          <p className="font-semibold text-white">Berliner Beauftragte für Datenschutz und Informationsfreiheit</p>
          <p>Friedrichstr. 219, 10969 Berlin</p>
          <p>E-Mail: mailbox@datenschutz-berlin.de</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">10. Änderungen dieser Erklärung</h2>
        <p>Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslagen oder neue Funktionen anzupassen. Die aktuelle Version finden Sie stets hier. Bei wesentlichen Änderungen informieren wir Sie per E-Mail.</p>
      </section>
    </>
  );

  const renderTerms = () => (
    <>
      <h1 className="text-3xl font-bold text-white mb-2">Allgemeine Geschäftsbedingungen (AGB)</h1>
      <p className="text-zinc-500 mb-8">Stand: Februar 2026 | Version 1.0</p>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 1 Geltungsbereich</h2>
        <p>Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Greenlight Fitness App, bereitgestellt von {COMPANY.name}, {COMPANY.street}, {COMPANY.city}.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 2 Vertragsschluss</h2>
        <p className="mb-2">(1) Mit der Registrierung kommt ein Nutzungsvertrag zustande.</p>
        <p className="mb-2">(2) Die Registrierung ist nur volljährigen Personen gestattet.</p>
        <p>(3) Der Nutzer versichert, wahrheitsgemäße Angaben zu machen.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 3 Leistungsbeschreibung</h2>
        <p className="mb-2">(1) Greenlight Fitness bietet eine Plattform für Fitness-Coaching und Trainingsplanung.</p>
        <p className="mb-2">(2) Die Basis-Funktionen sind kostenlos ("Freemium-Modell").</p>
        <p className="mb-2">(3) Premium-Funktionen können kostenpflichtig sein und werden separat ausgewiesen.</p>
        <p className="mb-2">(4) Die Plattform unterscheidet drei Nutzerrollen mit unterschiedlichem Funktionsumfang:</p>
        <ul className="list-disc list-inside ml-4 space-y-1 mb-4">
          <li><strong className="text-white">Athlet:</strong> Trainingsplan-Nutzung, Fortschrittstracking, Check-ins, Chat mit Coach, Shop</li>
          <li><strong className="text-white">Coach:</strong> Trainingsplanung, Athletenbetreuung, Terminverwaltung (Calendly-ähnlich), öffentliches Coaching-Profil, Buchungsseite</li>
          <li><strong className="text-white">Admin:</strong> Alle Coach-Funktionen plus Nutzerverwaltung, CRM, Produktmanagement, Abrechnungsübersicht</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 3a Besondere Bedingungen für Coaches</h2>
        <p className="mb-2">(1) Coaches erstellen im Rahmen des Onboardings ein öffentliches Profil mit Berufsbezeichnung, Biografie, Spezialisierungen und optionalem Profilbild.</p>
        <p className="mb-2">(2) Coaches erhalten einen persönlichen Buchungslink, über den Dritte Termine buchen können. Der Coach ist für die korrekte Pflege seiner Verfügbarkeiten verantwortlich.</p>
        <p className="mb-2">(3) Coaches verarbeiten im Rahmen ihrer Tätigkeit personenbezogene Daten von Athleten (Gesundheitsdaten, Trainingsdaten, Kommunikation). Sie verpflichten sich zur vertraulichen Behandlung gem. DSGVO Art. 28.</p>
        <p className="mb-2">(4) Der Coach stellt sicher, dass seine Profilangaben wahrheitsgemäß sind und keine irreführenden Qualifikationen angegeben werden.</p>
        <p>(5) Die Coaching-Beziehung zwischen Coach und Athlet basiert auf gegenseitigem Einverständnis. Beide Seiten können die Zusammenarbeit jederzeit beenden.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 3b Besondere Bedingungen für Administratoren</h2>
        <p className="mb-2">(1) Administratoren haben erweiterten Zugriff auf alle Plattformfunktionen, einschließlich Nutzerverwaltung, Abrechnungsdaten und Systemkonfiguration.</p>
        <p className="mb-2">(2) Mit dem erweiterten Zugriff geht eine besondere Sorgfaltspflicht einher. Administratoren verpflichten sich, Nutzerdaten nur im Rahmen des Plattformbetriebs zu verarbeiten.</p>
        <p className="mb-2">(3) Administratoren dürfen Nutzerkonten verwalten, Coach-Zuweisungen vornehmen und Produkte erstellen/ändern.</p>
        <p>(4) Der Missbrauch von Admin-Berechtigungen (z.B. unbefugte Datenweitergabe) führt zum sofortigen Entzug der Admin-Rolle und kann rechtliche Konsequenzen nach sich ziehen.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 4 Nutzerrechte und -pflichten</h2>
        <p className="mb-2">(1) Der Nutzer erhält ein einfaches, nicht übertragbares Nutzungsrecht.</p>
        <p className="mb-2">(2) Der Nutzer ist für seine Zugangsdaten verantwortlich.</p>
        <p className="mb-2">(3) Untersagt sind:</p>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>Missbrauch der Plattform</li>
          <li>Verbreitung rechtswidriger Inhalte</li>
          <li>Automatisierte Zugriffe ohne Genehmigung</li>
          <li>Weitergabe von Athleten- oder Nutzerdaten an Dritte ohne Einwilligung</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 5 Haftung</h2>
        <p className="mb-2">(1) Greenlight Fitness haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit.</p>
        <p className="mb-2">(2) Bei leichter Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten.</p>
        <p>(3) Die App ersetzt keine medizinische Beratung. Training erfolgt auf eigenes Risiko.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 6 Kündigung</h2>
        <p className="mb-2">(1) Der Nutzer kann sein Konto jederzeit löschen.</p>
        <p className="mb-2">(2) Wir können den Vertrag bei Verstoß gegen diese AGB fristlos kündigen.</p>
        <p>(3) Nach Kündigung werden alle Daten gemäß Datenschutzerklärung gelöscht.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 7 Änderungen der AGB</h2>
        <p>Wir behalten uns vor, diese AGB zu ändern. Änderungen werden per E-Mail angekündigt. Bei Widerspruch innerhalb von 4 Wochen kann der Vertrag gekündigt werden.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">§ 8 Schlussbestimmungen</h2>
        <p className="mb-2">(1) Es gilt deutsches Recht.</p>
        <p className="mb-2">(2) Gerichtsstand ist Berlin (für Kaufleute).</p>
        <p>(3) Sollten einzelne Bestimmungen unwirksam sein, bleibt der Rest wirksam.</p>
      </section>
    </>
  );

  const renderImprint = () => (
    <>
      <h1 className="text-3xl font-bold text-white mb-8">Impressum</h1>
      
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Angaben gemäß § 5 TMG</h2>
        <div className="bg-zinc-900 p-4 rounded-xl">
          <p className="font-semibold text-white">{COMPANY.name}</p>
          <p>{COMPANY.street}</p>
          <p>{COMPANY.city}</p>
          <p>{COMPANY.country}</p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Kontakt</h2>
        <p>Telefon: {COMPANY.phone}</p>
        <p>E-Mail: <a href={`mailto:${COMPANY.email}`} className="text-[#00FF00]">{COMPANY.email}</a></p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
        <p>{COMPANY.representative}</p>
        <p>{COMPANY.street}</p>
        <p>{COMPANY.city}</p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">EU-Streitschlichtung</h2>
        <p className="mb-2">Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:</p>
        <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener" className="text-[#00FF00]">https://ec.europa.eu/consumers/odr/</a>
        <p className="mt-2">Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
      </section>

      <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl mt-8">
        <p className="text-yellow-500 text-sm">⚠️ Dies ist ein Platzhalter-Impressum für die Entwicklungsphase. Vor dem Live-Gang müssen hier echte Unternehmensdaten eingetragen werden.</p>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-300 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <button onClick={handleBack} className="inline-flex items-center text-[#00FF00] hover:text-white mb-8 transition-colors font-bold">
          <ChevronLeft size={20} /> Zurück
        </button>

        <nav className="flex gap-4 mb-8 border-b border-zinc-800 pb-4">
          <Link to="/legal/privacy" className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isPrivacy ? 'bg-[#00FF00] text-black' : 'text-zinc-400 hover:text-white'}`}>
            Datenschutz
          </Link>
          <Link to="/legal/terms" className={`px-4 py-2 rounded-lg font-semibold transition-colors ${isTerms ? 'bg-[#00FF00] text-black' : 'text-zinc-400 hover:text-white'}`}>
            AGB
          </Link>
          <Link to="/legal/imprint" className={`px-4 py-2 rounded-lg font-semibold transition-colors ${!isPrivacy && !isTerms ? 'bg-[#00FF00] text-black' : 'text-zinc-400 hover:text-white'}`}>
            Impressum
          </Link>
        </nav>

        <div className="prose prose-invert prose-green max-w-none">
          {isPrivacy && renderPrivacy()}
          {isTerms && renderTerms()}
          {!isPrivacy && !isTerms && renderImprint()}
        </div>
        
        <footer className="mt-12 pt-8 border-t border-zinc-800 text-center text-zinc-600 text-sm">
          <p>© {new Date().getFullYear()} {COMPANY.name}. Alle Rechte vorbehalten.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link to="/legal/privacy" className="hover:text-white">Datenschutz</Link>
            <Link to="/legal/terms" className="hover:text-white">AGB</Link>
            <Link to="/legal/imprint" className="hover:text-white">Impressum</Link>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Legal;