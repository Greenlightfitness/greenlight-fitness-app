import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createCheckIn, getCheckIns, getAthleteCoachRelationship, uploadFile, getPublicUrl } from '../services/supabase';
import { ClipboardCheck, Camera, Scale, Moon, Battery, Brain, Zap, Send, Loader2, Check, ChevronDown, ChevronUp, MessageSquare, X } from 'lucide-react';

interface CheckInFormProps {
  onComplete?: () => void;
  compact?: boolean;
}

const CheckInForm: React.FC<CheckInFormProps> = ({ onComplete, compact = false }) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [coachId, setCoachId] = useState<string | null>(null);

  // Form fields
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [nutritionRating, setNutritionRating] = useState(0);
  const [sleepRating, setSleepRating] = useState(0);
  const [stressRating, setStressRating] = useState(0);
  const [energyRating, setEnergyRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  // Check if already submitted this week
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<any>(null);

  useEffect(() => {
    if (user) {
      checkExisting();
      loadCoach();
    }
  }, [user]);

  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  const checkExisting = async () => {
    if (!user) return;
    try {
      const checkIns = await getCheckIns(user.id);
      const weekStart = getWeekStart();
      const existing = checkIns.find((ci: any) => ci.week_start === weekStart);
      if (existing) {
        setAlreadySubmitted(true);
        setLastCheckIn(existing);
      }
    } catch (e) {
      console.error('Error checking existing check-ins:', e);
    }
  };

  const loadCoach = async () => {
    if (!user) return;
    try {
      const rel = await getAthleteCoachRelationship(user.id);
      if (rel) setCoachId(rel.coach_id);
    } catch (e) {
      // No coach assigned
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 4) {
      alert('Maximal 4 Fotos erlaubt.');
      return;
    }
    setPhotos(prev => [...prev, ...files]);
    // Create preview URLs
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setPhotoPreviewUrls(prev => [...prev, url]);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSaving(true);

    try {
      // Upload photos if any
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const path = `check-ins/${user.id}/${Date.now()}-${photo.name}`;
        await uploadFile('check-in-photos', path, photo);
        const url = getPublicUrl('check-in-photos', path);
        photoUrls.push(url);
      }

      await createCheckIn({
        athlete_id: user.id,
        coach_id: coachId || undefined,
        week_start: getWeekStart(),
        weight: weight ? parseFloat(weight) : undefined,
        body_fat: bodyFat ? parseFloat(bodyFat) : undefined,
        nutrition_rating: nutritionRating || undefined,
        sleep_rating: sleepRating || undefined,
        stress_rating: stressRating || undefined,
        energy_rating: energyRating || undefined,
        notes: notes.trim() || undefined,
        photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
      });

      setSubmitted(true);
      setAlreadySubmitted(true);
      onComplete?.();

      // Clean up preview URLs
      photoPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    } catch (e) {
      console.error('Error submitting check-in:', e);
      alert('Fehler beim Speichern des Check-Ins.');
    } finally {
      setSaving(false);
    }
  };

  // Rating selector component
  const RatingSelector: React.FC<{
    value: number;
    onChange: (v: number) => void;
    icon: React.ReactNode;
    label: string;
    lowLabel?: string;
    highLabel?: string;
  }> = ({ value, onChange, icon, label, lowLabel = 'Schlecht', highLabel = 'Super' }) => (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-xs text-zinc-400 font-medium">{label}</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            onClick={() => onChange(value === v ? 0 : v)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              v <= value
                ? 'bg-[#00FF00] text-black'
                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-[9px] text-zinc-600">{lowLabel}</span>
        <span className="text-[9px] text-zinc-600">{highLabel}</span>
      </div>
    </div>
  );

  // Already submitted state
  if (alreadySubmitted && !expanded) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00FF00]/10 flex items-center justify-center">
              <ClipboardCheck size={20} className="text-[#00FF00]" />
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-sm">Wöchentlicher Check-In</p>
              <p className="text-[#00FF00] text-xs flex items-center gap-1">
                <Check size={12} />
                {submitted ? 'Gerade eingereicht!' : 'Bereits eingereicht'}
                {lastCheckIn?.status === 'REVIEWED' && (
                  <span className="text-blue-400 ml-1 flex items-center gap-0.5">
                    <MessageSquare size={10} /> Coach hat geantwortet
                  </span>
                )}
              </p>
            </div>
          </div>
          {expanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
        </button>

        {/* Show coach response if reviewed */}
        {lastCheckIn?.coach_response && (
          <div className="px-4 pb-3 border-t border-zinc-800">
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 mt-2">
              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Coach Feedback</p>
              <p className="text-zinc-300 text-sm">{lastCheckIn.coach_response}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <ClipboardCheck size={20} className="text-orange-400" />
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-sm">Wöchentlicher Check-In</p>
            <p className="text-orange-400 text-xs">Noch nicht eingereicht</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
      </button>

      {/* Form */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-zinc-800 pt-3 animate-in fade-in slide-in-from-top-2">
          {/* Body Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Gewicht (kg)</label>
              <input
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="80.0"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm text-center focus:border-[#00FF00] outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Körperfett (%)</label>
              <input
                type="text"
                inputMode="decimal"
                value={bodyFat}
                onChange={e => setBodyFat(e.target.value)}
                placeholder="15.0"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm text-center focus:border-[#00FF00] outline-none"
              />
            </div>
          </div>

          {/* Ratings */}
          <div className="space-y-3">
            <RatingSelector
              value={nutritionRating}
              onChange={setNutritionRating}
              icon={<Scale size={14} className="text-green-400" />}
              label="Ernährung"
              lowLabel="Schlecht"
              highLabel="Perfekt"
            />
            <RatingSelector
              value={sleepRating}
              onChange={setSleepRating}
              icon={<Moon size={14} className="text-blue-400" />}
              label="Schlaf"
            />
            <RatingSelector
              value={stressRating}
              onChange={setStressRating}
              icon={<Brain size={14} className="text-red-400" />}
              label="Stress"
              lowLabel="Viel Stress"
              highLabel="Kein Stress"
            />
            <RatingSelector
              value={energyRating}
              onChange={setEnergyRating}
              icon={<Zap size={14} className="text-yellow-400" />}
              label="Energie"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Notizen / Fragen an Coach</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Wie war deine Woche? Gibt es etwas, das dein Coach wissen sollte?"
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2.5 text-sm focus:border-[#00FF00] outline-none resize-none"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Fortschrittsfotos (optional, max. 4)</label>
            <div className="flex gap-2 flex-wrap">
              {photoPreviewUrls.map((url, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-zinc-700">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X size={8} className="text-white" />
                  </button>
                </div>
              ))}
              {photos.length < 4 && (
                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center cursor-pointer hover:border-[#00FF00] transition-colors">
                  <Camera size={18} className="text-zinc-500" />
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" multiple />
                </label>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-3 bg-[#00FF00] text-black rounded-xl font-bold text-sm hover:bg-[#00FF00]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Send size={16} />
                Check-In einreichen
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CheckInForm;
