import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import { signOut, updateProfile, uploadFile, getPublicUrl, requestDataDeletion, exportUserData, createAuditLog, getAssignedPlans } from '../services/supabase';
import { Camera, Check, LogOut, Globe, Settings, Download, Trash2, FileText, AlertTriangle, RefreshCw, CreditCard, Receipt, ExternalLink, Heart, Loader2, Save, ChevronRight } from 'lucide-react';
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
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [assignedPlans, setAssignedPlans] = useState<any[]>([]);
  const [portalLoading, setPortalLoading] = useState(false);

  // Inline edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
  });

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
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, {
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
        onboarding_completed: true,
      });
      await refreshProfile();
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setExportLoading(true);
    try {
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
      await createAuditLog({ user_id: user.id, action: 'DATA_EXPORT', table_name: 'all' });
      alert('Datenexport erfolgreich heruntergeladen!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export fehlgeschlagen.');
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

  const displayName = userProfile?.firstName
    ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim()
    : userProfile?.nickname || userProfile?.email?.split('@')[0] || 'User';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-8">
      <CalculatorsModal isOpen={showTools} onClose={() => setShowTools(false)} />
      <HealthDataModal isOpen={showHealthData} onClose={() => setShowHealthData(false)} />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />

      {/* === PROFILE HEADER WITH AVATAR === */}
      <div className="bg-gradient-to-br from-[#1C1C1E] to-black border border-zinc-800 rounded-[2rem] p-6 relative overflow-hidden">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative shrink-0 group"
            disabled={uploadingAvatar}
          >
            <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-zinc-700 group-hover:border-[#00FF00] transition-colors">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-3xl font-bold text-[#00FF00]">
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-[#00FF00] rounded-full flex items-center justify-center border-2 border-[#1C1C1E] group-hover:scale-110 transition-transform">
              {uploadingAvatar ? (
                <Loader2 size={12} className="text-black animate-spin" />
              ) : (
                <Camera size={12} className="text-black" />
              )}
            </div>
          </button>

          {/* Name + Email */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white tracking-tight truncate">{displayName}</h1>
            <p className="text-zinc-500 text-sm truncate">{user?.email}</p>
            {userProfile?.role && (
              <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-widest bg-[#00FF00]/10 text-[#00FF00] px-2.5 py-1 rounded-lg">
                {userProfile.role}
              </span>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4 mt-5 pt-5 border-t border-zinc-800/60">
          <div className="flex-1 text-center">
            <span className="block text-lg font-bold text-white">{userProfile?.height || '—'}</span>
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">cm</span>
          </div>
          <div className="w-px bg-zinc-800"></div>
          <div className="flex-1 text-center">
            <span className="block text-lg font-bold text-white">{userProfile?.weight || '—'}</span>
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">kg</span>
          </div>
          <div className="w-px bg-zinc-800"></div>
          <div className="flex-1 text-center">
            <span className="block text-lg font-bold text-white">{userProfile?.bodyFat || '—'}</span>
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">%KFA</span>
          </div>
        </div>
      </div>

      {/* === INLINE PROFILE EDITOR === */}
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Profil bearbeiten</h2>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#00FF00] text-black font-bold rounded-xl text-sm hover:bg-[#00FF00]/80 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Speichern
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-zinc-800 text-white font-medium rounded-xl text-sm hover:bg-zinc-700 transition-colors"
            >
              Bearbeiten
            </button>
          )}
        </div>

        {saved && (
          <div className="px-5 pt-3">
            <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 text-[#00FF00] text-sm p-3 rounded-xl flex items-center gap-2">
              <Check size={14} /> Profil gespeichert!
            </div>
          </div>
        )}

        <div className="p-5 space-y-5">
          {/* Personal Info */}
          <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Persönliche Daten</p>
            <div className="grid grid-cols-2 gap-3">
              <ProfileField label="Vorname" value={form.firstName} field="firstName" editing={editing} onChange={handleFieldChange} />
              <ProfileField label="Nachname" value={form.lastName} field="lastName" editing={editing} onChange={handleFieldChange} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
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
            </div>
            <div className="mt-3">
              <ProfileField label="Geburtsdatum" value={form.birthDate} field="birthDate" type="date" editing={editing} onChange={handleFieldChange} />
            </div>
          </div>

          {/* Body Stats */}
          <div className="pt-2">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Körperdaten</p>
            <div className="grid grid-cols-2 gap-3">
              <ProfileField label="Größe" value={form.height} field="height" type="number" suffix="cm" editing={editing} onChange={handleFieldChange} />
              <ProfileField label="Gewicht" value={form.weight} field="weight" type="number" suffix="kg" editing={editing} onChange={handleFieldChange} />
              <ProfileField label="Körperfett" value={form.bodyFat} field="bodyFat" type="number" suffix="%" editing={editing} onChange={handleFieldChange} />
              <ProfileField label="Taillenumfang" value={form.waistCircumference} field="waistCircumference" type="number" suffix="cm" editing={editing} onChange={handleFieldChange} />
            </div>
          </div>

          {/* Heart Rate */}
          <div className="pt-2">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Herzfrequenz</p>
            <div className="grid grid-cols-2 gap-3">
              <ProfileField label="Ruhe-HF" value={form.restingHeartRate} field="restingHeartRate" type="number" suffix="bpm" editing={editing} onChange={handleFieldChange} />
              <ProfileField label="Max-HF" value={form.maxHeartRate} field="maxHeartRate" type="number" suffix="bpm" editing={editing} onChange={handleFieldChange} />
            </div>
          </div>
        </div>
      </div>

      {/* === QUICK ACTIONS === */}
      <div className="grid gap-3">
        <button
          onClick={() => setShowHealthData(true)}
          className="flex items-center gap-4 p-4 bg-[#1C1C1E] border border-zinc-800 rounded-2xl hover:bg-zinc-900 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#00FF00]/10 flex items-center justify-center text-[#00FF00] group-hover:scale-110 transition-transform">
            <Heart size={20} />
          </div>
          <div className="text-left flex-1">
            <h3 className="text-white font-bold">Gesundheitsdaten</h3>
            <p className="text-zinc-500 text-xs">FFMI, TDEE, HR-Zonen berechnen</p>
          </div>
          <ChevronRight size={16} className="text-zinc-600" />
        </button>
      </div>

      {/* Role Switcher */}
      {canSwitchRole && (
        <div className="space-y-3">
          <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest px-2">Ansicht wechseln</h3>
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <RefreshCw size={16} className="text-[#00FF00]" />
              <span className="text-white font-medium text-sm">Aktive Rolle</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveRole(UserRole.ATHLETE)}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                  activeRole === UserRole.ATHLETE ? 'bg-[#00FF00] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Athlet
              </button>
              <button
                onClick={() => setActiveRole(UserRole.COACH)}
                className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                  activeRole === UserRole.COACH ? 'bg-[#00FF00] text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Coach
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="space-y-3">
        <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest px-2">Benachrichtigungen</h3>
        <NotificationSettings />
      </div>

      {/* Membership & Subscriptions */}
      <div className="space-y-3">
        <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest px-2">Mitgliedschaft & Käufe</h3>
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
                <Receipt size={16} className="text-[#00FF00]" />
                <span className="text-white font-medium text-sm">Meine Pläne ({assignedPlans.length})</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {assignedPlans.map((plan: any) => (
                  <div key={plan.id} className="flex items-center justify-between bg-zinc-900 rounded-xl p-3">
                    <div>
                      <p className="text-white text-sm font-medium">{plan.plan_name || 'Trainingsplan'}</p>
                      <p className="text-zinc-500 text-xs">
                        {plan.schedule_status === 'ACTIVE' ? 'Aktiv' : plan.schedule_status === 'COMPLETED' ? 'Abgeschlossen' : 'Pausiert'}
                      </p>
                    </div>
                    {plan.progress_percentage > 0 && <span className="text-xs text-[#00FF00] font-bold">{Math.round(plan.progress_percentage)}%</span>}
                  </div>
                ))}
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
      </div>

      {/* Settings */}
      <div className="space-y-3">
        <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest px-2">App</h3>
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
          <button onClick={toggleLanguage} className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors">
            <div className="flex items-center gap-3">
              <Globe size={16} className="text-zinc-400" />
              <span className="text-white font-medium text-sm">Sprache</span>
            </div>
            <span className="text-zinc-500 text-sm font-bold">{language === 'en' ? 'English' : 'Deutsch'}</span>
          </button>
          <div className="w-full flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Settings size={16} className="text-zinc-400" />
              <span className="text-zinc-500 font-medium text-sm">Version</span>
            </div>
            <span className="text-zinc-600 text-sm">v1.0.2</span>
          </div>
        </div>
      </div>

      {/* Privacy (GDPR) */}
      <div className="space-y-3">
        <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest px-2">Datenschutz</h3>
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
          <Link to="/legal/privacy" className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors">
            <div className="flex items-center gap-3">
              <FileText size={16} className="text-zinc-400" />
              <span className="text-white font-medium text-sm">Datenschutzerklärung</span>
            </div>
            <ChevronRight size={14} className="text-zinc-600" />
          </Link>
          <button onClick={handleExportData} disabled={exportLoading} className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors disabled:opacity-50">
            <div className="flex items-center gap-3">
              <Download size={16} className="text-[#00FF00]" />
              <div className="text-left">
                <span className="text-white font-medium text-sm block">Daten exportieren</span>
                <span className="text-zinc-500 text-xs">Art. 20 DSGVO</span>
              </div>
            </div>
            {exportLoading ? <Loader2 size={14} className="text-zinc-500 animate-spin" /> : <ChevronRight size={14} className="text-zinc-600" />}
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 transition-colors">
            <div className="flex items-center gap-3">
              <Trash2 size={16} className="text-red-500" />
              <div className="text-left">
                <span className="text-red-400 font-medium text-sm block">Account löschen</span>
                <span className="text-zinc-500 text-xs">Art. 17 DSGVO</span>
              </div>
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

      {/* Logout */}
      <div className="pt-4 pb-8">
        <Button variant="danger" fullWidth onClick={handleLogout} className="h-14 rounded-2xl text-lg flex items-center justify-center gap-2">
          <LogOut size={20} /> {t('nav.logout')}
        </Button>
      </div>
    </div>
  );
};

export default Profile;