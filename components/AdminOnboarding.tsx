import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, uploadFile, getPublicUrl } from '../services/supabase';
import {
  Camera, Loader2, ChevronRight, ChevronLeft, Check, Shield,
  Phone, Globe, Sparkles, Eye, Settings, Users, BarChart3
} from 'lucide-react';

type Step = 'legal' | 'profile' | 'overview';
const STEPS: Step[] = ['legal', 'profile', 'overview'];

interface AdminOnboardingProps {
  onComplete: () => void;
}

const AdminOnboarding: React.FC<AdminOnboardingProps> = ({ onComplete }) => {
  const { user, userProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('legal');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(userProfile?.avatarUrl || null);
  const [error, setError] = useState('');

  // Legal
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // Profile
  const [firstName, setFirstName] = useState(userProfile?.firstName || '');
  const [lastName, setLastName] = useState(userProfile?.lastName || '');
  const [nickname, setNickname] = useState(userProfile?.nickname || '');
  const [phone, setPhone] = useState('');

  const currentIdx = STEPS.indexOf(step);
  const progress = ((currentIdx + 1) / STEPS.length) * 100;

  const canProceed = (): boolean => {
    switch (step) {
      case 'legal': return termsAccepted && privacyAccepted;
      case 'profile': return !!(firstName.trim() && lastName.trim());
      case 'overview': return true;
      default: return false;
    }
  };

  const goNext = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };
  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { setError('Bild max. 5MB.'); return; }
    setUploadingAvatar(true);
    setError('');
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `avatars/${user.id}.${ext}`;
      await uploadFile('public', path, file);
      const url = getPublicUrl('public', path);
      await updateProfile(user.id, { avatar_url: url });
      setAvatarPreview(url);
    } catch {
      setError('Upload fehlgeschlagen.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      await updateProfile(user.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        nickname: nickname.trim() || null,
        phone: phone.trim() || null,
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
        terms_version: '1.0',
        onboarding_completed: true,
      });
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = firstName ? `${firstName} ${lastName}`.trim() : 'Admin';

  return (
    <div className="fixed inset-0 z-[200] bg-[#0A0A0A] overflow-y-auto">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />

      {/* Progress */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-[#0A0A0A]">
        <div className="h-1 bg-zinc-800">
          <div className="h-full bg-[#00FF00] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between items-center px-6 py-3">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            Admin Setup <span className="text-[#00FF00]">{currentIdx + 1}/{STEPS.length}</span>
          </p>
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className={`w-2 h-2 rounded-full transition-colors ${i <= currentIdx ? 'bg-[#00FF00]' : 'bg-zinc-800'}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 pt-20 pb-32">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-4">{error}</div>
        )}

        {/* === STEP 1: Legal === */}
        {step === 'legal' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#00FF00]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield size={32} className="text-[#00FF00]" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Admin-Zugang einrichten</h1>
              <p className="text-zinc-400">Bestätige die rechtlichen Grundlagen für deine Administratorrolle.</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 bg-[#1C1C1E] border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-1 accent-[#00FF00] w-5 h-5 shrink-0" />
                <div>
                  <p className="text-white font-medium">AGB akzeptieren *</p>
                  <p className="text-zinc-500 text-xs mt-1">
                    Ich habe die <a href="/legal/terms" target="_blank" className="text-[#00FF00] underline">Allgemeinen Geschäftsbedingungen</a> gelesen
                    und akzeptiere diese, inkl. der erweiterten Pflichten als Administrator.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 bg-[#1C1C1E] border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
                <input type="checkbox" checked={privacyAccepted} onChange={e => setPrivacyAccepted(e.target.checked)}
                  className="mt-1 accent-[#00FF00] w-5 h-5 shrink-0" />
                <div>
                  <p className="text-white font-medium">Datenschutz akzeptieren *</p>
                  <p className="text-zinc-500 text-xs mt-1">
                    Ich habe die <a href="/legal/privacy" target="_blank" className="text-[#00FF00] underline">Datenschutzerklärung</a> gelesen.
                    Als Admin habe ich Zugang zu Nutzerdaten und bin mir der besonderen Datenschutzpflichten bewusst.
                  </p>
                </div>
              </label>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
              <p className="text-amber-300 text-xs">
                <strong>Hinweis für Admins:</strong> Du hast erweiterten Zugriff auf Nutzerdaten, Abrechnungen und
                Plattformeinstellungen. Diese Berechtigung verpflichtet dich zu besonderer Sorgfalt gem. DSGVO Art. 32.
              </p>
            </div>
          </div>
        )}

        {/* === STEP 2: Profile === */}
        {step === 'profile' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Admin-Profil</h1>
              <p className="text-zinc-400">Dein Name wird intern im Team angezeigt.</p>
            </div>

            <div className="flex justify-center mb-4">
              <button onClick={() => fileInputRef.current?.click()} className="relative group" disabled={uploadingAvatar}>
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-zinc-700 group-hover:border-[#00FF00] transition-colors">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <Camera size={28} className="text-zinc-600" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#00FF00] rounded-full flex items-center justify-center border-2 border-[#0A0A0A]">
                  {uploadingAvatar ? <Loader2 size={14} className="text-black animate-spin" /> : <Camera size={14} className="text-black" />}
                </div>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Vorname *</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Max"
                    className="w-full bg-[#1C1C1E] border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Nachname *</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Mustermann"
                    className="w-full bg-[#1C1C1E] border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Anzeigename (optional)</label>
                <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Admin Max"
                  className="w-full bg-[#1C1C1E] border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none text-sm" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Telefon (optional)</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+49 123 456789"
                    className="w-full bg-[#1C1C1E] border border-zinc-700 text-white rounded-xl pl-10 pr-4 py-3 focus:border-[#00FF00] outline-none text-sm" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === STEP 3: Overview === */}
        {step === 'overview' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[#00FF00]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Sparkles size={24} className="text-[#00FF00]" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Bereit loszulegen!</h1>
              <p className="text-zinc-400">Als Admin hast du Zugriff auf alle Bereiche der Plattform.</p>
            </div>

            {/* Admin capabilities cards */}
            <div className="grid gap-3">
              {[
                { icon: <Users size={20} />, title: 'CRM & Nutzerverwaltung', desc: 'Athleten, Coaches und Zuweisungen verwalten' },
                { icon: <BarChart3 size={20} />, title: 'Produkte & Umsatz', desc: 'Trainingspakete erstellen, Preise & Abos verwalten' },
                { icon: <Settings size={20} />, title: 'Plattform-Einstellungen', desc: 'Kalender, Chat, Übungsdatenbank konfigurieren' },
                { icon: <Eye size={20} />, title: 'Coaching-Funktionen', desc: 'Pläne erstellen, Athleten betreuen, Kalender nutzen' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-[#1C1C1E] border border-zinc-800 rounded-2xl">
                  <div className="w-10 h-10 bg-[#00FF00]/10 rounded-xl flex items-center justify-center text-[#00FF00] shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{item.title}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Profile summary */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-700 shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-lg font-bold text-[#00FF00]">
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-bold">{displayName}</p>
                <p className="text-[#00FF00] text-xs font-medium">Administrator</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-zinc-800 safe-area-bottom">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          {currentIdx > 0 ? (
            <button onClick={goBack} className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
              <ChevronLeft size={16} /> Zurück
            </button>
          ) : <div />}

          {step === 'overview' ? (
            <button onClick={handleFinish} disabled={saving}
              className="flex items-center gap-2 bg-[#00FF00] text-black font-bold px-8 py-3.5 rounded-xl hover:bg-[#00FF00]/80 transition-colors disabled:opacity-50 text-sm">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Loslegen
            </button>
          ) : (
            <button onClick={goNext} disabled={!canProceed()}
              className="flex items-center gap-2 bg-[#00FF00] text-black font-bold px-6 py-3.5 rounded-xl hover:bg-[#00FF00]/80 transition-colors disabled:opacity-30 text-sm">
              Weiter <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOnboarding;
