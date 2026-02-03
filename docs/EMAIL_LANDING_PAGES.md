# E-Mail System - Benötigte Landing Pages & Integration

## Übersicht: Alle E-Mail Templates & ihre Links

| # | E-Mail | Benötigte Seite(n) | Status | Stripe? |
|---|--------|-------------------|--------|---------|
| 1 | Willkommen | `/dashboard` | ✅ Existiert | ❌ |
| 2 | Preisänderung | Stripe Customer Portal | ⚠️ Stripe | ✅ Portal |
| 3 | Kündigung bestätigt | - (nur Info) | ✅ | ❌ |
| 4 | Coaching-Anfrage (Coach) | `/coach/dashboard` | ✅ Existiert | ❌ |
| 5 | Coaching genehmigt | `/dashboard` | ✅ Existiert | ❌ |
| 6 | Coaching abgelehnt | `/shop` | ✅ Existiert | ❌ |
| 7 | Zahlung fehlgeschlagen | Stripe Customer Portal | ⚠️ Stripe | ✅ Portal |
| 8 | Account gelöscht | - (nur Info) | ✅ | ❌ |
| 9 | Passwort zurücksetzen | `/reset-password` | ❌ **FEHLT** | ❌ |
| 10 | E-Mail bestätigen | `/verify-email` | ❌ **FEHLT** | ❌ |
| 11 | Einladung | `/invite/:code` | ❌ **FEHLT** | ❌ |
| 12 | Trainingsplan zugewiesen | `/dashboard` | ✅ Existiert | ❌ |
| 13 | Kauf bestätigt | `/dashboard` + Stripe Receipt | ✅ | ✅ Receipt |
| 14 | Abo verlängert | Stripe Customer Portal | ⚠️ Stripe | ✅ Portal |

---

## 🔴 Fehlende Seiten (Priorität)

### 1. `/reset-password` - Passwort zurücksetzen
**Trigger:** User klickt "Passwort vergessen" → bekommt E-Mail → klickt Link

**URL-Struktur:**
```
https://dev.greenlight-fitness.de/reset-password?token=<RESET_TOKEN>
```

**Funktionalität:**
- Token aus URL auslesen
- Token validieren (Supabase Auth)
- Neues Passwort eingeben (2x)
- Passwort-Stärke prüfen
- Bei Erfolg: Redirect zu Login

**Supabase Integration:**
```typescript
// Token-basierter Reset
const { error } = await supabase.auth.updateUser({
  password: newPassword
});
```

---

### 2. `/verify-email` - E-Mail-Bestätigung
**Trigger:** User registriert sich → bekommt E-Mail → klickt Link

**URL-Struktur:**
```
https://dev.greenlight-fitness.de/verify-email?token=<VERIFICATION_TOKEN>&type=signup
```

**Funktionalität:**
- Token aus URL auslesen
- Supabase verifiziert automatisch
- Erfolgsseite anzeigen
- Redirect zu Dashboard/Onboarding

**Supabase Integration:**
- Supabase handled das automatisch über `confirm` Type
- Wir brauchen nur eine Success-Page

---

### 3. `/invite/:code` - Einladung annehmen
**Trigger:** Coach/Admin lädt Athleten ein → Athlet bekommt E-Mail → klickt Link

**URL-Struktur:**
```
https://dev.greenlight-fitness.de/invite/ABC123XYZ
```

**Funktionalität:**
1. Invitation-Code aus URL auslesen
2. Code in `invitations` Tabelle validieren
3. Prüfen: Status = PENDING, nicht abgelaufen
4. Wenn User eingeloggt → Invitation akzeptieren
5. Wenn User nicht eingeloggt → Registrierung mit vorausgefüllter E-Mail
6. Nach Akzeptieren:
   - `invitations.status` → ACCEPTED
   - Ggf. Auto-Assign von Coaching/Plan
   - Redirect zu Dashboard

**Datenbank:**
```sql
-- invitations Tabelle wird geprüft
SELECT * FROM invitations 
WHERE invitation_code = 'ABC123XYZ' 
AND status = 'PENDING' 
AND (expires_at IS NULL OR expires_at > NOW());
```

---

## 🟡 Stripe-Integration

### Customer Portal Links
Für folgende E-Mails brauchen wir dynamische Stripe Portal Links:

| E-Mail | Portal-Aktion |
|--------|---------------|
| Preisänderung | Kündigung ermöglichen |
| Zahlung fehlgeschlagen | Zahlungsmethode aktualisieren |
| Abo verlängert | Abo verwalten |

**Implementierung:**
```typescript
// API Route: /api/create-portal-session.ts (bereits vorhanden!)
const session = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: 'https://dev.greenlight-fitness.de/profile',
});
```

**Wichtig:** Portal-Links sind temporär und müssen dynamisch generiert werden!

### Receipt Links (Kauf bestätigt)
Stripe generiert automatisch Receipts. Diese können über:
- `invoice.hosted_invoice_url` (für Subscriptions)
- `charge.receipt_url` (für Einmalkäufe)

abgerufen werden.

---

## 🔧 Design-Fixes für E-Mail Templates

### Bekannte Probleme:

1. **Icon-Container (flexbox):**
   - E-Mail Clients unterstützen kein `display: flex` konsistent
   - Lösung: Table-basiertes Layout oder `display: inline-block`

2. **Border-Radius:**
   - Outlook ignoriert `border-radius`
   - Lösung: Akzeptieren oder VML für Outlook

3. **Buttons nebeneinander (Template 13):**
   - Flexbox funktioniert nicht überall
   - Lösung: Table-Layout oder untereinander

4. **Icon-Zentrierung:**
   - `display: inline-flex` funktioniert nicht überall
   - Lösung: `text-align: center` + `vertical-align: middle`

### Empfohlene Fixes:

```html
<!-- VORHER (problematisch) -->
<div style="display: inline-flex; align-items: center; justify-content: center;">
  <span>🎉</span>
</div>

<!-- NACHHER (kompatibel) -->
<div style="display: inline-block; text-align: center; line-height: 64px;">
  <span style="font-size: 32px; vertical-align: middle;">🎉</span>
</div>
```

---

## 📋 Implementierungs-Checkliste

### Phase 1: Kritische Seiten
- [ ] `/reset-password` - Passwort zurücksetzen
- [ ] `/verify-email` - E-Mail-Bestätigung  
- [ ] `/invite/:code` - Einladung annehmen

### Phase 2: E-Mail Design Fixes
- [ ] Flexbox → Table/Inline-Block umstellen
- [ ] Icon-Container fixen
- [ ] Button-Layout für 2 Buttons nebeneinander
- [ ] Outlook-Kompatibilität testen

### Phase 3: Stripe Integration
- [ ] Portal-Links dynamisch in E-Mails einbinden
- [ ] Receipt-Links aus Webhooks extrahieren
- [ ] Webhook für `invoice.paid` → Abo-verlängert E-Mail

---

## Supabase Auth E-Mail Templates

**Wichtig:** Supabase hat eigene E-Mail Templates für:
- Passwort Reset
- E-Mail Bestätigung
- Magic Link

Diese können im Supabase Dashboard angepasst werden:
`Authentication → Email Templates`

**Option A:** Supabase Templates anpassen (einfacher)
**Option B:** Custom SMTP + eigene Templates (mehr Kontrolle)

Aktuell empfohlen: **Option A** - Supabase Templates im Dashboard anpassen, um zum Greenlight-Design zu passen.
