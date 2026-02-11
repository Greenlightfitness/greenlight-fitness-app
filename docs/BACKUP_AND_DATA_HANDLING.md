# Backup, Datenhandhabung & DSGVO-konforme Löschung

**Greenlight Fitness — Betreiber-Handbuch**  
Stand: Februar 2026 | Version 1.0

---

## Inhaltsverzeichnis

1. [Übersicht](#1-übersicht)
2. [Datenarchitektur](#2-datenarchitektur)
3. [Rechtsversions-System](#3-rechtsversions-system)
4. [Purchase Ledger (Doppelte Buchführung)](#4-purchase-ledger-doppelte-buchführung)
5. [DSGVO-konforme Löschung durch Anonymisierung](#5-dsgvo-konforme-löschung-durch-anonymisierung)
6. [Backup-Strategie](#6-backup-strategie)
7. [Aufbewahrungsfristen](#7-aufbewahrungsfristen)
8. [Notfall-Wiederherstellung](#8-notfall-wiederherstellung)
9. [Checklisten für den Betreiber](#9-checklisten-für-den-betreiber)
10. [Kontakt & Verantwortlichkeiten](#10-kontakt--verantwortlichkeiten)

---

## 1. Übersicht

Dieses Dokument beschreibt die Datensicherungs-, Archivierungs- und Löschstrategie
der Greenlight Fitness Plattform. Es richtet sich an den **Plattform-Betreiber** und
dient als internes Handbuch für:

- **§147 AO / §257 HGB**: Steuerliche Aufbewahrungspflichten (10 Jahre)
- **DSGVO Art. 5(1)(e)**: Speicherbegrenzung
- **DSGVO Art. 17**: Recht auf Löschung / Recht auf Vergessenwerden
- **DSGVO Art. 32**: Sicherheit der Verarbeitung
- **DSGVO Art. 30**: Verarbeitungsverzeichnis

### Grundprinzipien

| Prinzip | Umsetzung |
|---------|-----------|
| **Doppelte Absicherung** | Stripe + eigener Purchase Ledger |
| **Anonymisierung statt Löschung** | PII wird entfernt, Finanzdaten bleiben |
| **Versionierte Rechtstexte** | `legal_versions` Tabelle mit Consent-Tracking |
| **Immutable Logs** | Purchase Ledger ist append-only |
| **Automatisierte Backups** | Supabase Point-in-Time Recovery (PITR) |

---

## 2. Datenarchitektur

### 2.1 Datenkategorien und Speicherorte

```
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                 │
├─────────────────────┬───────────────────────────────────┤
│ PERSONENBEZOGEN     │ FINANZIELL (§147 AO)              │
│ ─────────────────── │ ──────────────────────────────── │
│ profiles            │ purchase_ledger (IMMUTABLE)        │
│ consent_logs        │ purchases                         │
│ audit_logs          │ subscriptions                     │
│ activities          │ invoices                          │
│ attentions          │                                   │
│ chat_messages       │ ARCHIV                            │
│ coaching_rel.       │ ──────────────────────────────── │
│ notification_prefs  │ archived_users                    │
│                     │ legal_versions                    │
├─────────────────────┴───────────────────────────────────┤
│                    STRIPE (extern)                       │
│ ──────────────────────────────────────────────────────  │
│ Customers, Subscriptions, Invoices, PaymentIntents       │
│ (PCI DSS Level 1 — eigene Backups durch Stripe)         │
├─────────────────────────────────────────────────────────┤
│                    SUPABASE STORAGE                      │
│ ──────────────────────────────────────────────────────  │
│ Profilbilder, Uploads                                    │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Neue Compliance-Tabellen

| Tabelle | Zweck | Retention |
|---------|-------|-----------|
| `legal_versions` | Versionierung aller Rechtstexte (DSE, AGB, Transparenz, Impressum) | Unbegrenzt |
| `purchase_ledger` | Immutables Finanz-Logbuch (redundant zu Stripe) | 10 Jahre (§147 AO) |
| `archived_users` | Anonymisierte Nutzer-Archive nach Löschung | 10 Jahre nach letzter Transaktion |

---

## 3. Rechtsversions-System

### 3.1 Funktionsweise

Jede Änderung an Rechtstexten (Datenschutzerklärung, AGB, Transparenzerklärung, Impressum)
wird in der `legal_versions` Tabelle versioniert:

```sql
-- Neue Version eines Rechtstexts anlegen
INSERT INTO legal_versions (document_type, version, title, summary_of_changes, effective_date, is_current)
VALUES ('PRIVACY', '3.0', 'Datenschutzerklärung', 
        'Neuer Auftragsverarbeiter XYZ hinzugefügt', 
        '2026-06-01', false);

-- Alte Version deaktivieren, neue aktivieren (am Gültigkeitstag)
UPDATE legal_versions SET is_current = false WHERE document_type = 'PRIVACY' AND is_current = true;
UPDATE legal_versions SET is_current = true WHERE document_type = 'PRIVACY' AND version = '3.0';
```

### 3.2 Consent-Verknüpfung

Beim Registrieren wird die aktuelle Version im `consent_logs` gespeichert:

```
consent_logs.consent_version = '2.0'  → verweist auf legal_versions.version
```

So ist jederzeit nachweisbar, welcher Version ein Nutzer zugestimmt hat (Art. 7 DSGVO Nachweispflicht).

### 3.3 Workflow bei Rechtstext-Änderungen

1. **Neuen Eintrag in `legal_versions`** erstellen mit `is_current = false`
2. **Änderungen in `Legal.tsx`** implementieren (Versionsnummer + Datum aktualisieren)
3. **E-Mail an alle Nutzer** senden (mindestens 30 Tage vor Inkrafttreten)
4. **Am Gültigkeitstag**: `is_current` umschalten
5. **Bei nächstem Login**: Nutzer über neue Version informieren (optional: Re-Consent einholen)

### 3.4 Aktuelle Versionen

| Dokument | Version | Gültig ab |
|----------|---------|-----------|
| Datenschutzerklärung | 2.0 | 01.02.2026 |
| AGB | 2.0 | 01.02.2026 |
| Transparenzerklärung | 1.0 | 01.02.2026 |
| Impressum | 2.0 | 01.02.2026 |

---

## 4. Purchase Ledger (Doppelte Buchführung)

### 4.1 Warum doppelt?

Stripe ist der primäre Zahlungsdienstleister. Der `purchase_ledger` dient als:

- **Redundante Sicherung** unabhängig von Stripe
- **Immutables Finanz-Logbuch** für §147 AO (10 Jahre Aufbewahrung)
- **Schnellerer Zugriff** auf Transaktionshistorie ohne Stripe-API-Calls
- **Anonymisierbar** ohne Datenverlust (user_id → user_hash)

### 4.2 Erfasste Events

| Event | Trigger | Daten |
|-------|---------|-------|
| `CHECKOUT_COMPLETED` | Stripe `checkout.session.completed` | Betrag, Produkt, User, Stripe-IDs |
| `SUBSCRIPTION_CREATED` | Stripe `customer.subscription.created` | Plan, Betrag, Periode |
| `SUBSCRIPTION_UPDATED` | Stripe `customer.subscription.updated` | Status-Änderung |
| `SUBSCRIPTION_CANCELED` | Stripe `customer.subscription.deleted` | Kündigungsdatum |
| `INVOICE_PAID` | Stripe `invoice.paid` | Betrag, MwSt., Rechnungs-URL |
| `INVOICE_FAILED` | Stripe `invoice.payment_failed` | Fehlversuch-Zähler |

### 4.3 Datenfluss

```
Stripe Event → stripe-webhook.ts → purchases (operativ)
                                  → purchase_ledger (Archiv, immutable)
                                  → invoices (operativ)
                                  → subscriptions (operativ)
```

### 4.4 Abgleich mit Stripe

**Empfehlung:** Monatlicher Abgleich zwischen `purchase_ledger` und Stripe-Dashboard:

```sql
-- Summe aller Einnahmen pro Monat
SELECT 
  date_trunc('month', event_at) AS monat,
  event_type,
  COUNT(*) AS anzahl,
  SUM(amount) AS summe,
  currency
FROM purchase_ledger
WHERE event_type IN ('CHECKOUT_COMPLETED', 'INVOICE_PAID')
GROUP BY 1, 2, 5
ORDER BY 1 DESC;
```

Vergleichen Sie diese Summen mit dem Stripe-Dashboard unter:
`https://dashboard.stripe.com/reports/balance`

---

## 5. DSGVO-konforme Löschung durch Anonymisierung

### 5.1 Grundprinzip

Bei einem Löschantrag (Art. 17 DSGVO) werden **personenbezogene Daten anonymisiert**,
während **steuerlich relevante Finanzdaten erhalten bleiben** (§147 AO / §257 HGB).

### 5.2 Anonymisierungsprozess

Die Funktion `public.anonymize_user()` führt folgende Schritte durch:

| Schritt | Tabelle | Aktion |
|---------|---------|--------|
| 1 | `archived_users` | Anonymisiertes Archiv erstellen (Aggregat-Daten) |
| 2 | `purchase_ledger` | `user_id` → NULL, `anonymized_user_hash` setzen |
| 3 | `purchases` | `user_id` → NULL |
| 4 | `invoices` | `stripe_customer_id` → ANONYMIZED_[hash] |
| 5 | `audit_logs` | PII entfernen, Aktionen behalten |
| 6 | `activities` | **Löschen** (kein steuerlicher Bezug) |
| 7 | `attentions` | **Löschen** |
| 8 | `chat_messages` | **Löschen** |
| 9 | `coaching_relationships` | **Löschen** |
| 10 | `notification_preferences` | **Löschen** |
| 11 | `profiles` | Anonymisieren: E-Mail → hash, Name → "Gelöschter Nutzer", alle PII → NULL |
| 12 | `data_deletion_requests` | Status → COMPLETED |

### 5.3 Ausführung

```sql
-- Über Supabase SQL Editor (durch Admin):
SELECT public.anonymize_user(
  'USER_UUID_HERE'::uuid,
  'DELETION_REQUEST_UUID'::uuid,  -- optional
  'ADMIN_UUID_HERE'::uuid,        -- optional
  'User requested deletion'       -- Grund
);
```

**Rückgabe:**
```json
{
  "success": true,
  "user_hash": "a1b2c3...",
  "log": {
    "archived_user": true,
    "purchase_ledger_anonymized": true,
    "profile_anonymized": true,
    ...
  }
}
```

### 5.4 Was passiert mit Stripe-Daten?

Stripe-Daten müssen **separat gelöscht** werden:

1. **Stripe Dashboard** → Customers → Suche nach E-Mail → Delete
2. Oder per **Stripe API**:
   ```bash
   curl -X DELETE https://api.stripe.com/v1/customers/cus_XXXXX \
     -u sk_live_XXXXX:
   ```

**Wichtig:** Stripe bewahrt Rechnungs- und Transaktionsdaten nach der Kundenlöschung
weiterhin auf (Stripe-eigene Compliance). Unsere `purchase_ledger`-Einträge bleiben
als Redundanz bestehen.

### 5.5 Zeitrahmen

| Schritt | Frist |
|---------|-------|
| Löschantrag eingeht | Sofort im System erfasst |
| Bearbeitungsbeginn | Innerhalb von 7 Tagen |
| Anonymisierung abgeschlossen | Innerhalb von 30 Tagen (Art. 12 Abs. 3 DSGVO) |
| Stripe-Kundenlöschung | Innerhalb von 30 Tagen |
| Backup-Bereinigung | Automatisch nach Backup-Rotation (max. 30 Tage) |

---

## 6. Backup-Strategie

### 6.1 Automatische Backups (Supabase)

| Feature | Free Plan | Pro Plan | Empfehlung |
|---------|-----------|----------|------------|
| **Daily Backups** | ✅ 7 Tage | ✅ 7 Tage | Minimum |
| **Point-in-Time Recovery** | ❌ | ✅ (bis 7 Tage) | **Dringend empfohlen** |
| **WAL Archiving** | ❌ | ✅ | Für Produktion |

**Empfehlung:** Mindestens **Supabase Pro Plan** für Point-in-Time Recovery (PITR).

### 6.2 Manuelle Backup-Routine

**Wöchentliches Backup** der geschäftskritischen Daten:

```bash
# 1. Datenbank-Dump (über Supabase CLI)
supabase db dump -f backup_$(date +%Y%m%d).sql --project-ref YOUR_PROJECT_REF

# 2. Nur Finanzdaten (für separate Aufbewahrung)
supabase db dump -f financial_$(date +%Y%m%d).sql \
  --project-ref YOUR_PROJECT_REF \
  --data-only \
  --table purchase_ledger \
  --table invoices \
  --table purchases \
  --table subscriptions

# 3. Compliance-Daten
supabase db dump -f compliance_$(date +%Y%m%d).sql \
  --project-ref YOUR_PROJECT_REF \
  --data-only \
  --table legal_versions \
  --table consent_logs \
  --table audit_logs \
  --table archived_users \
  --table data_deletion_requests \
  --table data_export_requests
```

### 6.3 Backup-Aufbewahrung

| Backup-Typ | Häufigkeit | Aufbewahrung | Speicherort |
|------------|------------|--------------|-------------|
| Supabase Auto-Backup | Täglich | 7 Tage | Supabase (AWS) |
| Manueller Full-Dump | Wöchentlich | 90 Tage | Verschlüsselter Cloud-Speicher |
| Finanz-Backup | Monatlich | **10 Jahre** | Separater verschlüsselter Speicher |
| Compliance-Backup | Monatlich | **10 Jahre** | Separater verschlüsselter Speicher |

### 6.4 Empfohlene Backup-Speicherorte

1. **Primär:** Supabase integriertes Backup (automatisch)
2. **Sekundär:** AWS S3 mit Server-Side Encryption (SSE-S3) + Bucket Versioning
   - Region: `eu-central-1` (Frankfurt) für DSGVO-Konformität
   - Lifecycle-Rule: Automatische Löschung nach Ablauf der Aufbewahrungsfrist
3. **Tertiär (optional):** Lokale verschlüsselte Festplatte (für Offline-Zugriff)
   - Verschlüsselung: AES-256 (z.B. VeraCrypt)
   - Lagerung: Feuersicherer Tresor

### 6.5 Verschlüsselungsempfehlungen

| Komponente | Methode |
|-----------|---------|
| Backup-Dateien | AES-256 Verschlüsselung |
| S3 Bucket | SSE-S3 oder SSE-KMS |
| Transport | TLS 1.3 |
| Passwörter | Separater Passwort-Manager (nicht im Backup) |

---

## 7. Aufbewahrungsfristen

### 7.1 Übersicht

| Datenkategorie | Aufbewahrungsfrist | Rechtsgrundlage | Löschmethode |
|----------------|-------------------|-----------------|--------------|
| Account-/Profildaten | Bis Kontolöschung | Art. 6(1)(b) DSGVO | Anonymisierung |
| Trainings-/Check-In-Daten | Bis Kontolöschung | Art. 6(1)(b) DSGVO | Hard Delete |
| Chat-Nachrichten | Bis Kontolöschung / 1 Jahr nach Coaching-Ende | Art. 6(1)(b) DSGVO | Hard Delete |
| **Purchase Ledger** | **10 Jahre** | **§147 AO, §257 HGB** | **Anonymisierung** |
| **Rechnungen/Invoices** | **10 Jahre** | **§147 AO** | **Anonymisierung** |
| **Subscriptions** | **10 Jahre** | **§147 AO** | **Anonymisierung** |
| Consent-Logs | 3 Jahre nach Widerruf | Nachweispflicht | Hard Delete nach Frist |
| Audit-Logs | 1 Jahr | Art. 6(1)(f) DSGVO | Anonymisierung |
| Benachrichtigungs-Logs | 1 Jahr | Art. 6(1)(f) DSGVO | Hard Delete |
| Server-Logs (IP etc.) | 30 Tage | Art. 6(1)(f) DSGVO | Auto-Delete (Vercel) |
| **Legal Versions** | **Unbegrenzt** | **Nachweispflicht** | **Nie löschen** |
| **Archived Users** | **10 Jahre nach letzter Transaktion** | **§147 AO** | Hard Delete nach Frist |

### 7.2 Automatisierte Bereinigung

**Empfehlung:** Cron-Job (monatlich) zur Bereinigung abgelaufener Daten:

```sql
-- Abgelaufene Consent-Logs löschen (3 Jahre nach Widerruf)
DELETE FROM consent_logs
WHERE consent_given = false
  AND created_at < NOW() - INTERVAL '3 years';

-- Abgelaufene Audit-Logs anonymisieren (1 Jahr)
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '1 year'
  AND action NOT IN ('USER_ANONYMIZED', 'ACCOUNT_CREATED', 'DELETION_REQUESTED');

-- Abgelaufene Archived Users löschen (10 Jahre nach letzter Transaktion)
DELETE FROM archived_users
WHERE financial_retention_until IS NOT NULL
  AND financial_retention_until < CURRENT_DATE;
```

---

## 8. Notfall-Wiederherstellung

### 8.1 Recovery Time Objectives (RTO)

| Szenario | RTO | Methode |
|----------|-----|---------|
| Einzelne Tabelle gelöscht | < 1 Stunde | PITR (Supabase Pro) |
| Datenbank-Korruption | < 4 Stunden | Full Restore aus Backup |
| Kompletter Datenverlust | < 24 Stunden | Manuelles Backup + Stripe-Sync |
| Stripe-Ausfall | Kein Datenverlust | Purchase Ledger als Fallback |

### 8.2 Wiederherstellungsprozess

**Szenario: Versehentliche Datenlöschung**

1. **Sofort:** Supabase Dashboard → Database → Backups → Point-in-Time Recovery
2. **Alternative:** Manuelles Backup einspielen:
   ```bash
   psql -h db.YOUR_PROJECT.supabase.co -U postgres -d postgres < backup_YYYYMMDD.sql
   ```
3. **Verifizierung:** Datenintegrität prüfen:
   ```sql
   SELECT COUNT(*) FROM profiles;
   SELECT COUNT(*) FROM purchase_ledger;
   SELECT MAX(created_at) FROM audit_logs;
   ```

**Szenario: Finanzdaten-Verlust**

1. **Purchase Ledger** wiederherstellen aus separatem Finanz-Backup
2. **Stripe-Abgleich:** Alle Transaktionen aus Stripe exportieren:
   - Stripe Dashboard → Reports → Balance → Export
3. **Differenz identifizieren** und fehlende Einträge manuell nachbuchen

### 8.3 Notfall-Kontakte

| Dienst | Support-Kanal | Priorität |
|--------|--------------|-----------|
| Supabase | support@supabase.io oder Dashboard-Support | Hoch |
| Stripe | https://support.stripe.com | Hoch |
| Vercel | https://vercel.com/support | Mittel |
| Resend | support@resend.com | Niedrig |

---

## 9. Checklisten für den Betreiber

### 9.1 Monatliche Routine

- [ ] Manuellen Datenbank-Dump erstellen und verschlüsselt speichern
- [ ] Finanz-Backup erstellen (purchase_ledger, invoices, subscriptions)
- [ ] Purchase Ledger mit Stripe-Dashboard abgleichen
- [ ] Offene Löschanträge prüfen und bearbeiten
- [ ] Audit-Logs auf verdächtige Aktivitäten prüfen
- [ ] Backup-Integrität verifizieren (Stichproben-Restore)

### 9.2 Quartalsweise Routine

- [ ] Aufbewahrungsfristen prüfen → abgelaufene Daten bereinigen
- [ ] Consent-Logs auf ausstehende Re-Consents prüfen
- [ ] Legal Versions auf Aktualität prüfen (Rechtsänderungen?)
- [ ] Stripe-Subscription-Status mit lokaler DB abgleichen
- [ ] DSGVO-Verarbeitungsverzeichnis aktualisieren

### 9.3 Jährliche Routine

- [ ] Datenschutz-Folgenabschätzung (DSFA) überprüfen
- [ ] Auftragsverarbeitungsverträge (AVV) mit Dienstleistern prüfen
- [ ] Backup-Strategie evaluieren und ggf. anpassen
- [ ] Sicherheits-Audit durchführen
- [ ] Mitarbeiter-Schulung Datenschutz

### 9.4 Bei Rechtstext-Änderungen

- [ ] Neuen Eintrag in `legal_versions` erstellen
- [ ] Änderungen in `Legal.tsx` implementieren
- [ ] Versionsnummer und Datum in der Datei aktualisieren
- [ ] E-Mail an alle Nutzer vorbereiten (30 Tage Vorlauf)
- [ ] Am Gültigkeitstag: `is_current` in `legal_versions` umschalten
- [ ] Consent-Version in `Register.tsx` aktualisieren
- [ ] Build und Deployment auslösen
- [ ] Bestätigung: Neue Version ist live und korrekt

### 9.5 Bei Löschanträgen

- [ ] Antrag im System prüfen (`data_deletion_requests`)
- [ ] Identität des Antragstellers verifizieren
- [ ] Offene Abonnements beim Nutzer prüfen / kündigen
- [ ] `SELECT public.anonymize_user(...)` ausführen
- [ ] Stripe-Kundendaten separat löschen
- [ ] Bestätigungs-E-Mail an den Nutzer senden
- [ ] Frist dokumentieren: Max. 30 Tage ab Eingang

---

## 10. Kontakt & Verantwortlichkeiten

| Rolle | Verantwortung | Kontakt |
|-------|--------------|---------|
| Datenschutzbeauftragter | DSGVO-Compliance, Löschanträge, DSFA | datenschutz@greenlight-fitness.de |
| Technischer Admin | Backups, DB-Wartung, Deployments | support@greenlight-fitness.de |
| Geschäftsführung | Steuerliche Aufbewahrung, Verträge | info@greenlight-fitness.de |

---

## Anhang: SQL-Referenz

### Neue Version eines Rechtstexts anlegen

```sql
-- 1. Neuen Eintrag erstellen
INSERT INTO legal_versions (document_type, version, title, summary_of_changes, effective_date, is_current)
VALUES ('PRIVACY', '3.0', 'Datenschutzerklärung',
        'Neuer Auftragsverarbeiter hinzugefügt, Abschnitt X aktualisiert',
        '2026-07-01', false);

-- 2. Am Gültigkeitstag umschalten
UPDATE legal_versions SET is_current = false WHERE document_type = 'PRIVACY' AND is_current = true;
UPDATE legal_versions SET is_current = true WHERE document_type = 'PRIVACY' AND version = '3.0';
```

### Nutzer anonymisieren

```sql
SELECT public.anonymize_user(
  '12345678-1234-1234-1234-123456789abc'::uuid,  -- user_id
  NULL,                                             -- deletion_request_id (optional)
  NULL,                                             -- processed_by (optional)
  'Nutzer hat Löschung beantragt'                   -- Grund
);
```

### Finanz-Report generieren

```sql
SELECT
  date_trunc('month', event_at) AS monat,
  SUM(CASE WHEN event_type = 'CHECKOUT_COMPLETED' THEN amount ELSE 0 END) AS einmalkaeufe,
  SUM(CASE WHEN event_type = 'INVOICE_PAID' THEN amount ELSE 0 END) AS abo_einnahmen,
  SUM(CASE WHEN event_type = 'REFUND_ISSUED' THEN amount ELSE 0 END) AS erstattungen,
  COUNT(DISTINCT user_id) AS zahlende_nutzer
FROM purchase_ledger
WHERE event_at >= NOW() - INTERVAL '12 months'
GROUP BY 1
ORDER BY 1 DESC;
```

### Aktuelle Versionen aller Rechtstexte

```sql
SELECT document_type, version, title, effective_date, created_at
FROM legal_versions
WHERE is_current = true
ORDER BY document_type;
```

---

*Dieses Dokument ist vertraulich und ausschließlich für den internen Gebrauch bestimmt.*
