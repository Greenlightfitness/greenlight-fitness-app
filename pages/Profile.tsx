import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, signOut, updateProfile, uploadFile, getPublicUrl, requestDataDeletion, exportUserData, createAuditLog, getAssignedPlans, requestDataExport, getExportRequests } from '../services/supabase';
import { Camera, Check, LogOut, Globe, Settings, Download, Trash2, FileText, AlertTriangle, RefreshCw, CreditCard, Receipt, ExternalLink, Heart, Loader2, Save, ChevronRight, ArrowLeft, Bell, User2, Scale, Calculator, BookOpen, CheckCircle2, Mail, Shield, Clock, Pause, Play, Pencil, X, ClipboardList, AlertCircle } from 'lucide-react';
import { UserRole } from '../types';
import Button from '../components/Button';
import CalculatorsModal from '../components/CalculatorsModal';
import HealthDataModal from '../components/HealthDataModal';
import NotificationSettings from '../components/NotificationSettings';

const ProfileField = ({ label, value, field, type = 'text', suffix, editing, onChange }: { label: string; value: string; field: string; type?: string; suffix?: string; editing: boolean; onChange: (field: string, value: string) => void }) => (
  <div>
    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">{label}</label>
    {editing ? (
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => onChange(field, e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none transition-colors text-sm"
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs">{suffix}</span>}
      </div>
    ) : (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm">
        <span className={value ? 'text-white' : 'text-zinc-600'}>{value || '—'}</span>
        {value && suffix && <span className="text-zinc-500 ml-1">{suffix}</span>}
      </div>
    )}
  </div>
);

const Profile: React.FC = () => {
  const { userProfile, user, activeRole, setActiveRole, canSwitchRole, refreshProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showTools, setShowTools] = useState(false);
  const [showHealthData, setShowHealthData] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  // Data Export Flow
  const [exportChecks, setExportChecks] = useState<Record<string, boolean>>({});
  const [exportConfirmEmail, setExportConfirmEmail] = useState('');
  const [exportRequests, setExportRequests] = useState<any[]>([]);
  const [exportRequestsLoading, setExportRequestsLoading] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [assignedPlans, setAssignedPlans] = useState<any[]>([]);
  const [portalLoading, setPortalLoading] = useState(false);

  // Plan Management State
  const [schedulePicker, setSchedulePicker] = useState<any | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [scheduleStartDate, setScheduleStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [pauseModal, setPauseModal] = useState<any | null>(null);
  const [pauseDuration, setPauseDuration] = useState<number>(1); // weeks
  const [pauseChecks, setPauseChecks] = useState({ understand: false, payment: false, once: false });
  const [pausing, setPausing] = useState(false);

  // Inline edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [subPage, setSubPage] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    gender: 'male' as 'male' | 'female',
    birthDate: '',
    height: '',
    weight: '',
    bodyFat: '',
    waistCircumference: '',
    restingHeartRate: '',
    maxHeartRate: '',
    biography: '',
  });

  const isAthlete = userProfile?.role === UserRole.ATHLETE;
  const isCoachOrAdmin = userProfile?.role === UserRole.COACH || userProfile?.role === UserRole.ADMIN;

  // Sync form with profile data
  useEffect(() => {
    if (userProfile) {
      setForm({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        nickname: userProfile.nickname || '',
        gender: userProfile.gender || 'male',
        birthDate: userProfile.birthDate || '',
        height: userProfile.height?.toString() || '',
        weight: userProfile.weight?.toString() || '',
        bodyFat: userProfile.bodyFat?.toString() || '',
        waistCircumference: userProfile.waistCircumference?.toString() || '',
        restingHeartRate: userProfile.restingHeartRate?.toString() || '',
        maxHeartRate: userProfile.maxHeartRate?.toString() || '',
        biography: userProfile.biography || '',
      });
      if (userProfile.avatarUrl) setAvatarPreview(userProfile.avatarUrl);
    }
  }, [userProfile]);

  useEffect(() => {
    if (user) loadSubscriptionData();
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user?.email) return;
    try {
      const plans = await getAssignedPlans(user.id).catch(() => []);
      setAssignedPlans(plans);
      const response = await fetch('/api/get-customer-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: user.email }),
      });
      if (response.ok) {
        const stripeData = await response.json();
        setSubscriptions(stripeData.subscriptions || []);
        setPurchases(stripeData.purchases || []);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
    }
  };

  const openCustomerPortal = async () => {
    if (!user?.email) return;
    setPortalLoading(true);
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail: user.email, returnUrl: window.location.href }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else throw new Error(data.error || 'Portal session failed');
    } catch (error) {
      console.error('Portal error:', error);
      alert('Konnte das Kundenportal nicht öffnen.');
    } finally {
      setPortalLoading(false);
    }
  };

  // --- Plan Management Helpers ---
  const getSessionsPerWeek = (plan: any): number => {
    if (!plan.structure?.weeks?.[0]?.sessions) return 0;
    return plan.structure.weeks[0].sessions.length;
  };

  const getDefaultDays = (plan: any): number[] => {
    if (!plan.structure?.weeks?.[0]?.sessions) return [];
    return plan.structure.weeks[0].sessions
      .map((s: any) => s.dayOfWeek ?? s.order ?? 0)
      .sort((a: number, b: number) => a - b);
  };

  const openSchedulePicker = (plan: any) => {
    const hasSchedule = plan.schedule && Object.keys(plan.schedule).length > 0;
    const defaultDays = getDefaultDays(plan);
    setSelectedDays(defaultDays);
    if (hasSchedule) {
      // Replan mode: start from next Monday
      const now = new Date();
      const day = now.getDay();
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + ((8 - day) % 7 || 7));
      setScheduleStartDate(nextMonday.toISOString().split('T')[0]);
    } else {
      setScheduleStartDate(plan.start_date || new Date().toISOString().split('T')[0]);
    }
    setSchedulePicker(plan);
  };

  const toggleDay = (day: number) => {
    if (!schedulePicker) return;
    const required = getSessionsPerWeek(schedulePicker);
    setSelectedDays(prev => {
      if (prev.includes(day)) return prev.filter(d => d !== day);
      if (prev.length >= required) return prev;
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const handleGenerateSchedule = async () => {
    if (!schedulePicker || !user) return;
    const plan = schedulePicker;
    const sessionsPerWeek = getSessionsPerWeek(plan);
    if (selectedDays.length !== sessionsPerWeek) return;
    setGeneratingSchedule(true);
    try {
      const isReplan = plan.schedule && Object.keys(plan.schedule).length > 0;
      const replanCutoff = scheduleStartDate; // Everything before this stays

      // Preserve past sessions when replanning
      const preservedSchedule: Record<string, string> = {};
      if (isReplan && plan.schedule) {
        Object.entries(plan.schedule).forEach(([dateKey, sessionId]) => {
          if (dateKey < replanCutoff) {
            preservedSchedule[dateKey] = sessionId as string;
          }
        });
      }

      // Calculate how many weeks are already covered by preserved sessions
      const preservedWeekCount = isReplan ? new Set(
        Object.keys(preservedSchedule).map(d => {
          const date = new Date(d);
          const day = date.getDay();
          const monday = new Date(date);
          monday.setDate(date.getDate() - ((day + 6) % 7));
          return monday.toISOString().split('T')[0];
        })
      ).size : 0;

      // Generate new schedule from replan start date (or original start)
      const newSchedule: Record<string, string> = {};
      const start = new Date(scheduleStartDate);
      const startDay = start.getDay();
      const mondayOffset = startDay === 0 ? -6 : 1 - startDay;
      const weekStart = new Date(start);
      weekStart.setDate(weekStart.getDate() + mondayOffset);

      const remainingWeeks = plan.structure.weeks.slice(preservedWeekCount);
      remainingWeeks.forEach((week: any, weekIndex: number) => {
        const sessions = [...(week.sessions || [])].sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
        sessions.forEach((session: any, sessionIndex: number) => {
          if (sessionIndex >= selectedDays.length) return;
          const targetDay = selectedDays[sessionIndex];
          const sessionDate = new Date(weekStart);
          sessionDate.setDate(sessionDate.getDate() + (weekIndex * 7) + targetDay);
          const dateKey = sessionDate.toISOString().split('T')[0];
          newSchedule[dateKey] = session.id;
        });
      });

      const finalSchedule = { ...preservedSchedule, ...newSchedule };
      const { error } = await supabase
        .from('assigned_plans')
        .update({ schedule: finalSchedule, schedule_status: 'ACTIVE' })
        .eq('id', plan.id);
      if (error) throw error;
      setSchedulePicker(null);
      await loadSubscriptionData();
    } catch (error) {
      console.error('Error generating schedule:', error);
    } finally {
      setGeneratingSchedule(false);
    }
  };

  const canPause = (plan: any): boolean => {
    if (!plan.last_pause_date) return true;
    const lastPause = new Date(plan.last_pause_date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastPause.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 30;
  };

  const daysSinceLastPause = (plan: any): number => {
    if (!plan.last_pause_date) return 999;
    const lastPause = new Date(plan.last_pause_date);
    return Math.floor((new Date().getTime() - lastPause.getTime()) / (1000 * 60 * 60 * 24));
  };

  const openPauseModal = (plan: any) => {
    setPauseModal(plan);
    setPauseDuration(1);
    setPauseChecks({ understand: false, payment: false, once: false });
  };

  const handlePausePlan = async () => {
    if (!pauseModal || !user) return;
    if (!pauseChecks.understand || !pauseChecks.payment || !pauseChecks.once) return;
    setPausing(true);
    try {
      const now = new Date();
      const pauseUntil = new Date(now);
      pauseUntil.setDate(pauseUntil.getDate() + (pauseDuration * 7));
      const { error } = await supabase
        .from('assigned_plans')
        .update({
          schedule_status: 'PAUSED',
          paused_at: now.toISOString(),
          pause_until: pauseUntil.toISOString(),
          last_pause_date: now.toISOString(),
          pause_reason: `Manuell pausiert für ${pauseDuration} Woche(n)`,
        })
        .eq('id', pauseModal.id);
      if (error) throw error;
      setPauseModal(null);
      await loadSubscriptionData();
    } catch (error) {
      console.error('Error pausing plan:', error);
    } finally {
      setPausing(false);
    }
  };

  const handleResumePlan = async (planId: string) => {
    try {
      await supabase
        .from('assigned_plans')
        .update({ schedule_status: 'ACTIVE', paused_at: null, pause_until: null })
        .eq('id', planId);
      await loadSubscriptionData();
    } catch (error) {
      console.error('Error resuming plan:', error);
    }
  };

  const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  // --- Avatar Upload ---
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { alert('Bild darf max. 5MB groß sein.'); return; }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}.${ext}`;
      await uploadFile('avatars', path, file);
      const url = getPublicUrl('avatars', path);
      await updateProfile(user.id, { avatar_url: url });
      setAvatarPreview(url);
    } catch (err) {
      console.error('Avatar upload failed:', err);
      alert('Upload fehlgeschlagen.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // --- Save Profile ---
  const handleSave = async () => {
    if (!user) {
      alert('Nicht eingeloggt. Bitte erneut anmelden.');
      return;
    }
    setSaving(true);
    try {
      const updates: Record<string, any> = {
        first_name: form.firstName || null,
        last_name: form.lastName || null,
        nickname: form.nickname || null,
        gender: form.gender,
        birth_date: form.birthDate || null,
        height: form.height ? Number(form.height) : null,
        weight: form.weight ? Number(form.weight) : null,
        body_fat: form.bodyFat ? Number(form.bodyFat) : null,
        waist_circumference: form.waistCircumference ? Number(form.waistCircumference) : null,
        resting_heart_rate: form.restingHeartRate ? Number(form.restingHeartRate) : null,
        max_heart_rate: form.maxHeartRate ? Number(form.maxHeartRate) : null,
        biography: form.biography || null,
        onboarding_completed: true,
      };
      console.log('[Profile] Saving profile for', user.id, updates);
      await updateProfile(user.id, updates);
      console.log('[Profile] Save successful, refreshing...');
      await refreshProfile();
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error('[Profile] Save failed:', error);
      const msg = error?.message || 'Unbekannter Fehler';
      alert(`Fehler beim Speichern: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const loadExportRequests = async () => {
    if (!user) return;
    setExportRequestsLoading(true);
    try {
      const data = await getExportRequests(user.id);
      setExportRequests(data);
    } catch {}
    finally { setExportRequestsLoading(false); }
  };

  const handleExportData = async () => {
    if (!user || !user.email) return;
    // Validate checklist + email confirmation
    const allChecked = ['understand', 'email', 'gdpr'].every(k => exportChecks[k]);
    if (!allChecked) return;
    if (exportConfirmEmail.toLowerCase().trim() !== user.email.toLowerCase().trim()) return;

    setExportLoading(true);
    try {
      // 1. Log the request in DB
      await requestDataExport(user.id, user.email);
      // 2. Perform the actual export
      const data = await exportUserData(user.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `greenlight-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // 3. Audit log
      await createAuditLog({ user_id: user.id, action: 'DATA_EXPORT', table_name: 'all' });
      // 4. Reload requests to show status
      await loadExportRequests();
      // 5. Reset form
      setExportChecks({});
      setExportConfirmEmail('');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!user || !user.email) return;
    setDeleteLoading(true);
    try {
      await requestDataDeletion(user.id, user.email, deleteReason);
      await createAuditLog({ user_id: user.id, action: 'DELETION_REQUESTED', new_data: { reason: deleteReason } });
      alert('Löschantrag wurde eingereicht.');
      setShowDeleteConfirm(false);
      setDeleteReason('');
    } catch (error) {
      console.error('Deletion request failed:', error);
      alert('Fehler beim Einreichen des Löschantrags.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogout = async () => {
    try { await signOut(); navigate('/login'); } catch (error) { console.error('Logout failed', error); }
  };

  const toggleLanguage = () => setLanguage(language === 'en' ? 'de' : 'en');

  const handleFieldChange = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const displayName = form.firstName
    ? `${form.firstName} ${form.lastName || ''}`.trim()
    : form.nickname || userProfile?.email?.split('@')[0] || 'User';

  const goBack = () => { setSubPage(null); setEditing(false); };

  // =================== SUB-PAGE: Persönliche Daten ===================
  if (subPage === 'personal') {
    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 pb-8">
        <CalculatorsModal isOpen={showTools} onClose={() => setShowTools(false)} />
        <HealthDataModal isOpen={showHealthData} onClose={() => setShowHealthData(false)} />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
        <div className="flex items-center justify-between">
          <button onClick={goBack} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors -ml-1">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Profil</span>
          </button>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors">Abbrechen</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00FF00] text-black font-bold rounded-xl text-sm hover:bg-[#00FF00]/80 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Speichern
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="px-4 py-1.5 bg-zinc-800 text-white font-medium rounded-xl text-sm hover:bg-zinc-700 transition-colors">
              Bearbeiten
            </button>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Persönliche Daten</h1>
        {saved && (
          <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 text-[#00FF00] text-sm p-3 rounded-xl flex items-center gap-2">
            <Check size={14} /> Gespeichert!
          </div>
        )}
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <ProfileField label="Vorname" value={form.firstName} field="firstName" editing={editing} onChange={handleFieldChange} />
            <ProfileField label="Nachname" value={form.lastName} field="lastName" editing={editing} onChange={handleFieldChange} />
          </div>
          <ProfileField label="Spitzname" value={form.nickname} field="nickname" editing={editing} onChange={handleFieldChange} />
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Geschlecht</label>
            {editing ? (
              <select
                value={form.gender}
                onChange={e => setForm(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none text-sm"
              >
                <option value="male">Männlich</option>
                <option value="female">Weiblich</option>
              </select>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white">
                {form.gender === 'male' ? 'Männlich' : 'Weiblich'}
              </div>
            )}
          </div>
          <ProfileField label="Geburtsdatum" value={form.birthDate} field="birthDate" type="date" editing={editing} onChange={handleFieldChange} />
        </div>
      </div>
    );
  }

  // =================== SUB-PAGE: Körperdaten ===================
  if (subPage === 'body') {
    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 pb-8">
        <div className="flex items-center justify-between">
          <button onClick={goBack} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors -ml-1">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Profil</span>
          </button>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors">Abbrechen</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00FF00] text-black font-bold rounded-xl text-sm hover:bg-[#00FF00]/80 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Speichern
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="px-4 py-1.5 bg-zinc-800 text-white font-medium rounded-xl text-sm hover:bg-zinc-700 transition-colors">
              Bearbeiten
            </button>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Körperdaten</h1>
        {saved && (
          <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 text-[#00FF00] text-sm p-3 rounded-xl flex items-center gap-2">
            <Check size={14} /> Gespeichert!
          </div>
        )}
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-5 space-y-4">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Maße</p>
          <div className="grid grid-cols-2 gap-3">
            <ProfileField label="Größe" value={form.height} field="height" type="number" suffix="cm" editing={editing} onChange={handleFieldChange} />
            <ProfileField label="Gewicht" value={form.weight} field="weight" type="number" suffix="kg" editing={editing} onChange={handleFieldChange} />
            <ProfileField label="Körperfett" value={form.bodyFat} field="bodyFat" type="number" suffix="%" editing={editing} onChange={handleFieldChange} />
            <ProfileField label="Taillenumfang" value={form.waistCircumference} field="waistCircumference" type="number" suffix="cm" editing={editing} onChange={handleFieldChange} />
          </div>
        </div>
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-5 space-y-4">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Herzfrequenz</p>
          <div className="grid grid-cols-2 gap-3">
            <ProfileField label="Ruhe-HF" value={form.restingHeartRate} field="restingHeartRate" type="number" suffix="bpm" editing={editing} onChange={handleFieldChange} />
            <ProfileField label="Max-HF" value={form.maxHeartRate} field="maxHeartRate" type="number" suffix="bpm" editing={editing} onChange={handleFieldChange} />
          </div>
        </div>
      </div>
    );
  }

  // =================== SUB-PAGE: Biografie (Coach/Admin) ===================
  if (subPage === 'biography') {
    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 pb-8">
        <div className="flex items-center justify-between">
          <button onClick={goBack} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors -ml-1">
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Profil</span>
          </button>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors">Abbrechen</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00FF00] text-black font-bold rounded-xl text-sm hover:bg-[#00FF00]/80 disabled:opacity-50">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Speichern
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="px-4 py-1.5 bg-zinc-800 text-white font-medium rounded-xl text-sm hover:bg-zinc-700 transition-colors">
              Bearbeiten
            </button>
          )}
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Über mich</h1>
        {saved && (
          <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 text-[#00FF00] text-sm p-3 rounded-xl flex items-center gap-2">
            <Check size={14} /> Gespeichert!
          </div>
        )}
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-5 space-y-4">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Biografie</p>
          <p className="text-xs text-zinc-500">Erzähle deinen Athleten etwas über dich — deine Qualifikationen, Erfahrung und Philosophie.</p>
          {editing ? (
            <textarea
              value={form.biography}
              onChange={e => setForm(prev => ({ ...prev, biography: e.target.value }))}
              placeholder="z.B. Zertifizierter Strength & Conditioning Coach mit 8 Jahren Erfahrung..."
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none transition-colors text-sm resize-none min-h-[160px]"
              rows={6}
            />
          ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-3 text-sm min-h-[80px]">
              <span className={form.biography ? 'text-white whitespace-pre-wrap' : 'text-zinc-600'}>
                {form.biography || 'Noch keine Biografie hinterlegt — tippe auf "Bearbeiten" um eine hinzuzufügen.'}
              </span>
            </div>
          )}
        </div>
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4">
          <p className="text-xs text-zinc-500">
            <strong className="text-zinc-400">Tipp:</strong> Deine Biografie wird für Athleten sichtbar sein und hilft ihnen, dich als Trainer besser kennenzulernen.
          </p>
        </div>
      </div>
    );
  }

  // =================== SUB-PAGE: Datenexport (DSGVO Art. 20) ===================
  if (subPage === 'export') {
    const allChecked = ['understand', 'email', 'gdpr'].every(k => exportChecks[k]);
    const emailMatch = user?.email && exportConfirmEmail.toLowerCase().trim() === user.email.toLowerCase().trim();
    const canSubmit = allChecked && emailMatch && !exportLoading;

    // Load export requests when opening page
    if (exportRequests.length === 0 && !exportRequestsLoading) {
      loadExportRequests();
    }

    const statusLabel = (s: string) => {
      switch (s) {
        case 'PENDING': return { text: 'Angefordert', color: 'text-yellow-400', bg: 'bg-yellow-500/15' };
        case 'PROCESSING': return { text: 'Wird erstellt', color: 'text-blue-400', bg: 'bg-blue-500/15' };
        case 'READY': return { text: 'Bereit', color: 'text-[#00FF00]', bg: 'bg-[#00FF00]/15' };
        case 'DOWNLOADED': return { text: 'Heruntergeladen', color: 'text-zinc-400', bg: 'bg-zinc-700/50' };
        case 'EXPIRED': return { text: 'Abgelaufen', color: 'text-zinc-500', bg: 'bg-zinc-800' };
        default: return { text: s, color: 'text-zinc-400', bg: 'bg-zinc-800' };
      }
    };

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Daten exportieren</h1>
            <p className="text-zinc-500 text-xs mt-0.5">Art. 20 DSGVO — Recht auf Datenportabilität</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#00FF00]/10 flex items-center justify-center shrink-0 mt-0.5">
              <Shield size={20} className="text-[#00FF00]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Deine Daten gehören dir</h3>
              <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
                Du kannst eine Kopie aller über dich gespeicherten Daten anfordern. Der Export enthält dein Profil, 
                Trainingspläne, Aktivitäten, Einwilligungen und mehr — in einem maschinenlesbaren Format (JSON).
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Enthaltene Daten</p>
            <div className="grid grid-cols-2 gap-1.5">
              {['Profildaten', 'Körper- & Gesundheitsdaten', 'Trainingspläne', 'Trainingshistorie', 'Aktivitäts-Logs', 'Einwilligungen & Audit-Logs'].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-900/50 rounded-lg px-3 py-2">
                  <CheckCircle2 size={12} className="text-[#00FF00] shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-5 space-y-4">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Checkliste</p>
          
          {[
            { id: 'understand', label: 'Ich verstehe, dass eine Kopie aller meiner Daten erstellt wird' },
            { id: 'email', label: 'Eine Bestätigung wird an meine hinterlegte E-Mail-Adresse gesendet' },
            { id: 'gdpr', label: 'Ich fordere diese Daten gemäß Art. 20 DSGVO an' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setExportChecks(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
              className="flex items-start gap-3 w-full text-left group"
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                exportChecks[item.id] 
                  ? 'bg-[#00FF00] border-[#00FF00]' 
                  : 'border-zinc-600 group-hover:border-zinc-400'
              }`}>
                {exportChecks[item.id] && <Check size={12} className="text-black" />}
              </div>
              <span className={`text-sm leading-snug ${exportChecks[item.id] ? 'text-white' : 'text-zinc-400'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Email Confirmation */}
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-zinc-400" />
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Identität bestätigen</p>
          </div>
          <p className="text-xs text-zinc-400">
            Gib deine E-Mail-Adresse ein, um den Export zu bestätigen.
          </p>
          <input
            type="email"
            value={exportConfirmEmail}
            onChange={e => setExportConfirmEmail(e.target.value)}
            placeholder={user?.email || 'deine@email.de'}
            className={`w-full bg-zinc-900 border rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors ${
              exportConfirmEmail && emailMatch 
                ? 'border-[#00FF00] focus:border-[#00FF00]' 
                : exportConfirmEmail && !emailMatch 
                  ? 'border-red-500/50 focus:border-red-500' 
                  : 'border-zinc-700 focus:border-zinc-500'
            }`}
          />
          {exportConfirmEmail && emailMatch && (
            <p className="text-[#00FF00] text-xs flex items-center gap-1.5"><CheckCircle2 size={12} /> E-Mail bestätigt</p>
          )}
          {exportConfirmEmail && !emailMatch && exportConfirmEmail.length > 3 && (
            <p className="text-red-400 text-xs">E-Mail stimmt nicht überein</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          onClick={handleExportData}
          disabled={!canSubmit}
          className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            canSubmit
              ? 'bg-[#00FF00] text-black hover:bg-[#00FF00]/90 shadow-[0_0_20px_rgba(0,255,0,0.2)]'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {exportLoading ? (
            <><Loader2 size={18} className="animate-spin" /> Export wird erstellt...</>
          ) : (
            <><Download size={18} /> Datenexport anfordern</>
          )}
        </button>

        {/* Previous Requests */}
        {exportRequests.length > 0 && (
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Bisherige Anfragen</p>
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/60">
              {exportRequests.slice(0, 5).map((req: any) => {
                const s = statusLabel(req.status);
                return (
                  <div key={req.id} className="flex items-center gap-3 p-4">
                    <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                      {req.status === 'DOWNLOADED' ? <Check size={14} className={s.color} /> :
                       req.status === 'PROCESSING' ? <Loader2 size={14} className={`${s.color} animate-spin`} /> :
                       <Clock size={14} className={s.color} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">Datenexport</p>
                      <p className="text-zinc-500 text-xs">
                        {new Date(req.requested_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}>
                      {s.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4">
          <p className="text-xs text-zinc-500 leading-relaxed">
            <strong className="text-zinc-400">Hinweis:</strong> Dein Datenexport wird sofort als JSON-Datei heruntergeladen. 
            Gemäß DSGVO Art. 20 hast du das Recht auf Datenportabilität. Die Anfrage wird protokolliert.
          </p>
        </div>
      </div>
    );
  }

  // =================== SUB-PAGE: Benachrichtigungen ===================
  if (subPage === 'notifications') {
    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 pb-8">
        <button onClick={() => setSubPage(null)} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors -ml-1">
          <ArrowLeft size={20} />
          <span className="text-sm font-medium">Profil</span>
        </button>
        <h1 className="text-2xl font-bold text-white tracking-tight">Benachrichtigungen</h1>
        <NotificationSettings />
      </div>
    );
  }

  // =================== MAIN PROFILE VIEW ===================
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-8 max-w-2xl mx-auto">
      <CalculatorsModal isOpen={showTools} onClose={() => setShowTools(false)} />
      <HealthDataModal isOpen={showHealthData} onClose={() => setShowHealthData(false)} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />

      {/* === CENTERED PROFILE HEADER === */}
      <div className="flex flex-col items-center text-center pt-2 pb-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative group mb-4"
          disabled={uploadingAvatar}
        >
          <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-zinc-700 group-hover:border-[#00FF00] transition-colors">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-3xl font-bold text-[#00FF00]">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#00FF00] rounded-full flex items-center justify-center border-[3px] border-black group-hover:scale-110 transition-transform">
            {uploadingAvatar ? (
              <Loader2 size={14} className="text-black animate-spin" />
            ) : (
              <Camera size={14} className="text-black" />
            )}
          </div>
        </button>
        <h1 className="text-xl font-bold text-white tracking-tight">{displayName}</h1>
        <p className="text-zinc-500 text-sm mt-0.5">{user?.email}</p>
        {userProfile?.role && (
          <span className="mt-2 text-[10px] font-bold uppercase tracking-widest bg-[#00FF00]/10 text-[#00FF00] px-3 py-1 rounded-full">
            {userProfile.role}
          </span>
        )}
      </div>

      {saved && (
        <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 text-[#00FF00] text-sm p-3 rounded-xl flex items-center gap-2">
          <Check size={14} /> Profil gespeichert!
        </div>
      )}

      {/* === PROFIL MENU GROUP === */}
      <div>
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-4 mb-2">Profil</p>
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/60">
          <button onClick={() => setSubPage('personal')} className="w-full flex items-center gap-3.5 p-4 hover:bg-zinc-900/50 transition-colors active:bg-zinc-800/50">
            <div className="w-9 h-9 rounded-[10px] bg-blue-500/15 flex items-center justify-center shrink-0">
              <User2 size={18} className="text-blue-400" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="text-white text-sm font-medium block">Persönliche Daten</span>
              <span className="text-zinc-500 text-xs truncate block">{displayName}</span>
            </div>
            <ChevronRight size={16} className="text-zinc-600 shrink-0" />
          </button>

          {/* Biography — Coach/Admin only */}
          {isCoachOrAdmin && (
            <button onClick={() => setSubPage('biography')} className="w-full flex items-center gap-3.5 p-4 hover:bg-zinc-900/50 transition-colors active:bg-zinc-800/50">
              <div className="w-9 h-9 rounded-[10px] bg-orange-500/15 flex items-center justify-center shrink-0">
                <BookOpen size={18} className="text-orange-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="text-white text-sm font-medium block">Über mich / Biografie</span>
                <span className="text-zinc-500 text-xs truncate block">
                  {form.biography ? form.biography.substring(0, 50) + (form.biography.length > 50 ? '...' : '') : 'Noch nicht ausgefüllt'}
                </span>
              </div>
              <ChevronRight size={16} className="text-zinc-600 shrink-0" />
            </button>
          )}

          {/* Body Data — Athlete only */}
          {isAthlete && (
            <button onClick={() => setSubPage('body')} className="w-full flex items-center gap-3.5 p-4 hover:bg-zinc-900/50 transition-colors active:bg-zinc-800/50">
              <div className="w-9 h-9 rounded-[10px] bg-green-500/15 flex items-center justify-center shrink-0">
                <Scale size={18} className="text-green-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="text-white text-sm font-medium block">Körperdaten</span>
                <span className="text-zinc-500 text-xs truncate block">
                  {form.weight && form.height ? `${form.weight} kg · ${form.height} cm` : 'Noch nicht ausgefüllt'}
                </span>
              </div>
              <ChevronRight size={16} className="text-zinc-600 shrink-0" />
            </button>
          )}

          {/* Health Data — Athlete only */}
          {isAthlete && (
            <button onClick={() => setShowHealthData(true)} className="w-full flex items-center gap-3.5 p-4 hover:bg-zinc-900/50 transition-colors active:bg-zinc-800/50">
              <div className="w-9 h-9 rounded-[10px] bg-red-500/15 flex items-center justify-center shrink-0">
                <Heart size={18} className="text-red-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="text-white text-sm font-medium block">Gesundheitsdaten</span>
                <span className="text-zinc-500 text-xs block">FFMI, TDEE, HR-Zonen</span>
              </div>
              <ChevronRight size={16} className="text-zinc-600 shrink-0" />
            </button>
          )}

          {/* Calculator — Athlete only */}
          {isAthlete && (
            <button onClick={() => setShowTools(true)} className="w-full flex items-center gap-3.5 p-4 hover:bg-zinc-900/50 transition-colors active:bg-zinc-800/50">
              <div className="w-9 h-9 rounded-[10px] bg-purple-500/15 flex items-center justify-center shrink-0">
                <Calculator size={18} className="text-purple-400" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <span className="text-white text-sm font-medium block">Rechner</span>
                <span className="text-zinc-500 text-xs block">1RM, FFMI, TDEE, ACWR</span>
              </div>
              <ChevronRight size={16} className="text-zinc-600 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* === EINSTELLUNGEN MENU GROUP === */}
      <div>
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-4 mb-2">Einstellungen</p>
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/60">
          <button onClick={() => setSubPage('notifications')} className="w-full flex items-center gap-3.5 p-4 hover:bg-zinc-900/50 transition-colors active:bg-zinc-800/50">
            <div className="w-9 h-9 rounded-[10px] bg-yellow-500/15 flex items-center justify-center shrink-0">
              <Bell size={18} className="text-yellow-400" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="text-white text-sm font-medium block">Benachrichtigungen</span>
              <span className="text-zinc-500 text-xs block">Push & E-Mail</span>
            </div>
            <ChevronRight size={16} className="text-zinc-600 shrink-0" />
          </button>
          <button onClick={toggleLanguage} className="w-full flex items-center gap-3.5 p-4 hover:bg-zinc-900/50 transition-colors active:bg-zinc-800/50">
            <div className="w-9 h-9 rounded-[10px] bg-zinc-700/50 flex items-center justify-center shrink-0">
              <Globe size={18} className="text-zinc-400" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-white text-sm font-medium block">Sprache</span>
            </div>
            <span className="text-zinc-500 text-sm font-medium">{language === 'en' ? 'English' : 'Deutsch'}</span>
          </button>
          {canSwitchRole && (
            <div className="p-4">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-9 h-9 rounded-[10px] bg-[#00FF00]/10 flex items-center justify-center shrink-0">
                  <RefreshCw size={18} className="text-[#00FF00]" />
                </div>
                <span className="text-white text-sm font-medium">Ansicht wechseln</span>
              </div>
              <div className="flex gap-2 ml-[52px]">
                <button
                  onClick={() => setActiveRole(UserRole.ATHLETE)}
                  className={`flex-1 py-2 px-3 rounded-xl font-semibold text-sm transition-all ${
                    activeRole === UserRole.ATHLETE ? 'bg-[#00FF00] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Athlet
                </button>
                <button
                  onClick={() => setActiveRole(UserRole.COACH)}
                  className={`flex-1 py-2 px-3 rounded-xl font-semibold text-sm transition-all ${
                    activeRole === UserRole.COACH ? 'bg-[#00FF00] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Coach
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === MITGLIEDSCHAFT MENU GROUP (Athlete only) === */}
      {isAthlete && <div>
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-4 mb-2">Mitgliedschaft</p>
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden">
          {subscriptions.length === 0 && purchases.length === 0 && assignedPlans.length === 0 && (
            <div className="p-4 border-b border-zinc-800 text-center">
              <p className="text-zinc-400 text-sm">Noch keine Käufe vorhanden</p>
              <p className="text-zinc-600 text-xs mt-1">Besuche den Shop um Trainingspläne zu kaufen</p>
            </div>
          )}
          {subscriptions.length > 0 && (
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard size={16} className="text-[#00FF00]" />
                <span className="text-white font-medium text-sm">Aktive Abos ({subscriptions.length})</span>
              </div>
              <div className="space-y-2">
                {subscriptions.map((sub: any) => (
                  <div key={sub.id} className="flex items-center justify-between bg-zinc-900 rounded-xl p-3">
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{sub.productName || 'Abonnement'}</p>
                      <p className="text-zinc-500 text-xs">
                        {sub.amount} {sub.currency}/{sub.interval === 'month' ? 'Monat' : sub.interval}
                      </p>
                    </div>
                    {sub.cancelAtPeriodEnd && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-lg">Gekündigt</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {assignedPlans.length > 0 && (
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3 mb-3">
                <ClipboardList size={16} className="text-[#00FF00]" />
                <span className="text-white font-medium text-sm">Meine Programme ({assignedPlans.length})</span>
              </div>
              <div className="space-y-2">
                {assignedPlans.map((plan: any) => {
                  const isOneToOne = plan.assignment_type === 'ONE_TO_ONE' || plan.coaching_type === 'ONE_TO_ONE';
                  const hasSchedule = plan.schedule && Object.keys(plan.schedule).length > 0;
                  // 1:1 coaching plans are always "active" — coach controls the days directly via dayOfWeek
                  const isPending = !isOneToOne && !hasSchedule && plan.schedule_status !== 'PAUSED' && plan.structure?.weeks?.length > 0;
                  const isActive = isOneToOne 
                    ? plan.schedule_status === 'ACTIVE' 
                    : plan.schedule_status === 'ACTIVE' && hasSchedule;
                  const isPaused = plan.schedule_status === 'PAUSED';
                  return (
                    <div key={plan.id} className={`rounded-xl p-3 border ${isPending ? 'bg-amber-500/5 border-amber-500/20' : isPaused ? 'bg-zinc-900/50 border-zinc-800/50 opacity-60' : 'bg-zinc-900 border-zinc-800'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${isPending ? 'bg-amber-400' : isActive ? 'bg-[#00FF00]' : 'bg-zinc-600'}`} />
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{plan.plan_name || 'Trainingsplan'}</p>
                            <p className="text-zinc-500 text-[10px]">
                              {isPending ? 'Noch nicht aktiviert' : isActive ? (isOneToOne ? `1:1 Coaching · ${getSessionsPerWeek(plan)}x/Woche` : `Aktiv · ${getSessionsPerWeek(plan)}x/Woche`) : isPaused ? `Pausiert${plan.pause_until ? ` bis ${new Date(plan.pause_until).toLocaleDateString('de-DE')}` : ''}` : plan.schedule_status}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isPending && (
                            <button onClick={() => openSchedulePicker(plan)} className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1.5 rounded-lg hover:bg-amber-500/20 transition-colors">
                              Aktivieren
                            </button>
                          )}
                          {isActive && !isOneToOne && (
                            <>
                              <button onClick={() => openSchedulePicker(plan)} className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors" title="Umplanen">
                                <Pencil size={12} />
                              </button>
                              {canPause(plan) ? (
                                <button onClick={() => openPauseModal(plan)} className="p-1.5 text-zinc-500 hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors" title="Pausieren">
                                  <Pause size={12} />
                                </button>
                              ) : (
                                <span className="text-[9px] text-zinc-600 px-1" title={`Nächste Pause in ${30 - daysSinceLastPause(plan)} Tagen`}>⏳</span>
                              )}
                            </>
                          )}
                          {isActive && isOneToOne && (
                            <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg font-medium">
                              Coach-Plan
                            </span>
                          )}
                          {isPaused && (
                            <button onClick={() => handleResumePlan(plan.id)} className="text-[10px] font-bold text-[#00FF00] bg-[#00FF00]/10 px-2.5 py-1.5 rounded-lg hover:bg-[#00FF00]/20 transition-colors flex items-center gap-1">
                              <Play size={10} /> Fortsetzen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <button onClick={openCustomerPortal} disabled={portalLoading} className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors disabled:opacity-50">
            <div className="flex items-center gap-3">
              <ExternalLink size={16} className="text-[#00FF00]" />
              <div className="text-left">
                <span className="text-white font-medium text-sm block">Abonnement verwalten</span>
                <span className="text-zinc-500 text-xs">Zahlung, Rechnungen, Kündigung</span>
              </div>
            </div>
            {portalLoading ? <Loader2 size={14} className="text-zinc-500 animate-spin" /> : <ChevronRight size={14} className="text-zinc-600" />}
          </button>
        </div>
      </div>}

      {/* === DATENSCHUTZ MENU GROUP === */}
      <div>
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest px-4 mb-2">Datenschutz</p>
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800/60">
          <Link to="/legal/privacy" className="flex items-center gap-3.5 p-4 hover:bg-zinc-900/50 transition-colors active:bg-zinc-800/50">
            <div className="w-9 h-9 rounded-[10px] bg-zinc-700/50 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-zinc-400" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-white text-sm font-medium block">Datenschutzerklärung</span>
            </div>
            <ChevronRight size={16} className="text-zinc-600 shrink-0" />
          </Link>
          <button onClick={() => setSubPage('export')} className="w-full flex items-center gap-3.5 p-4 hover:bg-zinc-900/50 transition-colors active:bg-zinc-800/50">
            <div className="w-9 h-9 rounded-[10px] bg-[#00FF00]/10 flex items-center justify-center shrink-0">
              <Download size={18} className="text-[#00FF00]" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="text-white text-sm font-medium block">Daten exportieren</span>
              <span className="text-zinc-500 text-xs block">Art. 20 DSGVO</span>
            </div>
            <ChevronRight size={16} className="text-zinc-600 shrink-0" />
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center gap-3.5 p-4 hover:bg-red-500/10 transition-colors active:bg-red-500/5">
            <div className="w-9 h-9 rounded-[10px] bg-red-500/15 flex items-center justify-center shrink-0">
              <Trash2 size={18} className="text-red-400" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <span className="text-red-400 text-sm font-medium block">Account löschen</span>
              <span className="text-zinc-500 text-xs block">Art. 17 DSGVO</span>
            </div>
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Account löschen?</h3>
                <p className="text-zinc-500 text-sm">Kann nicht rückgängig gemacht werden.</p>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-xl p-4 mb-4">
              <p className="text-zinc-300 text-sm mb-2">Folgende Daten werden gelöscht:</p>
              <ul className="text-zinc-500 text-sm space-y-1">
                <li>- Profildaten & Körperdaten</li>
                <li>- Alle Trainingspläne</li>
                <li>- Aktivitäts-Logs & Fortschritt</li>
                <li>- Hochgeladene Dateien</li>
              </ul>
            </div>
            <div className="mb-4">
              <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block mb-2">Grund (optional)</label>
              <textarea
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                placeholder="Warum möchtest du deinen Account löschen?"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white text-sm resize-none focus:outline-none focus:border-red-500"
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowDeleteConfirm(false)}>Abbrechen</Button>
              <Button variant="danger" fullWidth onClick={handleRequestDeletion} disabled={deleteLoading}>
                {deleteLoading ? 'Wird eingereicht...' : 'Löschung beantragen'}
              </Button>
            </div>
            <p className="text-zinc-600 text-xs text-center mt-4">Bearbeitung innerhalb von 30 Tagen (Art. 17 DSGVO).</p>
          </div>
        </div>
      )}

      {/* === SCHEDULE PICKER MODAL === */}
      {schedulePicker && (() => {
        const isReplan = schedulePicker.schedule && Object.keys(schedulePicker.schedule).length > 0;
        return (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1C1C1E] border border-zinc-800 w-full max-w-md rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">{isReplan ? 'Trainingstage umplanen' : 'Trainingstage festlegen'}</h3>
                <button onClick={() => setSchedulePicker(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
              <p className="text-sm text-zinc-400 mb-1">{schedulePicker.plan_name}</p>
              <p className="text-xs text-zinc-500 mb-4">
                {isReplan ? `Neue Tage gelten ab ${new Date(scheduleStartDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })}. Bisherige Sessions bleiben erhalten.` : `Wähle ${getSessionsPerWeek(schedulePicker)} Tage pro Woche für deine Sessions.`}
              </p>
              {!isReplan && (
                <div className="mb-4">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">Startdatum</label>
                  <input type="date" value={scheduleStartDate} onChange={(e) => setScheduleStartDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none text-sm" />
                </div>
              )}
              {isReplan && (
                <div className="mb-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <p className="text-[10px] text-blue-400 flex items-center gap-1.5">
                    <AlertCircle size={12} /> Änderungen gelten ab nächster Woche ({new Date(scheduleStartDate).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' })}). Vergangene Sessions werden nicht verändert.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {DAY_LABELS.map((label, key) => {
                  const isSelected = selectedDays.includes(key);
                  const isFull = selectedDays.length >= getSessionsPerWeek(schedulePicker) && !isSelected;
                  return (
                    <button key={key} onClick={() => toggleDay(key)} disabled={isFull}
                      className={`flex flex-col items-center py-3 rounded-xl text-xs font-bold transition-all ${
                        isSelected ? 'bg-[#00FF00] text-black'
                          : isFull ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                      }`}>{label}</button>
                  );
                })}
              </div>
              <p className="text-xs text-zinc-500 text-center mb-4">{selectedDays.length}/{getSessionsPerWeek(schedulePicker)} Tage ausgewählt</p>
              <div className="flex gap-2">
                <button onClick={() => setSchedulePicker(null)} className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors text-sm">Abbrechen</button>
                <button onClick={handleGenerateSchedule} disabled={selectedDays.length !== getSessionsPerWeek(schedulePicker) || generatingSchedule}
                  className="flex-1 py-3 bg-[#00FF00] text-black rounded-xl font-bold hover:bg-[#00FF00]/90 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {generatingSchedule ? 'Wird erstellt...' : isReplan ? 'Umplanen' : 'Bestätigen'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* === PAUSE CONFIRMATION MODAL === */}
      {pauseModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1C1C1E] border border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Pause size={20} className="text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Training pausieren</h3>
                    <p className="text-xs text-zinc-500">{pauseModal.plan_name}</p>
                  </div>
                </div>
                <button onClick={() => setPauseModal(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Duration Picker */}
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">Pausendauer</label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(weeks => (
                    <button key={weeks} onClick={() => setPauseDuration(weeks)}
                      className={`py-3 rounded-xl text-sm font-bold transition-all ${
                        pauseDuration === weeks ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}>
                      {weeks} Wo.
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-600 mt-1.5">
                  Pause bis: {(() => { const d = new Date(); d.setDate(d.getDate() + pauseDuration * 7); return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }); })()}
                </p>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 bg-zinc-900 rounded-xl cursor-pointer hover:bg-zinc-800/80 transition-colors"
                  onClick={() => setPauseChecks(p => ({ ...p, understand: !p.understand }))}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${pauseChecks.understand ? 'bg-amber-500 border-amber-500' : 'border-zinc-600'}`}>
                    {pauseChecks.understand && <Check size={12} className="text-black" />}
                  </div>
                  <span className="text-xs text-zinc-300">Ich verstehe, dass mein Trainingsplan für den gewählten Zeitraum pausiert wird und keine Sessions im Kalender erscheinen.</span>
                </label>

                <label className="flex items-start gap-3 p-3 bg-zinc-900 rounded-xl cursor-pointer hover:bg-zinc-800/80 transition-colors"
                  onClick={() => setPauseChecks(p => ({ ...p, payment: !p.payment }))}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${pauseChecks.payment ? 'bg-amber-500 border-amber-500' : 'border-zinc-600'}`}>
                    {pauseChecks.payment && <Check size={12} className="text-black" />}
                  </div>
                  <span className="text-xs text-zinc-300">Mir ist bewusst, dass laufende Abonnement-Zahlungen separat über das Kundenportal verwaltet werden müssen. Die Pause betrifft nur den Trainingsplan.</span>
                </label>

                <label className="flex items-start gap-3 p-3 bg-zinc-900 rounded-xl cursor-pointer hover:bg-zinc-800/80 transition-colors"
                  onClick={() => setPauseChecks(p => ({ ...p, once: !p.once }))}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${pauseChecks.once ? 'bg-amber-500 border-amber-500' : 'border-zinc-600'}`}>
                    {pauseChecks.once && <Check size={12} className="text-black" />}
                  </div>
                  <span className="text-xs text-zinc-300">Ich weiß, dass ich diese Funktion nur einmal pro 30 Tage nutzen kann.</span>
                </label>
              </div>

              {/* Legal Disclaimer */}
              <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle size={14} className="text-zinc-500 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-zinc-500 space-y-1">
                    <p><strong className="text-zinc-400">Hinweis:</strong> Die Trainingsplan-Pause hat keinen Einfluss auf bestehende Zahlungsvereinbarungen. Abonnements und Ratenzahlungen laufen unverändert weiter, sofern sie nicht separat im Kundenportal gekündigt oder pausiert werden.</p>
                    <p>Nach Ablauf der Pause wird dein Plan automatisch fortgesetzt. Du kannst die Pause jederzeit vorzeitig beenden.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-zinc-800">
              <button onClick={() => setPauseModal(null)} className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors text-sm">
                Abbrechen
              </button>
              <button onClick={handlePausePlan}
                disabled={!pauseChecks.understand || !pauseChecks.payment || !pauseChecks.once || pausing}
                className="flex-1 py-3 bg-amber-500 text-black rounded-xl font-bold hover:bg-amber-400 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <Pause size={14} />
                {pausing ? 'Wird pausiert...' : `${pauseDuration} Wo. pausieren`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === LOGOUT === */}
      <div className="pt-2">
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2.5 p-4 text-red-400 hover:bg-red-500/10 transition-colors active:bg-red-500/5 font-medium">
            <LogOut size={18} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </div>

      {/* Version */}
      <p className="text-center text-zinc-600 text-xs pb-8">Greenlight Fitness · v1.0.2</p>
    </div>
  );
};

export default Profile;