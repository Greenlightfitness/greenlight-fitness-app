import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getWorkoutHistory, getExercises } from '../services/supabase';
import ExerciseProgressChart from '../components/ExerciseProgressChart';
import { History, Search, Filter, ChevronDown, ChevronUp, Dumbbell, Clock, TrendingUp, Calendar, Loader2, X, BarChart3 } from 'lucide-react';

interface WorkoutLog {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: { reps: string; weight: string }[];
  duration_seconds?: number;
  workout_date?: string;
  created_at: string;
  total_volume?: number;
}

const WorkoutHistory: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 30;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Exercise list for filter dropdown
  const [exercises, setExercises] = useState<{ id: string; name: string; category: string }[]>([]);

  // Progress chart
  const [chartExercise, setChartExercise] = useState<{ id: string; name: string } | null>(null);

  // Expanded log detail
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadExercises();
      loadLogs(true);
    }
  }, [user]);

  const loadExercises = async () => {
    try {
      const data = await getExercises();
      setExercises(data.map((e: any) => ({ id: e.id, name: e.name, category: e.category || '' })));
    } catch (e) {
      console.error('Error loading exercises:', e);
    }
  };

  const loadLogs = async (reset = false) => {
    if (!user) return;
    if (reset) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const newOffset = reset ? 0 : offset;
      const { logs: newLogs, total: newTotal } = await getWorkoutHistory(user.id, {
        exerciseId: selectedExerciseId || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        limit: LIMIT,
        offset: newOffset,
      });

      if (reset) {
        setLogs(newLogs);
      } else {
        setLogs(prev => [...prev, ...newLogs]);
      }
      setTotal(newTotal);
      setOffset(newOffset + LIMIT);
    } catch (error) {
      console.error('Error loading workout history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Re-fetch on filter change
  useEffect(() => {
    if (user) loadLogs(true);
  }, [selectedExerciseId, dateRange]);

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const filtered = searchQuery
      ? logs.filter(l => l.exercise_name?.toLowerCase().includes(searchQuery.toLowerCase()))
      : logs;

    const groups: Record<string, WorkoutLog[]> = {};
    filtered.forEach(log => {
      const date = log.workout_date || log.created_at?.split('T')[0] || 'Unbekannt';
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });

    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [logs, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const totalSessions = new Set(logs.map(l => l.workout_date || l.created_at?.split('T')[0])).size;
    const totalVolume = logs.reduce((sum, l) => {
      if (l.total_volume) return sum + l.total_volume;
      return sum + (l.sets || []).reduce((s, set) => s + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0);
    }, 0);
    const totalSets = logs.reduce((sum, l) => sum + (l.sets?.length || 0), 0);
    return { totalSessions, totalVolume, totalSets };
  }, [logs]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (dateStr === today.toISOString().split('T')[0]) return 'Heute';
      if (dateStr === yesterday.toISOString().split('T')[0]) return 'Gestern';

      return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}min ${s}s` : `${s}s`;
  };

  const clearFilters = () => {
    setSelectedExerciseId('');
    setDateRange({ start: '', end: '' });
    setSearchQuery('');
  };

  const hasActiveFilters = selectedExerciseId || dateRange.start || dateRange.end || searchQuery;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <History className="text-[#00FF00]" size={28} />
          Trainingshistorie
        </h1>
        <p className="text-zinc-500 text-sm mt-1">Alle vergangenen Workouts auf einen Blick.</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
          <p className="text-[#00FF00] text-lg font-bold">{stats.totalSessions}</p>
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Sessions</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
          <p className="text-white text-lg font-bold">
            {stats.totalVolume >= 1000 ? `${(stats.totalVolume / 1000).toFixed(1)}t` : `${Math.round(stats.totalVolume)}kg`}
          </p>
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Volumen</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
          <p className="text-white text-lg font-bold">{stats.totalSets}</p>
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Sätze</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Übung suchen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:border-[#00FF00] outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all flex items-center gap-1.5 ${
              showFilters || hasActiveFilters
                ? 'bg-[#00FF00] text-black border-[#00FF00]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
            }`}
          >
            <Filter size={14} />
            Filter
          </button>
        </div>

        {showFilters && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Übung</label>
              <select
                value={selectedExerciseId}
                onChange={e => setSelectedExerciseId(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00FF00]"
              >
                <option value="">Alle Übungen</option>
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Von</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00FF00]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">Bis</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00FF00]"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                <X size={12} /> Filter zurücksetzen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Exercise Progress Chart (when exercise filter is active) */}
      {selectedExerciseId && user && (
        <div className="mb-6">
          <ExerciseProgressChart
            athleteId={user.id}
            exerciseId={selectedExerciseId}
            exerciseName={exercises.find(e => e.id === selectedExerciseId)?.name || ''}
            days={90}
          />
        </div>
      )}

      {/* Chart trigger for individual exercises */}
      {chartExercise && user && (
        <div className="mb-6 relative">
          <button
            onClick={() => setChartExercise(null)}
            className="absolute top-2 right-2 z-10 text-zinc-500 hover:text-white"
          >
            <X size={16} />
          </button>
          <ExerciseProgressChart
            athleteId={user.id}
            exerciseId={chartExercise.id}
            exerciseName={chartExercise.name}
            days={90}
          />
        </div>
      )}

      {/* Workout Log List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-[#00FF00]" size={28} />
        </div>
      ) : groupedLogs.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell size={40} className="mx-auto text-zinc-700 mb-4" />
          <h3 className="text-white font-bold text-lg mb-1">Noch keine Trainings</h3>
          <p className="text-zinc-500 text-sm">Sobald du dein erstes Workout abschließt, erscheint es hier.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedLogs.map(([date, dayLogs]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex items-center gap-3 mb-3">
                <Calendar size={14} className="text-[#00FF00]" />
                <h3 className="text-white font-bold text-sm">{formatDate(date)}</h3>
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-zinc-500 text-xs">{dayLogs.length} Übungen</span>
              </div>

              {/* Logs for this day */}
              <div className="space-y-2">
                {dayLogs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  const totalVolume = (log.sets || []).reduce(
                    (sum, s) => sum + (parseFloat(s.weight) || 0) * (parseInt(s.reps) || 0), 0
                  );
                  const maxWeight = Math.max(...(log.sets || []).map(s => parseFloat(s.weight) || 0), 0);

                  return (
                    <div
                      key={log.id}
                      className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all"
                    >
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="w-full text-left px-4 py-3 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                          <Dumbbell size={14} className="text-[#00FF00]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{log.exercise_name || 'Unbekannt'}</p>
                          <p className="text-zinc-500 text-xs">
                            {log.sets?.length || 0} Sätze · {maxWeight > 0 ? `Max ${maxWeight}kg` : ''} · {Math.round(totalVolume)}kg Vol.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setChartExercise(
                                chartExercise?.id === log.exercise_id
                                  ? null
                                  : { id: log.exercise_id, name: log.exercise_name }
                              );
                            }}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-[#00FF00] transition-all"
                            title="Fortschrittsgraph anzeigen"
                          >
                            <TrendingUp size={14} />
                          </button>
                          {isExpanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-3 border-t border-zinc-800/50 pt-2 animate-in fade-in">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-zinc-500">
                                <th className="text-left py-1 font-medium">Satz</th>
                                <th className="text-right py-1 font-medium">Gewicht</th>
                                <th className="text-right py-1 font-medium">Wdh.</th>
                                <th className="text-right py-1 font-medium">Volumen</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(log.sets || []).map((set, idx) => {
                                const w = parseFloat(set.weight) || 0;
                                const r = parseInt(set.reps) || 0;
                                return (
                                  <tr key={idx} className="text-white border-t border-zinc-800/30">
                                    <td className="py-1.5 text-zinc-400">{idx + 1}</td>
                                    <td className="py-1.5 text-right">{w > 0 ? `${w} kg` : '-'}</td>
                                    <td className="py-1.5 text-right">{r > 0 ? r : '-'}</td>
                                    <td className="py-1.5 text-right text-zinc-400">{w * r > 0 ? `${w * r} kg` : '-'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          {log.duration_seconds && (
                            <div className="mt-2 flex items-center gap-1 text-zinc-500 text-xs">
                              <Clock size={12} />
                              <span>{formatDuration(log.duration_seconds)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Load More */}
          {logs.length < total && (
            <button
              onClick={() => loadLogs(false)}
              disabled={loadingMore}
              className="w-full py-3 text-center text-sm text-zinc-400 hover:text-[#00FF00] bg-zinc-900/50 border border-zinc-800 rounded-xl transition-all disabled:opacity-50"
            >
              {loadingMore ? (
                <Loader2 className="animate-spin mx-auto" size={16} />
              ) : (
                `Mehr laden (${logs.length} von ${total})`
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkoutHistory;
