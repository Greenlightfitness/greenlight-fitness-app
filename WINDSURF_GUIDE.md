# 🟢 GREENLIGHT FITNESS – VOLLSTÄNDIGE PROJEKTDOKUMENTATION

> **Letzte Aktualisierung**: 02. Februar 2026  
> **Backend-Status**: ✅ Migration Firebase → Supabase **ABGESCHLOSSEN**

---

## ⚡ MIGRATIONS-STATUS (WICHTIG)

### ✅ Abgeschlossen
| Komponente | Status | Notizen |
|------------|--------|--------|
| Supabase SDK | ✅ | `@supabase/supabase-js@2.93.3` |
| `services/supabase.ts` | ✅ | Alle CRUD-Funktionen implementiert |
| SQL-Schema | ✅ | In Supabase deployed (10 Tabellen + RLS) |
| AuthContext | ✅ | Supabase Auth + Profile-Validierung |
| Login/Register | ✅ | Supabase Auth |
| Dashboard | ✅ | Attentions, Activities, Appointments |
| Exercises | ✅ | CRUD + Archive |
| Planner (Hauptseite) | ✅ | Plans, Assign, Duplicate |
| Shop | ✅ | Products + Purchase |
| AdminProducts | ✅ | CRUD + Storage |
| AdminUsers | ✅ | User Management |
| Profile | ✅ | Logout |
| Layout | ✅ | Logout |
| ProfileSetupWizard | ✅ | Profile Update |
| ExerciseEditorModal | ✅ | Create/Update + Storage Upload |

### ⚠️ Teilweise migriert (funktioniert, aber komplex)
| Komponente | Status | Notizen |
|------------|--------|--------|
| PlanEditor | ⚠️ | Basis-Funktionen migriert, einige Firebase-Reste |
| SessionBuilder | ⚠️ | Noch Firebase-Imports |
| ExerciseSelector | ⚠️ | Noch Firebase-Imports |
| LibrarySelector | ⚠️ | Noch Firebase-Imports |

### 🔧 Bekannte Issues
1. **TypeScript Lint**: `import.meta.env` zeigt Fehler, funktioniert aber zur Laufzeit
2. **exercises.author_id**: Spalte existiert möglicherweise nicht in bestehender DB
3. **PlanEditor**: Komplexe Funktionen (Duplicate Week, Import) noch mit Firebase-Code

---

## 📋 INHALTSVERZEICHNIS

1. [Projekt-Vision](#1-projekt-vision)
2. [Tech Stack](#2-tech-stack)
3. [Projektstruktur](#3-projektstruktur)
4. [Datenmodell](#4-datenmodell)
5. [Design-System](#5-design-system)
6. [Implementierungs-Status](#6-implementierungs-status)
7. [Module & Kaskaden-Anweisungen](#7-module--kaskaden-anweisungen)
8. [Supabase Migration](#8-supabase-migration)
9. [Environment Setup](#9-environment-setup)
10. [Entwicklungs-Richtlinien](#10-entwicklungs-richtlinien)

---

## 1. PROJEKT-VISION

**Greenlight Fitness** ist eine Progressive Web App (PWA) für professionelles Fitness-Coaching mit "Tactical/Special Forces"-Ästhetik (vgl. TrainHeroic).

### Geschäftsmodell (Freemium)
- **Coaches**: Nutzen die App als CRM + Planungs-Tool für Klienten
- **Athleten (Free)**: Eigene Trainingspläne erstellen und tracken
- **Shop & Paywall**: Spezielle Pläne, 1:1 Coaching, Premium-Addons

### Kernfeatures
- Workout-Builder (Plan > Week > Session > Block > Exercise > Set)
- Flex-Scheduling (Athlet wählt Trainingstage)
- AI-generierte Übungsillustrationen (Gemini)
- Sports Science Toolbox (1RM, FFMI, ACWR, etc.)

---

## 2. TECH STACK

| Bereich | Technologie | Version | Status |
|---------|-------------|---------|--------|
| Frontend | React | 19.2.3 | ✅ |
| Sprache | TypeScript | 5.8.2 | ✅ |
| Styling | Tailwind CSS (CDN) | latest | ✅ |
| Routing | React Router DOM | 7.12.0 | ✅ |
| Icons | Lucide React | 0.562.0 | ✅ |
| **Auth** | **Supabase Auth** | 2.93.3 | ✅ NEU |
| **Database** | **Supabase PostgreSQL** | - | ✅ NEU |
| **Storage** | **Supabase Storage** | - | ✅ NEU |
| AI | Google GenAI (Gemini) | 1.37.0 | ✅ |
| Build | Vite | 6.4.1 | ✅ |
| Email | Resend | 6.9.1 | ⚠️ Optional |

### Dependencies (package.json)
```json
{
  "dependencies": {
    "@google/genai": "^1.37.0",
    "@supabase/supabase-js": "^2.93.3",
    "firebase": "^12.8.0",        // Legacy - kann entfernt werden
    "lucide-react": "^0.562.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "react-router-dom": "^7.12.0",
    "resend": "^6.9.1"
  }
}
```

### Supabase Projekt
- **URL**: `https://lfpcyhrccefbeowsgojv.supabase.co`
- **Project Ref**: `lfpcyhrccefbeowsgojv`

---

## 3. PROJEKTSTRUKTUR

```
/Greenlight-Fitness-main/
├── App.tsx                    # Routing + ProtectedRoute
├── index.tsx                  # Entry Point
├── types.ts                   # TypeScript Interfaces (227 Zeilen)
├── firestore.rules            # Security Rules (Legacy)
├── .env.example               # Environment Template
│
├── components/
│   ├── Layout.tsx             # Responsive Layout (Coach vs Athlete)
│   ├── Button.tsx, Input.tsx  # UI Primitives
│   ├── ConfirmationModal.tsx  # Double-Confirm Delete
│   ├── ProfileSetupWizard.tsx # Onboarding Flow
│   ├── WorkoutTimer.tsx       # Stoppuhr
│   ├── CalculatorsModal.tsx   # Sports Science Tools
│   ├── AthleteProfileModal.tsx
│   ├── ExerciseEditorModal.tsx
│   └── planner/
│       ├── PlanEditor.tsx     # Week/Session Management
│       ├── SessionBuilder.tsx # Workout Builder (804 Zeilen)
│       ├── ExerciseSelector.tsx
│       └── LibrarySelector.tsx
│
├── pages/
│   ├── Dashboard.tsx          # 1224 Zeilen - Hub + Training View
│   ├── Planner.tsx            # Plan-Liste & Assign Modal
│   ├── Exercises.tsx          # Übungsbibliothek
│   ├── Shop.tsx               # Produkt-Katalog
│   ├── AdminProducts.tsx      # Produkt-Verwaltung
│   ├── AdminUsers.tsx         # User CRM
│   ├── Profile.tsx            # User Profile
│   ├── Chat.tsx               # (Leer - TODO)
│   ├── Login.tsx, Register.tsx
│   └── Legal.tsx
│
├── services/
│   ├── firebase.ts            # Firebase Init (wird ersetzt)
│   ├── supabase.ts            # NEU: Supabase Client
│   └── ai.ts                  # Gemini AI Integration
│
├── context/
│   ├── AuthContext.tsx        # User + Profile State
│   └── LanguageContext.tsx    # i18n (EN/DE)
│
└── utils/
    ├── formulas.ts            # Sports Science Formeln
    └── translations.ts        # Übersetzungen (26KB)
```

---

## 4. DATENMODELL

### Firestore Schema (Aktuell)

```
users/{userId}
  ├── uid, email, role (ATHLETE|COACH|ADMIN)
  ├── firstName, lastName, nickname, gender, birthDate
  ├── height, weight, bodyFat, restingHeartRate, maxHeartRate
  └── onboardingCompleted: boolean

exercises/{exerciseId}
  ├── authorId, name, description, category, difficulty
  ├── thumbnailUrl (16:9), sequenceUrl (9:16)
  └── defaultSets[], defaultVisibleMetrics[]

plans/{planId}
  ├── coachId, name, description, createdAt
  └── weeks/{weekId}
      ├── order, focus
      └── sessions/{sessionId}
          ├── title, description, dayOfWeek, order
          └── workoutData: WorkoutBlock[] (JSON)

assigned_plans/{docId}
  ├── athleteId, coachId, originalPlanId
  ├── startDate, assignmentType, scheduleStatus
  ├── schedule: Record<"YYYY-MM-DD", sessionId>
  └── structure: { weeks: AssignedWeek[] }

products/{docId}
  ├── coachId, planId, title, description, features[]
  ├── category, type, price, currency, interval
  └── isActive

attentions/{docId}  # Ticketsystem
activities/{docId}  # Activity Feed
appointments/{docId}
```

### Supabase Schema (Ziel)

```sql
-- users (erweitert auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  role TEXT CHECK (role IN ('ATHLETE', 'COACH', 'ADMIN')),
  first_name TEXT,
  last_name TEXT,
  nickname TEXT,
  gender TEXT,
  birth_date DATE,
  height NUMERIC,
  weight NUMERIC,
  body_fat NUMERIC,
  resting_heart_rate INTEGER,
  max_heart_rate INTEGER,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- exercises
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty TEXT,
  thumbnail_url TEXT,
  sequence_url TEXT,
  default_sets JSONB,
  default_visible_metrics TEXT[],
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- plans
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.profiles NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- weeks
CREATE TABLE public.weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.plans ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  focus TEXT
);

-- sessions
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID REFERENCES public.weeks ON DELETE CASCADE,
  day_of_week INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER,
  workout_data JSONB -- WorkoutBlock[]
);

-- assigned_plans
CREATE TABLE public.assigned_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles NOT NULL,
  coach_id UUID REFERENCES public.profiles NOT NULL,
  original_plan_id UUID REFERENCES public.plans,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  start_date DATE,
  plan_name TEXT,
  description TEXT,
  assignment_type TEXT CHECK (assignment_type IN ('ONE_TO_ONE', 'GROUP_FLEX')),
  schedule_status TEXT CHECK (schedule_status IN ('PENDING', 'ACTIVE', 'COMPLETED')),
  schedule JSONB, -- Record<string, string>
  structure JSONB -- { weeks: AssignedWeek[] }
);

-- products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.profiles NOT NULL,
  plan_id UUID REFERENCES public.plans,
  title TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  features TEXT[],
  category TEXT,
  type TEXT,
  price NUMERIC,
  currency TEXT DEFAULT 'EUR',
  interval TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- attentions
CREATE TABLE public.attentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles NOT NULL,
  athlete_name TEXT,
  coach_id UUID REFERENCES public.profiles,
  type TEXT,
  severity TEXT,
  message TEXT,
  status TEXT DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- activities
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID REFERENCES public.profiles NOT NULL,
  athlete_name TEXT,
  type TEXT,
  title TEXT,
  subtitle TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. DESIGN-SYSTEM

### Farbpalette
```css
--bg-body: #000000
--bg-card: #121212, #1C1C1E
--accent: #00FF00 (Neon Green)
--text-primary: white
--text-secondary: zinc-400, zinc-500
--danger: red-500
--circuit: orange-500
```

### Komponenten-Pattern
- **Rounded Corners**: `rounded-2xl`, `rounded-3xl`, `rounded-[2rem]`
- **Glassmorphism**: `bg-black/90 backdrop-blur-md`
- **Cards**: `bg-[#1C1C1E] border border-zinc-800`
- **Hover**: `hover:border-[#00FF00]`
- **Active**: `active:scale-95`

### Layout-Verhalten
| Rolle | Desktop | Mobile |
|-------|---------|--------|
| Coach/Admin | Fixierte Sidebar (w-64) | Hamburger-Menü |
| Athlete | - | Bottom Navigation (5 Items) |

---

## 6. IMPLEMENTIERUNGS-STATUS

### CRUD Matrix
| Feature | C | R | U | D | Copy | Status |
|---------|:-:|:-:|:-:|:-:|:----:|:------:|
| Auth | ✅ | ✅ | - | - | - | 🟢 |
| Exercises | ✅ | ✅ | ✅ | ✅ | - | 🟢 |
| Plans | ✅ | ✅ | ✅ | ✅ | ✅ | 🟢 |
| Weeks | ✅ | ✅ | ✅ | ✅ | ✅ | 🟢 |
| Sessions | ✅ | ✅ | ✅ | ✅ | ✅ | 🟢 |
| Assign Plans | ✅ | ✅ | ⚠️ | - | - | 🟡 |
| Products | ✅ | ✅ | ✅ | ✅ | - | 🟢 |
| Attentions | ✅ | ✅ | - | - | - | 🟢 |
| Activities | ✅ | ✅ | - | - | - | 🟢 |
| Flex-Scheduling | ✅ | ✅ | ⚠️ | - | - | 🟡 |
| Shop Checkout | - | ✅ | - | - | - | 🔴 |
| Chat | - | - | - | - | - | 🔴 |

**Legende**: 🟢 Fertig | 🟡 Teilweise | 🔴 Nicht implementiert

---

## 7. MODULE & KASKADEN-ANWEISUNGEN

### Prinzip
> **Eine Kaskade = Ein Modul**. Maximale Fokussierung, keine Vermischung.

---

### MODUL A: Übungsbibliothek
**Dateien**: `pages/Exercises.tsx`, `components/ExerciseEditorModal.tsx`, `services/ai.ts`

```
Arbeite am MODUL EXERCISES in Greenlight Fitness.
Types: Exercise Interface in types.ts (Zeile 75-90)
CRUD: Vollständig implementiert
AI: generateExerciseIllustration, generateExerciseDescription, generateExerciseSequence
Aufgabe: [SPEZIFISCHE AUFGABE]
```

---

### MODUL B: Planner
**Dateien**: `pages/Planner.tsx`, `components/planner/*`

```
Arbeite am MODUL PLANNER in Greenlight Fitness.
Hierarchie: Plan > Week > Session > Block > Exercise > Set
Datenstruktur: plans/{planId}/weeks/{weekId}/sessions/{sessionId}
Session.workoutData = WorkoutBlock[] (JSON)
Block Types: Normal | Superset | Circuit
Aufgabe: [SPEZIFISCHE AUFGABE]
```

---

### MODUL C: Dashboard (Athlete)
**Datei**: `pages/Dashboard.tsx` (1224 Zeilen)

```
Arbeite am MODUL ATHLETE DASHBOARD in Greenlight Fitness.
Views: Hub (Wellness, Progress) | Training (Kalender, Session-Execution)
State: activePlan, viewMode, sessionActive, customSession
Analytics: completionRate, totalVolume, weeklyVolume[]
Aufgabe: [SPEZIFISCHE AUFGABE]
```

---

### MODUL D: Dashboard (Coach)
**Datei**: `pages/Dashboard.tsx`

```
Arbeite am MODUL COACH DASHBOARD in Greenlight Fitness.
Daten: attentions[], activityFeed[], appointments[]
Fetch: fetchCoachDashboardData() (Zeile 300-328)
Aufgabe: [SPEZIFISCHE AUFGABE]
```

---

### MODUL E: Shop & Produkte
**Dateien**: `pages/Shop.tsx`, `pages/AdminProducts.tsx`

```
Arbeite am MODUL SHOP in Greenlight Fitness.
Types: Product, ProductCategory, ProductType, SubscriptionInterval
ACHTUNG: Stripe-Integration fehlt noch!
Aufgabe: [SPEZIFISCHE AUFGABE]
```

---

### MODUL F: User Management
**Dateien**: `pages/AdminUsers.tsx`, `components/AthleteProfileModal.tsx`

```
Arbeite am MODUL USER MANAGEMENT in Greenlight Fitness.
Nur ADMIN Rolle (Route: /admin/users)
UserProfile: Biometrie + Profildaten
Aufgabe: [SPEZIFISCHE AUFGABE]
```

---

### MODUL G: Sports Science
**Dateien**: `utils/formulas.ts`, `components/CalculatorsModal.tsx`

```
Arbeite am MODUL SPORTS SCIENCE in Greenlight Fitness.
Formeln: calculateE1RM, calculateFFMI, calculateKarvonen, calculateACWR, etc.
Alle pure functions ohne Side Effects.
Aufgabe: [SPEZIFISCHE AUFGABE]
```

---

### MODUL H: Auth & Onboarding
**Dateien**: `pages/Login.tsx`, `pages/Register.tsx`, `context/AuthContext.tsx`, `components/ProfileSetupWizard.tsx`

```
Arbeite am MODUL AUTH in Greenlight Fitness.
Aktuell: Firebase Auth (wird zu Supabase migriert)
Rollen: ATHLETE | COACH | ADMIN
Onboarding: ProfileSetupWizard nach Registration
Aufgabe: [SPEZIFISCHE AUFGABE]
```

---

### MODUL I: Layout & Navigation
**Dateien**: `components/Layout.tsx`, `App.tsx`

```
Arbeite am MODUL LAYOUT in Greenlight Fitness.
Athlete: Bottom Navigation (Home, Training, Planner, Shop, Profile)
Coach/Admin: Desktop Sidebar + Mobile Hamburger
Aufgabe: [SPEZIFISCHE AUFGABE]
```

---

### MODUL J: Supabase Migration
**Dateien**: `services/supabase.ts` (neu), `services/firebase.ts` (deprecated)

```
Arbeite am MODUL SUPABASE MIGRATION in Greenlight Fitness.
Siehe Sektion 8 für vollständige Migrations-Roadmap.
Aufgabe: [SPEZIFISCHE AUFGABE]
```

---

## 8. SUPABASE MIGRATION

### Konfiguration

**Supabase Project URL**: `https://lfpcyhrccefbeowsgojv.supabase.co`

**Keys** (in `.env.local` speichern):
```env
VITE_SUPABASE_URL=https://lfpcyhrccefbeowsgojv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcHljaHJjY2VmYmVvd3Nnb2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTg1NTksImV4cCI6MjA4NTE3NDU1OX0.XXX
```

**⚠️ Service Role Key** (NUR Server-Side, NIEMALS im Frontend!):
```
# Nicht im Code speichern! Nur für DB-Deployment verwenden.
```

### Firebase → Supabase Mapping

| Firebase | Supabase | Notizen |
|----------|----------|---------|
| Firebase Auth | Supabase Auth | Email/Password, OAuth |
| Firestore | PostgreSQL | Relationale Tabellen statt NoSQL |
| Sub-Collections | Foreign Keys | `weeks.plan_id`, `sessions.week_id` |
| `serverTimestamp()` | `NOW()` / `DEFAULT` | PostgreSQL Timestamps |
| Firestore Rules | Row Level Security (RLS) | Policies pro Tabelle |
| Firebase Storage | Supabase Storage | Gleiche API-Struktur |

### Migrations-Phasen

> **STATUS**: ✅ Phase 1-5 abgeschlossen, Phase 6 teilweise

#### Phase 1: Setup & Auth (Kaskade 1) ✅ DONE
```
1. npm install @supabase/supabase-js
2. services/supabase.ts erstellen
3. AuthContext auf Supabase Auth umstellen
4. Login.tsx und Register.tsx anpassen
5. RLS Policies für profiles Tabelle
```

#### Phase 2: Exercises (Kaskade 2) ✅ DONE
```
1. exercises Tabelle + RLS erstellen
2. Exercises.tsx auf Supabase umstellen
3. ExerciseEditorModal anpassen
4. Daten von Firestore migrieren
```

#### Phase 3: Plans & Sessions (Kaskade 3) ✅ DONE
```
1. plans, weeks, sessions Tabellen erstellen
2. Planner.tsx, PlanEditor.tsx umstellen
3. SessionBuilder.tsx anpassen
4. Deep Copy Logik für Supabase
```

#### Phase 4: Assigned Plans (Kaskade 4) ✅ DONE
```
1. assigned_plans Tabelle erstellen
2. Dashboard Athlete View umstellen
3. Flex-Scheduling anpassen
```

#### Phase 5: Products & Shop (Kaskade 5) ✅ DONE
```
1. products Tabelle erstellen
2. Shop.tsx, AdminProducts.tsx umstellen
3. Stripe Integration vorbereiten
```

#### Phase 6: Cleanup (Kaskade 6) ⚠️ IN PROGRESS
```
1. Firebase Dependencies entfernen          ⭕ TODO
2. services/firebase.ts löschen             ⭕ TODO
3. firestore.rules archivieren              ⭕ TODO
4. PlanEditor komplett migrieren            ⭕ TODO
5. SessionBuilder komplett migrieren        ⭕ TODO
6. Finale Tests                             ⭕ TODO
```

### Supabase Client Code (Vorlage)

```typescript
// services/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth Helpers
export const signIn = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password });

export const signUp = (email: string, password: string) =>
  supabase.auth.signUp({ email, password });

export const signOut = () => supabase.auth.signOut();

// Realtime Subscription Example
export const subscribeToActivities = (callback: (payload: any) => void) =>
  supabase
    .channel('activities')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities' }, callback)
    .subscribe();
```

---

## 9. ENVIRONMENT SETUP

### Lokale Entwicklung

```bash
# 1. Repository klonen
cd /Users/dev/Downloads/Greenlight-Fitness-main

# 2. Dependencies installieren
npm install

# 3. Environment Datei erstellen
cp .env.example .env.local
# → Echte Keys eintragen!

# 4. Dev Server starten
npm run dev
```

### .env.local Inhalt

```env
# Supabase (KORREKTE URL mit 'b'!)
VITE_SUPABASE_URL=https://lfpcyhrccefbeowsgojv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google AI (Gemini)
VITE_GEMINI_API_KEY=your_key_here
```

---

## 10. ENTWICKLUNGS-RICHTLINIEN

### Prinzip der Vollständigkeit (CRUD)
Jedes Feature muss vollständig sein:
- **Create**: Erstellen von Daten
- **Read**: Anzeigen in Listen + Detail
- **Update**: Bearbeiten von Metadaten
- **Delete**: Löschen mit Double-Confirm Modal

### Daten-Integrität
- Beim Löschen: Cascading oder explizite Warnung
- Deep Copy für Assigned Plans (Snapshot)
- Niemals Referenzen teilen zwischen Athleten

### Security
- RLS Policies für jede Tabelle
- Service Role Key NUR server-side
- Anon Key für Frontend

### Code Style
- Functional Components + Hooks
- TypeScript strict mode
- Tailwind für Styling
- Lucide für Icons

---

## 📌 QUICK REFERENCE

### Befehle
```bash
npm run dev      # Development Server
npm run build    # Production Build
npm run preview  # Preview Build
```

### Wichtige Types (types.ts)
- `UserRole`: ATHLETE | COACH | ADMIN
- `WorkoutBlock`: Normal | Superset | Circuit
- `AssignmentType`: ONE_TO_ONE | GROUP_FLEX
- `ScheduleStatus`: PENDING | ACTIVE | COMPLETED

### Dateien nach Größe
1. `pages/Dashboard.tsx` – 79KB (1224 Zeilen)
2. `components/planner/SessionBuilder.tsx` – 46KB (804 Zeilen)
3. `components/planner/PlanEditor.tsx` – 31KB
4. `utils/translations.ts` – 26KB
5. `components/ExerciseEditorModal.tsx` – 25KB

---

## 11. NÄCHSTE SCHRITTE (TODO)

### Priorität 1: Kritisch
- [ ] **Session löschen im Browser**: `localStorage.clear(); sessionStorage.clear();` ausführen
- [ ] **Neuen Account erstellen**: Registrierung testen
- [ ] **Login testen**: Mit neuem Account einloggen

### Priorität 2: Cleanup
- [ ] Firebase aus `package.json` entfernen: `npm uninstall firebase`
- [ ] `services/firebase.ts` löschen
- [ ] `firestore.rules` in `/archive/` verschieben
- [ ] Firebase-Imports aus `index.html` importmap entfernen

### Priorität 3: Planner komplett migrieren
- [ ] `PlanEditor.tsx`: Verbleibende Firebase-Aufrufe ersetzen
- [ ] `SessionBuilder.tsx`: Firebase-Imports entfernen
- [ ] `ExerciseSelector.tsx`: Auf Supabase umstellen
- [ ] `LibrarySelector.tsx`: Auf Supabase umstellen

### Priorität 4: Features
- [ ] **Stripe Integration** für Shop Checkout
- [ ] **Chat Feature** implementieren
- [ ] **Push Notifications** via Supabase Realtime
- [ ] **PWA Manifest** für App-Installation

### Priorität 5: Optimierungen
- [ ] TypeScript `vite-env.d.ts` für `import.meta.env` fixen
- [ ] Supabase Types generieren: `npx supabase gen types typescript`
- [ ] Error Boundaries einführen
- [ ] Loading States verbessern

---

## 12. BEFEHLE FÜR ENTWICKLER

```bash
# App starten
npm run dev

# Schema in Supabase deployen (mit DB-Passwort)
PGPASSWORD='GreenlightFitnessSupaBase1!' psql -h db.lfpcyhrccefbeowsgojv.supabase.co -p 5432 -U postgres -d postgres -f supabase-schema.sql

# Firebase entfernen (nach Migration)
npm uninstall firebase

# Supabase Types generieren
npx supabase gen types typescript --project-id lfpcyhrccefbeowsgojv > types/supabase.ts
```

---
**Dokument-Ende** | Greenlight Fitness 2026
