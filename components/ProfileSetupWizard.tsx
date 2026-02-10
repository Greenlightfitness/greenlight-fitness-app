import React, { useState } from 'react';
import { updateProfile } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Button from './Button';
import Input from './Input';
import {
  User, Activity, ChevronRight, ChevronLeft, HeartPulse, Check,
  Sun, Moon, TrendingUp, Dumbbell, BarChart3, Target, 
  ShoppingBag, MessageCircle, Users, Bell, BellRing,
  Sparkles, Zap, Shield, Clock, Flame, Star, Rocket
} from 'lucide-react';
import { requestNotificationPermission, registerServiceWorker, subscribeToPush } from '../services/notifications';

const TOTAL_STEPS = 7;

interface ProfileSetupWizardProps {
  onComplete: () => void;
}

const ProfileSetupWizard: React.FC<ProfileSetupWizardProps> = ({ onComplete }) => {
  const { user, userProfile } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied'
  );
  
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    nickname: userProfile?.nickname || '',
    height: userProfile?.height || '',
    weight: userProfile?.weight || '',
    bodyFat: userProfile?.bodyFat || '',
    birthDate: userProfile?.birthDate || '',
    gender: userProfile?.gender || 'male',
    waistCircumference: userProfile?.waistCircumference || '',
    restingHeartRate: userProfile?.restingHeartRate || '',
    maxHeartRate: userProfile?.maxHeartRate || ''
  });

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateProfile(user.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        nickname: formData.nickname,
        height: formData.height ? Number(formData.height) : null,
        weight: formData.weight ? Number(formData.weight) : null,
        body_fat: formData.bodyFat ? Number(formData.bodyFat) : null,
        waist_circumference: formData.waistCircumference ? Number(formData.waistCircumference) : null,
        resting_heart_rate: formData.restingHeartRate ? Number(formData.restingHeartRate) : null,
        max_heart_rate: formData.maxHeartRate ? Number(formData.maxHeartRate) : null,
        birth_date: formData.birthDate,
        gender: formData.gender,
        onboarding_completed: true
      });
      onComplete();
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    try {
      await updateProfile(user.id, { onboarding_completed: true });
    } catch (e) { console.error(e) }
    onComplete();
  };

  const handleRequestNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      const reg = await registerServiceWorker();
      if (reg) await subscribeToPush(reg);
    }
  };

  const nextStep = () => setStep(Math.min(step + 1, TOTAL_STEPS));
  const prevStep = () => setStep(Math.max(step - 1, 1));

  // ─── Feature Card Component ──────────────────────────────
  const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) => (
    <div className="flex items-start gap-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3">
      <div className="w-8 h-8 bg-[#00FF00]/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <span className="text-white text-sm font-bold block">{title}</span>
        <span className="text-zinc-500 text-xs leading-relaxed">{desc}</span>
      </div>
    </div>
  );

  // ─── Benefit Pill ────────────────────────────────────────
  const BenefitPill = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <div className="flex items-center gap-2 bg-[#00FF00]/5 border border-[#00FF00]/10 rounded-full px-3 py-1.5">
      <span className="text-[#00FF00]">{icon}</span>
      <span className="text-zinc-300 text-xs">{text}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-[#0A0A0A] flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg my-auto">
        
        {/* Progress Bar */}
        <div className="flex justify-center gap-1.5 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-500 ${
                i < step ? 'bg-[#00FF00] w-10' : i === step - 1 ? 'bg-[#00FF00] w-10' : 'bg-zinc-800 w-6'
              }`} 
            />
          ))}
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-white tracking-tight">
            GREENLIGHT<span className="text-[#00FF00]">.</span>
          </h1>
          <p className="text-zinc-600 text-xs uppercase tracking-widest mt-1">Schritt {step} von {TOTAL_STEPS}</p>
        </div>

        {/* ═══════════ STEP 1: Welcome + Name ═══════════ */}
        {step === 1 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-2">
              <div className="w-16 h-16 bg-[#00FF00]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Rocket size={32} className="text-[#00FF00]" />
              </div>
              <h2 className="text-xl font-black text-white">Willkommen bei Greenlight!</h2>
              <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto">
                Deine Fitness-Journey beginnt hier. Lass uns dein Profil einrichten — das dauert nur 2 Minuten.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-[#00FF00]">
                <User size={18} />
                <span className="font-bold uppercase tracking-wider text-xs">Dein Name</span>
              </div>
              <Input 
                label="Vorname"
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                placeholder="Jane"
              />
              <Input 
                label="Nachname"
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                placeholder="Doe"
              />
              <Input 
                label="Spitzname (optional)"
                value={formData.nickname}
                onChange={e => setFormData({...formData, nickname: e.target.value})}
                placeholder="J-Doe"
              />
            </div>

            <Button fullWidth onClick={nextStep} className="flex justify-between items-center group">
              Weiter <ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />
            </Button>
          </div>
        )}

        {/* ═══════════ STEP 2: Body Stats ═══════════ */}
        {step === 2 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-2">
              <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Activity size={32} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-black text-white">Deine Ausgangsdaten</h2>
              <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto">
                Diese Werte helfen deinem Coach, deinen Fortschritt zu tracken und dein Training optimal zu planen.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Größe (cm)" type="number" value={formData.height}
                  onChange={e => setFormData({...formData, height: e.target.value})} placeholder="180" />
                <Input label="Gewicht (kg)" type="number" value={formData.weight}
                  onChange={e => setFormData({...formData, weight: e.target.value})} placeholder="75" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Körperfett (%)" type="number" value={formData.bodyFat}
                  onChange={e => setFormData({...formData, bodyFat: e.target.value})} placeholder="15" />
                <Input label="Bauchumfang (cm)" type="number" value={formData.waistCircumference}
                  onChange={e => setFormData({...formData, waistCircumference: e.target.value})} placeholder="80" />
              </div>
            </div>

            <p className="text-center text-zinc-600 text-[10px]">
              Du kannst diese Werte jederzeit in deinem Profil aktualisieren.
            </p>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={prevStep}>
                <ChevronLeft size={18} />
              </Button>
              <Button fullWidth onClick={nextStep} className="flex justify-between items-center group">
                Weiter <ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 3: Bio Data ═══════════ */}
        {step === 3 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-2">
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HeartPulse size={32} className="text-purple-400" />
              </div>
              <h2 className="text-xl font-black text-white">Biologische Daten</h2>
              <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto">
                Für präzise Berechnungen (FFMI, Kalorienverbrauch, Herzfrequenzzonen).
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-400">Geschlecht</label>
                  <select value={formData.gender} 
                    onChange={e => setFormData({...formData, gender: e.target.value as any})}
                    className="bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 focus:border-[#00FF00] outline-none">
                    <option value="male">Männlich</option>
                    <option value="female">Weiblich</option>
                  </select>
                </div>
                <Input label="Geburtsdatum" type="date" value={formData.birthDate}
                  onChange={e => setFormData({...formData, birthDate: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Ruhepuls (bpm)" type="number" value={formData.restingHeartRate}
                  onChange={e => setFormData({...formData, restingHeartRate: e.target.value})} placeholder="60" />
                <Input label="Maximalpuls (bpm)" type="number" value={formData.maxHeartRate}
                  onChange={e => setFormData({...formData, maxHeartRate: e.target.value})} placeholder="190" />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={prevStep}>
                <ChevronLeft size={18} />
              </Button>
              <Button fullWidth onClick={nextStep} className="flex justify-between items-center group">
                Weiter <ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 4: Feature Tour — Daily Check-Ins ═══════════ */}
        {step === 4 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-2">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sun size={32} className="text-amber-400" />
              </div>
              <h2 className="text-xl font-black text-white">Tägliche Check-Ins</h2>
              <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto">
                <strong className="text-white">Das wichtigste Feature für deinen Fortschritt.</strong> Jeden Tag in 30 Sekunden ausfüllen.
              </p>
            </div>

            {/* Visual Preview */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                  <Flame size={20} className="text-amber-400" />
                </div>
                <div>
                  <span className="text-white font-bold text-sm block">Warum ist das so wichtig?</span>
                  <span className="text-zinc-500 text-xs">Dein Coach sieht diese Daten in Echtzeit</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <FeatureCard 
                  icon={<Moon size={16} className="text-[#00FF00]" />}
                  title="Schlafqualität"
                  desc="Schlechter Schlaf = reduzierte Leistung. Dein Coach passt die Intensität an."
                />
                <FeatureCard 
                  icon={<Zap size={16} className="text-[#00FF00]" />}
                  title="Energielevel"
                  desc="Zeigt Übertraining frühzeitig an, bevor es zu Verletzungen kommt."
                />
                <FeatureCard 
                  icon={<TrendingUp size={16} className="text-[#00FF00]" />}
                  title="Stimmung & Stress"
                  desc="Mentale Verfassung beeinflusst Training. Dein Coach reagiert proaktiv."
                />
              </div>

              <div className="mt-4 bg-[#00FF00]/5 border border-[#00FF00]/10 rounded-xl p-3">
                <p className="text-xs text-zinc-400">
                  <strong className="text-[#00FF00]">Pro-Tipp:</strong> Athleten, die täglich Check-Ins machen, erreichen ihre Ziele <strong className="text-white">3x schneller</strong> — weil ihr Coach gezielt reagieren kann.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={prevStep}>
                <ChevronLeft size={18} />
              </Button>
              <Button fullWidth onClick={nextStep} className="flex justify-between items-center group">
                Verstanden <ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 5: Feature Tour — Training & Tracking ═══════════ */}
        {step === 5 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-2">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Dumbbell size={32} className="text-red-400" />
              </div>
              <h2 className="text-xl font-black text-white">Dein Training</h2>
              <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto">
                Strukturierte Workouts mit Echtzeit-Tracking — genau wie in einem professionellen Gym.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <FeatureCard 
                icon={<BarChart3 size={16} className="text-[#00FF00]" />}
                title="Automatisches Volume-Tracking"
                desc="Jeder Satz, jede Wiederholung wird erfasst. Du siehst dein Volumen pro Muskelgruppe über Zeit."
              />
              <FeatureCard 
                icon={<Star size={16} className="text-[#00FF00]" />}
                title="Personal Records (PRs)"
                desc="Neue Bestleistungen werden automatisch erkannt und hervorgehoben. Jeder PR zählt!"
              />
              <FeatureCard 
                icon={<Target size={16} className="text-[#00FF00]" />}
                title="Coach-Feedback"
                desc="Dein Coach kann jedes Workout kommentieren und deine Technik oder Intensität anpassen."
              />
              <FeatureCard 
                icon={<Clock size={16} className="text-[#00FF00]" />}
                title="Trainingshistorie"
                desc="Kalenderansicht aller vergangenen Workouts. Vergleiche Wochen, Monate, Phasen."
              />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={prevStep}>
                <ChevronLeft size={18} />
              </Button>
              <Button fullWidth onClick={nextStep} className="flex justify-between items-center group">
                Weiter <ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 6: Push Notifications ═══════════ */}
        {step === 6 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-2">
              <div className="w-16 h-16 bg-[#00FF00]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BellRing size={32} className="text-[#00FF00]" />
              </div>
              <h2 className="text-xl font-black text-white">Bleib am Ball</h2>
              <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto">
                Aktiviere Benachrichtigungen, damit du <strong className="text-white">nichts verpasst</strong> und dein Training konsistent bleibt.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <Sun size={16} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-bold block text-xs">Check-In Erinnerung</span>
                    <span className="text-zinc-500 text-[11px]">Täglich morgens — damit du deinen Tag richtig startest</span>
                  </div>
                  <Check size={16} className="text-[#00FF00]" />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <Dumbbell size={16} className="text-red-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-bold block text-xs">Training-Reminder</span>
                    <span className="text-zinc-500 text-[11px]">Wenn du ein Workout geplant hast</span>
                  </div>
                  <Check size={16} className="text-[#00FF00]" />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <MessageCircle size={16} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-bold block text-xs">Coach-Nachrichten</span>
                    <span className="text-zinc-500 text-[11px]">Wenn dein Coach dir schreibt oder Feedback gibt</span>
                  </div>
                  <Check size={16} className="text-[#00FF00]" />
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Star size={16} className="text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-bold block text-xs">Meilensteine & PRs</span>
                    <span className="text-zinc-500 text-[11px]">Feiere deine Erfolge</span>
                  </div>
                  <Check size={16} className="text-[#00FF00]" />
                </div>
              </div>

              {notifPermission === 'granted' ? (
                <div className="bg-[#00FF00]/10 border border-[#00FF00]/20 rounded-xl p-4 flex items-center gap-3">
                  <Check size={20} className="text-[#00FF00]" />
                  <div>
                    <span className="text-[#00FF00] font-bold text-sm block">Benachrichtigungen aktiviert!</span>
                    <span className="text-zinc-400 text-xs">Du verpasst nichts mehr.</span>
                  </div>
                </div>
              ) : notifPermission === 'denied' ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <span className="text-red-400 text-sm font-bold block">Benachrichtigungen blockiert</span>
                  <span className="text-zinc-400 text-xs">Du kannst sie später in den Browser-Einstellungen aktivieren.</span>
                </div>
              ) : (
                <button
                  onClick={handleRequestNotifications}
                  className="w-full bg-[#00FF00] hover:bg-[#00DD00] text-black font-black py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                >
                  <Bell size={18} />
                  Benachrichtigungen aktivieren
                </button>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={prevStep}>
                <ChevronLeft size={18} />
              </Button>
              <Button fullWidth onClick={nextStep} className="flex justify-between items-center group">
                {notifPermission === 'granted' ? 'Weiter' : 'Später'} <ChevronRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════ STEP 7: Ready — Launch! ═══════════ */}
        {step === 7 && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-2">
              <div className="w-20 h-20 bg-[#00FF00]/10 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-[#00FF00]/20">
                <Sparkles size={40} className="text-[#00FF00]" />
              </div>
              <h2 className="text-2xl font-black text-white">Du bist bereit!</h2>
              <p className="text-zinc-400 text-sm mt-2 max-w-sm mx-auto">
                Dein Profil ist eingerichtet. Hier ist, was dich erwartet:
              </p>
            </div>

            {/* Quick summary */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-800/50">
                  <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <Sun size={16} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white text-xs font-bold">Morgens</span>
                    <span className="text-zinc-500 text-[10px] block">Daily Check-In ausfüllen (30 Sek.)</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-800/50">
                  <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <Dumbbell size={16} className="text-red-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white text-xs font-bold">Training</span>
                    <span className="text-zinc-500 text-[10px] block">Workout starten, Sätze loggen</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-800/50">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <ShoppingBag size={16} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white text-xs font-bold">Shop</span>
                    <span className="text-zinc-500 text-[10px] block">Trainingspläne & Coaching-Pakete entdecken</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-800/50">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Users size={16} className="text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <span className="text-white text-xs font-bold">Coach</span>
                    <span className="text-zinc-500 text-[10px] block">Mit deinem Coach chatten & Fortschritt besprechen</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Motivation badges */}
            <div className="flex flex-wrap gap-2 justify-center">
              <BenefitPill icon={<Shield size={12} />} text="Sicher & DSGVO-konform" />
              <BenefitPill icon={<TrendingUp size={12} />} text="Datengetriebener Fortschritt" />
              <BenefitPill icon={<Zap size={12} />} text="Coach reagiert in Echtzeit" />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={prevStep}>
                <ChevronLeft size={18} />
              </Button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-[#00FF00] hover:bg-[#00DD00] text-black font-black py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-pulse">Wird eingerichtet...</span>
                ) : (
                  <>
                    Los geht's <Rocket size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Skip link — always available */}
        {step < TOTAL_STEPS && (
          <button 
            onClick={handleSkip} 
            className="w-full mt-4 text-zinc-600 text-xs hover:text-zinc-400 transition-colors"
          >
            Onboarding überspringen
          </button>
        )}
      </div>
    </div>
  );
};

export default ProfileSetupWizard;