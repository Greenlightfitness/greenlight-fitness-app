/**
 * Greenlight Fitness - Reattention E-Mail Templates
 * 
 * Automatisierte E-Mails zur Kundenbindung und Reaktivierung:
 * - ATHLETE: Training-Reminder, Check-In-Nudges, Inaktivitäts-Alerts, Wochen-Fortschritt
 * - COACH:   Wochen-Summary, Athleten-KPIs, Churn-Risk-Alerts
 * - ADMIN:   Wochen-Business-Report, Churn-Alerts, Coach-Performance
 * 
 * Kompatibel mit Resend API & bestehender E-Mail-Infrastruktur
 */

const accentColor = '#00FF00';

const cardStyles = `
  background: linear-gradient(180deg, #1C1C1E 0%, #0A0A0A 100%);
  border: 1px solid #27272A;
  border-radius: 16px;
  padding: 24px;
  margin: 16px 0;
`;

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
        <a href="https://app.greenlight-fitness.de/settings" style="color: #52525B; text-decoration: underline;">E-Mail-Einstellungen ändern</a>
      </td>
    </tr>
  </table>
`;

const emailShell = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
      <span style="color: ${accentColor}; font-size: 24px; font-weight: bold;">⚡ GREENLIGHT</span>
    </div>
    ${content}
    ${getFooter()}
  </div>
</body>
</html>
`;

const kpiRow = (label: string, value: string, color: string = '#FFFFFF') => `
  <tr>
    <td style="padding: 10px 0; border-bottom: 1px solid #3F3F46;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="color: #71717A; font-size: 13px;">${label}</td>
          <td align="right" style="color: ${color}; font-size: 14px; font-weight: bold;">${value}</td>
        </tr>
      </table>
    </td>
  </tr>
`;

const progressBar = (percent: number, color: string = accentColor) => `
  <div style="background: #27272A; border-radius: 6px; height: 8px; width: 100%; margin: 8px 0;">
    <div style="background: ${color}; border-radius: 6px; height: 8px; width: ${Math.min(100, Math.max(0, percent))}%;"></div>
  </div>
`;

// =============================================================================
// ATHLETE TEMPLATES
// =============================================================================

export interface AthleteTrainingReminderData {
  firstName: string;
  sessionName: string;
  planName: string;
  scheduledTime?: string;
  dashboardLink: string;
}

export const athleteTrainingReminder = (data: AthleteTrainingReminderData): { subject: string; html: string } => ({
  subject: `💪 ${data.firstName}, dein Training wartet!`,
  html: emailShell(`
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(0, 255, 0, 0.1); border-radius: 16px; display: inline-block; line-height: 64px; margin-bottom: 16px;">
        <span style="font-size: 32px;">💪</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Zeit fürs Training!</h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">Dein Trainingsplan wartet auf dich</p>
    </div>

    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.firstName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      heute steht <strong style="color: #FFFFFF;">${data.sessionName}</strong> auf dem Plan. Lass uns deine Ziele gemeinsam erreichen!
    </p>

    <div style="${cardStyles} border-color: ${accentColor};">
      <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">HEUTIGES TRAINING</p>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${kpiRow('Session', data.sessionName, accentColor)}
          ${kpiRow('Trainingsplan', data.planName)}
          ${data.scheduledTime ? kpiRow('Geplant', data.scheduledTime) : ''}
        </table>
      </div>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.dashboardLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold; box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);">
        Training starten →
      </a>
    </div>

    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
  `),
});

export interface AthleteCheckInReminderData {
  firstName: string;
  streakDays: number;
  lastCheckIn?: string;
  dashboardLink: string;
}

export const athleteCheckInReminder = (data: AthleteCheckInReminderData): { subject: string; html: string } => ({
  subject: data.streakDays > 0
    ? `🔥 ${data.streakDays}-Tage-Streak! Check-In nicht vergessen`
    : `☀️ Guten Morgen, ${data.firstName}! Zeit für deinen Check-In`,
  html: emailShell(`
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(251, 191, 36, 0.1); border-radius: 16px; display: inline-block; line-height: 64px; margin-bottom: 16px;">
        <span style="font-size: 32px;">${data.streakDays > 0 ? '🔥' : '☀️'}</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">
        ${data.streakDays > 0 ? `${data.streakDays}-Tage-Streak!` : 'Täglicher Check-In'}
      </h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">30 Sekunden für bessere Ergebnisse</p>
    </div>

    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.firstName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      ${data.streakDays > 0
        ? `du bist seit <strong style="color: ${accentColor};">${data.streakDays} Tagen</strong> am Ball — großartig! Halte die Serie aufrecht.`
        : 'wie fühlst du dich heute? Dein täglicher Check-In hilft dir und deinem Coach, dein Training optimal zu steuern.'
      }
    </p>

    ${data.streakDays > 0 ? `
    <div style="${cardStyles} border-color: #F59E0B;">
      <div style="text-align: center;">
        <span style="font-size: 48px;">🔥</span>
        <p style="color: #FCD34D; font-size: 28px; font-weight: bold; margin: 8px 0 4px 0;">${data.streakDays} Tage</p>
        <p style="color: #71717A; font-size: 12px; margin: 0;">Check-In Streak</p>
      </div>
    </div>
    ` : ''}

    <div style="background: #18181B; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">📋 Was wird erfasst?</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td style="color: #A1A1AA; font-size: 13px; padding: 4px 0;">• Schlafqualität & Energie</td></tr>
        <tr><td style="color: #A1A1AA; font-size: 13px; padding: 4px 0;">• Stimmung & Stresslevel</td></tr>
        <tr><td style="color: #A1A1AA; font-size: 13px; padding: 4px 0;">• Muskelkater & Ernährung</td></tr>
        <tr><td style="color: #A1A1AA; font-size: 13px; padding: 4px 0;">• Gewicht (optional)</td></tr>
      </table>
    </div>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.dashboardLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold;">
        Jetzt eintragen →
      </a>
    </div>

    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
  `),
});

export interface AthleteInactivityAlertData {
  firstName: string;
  daysSinceLastActivity: number;
  lastActivityType: string;
  lastActivityDate: string;
  coachName?: string;
  dashboardLink: string;
}

export const athleteInactivityAlert = (data: AthleteInactivityAlertData): { subject: string; html: string } => ({
  subject: data.daysSinceLastActivity >= 14
    ? `❤️ ${data.firstName}, wir vermissen dich!`
    : data.daysSinceLastActivity >= 7
    ? `💭 ${data.firstName}, dein Training wartet auf dich`
    : `👋 Hey ${data.firstName}, alles okay?`,
  html: emailShell(`
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(168, 85, 247, 0.1); border-radius: 16px; display: inline-block; line-height: 64px; margin-bottom: 16px;">
        <span style="font-size: 32px;">${data.daysSinceLastActivity >= 14 ? '❤️' : data.daysSinceLastActivity >= 7 ? '💭' : '👋'}</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">
        ${data.daysSinceLastActivity >= 14 ? 'Wir vermissen dich!' : data.daysSinceLastActivity >= 7 ? 'Schon eine Weile her...' : 'Alles klar bei dir?'}
      </h1>
    </div>

    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.firstName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      deine letzte Aktivität war vor <strong style="color: #FFFFFF;">${data.daysSinceLastActivity} Tagen</strong>
      (${data.lastActivityType}, ${data.lastActivityDate}).
      ${data.coachName ? ` Dein Coach <strong style="color: #FFFFFF;">${data.coachName}</strong> wartet auf dich!` : ''}
    </p>

    ${data.daysSinceLastActivity >= 14 ? `
    <div style="${cardStyles} border-color: #A855F7;">
      <p style="color: #A855F7; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">ERINNERUNG</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 16px 0;">
        Jeder Tag ist ein guter Tag, um wieder einzusteigen. Es muss nicht perfekt sein — Hauptsache, du fängst an.
      </p>
      <div style="background: rgba(0, 255, 0, 0.05); border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 12px; padding: 16px;">
        <p style="color: ${accentColor}; font-size: 13px; margin: 0; text-align: center;">
          💡 <strong>Tipp:</strong> Starte mit einem kurzen Check-In und einem leichten Workout.
        </p>
      </div>
    </div>
    ` : `
    <div style="${cardStyles}">
      <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">🎯 Nächste Schritte</p>
      <div style="background: #18181B; border-radius: 12px; padding: 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr><td style="color: #A1A1AA; font-size: 13px; padding: 6px 0;">✅ Täglichen Check-In ausfüllen</td></tr>
          <tr><td style="color: #A1A1AA; font-size: 13px; padding: 6px 0;">✅ Nächste Session im Plan ansehen</td></tr>
          ${data.coachName ? `<tr><td style="color: #A1A1AA; font-size: 13px; padding: 6px 0;">✅ Nachricht an ${data.coachName} schreiben</td></tr>` : ''}
        </table>
      </div>
    </div>
    `}

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.dashboardLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 16px 40px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: bold;">
        Zurück zum Training →
      </a>
    </div>

    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
  `),
});

export interface AthleteWeeklyProgressData {
  firstName: string;
  weekNumber: number;
  workoutsCompleted: number;
  workoutsPlanned: number;
  checkInsCompleted: number;
  avgMood?: number;
  avgEnergy?: number;
  prsThisWeek: number;
  streakDays: number;
  coachNote?: string;
  dashboardLink: string;
}

export const athleteWeeklyProgress = (data: AthleteWeeklyProgressData): { subject: string; html: string } => {
  const completionRate = data.workoutsPlanned > 0 ? Math.round((data.workoutsCompleted / data.workoutsPlanned) * 100) : 0;
  const completionColor = completionRate >= 80 ? accentColor : completionRate >= 50 ? '#F59E0B' : '#EF4444';

  return {
    subject: `📊 Dein Wochen-Report KW${data.weekNumber} — ${completionRate}% geschafft`,
    html: emailShell(`
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 64px; height: 64px; background: rgba(0, 255, 0, 0.1); border-radius: 16px; display: inline-block; line-height: 64px; margin-bottom: 16px;">
          <span style="font-size: 32px;">📊</span>
        </div>
        <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Dein Wochen-Report</h1>
        <p style="color: #71717A; font-size: 14px; margin: 0;">Kalenderwoche ${data.weekNumber}</p>
      </div>

      <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.firstName},</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
        hier ist dein wöchentlicher Fortschritts-Report. ${completionRate >= 80 ? 'Herausragende Woche! 🎉' : completionRate >= 50 ? 'Gute Arbeit — bleib dran! 💪' : 'Nächste Woche packen wir es! 🚀'}
      </p>

      <!-- Training Completion -->
      <div style="${cardStyles} border-color: ${completionColor};">
        <p style="color: ${completionColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">TRAININGS-FORTSCHRITT</p>
        <div style="text-align: center; margin-bottom: 16px;">
          <span style="color: ${completionColor}; font-size: 48px; font-weight: bold;">${completionRate}%</span>
          <p style="color: #71717A; font-size: 12px; margin: 4px 0 0 0;">${data.workoutsCompleted} von ${data.workoutsPlanned} Sessions</p>
        </div>
        ${progressBar(completionRate, completionColor)}
      </div>

      <!-- KPIs -->
      <div style="${cardStyles}">
        <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">WOCHENÜBERSICHT</p>
        <div style="background: #27272A; border-radius: 12px; padding: 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${kpiRow('Check-Ins', `${data.checkInsCompleted}/7`, data.checkInsCompleted >= 5 ? accentColor : '#F59E0B')}
            ${data.avgMood ? kpiRow('Ø Stimmung', `${data.avgMood.toFixed(1)}/5`, data.avgMood >= 3.5 ? accentColor : '#F59E0B') : ''}
            ${data.avgEnergy ? kpiRow('Ø Energie', `${data.avgEnergy.toFixed(1)}/5`, data.avgEnergy >= 3.5 ? accentColor : '#F59E0B') : ''}
            ${kpiRow('Neue PRs', `${data.prsThisWeek}`, data.prsThisWeek > 0 ? '#F59E0B' : '#71717A')}
            ${kpiRow('Streak', `${data.streakDays} Tage`, data.streakDays >= 7 ? accentColor : '#FFFFFF')}
          </table>
        </div>
      </div>

      ${data.coachNote ? `
      <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; padding: 16px; margin: 16px 0;">
        <p style="color: #60A5FA; font-size: 12px; font-weight: bold; margin: 0 0 8px 0;">💬 Nachricht von deinem Coach</p>
        <p style="color: #A1A1AA; font-size: 14px; margin: 0; font-style: italic;">"${data.coachNote}"</p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.dashboardLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
          Dashboard öffnen →
        </a>
      </div>

      <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
        Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
      </p>
    `),
  };
};

// =============================================================================
// COACH TEMPLATES
// =============================================================================

export interface CoachWeeklySummaryData {
  coachName: string;
  weekNumber: number;
  totalAthletes: number;
  activeAthletes: number;
  inactiveAthletes: number;
  avgCheckInRate: number;
  avgTrainingCompletion: number;
  athletesAtRisk: Array<{ name: string; reason: string }>;
  topPerformers: Array<{ name: string; metric: string }>;
  newMessages: number;
  dashboardLink: string;
}

export const coachWeeklySummary = (data: CoachWeeklySummaryData): { subject: string; html: string } => ({
  subject: `📈 Coach-Report KW${data.weekNumber} — ${data.activeAthletes}/${data.totalAthletes} aktiv`,
  html: emailShell(`
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(59, 130, 246, 0.1); border-radius: 16px; display: inline-block; line-height: 64px; margin-bottom: 16px;">
        <span style="font-size: 32px;">📈</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Dein Coach-Report</h1>
      <p style="color: #71717A; font-size: 14px; margin: 0;">Kalenderwoche ${data.weekNumber}</p>
    </div>

    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.coachName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      hier ist dein wöchentlicher Athleten-Überblick.
    </p>

    <!-- Athlete KPIs -->
    <div style="${cardStyles} border-color: #3B82F6;">
      <p style="color: #3B82F6; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">ATHLETEN-KPIS</p>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${kpiRow('Athleten gesamt', `${data.totalAthletes}`)}
          ${kpiRow('Aktiv diese Woche', `${data.activeAthletes}`, accentColor)}
          ${kpiRow('Inaktiv', `${data.inactiveAthletes}`, data.inactiveAthletes > 0 ? '#EF4444' : '#71717A')}
          ${kpiRow('Ø Check-In-Rate', `${data.avgCheckInRate}%`, data.avgCheckInRate >= 70 ? accentColor : '#F59E0B')}
          ${kpiRow('Ø Trainingserfüllung', `${data.avgTrainingCompletion}%`, data.avgTrainingCompletion >= 70 ? accentColor : '#F59E0B')}
          ${kpiRow('Ungelesene Nachrichten', `${data.newMessages}`, data.newMessages > 0 ? '#3B82F6' : '#71717A')}
        </table>
      </div>
    </div>

    <!-- Churn Risk -->
    ${data.athletesAtRisk.length > 0 ? `
    <div style="${cardStyles} border-color: #EF4444;">
      <p style="color: #EF4444; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">
        ⚠️ CHURN-RISIKO (${data.athletesAtRisk.length})
      </p>
      <p style="color: #A1A1AA; font-size: 13px; margin: 0 0 12px 0;">
        Diese Athleten zeigen Anzeichen von Desengagement:
      </p>
      ${data.athletesAtRisk.map(a => `
        <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 10px; padding: 12px; margin-bottom: 8px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="color: #FFFFFF; font-size: 14px; font-weight: bold;">${a.name}</td>
              <td align="right" style="color: #EF4444; font-size: 12px;">${a.reason}</td>
            </tr>
          </table>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Top Performers -->
    ${data.topPerformers.length > 0 ? `
    <div style="${cardStyles} border-color: ${accentColor};">
      <p style="color: ${accentColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">
        🏆 TOP-PERFORMER
      </p>
      ${data.topPerformers.map(a => `
        <div style="background: rgba(0, 255, 0, 0.05); border: 1px solid rgba(0, 255, 0, 0.15); border-radius: 10px; padding: 12px; margin-bottom: 8px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="color: #FFFFFF; font-size: 14px; font-weight: bold;">${a.name}</td>
              <td align="right" style="color: ${accentColor}; font-size: 12px;">${a.metric}</td>
            </tr>
          </table>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.dashboardLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
        CRM öffnen →
      </a>
    </div>

    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
  `),
});

export interface CoachChurnRiskAlertData {
  coachName: string;
  athleteName: string;
  athleteEmail: string;
  riskLevel: 'medium' | 'high' | 'critical';
  riskFactors: string[];
  daysSinceLastActivity: number;
  checkInRate: number;
  trainingCompletion: number;
  dashboardLink: string;
}

export const coachChurnRiskAlert = (data: CoachChurnRiskAlertData): { subject: string; html: string } => {
  const riskConfig = {
    medium:   { color: '#F59E0B', label: 'MITTEL', emoji: '⚠️', bg: 'rgba(251, 191, 36, 0.1)', border: 'rgba(251, 191, 36, 0.2)' },
    high:     { color: '#EF4444', label: 'HOCH', emoji: '🔴', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
    critical: { color: '#DC2626', label: 'KRITISCH', emoji: '🚨', bg: 'rgba(220, 38, 38, 0.15)', border: 'rgba(220, 38, 38, 0.3)' },
  };
  const risk = riskConfig[data.riskLevel];

  return {
    subject: `${risk.emoji} Churn-Risiko: ${data.athleteName} (${risk.label})`,
    html: emailShell(`
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 64px; height: 64px; background: ${risk.bg}; border-radius: 16px; display: inline-block; line-height: 64px; margin-bottom: 16px;">
          <span style="font-size: 32px;">${risk.emoji}</span>
        </div>
        <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Churn-Risiko erkannt</h1>
        <p style="color: ${risk.color}; font-size: 14px; font-weight: bold; margin: 0;">Risikostufe: ${risk.label}</p>
      </div>

      <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.coachName},</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
        dein Athlet <strong style="color: #FFFFFF;">${data.athleteName}</strong> zeigt Anzeichen von Desengagement.
        Hier sind die Details:
      </p>

      <div style="${cardStyles} border-color: ${risk.color};">
        <p style="color: ${risk.color}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">RISIKOPROFIL</p>
        <div style="background: #27272A; border-radius: 12px; padding: 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${kpiRow('Athlet', data.athleteName)}
            ${kpiRow('Inaktiv seit', `${data.daysSinceLastActivity} Tagen`, risk.color)}
            ${kpiRow('Check-In-Rate', `${data.checkInRate}%`, data.checkInRate < 30 ? '#EF4444' : '#F59E0B')}
            ${kpiRow('Trainingserfüllung', `${data.trainingCompletion}%`, data.trainingCompletion < 30 ? '#EF4444' : '#F59E0B')}
          </table>
        </div>
      </div>

      <!-- Risk Factors -->
      <div style="margin: 16px 0;">
        <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">🔍 Risikofaktoren</p>
        <div style="background: ${risk.bg}; border: 1px solid ${risk.border}; border-radius: 12px; padding: 16px;">
          ${data.riskFactors.map(f => `<p style="color: ${risk.color}; font-size: 13px; margin: 0 0 6px 0;">• ${f}</p>`).join('')}
        </div>
      </div>

      <!-- Recommended Actions -->
      <div style="${cardStyles}">
        <p style="color: #FFFFFF; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">💡 Empfohlene Maßnahmen</p>
        <div style="background: #18181B; border-radius: 12px; padding: 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="color: #A1A1AA; font-size: 13px; padding: 6px 0;">1. Persönliche Nachricht senden</td></tr>
            <tr><td style="color: #A1A1AA; font-size: 13px; padding: 6px 0;">2. Trainingsplan anpassen (weniger Volumen?)</td></tr>
            <tr><td style="color: #A1A1AA; font-size: 13px; padding: 6px 0;">3. Check-In-Feedback geben</td></tr>
            <tr><td style="color: #A1A1AA; font-size: 13px; padding: 6px 0;">4. Ggf. Anruf/Videocall vorschlagen</td></tr>
          </table>
        </div>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.dashboardLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
          Athlet kontaktieren →
        </a>
      </div>

      <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
        Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
      </p>
    `),
  };
};

// =============================================================================
// ADMIN TEMPLATES
// =============================================================================

export interface AdminWeeklyReportData {
  adminName: string;
  weekNumber: number;
  // Revenue
  weeklyRevenue: string;
  revenueChange: number;
  monthlyRevenue: string;
  monthlyForecast: string;
  // Subscriptions
  totalActiveSubscriptions: number;
  newSubscriptions: number;
  cancellations: number;
  netGrowth: number;
  churnRate: number;
  // Conversion
  newSignups: number;
  freeToPayingConversions: number;
  conversionRate: number;
  // Users
  totalUsers: number;
  totalAthletes: number;
  totalCoaches: number;
  activeUsersThisWeek: number;
  // Coach Performance
  coachPerformance: Array<{
    name: string;
    athletes: number;
    retentionRate: number;
    avgSatisfaction: number;
  }>;
  // Alerts
  alerts: Array<{ type: 'warning' | 'danger' | 'info'; message: string }>;
  dashboardLink: string;
}

export const adminWeeklyReport = (data: AdminWeeklyReportData): { subject: string; html: string } => {
  const revenueColor = data.revenueChange >= 0 ? accentColor : '#EF4444';
  const revenueIcon = data.revenueChange >= 0 ? '📈' : '📉';
  const churnColor = data.churnRate <= 5 ? accentColor : data.churnRate <= 10 ? '#F59E0B' : '#EF4444';

  return {
    subject: `${revenueIcon} Business-Report KW${data.weekNumber} — ${data.weeklyRevenue} Umsatz (${data.revenueChange >= 0 ? '+' : ''}${data.revenueChange}%)`,
    html: emailShell(`
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 64px; height: 64px; background: rgba(168, 85, 247, 0.1); border-radius: 16px; display: inline-block; line-height: 64px; margin-bottom: 16px;">
          <span style="font-size: 32px;">📊</span>
        </div>
        <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Business-Report</h1>
        <p style="color: #71717A; font-size: 14px; margin: 0;">Kalenderwoche ${data.weekNumber}</p>
      </div>

      <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.adminName},</p>
      <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
        hier ist dein wöchentlicher Business-Überblick mit allen wichtigen KPIs.
      </p>

      <!-- Alerts -->
      ${data.alerts.length > 0 ? `
      <div style="margin-bottom: 16px;">
        ${data.alerts.map(a => {
          const alertColor = a.type === 'danger' ? '#EF4444' : a.type === 'warning' ? '#F59E0B' : '#3B82F6';
          const alertBg = a.type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : a.type === 'warning' ? 'rgba(251, 191, 36, 0.1)' : 'rgba(59, 130, 246, 0.1)';
          return `
            <div style="background: ${alertBg}; border: 1px solid ${alertColor}33; border-radius: 10px; padding: 12px 16px; margin-bottom: 8px;">
              <p style="color: ${alertColor}; font-size: 13px; margin: 0;">${a.type === 'danger' ? '🚨' : a.type === 'warning' ? '⚠️' : 'ℹ️'} ${a.message}</p>
            </div>
          `;
        }).join('')}
      </div>
      ` : ''}

      <!-- Revenue -->
      <div style="${cardStyles} border-color: ${revenueColor};">
        <p style="color: ${revenueColor}; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">💰 UMSATZ</p>
        <div style="text-align: center; margin-bottom: 16px;">
          <span style="color: #FFFFFF; font-size: 36px; font-weight: bold;">${data.weeklyRevenue}</span>
          <span style="color: ${revenueColor}; font-size: 16px; font-weight: bold; margin-left: 8px;">${data.revenueChange >= 0 ? '+' : ''}${data.revenueChange}%</span>
          <p style="color: #71717A; font-size: 12px; margin: 4px 0 0 0;">diese Woche</p>
        </div>
        <div style="background: #27272A; border-radius: 12px; padding: 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${kpiRow('Monatsumsatz (bisher)', data.monthlyRevenue)}
            ${kpiRow('Monatsprognose', data.monthlyForecast, accentColor)}
          </table>
        </div>
      </div>

      <!-- Subscriptions -->
      <div style="${cardStyles} border-color: #3B82F6;">
        <p style="color: #3B82F6; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">📦 ABONNEMENTS</p>
        <div style="background: #27272A; border-radius: 12px; padding: 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${kpiRow('Aktive Abos', `${data.totalActiveSubscriptions}`, accentColor)}
            ${kpiRow('Neue Abos', `+${data.newSubscriptions}`, accentColor)}
            ${kpiRow('Kündigungen', `${data.cancellations}`, data.cancellations > 0 ? '#EF4444' : '#71717A')}
            ${kpiRow('Netto-Wachstum', `${data.netGrowth >= 0 ? '+' : ''}${data.netGrowth}`, data.netGrowth >= 0 ? accentColor : '#EF4444')}
            ${kpiRow('Churn-Rate', `${data.churnRate}%`, churnColor)}
          </table>
        </div>
      </div>

      <!-- Conversion -->
      <div style="${cardStyles}">
        <p style="color: #A855F7; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">🎯 CONVERSION</p>
        <div style="background: #27272A; border-radius: 12px; padding: 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${kpiRow('Neue Registrierungen', `${data.newSignups}`)}
            ${kpiRow('Free → Paying', `${data.freeToPayingConversions}`)}
            ${kpiRow('Conversion-Rate', `${data.conversionRate}%`, data.conversionRate >= 5 ? accentColor : '#F59E0B')}
          </table>
        </div>
      </div>

      <!-- Users -->
      <div style="${cardStyles}">
        <p style="color: #71717A; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">👥 NUTZER</p>
        <div style="background: #27272A; border-radius: 12px; padding: 16px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${kpiRow('Gesamt', `${data.totalUsers}`)}
            ${kpiRow('Athleten', `${data.totalAthletes}`)}
            ${kpiRow('Coaches', `${data.totalCoaches}`, '#3B82F6')}
            ${kpiRow('Aktiv diese Woche', `${data.activeUsersThisWeek}`, accentColor)}
          </table>
        </div>
      </div>

      <!-- Coach Performance -->
      ${data.coachPerformance.length > 0 ? `
      <div style="${cardStyles} border-color: #3B82F6;">
        <p style="color: #3B82F6; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">🏋️ COACH-PERFORMANCE</p>
        ${data.coachPerformance.map(c => {
          const retColor = c.retentionRate >= 80 ? accentColor : c.retentionRate >= 60 ? '#F59E0B' : '#EF4444';
          return `
            <div style="background: #27272A; border-radius: 10px; padding: 12px 16px; margin-bottom: 8px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="color: #FFFFFF; font-size: 14px; font-weight: bold;">${c.name}</td>
                  <td align="right" style="color: #71717A; font-size: 12px;">${c.athletes} Athleten</td>
                </tr>
                <tr>
                  <td style="color: #71717A; font-size: 12px; padding-top: 4px;">Retention: <strong style="color: ${retColor};">${c.retentionRate}%</strong></td>
                  <td align="right" style="color: #71717A; font-size: 12px; padding-top: 4px;">Zufriedenheit: <strong style="color: ${c.avgSatisfaction >= 4 ? accentColor : '#F59E0B'};">${c.avgSatisfaction.toFixed(1)}/5</strong></td>
                </tr>
              </table>
            </div>
          `;
        }).join('')}
      </div>
      ` : ''}

      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.dashboardLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
          Admin-Dashboard →
        </a>
      </div>

      <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
        Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
      </p>
    `),
  };
};

export interface AdminChurnAlertData {
  adminName: string;
  period: string;
  cancellationsCount: number;
  previousPeriodCount: number;
  changePercent: number;
  cancellations: Array<{
    athleteName: string;
    coachName: string;
    productName: string;
    reason?: string;
    date: string;
  }>;
  affectedCoaches: Array<{ name: string; lostAthletes: number }>;
  dashboardLink: string;
}

export const adminChurnAlert = (data: AdminChurnAlertData): { subject: string; html: string } => ({
  subject: `🚨 Churn-Alert: ${data.cancellationsCount} Kündigungen (${data.changePercent >= 0 ? '+' : ''}${data.changePercent}% vs. Vorperiode)`,
  html: emailShell(`
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="width: 64px; height: 64px; background: rgba(239, 68, 68, 0.1); border-radius: 16px; display: inline-block; line-height: 64px; margin-bottom: 16px;">
        <span style="font-size: 32px;">🚨</span>
      </div>
      <h1 style="color: #FFFFFF; font-size: 24px; font-weight: bold; margin: 0 0 8px 0;">Churn-Alert</h1>
      <p style="color: #EF4444; font-size: 14px; font-weight: bold; margin: 0;">Erhöhte Kündigungsrate erkannt</p>
    </div>

    <p style="color: #FFFFFF; font-size: 16px; margin: 0 0 24px 0;">Hallo ${data.adminName},</p>
    <p style="color: #A1A1AA; font-size: 14px; margin: 0 0 24px 0;">
      im Zeitraum <strong style="color: #FFFFFF;">${data.period}</strong> gab es
      <strong style="color: #EF4444;">${data.cancellationsCount} Kündigungen</strong>
      (Vorperiode: ${data.previousPeriodCount}).
    </p>

    <div style="${cardStyles} border-color: #EF4444;">
      <p style="color: #EF4444; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">KÜNDIGUNGEN</p>
      ${data.cancellations.slice(0, 10).map(c => `
        <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid #3F3F46; border-radius: 10px; padding: 12px; margin-bottom: 8px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="color: #FFFFFF; font-size: 13px; font-weight: bold;">${c.athleteName}</td>
              <td align="right" style="color: #71717A; font-size: 12px;">${c.date}</td>
            </tr>
            <tr>
              <td style="color: #71717A; font-size: 12px; padding-top: 2px;">Coach: ${c.coachName} • ${c.productName}</td>
              <td align="right" style="color: #EF4444; font-size: 11px; padding-top: 2px;">${c.reason || '—'}</td>
            </tr>
          </table>
        </div>
      `).join('')}
      ${data.cancellations.length > 10 ? `<p style="color: #71717A; font-size: 12px; text-align: center; margin: 8px 0 0 0;">+ ${data.cancellations.length - 10} weitere</p>` : ''}
    </div>

    <!-- Affected Coaches -->
    ${data.affectedCoaches.length > 0 ? `
    <div style="${cardStyles}">
      <p style="color: #F59E0B; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">BETROFFENE COACHES</p>
      <div style="background: #27272A; border-radius: 12px; padding: 16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${data.affectedCoaches.map(c => kpiRow(c.name, `${c.lostAthletes} verloren`, '#EF4444')).join('')}
        </table>
      </div>
    </div>
    ` : ''}

    <div style="text-align: center; margin: 32px 0;">
      <a href="${data.dashboardLink}" style="display: inline-block; background: ${accentColor}; color: #000000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 14px; font-weight: bold;">
        CRM öffnen →
      </a>
    </div>

    <p style="color: #A1A1AA; font-size: 14px; margin: 32px 0 0 0; text-align: center;">
      Sportliche Grüße,<br><strong style="color: #FFFFFF;">Dein Greenlight Fitness Team</strong>
    </p>
  `),
});

// =============================================================================
// Template Map
// =============================================================================

export const reattentionTemplates = {
  // Athlete
  athlete_training_reminder: athleteTrainingReminder,
  athlete_checkin_reminder: athleteCheckInReminder,
  athlete_inactivity_alert: athleteInactivityAlert,
  athlete_weekly_progress: athleteWeeklyProgress,
  // Coach
  coach_weekly_summary: coachWeeklySummary,
  coach_churn_risk_alert: coachChurnRiskAlert,
  // Admin
  admin_weekly_report: adminWeeklyReport,
  admin_churn_alert: adminChurnAlert,
};

export type ReattentionEmailType = keyof typeof reattentionTemplates;
