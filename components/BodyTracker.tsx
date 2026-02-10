import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBodyMeasurements, upsertBodyMeasurement } from '../services/supabase';
import { Scale, TrendingUp, TrendingDown, Minus, Plus, Check, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface BodyTrackerProps {
  compact?: boolean;
  onUpdate?: () => void;
}

interface Measurement {
  date: string;
  weight: number | null;
  body_fat: number | null;
  waist_circumference: number | null;
}

const BodyTracker: React.FC<BodyTrackerProps> = ({ compact = false, onUpdate }) => {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Quick entry form
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [waist, setWaist] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getBodyMeasurements(user.id, 90);
      setMeasurements(data.map((d: any) => ({
        date: d.date,
        weight: d.weight,
        body_fat: d.body_fat,
        waist_circumference: d.waist_circumference,
      })));
    } catch (e) {
      console.error('Error loading body measurements:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!weight && !bodyFat && !waist) return;

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await upsertBodyMeasurement({
        athlete_id: user.id,
        date: today,
        weight: weight ? parseFloat(weight) : null,
        body_fat: bodyFat ? parseFloat(bodyFat) : null,
        waist_circumference: waist ? parseFloat(waist) : null,
      });
      setWeight('');
      setBodyFat('');
      setWaist('');
      setShowForm(false);
      await loadData();
      onUpdate?.();
    } catch (e) {
      console.error('Error saving measurement:', e);
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const weightData = measurements.filter(m => m.weight).sort((a, b) => a.date.localeCompare(b.date));
    if (weightData.length === 0) return null;

    const current = weightData[weightData.length - 1].weight!;
    const previous = weightData.length > 1 ? weightData[weightData.length - 2].weight! : current;
    const first = weightData[0].weight!;
    const change = current - previous;
    const totalChange = current - first;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    return { current, previous, change, totalChange, trend, count: weightData.length };
  }, [measurements]);

  // Check if already logged today
  const todayLogged = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return measurements.some(m => m.date === today);
  }, [measurements]);

  // Mini chart data (last 30 weight entries)
  const chartData = useMemo(() => {
    return measurements
      .filter(m => m.weight)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map(m => m.weight!);
  }, [measurements]);

  // SVG mini chart
  const renderMiniChart = () => {
    if (chartData.length < 2) return null;
    const w = compact ? 120 : 200;
    const h = compact ? 40 : 50;
    const min = Math.min(...chartData) - 0.5;
    const max = Math.max(...chartData) + 0.5;
    const range = max - min || 1;

    const points = chartData.map((v, i) => {
      const x = (i / (chartData.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const areaPoints = [...points, `${w},${h}`, `0,${h}`].join(' ');

    return (
      <svg width={w} height={h} className="overflow-visible">
        <polygon points={areaPoints} fill="url(#bodyGrad)" opacity="0.15" />
        <polyline points={points.join(' ')} fill="none" stroke="#00FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={parseFloat(points[points.length - 1].split(',')[0])} cy={parseFloat(points[points.length - 1].split(',')[1])} r="3" fill="#00FF00" />
        <defs>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FF00" />
            <stop offset="100%" stopColor="#00FF00" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex items-center justify-center h-24">
        <Loader2 className="animate-spin text-zinc-500" size={18} />
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
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Scale size={20} className="text-blue-400" />
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-sm">Körperdaten</p>
            {stats ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-white font-mono text-xs">{stats.current.toFixed(1)} kg</span>
                <span className={`text-xs flex items-center gap-0.5 ${
                  stats.trend === 'down' ? 'text-green-400' : stats.trend === 'up' ? 'text-red-400' : 'text-zinc-500'
                }`}>
                  {stats.trend === 'up' && <TrendingUp size={10} />}
                  {stats.trend === 'down' && <TrendingDown size={10} />}
                  {stats.trend === 'stable' && <Minus size={10} />}
                  {stats.change !== 0 ? `${stats.change > 0 ? '+' : ''}${stats.change.toFixed(1)}` : '±0'}
                </span>
              </div>
            ) : (
              <p className="text-zinc-500 text-xs">Noch keine Daten</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {renderMiniChart()}
          {expanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-zinc-800 pt-3 animate-in fade-in slide-in-from-top-2">
          {/* Quick Entry */}
          {!todayLogged || showForm ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                {todayLogged ? 'Werte aktualisieren' : 'Heutige Werte eintragen'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Gewicht (kg)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    placeholder={stats?.current.toFixed(1) || '80.0'}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-2.5 py-2 text-sm text-center focus:border-[#00FF00] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Körperfett (%)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={bodyFat}
                    onChange={e => setBodyFat(e.target.value)}
                    placeholder="15.0"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-2.5 py-2 text-sm text-center focus:border-[#00FF00] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Bauchumfang (cm)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={waist}
                    onChange={e => setWaist(e.target.value)}
                    placeholder="85"
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-2.5 py-2 text-sm text-center focus:border-[#00FF00] outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || (!weight && !bodyFat && !waist)}
                className="w-full py-2 bg-[#00FF00] text-black rounded-xl font-bold text-sm hover:bg-[#00FF00]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Speichern
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-2 border border-dashed border-zinc-700 rounded-xl text-zinc-400 text-xs hover:border-[#00FF00] hover:text-[#00FF00] transition-colors flex items-center justify-center gap-1"
            >
              <Plus size={12} /> Werte aktualisieren
            </button>
          )}

          {/* Recent History */}
          {measurements.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Verlauf</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {measurements.slice(0, 10).map(m => (
                  <div key={m.date} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-zinc-800/50 text-xs">
                    <span className="text-zinc-400">
                      {new Date(m.date + 'T00:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <div className="flex items-center gap-3">
                      {m.weight && <span className="text-white font-mono">{m.weight} kg</span>}
                      {m.body_fat && <span className="text-blue-400 font-mono">{m.body_fat}%</span>}
                      {m.waist_circumference && <span className="text-orange-400 font-mono">{m.waist_circumference} cm</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Change Summary */}
          {stats && stats.count > 1 && (
            <div className="bg-zinc-800/50 rounded-xl p-3 flex items-center justify-between">
              <span className="text-zinc-400 text-xs">Gesamtveränderung ({stats.count} Einträge)</span>
              <span className={`font-bold text-sm ${stats.totalChange < 0 ? 'text-green-400' : stats.totalChange > 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                {stats.totalChange > 0 ? '+' : ''}{stats.totalChange.toFixed(1)} kg
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BodyTracker;
