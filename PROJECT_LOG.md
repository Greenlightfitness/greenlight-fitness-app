
# Greenlight Fitness - Project Log & Guidelines

## 1. Projekt-Status & Prinzipien
**Ziel:** Professionelle PWA für Fitness-Coaching (TrainHeroic-Style).
**Tech Stack:** React, TypeScript, Tailwind CSS, Firebase (Auth, Firestore Lite).
**Design:** Dark Mode (#121212), Green Accents (#00FF00), Font: Inter.

## 2. Architektur-Richtlinien (Guidelines)
1.  **Vollständigkeit (CRUD):** Jedes Daten-Feature (Plans, Exercises, Sessions) muss vollständig verwaltet werden können:
    *   **Create:** Erstellen.
    *   **Read:** Anzeigen/Listen.
    *   **Update:** Bearbeiten (Namen, Beschreibungen, Details).
    *   **Delete:** Löschen (mit Sicherheitsabfrage).
2.  **Daten-Integrität:** Beim Löschen von Eltern-Dokumenten (z.B. Plans) muss bedacht werden, was mit Kind-Dokumenten (Weeks/Sessions) passiert (in Firestore Lite client-side handling notwendig).
3.  **Security First:** Firestore Rules müssen den Zugriff auf User-Ebene beschränken (Coach darf nur eigene Pläne sehen).
4.  **Versionierung:** Wichtige Datenstrukturen (Plans, Weeks, Sessions) müssen duplizierbar sein, um "Safe Versions" zu erstellen.

## 3. Feature Roadmap & Status

| Feature | Create | Read | Update | Delete | Copy/Ver | Status | Notes |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **Auth** | ✅ | ✅ | - | - | - | 🟢 Fertig | Login/Register implemented. |
| **Exercises** | ✅ | ✅ | ✅ | ✅ | - | 🟢 Fertig | Full Library Management. |
| **Plans (Root)** | ✅ | ✅ | ✅ | ✅ | ✅ | 🟢 Fertig | Deep Copy (Plan->Weeks->Sessions). |
| **Weeks** | ✅ | ✅ | ✅ | ✅ | ✅ | 🟢 Fertig | Deep Copy (Week->Sessions). |
| **Sessions** | ✅ | ✅ | ✅ | ✅ | ✅ | 🟢 Fertig | DnD & Duplication. |
| **Log/Assign** | ✅ | ✅ | - | - | - | 🟢 Fertig | Zuweisen von Plänen & Training. |
| **Attentions**| ✅ | ✅ | - | - | - | 🟢 Fertig | Reporting von Verletzungen/Issues. |
| **Feed**      | ✅ | ✅ | - | - | - | 🟢 Fertig | Coach sieht Team-Aktivität Live. |

## 4. Changelog
*   **Init:** Basis-Setup, Routing, Auth.
*   **Exercises:** Listenansicht und Erstellung.
*   **Planner:** Plan-Erstellung, Drag&Drop-ähnliches Grid, Wochen-Management.
*   **Refactor:** Vollständige CRUD-Logik für Übungen implementiert (Edit/Delete).
*   **Planner V2:** Drag & Drop für Sessions, Plan Metadata Editor, Week Focus Editor Verbesserungen.
*   **Planner V3:** "Double Confirmation" Modals für alle Löschvorgänge. Deep-Copy Funktion für Pläne, Wochen und Sessions implementiert.
*   **Dashboard V2:** Coach View zeigt nun Live-Daten (Compliance, Attentions, Activity Feed). Athlete View erlaubt Reporting von Issues.
*   **Attentions:** Neue Collection für Issues. Athletes können Report senden.
*   **Activities:** Automatische Erstellung von Einträgen bei 'Finish Session' und 'Report Issue'.