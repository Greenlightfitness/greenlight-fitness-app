# E-Mail & Sicherheitskonzept

> **⚠️ KRITISCH:** Dieses Dokument definiert alle E-Mail-Trigger und Sicherheitsanforderungen. Änderungen an E-Mail-Logik MÜSSEN hier dokumentiert werden.

---

## E-Mail-Trigger Übersicht

### 🔴 Kritische E-Mails (Rechtlich erforderlich)

| # | E-Mail ID | Trigger / Auslöser | Warum wichtig? | Status |
|---|-----------|-------------------|----------------|--------|
| 1 | `price_change_notice` | Admin ändert Abo-Preis nach oben | **DSGVO:** 30 Tage Vorlauf, Sonderkündigungsrecht | 🔄 TODO |
| 2 | `cancellation_right_notice` | Wesentliche Vertragsänderung | **BGB:** Sonderkündigungsrecht informieren | 🔄 TODO |
| 3 | `cancellation_confirmed` | Kunde kündigt Abo | **Nachweis:** Kündigungsbestätigung | 🔄 TODO |
| 4 | `subscription_ended` | Abo läuft aus / endet | **Info:** Zugang endet | 🔄 TODO |
| 5 | `data_deletion_confirm` | Account-Löschung | **DSGVO Art. 17:** Bestätigung der Löschung | 🔄 TODO |

### 🟡 Wichtige E-Mails (Business-kritisch)

| # | E-Mail ID | Trigger / Auslöser | Warum wichtig? | Status |
|---|-----------|-------------------|----------------|--------|
| 6 | `coaching_request_coach` | Athlet kauft Coaching | Coach muss reagieren | 🔄 TODO |
| 7 | `coaching_approved` | Coach genehmigt | Athlet kann starten | 🔄 TODO |
| 8 | `coaching_rejected` | Coach lehnt ab | Athlet braucht Info + Refund | 🔄 TODO |
| 9 | `payment_failed` | Stripe: invoice.payment_failed | Kunde muss handeln | 🔄 TODO |
| 10 | `payment_success` | Stripe: checkout.session.completed | Kaufbestätigung | 🔄 TODO |

### 🟢 Standard E-Mails

| # | E-Mail ID | Trigger / Auslöser | Warum wichtig? | Status |
|---|-----------|-------------------|----------------|--------|
| 11 | `welcome` | Registrierung abgeschlossen | Onboarding | ✅ Supabase |
| 12 | `password_reset` | Passwort vergessen | Account-Zugang | ✅ Supabase |
| 13 | `email_changed` | E-Mail-Adresse geändert | Sicherheit | ✅ Supabase |

---

## Trigger-Diagramm

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER ACTIONS                                  │
└─────────────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
   ┌─────────┐         ┌──────────┐        ┌───────────┐
   │ Sign Up │         │ Purchase │        │  Cancel   │
   └────┬────┘         └────┬─────┘        └─────┬─────┘
        │                   │                    │
        ▼                   ▼                    ▼
   ┌─────────┐      ┌─────────────────┐   ┌─────────────────┐
   │ welcome │      │ payment_success │   │ cancellation_   │
   │  email  │      │     email       │   │ confirmed email │
   └─────────┘      └────────┬────────┘   └─────────────────┘
                             │
                    ┌────────┴────────┐
                    │ Is Coaching?    │
                    └────────┬────────┘
                        YES  │
                             ▼
                    ┌─────────────────┐
                    │ coaching_request│
                    │  _coach email   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
       ┌─────────────┐              ┌─────────────┐
       │  APPROVED   │              │  REJECTED   │
       └──────┬──────┘              └──────┬──────┘
              │                            │
              ▼                            ▼
       ┌─────────────┐              ┌─────────────┐
       │ coaching_   │              │ coaching_   │
       │ approved    │              │ rejected    │
       └─────────────┘              └─────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       ADMIN ACTIONS                                  │
└─────────────────────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
   ┌──────────────┐            ┌───────────────┐
   │ Price Change │            │ AGB/Terms     │
   │   (Increase) │            │   Change      │
   └──────┬───────┘            └───────┬───────┘
          │                            │
          ▼                            ▼
   ┌──────────────┐            ┌───────────────────┐
   │price_change_ │            │ cancellation_     │
   │notice email  │            │ right_notice email│
   └──────────────┘            └───────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      STRIPE WEBHOOKS                                 │
└─────────────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
   ┌──────────┐       ┌────────────┐      ┌─────────────┐
   │ invoice. │       │ customer.  │      │ checkout.   │
   │ payment_ │       │ subscription│     │ session.    │
   │ failed   │       │ .deleted   │      │ completed   │
   └────┬─────┘       └──────┬─────┘      └──────┬──────┘
        │                    │                   │
        ▼                    ▼                   ▼
   ┌──────────┐       ┌────────────┐      ┌─────────────┐
   │ payment_ │       │subscription│      │ payment_    │
   │ failed   │       │ _ended     │      │ success     │
   │ email    │       │ email      │      │ email       │
   └──────────┘       └────────────┘      └─────────────┘
```

---

## E-Mail-Templates (DSGVO-konform)

### Pflicht-Elemente in JEDER E-Mail

```
✅ Absender: Greenlight Fitness
✅ Impressum-Link
✅ Datenschutz-Link  
✅ Kontakt-E-Mail
✅ Kein Tracking ohne Einwilligung
✅ Abmelde-Link (nur Marketing)
```

---

## 1. Preisänderungs-Ankündigung

**ID:** `price_change_notice`  
**Trigger:** Admin erhöht Abo-Preis  
**Frist:** MUSS 30+ Tage vor Änderung versendet werden  
**Rechtliche Grundlage:** DSGVO, BGB §314

```
Betreff: Wichtig: Änderung deines {productName}-Abonnements

Hallo {firstName},

wir möchten dich über eine bevorstehende Änderung deines Abonnements informieren.

┌────────────────────────────────────────────────┐
│  PREISÄNDERUNG                                 │
├────────────────────────────────────────────────┤
│  Produkt:     {productName}                    │
│  Alter Preis: {oldPrice} / {interval}          │
│  Neuer Preis: {newPrice} / {interval}          │
│  Gültig ab:   {effectiveDate}                  │
└────────────────────────────────────────────────┘

📋 DEIN SONDERKÜNDIGUNGSRECHT

Aufgrund dieser Preisänderung hast du das Recht, dein Abonnement 
bis zum {cancellationDeadline} zu kündigen.

→ Zur Kündigung: {portalLink}

Wenn du nichts unternimmst, wird dein Abonnement ab dem 
{effectiveDate} zum neuen Preis fortgeführt.

Bei Fragen stehen wir dir gerne zur Verfügung.

Sportliche Grüße,
Dein Greenlight Fitness Team

---
Greenlight Fitness | Impressum | Datenschutz
```

---

## 2. Kündigungsbestätigung

**ID:** `cancellation_confirmed`  
**Trigger:** Stripe Webhook `customer.subscription.deleted`  
**Rechtliche Grundlage:** Nachweis der Kündigung

```
Betreff: Bestätigung deiner Kündigung

Hallo {firstName},

wir bestätigen hiermit die Kündigung deines Abonnements.

┌────────────────────────────────────────────────┐
│  KÜNDIGUNGSBESTÄTIGUNG                         │
├────────────────────────────────────────────────┤
│  Produkt:          {productName}               │
│  Gekündigt am:     {cancellationDate}          │
│  Zugang bis:       {accessUntilDate}           │
│  Kündigungs-Nr:    {cancellationId}            │
└────────────────────────────────────────────────┘

Du hast noch bis zum {accessUntilDate} vollen Zugriff auf alle 
Funktionen deines Pakets.

Wir würden uns freuen, dich in Zukunft wieder begrüßen zu dürfen!

Sportliche Grüße,
Dein Greenlight Fitness Team

---
Greenlight Fitness | Impressum | Datenschutz
```

---

## 3. Coaching-Anfrage (an Coach)

**ID:** `coaching_request_coach`  
**Trigger:** Athlet schließt Coaching-Kauf ab  

```
Betreff: 🏋️ Neue Coaching-Anfrage von {athleteName}

Hallo {coachName},

du hast eine neue Coaching-Anfrage erhalten!

┌────────────────────────────────────────────────┐
│  NEUE ANFRAGE                                  │
├────────────────────────────────────────────────┤
│  Athlet:       {athleteName}                   │
│  E-Mail:       {athleteEmail}                  │
│  Paket:        {productName}                   │
│  Angefragt am: {requestDate}                   │
└────────────────────────────────────────────────┘

Bitte prüfe die Anfrage in deinem Dashboard und entscheide, 
ob du den Athleten annehmen möchtest.

→ Zum Dashboard: {dashboardLink}

⏰ Bitte antworte innerhalb von 48 Stunden.

Sportliche Grüße,
Dein Greenlight Fitness Team

---
Greenlight Fitness | Impressum | Datenschutz
```

---

## 4. Coaching genehmigt (an Athlet)

**ID:** `coaching_approved`  
**Trigger:** Coach klickt "Genehmigen"  

```
Betreff: ✅ Dein Coaching wurde genehmigt!

Hallo {athleteName},

großartige Neuigkeiten! {coachName} hat deine Coaching-Anfrage angenommen.

┌────────────────────────────────────────────────┐
│  COACHING GESTARTET                            │
├────────────────────────────────────────────────┤
│  Coach:        {coachName}                     │
│  Paket:        {productName}                   │
│  Start:        {startDate}                     │
└────────────────────────────────────────────────┘

🚀 NÄCHSTE SCHRITTE

1. Öffne dein Dashboard
2. Vervollständige dein Athleten-Profil
3. Warte auf deinen ersten Trainingsplan

→ Zum Dashboard: {dashboardLink}

Sportliche Grüße,
Dein Greenlight Fitness Team

---
Greenlight Fitness | Impressum | Datenschutz
```

---

## 5. Coaching abgelehnt (an Athlet)

**ID:** `coaching_rejected`  
**Trigger:** Coach klickt "Ablehnen"  

```
Betreff: Information zu deiner Coaching-Anfrage

Hallo {athleteName},

leider konnte {coachName} deine Coaching-Anfrage nicht annehmen.

┌────────────────────────────────────────────────┐
│  ANFRAGE NICHT ANGENOMMEN                      │
├────────────────────────────────────────────────┤
│  Grund:        {rejectionReason}               │
└────────────────────────────────────────────────┘

💰 ERSTATTUNG

Deine Zahlung wird innerhalb von 5-10 Werktagen erstattet.

🔄 ALTERNATIVEN

Du kannst gerne ein anderes Coaching-Paket buchen oder 
dich an unseren Support wenden.

→ Zum Shop: {shopLink}
→ Support: support@greenlight-fitness.de

Sportliche Grüße,
Dein Greenlight Fitness Team

---
Greenlight Fitness | Impressum | Datenschutz
```

---

## 6. Zahlung fehlgeschlagen

**ID:** `payment_failed`  
**Trigger:** Stripe Webhook `invoice.payment_failed`  

```
Betreff: ⚠️ Zahlung fehlgeschlagen - Aktion erforderlich

Hallo {firstName},

wir konnten deine letzte Zahlung leider nicht einziehen.

┌────────────────────────────────────────────────┐
│  ZAHLUNGSPROBLEM                               │
├────────────────────────────────────────────────┤
│  Produkt:      {productName}                   │
│  Betrag:       {amount}                        │
│  Fällig seit:  {dueDate}                       │
└────────────────────────────────────────────────┘

🔧 SO BEHEBST DU DAS PROBLEM

1. Prüfe deine Zahlungsmethode
2. Stelle sicher, dass genug Guthaben vorhanden ist
3. Aktualisiere ggf. deine Kartendaten

→ Zahlungsmethode aktualisieren: {portalLink}

⏰ Bitte aktualisiere deine Daten innerhalb von 7 Tagen, 
   um eine Unterbrechung zu vermeiden.

Sportliche Grüße,
Dein Greenlight Fitness Team

---
Greenlight Fitness | Impressum | Datenschutz
```

---

## 7. Account-Löschung bestätigt

**ID:** `data_deletion_confirm`  
**Trigger:** Account-Löschung durchgeführt  
**Rechtliche Grundlage:** DSGVO Art. 17

```
Betreff: Bestätigung: Dein Account wurde gelöscht

Hallo {firstName},

hiermit bestätigen wir die Löschung deines Accounts gemäß 
deiner Anfrage.

┌────────────────────────────────────────────────┐
│  LÖSCHBESTÄTIGUNG                              │
├────────────────────────────────────────────────┤
│  Gelöscht am:   {deletionDate}                 │
│  Referenz-Nr:   {deletionId}                   │
└────────────────────────────────────────────────┘

📋 GELÖSCHTE DATEN

• Profildaten und Einstellungen
• Trainingspläne und Logs
• Wellness-Daten
• Coaching-Beziehungen

📋 AUFBEWAHRTE DATEN (Gesetzliche Pflicht)

• Rechnungen (10 Jahre - Steuerrecht)
• Zahlungshistorie (6 Jahre - HGB)

Bei Fragen wende dich an: datenschutz@greenlight-fitness.de

---
Greenlight Fitness | Impressum | Datenschutz
```

---

## Implementierungs-Status

| E-Mail | React Component | API Route | Getestet |
|--------|-----------------|-----------|----------|
| price_change_notice | 🔄 TODO | 🔄 TODO | ❌ |
| cancellation_right_notice | 🔄 TODO | 🔄 TODO | ❌ |
| cancellation_confirmed | 🔄 TODO | 🔄 TODO | ❌ |
| coaching_request_coach | 🔄 TODO | 🔄 TODO | ❌ |
| coaching_approved | 🔄 TODO | 🔄 TODO | ❌ |
| coaching_rejected | 🔄 TODO | 🔄 TODO | ❌ |
| payment_failed | 🔄 TODO | 🔄 TODO | ❌ |
| data_deletion_confirm | 🔄 TODO | 🔄 TODO | ❌ |

---

## Sicherheitsanforderungen

### E-Mail-Versand

- [ ] Rate Limiting: Max 10 E-Mails/Minute pro Empfänger
- [ ] Keine sensiblen Daten im Betreff
- [ ] Alle Links mit HTTPS
- [ ] Token in Links: Einmalig verwendbar, 24h gültig

### Logging

Jeder E-Mail-Versand MUSS geloggt werden:
- Empfänger (gehashed)
- E-Mail-Typ
- Timestamp
- Status (sent/failed)
- Message-ID (von Resend)

### Fehlerbehandlung

Bei fehlgeschlagenem Versand:
1. 3 Retry-Versuche (1min, 5min, 30min)
2. Nach 3 Fehlern: Admin-Benachrichtigung
3. Kritische E-Mails: Manueller Fallback

---

*Letzte Aktualisierung: Februar 2026*
