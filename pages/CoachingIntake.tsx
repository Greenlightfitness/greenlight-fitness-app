import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createCoachingIntake, getCoachingIntake, updateCoachingIntake, supabase } from '../services/supabase';
import { ClipboardList, ChevronRight, ChevronLeft, Check, Loader2, AlertTriangle, Dumbbell, Target, Clock, Calendar, Heart, MessageCircle } from 'lucide-react';

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const TIMES = [
  { id: 'morning', label: 'Morgens (6–10 Uhr)', icon: '🌅' },
  { id: 'midday', label: 'Mittags (10–14 Uhr)', icon: '☀️' },
  { id: 'afternoon', label: 'Nachmittags (14–18 Uhr)', icon: '🌤️' },
  { id: 'evening', label: 'Abends (18–22 Uhr)', icon: '🌙' },
];
const GOAL_CATEGORIES = [
  { id: 'STRENGTH', label: 'Kraft aufbauen', icon: '💪' },
  { id: 'BODY_COMP', label: 'Körperkomposition', icon: '⚖️' },
  { id: 'ENDURANCE', label: 'Ausdauer', icon: '🏃' },
  { id: 'CONSISTENCY', label: 'Regelmäßigkeit', icon: '🔥' },
  { id: 'CUSTOM', label: 'Sonstiges', icon: '🎯' },
];

const CoachingIntake: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const relationshipId = searchParams.get('relationship');
  const productId = searchParams.get('product');

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [existingIntake, setExistingIntake] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [trainingHistory, setTrainingHistory] = useState('');
  const [injuries, setInjuries] = useState('');
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [preferredTimes, setPreferredTimes] = useState<string[]>([]);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [exerciseLikes, setExerciseLikes] = useState('');
  const [exerciseDislikes, setExerciseDislikes] = useState('');
  const [goalsText, setGoalsText] = useState('');
  const [goalCategories, setGoalCategories] = useState<string[]>([]);
  const [timeframeWeeks, setTimeframeWeeks] = useState(12);
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    if (relationshipId) {
      checkCustomFormRedirect();
      checkExisting();
    } else {
      setLoading(false);
    }
  }, [relationshipId]);

  // If the product has a custom intake form, redirect to the dynamic form page
  const checkCustomFormRedirect = async () => {
    if (!productId) return;
    try {
      const { data: product } = await supabase
        .from('products')
        .select('intake_form_id, intake_form_enabled')
        .eq('id', productId)
        .single();
      if (product?.intake_form_enabled && product?.intake_form_id) {
        navigate(`/intake-form-fill?form=${product.intake_form_id}&relationship=${relationshipId || ''}&product=${productId}`, { replace: true });
      }
    } catch (e) {
      // Fall through to legacy form
    }
  };

  const checkExisting = async () => {
    if (!relationshipId) return;
    setLoading(true);
    try {
      const existing = await getCoachingIntake(relationshipId);
      if (existing) {
        setExistingIntake(existing);
        // Pre-fill form
        setExperienceLevel(existing.experience_level || '');
        setTrainingHistory(existing.training_history || '');
        setInjuries(existing.injuries || '');
        setAvailableDays(existing.available_days || []);
        setPreferredTimes(existing.preferred_times || []);
        setSessionsPerWeek(existing.sessions_per_week || 3);
        setExerciseLikes(existing.exercise_preferences?.likes?.join(', ') || '');
        setExerciseDislikes(existing.exercise_preferences?.dislikes?.join(', ') || '');
        setGoalsText(existing.goals_text || '');
        setGoalCategories(existing.goal_categories || []);
        setTimeframeWeeks(existing.timeframe_weeks || 12);
        setAdditionalNotes(existing.additional_notes || '');
      }
    } catch (e) {
      console.error('Error checking existing intake:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (idx: number) => {
    setAvailableDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx]);
  };

  const toggleTime = (id: string) => {
    setPreferredTimes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  const toggleGoalCategory = (id: string) => {
    setGoalCategories(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!user || !relationshipId) return;
    setSaving(true);
    try {
      const payload = {
        athlete_id: user.id,
        coaching_relationship_id: relationshipId,
        product_id: productId || undefined,
        experience_level: experienceLevel || undefined,
        training_history: trainingHistory || undefined,
        injuries: injuries || undefined,
        available_days: availableDays.length > 0 ? availableDays : undefined,
        preferred_times: preferredTimes.length > 0 ? preferredTimes : undefined,
        sessions_per_week: sessionsPerWeek,
        exercise_preferences: {
          likes: exerciseLikes ? exerciseLikes.split(',').map(s => s.trim()).filter(Boolean) : [],
          dislikes: exerciseDislikes ? exerciseDislikes.split(',').map(s => s.trim()).filter(Boolean) : [],
        },
        goals_text: goalsText || undefined,
        goal_categories: goalCategories.length > 0 ? goalCategories : undefined,
        timeframe_weeks: timeframeWeeks,
        additional_notes: additionalNotes || undefined,
        status: 'SUBMITTED' as const,
        submitted_at: new Date().toISOString(),
      };

      if (existingIntake) {
        await updateCoachingIntake(existingIntake.id, {
          ...payload,
          athlete_id: undefined,
          coaching_relationship_id: undefined,
        });
      } else {
        await createCoachingIntake(payload);
      }

      setStep(5); // Success step
    } catch (e) {
      console.error('Error saving intake:', e);
      alert('Fehler beim Speichern. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#00FF00]" size={32} />
      </div>
    );
  }

  if (!relationshipId) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <AlertTriangle size={48} className="mx-auto text-yellow-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Kein Coaching gefunden</h2>
        <p className="text-zinc-400 mb-4">Bitte öffne diesen Link aus deiner Kaufbestätigung.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-[#00FF00] text-black rounded-xl font-bold">
          Zum Dashboard
        </button>
      </div>
    );
  }

  // Success step
  if (step === 5) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-in fade-in">
        <div className="w-20 h-20 bg-[#00FF00]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={40} className="text-[#00FF00]" />
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-2">Fragebogen abgeschickt!</h2>
        <p className="text-zinc-400 mb-6">Dein Coach wird sich auf Basis deiner Angaben bei dir melden und deinen individuellen Plan erstellen.</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-[#00FF00] text-black rounded-xl font-bold">
          Zum Dashboard
        </button>
      </div>
    );
  }

  const steps = [
    { title: 'Erfahrung', icon: <Dumbbell size={18} /> },
    { title: 'Zeitplan', icon: <Calendar size={18} /> },
    { title: 'Verletzungen', icon: <Heart size={18} /> },
    { title: 'Ziele', icon: <Target size={18} /> },
    { title: 'Sonstiges', icon: <MessageCircle size={18} /> },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="text-center">
        <ClipboardList size={32} className="mx-auto text-[#00FF00] mb-2" />
        <h1 className="text-2xl font-extrabold text-white">Coaching Fragebogen</h1>
        <p className="text-zinc-400 text-sm mt-1">Hilf deinem Coach, den perfekten Plan für dich zu erstellen.</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full h-1 rounded-full ${i <= step ? 'bg-[#00FF00]' : 'bg-zinc-800'}`} />
            <span className={`text-[10px] ${i === step ? 'text-[#00FF00] font-bold' : 'text-zinc-600'}`}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6 min-h-[320px]">
        {/* Step 0: Experience */}
        {step === 0 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-white font-bold text-lg">Wie erfahren bist du?</h3>
            <div className="space-y-2">
              {[
                { id: 'BEGINNER', label: 'Anfänger', desc: '0–1 Jahr Trainingserfahrung' },
                { id: 'INTERMEDIATE', label: 'Fortgeschritten', desc: '1–3 Jahre Trainingserfahrung' },
                { id: 'ADVANCED', label: 'Erfahren', desc: '3+ Jahre Trainingserfahrung' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setExperienceLevel(opt.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    experienceLevel === opt.id
                      ? 'border-[#00FF00] bg-[#00FF00]/10'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <p className="text-white font-bold text-sm">{opt.label}</p>
                  <p className="text-zinc-500 text-xs">{opt.desc}</p>
                </button>
              ))}
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Trainingshistorie (optional)</label>
              <textarea
                value={trainingHistory}
                onChange={e => setTrainingHistory(e.target.value)}
                placeholder="Was hast du bisher trainiert? Welche Programme/Sportarten?"
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:border-[#00FF00] outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 1: Schedule */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-white font-bold text-lg">Dein Zeitplan</h3>
            <div>
              <label className="text-zinc-400 text-sm block mb-2">Verfügbare Trainingstage</label>
              <div className="flex gap-2">
                {DAYS.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                      availableDays.includes(i)
                        ? 'bg-[#00FF00] text-black'
                        : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-2">Bevorzugte Trainingszeiten</label>
              <div className="grid grid-cols-2 gap-2">
                {TIMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => toggleTime(t.id)}
                    className={`p-3 rounded-xl text-left text-sm border transition-all ${
                      preferredTimes.includes(t.id)
                        ? 'border-[#00FF00] bg-[#00FF00]/10'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span className="mr-1">{t.icon}</span>
                    <span className="text-white text-xs">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-2">Sessions pro Woche: <span className="text-[#00FF00] font-bold">{sessionsPerWeek}</span></label>
              <input
                type="range"
                min={1}
                max={7}
                value={sessionsPerWeek}
                onChange={e => setSessionsPerWeek(Number(e.target.value))}
                className="w-full accent-[#00FF00]"
              />
              <div className="flex justify-between text-xs text-zinc-600">
                <span>1</span><span>7</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Injuries & Preferences */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-white font-bold text-lg">Verletzungen & Vorlieben</h3>
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Aktuelle Verletzungen / Einschränkungen</label>
              <textarea
                value={injuries}
                onChange={e => setInjuries(e.target.value)}
                placeholder="z.B. Knieschmerzen links, Schulterprobleme, Bandscheibenvorfall..."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:border-[#00FF00] outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Lieblingsübungen (kommagetrennt)</label>
              <input
                type="text"
                value={exerciseLikes}
                onChange={e => setExerciseLikes(e.target.value)}
                placeholder="z.B. Kniebeugen, Bankdrücken, Klimmzüge"
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:border-[#00FF00] outline-none"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Übungen die du vermeiden möchtest (kommagetrennt)</label>
              <input
                type="text"
                value={exerciseDislikes}
                onChange={e => setExerciseDislikes(e.target.value)}
                placeholder="z.B. Beinpresse, Nackendrücken"
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:border-[#00FF00] outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-white font-bold text-lg">Deine Ziele</h3>
            <div>
              <label className="text-zinc-400 text-sm block mb-2">Was möchtest du erreichen?</label>
              <div className="grid grid-cols-2 gap-2">
                {GOAL_CATEGORIES.map(g => (
                  <button
                    key={g.id}
                    onClick={() => toggleGoalCategory(g.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      goalCategories.includes(g.id)
                        ? 'border-[#00FF00] bg-[#00FF00]/10'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-lg">{g.icon}</span>
                    <p className="text-white text-xs font-bold mt-1">{g.label}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Beschreibe deine Ziele genauer</label>
              <textarea
                value={goalsText}
                onChange={e => setGoalsText(e.target.value)}
                placeholder="z.B. 100kg Kniebeugen, 10kg abnehmen, Marathon unter 4h..."
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:border-[#00FF00] outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-zinc-400 text-sm block mb-2">Zeitrahmen: <span className="text-[#00FF00] font-bold">{timeframeWeeks} Wochen</span></label>
              <input
                type="range"
                min={4}
                max={52}
                step={4}
                value={timeframeWeeks}
                onChange={e => setTimeframeWeeks(Number(e.target.value))}
                className="w-full accent-[#00FF00]"
              />
              <div className="flex justify-between text-xs text-zinc-600">
                <span>4 Wo.</span><span>52 Wo.</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Additional */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in">
            <h3 className="text-white font-bold text-lg">Noch etwas?</h3>
            <div>
              <label className="text-zinc-400 text-sm block mb-1">Zusätzliche Hinweise für deinen Coach</label>
              <textarea
                value={additionalNotes}
                onChange={e => setAdditionalNotes(e.target.value)}
                placeholder="Besondere Wünsche, Ernährungshinweise, Zeitliche Einschränkungen, Equipment-Verfügbarkeit..."
                rows={5}
                className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:border-[#00FF00] outline-none resize-none"
              />
            </div>

            {/* Summary */}
            <div className="bg-zinc-900 rounded-xl p-4 space-y-2">
              <h4 className="text-white font-bold text-sm">Zusammenfassung</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-zinc-500">Erfahrung:</span> <span className="text-white">{experienceLevel || '–'}</span></div>
                <div><span className="text-zinc-500">Sessions/Wo:</span> <span className="text-white">{sessionsPerWeek}</span></div>
                <div><span className="text-zinc-500">Tage:</span> <span className="text-white">{availableDays.map(d => DAYS[d]).join(', ') || '–'}</span></div>
                <div><span className="text-zinc-500">Zeitrahmen:</span> <span className="text-white">{timeframeWeeks} Wochen</span></div>
                <div><span className="text-zinc-500">Ziele:</span> <span className="text-white">{goalCategories.length > 0 ? goalCategories.join(', ') : '–'}</span></div>
                <div><span className="text-zinc-500">Verletzungen:</span> <span className="text-white">{injuries ? 'Ja' : 'Keine'}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-4 py-3 bg-zinc-800 text-white rounded-xl font-bold flex items-center gap-1"
          >
            <ChevronLeft size={16} /> Zurück
          </button>
        )}
        <button
          onClick={() => {
            if (step < 4) setStep(step + 1);
            else handleSubmit();
          }}
          disabled={saving}
          className="flex-1 px-4 py-3 bg-[#00FF00] text-black rounded-xl font-bold flex items-center justify-center gap-1 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : step < 4 ? (
            <>Weiter <ChevronRight size={16} /></>
          ) : (
            <>Absenden <Check size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
};

export default CoachingIntake;
