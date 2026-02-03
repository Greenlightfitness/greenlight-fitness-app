# Greenlight Fitness - Projekt-Audit

## Stand: 03.02.2026

---

## 🟢 Bereits implementiert

### Kernfunktionen
- ✅ **Authentifizierung** (Supabase Auth)
- ✅ **Rollen-System** (Athlete, Coach, Admin)
- ✅ **Dashboard** mit rollenbasierter Ansicht
- ✅ **Übungsbibliothek** (Exercises)
- ✅ **Trainingsplaner** (Planner mit Wochen/Sessions)
- ✅ **Shop** mit Stripe-Integration
- ✅ **Profil** mit Health Data Modal
- ✅ **Chat** (Basic)
- ✅ **Admin-Bereich** (Products, Users)

### E-Mail System
- ✅ **14 E-Mail Templates** (optimiert, table-basiert)
- ✅ **Resend API Integration**
- ✅ **DSGVO-konformer Footer**

### Neue Seiten (gerade erstellt)
- ✅ `/reset-password` - Passwort zurücksetzen
- ✅ `/verify-email` - E-Mail-Bestätigung
- ✅ `/invite/:code` - Einladung annehmen

### Stripe Integration
- ✅ Checkout Session
- ✅ Customer Portal
- ✅ Webhooks (basic)
- ✅ Produkt-Erstellung

---

## 🔴 Kritisch - Muss vor Launch fertig sein

### 1. Supabase Auth E-Mail Templates
**Problem:** Supabase sendet eigene E-Mails für Auth-Flows (Reset, Verify).
**Lösung:** 
- Supabase Dashboard → Authentication → Email Templates anpassen
- ODER: Custom SMTP mit eigenen Templates

**Aufwand:** 1-2 Stunden

### 2. Stripe Webhooks vervollständigen
**Fehlende Events:**
- `invoice.paid` → E-Mail "Abo verlängert" senden
- `invoice.payment_failed` → E-Mail "Zahlung fehlgeschlagen" senden
- `customer.subscription.updated` (Preisänderung) → Benachrichtigung

**Datei:** `@/api/stripe-webhook.ts`
**Aufwand:** 3-4 Stunden

### 3. Coaching-Approval-Flow
**Status:** UI existiert, Backend teilweise
**Fehlt:**
- E-Mail an Coach bei neuer Anfrage senden
- E-Mail an Athlet bei Genehmigung/Ablehnung senden
- Webhook-Trigger nach Stripe-Kauf

**Aufwand:** 4-5 Stunden

### 4. Invitation System Backend
**Status:** Seite erstellt (`AcceptInvite.tsx`)
**Fehlt:**
- Admin/Coach UI zum Erstellen von Einladungen
- `invitations` Tabelle in Supabase
- E-Mail beim Erstellen der Einladung senden

**Aufwand:** 4-5 Stunden

### 5. RLS Policies prüfen
**Risiko:** Datenlecks bei falschen Policies
**Zu prüfen:**
- `profiles` - Nur eigene Daten sichtbar
- `plans` - Nur zugewiesene Pläne sichtbar
- `coaching_relationships` - Korrekte Zugriffskontrolle

**Aufwand:** 2-3 Stunden (Audit)

---

## 🟡 Wichtig - Sollte zeitnah implementiert werden

### 6. Onboarding-Flow verbessern
**Status:** `ProfileSetupWizard.tsx` existiert
**Verbesserungen:**
- Automatische Weiterleitung nach Registrierung
- Fortschrittsanzeige
- Validierung der Pflichtfelder

### 7. Push-Benachrichtigungen
**Use Cases:**
- Neuer Trainingsplan zugewiesen
- Coaching-Anfrage erhalten (Coach)
- Coaching genehmigt (Athlet)
- Erinnerung an Training

**Technologie:** Firebase Cloud Messaging oder Web Push API

### 8. Analytics & Tracking
**Status:** Nicht implementiert
**Benötigt:**
- Workout-Statistiken (Volumen, Frequenz)
- Fortschrittsgraphen
- Personal Bests History

### 9. Offline-Fähigkeit
**Problem:** App funktioniert nicht offline
**Lösung:** 
- Service Worker
- IndexedDB für lokale Daten
- Sync bei Reconnect

### 10. Multi-Language Support
**Status:** `LanguageContext.tsx` existiert, `translations.ts` vorhanden
**Fehlt:**
- Vollständige Übersetzungen (DE/EN)
- Sprachauswahl im Profil
- E-Mail Templates in Englisch

---

## 🟠 Nice-to-Have - Nach Launch

### 11. Mobile App (PWA → Native)
- React Native oder Capacitor
- Bessere Performance
- Native Features (Kamera, HealthKit)

### 12. AI-Features erweitern
**Aktuell:** Basic AI für Übungsbeschreibungen
**Möglich:**
- Trainingsplan-Generator
- Form-Check via Video
- Personalisierte Empfehlungen

### 13. Social Features
- Leaderboards
- Challenges
- Community Feed

### 14. Kalender-Integration
- Google Calendar Sync
- Apple Calendar Sync
- Automatische Erinnerungen

### 15. Zahlungsmethoden erweitern
- PayPal
- Apple Pay / Google Pay
- Klarna (Ratenzahlung)

---

## 🔧 Technische Schulden

### Code-Qualität
| Datei | Problem | Priorität |
|-------|---------|-----------|
| `Dashboard.tsx` | 55KB - zu groß, aufteilen | 🟡 Mittel |
| `AthleteTrainingView.tsx` | 77KB - zu groß, aufteilen | 🟡 Mittel |
| `AdminProducts.tsx` | 37KB - aufteilen in Komponenten | 🟢 Niedrig |

### TODOs im Code
```
types.ts:14 - "Langfristig sollen nur Admins Coaches einladen können"
```

### Fehlende Tests
- ❌ Unit Tests
- ❌ Integration Tests
- ❌ E2E Tests

### Dokumentation
- ✅ API_DOCUMENTATION.md
- ✅ EMAIL_SECURITY_CONCEPT.md
- ⚠️ README.md - zu kurz
- ❌ CONTRIBUTING.md
- ❌ Deployment Guide

---

## 📋 Priorisierte Roadmap

### Phase 1: Launch-Readiness (1-2 Wochen)
1. Supabase Auth E-Mails anpassen
2. Stripe Webhooks vervollständigen
3. Coaching-Approval E-Mails implementieren
4. RLS Policies Audit
5. Invitation System Backend

### Phase 2: Polish (2-4 Wochen)
6. Onboarding-Flow verbessern
7. Analytics Dashboard
8. Vollständige Übersetzungen
9. Performance-Optimierung

### Phase 3: Growth (1-3 Monate)
10. Push-Benachrichtigungen
11. Offline-Fähigkeit
12. Mobile App (PWA optimieren)
13. AI-Features erweitern

---

## 🚀 Quick Wins (< 1 Stunde)

1. **Logo in E-Mails** - SVG/PNG einbetten statt Emoji
2. **Favicon** - Falls nicht vorhanden
3. **Meta Tags** - SEO-Optimierung
4. **Error Boundaries** - Graceful Error Handling
5. **Loading States** - Skeleton Screens statt Spinner

---

## Nächste konkrete Schritte

1. **JETZT:** Supabase E-Mail Templates im Dashboard anpassen
2. **JETZT:** `stripe-webhook.ts` um `invoice.paid` erweitern
3. **HEUTE:** Invitation System Tabelle + UI erstellen
4. **DIESE WOCHE:** RLS Policies Audit durchführen
