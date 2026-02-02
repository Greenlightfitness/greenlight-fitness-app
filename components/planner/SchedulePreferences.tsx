import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  Settings,
  Save,
  RotateCcw,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  getAthleteSchedulePreferences, 
  saveAthleteSchedulePreferences 
} from '../../services/supabase';

interface SchedulePreferencesProps {
  assignedPlanId: string;
  sessionsPerWeek: number;
  onSave?: (preferences: any) => void;
  readOnly?: boolean;
}

const DAYS = [
  { id: 0, name: 'Mo', fullName: 'Montag' },
  { id: 1, name: 'Di', fullName: 'Dienstag' },
  { id: 2, name: 'Mi', fullName: 'Mittwoch' },
  { id: 3, name: 'Do', fullName: 'Donnerstag' },
  { id: 4, name: 'Fr', fullName: 'Freitag' },
  { id: 5, name: 'Sa', fullName: 'Samstag' },
  { id: 6, name: 'So', fullName: 'Sonntag' },
];

const TIME_OPTIONS = [
  { id: 'morning', label: 'Morgens (6-12 Uhr)', icon: '🌅' },
  { id: 'afternoon', label: 'Nachmittags (12-18 Uhr)', icon: '☀️' },
  { id: 'evening', label: 'Abends (18-22 Uhr)', icon: '🌙' },
];

export const SchedulePreferences: React.FC<SchedulePreferencesProps> = ({
  assignedPlanId,
  sessionsPerWeek,
  onSave,
  readOnly = false,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableDays, setAvailableDays] = useState<number[]>([0, 2, 4]); // Default: Mo, Mi, Fr
  const [preferredTime, setPreferredTime] = useState<string>('morning');
  const [minRestDays, setMinRestDays] = useState(1);
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [assignedPlanId, user?.id]);

  const loadPreferences = async () => {
    if (!user?.id || !assignedPlanId) return;
    setLoading(true);
    try {
      const prefs = await getAthleteSchedulePreferences(user.id, assignedPlanId);
      if (prefs) {
        setAvailableDays(prefs.available_days || [0, 2, 4]);
        setPreferredTime(prefs.preferred_time_of_day || 'morning');
        setMinRestDays(prefs.min_rest_days || 1);
        setAutoSchedule(prefs.auto_schedule ?? true);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayId: number) => {
    if (readOnly) return;
    setHasChanges(true);
    setAvailableDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId].sort()
    );
  };

  const handleSave = async () => {
    if (!user?.id || !assignedPlanId) return;
    setSaving(true);
    try {
      const preferences = {
        athlete_id: user.id,
        assigned_plan_id: assignedPlanId,
        available_days: availableDays,
        preferred_time_of_day: preferredTime,
        max_sessions_per_week: sessionsPerWeek,
        min_rest_days: minRestDays,
        auto_schedule: autoSchedule,
      };
      await saveAthleteSchedulePreferences(preferences);
      setHasChanges(false);
      onSave?.(preferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const isValidSchedule = availableDays.length >= sessionsPerWeek;

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-[#00ff94] border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00ff94]/20 rounded-lg">
            <Settings size={20} className="text-[#00ff94]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Trainingstage festlegen</h2>
            <p className="text-sm text-gray-400">
              Wähle {sessionsPerWeek} Tage pro Woche für dein Training
            </p>
          </div>
        </div>
        {!readOnly && hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving || !isValidSchedule}
            className="flex items-center gap-2 px-4 py-2 bg-[#00ff94] text-black rounded-lg font-medium hover:bg-[#00ff94]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {saving ? 'Speichern...' : 'Speichern'}
          </button>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Day Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Verfügbare Trainingstage
          </label>
          <div className="flex gap-2">
            {DAYS.map(day => (
              <button
                key={day.id}
                onClick={() => toggleDay(day.id)}
                disabled={readOnly}
                className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                  availableDays.includes(day.id)
                    ? 'bg-[#00ff94] text-black'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                title={day.fullName}
              >
                {day.name}
              </button>
            ))}
          </div>
          
          {/* Validation Message */}
          {!isValidSchedule && (
            <div className="mt-2 flex items-center gap-2 text-amber-400 text-sm">
              <Info size={14} />
              Wähle mindestens {sessionsPerWeek} Tage für {sessionsPerWeek} Sessions pro Woche
            </div>
          )}
          
          {isValidSchedule && (
            <div className="mt-2 flex items-center gap-2 text-[#00ff94] text-sm">
              <CheckCircle size={14} />
              {availableDays.length} Tage ausgewählt für {sessionsPerWeek} Sessions
            </div>
          )}
        </div>

        {/* Preferred Time */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Bevorzugte Trainingszeit
          </label>
          <div className="grid grid-cols-3 gap-3">
            {TIME_OPTIONS.map(option => (
              <button
                key={option.id}
                onClick={() => {
                  if (!readOnly) {
                    setPreferredTime(option.id);
                    setHasChanges(true);
                  }
                }}
                disabled={readOnly}
                className={`p-3 rounded-lg border text-center transition-all ${
                  preferredTime === option.id
                    ? 'border-[#00ff94] bg-[#00ff94]/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className="text-2xl block mb-1">{option.icon}</span>
                <span className={`text-sm ${
                  preferredTime === option.id ? 'text-[#00ff94]' : 'text-gray-400'
                }`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Rest Days */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Mindest-Ruhetage zwischen Sessions
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={3}
              value={minRestDays}
              onChange={(e) => {
                if (!readOnly) {
                  setMinRestDays(parseInt(e.target.value));
                  setHasChanges(true);
                }
              }}
              disabled={readOnly}
              className="flex-1 accent-[#00ff94]"
            />
            <span className="bg-gray-800 px-4 py-2 rounded-lg text-white font-medium min-w-[80px] text-center">
              {minRestDays} {minRestDays === 1 ? 'Tag' : 'Tage'}
            </span>
          </div>
        </div>

        {/* Auto Schedule Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
          <div>
            <h3 className="font-medium text-white">Automatische Planung</h3>
            <p className="text-sm text-gray-400">
              System verteilt Sessions optimal auf deine verfügbaren Tage
            </p>
          </div>
          <button
            onClick={() => {
              if (!readOnly) {
                setAutoSchedule(!autoSchedule);
                setHasChanges(true);
              }
            }}
            disabled={readOnly}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              autoSchedule ? 'bg-[#00ff94]' : 'bg-gray-600'
            }`}
          >
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
              autoSchedule ? 'left-8' : 'left-1'
            }`} />
          </button>
        </div>

        {/* Preview */}
        <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Calendar size={14} />
            Vorschau deiner Trainingswoche
          </h3>
          <div className="flex gap-1">
            {DAYS.map(day => (
              <div
                key={day.id}
                className={`flex-1 p-2 rounded text-center text-xs ${
                  availableDays.includes(day.id)
                    ? 'bg-[#00ff94]/20 text-[#00ff94] border border-[#00ff94]/30'
                    : 'bg-gray-700/50 text-gray-500'
                }`}
              >
                <div className="font-medium">{day.name}</div>
                <div className="mt-1">
                  {availableDays.includes(day.id) ? '💪' : '😴'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePreferences;
