# 🔑 CASCADE REFERENZ – GREENLIGHT FITNESS

> **Letzte Aktualisierung**: 03. Februar 2026  
> Diese Datei enthält alle wichtigen Credentials und Konfigurationen für neue Cascade-Sessions.

---

## ⚡ SUPABASE KONFIGURATION

### Projekt-Info
| Key | Value |
|-----|-------|
| **Project Ref** | `lfpcyhrccefbeowsgojv` |
| **Project URL** | `https://lfpcyhrccefbeowsgojv.supabase.co` |
| **Region** | Frankfurt (eu-central-1) |
| **Dashboard** | https://supabase.com/dashboard/project/lfpcyhrccefbeowsgojv |

### API Keys
```env
# Frontend (öffentlich, kann im Browser verwendet werden)
VITE_SUPABASE_URL=https://lfpcyhrccefbeowsgojv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcGN5aHJjY2VmYmVvd3Nnb2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTg1NTksImV4cCI6MjA4NTE3NDU1OX0.dD0HLt0fqzVNMOdDykjn8Bs60LfqpPFwlG1hkaYfov8
```

### Service Role Key (NUR für DB-Operationen/Server-Side!)
```env
# ⚠️ NIEMALS im Frontend verwenden! Umgeht RLS!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcGN5aHJjY2VmYmVvd3Nnb2p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5ODU1OSwiZXhwIjoyMDg1MTc0NTU5fQ.PcKcY12wubbHmUxRVW2B-2JRMuZ_9G3RqEY8WUdCclU
```

### Datenbank-Direktverbindung (PostgreSQL)
```bash
# Host: db.lfpcyhrccefbeowsgojv.supabase.co
# Port: 5432
# Database: postgres
# User: postgres
# Password: GreenlightFitnessSupaBase1!

# Verbindungs-String (für psql oder SQL-Tools)
postgresql://postgres:GreenlightFitnessSupaBase1!@db.lfpcyhrccefbeowsgojv.supabase.co:5432/postgres

# Schema deployen
PGPASSWORD='GreenlightFitnessSupaBase1!' psql -h db.lfpcyhrccefbeowsgojv.supabase.co -p 5432 -U postgres -d postgres -f supabase-schema.sql
```

---

## 🔐 WEITERE API KEYS

### Google AI (Gemini)
```env
VITE_GEMINI_API_KEY=AIzaSyDPNlS0yMNjdxOvzWZK_0a1Kj77nN80jnE
```

### Resend (E-Mail)
```env
# Für Vercel Serverless Functions
RESEND_API_KEY=re_UKW8EaYn_KWDciwQGRLuF3uqxLJPAAQ2e
```

### Stripe (Payment) – TEST MODE!
```env
# ⚠️ WICHTIG: NUR TEST-KEYS VERWENDEN!
# Niemals sk_live_ ohne explizite doppelte Bestätigung!
STRIPE_SECRET_KEY=sk_test_51RTbZ0PxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxX
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📁 WICHTIGE DATEIEN

| Datei | Zweck |
|-------|-------|
| `supabase-schema.sql` | Komplettes DB-Schema (Tabellen + RLS) |
| `services/supabase.ts` | Supabase Client + alle CRUD-Funktionen |
| `types.ts` | TypeScript Interfaces |
| `.env.local` | Lokale Environment Variables (nicht committed) |
| `WINDSURF_GUIDE.md` | Vollständige Projektdokumentation |

---

## 🛠️ SQL BEFEHLE FÜR SCHEMA-ÄNDERUNGEN

### Neue Spalte hinzufügen
```sql
ALTER TABLE public.tabellen_name 
ADD COLUMN spalten_name TYPE DEFAULT wert;
```

### Tabelle erstellen
```sql
CREATE TABLE public.neue_tabelle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS aktivieren
ALTER TABLE public.neue_tabelle ENABLE ROW LEVEL SECURITY;

-- Policy erstellen
CREATE POLICY "Users can read own data"
  ON public.neue_tabelle FOR SELECT
  USING (auth.uid() = user_id);
```

### Direkt in Supabase ausführen
```bash
# Via psql
PGPASSWORD='GreenlightFitnessSupaBase1!' psql -h db.lfpcyhrccefbeowsgojv.supabase.co -p 5432 -U postgres -d postgres -c "SQL_BEFEHL_HIER"

# Beispiel: Spalte hinzufügen
PGPASSWORD='GreenlightFitnessSupaBase1!' psql -h db.lfpcyhrccefbeowsgojv.supabase.co -p 5432 -U postgres -d postgres -c "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium BOOLEAN DEFAULT FALSE;"
```

---

## 🏗️ AKTUELLE DB-TABELLEN

| Tabelle | Zweck |
|---------|-------|
| `profiles` | User-Profile (erweitert auth.users) |
| `exercises` | Übungsbibliothek |
| `plans` | Trainingspläne |
| `weeks` | Wochen in Plänen |
| `sessions` | Training-Sessions |
| `assigned_plans` | Zugewiesene Pläne an Athleten |
| `products` | Shop-Produkte |
| `attentions` | Ticket-System |
| `activities` | Activity Feed |
| `appointments` | Termine |
| `athlete_schedule` | Eigene Workouts der Athleten |
| `workout_logs` | Trainings-Protokolle |

---

## 🚀 BEFEHLE ZUM STARTEN

```bash
# In Projektordner wechseln
cd /Users/dev/Downloads/Greenlight-Fitness-main

# Dependencies installieren
npm install

# Dev Server starten (Port 3004)
npm run dev

# Build für Production
npm run build
```

---

## ⚠️ SICHERHEITS-HINWEISE

1. **Stripe**: NUR `sk_test_` Keys verwenden! Niemals `sk_live_` ohne doppelte Bestätigung!
2. **Service Role Key**: Nur für Server-Side/DB-Operationen, NIEMALS im Frontend!
3. **Vercel Env Vars**: 
   - `VITE_*` → Sensitive AUS (Browser sichtbar)
   - Alle anderen → Sensitive AN

---

## 📝 FÜR NEUE CASCADE-SESSION

Kopiere diesen Block am Anfang einer neuen Session:

```
Ich arbeite an Greenlight Fitness, einer PWA für Fitness-Coaching.

SUPABASE:
- URL: https://lfpcyhrccefbeowsgojv.supabase.co
- DB-Passwort: GreenlightFitnessSupaBase1!
- Schema: siehe supabase-schema.sql

TECH STACK:
- React 19 + TypeScript + Vite
- Supabase (Auth, DB, Storage)
- Tailwind CSS
- Lucide Icons

WICHTIGE DATEIEN:
- CASCADE_REFERENCE.md (alle Keys)
- WINDSURF_GUIDE.md (vollständige Doku)
- supabase-schema.sql (DB-Schema)
- services/supabase.ts (Client)

Projekt-Pfad: /Users/dev/Downloads/Greenlight-Fitness-main
```

---

**Ende der Referenz** | Greenlight Fitness 2026
