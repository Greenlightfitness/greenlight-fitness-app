

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
  avatarUrl?: string;
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

// Exercise Tracking Types - defines what metrics this exercise uses
export type ExerciseTrackingType = 
  | 'WEIGHT_REPS'     // Standard: Weight (kg) + Reps (e.g. Bench Press)
  | 'BODYWEIGHT_REPS' // No weight: Just Reps (e.g. Pull-ups, Push-ups)
  | 'TIME'            // Duration: Time in seconds/minutes (e.g. Plank, Run)
  | 'DISTANCE'        // Distance: Meters/km (e.g. Running, Rowing)
  | 'TIME_DISTANCE'   // Both: Time + Distance (e.g. 5km Run)
  | 'REPS_ONLY';      // Just counting reps (e.g. Jumping Jacks)

export interface Exercise {
  id: string;
  authorId?: string; // Who created this exercise
  authorRole?: 'ADMIN' | 'COACH' | 'ATHLETE'; // Role of creator
  name: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  trackingType?: ExerciseTrackingType; // NEW: What type of exercise is this?
  videoUrl?: string;
  thumbnailUrl?: string; // AI Generated Illustration (16:9)
  animationUrl?: string; // Deprecated: AI Generated Video URL (Veo)
  sequenceUrl?: string; // New: AI Generated Vertical Sequence Image (9:16)
  isArchived?: boolean;
  isPublic?: boolean; // Can other users see/use this exercise?
  // Template configurations
  defaultSets?: WorkoutSet[];
  defaultVisibleMetrics?: string[];
}

export interface TrainingPlan {
  id: string;
  coachId: string;
  name: string;
  description?: string;
  isSystemPlan?: boolean;
  createdAt: any;
}

// --- PLAN VERSIONING ---

export interface PlanVersion {
  id: string;
  planId: string;
  versionNumber: string;        // "1.0", "1.1", "2.0"
  versionNotes?: string;
  isPublished: boolean;
  isCurrent: boolean;
  structureSnapshot?: any;      // Full plan structure at publish time
  createdAt: any;
  publishedAt?: any;
}

// --- REUSABLE TEMPLATES ---

export interface BlockTemplate {
  id: string;
  coachId: string;
  name: string;
  description?: string;
  blockType: BlockType;
  blockData: WorkoutBlock;
  tags?: string[];
  isSystemTemplate: boolean;
  createdAt: any;
}

export interface SessionTemplate {
  id: string;
  coachId: string;
  name: string;
  description?: string;
  estimatedDurationMin?: number;
  sessionData: WorkoutBlock[];
  tags?: string[];
  isSystemTemplate: boolean;
  createdAt: any;
}

export interface WeekTemplate {
  id: string;
  coachId: string;
  name: string;
  description?: string;
  focus?: string;
  sessionsPerWeek: number;
  weekData: any;                // Sessions array
  tags?: string[];
  isSystemTemplate: boolean;
  createdAt: any;
}

// --- PRODUCT MODULES ---

export interface ProductModule {
  id: string;
  productId: string;
  planId: string;
  moduleOrder: number;
  moduleName?: string;
  isEntryPoint: boolean;
  prerequisites?: string[];
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
  hasChatAccess?: boolean; // Whether this product includes chat with coach
  trialDays?: number; // Free trial period in days (Stripe trial_period_days)
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
  isCompleted?: boolean; // Runtime: block completion state
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
export type CoachingType = 'ONE_TO_ONE' | 'GROUP_SYNC' | 'GROUP_ASYNC';
export type ScheduleStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED';

// --- ATHLETE SCHEDULING ---

export interface AthleteSchedulePreferences {
  id: string;
  athleteId: string;
  assignedPlanId: string;
  availableDays: number[];       // [0,1,2,3,4] = Mo-Fr
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening';
  maxSessionsPerWeek: number;
  minRestDays: number;
  autoSchedule: boolean;
}

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
    scheduleStatus: ScheduleStatus; // Controls the onboarding flow
    // Manual schedule overrides for FLEX mode. Key = "YYYY-MM-DD", Value = sessionId
    schedule?: Record<string, string>; 
    structure: {
        weeks: AssignedWeek[];
    };
    
    // --- NEW: Extended fields for modules & async coaching ---
    productId?: string;              // If assigned via product purchase
    currentModuleOrder?: number;     // Current module in multi-module product
    planVersionId?: string;          // Specific version of the plan
    coachingType?: CoachingType;     // ONE_TO_ONE, GROUP_SYNC, GROUP_ASYNC
    sessionsPerWeek?: number;        // For flexible scheduling
    restDaysBetween?: number;        // Min rest days between sessions
    preferredDays?: number[];        // [0,2,4] = Mo, Mi, Fr
    completedSessions?: number;      // Progress tracking
    totalSessions?: number;
    progressPercentage?: number;
}

// --- COACHING APPROVALS (Vorabgespräch + Freischaltung) ---

export interface CoachingApproval {
  id: string;
  athleteId: string;
  productId: string;
  consultationCompleted: boolean;
  consultationAppointmentId?: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  isManualGrant: boolean;
  grantReason?: string;
  createdAt: any;
}

// --- COACHING RELATIONSHIPS (Aktive 1:1 Beziehungen) ---

export interface CoachingRelationship {
  id: string;
  athleteId: string;
  coachId: string;
  productId?: string;
  status: 'ACTIVE' | 'PAUSED' | 'ENDED';
  startedAt: string;
  endedAt?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
  isManualGrant: boolean;
  grantReason?: string;
  createdAt: any;
}

// --- GOALS (Zielvorhaben) ---

export type GoalType = 'STRENGTH' | 'ENDURANCE' | 'BODY_COMP' | 'CONSISTENCY' | 'CUSTOM';
export type GoalStatus = 'ACTIVE' | 'ACHIEVED' | 'FAILED' | 'PAUSED';

export interface Goal {
  id: string;
  athleteId: string;
  coachId?: string;
  title: string;
  description?: string;
  goalType: GoalType;
  targetValue: number;
  targetUnit: string;
  startValue?: number;
  currentValue: number;
  startDate: string;
  targetDate: string;
  exerciseId?: string;
  metricKey?: string;
  status: GoalStatus;
  achievedAt?: string;
  createdAt: any;
  // Computed
  progressPercentage?: number;
}

export interface GoalCheckpoint {
  id: string;
  goalId: string;
  recordedAt: string;
  value: number;
  notes?: string;
  source: 'WORKOUT' | 'MANUAL' | 'PROFILE_UPDATE';
  createdAt: any;
}

// --- INVITATIONS (E-Mail Einladungen) ---

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface Invitation {
  id: string;
  email: string;
  invitedBy: string;
  invitationCode: string;
  personalMessage?: string;
  role: 'ATHLETE' | 'COACH';
  autoApproveCoaching: boolean;
  autoAssignProductId?: string;
  autoAssignPlanId?: string;
  isBonusGrant: boolean;
  bonusProductId?: string;
  bonusReason?: string;
  status: InvitationStatus;
  expiresAt?: string;
  acceptedAt?: string;
  acceptedByUserId?: string;
  createdAt: any;
}

// --- BODY MEASUREMENTS (Körperdaten über Zeit) ---

export interface BodyMeasurement {
  id: string;
  athleteId: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  waistCircumference?: number;
  chest?: number;
  armLeft?: number;
  armRight?: number;
  thighLeft?: number;
  thighRight?: number;
  notes?: string;
  createdAt: any;
}

// --- COACH NOTES (Notizen pro Athlet) ---

export interface CoachNote {
  id: string;
  coachId: string;
  athleteId: string;
  title?: string;
  content: string;
  tags?: string[];
  isPinned: boolean;
  createdAt: any;
  updatedAt: any;
}

// --- WORKOUT FEEDBACK (Coach-Kommentare auf Logs) ---

export interface WorkoutFeedback {
  id: string;
  workoutLogId: string;
  coachId: string;
  athleteId: string;
  comment: string;
  rating?: number;
  createdAt: any;
}

// --- CHECK-INS (Wöchentliche Athleten Check-Ins) ---

export type CheckInStatus = 'SUBMITTED' | 'REVIEWED';

export interface CheckIn {
  id: string;
  athleteId: string;
  coachId?: string;
  weekStart: string;
  weight?: number;
  bodyFat?: number;
  nutritionRating?: number;
  sleepRating?: number;
  stressRating?: number;
  energyRating?: number;
  notes?: string;
  coachResponse?: string;
  photoUrls?: string[];
  status: CheckInStatus;
  submittedAt: any;
  reviewedAt?: any;
  createdAt: any;
}

// Initial seed data for the request
export const INITIAL_EXERCISES: Omit<Exercise, 'id'>[] = [
  { name: 'Liegestütze', description: 'Klassische Übung für Brust und Trizeps.', category: 'Upper Body', difficulty: 'Beginner', videoUrl: 'https://www.youtube.com/watch?v=iodWe3bgOQw' },
  { name: 'Kniebeugen', description: 'Grundübung für Beine und Gesäß.', category: 'Legs', difficulty: 'Beginner' },
  { name: 'Klimmzüge', description: 'Zugübung für den Rücken.', category: 'Back', difficulty: 'Intermediate' },
  { name: 'Plank', description: 'Statische Übung für die Rumpfmuskulatur.', category: 'Core', difficulty: 'Beginner' },
  { name: 'Laufen', description: 'Ausdauertraining.', category: 'Cardio', difficulty: 'Beginner' },
];