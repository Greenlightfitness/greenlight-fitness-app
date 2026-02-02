# Greenlight Fitness - Wiederverwendbarkeit & Versionierung

## Übersicht

Dieses Dokument beschreibt das erweiterte Datenmodell für:
- **Wiederverwendbare Komponenten** (Blöcke, Sessions, Wochen, Pläne)
- **Plan-Versionierung**
- **Gruppencoaching mit asynchronem Start**
- **Flexible Trainingstag-Wahl**
- **Produkte mit mehreren Plänen (Module)**

---

## 1. Hierarchie der Komponenten

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCT                                  │
│  (z.B. "Police Fitness Complete" - enthält 4 Module)            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCT_MODULES                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Modul 1  │ │ Modul 2  │ │ Modul 3  │ │ Modul 4  │           │
│  │ (Plan A) │ │ (Plan B) │ │ (Plan C) │ │ (Plan D) │           │
│  │ order=1  │ │ order=2  │ │ order=3  │ │ order=4  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PLAN (mit Versionen)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ plan_versions: v1.0 → v1.1 → v2.0 (current)               │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         WEEKS                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Woche 1  │ │ Woche 2  │ │ Woche 3  │ │ Woche 4  │ ...       │
│  │Foundation│ │ Volume   │ │Intensity │ │ Deload   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SESSIONS                                   │
│  (können aus session_templates erstellt werden)                  │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │ Push   │ │ Pull   │ │ Legs   │ │ Upper  │ │ Rest   │        │
│  │ Day    │ │ Day    │ │ Day    │ │ Body   │ │ Day    │        │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        BLOCKS                                    │
│  (können aus block_templates erstellt werden)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Warm-Up  │ │ Main     │ │ Circuit  │ │ Cooldown │           │
│  │ Block    │ │ Compound │ │ Finisher │ │ Block    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EXERCISES                                  │
│  (globale Übungsbibliothek, wiederverwendbar)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Neue Datenbank-Tabellen

### 2.1 Plan Versionierung

```sql
-- Plan Versionen
CREATE TABLE plan_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    version_number VARCHAR(20) NOT NULL,  -- "1.0", "1.1", "2.0"
    version_notes TEXT,                    -- Changelog
    is_published BOOLEAN DEFAULT false,    -- Für Athleten sichtbar?
    is_current BOOLEAN DEFAULT false,      -- Aktuelle Version?
    created_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    
    -- Snapshot der Struktur bei Veröffentlichung
    structure_snapshot JSONB,
    
    UNIQUE(plan_id, version_number)
);
```

### 2.2 Wiederverwendbare Templates

```sql
-- Block Templates (wiederverwendbare Workout-Blöcke)
CREATE TABLE block_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES profiles(id),
    name VARCHAR(100) NOT NULL,           -- "Standard Warm-Up", "PPL Push Finisher"
    description TEXT,
    block_type VARCHAR(20) DEFAULT 'Normal', -- Normal, Superset, Circuit
    block_data JSONB NOT NULL,            -- WorkoutBlock JSON
    tags TEXT[],                          -- ["warm-up", "upper-body", "beginner"]
    is_system_template BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Session Templates (wiederverwendbare Trainingstage)
CREATE TABLE session_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES profiles(id),
    name VARCHAR(100) NOT NULL,           -- "Push Day A", "Full Body Strength"
    description TEXT,
    estimated_duration_min INTEGER,        -- Geschätzte Dauer in Minuten
    session_data JSONB NOT NULL,          -- Komplette Session mit Blocks
    tags TEXT[],
    is_system_template BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Week Templates (wiederverwendbare Wochen)
CREATE TABLE week_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES profiles(id),
    name VARCHAR(100) NOT NULL,           -- "PPL Week", "Deload Week"
    description TEXT,
    focus VARCHAR(100),
    sessions_per_week INTEGER DEFAULT 4,
    week_data JSONB NOT NULL,             -- Array von Session-Referenzen oder inline Sessions
    tags TEXT[],
    is_system_template BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Produkt-Module (Mehrere Pläne pro Produkt)

```sql
-- Produkt-Module Verknüpfung
CREATE TABLE product_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id) ON DELETE CASCADE,
    module_order INTEGER NOT NULL,         -- Reihenfolge: 1, 2, 3, 4
    module_name VARCHAR(100),              -- Optional: "Phase 1: Foundation"
    is_entry_point BOOLEAN DEFAULT false,  -- Kann hier gestartet werden?
    prerequisites TEXT[],                  -- IDs von vorherigen Modulen (optional)
    
    UNIQUE(product_id, plan_id),
    UNIQUE(product_id, module_order)
);
```

### 2.4 Erweiterte Athleten-Zuweisung

```sql
-- Erweiterte assigned_plans Tabelle
ALTER TABLE assigned_plans ADD COLUMN IF NOT EXISTS 
    product_id UUID REFERENCES products(id),
    current_module_order INTEGER DEFAULT 1,
    plan_version_id UUID REFERENCES plan_versions(id),
    coaching_type VARCHAR(20) DEFAULT 'ONE_TO_ONE', -- ONE_TO_ONE, GROUP_SYNC, GROUP_ASYNC
    
    -- Flexible Scheduling für GROUP_ASYNC
    sessions_per_week INTEGER,             -- Wie viele Sessions pro Woche?
    rest_days_between INTEGER DEFAULT 1,   -- Mindest-Ruhetage zwischen Sessions
    preferred_days INTEGER[],              -- [0,2,4] = Mo, Mi, Fr
    
    -- Progress Tracking
    completed_sessions INTEGER DEFAULT 0,
    total_sessions INTEGER,
    progress_percentage DECIMAL(5,2) DEFAULT 0;

-- Athleten Schedule Preferences
CREATE TABLE athlete_schedule_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    assigned_plan_id UUID REFERENCES assigned_plans(id) ON DELETE CASCADE,
    
    -- Wöchentliche Präferenzen
    available_days INTEGER[] NOT NULL,     -- [0,1,2,3,4] = Mo-Fr
    preferred_time_of_day VARCHAR(20),     -- "morning", "afternoon", "evening"
    max_sessions_per_week INTEGER DEFAULT 5,
    min_rest_days INTEGER DEFAULT 1,
    
    -- Automatische Planung
    auto_schedule BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(athlete_id, assigned_plan_id)
);
```

---

## 3. Coaching-Typen

### 3.1 ONE_TO_ONE (1:1 Coaching)
- Coach weist Plan direkt zu
- Feste Tage (z.B. Mo, Mi, Fr)
- Synchron: Coach und Athlet im gleichen Rhythmus

### 3.2 GROUP_SYNC (Synchrones Gruppencoaching)
- Alle starten am gleichen Tag
- Gleiche Wochen für alle
- Feste Tage für die Gruppe

### 3.3 GROUP_ASYNC (Asynchrones Gruppencoaching)
- Athleten können jederzeit starten
- Jeder Athlet wählt eigenen Startpunkt (Modul)
- Flexible Trainingstage innerhalb der Woche
- Gleicher Inhalt, unterschiedlicher Zeitplan

```
Beispiel GROUP_ASYNC:
┌─────────────────────────────────────────────────────────────────┐
│ Produkt: "Police Fitness 12-Wochen-Programm"                    │
│                                                                  │
│ Athlet A (startet 01.01.):                                      │
│   Woche 1: Mo, Mi, Fr    → Sessions 1, 2, 3                     │
│   Woche 2: Di, Do, Sa    → Sessions 4, 5, 6                     │
│                                                                  │
│ Athlet B (startet 15.01., beginnt bei Modul 2):                 │
│   Woche 1: Mo, Mi, Fr, Sa → Sessions 1, 2, 3, 4                 │
│   Woche 2: Di, Do         → Sessions 5, 6                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Versionierungs-Workflow

### 4.1 Version erstellen
1. Coach bearbeitet Plan
2. Änderungen werden gespeichert
3. Coach klickt "Version veröffentlichen"
4. System erstellt Snapshot in `plan_versions`
5. Neue Version wird `is_current = true`

### 4.2 Athleten-Update
- **Option A**: Automatisch (empfohlen für kleine Updates)
- **Option B**: Manuell (Athlet muss zustimmen)
- **Option C**: Nie (Athlet bleibt auf alter Version)

```sql
-- Beispiel: Athlet auf neue Version upgraden
UPDATE assigned_plans 
SET plan_version_id = (
    SELECT id FROM plan_versions 
    WHERE plan_id = assigned_plans.original_plan_id 
    AND is_current = true
)
WHERE athlete_id = 'xxx' AND original_plan_id = 'yyy';
```

---

## 5. Flexible Tagwahl (GROUP_ASYNC)

### Algorithmus für automatische Planung:

```typescript
function scheduleSessionsForWeek(
  athletePrefs: AthleteSchedulePreferences,
  weekSessions: Session[]
): ScheduledSession[] {
  const availableDays = athletePrefs.available_days; // [0, 2, 4] = Mo, Mi, Fr
  const minRest = athletePrefs.min_rest_days;        // 1
  const sessionsToSchedule = weekSessions.length;    // 4
  
  // Verteile Sessions gleichmäßig auf verfügbare Tage
  // mit mindestens minRest Tagen Pause dazwischen
  
  const scheduled = [];
  let lastDay = -Infinity;
  
  for (const session of weekSessions) {
    // Finde nächsten verfügbaren Tag mit genug Pause
    const nextDay = availableDays.find(d => d >= lastDay + minRest + 1);
    if (nextDay !== undefined) {
      scheduled.push({ session, dayOfWeek: nextDay });
      lastDay = nextDay;
    }
  }
  
  return scheduled;
}
```

---

## 6. Migration bestehender Daten

```sql
-- 1. products.planId → product_modules migrieren
INSERT INTO product_modules (product_id, plan_id, module_order, is_entry_point)
SELECT id, plan_id, 1, true FROM products WHERE plan_id IS NOT NULL;

-- 2. Erste Version für alle bestehenden Pläne erstellen
INSERT INTO plan_versions (plan_id, version_number, is_published, is_current)
SELECT id, '1.0', true, true FROM plans;

-- 3. assigned_plans mit version_id verknüpfen
UPDATE assigned_plans ap
SET plan_version_id = (
    SELECT pv.id FROM plan_versions pv 
    WHERE pv.plan_id = ap.original_plan_id AND pv.is_current = true
);
```

---

## 7. API Endpoints (geplant)

```typescript
// Plan Versionen
GET    /api/plans/:id/versions
POST   /api/plans/:id/versions          // Neue Version erstellen
PUT    /api/plans/:id/versions/:vid     // Version veröffentlichen

// Templates
GET    /api/templates/blocks
POST   /api/templates/blocks
GET    /api/templates/sessions
POST   /api/templates/sessions
GET    /api/templates/weeks
POST   /api/templates/weeks

// Produkt-Module
GET    /api/products/:id/modules
POST   /api/products/:id/modules
PUT    /api/products/:id/modules/:mid

// Athleten Scheduling
GET    /api/athletes/:id/schedule-preferences
PUT    /api/athletes/:id/schedule-preferences
POST   /api/assigned-plans/:id/auto-schedule
```

---

## 8. Zusammenfassung

| Feature | Status | Priorität |
|---------|--------|-----------|
| Plan Versionierung | 🔲 Geplant | Hoch |
| Block Templates | 🔲 Geplant | Mittel |
| Session Templates | 🔲 Geplant | Mittel |
| Week Templates | 🔲 Geplant | Niedrig |
| Produkt-Module | 🔲 Geplant | Hoch |
| GROUP_ASYNC Coaching | 🔲 Geplant | Hoch |
| Flexible Tagwahl | 🔲 Geplant | Hoch |
| Auto-Scheduling | 🔲 Geplant | Mittel |

---

*Erstellt: 2026-02-02*
*Version: 1.0*
