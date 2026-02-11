import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lfpcyhrccefbeowsgojv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcGN5aHJjY2VmYmVvd3Nnb2p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1OTg1NTksImV4cCI6MjA4NTE3NDU1OX0.099PgzM5nxL0dot6dCX1VsUepqaJ7Y_pPgv0GvH9DBc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============ AUTH HELPERS ============

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = () => supabase.auth.getUser();

export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// ============ PROFILES ============

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const createProfile = async (profile: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============ EXERCISES ============

export const getExercises = async () => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
};

export const getExerciseById = async (id: string) => {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    authorId: data.author_id,
    name: data.name,
    description: data.description,
    category: data.category,
    difficulty: data.difficulty,
    trackingType: data.tracking_type,
    videoUrl: data.video_url,
    thumbnailUrl: data.thumbnail_url,
    sequenceUrl: data.sequence_url,
    isArchived: data.is_archived,
    defaultSets: data.default_sets,
    defaultVisibleMetrics: data.default_visible_metrics,
  } as any;
};

export const createExercise = async (exercise: any) => {
  const { data, error } = await supabase
    .from('exercises')
    .insert(exercise)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateExercise = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('exercises')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteExercise = async (id: string) => {
  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ============ PLANS ============

export const getPlans = async (coachId?: string) => {
  let query = supabase.from('plans').select('*');
  if (coachId) {
    // Show own plans + system plans (created by admins for all coaches)
    query = query.or(`coach_id.eq.${coachId},is_system_plan.eq.true`);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createPlan = async (plan: any) => {
  const { data, error } = await supabase
    .from('plans')
    .insert(plan)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updatePlan = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deletePlan = async (id: string) => {
  const { error } = await supabase
    .from('plans')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ============ WEEKS ============

export const getWeeksByPlan = async (planId: string) => {
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .eq('plan_id', planId)
    .order('order');
  if (error) throw error;
  return data || [];
};

export const createWeek = async (week: any) => {
  const { data, error } = await supabase
    .from('weeks')
    .insert(week)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateWeek = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('weeks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteWeek = async (id: string) => {
  const { error } = await supabase
    .from('weeks')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ============ SESSIONS ============

export const getSessionsByWeek = async (weekId: string) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('week_id', weekId)
    .order('order');
  if (error) throw error;
  return data || [];
};

export const createSession = async (session: any) => {
  const { data, error } = await supabase
    .from('sessions')
    .insert(session)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateSession = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteSession = async (id: string) => {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ============ ASSIGNED PLANS ============

export const getAssignedPlans = async (athleteId?: string, coachId?: string) => {
  let query = supabase.from('assigned_plans').select('*');
  if (athleteId) query = query.eq('athlete_id', athleteId);
  if (coachId) query = query.eq('coach_id', coachId);
  const { data, error } = await query.order('assigned_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createAssignedPlan = async (assignedPlan: any) => {
  const { data, error } = await supabase
    .from('assigned_plans')
    .insert(assignedPlan)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAssignedPlan = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('assigned_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============ PRODUCTS ============

export const getProducts = async (coachId?: string, activeOnly = false) => {
  let query = supabase.from('products').select('*');
  if (coachId) query = query.eq('coach_id', coachId);
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createProduct = async (product: any) => {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateProduct = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ============ USERS (for Admin) ============

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getUsersByRole = async (role: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', role);
  if (error) throw error;
  return data || [];
};

export const getUsersByRoles = async (roles: string[]) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', roles);
  if (error) throw error;
  return data || [];
};

// ============ ATTENTIONS ============

export const getAttentions = async (coachId?: string) => {
  let query = supabase.from('attentions').select('*');
  if (coachId) query = query.or(`coach_id.eq.${coachId},coach_id.is.null`);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createAttention = async (attention: any) => {
  const { data, error } = await supabase
    .from('attentions')
    .insert(attention)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAttention = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('attentions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============ ACTIVITIES ============

export const getActivities = async (limit = 20) => {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
};

export const createActivity = async (activity: any) => {
  const { data, error } = await supabase
    .from('activities')
    .insert(activity)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============ APPOINTMENTS ============

export const getAppointments = async (coachId?: string, athleteId?: string) => {
  let query = supabase.from('appointments').select('*');
  if (coachId) query = query.eq('coach_id', coachId);
  if (athleteId) query = query.eq('athlete_id', athleteId);
  const { data, error } = await query.order('date', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const createAppointment = async (appointment: any) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert(appointment)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAppointment = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============ STORAGE ============

export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });
  if (error) throw error;
  return data;
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

export const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
};

// ============ GDPR/DSGVO COMPLIANCE ============

// Consent Logging (Art. 7 DSGVO)
export const logConsent = async (consent: {
  user_id: string;
  consent_type: 'TERMS' | 'PRIVACY' | 'MARKETING' | 'ANALYTICS';
  consent_given: boolean;
  consent_version?: string;
}) => {
  const { data, error } = await supabase
    .from('consent_logs')
    .insert({
      ...consent,
      ip_address: 'client', // Will be enriched server-side
      user_agent: navigator.userAgent,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getConsentHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from('consent_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// Audit Logging (Art. 30 DSGVO)
export const createAuditLog = async (log: {
  user_id: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_data?: any;
  new_data?: any;
}) => {
  const { error } = await supabase
    .from('audit_logs')
    .insert({
      ...log,
      user_agent: navigator.userAgent,
    });
  if (error) console.warn('Audit log failed:', error);
};

export const getAuditLogs = async (userId: string, limit = 50) => {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
};

// Data Deletion Request (Art. 17 DSGVO - Recht auf Löschung)
export const requestDataDeletion = async (userId: string, email: string, reason?: string) => {
  const { data, error } = await supabase
    .from('data_deletion_requests')
    .insert({
      user_id: userId,
      user_email: email,
      reason,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getDeletionRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from('data_deletion_requests')
    .select('*')
    .eq('user_id', userId)
    .order('requested_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// ============ LEGAL VERSION TRACKING ============

export const getCurrentLegalVersions = async () => {
  const { data, error } = await supabase
    .from('legal_versions')
    .select('*')
    .eq('is_current', true)
    .order('document_type');
  if (error) throw error;
  return data || [];
};

export const getLegalVersionHistory = async (documentType: string) => {
  const { data, error } = await supabase
    .from('legal_versions')
    .select('*')
    .eq('document_type', documentType)
    .order('effective_date', { ascending: false });
  if (error) throw error;
  return data || [];
};

// ============ PURCHASE LEDGER (§147 AO) ============

export const getPurchaseLedger = async (userId: string) => {
  const { data, error } = await supabase
    .from('purchase_ledger')
    .select('*')
    .eq('user_id', userId)
    .order('event_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// Data Export Request (Art. 20 DSGVO - Datenportabilität)
export const requestDataExport = async (userId: string, email: string) => {
  const { data, error } = await supabase
    .from('data_export_requests')
    .insert({
      user_id: userId,
      user_email: email,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getExportRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from('data_export_requests')
    .select('*')
    .eq('user_id', userId)
    .order('requested_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// Get all user data for export (Art. 15 + 20 DSGVO)
export const exportUserData = async (userId: string) => {
  const [profile, exercises, plans, assignedPlans, activities, consents, auditLogs] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('exercises').select('*').eq('author_id', userId),
    supabase.from('plans').select('*').eq('coach_id', userId),
    supabase.from('assigned_plans').select('*').or(`athlete_id.eq.${userId},coach_id.eq.${userId}`),
    supabase.from('activities').select('*').eq('athlete_id', userId),
    supabase.from('consent_logs').select('*').eq('user_id', userId),
    supabase.from('audit_logs').select('*').eq('user_id', userId),
  ]);

  return {
    exported_at: new Date().toISOString(),
    user_id: userId,
    profile: profile.data,
    exercises: exercises.data || [],
    plans: plans.data || [],
    assigned_plans: assignedPlans.data || [],
    activities: activities.data || [],
    consent_history: consents.data || [],
    audit_logs: auditLogs.data || [],
  };
};

// ============ PLAN VERSIONING ============

export const getPlanVersions = async (planId: string) => {
  const { data, error } = await supabase
    .from('plan_versions')
    .select('*')
    .eq('plan_id', planId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getCurrentPlanVersion = async (planId: string) => {
  const { data, error } = await supabase
    .from('plan_versions')
    .select('*')
    .eq('plan_id', planId)
    .eq('is_current', true)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const createPlanVersion = async (version: {
  plan_id: string;
  version_number: string;
  version_notes?: string;
  structure_snapshot?: any;
  is_published?: boolean;
}) => {
  // First, unset current flag on existing versions
  await supabase
    .from('plan_versions')
    .update({ is_current: false })
    .eq('plan_id', version.plan_id);

  const { data, error } = await supabase
    .from('plan_versions')
    .insert({
      ...version,
      is_current: true,
      published_at: version.is_published ? new Date().toISOString() : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const publishPlanVersion = async (versionId: string) => {
  const { data, error } = await supabase
    .from('plan_versions')
    .update({ 
      is_published: true, 
      published_at: new Date().toISOString() 
    })
    .eq('id', versionId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============ BLOCK TEMPLATES ============

export const getBlockTemplates = async (coachId?: string) => {
  let query = supabase.from('block_templates').select('*');
  if (coachId) {
    query = query.or(`coach_id.eq.${coachId},is_system_template.eq.true`);
  }
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data || [];
};

export const createBlockTemplate = async (template: {
  coach_id: string;
  name: string;
  description?: string;
  block_type?: string;
  block_data: any;
  tags?: string[];
}) => {
  const { data, error } = await supabase
    .from('block_templates')
    .insert(template)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateBlockTemplate = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('block_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteBlockTemplate = async (id: string) => {
  const { error } = await supabase
    .from('block_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ============ SESSION TEMPLATES ============

export const getSessionTemplates = async (coachId?: string) => {
  let query = supabase.from('session_templates').select('*');
  if (coachId) {
    query = query.or(`coach_id.eq.${coachId},is_system_template.eq.true`);
  }
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data || [];
};

export const createSessionTemplate = async (template: {
  coach_id: string;
  name: string;
  description?: string;
  estimated_duration_min?: number;
  session_data: any;
  tags?: string[];
}) => {
  const { data, error } = await supabase
    .from('session_templates')
    .insert(template)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateSessionTemplate = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('session_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteSessionTemplate = async (id: string) => {
  const { error } = await supabase
    .from('session_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ============ WEEK TEMPLATES ============

export const getWeekTemplates = async (coachId?: string) => {
  let query = supabase.from('week_templates').select('*');
  if (coachId) {
    query = query.or(`coach_id.eq.${coachId},is_system_template.eq.true`);
  }
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data || [];
};

export const createWeekTemplate = async (template: {
  coach_id: string;
  name: string;
  description?: string;
  focus?: string;
  sessions_per_week?: number;
  week_data: any;
  tags?: string[];
}) => {
  const { data, error } = await supabase
    .from('week_templates')
    .insert(template)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateWeekTemplate = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('week_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteWeekTemplate = async (id: string) => {
  const { error } = await supabase
    .from('week_templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ============ PRODUCT MODULES ============

export const getProductModules = async (productId: string) => {
  const { data, error } = await supabase
    .from('product_modules')
    .select(`
      *,
      plan:plans(id, name, description)
    `)
    .eq('product_id', productId)
    .order('module_order');
  if (error) throw error;
  return data || [];
};

export const createProductModule = async (module: {
  product_id: string;
  plan_id: string;
  module_order: number;
  module_name?: string;
  is_entry_point?: boolean;
  prerequisites?: string[];
}) => {
  const { data, error } = await supabase
    .from('product_modules')
    .insert(module)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateProductModule = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('product_modules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteProductModule = async (id: string) => {
  const { error } = await supabase
    .from('product_modules')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ============ ATHLETE SCHEDULE PREFERENCES ============

export const getAthleteSchedulePreferences = async (athleteId: string, assignedPlanId?: string) => {
  let query = supabase
    .from('athlete_schedule_preferences')
    .select('*')
    .eq('athlete_id', athleteId);
  
  if (assignedPlanId) {
    query = query.eq('assigned_plan_id', assignedPlanId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return assignedPlanId ? data?.[0] : data || [];
};

export const saveAthleteSchedulePreferences = async (preferences: {
  athlete_id: string;
  assigned_plan_id: string;
  available_days: number[];
  preferred_time_of_day?: string;
  max_sessions_per_week?: number;
  min_rest_days?: number;
  auto_schedule?: boolean;
}) => {
  const { data, error } = await supabase
    .from('athlete_schedule_preferences')
    .upsert(preferences, { onConflict: 'athlete_id,assigned_plan_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============ ENHANCED ASSIGNED PLANS ============

export const assignPlanWithModules = async (assignment: {
  athlete_id: string;
  coach_id: string;
  original_plan_id: string;
  product_id?: string;
  current_module_order?: number;
  plan_version_id?: string;
  coaching_type: 'ONE_TO_ONE' | 'GROUP_SYNC' | 'GROUP_ASYNC';
  start_date: string;
  plan_name: string;
  description?: string;
  structure: any;
  sessions_per_week?: number;
  rest_days_between?: number;
  preferred_days?: number[];
}) => {
  // Calculate total sessions
  let totalSessions = 0;
  if (assignment.structure?.weeks) {
    for (const week of assignment.structure.weeks) {
      totalSessions += week.sessions?.length || 0;
    }
  }

  const { data, error } = await supabase
    .from('assigned_plans')
    .insert({
      ...assignment,
      assignment_type: assignment.coaching_type === 'ONE_TO_ONE' ? 'ONE_TO_ONE' : 'GROUP_FLEX',
      schedule_status: 'PENDING',
      total_sessions: totalSessions,
      completed_sessions: 0,
      progress_percentage: 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateAssignedPlanProgress = async (
  assignedPlanId: string, 
  completedSessions: number, 
  totalSessions: number
) => {
  const progressPercentage = totalSessions > 0 
    ? Math.round((completedSessions / totalSessions) * 100 * 100) / 100 
    : 0;

  const { data, error } = await supabase
    .from('assigned_plans')
    .update({
      completed_sessions: completedSessions,
      progress_percentage: progressPercentage,
      schedule_status: progressPercentage >= 100 ? 'COMPLETED' : 'ACTIVE',
    })
    .eq('id', assignedPlanId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const advanceToNextModule = async (assignedPlanId: string, nextModuleOrder: number) => {
  const { data, error } = await supabase
    .from('assigned_plans')
    .update({ current_module_order: nextModuleOrder })
    .eq('id', assignedPlanId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============ PURCHASES & SUBSCRIPTIONS (Stripe) ============

export const getUserPurchases = async (userId: string) => {
  const { data, error } = await supabase
    .from('purchases')
    .select('*, products(*)')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getUserSubscriptions = async (userId: string) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getActiveSubscription = async (userId: string) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const getUserInvoices = async (userId: string) => {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getStripeCustomerId = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data?.stripe_customer_id;
};

// ============ COACHING APPROVALS ============

export const getCoachingApproval = async (athleteId: string, productId: string) => {
  try {
    const { data, error } = await supabase
      .from('coaching_approvals')
      .select('*')
      .eq('athlete_id', athleteId)
      .eq('product_id', productId)
      .maybeSingle();
    if (error) {
      console.warn('[Supabase] coaching_approvals query error:', error.code);
      return null;
    }
    return data;
  } catch (e) {
    // Table might not exist yet
    console.debug('[Supabase] coaching_approvals table not available');
    return null;
  }
};

export const getCoachingApprovals = async (coachId?: string) => {
  let query = supabase
    .from('coaching_approvals')
    .select(`
      *,
      athlete:profiles!coaching_approvals_athlete_id_fkey(id, email, first_name, last_name, display_name),
      product:products!coaching_approvals_product_id_fkey(id, title, coach_id),
      appointment:appointments(id, date, time, status)
    `);
  
  if (coachId) {
    query = query.eq('product.coach_id', coachId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getPendingCoachingApprovals = async (coachId: string) => {
  const { data, error } = await supabase
    .from('coaching_approvals')
    .select(`
      *,
      athlete:profiles!coaching_approvals_athlete_id_fkey(id, email, first_name, last_name, display_name),
      product:products!coaching_approvals_product_id_fkey(id, title, coach_id),
      appointment:appointments(id, date, time, status)
    `)
    .eq('approved', false)
    .is('rejected_at', null)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  
  // Filter by coach_id in JS since nested filtering is tricky
  return (data || []).filter(a => a.product?.coach_id === coachId);
};

export const createCoachingApproval = async (approval: {
  athlete_id: string;
  product_id: string;
  consultation_appointment_id?: string;
}) => {
  const { data, error } = await supabase
    .from('coaching_approvals')
    .insert(approval)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const approveCoaching = async (
  approvalId: string, 
  approvedBy: string
) => {
  const { data, error } = await supabase
    .from('coaching_approvals')
    .update({
      approved: true,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      consultation_completed: true,
    })
    .eq('id', approvalId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const rejectCoaching = async (
  approvalId: string, 
  reason: string
) => {
  const { data, error } = await supabase
    .from('coaching_approvals')
    .update({
      rejected_at: new Date().toISOString(),
      rejection_reason: reason,
    })
    .eq('id', approvalId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const grantCoachingManually = async (
  athleteId: string,
  productId: string,
  approvedBy: string,
  reason: string
) => {
  const { data, error } = await supabase
    .from('coaching_approvals')
    .upsert({
      athlete_id: athleteId,
      product_id: productId,
      approved: true,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      is_manual_grant: true,
      grant_reason: reason,
      consultation_completed: true,
    }, { onConflict: 'athlete_id,product_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============ COACHING RELATIONSHIPS ============

export const getCoachingRelationship = async (athleteId: string, coachId?: string) => {
  let query = supabase
    .from('coaching_relationships')
    .select('*')
    .eq('athlete_id', athleteId)
    .eq('status', 'ACTIVE');
  
  if (coachId) {
    query = query.eq('coach_id', coachId);
  }
  
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
};

// Get athlete's active coaching relationship (for athlete chat page)
export const getAthleteActiveCoaching = async (athleteId: string) => {
  const { data, error } = await supabase
    .from('coaching_relationships')
    .select(`
      id, coach_id, product_id, status, started_at,
      coach:profiles!coaching_relationships_coach_id_fkey(id, email, first_name, last_name, display_name)
    `)
    .eq('athlete_id', athleteId)
    .eq('status', 'ACTIVE')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const getActiveCoachingRelationships = async (coachId: string) => {
  const { data, error } = await supabase
    .from('coaching_relationships')
    .select(`
      *,
      athlete:profiles!coaching_relationships_athlete_id_fkey(id, email, first_name, last_name, last_name, display_name, height, weight, body_fat),
      product:products(id, title)
    `)
    .eq('coach_id', coachId)
    .eq('status', 'ACTIVE')
    .order('started_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// Get all athletes (Admin only)
export const getAllAthletes = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, display_name, role, height, weight, body_fat, created_at')
    .eq('role', 'ATHLETE')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// Get athletes with their coaching relationships (for assignment)
export const getAthletesWithCoaching = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, email, first_name, last_name, display_name, role, created_at,
      coaching_relationships!coaching_relationships_athlete_id_fkey(
        id, coach_id, status, started_at,
        coach:profiles!coaching_relationships_coach_id_fkey(id, email, first_name, last_name)
      )
    `)
    .eq('role', 'ATHLETE')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// CRM: Get ALL users with coaching relationships + coached athletes + purchases
export const getAllUsersForCRM = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id, email, first_name, last_name, display_name, role, created_at,
      coaching_as_athlete:coaching_relationships!coaching_relationships_athlete_id_fkey(
        id, coach_id, product_id, status, started_at,
        coach:profiles!coaching_relationships_coach_id_fkey(id, email, first_name, last_name, role)
      ),
      coaching_as_coach:coaching_relationships!coaching_relationships_coach_id_fkey(
        id, athlete_id, product_id, status, started_at,
        athlete:profiles!coaching_relationships_athlete_id_fkey(id, email, first_name, last_name, role)
      ),
      purchases!purchases_user_id_fkey(id, product_id, amount, currency, status, stripe_session_id, created_at),
      assigned_plans!assigned_plans_athlete_id_fkey(id, original_plan_id, plan_name, schedule_status, assigned_at)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

// Admin: Revoke a purchase (set status to 'revoked')
export const revokePurchase = async (purchaseId: string) => {
  const { error } = await supabase
    .from('purchases')
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('id', purchaseId);
  if (error) throw error;
};

// Admin: Revoke an assigned plan
export const revokeAssignedPlan = async (planId: string) => {
  const { error } = await supabase
    .from('assigned_plans')
    .delete()
    .eq('id', planId);
  if (error) throw error;
};

// Assign athlete to coach (Admin function)
export const assignAthleteToCoach = async (athleteId: string, coachId: string, reason?: string) => {
  const { data, error } = await supabase
    .from('coaching_relationships')
    .insert({
      athlete_id: athleteId,
      coach_id: coachId,
      status: 'ACTIVE',
      is_manual_grant: true,
      grant_reason: reason || 'Admin-Zuweisung',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const createCoachingRelationship = async (relationship: {
  athlete_id: string;
  coach_id: string;
  product_id?: string;
  stripe_subscription_id?: string;
  current_period_end?: string;
  is_manual_grant?: boolean;
  grant_reason?: string;
}) => {
  const { data, error } = await supabase
    .from('coaching_relationships')
    .insert(relationship)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateCoachingRelationship = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('coaching_relationships')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const endCoachingRelationship = async (id: string) => {
  const { data, error } = await supabase
    .from('coaching_relationships')
    .update({
      status: 'ENDED',
      ended_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============ GOALS ============

export const getGoals = async (athleteId: string, status?: string) => {
  let query = supabase
    .from('goals')
    .select(`
      *,
      exercise:exercises(id, name)
    `)
    .eq('athlete_id', athleteId);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getActiveGoals = async (athleteId: string) => {
  return getGoals(athleteId, 'ACTIVE');
};

export const getGoalsByCoach = async (coachId: string) => {
  const { data, error } = await supabase
    .from('goals')
    .select(`
      *,
      athlete:profiles!goals_athlete_id_fkey(id, email, first_name, last_name),
      exercise:exercises(id, name)
    `)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createGoal = async (goal: {
  athlete_id: string;
  coach_id?: string | null;
  title: string;
  description?: string | null;
  goal_type: string;
  target_value: number;
  target_unit: string;
  start_value?: number | null;
  start_date: string;
  target_date: string;
  exercise_id?: string | null;
  metric_key?: string | null;
}) => {
  // Clean up undefined values to null for Supabase
  const cleanGoal = {
    athlete_id: goal.athlete_id,
    coach_id: goal.coach_id || null,
    title: goal.title,
    description: goal.description || null,
    goal_type: goal.goal_type,
    target_value: goal.target_value,
    target_unit: goal.target_unit,
    start_value: goal.start_value ?? 0,
    current_value: goal.start_value ?? 0,
    start_date: goal.start_date,
    target_date: goal.target_date,
    exercise_id: goal.exercise_id || null,
    metric_key: goal.metric_key || null,
    status: 'ACTIVE',
  };
  
  const { data, error } = await supabase
    .from('goals')
    .insert(cleanGoal)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateGoal = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateGoalProgress = async (id: string, currentValue: number) => {
  const { data: goal } = await supabase
    .from('goals')
    .select('target_value, start_value')
    .eq('id', id)
    .single();
  
  const updates: any = { current_value: currentValue };
  
  // Check if goal achieved
  if (goal && currentValue >= goal.target_value) {
    updates.status = 'ACHIEVED';
    updates.achieved_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteGoal = async (id: string) => {
  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ============ GOAL CHECKPOINTS ============

export const getGoalCheckpoints = async (goalId: string) => {
  const { data, error } = await supabase
    .from('goal_checkpoints')
    .select('*')
    .eq('goal_id', goalId)
    .order('recorded_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const createGoalCheckpoint = async (checkpoint: {
  goal_id: string;
  value: number;
  recorded_at?: string;
  notes?: string;
  source: 'WORKOUT' | 'MANUAL' | 'PROFILE_UPDATE';
}) => {
  const { data, error } = await supabase
    .from('goal_checkpoints')
    .insert({
      ...checkpoint,
      recorded_at: checkpoint.recorded_at || new Date().toISOString().split('T')[0],
    })
    .select()
    .single();
  if (error) throw error;
  
  // Also update the goal's current value
  await updateGoalProgress(checkpoint.goal_id, checkpoint.value);
  
  return data;
};

// Auto-update STRENGTH goals after workout completion
export const autoTrackStrengthGoals = async (athleteId: string, exerciseResults: { exerciseId: string; maxWeight: number }[]) => {
  try {
    // Fetch active STRENGTH goals for this athlete
    const { data: goals } = await supabase
      .from('goals')
      .select('id, exercise_id, current_value, target_value')
      .eq('athlete_id', athleteId)
      .eq('status', 'ACTIVE')
      .eq('goal_type', 'STRENGTH')
      .not('exercise_id', 'is', null);

    if (!goals || goals.length === 0) return;

    for (const goal of goals) {
      const match = exerciseResults.find(r => r.exerciseId === goal.exercise_id);
      if (match && match.maxWeight > (goal.current_value || 0)) {
        await createGoalCheckpoint({
          goal_id: goal.id,
          value: match.maxWeight,
          source: 'WORKOUT',
          notes: `Auto-tracked: ${match.maxWeight}kg`,
        });
      }
    }
  } catch (error) {
    console.error('Error auto-tracking strength goals:', error);
  }
};

// Auto-update CONSISTENCY goals (sessions per week)
export const autoTrackConsistencyGoals = async (athleteId: string) => {
  try {
    const { data: goals } = await supabase
      .from('goals')
      .select('id, current_value, target_value, start_date')
      .eq('athlete_id', athleteId)
      .eq('status', 'ACTIVE')
      .eq('goal_type', 'CONSISTENCY');

    if (!goals || goals.length === 0) return;

    // Count completed sessions this week (Mon-Sun)
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const { count } = await supabase
      .from('athlete_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('athlete_id', athleteId)
      .eq('completed', true)
      .gte('date', monday.toISOString().split('T')[0])
      .lte('date', sunday.toISOString().split('T')[0]);

    const sessionsThisWeek = count || 0;

    for (const goal of goals) {
      if (sessionsThisWeek !== goal.current_value) {
        await updateGoalProgress(goal.id, sessionsThisWeek);
      }
    }
  } catch (error) {
    console.error('Error auto-tracking consistency goals:', error);
  }
};

// ============ INVITATIONS ============

export const getInvitations = async (invitedBy: string) => {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('invited_by', invitedBy)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getInvitationByCode = async (code: string) => {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('invitation_code', code)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const createInvitation = async (invitation: {
  email: string;
  invited_by: string;
  personal_message?: string;
  role?: string;
  auto_approve_coaching?: boolean;
  auto_assign_product_id?: string;
  auto_assign_plan_id?: string;
  is_bonus_grant?: boolean;
  bonus_product_id?: string;
  bonus_reason?: string;
}) => {
  // Generate unique invitation code
  const code = 'INV-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      ...invitation,
      invitation_code: code,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const acceptInvitation = async (invitationId: string, userId: string) => {
  const { data, error } = await supabase
    .from('invitations')
    .update({
      status: 'ACCEPTED',
      accepted_at: new Date().toISOString(),
      accepted_by_user_id: userId,
    })
    .eq('id', invitationId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const revokeInvitation = async (invitationId: string) => {
  const { data, error } = await supabase
    .from('invitations')
    .update({ status: 'REVOKED' })
    .eq('id', invitationId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const processInvitation = async (invitationId: string, userId: string) => {
  const invitation = await getInvitationByCode(invitationId);
  if (!invitation || invitation.status !== 'PENDING') return null;
  
  // 1. Auto-approve coaching if set
  if (invitation.auto_approve_coaching && invitation.auto_assign_product_id) {
    await grantCoachingManually(
      userId,
      invitation.auto_assign_product_id,
      invitation.invited_by,
      'Einladung'
    );
  }
  
  // 2. Create coaching relationship for bonus
  if (invitation.is_bonus_grant && invitation.bonus_product_id) {
    const product = await supabase
      .from('products')
      .select('coach_id')
      .eq('id', invitation.bonus_product_id)
      .single();
    
    if (product.data) {
      await createCoachingRelationship({
        athlete_id: userId,
        coach_id: product.data.coach_id,
        product_id: invitation.bonus_product_id,
        is_manual_grant: true,
        grant_reason: invitation.bonus_reason || 'Einladungs-Bonus',
      });
    }
  }
  
  // 3. Mark invitation as accepted
  return acceptInvitation(invitation.id, userId);
};

// ============ CHAT MESSAGES ============

export const getChatMessages = async (relationshipId: string, limit = 50, before?: string) => {
  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('coaching_relationship_id', relationshipId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (before) {
    query = query.lt('created_at', before);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).reverse();
};

export const sendChatMessage = async (message: {
  coaching_relationship_id: string;
  sender_id: string;
  receiver_id: string;
  message_type: 'text' | 'voice' | 'system';
  content?: string;
  voice_url?: string;
  voice_duration_seconds?: number;
}) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert(message)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Send automatic system message to coaching chat when athlete reports an issue
export const sendAttentionChatNotification = async (athleteId: string, attention: {
  type: string;
  severity: string;
  message: string;
  id: string;
}) => {
  try {
    // Find active coaching relationship for this athlete
    const { data: rel } = await supabase
      .from('coaching_relationships')
      .select('id, coach_id')
      .eq('athlete_id', athleteId)
      .eq('status', 'ACTIVE')
      .limit(1)
      .maybeSingle();

    if (!rel) return; // No active coaching → no chat message

    const typeLabel = attention.type === 'INJURY' ? 'Verletzung'
      : attention.type === 'MISSED_SESSION' ? 'Verpasste Einheit'
      : attention.type === 'FEEDBACK' ? 'Feedback'
      : 'Meldung';

    const severityLabel = attention.severity === 'HIGH' ? 'Hoch'
      : attention.severity === 'MEDIUM' ? 'Mittel' : 'Niedrig';

    // System message with structured content for special rendering
    const content = JSON.stringify({
      type: 'attention',
      attentionType: attention.type,
      attentionId: attention.id,
      severity: attention.severity,
      label: typeLabel,
      severityLabel,
      message: attention.message,
    });

    await supabase.from('chat_messages').insert({
      coaching_relationship_id: rel.id,
      sender_id: athleteId,
      receiver_id: rel.coach_id,
      message_type: 'system',
      content,
    });
  } catch (error) {
    console.error('Error sending attention chat notification:', error);
  }
};

export const markMessagesAsRead = async (relationshipId: string, receiverId: string) => {
  const { error } = await supabase
    .from('chat_messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('coaching_relationship_id', relationshipId)
    .eq('receiver_id', receiverId)
    .eq('is_read', false);
  if (error) throw error;
};

export const getUnreadMessageCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('is_read', false);
  if (error) throw error;
  return count || 0;
};

// Get all conversations for a coach/admin with last message + unread count
export const getCoachConversations = async (coachId: string) => {
  // Get all active coaching relationships where this user is coach
  const { data: relationships, error } = await supabase
    .from('coaching_relationships')
    .select(`
      id, athlete_id, product_id, status, started_at,
      athlete:profiles!coaching_relationships_athlete_id_fkey(id, email, first_name, last_name, display_name)
    `)
    .eq('coach_id', coachId)
    .eq('status', 'ACTIVE')
    .order('started_at', { ascending: false });
  if (error) throw error;
  if (!relationships || relationships.length === 0) return [];

  // For each relationship, get last message + unread count
  const conversations = await Promise.all(
    relationships.map(async (rel: any) => {
      // Last message
      const { data: lastMsgArr } = await supabase
        .from('chat_messages')
        .select('id, content, message_type, sender_id, created_at, is_read')
        .eq('coaching_relationship_id', rel.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Unread count (messages sent TO the coach)
      const { count: unread } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('coaching_relationship_id', rel.id)
        .eq('receiver_id', coachId)
        .eq('is_read', false);

      const lastMsg = lastMsgArr && lastMsgArr.length > 0 ? lastMsgArr[0] : null;

      return {
        relationshipId: rel.id,
        athleteId: rel.athlete_id,
        productId: rel.product_id,
        athlete: Array.isArray(rel.athlete) ? rel.athlete[0] : rel.athlete,
        lastMessage: lastMsg,
        unreadCount: unread || 0,
        startedAt: rel.started_at,
      };
    })
  );

  // Sort by last message time (most recent first)
  return conversations.sort((a, b) => {
    const aTime = a.lastMessage?.created_at || a.startedAt;
    const bTime = b.lastMessage?.created_at || b.startedAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
};

export const subscribeToChatMessages = (
  relationshipId: string,
  onMessage: (message: any) => void
) => {
  return supabase
    .channel(`chat:${relationshipId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `coaching_relationship_id=eq.${relationshipId}`,
      },
      (payload) => onMessage(payload.new)
    )
    .subscribe();
};

// Get coaching relationship for athlete (to find their coach)
export const getAthleteCoachRelationship = async (athleteId: string) => {
  const { data, error } = await supabase
    .from('coaching_relationships')
    .select(`
      *,
      coach:profiles!coaching_relationships_coach_id_fkey(id, email, first_name, last_name, display_name, height, weight),
      product:products(id, title, has_chat_access, type)
    `)
    .eq('athlete_id', athleteId)
    .eq('status', 'ACTIVE')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
};

// Check if athlete has chat access (via any active product with has_chat_access)
export const checkChatAccess = async (athleteId: string) => {
  const relationship = await getAthleteCoachRelationship(athleteId);
  if (!relationship) return { hasAccess: false, relationship: null };
  
  // Check if the product linked to this relationship has chat access
  const product = relationship.product;
  const hasAccess = product?.has_chat_access === true || product?.type === 'COACHING_1ON1';
  
  return { hasAccess, relationship };
};

// ============ COACH CALENDARS ============

export const getCoachCalendars = async (coachId: string) => {
  const { data, error } = await supabase
    .from('coach_calendars')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createCoachCalendar = async (calendar: {
  coach_id: string;
  name: string;
  description?: string;
  slot_duration_minutes?: number;
  buffer_minutes?: number;
  max_advance_days?: number;
  min_notice_hours?: number;
}) => {
  const { data, error } = await supabase
    .from('coach_calendars')
    .insert(calendar)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateCoachCalendar = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('coach_calendars')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteCoachCalendar = async (id: string) => {
  const { error } = await supabase
    .from('coach_calendars')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ============ COACH AVAILABILITY ============

export const getCalendarAvailability = async (calendarId: string) => {
  const { data, error } = await supabase
    .from('coach_availability')
    .select('*')
    .eq('calendar_id', calendarId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const setCalendarAvailability = async (calendarId: string, slots: { day_of_week: number; start_time: string; end_time: string }[]) => {
  // Delete existing, then insert new
  const { error: delError } = await supabase
    .from('coach_availability')
    .delete()
    .eq('calendar_id', calendarId);
  if (delError) throw delError;

  if (slots.length === 0) return [];

  const rows = slots.map(s => ({ calendar_id: calendarId, ...s }));
  const { data, error } = await supabase
    .from('coach_availability')
    .insert(rows)
    .select();
  if (error) throw error;
  return data || [];
};

// ============ COACH BLOCKED TIMES ============

export const getCoachBlockedTimes = async (coachId: string) => {
  const { data, error } = await supabase
    .from('coach_blocked_times')
    .select('*')
    .eq('coach_id', coachId)
    .order('blocked_date', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const addCoachBlockedTime = async (blocked: {
  coach_id: string;
  blocked_date: string;
  all_day?: boolean;
  start_time?: string;
  end_time?: string;
  reason?: string;
}) => {
  const { data, error } = await supabase
    .from('coach_blocked_times')
    .insert(blocked)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteCoachBlockedTime = async (id: string) => {
  const { error } = await supabase
    .from('coach_blocked_times')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ============ AVAILABLE SLOTS COMPUTATION ============

export const getAvailableSlots = async (calendarId: string, date: string): Promise<string[]> => {
  // 1. Fetch calendar settings
  const { data: calendar, error: calErr } = await supabase
    .from('coach_calendars')
    .select('*')
    .eq('id', calendarId)
    .single();
  if (calErr || !calendar) return [];

  const coachId = calendar.coach_id;
  const slotDuration = calendar.slot_duration_minutes || 30;
  const buffer = calendar.buffer_minutes || 0;
  const minNotice = calendar.min_notice_hours || 24;

  // 2. Get day of week for the requested date
  const dateObj = new Date(date + 'T00:00:00');
  const dayOfWeek = dateObj.getDay(); // 0=Sun

  // 3. Fetch availability windows for this day
  const { data: avail } = await supabase
    .from('coach_availability')
    .select('start_time, end_time')
    .eq('calendar_id', calendarId)
    .eq('day_of_week', dayOfWeek);
  if (!avail || avail.length === 0) return [];

  // 4. Generate all possible slots
  const allSlots: string[] = [];
  for (const window of avail) {
    const [sh, sm] = window.start_time.split(':').map(Number);
    const [eh, em] = window.end_time.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const step = slotDuration + buffer;

    for (let t = startMin; t + slotDuration <= endMin; t += step) {
      const h = Math.floor(t / 60);
      const m = t % 60;
      allSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }

  if (allSlots.length === 0) return [];

  // 5. Fetch existing bookings for this date
  const { data: bookings } = await supabase
    .from('appointments')
    .select('time, duration_minutes')
    .eq('coach_id', coachId)
    .eq('date', date)
    .in('status', ['PENDING', 'CONFIRMED']);

  const bookedSlots = new Set<string>();
  if (bookings) {
    for (const b of bookings) {
      // Mark the booked slot and any overlapping slots
      const [bh, bm] = (b.time || '00:00').split(':').map(Number);
      const bStart = bh * 60 + bm;
      const bEnd = bStart + (b.duration_minutes || slotDuration);
      for (const slot of allSlots) {
        const [sh2, sm2] = slot.split(':').map(Number);
        const sStart = sh2 * 60 + sm2;
        const sEnd = sStart + slotDuration;
        if (sStart < bEnd && sEnd > bStart) {
          bookedSlots.add(slot);
        }
      }
    }
  }

  // 6. Fetch blocked times for this date
  const { data: blocked } = await supabase
    .from('coach_blocked_times')
    .select('all_day, start_time, end_time')
    .eq('coach_id', coachId)
    .eq('blocked_date', date);

  const blockedSlots = new Set<string>();
  if (blocked) {
    for (const b of blocked) {
      if (b.all_day) {
        // All slots blocked
        return [];
      }
      if (b.start_time && b.end_time) {
        const [bs, bsm] = b.start_time.split(':').map(Number);
        const [be, bem] = b.end_time.split(':').map(Number);
        const bStart = bs * 60 + bsm;
        const bEnd = be * 60 + bem;
        for (const slot of allSlots) {
          const [sh2, sm2] = slot.split(':').map(Number);
          const sStart = sh2 * 60 + sm2;
          const sEnd = sStart + slotDuration;
          if (sStart < bEnd && sEnd > bStart) {
            blockedSlots.add(slot);
          }
        }
      }
    }
  }

  // 7. Filter: remove booked, blocked, past, and within min_notice
  const now = new Date();
  const minNoticeTime = new Date(now.getTime() + minNotice * 60 * 60 * 1000);

  return allSlots.filter(slot => {
    if (bookedSlots.has(slot) || blockedSlots.has(slot)) return false;
    const [h, m] = slot.split(':').map(Number);
    const slotDate = new Date(date + 'T00:00:00');
    slotDate.setHours(h, m, 0, 0);
    return slotDate > minNoticeTime;
  });
};

// ============ BODY MEASUREMENTS ============

export const getBodyMeasurements = async (athleteId: string, limit = 90) => {
  const { data, error } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('athlete_id', athleteId)
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
};

export const upsertBodyMeasurement = async (measurement: {
  athlete_id: string;
  date: string;
  weight?: number | null;
  body_fat?: number | null;
  waist_circumference?: number | null;
  chest?: number | null;
  arm_left?: number | null;
  arm_right?: number | null;
  thigh_left?: number | null;
  thigh_right?: number | null;
  notes?: string | null;
}) => {
  const { data, error } = await supabase
    .from('body_measurements')
    .upsert(measurement, { onConflict: 'athlete_id,date' })
    .select()
    .single();
  if (error) throw error;

  // Auto-update profile with latest values (non-blocking)
  const profileUpdates: Record<string, number> = {};
  if (measurement.weight) profileUpdates.weight = measurement.weight;
  if (measurement.body_fat) profileUpdates.body_fat = measurement.body_fat;
  if (Object.keys(profileUpdates).length > 0) {
    supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', measurement.athlete_id)
      .then(({ error: profileErr }) => {
        if (profileErr) console.warn('Profile sync failed:', profileErr);
      });
  }

  return data;
};

// ============ COACH NOTES ============

export const getCoachNotes = async (coachId: string, athleteId: string) => {
  const { data, error } = await supabase
    .from('coach_notes')
    .select('*')
    .eq('coach_id', coachId)
    .eq('athlete_id', athleteId)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createCoachNote = async (note: {
  coach_id: string;
  athlete_id: string;
  title?: string;
  content: string;
  tags?: string[];
  is_pinned?: boolean;
}) => {
  const { data, error } = await supabase
    .from('coach_notes')
    .insert(note)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateCoachNote = async (id: string, updates: {
  title?: string;
  content?: string;
  tags?: string[];
  is_pinned?: boolean;
}) => {
  const { data, error } = await supabase
    .from('coach_notes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteCoachNote = async (id: string) => {
  const { error } = await supabase
    .from('coach_notes')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// ============ WORKOUT FEEDBACK ============

export const getWorkoutFeedback = async (workoutLogId: string) => {
  const { data, error } = await supabase
    .from('workout_feedback')
    .select('*')
    .eq('workout_log_id', workoutLogId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getAthleteFeedback = async (athleteId: string, limit = 20) => {
  const { data, error } = await supabase
    .from('workout_feedback')
    .select('*, workout_logs(exercise_name, workout_date, sets)')
    .eq('athlete_id', athleteId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
};

export const createWorkoutFeedback = async (feedback: {
  workout_log_id: string;
  coach_id: string;
  athlete_id: string;
  comment: string;
  rating?: number;
}) => {
  const { data, error } = await supabase
    .from('workout_feedback')
    .insert(feedback)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============ CHECK-INS ============

export const getCheckIns = async (athleteId?: string, coachId?: string, status?: string) => {
  let query = supabase.from('check_ins').select('*');
  if (athleteId) query = query.eq('athlete_id', athleteId);
  if (coachId) query = query.eq('coach_id', coachId);
  if (status) query = query.eq('status', status);
  const { data, error } = await query.order('date', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const createCheckIn = async (checkIn: {
  athlete_id: string;
  coach_id?: string;
  date: string;
  weight?: number;
  body_fat?: number;
  nutrition_rating?: number;
  sleep_rating?: number;
  stress_rating?: number;
  energy_rating?: number;
  mood_rating?: number;
  muscle_soreness?: number;
  notes?: string;
  photo_urls?: string[];
}) => {
  const { data, error } = await supabase
    .from('check_ins')
    .upsert(checkIn, { onConflict: 'athlete_id,date' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const respondToCheckIn = async (checkInId: string, coachResponse: string) => {
  const { data, error } = await supabase
    .from('check_ins')
    .update({
      coach_response: coachResponse,
      status: 'REVIEWED',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', checkInId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// ============ WORKOUT LOGS (Extended queries for History page) ============

export const getWorkoutHistory = async (athleteId: string, options?: {
  exerciseId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase
    .from('workout_logs')
    .select('*', { count: 'exact' })
    .eq('athlete_id', athleteId);
  
  if (options?.exerciseId) query = query.eq('exercise_id', options.exerciseId);
  if (options?.startDate) query = query.gte('workout_date', options.startDate);
  if (options?.endDate) query = query.lte('workout_date', options.endDate);
  
  query = query
    .order('workout_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(options?.offset || 0, (options?.offset || 0) + (options?.limit || 20) - 1);
  
  const { data, count, error } = await query;
  if (error) throw error;
  return { logs: data || [], total: count || 0 };
};

export const getExerciseProgressData = async (athleteId: string, exerciseId: string, days = 90) => {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('workout_logs')
    .select('workout_date, sets, total_volume')
    .eq('athlete_id', athleteId)
    .eq('exercise_id', exerciseId)
    .gte('workout_date', startDate)
    .order('workout_date', { ascending: true });
  if (error) throw error;
  return data || [];
};

// Get dates with availability for a calendar within a date range
export const getDatesWithAvailability = async (calendarId: string, startDate: string, endDate: string): Promise<string[]> => {
  const { data: calendar } = await supabase
    .from('coach_calendars')
    .select('coach_id')
    .eq('id', calendarId)
    .single();
  if (!calendar) return [];

  // Get which days of week have availability
  const { data: avail } = await supabase
    .from('coach_availability')
    .select('day_of_week')
    .eq('calendar_id', calendarId);
  if (!avail || avail.length === 0) return [];

  const availDays = new Set(avail.map(a => a.day_of_week));

  // Get all blocked dates (all-day blocks)
  const { data: blocked } = await supabase
    .from('coach_blocked_times')
    .select('blocked_date')
    .eq('coach_id', calendar.coach_id)
    .eq('all_day', true)
    .gte('blocked_date', startDate)
    .lte('blocked_date', endDate);
  const blockedDates = new Set((blocked || []).map(b => b.blocked_date));

  // Generate dates in range that have availability
  const dates: string[] = [];
  const current = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  while (current <= end) {
    const dow = current.getDay();
    const dateStr = current.toISOString().split('T')[0];
    if (availDays.has(dow) && !blockedDates.has(dateStr)) {
      dates.push(dateStr);
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

// ============ PUBLIC BOOKING ============

export const getCoachBySlug = async (slug: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, nickname, booking_slug')
    .eq('booking_slug', slug)
    .single();
  if (error) return null;
  return data;
};

export const getPublicCalendars = async (coachId: string) => {
  const { data, error } = await supabase
    .from('coach_calendars')
    .select('*')
    .eq('coach_id', coachId)
    .eq('is_public', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const getCalendarById = async (calendarId: string) => {
  const { data, error } = await supabase
    .from('coach_calendars')
    .select('*')
    .eq('id', calendarId)
    .single();
  if (error) return null;
  return data;
};

export const createPublicAppointment = async (appointment: {
  coach_id: string;
  calendar_id: string;
  date: string;
  time: string;
  duration_minutes: number;
  athlete_id?: string;
  athlete_name?: string;
  booker_name: string;
  booker_email: string;
  notes?: string;
  type?: string;
  status?: string;
}) => {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      ...appointment,
      status: appointment.status || 'PENDING',
      type: appointment.type || 'CONSULTATION',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateBookingSlug = async (userId: string, slug: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ booking_slug: slug })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const cancelAppointment = async (id: string, reason?: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'CANCELLED',
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason || null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const confirmAppointment = async (id: string) => {
  const { data, error } = await supabase
    .from('appointments')
    .update({
      status: 'CONFIRMED',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const getCoachAppointments = async (coachId: string, status?: string) => {
  let query = supabase
    .from('appointments')
    .select('*')
    .eq('coach_id', coachId)
    .order('date', { ascending: true })
    .order('time', { ascending: true });
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

// ============ PRODUCT CALENDARS (Multi-Coach per Product) ============

export const getProductCalendars = async (productId: string) => {
  const { data, error } = await supabase
    .from('product_calendars')
    .select('*, coach_calendars(*)')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const saveProductCalendars = async (productId: string, calendarIds: string[]) => {
  // Delete existing
  await supabase.from('product_calendars').delete().eq('product_id', productId);
  if (calendarIds.length === 0) return [];
  const rows = calendarIds.map((cid, i) => ({ product_id: productId, calendar_id: cid, sort_order: i }));
  const { data, error } = await supabase.from('product_calendars').insert(rows).select();
  if (error) throw error;
  return data || [];
};

// ============ IN-APP NOTIFICATIONS ============

export const getNotifications = async (userId: string, limit = 30) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
};

export const getUnreadNotificationCount = async (userId: string) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
  return count || 0;
};

export const markNotificationRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);
  if (error) throw error;
};

export const markAllNotificationsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
};

// ============ NOTIFICATION PREFERENCES ============

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  // Athlete
  training_reminders: boolean;
  checkin_reminders: boolean;
  weekly_progress: boolean;
  inactivity_alerts: boolean;
  // Coach
  athlete_summary: boolean;
  churn_risk_alerts: boolean;
  // Admin
  business_reports: boolean;
  churn_alerts: boolean;
  // Timing
  preferred_send_hour: number;
  timezone: string;
}

const DEFAULT_NOTIFICATION_PREFS: Omit<NotificationPreferences, 'user_id'> = {
  email_enabled: true,
  push_enabled: true,
  training_reminders: true,
  checkin_reminders: true,
  weekly_progress: true,
  inactivity_alerts: true,
  athlete_summary: true,
  churn_risk_alerts: true,
  business_reports: true,
  churn_alerts: true,
  preferred_send_hour: 8,
  timezone: 'Europe/Berlin',
};

export const getNotificationPreferences = async (userId: string): Promise<NotificationPreferences> => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // Return defaults if no record exists yet
    return { user_id: userId, ...DEFAULT_NOTIFICATION_PREFS };
  }

  return data as NotificationPreferences;
};

export const saveNotificationPreferences = async (
  userId: string,
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(
      { user_id: userId, ...prefs, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data as NotificationPreferences;
};

export const disableAllEmailNotifications = async (userId: string): Promise<void> => {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        email_enabled: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  if (error) throw error;
};
