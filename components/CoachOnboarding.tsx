import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, uploadFile, getPublicUrl, updateBookingSlug } from '../services/supabase';
import {
  User, Camera, Loader2, ChevronRight, ChevronLeft, Check, FileText,
  Briefcase, Globe, Instagram, Phone, Link2, Sparkles, Eye, Calendar,
  Shield, ArrowRight
} from 'lucide-react';

type Step = 'legal' | 'profile' | 'bio' | 'booking' | 'preview';
const STEPS: Step[] = ['legal', 'profile', 'bio', 'booking', 'preview'];

const SPECIALIZATIONS = [
  'Krafttraining', 'Bodybuilding', 'Powerlifting', 'CrossFit',
  'Ausdauer / Cardio', 'HIIT', 'Yoga & Mobility', 'Ernährungsberatung',
  'Rehabilitation', 'Gewichtsverlust', 'Wettkampfvorbereitung',
  'Functional Training', 'Seniorentraining', 'Jugendtraining',
];

interface CoachOnboardingProps {
  onComplete: () => void;
}

const CoachOnboarding: React.FC<CoachOnboardingProps> = ({ onComplete }) => {
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
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');

  // Bio
  const [coachTitle, setCoachTitle] = useState('');
  const [coachBio, setCoachBio] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);

  // Booking
  const [bookingSlug, setBookingSlug] = useState('');

  const currentIdx = STEPS.indexOf(step);
  const progress = ((currentIdx + 1) / STEPS.length) * 100;

  const canProceed = (): boolean => {
    switch (step) {
      case 'legal': return termsAccepted && privacyAccepted;
      case 'profile': return !!(firstName.trim() && lastName.trim());
      case 'bio': return !!(coachTitle.trim() && coachBio.trim() && specializations.length > 0);
      case 'booking': return true;
      case 'preview': return true;
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
    if (file.size > 5 * 1024 * 1024) { setError('Bild darf max. 5MB groß sein.'); return; }
    setUploadingAvatar(true);
    setError('');
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `avatars/${user.id}.${ext}`;
      await uploadFile('public', path, file);
      const url = getPublicUrl('public', path);
      await updateProfile(user.id, { avatar_url: url });
      setAvatarPreview(url);
    } catch (err: any) {
      setError('Foto-Upload fehlgeschlagen.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const toggleSpec = (s: string) => {
    setSpecializations(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
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
        website: website.trim() || null,
        social_instagram: instagram.trim() || null,
        coach_title: coachTitle.trim(),
        coach_bio: coachBio.trim(),
        coach_specializations: specializations,
        terms_accepted_at: new Date().toISOString(),
        privacy_accepted_at: new Date().toISOString(),
        terms_version: '1.0',
        onboarding_completed: true,
      });
      if (bookingSlug.trim()) {
        const clean = bookingSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
        try { await updateBookingSlug(user.id, clean); } catch {}
      }
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = firstName ? `${firstName} ${lastName}`.trim() : 'Coach';

  return (
    <div className="fixed inset-0 z-[200] bg-[#0A0A0A] overflow-y-auto">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-[#0A0A0A]">
        <div className="h-1 bg-zinc-800">
          <div className="h-full bg-[#00FF00] transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between items-center px-6 py-3">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            Coach Setup <span className="text-[#00FF00]">{currentIdx + 1}/{STEPS.length}</span>
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
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* === STEP 1: Legal === */}
        {step === 'legal' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-[#00FF00]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield size={32} className="text-[#00FF00]" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Willkommen bei Greenlight</h1>
              <p className="text-zinc-400">Bevor es losgeht, bestätige bitte unsere Nutzungsbedingungen.</p>
            </div>

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 bg-[#1C1C1E] border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox" checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                  className="mt-1 accent-[#00FF00] w-5 h-5 shrink-0"
                />
                <div>
                  <p className="text-white font-medium">AGB akzeptieren *</p>
                  <p className="text-zinc-500 text-xs mt-1">
                    Ich habe die <a href="/legal/terms" target="_blank" className="text-[#00FF00] underline">Allgemeinen Geschäftsbedingungen</a> gelesen
                    und akzeptiere diese. Dies umfasst die Bedingungen für Coaches inkl.
                    Verantwortlichkeiten bei der Betreuung von Athleten.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 bg-[#1C1C1E] border border-zinc-800 rounded-2xl cursor-pointer hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox" checked={privacyAccepted}
                  onChange={e => setPrivacyAccepted(e.target.checked)}
                  className="mt-1 accent-[#00FF00] w-5 h-5 shrink-0"
                />
                <div>
                  <p className="text-white font-medium">Datenschutz akzeptieren *</p>
                  <p className="text-zinc-500 text-xs mt-1">
                    Ich habe die <a href="/legal/privacy" target="_blank" className="text-[#00FF00] underline">Datenschutzerklärung</a> gelesen.
                    Als Coach verarbeite ich personenbezogene Daten meiner Athleten
                    und bin mir meiner Pflichten nach DSGVO bewusst.
                  </p>
                </div>
              </label>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
              <p className="text-blue-300 text-xs">
                <strong>Hinweis für Coaches:</strong> Als Coach bist du Auftragsverarbeiter gem. Art. 28 DSGVO.
                Du verpflichtest dich, die Daten deiner Athleten vertraulich zu behandeln und nur
                im Rahmen des Coachings zu nutzen.
              </p>
            </div>
          </div>
        )}

        {/* === STEP 2: Profile + Photo === */}
        {step === 'profile' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-2">Dein Profil</h1>
              <p className="text-zinc-400">Wie sollen dich deine Athleten sehen?</p>
            </div>

            {/* Avatar Upload */}
            <div className="flex justify-center mb-4">
              <button onClick={() => fileInputRef.current?.click()} className="relative group" disabled={uploadingAvatar}>
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-zinc-700 group-hover:border-[#00FF00] transition-colors">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <Camera size={32} className="text-zinc-600" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-[#00FF00] rounded-full flex items-center justify-center border-3 border-[#0A0A0A]">
                  {uploadingAvatar ? <Loader2 size={16} className="text-black animate-spin" /> : <Camera size={16} className="text-black" />}
                </div>
              </button>
            </div>
            <p className="text-center text-zinc-500 text-xs mb-4">Profilbild hochladen (empfohlen)</p>

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
                <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Coach Max"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Website</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="example.de"
                      className="w-full bg-[#1C1C1E] border border-zinc-700 text-white rounded-xl pl-9 pr-4 py-3 focus:border-[#00FF00] outline-none text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Instagram</label>
                  <div className="relative">
                    <Instagram size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@coach_max"
                      className="w-full bg-[#1C1C1E] border border-zinc-700 text-white rounded-xl pl-9 pr-4 py-3 focus:border-[#00FF00] outline-none text-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === STEP 3: Bio + Specializations === */}
        {step === 'bio' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[#00FF00]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Briefcase size={24} className="text-[#00FF00]" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Deine Expertise</h1>
              <p className="text-zinc-400">Erzähle deinen Athleten, was dich ausmacht.</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Berufsbezeichnung *</label>
              <input value={coachTitle} onChange={e => setCoachTitle(e.target.value)}
                placeholder="z.B. Personal Trainer, Ernährungsberater, Athletikcoach"
                className="w-full bg-[#1C1C1E] border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none text-sm" />
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">Über mich / Bio *</label>
              <textarea value={coachBio} onChange={e => setCoachBio(e.target.value)}
                placeholder="Beschreibe deine Erfahrung, Philosophie und was Athleten von dir erwarten können..."
                rows={4}
                className="w-full bg-[#1C1C1E] border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none text-sm resize-none" />
              <p className="text-zinc-600 text-xs mt-1 text-right">{coachBio.length}/500</p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Spezialisierungen * <span className="text-zinc-600">(min. 1)</span></label>
              <div className="flex flex-wrap gap-2">
                {SPECIALIZATIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSpec(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      specializations.includes(s)
                        ? 'bg-[#00FF00] text-black font-bold'
                        : 'bg-[#1C1C1E] border border-zinc-800 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === STEP 4: Booking Link === */}
        {step === 'booking' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Calendar size={24} className="text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Buchungslink einrichten</h1>
              <p className="text-zinc-400">Erstelle deinen persönlichen Buchungslink. Deine Athleten und Interessenten können darüber direkt Termine buchen.</p>
            </div>

            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Dein persönlicher Link</label>
              <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
                <span className="text-zinc-500 text-sm pl-3 shrink-0">{window.location.origin}/book/</span>
                <input
                  value={bookingSlug}
                  onChange={e => setBookingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder={firstName ? `${firstName.toLowerCase()}-${lastName.toLowerCase()}` : 'dein-name'}
                  className="flex-1 bg-transparent text-white text-sm py-3 pr-3 outline-none"
                />
              </div>
              <p className="text-zinc-600 text-xs mt-2">Tipp: Verwende deinen Namen, z.B. "max-mustermann"</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
              <p className="text-zinc-400 text-sm">
                <strong className="text-white">Kalender einrichten:</strong> Nach dem Onboarding kannst du im Kalender-Bereich
                deine Verfügbarkeiten festlegen, verschiedene Terminarten erstellen und alles wie bei Calendly verwalten.
              </p>
            </div>

            <p className="text-zinc-500 text-xs text-center">Diesen Schritt kannst du auch später erledigen.</p>
          </div>
        )}

        {/* === STEP 5: Preview === */}
        {step === 'preview' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-[#00FF00]/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Eye size={24} className="text-[#00FF00]" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Dein öffentliches Profil</h1>
              <p className="text-zinc-400">So sehen dich deine Athleten.</p>
            </div>

            {/* Profile Preview Card */}
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#00FF00]/5 to-transparent" />

              <div className="relative flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-zinc-700 mb-4">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-3xl font-bold text-[#00FF00]">
                      {displayName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-bold text-white">{displayName}</h2>
                <p className="text-[#00FF00] text-sm font-medium mt-1">{coachTitle}</p>

                {specializations.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    {specializations.slice(0, 4).map(s => (
                      <span key={s} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-1 rounded-lg font-medium">{s}</span>
                    ))}
                    {specializations.length > 4 && (
                      <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-1 rounded-lg">+{specializations.length - 4}</span>
                    )}
                  </div>
                )}

                {coachBio && (
                  <p className="text-zinc-400 text-sm mt-4 leading-relaxed max-w-sm">{coachBio}</p>
                )}

                <div className="flex gap-3 mt-4">
                  {phone && <span className="text-zinc-500 text-xs flex items-center gap-1"><Phone size={10} /> {phone}</span>}
                  {instagram && <span className="text-zinc-500 text-xs flex items-center gap-1"><Instagram size={10} /> {instagram}</span>}
                  {website && <span className="text-zinc-500 text-xs flex items-center gap-1"><Globe size={10} /> {website}</span>}
                </div>

                {bookingSlug && (
                  <div className="mt-4 bg-[#00FF00]/10 border border-[#00FF00]/20 rounded-xl px-4 py-2">
                    <p className="text-[#00FF00] text-xs font-medium flex items-center gap-1">
                      <Link2 size={12} /> {window.location.origin}/book/{bookingSlug}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#00FF00]/5 border border-[#00FF00]/20 rounded-2xl p-4 text-center">
              <Sparkles size={16} className="text-[#00FF00] mx-auto mb-2" />
              <p className="text-zinc-300 text-sm">Alles bereit! Du kannst dein Profil jederzeit in den Einstellungen anpassen.</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-zinc-800 safe-area-bottom">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          {currentIdx > 0 ? (
            <button onClick={goBack} className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-sm font-medium">
              <ChevronLeft size={16} /> Zurück
            </button>
          ) : <div />}

          {step === 'preview' ? (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex items-center gap-2 bg-[#00FF00] text-black font-bold px-8 py-3.5 rounded-xl hover:bg-[#00FF00]/80 transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Onboarding abschließen
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-[#00FF00] text-black font-bold px-6 py-3.5 rounded-xl hover:bg-[#00FF00]/80 transition-colors disabled:opacity-30 text-sm"
            >
              Weiter <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachOnboarding;
