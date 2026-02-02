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
    .single();
  if (error && error.code !== 'PGRST116') throw error;
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
    query = query.eq('coach_id', coachId);
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
