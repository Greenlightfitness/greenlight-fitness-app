import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getWorkoutHistory, getWorkoutFeedback, createWorkoutFeedback } from '../services/supabase';
import { Dumbbell, MessageSquare, Star, Send, Loader2, Calendar, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface WorkoutReviewProps {
  athleteId: string;
  athleteName?: string;
}

interface WorkoutLog {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: { reps: string; weight: string; completedReps?: string; completedWeight?: string }[];
  workout_date: string;
  total_volume?: number;
  created_at: string;
}

interface Feedback {
  id: string;
  comment: string;
  rating: number | null;
  created_at: string;
}

const WorkoutReview: React.FC<WorkoutReviewProps> = ({ athleteId, athleteName }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Feedback state per log
  const [feedbackMap, setFeedbackMap] = useState<Record<string, Feedback[]>>({});
  const [feedbackInput, setFeedbackInput] = useState<Record<string, { comment: string; rating: number }>>({});
  const [savingFeedback, setSavingFeedback] = useState<string | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (athleteId) loadLogs();
  }, [athleteId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { logs: data } = await getWorkoutHistory(athleteId, { limit: 30 });
      setLogs(data);
    } catch (e) {
      console.error('Error loading workout logs:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedbackForLog = async (logId: string) => {
    if (feedbackMap[logId] || loadingFeedback.has(logId)) return;
    setLoadingFeedback(prev => new Set([...prev, logId]));
    try {
      const data = await getWorkoutFeedback(logId);
      setFeedbackMap(prev => ({ ...prev, [logId]: data }));
    } catch (e) {
      console.error('Error loading feedback:', e);
    } finally {
      setLoadingFeedback(prev => {
        const next = new Set(prev);
        next.delete(logId);
        return next;
      });
    }
  };

  const handleToggleLog = (logId: string) => {
    if (expandedLogId === logId) {
      setExpandedLogId(null);
    } else {
      setExpandedLogId(logId);
      loadFeedbackForLog(logId);
    }
  };

  const handleSendFeedback = async (logId: string) => {
    if (!user) return;
    const input = feedbackInput[logId];
    if (!input?.comment?.trim()) return;

    setSavingFeedback(logId);
    try {
      await createWorkoutFeedback({
        workout_log_id: logId,
        coach_id: user.id,
        athlete_id: athleteId,
        comment: input.comment.trim(),
        rating: input.rating || undefined,
      });

      // Refresh feedback for this log
      const data = await getWorkoutFeedback(logId);
      setFeedbackMap(prev => ({ ...prev, [logId]: data }));
      setFeedbackInput(prev => ({ ...prev, [logId]: { comment: '', rating: 0 } }));
    } catch (e) {
      console.error('Error sending feedback:', e);
    } finally {
      setSavingFeedback(null);
    }
  };

  // Group logs by date
  const groupedLogs: [string, WorkoutLog[]][] = [];
  const dateMap = new Map<string, WorkoutLog[]>();
  logs.forEach(log => {
    const date = log.workout_date || log.created_at?.split('T')[0] || '';
    if (!dateMap.has(date)) dateMap.set(date, []);
    dateMap.get(date)!.push(log);
  });
  dateMap.forEach((v, k) => groupedLogs.push([k, v]));
  groupedLogs.sort((a, b) => b[0].localeCompare(a[0]));

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (dateStr === today) return 'Heute';
      if (dateStr === yesterday) return 'Gestern';
      return d.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-zinc-500" size={18} />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-6">
        <Dumbbell size={24} className="mx-auto text-zinc-700 mb-2" />
        <p className="text-zinc-500 text-xs">
          {athleteName ? `${athleteName} hat noch keine Workouts abgeschlossen.` : 'Noch keine Workout-Logs vorhanden.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-white font-bold text-sm flex items-center gap-2">
        <Dumbbell size={16} className="text-[#00FF00]" />
        Workout Review {athleteName && <span className="text-zinc-500 font-normal">– {athleteName}</span>}
      </h4>

      {groupedLogs.map(([date, dayLogs]) => (
        <div key={date}>
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={12} className="text-zinc-500" />
            <span className="text-xs font-bold text-zinc-400">{formatDate(date)}</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          <div className="space-y-1.5">
            {dayLogs.map(log => {
              const isExpanded = expandedLogId === log.id;
              const totalVol = log.total_volume || (log.sets || []).reduce(
                (s, set) => s + (parseFloat(set.completedWeight || set.weight || '0') * parseInt(set.completedReps || set.reps || '0')), 0
              );
              const maxWeight = Math.max(...(log.sets || []).map(s => parseFloat(s.completedWeight || s.weight || '0')), 0);
              const feedback = feedbackMap[log.id] || [];
              const input = feedbackInput[log.id] || { comment: '', rating: 0 };

              return (
                <div key={log.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => handleToggleLog(log.id)}
                    className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                      <Dumbbell size={12} className="text-[#00FF00]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{log.exercise_name || 'Übung'}</p>
                      <p className="text-[11px] text-zinc-500">
                        {log.sets?.length || 0} Sätze · Max {maxWeight}kg · {Math.round(totalVol)}kg Vol.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {feedback.length > 0 && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <MessageSquare size={10} /> {feedback.length}
                        </span>
                      )}
                      {isExpanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-zinc-800/50 pt-2 space-y-3 animate-in fade-in">
                      {/* Sets Table */}
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
                            const w = parseFloat(set.completedWeight || set.weight || '0');
                            const r = parseInt(set.completedReps || set.reps || '0');
                            return (
                              <tr key={idx} className="text-white border-t border-zinc-800/30">
                                <td className="py-1 text-zinc-400">{idx + 1}</td>
                                <td className="py-1 text-right">{w > 0 ? `${w}kg` : '-'}</td>
                                <td className="py-1 text-right">{r > 0 ? r : '-'}</td>
                                <td className="py-1 text-right text-zinc-400">{w * r > 0 ? `${w * r}kg` : '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Existing Feedback */}
                      {feedback.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Feedback</p>
                          {feedback.map(fb => (
                            <div key={fb.id} className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-2">
                              <div className="flex items-center gap-2 mb-1">
                                <MessageSquare size={10} className="text-blue-400" />
                                {fb.rating && (
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => (
                                      <Star key={s} size={10} className={s <= fb.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'} />
                                    ))}
                                  </div>
                                )}
                                <span className="text-[10px] text-zinc-500 ml-auto">
                                  {new Date(fb.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-zinc-300 text-xs">{fb.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Feedback Form */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Kommentar hinzufügen</p>
                        {/* Rating Stars */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <button
                              key={s}
                              onClick={() => setFeedbackInput(prev => ({
                                ...prev,
                                [log.id]: { ...input, rating: input.rating === s ? 0 : s }
                              }))}
                              className="p-0.5"
                            >
                              <Star size={16} className={s <= input.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600 hover:text-yellow-400'} />
                            </button>
                          ))}
                          <span className="text-[10px] text-zinc-500 ml-1">
                            {input.rating > 0 ? `${input.rating}/5` : 'Optional'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Kommentar schreiben..."
                            value={input.comment}
                            onChange={e => setFeedbackInput(prev => ({
                              ...prev,
                              [log.id]: { ...input, comment: e.target.value }
                            }))}
                            onKeyDown={e => e.key === 'Enter' && handleSendFeedback(log.id)}
                            className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs focus:border-[#00FF00] outline-none"
                          />
                          <button
                            onClick={() => handleSendFeedback(log.id)}
                            disabled={!input.comment?.trim() || savingFeedback === log.id}
                            className="px-3 py-1.5 bg-[#00FF00] text-black rounded-lg font-bold text-xs disabled:opacity-50 flex items-center gap-1"
                          >
                            {savingFeedback === log.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkoutReview;
