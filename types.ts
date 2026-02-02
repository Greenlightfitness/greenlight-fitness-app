

export enum UserRole {
  ATHLETE = 'ATHLETE',
  COACH = 'COACH',
  ADMIN = 'ADMIN'
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  // Secondary role for dual-role users (e.g., Coach who is also an Athlete)
  // TODO: Langfristig sollen nur Admins Coaches einladen können (aktuell Testphase)
  secondaryRole?: UserRole;
  displayName?: string;
  createdAt: any; // Firestore Timestamp
  // Biometrics & Profile (New fields for formulas)
  firstName?: string;
  lastName?: string;
  nickname?: string;
  gender?: 'male' | 'female';
  birthDate?: string; // ISO Date YYYY-MM-DD
  height?: number; // in cm
  weight?: number; // in kg
  waistCircumference?: number; // in cm
  bodyFat?: number; // in %
  restingHeartRate?: number; // bpm
  maxHeartRate?: number; // bpm
  onboardingCompleted?: boolean;
}

// --- ATTENTIONS & ACTIVITIES (NEW) ---

export type AttentionType = 'INJURY' | 'MISSED_SESSION' | 'FEEDBACK' | 'OTHER';
export type AttentionSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type AttentionStatus = 'OPEN' | 'RESOLVED' | 'ARCHIVED';

export interface Attention {
  id: string;
  athleteId: string;
  athleteName: string; // Denormalized for easier display
  coachId?: string; // Optional: target specific coach
  type: AttentionType;
  severity: AttentionSeverity;
  message: string;
  status: AttentionStatus;
  createdAt: any;
}

export type ActivityType = 'WORKOUT_COMPLETE' | 'PR_HIT' | 'CHECK_IN' | 'NOTE';

export interface ActivityFeedItem {
  id: string;
  athleteId: string;
  athleteName: string; // Denormalized
  type: ActivityType;
  title: string;
  subtitle?: string;
  metadata?: any; // e.g. { volume: 1000, sessionName: "Legs A" }
  createdAt: any;
}

export interface Appointment {
  id: string;
  athleteId: string;
  athleteName: string;
  coachId: string;
  date: string; // ISO Date string
  time: string; // "10:00"
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED';
  type: 'CONSULTATION' | 'CHECKIN';
  createdAt: any;
}

// --- EXERCISES ---

export interface Exercise {
  id: string;
  authorId?: string; // New: Who created this?
  name: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  videoUrl?: string;
  thumbnailUrl?: string; // AI Generated Illustration (16:9)
  animationUrl?: string; // Deprecated: AI Generated Video URL (Veo)
  sequenceUrl?: string; // New: AI Generated Vertical Sequence Image (9:16)
  isArchived?: boolean;
  // Template configurations
  defaultSets?: WorkoutSet[];
  defaultVisibleMetrics?: string[];
}

export interface TrainingPlan {
  id: string;
  coachId: string;
  name: string;
  description?: string;
  createdAt: any;
}

export interface TrainingWeek {
  id: string;
  planId: string;
  order: number; // 1, 2, 3...
  focus?: string; // e.g., "Hypertrophy Phase"
}

// --- PRODUCT / SHOP TYPES ---

export type SubscriptionInterval = 'onetime' | 'month' | 'year';
export type ProductCategory = 'POLICE' | 'FIRE' | 'MILITARY' | 'GENERAL' | 'RECOVERY';
export type ProductType = 'PLAN' | 'COACHING_1ON1' | 'ADDON';

export interface Product {
  id: string;
  coachId: string; // The admin/coach selling it
  planId: string; // The specific plan linked to this product (optional for addons)
  title: string;
  description: string; // Short description for card
  longDescription?: string; // Full sales page text
  features?: string[]; // Bullet points
  category: ProductCategory;
  type: ProductType;
  price: number;
  currency: string;
  interval: SubscriptionInterval;
  thumbnailUrl?: string;
  isActive: boolean;
}

// --- WORKOUT BUILDER TYPES ---

export type SetType = 'Normal' | 'Dropset' | 'Warmup' | 'AMRAP';

export interface WorkoutSet {
  id: string; // Internal UUID for UI handling
  type: SetType;
  // TARGET Values (Set by Coach)
  reps?: string;
  weight?: string;
  pct_1rm?: string; 
  distance?: string;
  time?: string;
  rpe?: string;
  tempo?: string;
  rest?: string;
  notes?: string;
  
  // ACTUAL Values (Logged by Athlete)
  completedReps?: string;
  completedWeight?: string;
  completedRpe?: string;
  completedDistance?: string;
  completedTime?: string;
  isCompleted?: boolean;
}

export interface WorkoutExercise {
  id: string; // Internal UUID
  exerciseId: string; // Reference to global 'exercises' collection
  name: string; // Denormalized name
  videoUrl?: string;
  notes?: string;
  // Which columns to show for this exercise in the UI
  visibleMetrics?: ('reps' | 'weight' | 'pct_1rm' | 'distance' | 'time' | 'rpe' | 'tempo')[]; 
  sets: WorkoutSet[];
}

export type BlockType = 'Normal' | 'Superset' | 'Circuit';

export interface WorkoutBlock {
  id: string; // Internal UUID
  name: string; // "A", "B", "C" or Custom
  type: BlockType; // Explicitly defined type
  rounds?: string; // Specific for Circuits
  restBetweenRounds?: string; // Specific for Circuits
  exercises: WorkoutExercise[];
}

export interface TrainingSession {
  id: string;
  weekId: string;
  dayOfWeek: number; // 0 = Monday, 6 = Sunday
  title: string;
  description?: string;
  order: number;
  workoutData?: WorkoutBlock[]; // The complex builder data
}

// --- ASSIGNED PLAN SNAPSHOT TYPES ---

export type AssignmentType = 'ONE_TO_ONE' | 'GROUP_FLEX';
export type ScheduleStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED';

export interface AssignedSession extends Omit<TrainingSession, 'weekId'> {
    // WeekId is implicit in the nested structure
}

export interface AssignedWeek extends Omit<TrainingWeek, 'planId'> {
    sessions: AssignedSession[];
}

export interface AssignedPlan {
    id: string;
    athleteId: string;
    coachId: string;
    originalPlanId: string;
    assignedAt: any; // Timestamp
    startDate: string; // ISO String "YYYY-MM-DD" representing the start date of Week 1
    planName: string;
    description?: string;
    assignmentType: AssignmentType;
    scheduleStatus: ScheduleStatus; // NEW: Controls the onboarding flow
    // NEW: Manual schedule overrides for FLEX mode. Key = "YYYY-MM-DD", Value = sessionId
    schedule?: Record<string, string>; 
    structure: {
        weeks: AssignedWeek[];
    };
}

// Initial seed data for the request
export const INITIAL_EXERCISES: Omit<Exercise, 'id'>[] = [
  { name: 'Liegestütze', description: 'Klassische Übung für Brust und Trizeps.', category: 'Upper Body', difficulty: 'Beginner', videoUrl: 'https://www.youtube.com/watch?v=iodWe3bgOQw' },
  { name: 'Kniebeugen', description: 'Grundübung für Beine und Gesäß.', category: 'Legs', difficulty: 'Beginner' },
  { name: 'Klimmzüge', description: 'Zugübung für den Rücken.', category: 'Back', difficulty: 'Intermediate' },
  { name: 'Plank', description: 'Statische Übung für die Rumpfmuskulatur.', category: 'Core', difficulty: 'Beginner' },
  { name: 'Laufen', description: 'Ausdauertraining.', category: 'Cardio', difficulty: 'Beginner' },
];