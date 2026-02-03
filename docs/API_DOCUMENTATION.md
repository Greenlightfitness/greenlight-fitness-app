# Greenlight Fitness - API & Prozess-Dokumentation

> **⚠️ WICHTIG:** Dieses Dokument enthält kritische Geschäftsprozesse und rechtliche Anforderungen. Vor jeder Änderung an den beschriebenen Systemen MUSS diese Dokumentation konsultiert werden.

---

## Inhaltsverzeichnis

1. [Kritische Prozesse (Priorität 1)](#kritische-prozesse-priorität-1)
2. [E-Mail-System (Resend)](#e-mail-system-resend)
3. [Stripe Integration](#stripe-integration)
4. [Supabase API](#supabase-api)
5. [Authentifizierung](#authentifizierung)
6. [Coaching-System](#coaching-system)
7. [DSGVO-Compliance](#dsgvo-compliance)

---

## Kritische Prozesse (Priorität 1)

### 🔴 Preisänderungen bei Abonnements

**Rechtliche Anforderung:** Kunden müssen 30 Tage VOR einer Preiserhöhung informiert werden.

| Schritt | Aktion | E-Mail erforderlich? | Automatisiert? |
|---------|--------|---------------------|----------------|
| 1 | Admin ändert Preis in App | ❌ | - |
| 2 | Warnung mit Checkliste erscheint | ❌ | ✅ |
| 3 | **Kunde informieren** | ✅ `price_change_notice` | ❌ Manuell |
| 4 | 30 Tage warten | ❌ | - |
| 5 | Preis in Stripe anpassen | ❌ | ❌ Manuell |
| 6 | Bestätigung an Kunde | ✅ `price_change_confirmed` | 🔄 TODO |

**Siehe:** [docs/STRIPE_PRICE_CHANGES.md](./STRIPE_PRICE_CHANGES.md)

---

### 🔴 Kündigung / Sonderkündigungsrecht

**Trigger:** Preiserhöhung, AGB-Änderung, Leistungsänderung

| Szenario | E-Mail | Frist | Automatisiert? |
|----------|--------|-------|----------------|
| Preiserhöhung angekündigt | `cancellation_right_notice` | Bis 1 Tag vor Änderung | ❌ Manuell |
| Kunde kündigt über Portal | `cancellation_confirmed` | Sofort | ✅ Stripe Webhook |
| Abo läuft aus | `subscription_ended` | Bei Ablauf | ✅ Stripe Webhook |

---

### 🟡 Coaching-Anfragen

| Schritt | Aktion | E-Mail | Automatisiert? |
|---------|--------|--------|----------------|
| 1 | Athlet kauft Coaching-Paket | `coaching_request_athlete` | ✅ |
| 2 | Coach erhält Benachrichtigung | `coaching_request_coach` | ✅ |
| 3 | Coach genehmigt/ablehnt | `coaching_approved` / `coaching_rejected` | ✅ |
| 4 | Beziehung startet | `coaching_started` | ✅ |

---

### 🟡 Account-Verwaltung

| Aktion | E-Mail | Automatisiert? |
|--------|--------|----------------|
| Registrierung | `welcome` | ✅ Supabase Auth |
| Passwort vergessen | `password_reset` | ✅ Supabase Auth |
| E-Mail-Änderung | `email_change_confirm` | ✅ Supabase Auth |
| Account gelöscht | `account_deleted` | 🔄 TODO |

---

## E-Mail-System (Resend)

### Konfiguration

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@greenlight-fitness.de
RESEND_REPLY_TO=support@greenlight-fitness.de
```

### E-Mail-Typen Übersicht

| ID | Name | Trigger | Priorität |
|----|------|---------|-----------|
| `price_change_notice` | Preisänderungs-Ankündigung | Admin ändert Preis | 🔴 Kritisch |
| `cancellation_right_notice` | Sonderkündigungsrecht | Preiserhöhung | 🔴 Kritisch |
| `cancellation_confirmed` | Kündigungsbestätigung | Stripe Webhook | 🔴 Kritisch |
| `coaching_request_coach` | Coaching-Anfrage (Coach) | Kauf abgeschlossen | 🟡 Wichtig |
| `coaching_approved` | Coaching genehmigt | Coach Aktion | 🟡 Wichtig |
| `coaching_rejected` | Coaching abgelehnt | Coach Aktion | 🟡 Wichtig |
| `welcome` | Willkommen | Registrierung | 🟢 Standard |
| `payment_failed` | Zahlung fehlgeschlagen | Stripe Webhook | 🟡 Wichtig |
| `payment_success` | Zahlung erfolgreich | Stripe Webhook | 🟢 Standard |

### API Endpunkt

```typescript
// api/send-email.ts
POST /api/send-email
{
  "type": "price_change_notice",
  "to": "kunde@example.com",
  "data": {
    "customerName": "Max Mustermann",
    "productName": "Premium Coaching",
    "oldPrice": "99,00 €",
    "newPrice": "119,00 €",
    "effectiveDate": "01.04.2026",
    "cancellationDeadline": "31.03.2026",
    "portalLink": "https://..."
  }
}
```

---

## Stripe Integration

### Webhooks

| Event | Aktion | E-Mail |
|-------|--------|--------|
| `checkout.session.completed` | Kauf verarbeiten | `payment_success` |
| `customer.subscription.updated` | Abo aktualisiert | - |
| `customer.subscription.deleted` | Abo gekündigt | `cancellation_confirmed` |
| `invoice.payment_failed` | Zahlung fehlgeschlagen | `payment_failed` |
| `invoice.paid` | Rechnung bezahlt | - |

### API Endpunkte

| Endpunkt | Beschreibung |
|----------|--------------|
| `POST /api/create-checkout-session` | Checkout starten |
| `POST /api/create-portal-session` | Kundenportal öffnen |
| `POST /api/create-stripe-product` | Produkt in Stripe anlegen |
| `GET /api/get-customer-data` | Kundendaten abrufen |

### ⚠️ Wichtige Hinweise

1. **NIEMALS** `sk_live_` Keys ohne doppelte Bestätigung verwenden
2. Preisänderungen in Stripe sind **NICHT** mit der App synchronisiert
3. Bestehende Abos behalten ihren alten Preis bis zur manuellen Änderung

---

## Supabase API

### Tabellen-Übersicht

| Tabelle | Beschreibung | RLS |
|---------|--------------|-----|
| `profiles` | Benutzerprofile | ✅ |
| `products` | Produkte/Pakete | ✅ |
| `coaching_relationships` | Coach-Athlet Zuordnung | ✅ |
| `coaching_approvals` | Coaching-Genehmigungen | ✅ |
| `plans` | Trainingspläne | ✅ |
| `daily_wellness` | Tägliche Wellness-Daten | ✅ |
| `workout_logs` | Training-Logs | ✅ |

### Wichtige Service-Funktionen

```typescript
// Coach-Athleten Management
getActiveCoachingRelationships(coachId)  // Zugeordnete Athleten
getAllAthletes()                          // Alle Athleten (Admin)
assignAthleteToCoach(athleteId, coachId)  // Zuweisung

// Coaching-Genehmigungen
getPendingCoachingApprovals(coachId)
approveCoaching(approvalId)
rejectCoaching(approvalId, reason)
```

---

## Authentifizierung

### Rollen

| Rolle | Beschreibung | Berechtigungen |
|-------|--------------|----------------|
| `ATHLETE` | Normaler Nutzer | Eigene Daten, Training |
| `COACH` | Trainer | + Zugeordnete Athleten |
| `ADMIN` | Administrator | Vollzugriff |

### Geschützte Routen

| Route | Mindest-Rolle |
|-------|---------------|
| `/dashboard` | ATHLETE |
| `/planner` | ATHLETE |
| `/admin/users` | ADMIN |
| `/admin/products` | ADMIN |

---

## Coaching-System

### Beziehungs-Lebenszyklus

```
[Kauf] → [Pending Approval] → [Active] → [Ended]
                ↓
           [Rejected]
```

### Status-Codes

| Status | Beschreibung |
|--------|--------------|
| `PENDING` | Wartet auf Coach-Genehmigung |
| `ACTIVE` | Aktive Beziehung |
| `ENDED` | Beendet |
| `REJECTED` | Abgelehnt |

---

## DSGVO-Compliance

### Pflichtangaben in E-Mails

Jede E-Mail MUSS enthalten:
- [ ] Absender mit vollständigem Impressum-Link
- [ ] Abmelde-Link (für Marketing-Mails)
- [ ] Datenschutz-Link
- [ ] Kontaktmöglichkeit

### Aufbewahrungsfristen

| Datentyp | Frist | Grund |
|----------|-------|-------|
| Rechnungen | 10 Jahre | Steuerrecht |
| Verträge | 6 Jahre | HGB |
| Nutzerdaten nach Löschung | 30 Tage | Backup |
| Wellness-Daten | Bis Löschung | Nutzer-Kontrolle |

### Löschrechte

Bei Account-Löschung werden gelöscht:
- Profildaten
- Wellness-Daten
- Training-Logs
- Coaching-Beziehungen

**NICHT gelöscht** (rechtliche Pflicht):
- Rechnungen
- Zahlungshistorie

---

## Checkliste: Vor jedem Release

- [ ] Alle kritischen E-Mails implementiert?
- [ ] DSGVO-Texte aktuell?
- [ ] Stripe Webhooks getestet?
- [ ] RLS Policies für neue Tabellen?
- [ ] Dokumentation aktualisiert?

---

*Letzte Aktualisierung: Februar 2026*
