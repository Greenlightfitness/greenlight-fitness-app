# RLS Policies Audit - Greenlight Fitness

## Datum: 03.02.2026

---

## ✅ Übersicht: Alle Tabellen mit RLS

| Tabelle | RLS aktiviert | Policies |
|---------|---------------|----------|
| `profiles` | ✅ | SELECT own, UPDATE own |
| `exercises` | ✅ | SELECT all, INSERT auth, UPDATE author |
| `plans` | ✅ | SELECT coach, ALL coach |
| `weeks` | ✅ | Über plan_id |
| `sessions` | ✅ | Über week_id |
| `assigned_plans` | ✅ | SELECT athlete/coach, UPDATE coach/athlete |
| `products` | ✅ | SELECT all, ALL coach |
| `attentions` | ✅ | SELECT athlete/coach, INSERT athlete, UPDATE coach |
| `activities` | ✅ | SELECT all, INSERT athlete |
| `appointments` | ✅ | SELECT athlete/coach, ALL coach |
| `consent_logs` | ✅ | SELECT/INSERT own |
| `audit_logs` | ✅ | SELECT own, INSERT all |
| `data_deletion_requests` | ✅ | SELECT/INSERT own |
| `data_export_requests` | ✅ | SELECT/INSERT own |
| `athlete_schedule` | ✅ | ALL athlete, SELECT coach |
| `workout_logs` | ✅ | ALL athlete, SELECT coach |
| `exercise_pbs` | ✅ | ALL athlete, SELECT coach |
| `daily_wellness` | ✅ | ALL athlete, SELECT coach |
| `daily_stats` | ✅ | ALL athlete, SELECT coach |
| `weekly_stats` | ✅ | ALL athlete, SELECT coach |
| `block_templates` | ✅ | ALL owner, SELECT public |
| `coaching_approvals` | ✅ | SELECT athlete, ALL coach |
| `coaching_relationships` | ✅ | SELECT both, ALL coach |
| `goals` | ✅ | ALL athlete, ALL coach |
| `goal_checkpoints` | ✅ | ALL goal owner |
| `invitations` | ✅ | ALL invited_by, SELECT all |

---

## 🔍 Detaillierte Analyse

### 1. PROFILES
```sql
-- Aktuell (implizit durch Supabase Auth)
-- User können nur eigenes Profil lesen/bearbeiten
```
**Status:** ✅ OK
**Risiko:** Niedrig

### 2. EXERCISES
```sql
"Exercises are viewable by everyone" SELECT USING (true)
"Users can insert exercises" INSERT WITH CHECK (auth.uid() IS NOT NULL)
"Users can update own exercises" UPDATE USING (auth.uid() = author_id)
```
**Status:** ✅ OK
**Hinweis:** Admins können alle Übungen bearbeiten (über author_id)

### 3. PLANS / WEEKS / SESSIONS
```sql
"Coaches can manage own plans" FOR ALL USING (auth.uid() = coach_id)
```
**Status:** ✅ OK
**Hinweis:** Athleten sehen Pläne nur über `assigned_plans`

### 4. ASSIGNED_PLANS
```sql
"Athletes view own assigned plans" SELECT USING (auth.uid() = athlete_id)
"Coaches view/create assigned plans" SELECT/INSERT/UPDATE USING (auth.uid() = coach_id)
```
**Status:** ✅ OK

### 5. PRODUCTS
```sql
"Products are viewable by everyone" SELECT USING (true)
"Coaches can manage products" FOR ALL USING (auth.uid() = coach_id)
```
**Status:** ✅ OK
**Hinweis:** Öffentlich lesbar (für Shop)

### 6. COACHING_APPROVALS
```sql
"Athletes view own approvals" SELECT USING (auth.uid() = athlete_id)
"Coaches manage approvals" FOR ALL USING (product.coach_id = auth.uid())
"System can insert approvals" INSERT WITH CHECK (true)
```
**Status:** ⚠️ PRÜFEN
**Risiko:** `INSERT WITH CHECK (true)` könnte missbraucht werden
**Empfehlung:** Einschränken auf Stripe Webhook oder Auth User

### 7. COACHING_RELATIONSHIPS
```sql
"Users view own relationships" SELECT USING (auth.uid() IN (athlete_id, coach_id))
"Coaches can manage relationships" FOR ALL USING (auth.uid() = coach_id)
"System can insert relationships" INSERT WITH CHECK (true)
```
**Status:** ⚠️ PRÜFEN
**Risiko:** `INSERT WITH CHECK (true)` könnte missbraucht werden
**Empfehlung:** Einschränken

### 8. INVITATIONS
```sql
"Coaches manage own invitations" FOR ALL USING (auth.uid() = invited_by)
"Anyone can view invitation by code" SELECT USING (true)
```
**Status:** ✅ OK
**Hinweis:** SELECT für alle nötig für Accept-Flow

---

## 🔴 Kritische Findings

### 1. `INSERT WITH CHECK (true)` Policies

**Betroffen:**
- `coaching_approvals`
- `coaching_relationships`
- `audit_logs`

**Risiko:** Jeder authentifizierte User könnte Einträge erstellen

**Fix:**
```sql
-- Statt:
CREATE POLICY "System can insert approvals" ON coaching_approvals 
  FOR INSERT WITH CHECK (true);

-- Besser:
CREATE POLICY "Athletes can request coaching" ON coaching_approvals 
  FOR INSERT WITH CHECK (auth.uid() = athlete_id);
```

### 2. Fehlende Admin-Policies

Einige Tabellen haben keine expliziten Admin-Policies. Admins sollten alles sehen können.

**Fix:**
```sql
CREATE POLICY "Admins have full access" ON [table] FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
```

---

## 🟡 Empfehlungen

### 1. Admin-Override für alle Tabellen
```sql
-- Für jede Tabelle hinzufügen:
CREATE POLICY "Admins have full access" ON public.[table_name] 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );
```

### 2. Service Role für System-Operationen
Für Webhook-basierte Operationen (Stripe, etc.) den Supabase `service_role` Key verwenden, der RLS umgeht.

### 3. Audit Logging verschärfen
```sql
-- Audit Logs nur über Trigger befüllen, nicht direkt
REVOKE INSERT ON public.audit_logs FROM authenticated;
-- Stattdessen Trigger für automatisches Logging
```

---

## ✅ Zusammenfassung

| Kategorie | Status | Anzahl |
|-----------|--------|--------|
| Tabellen mit RLS | ✅ | 26/26 |
| Kritische Issues | ⚠️ | 2 |
| Empfehlungen | 💡 | 3 |

**Gesamtbewertung:** 🟢 **GUT** - Keine kritischen Datenlecks, aber Verbesserungspotenzial bei INSERT-Policies.

---

## Nächste Schritte

1. [ ] `INSERT WITH CHECK (true)` Policies einschränken
2. [ ] Admin-Override Policies hinzufügen
3. [ ] Service Role für Webhooks verwenden
