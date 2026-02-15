import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  supabase, createAssignedPlan, updateAssignedPlan, getPlans,
  getWeeksByPlan, getSessionsByWeek
} from '../services/supabase';
import ExerciseSelector from './planner/ExerciseSelector';
import {
  Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp, Dumbbell,
  Calendar, Copy, FileText, X, Check, Layers, GripVertical,
  Pencil, ArrowLeft, Download, AlertTriangle
} from 'lucide-react';

interface AthletePlanEditorProps {
  athleteId: string;
  athleteName: string;
  coachingRelationshipId?: string;
  existingPlan?: any; // assigned_plan row
  onSave?: () => void;
  onClose?: () => void;
}

interface EditorWeek {
  id: string;
  order: number;
  focus: string;
  sessions: EditorSession[];
}

interface EditorSession {
  id: string;
  dayOfWeek: number;
  title: string;
  description: string;
  order: number;
  workoutData: any[];
}

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const genId = () => Math.random().toString(36).substr(2, 9);

const AthletePlanEditor: React.FC<AthletePlanEditorProps> = ({
  athleteId,
  athleteName,
  coachingRelationshipId,
  existingPlan,
  onSave,
  onClose,
}) => {
  const { user } = useAuth();

  // Plan metadata
  const [planName, setPlanName] = useState(existingPlan?.plan_name || `Plan für ${athleteName}`);
  const [planDesc, setPlanDesc] = useState(existingPlan?.description || '');
  const [startDate, setStartDate] = useState(existingPlan?.start_date || new Date().toISOString().split('T')[0]);

  // Structure
  const [weeks, setWeeks] = useState<EditorWeek[]>([]);
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Template loading
  const [showTemplateLoader, setShowTemplateLoader] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Exercise selector
  const [exerciseSelector, setExerciseSelector] = useState<{
    open: boolean;
    weekIdx: number;
    sessionIdx: number;
    blockIdx: number;
  }>({ open: false, weekIdx: 0, sessionIdx: 0, blockIdx: 0 });

  // Init from existing plan
  useEffect(() => {
    if (existingPlan?.structure?.weeks) {
      setWeeks(existingPlan.structure.weeks.map((w: any, i: number) => ({
        id: w.id || genId(),
        order: w.order || i + 1,
        focus: w.focus || `Woche ${i + 1}`,
        sessions: (w.sessions || []).map((s: any) => ({
          id: s.id || genId(),
          dayOfWeek: s.dayOfWeek ?? s.day_of_week ?? 0,
          title: s.title || '',
          description: s.description || '',
          order: s.order || 0,
          workoutData: s.workoutData || s.workout_data || [],
        })),
      })));
    } else {
      // Start with one empty week
      setWeeks([{ id: genId(), order: 1, focus: 'Woche 1', sessions: [] }]);
    }
  }, [existingPlan]);

  // Mark dirty on any change
  const markDirty = () => setDirty(true);

  // ============ WEEK ACTIONS ============
  const addWeek = () => {
    const next = weeks.length + 1;
    setWeeks([...weeks, { id: genId(), order: next, focus: `Woche ${next}`, sessions: [] }]);
    setActiveWeekIdx(weeks.length);
    markDirty();
  };

  const removeWeek = (idx: number) => {
    if (weeks.length <= 1) return;
    const updated = weeks.filter((_, i) => i !== idx).map((w, i) => ({ ...w, order: i + 1 }));
    setWeeks(updated);
    setActiveWeekIdx(Math.min(activeWeekIdx, updated.length - 1));
    markDirty();
  };

  const updateWeekFocus = (idx: number, focus: string) => {
    setWeeks(weeks.map((w, i) => i === idx ? { ...w, focus } : w));
    markDirty();
  };

  const duplicateWeek = (idx: number) => {
    const source = weeks[idx];
    const copy: EditorWeek = {
      id: genId(),
      order: weeks.length + 1,
      focus: `${source.focus} (Kopie)`,
      sessions: source.sessions.map(s => ({ ...s, id: genId(), workoutData: JSON.parse(JSON.stringify(s.workoutData)) })),
    };
    setWeeks([...weeks, copy]);
    setActiveWeekIdx(weeks.length);
    markDirty();
  };

  // ============ SESSION ACTIONS ============
  const addSession = (weekIdx: number, dayOfWeek: number) => {
    const w = weeks[weekIdx];
    const sessionsOnDay = w.sessions.filter(s => s.dayOfWeek === dayOfWeek);
    const newSession: EditorSession = {
      id: genId(),
      dayOfWeek,
      title: `Session ${DAYS[dayOfWeek]}`,
      description: '',
      order: sessionsOnDay.length,
      workoutData: [],
    };
    setWeeks(weeks.map((w, i) => i === weekIdx ? { ...w, sessions: [...w.sessions, newSession] } : w));
    markDirty();
  };

  const removeSession = (weekIdx: number, sessionId: string) => {
    setWeeks(weeks.map((w, i) => i === weekIdx ? { ...w, sessions: w.sessions.filter(s => s.id !== sessionId) } : w));
    markDirty();
  };

  const updateSession = (weekIdx: number, sessionId: string, updates: Partial<EditorSession>) => {
    setWeeks(weeks.map((w, i) => i === weekIdx ? {
      ...w,
      sessions: w.sessions.map(s => s.id === sessionId ? { ...s, ...updates } : s),
    } : w));
    markDirty();
  };

  // ============ EXERCISE / BLOCK ACTIONS ============
  const addBlock = (weekIdx: number, sessionId: string) => {
    const block = { id: genId(), type: 'NORMAL', exercises: [] };
    setWeeks(weeks.map((w, i) => i === weekIdx ? {
      ...w,
      sessions: w.sessions.map(s => s.id === sessionId ? {
        ...s,
        workoutData: [...(s.workoutData || []), block],
      } : s),
    } : w));
    markDirty();
  };

  const removeBlock = (weekIdx: number, sessionId: string, blockIdx: number) => {
    setWeeks(weeks.map((w, i) => i === weekIdx ? {
      ...w,
      sessions: w.sessions.map(s => s.id === sessionId ? {
        ...s,
        workoutData: s.workoutData.filter((_: any, bi: number) => bi !== blockIdx),
      } : s),
    } : w));
    markDirty();
  };

  const addExerciseToBlock = (weekIdx: number, sessionId: string, blockIdx: number, exercise: any) => {
    const newExercise = {
      id: genId(),
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscle_group || exercise.muscleGroup,
      sets: [{ id: genId(), reps: 10, weight: 0, rpe: null, restSeconds: 90 }],
    };
    setWeeks(weeks.map((w, i) => i === weekIdx ? {
      ...w,
      sessions: w.sessions.map(s => s.id === sessionId ? {
        ...s,
        workoutData: s.workoutData.map((b: any, bi: number) => bi === blockIdx ? {
          ...b,
          exercises: [...(b.exercises || []), newExercise],
        } : b),
      } : s),
    } : w));
    setExerciseSelector({ open: false, weekIdx: 0, sessionIdx: 0, blockIdx: 0 });
    markDirty();
  };

  const removeExercise = (weekIdx: number, sessionId: string, blockIdx: number, exerciseIdx: number) => {
    setWeeks(weeks.map((w, i) => i === weekIdx ? {
      ...w,
      sessions: w.sessions.map(s => s.id === sessionId ? {
        ...s,
        workoutData: s.workoutData.map((b: any, bi: number) => bi === blockIdx ? {
          ...b,
          exercises: b.exercises.filter((_: any, ei: number) => ei !== exerciseIdx),
        } : b),
      } : s),
    } : w));
    markDirty();
  };

  const updateSet = (weekIdx: number, sessionId: string, blockIdx: number, exerciseIdx: number, setIdx: number, updates: any) => {
    setWeeks(weeks.map((w, i) => i === weekIdx ? {
      ...w,
      sessions: w.sessions.map(s => s.id === sessionId ? {
        ...s,
        workoutData: s.workoutData.map((b: any, bi: number) => bi === blockIdx ? {
          ...b,
          exercises: b.exercises.map((ex: any, ei: number) => ei === exerciseIdx ? {
            ...ex,
            sets: ex.sets.map((set: any, si: number) => si === setIdx ? { ...set, ...updates } : set),
          } : ex),
        } : b),
      } : s),
    } : w));
    markDirty();
  };

  const addSet = (weekIdx: number, sessionId: string, blockIdx: number, exerciseIdx: number) => {
    setWeeks(weeks.map((w, i) => i === weekIdx ? {
      ...w,
      sessions: w.sessions.map(s => s.id === sessionId ? {
        ...s,
        workoutData: s.workoutData.map((b: any, bi: number) => bi === blockIdx ? {
          ...b,
          exercises: b.exercises.map((ex: any, ei: number) => ei === exerciseIdx ? {
            ...ex,
            sets: [...ex.sets, { id: genId(), reps: ex.sets[ex.sets.length - 1]?.reps || 10, weight: ex.sets[ex.sets.length - 1]?.weight || 0, rpe: null, restSeconds: 90 }],
          } : ex),
        } : b),
      } : s),
    } : w));
    markDirty();
  };

  const removeSet = (weekIdx: number, sessionId: string, blockIdx: number, exerciseIdx: number, setIdx: number) => {
    setWeeks(weeks.map((w, i) => i === weekIdx ? {
      ...w,
      sessions: w.sessions.map(s => s.id === sessionId ? {
        ...s,
        workoutData: s.workoutData.map((b: any, bi: number) => bi === blockIdx ? {
          ...b,
          exercises: b.exercises.map((ex: any, ei: number) => ei === exerciseIdx ? {
            ...ex,
            sets: ex.sets.filter((_: any, si: number) => si !== setIdx),
          } : ex),
        } : b),
      } : s),
    } : w));
    markDirty();
  };

  // ============ TEMPLATE LOADING ============
  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const data = await getPlans();
      setTemplates(data);
    } catch (e) {
      console.error('Error loading templates:', e);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const importTemplate = async (templateId: string) => {
    try {
      const weeksRaw = await getWeeksByPlan(templateId);
      const importedWeeks: EditorWeek[] = [];

      for (const w of weeksRaw) {
        const sessionsRaw = await getSessionsByWeek(w.id);
        importedWeeks.push({
          id: genId(),
          order: w.order,
          focus: w.focus || `Woche ${w.order}`,
          sessions: sessionsRaw.map((s: any) => ({
            id: genId(),
            dayOfWeek: s.day_of_week,
            title: s.title || '',
            description: s.description || '',
            order: s.order || 0,
            workoutData: s.workout_data || [],
          })),
        });
      }

      if (importedWeeks.length > 0) {
        setWeeks(importedWeeks);
        setActiveWeekIdx(0);
        const template = templates.find(t => t.id === templateId);
        if (template && !existingPlan) {
          setPlanName(`${template.name} – ${athleteName}`);
          setPlanDesc(template.description || '');
        }
        markDirty();
      }
      setShowTemplateLoader(false);
    } catch (e) {
      console.error('Error importing template:', e);
    }
  };

  // ============ SAVE ============
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const structure = {
        weeks: weeks.map(w => ({
          id: w.id,
          order: w.order,
          focus: w.focus,
          sessions: w.sessions.map(s => ({
            id: s.id,
            dayOfWeek: s.dayOfWeek,
            title: s.title,
            description: s.description,
            order: s.order,
            workoutData: s.workoutData,
          })),
        })),
      };

      if (existingPlan?.id) {
        await updateAssignedPlan(existingPlan.id, {
          plan_name: planName,
          description: planDesc,
          start_date: startDate,
          structure,
        });
      } else {
        await createAssignedPlan({
          athlete_id: athleteId,
          coach_id: user.id,
          original_plan_id: null,
          start_date: startDate,
          assignment_type: 'ONE_TO_ONE',
          schedule_status: 'ACTIVE',
          schedule: {},
          plan_name: planName,
          description: planDesc,
          structure,
        });
      }

      setDirty(false);
      onSave?.();
    } catch (e) {
      console.error('Error saving athlete plan:', e);
      alert('Fehler beim Speichern. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  };

  const activeWeek = weeks[activeWeekIdx];

  // ============ RENDER ============
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          {onClose && (
            <button onClick={onClose} className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <input
              value={planName}
              onChange={e => { setPlanName(e.target.value); markDirty(); }}
              className="bg-transparent text-white font-bold text-lg outline-none w-full border-b border-transparent hover:border-zinc-700 focus:border-[#00FF00] transition-colors pb-0.5"
              placeholder="Plan-Name..."
            />
            <input
              value={planDesc}
              onChange={e => { setPlanDesc(e.target.value); markDirty(); }}
              className="bg-transparent text-zinc-500 text-xs outline-none w-full mt-0.5"
              placeholder="Beschreibung (optional)..."
            />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="date"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); markDirty(); }}
            className="bg-zinc-900 border border-zinc-800 text-white rounded-lg px-2 py-1.5 text-xs focus:border-[#00FF00] outline-none"
          />
          <button
            onClick={() => { setShowTemplateLoader(true); loadTemplates(); }}
            className="px-3 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-zinc-700"
          >
            <Download size={14} /> Vorlage laden
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              dirty ? 'bg-[#00FF00] text-black hover:bg-[#00DD00]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {existingPlan ? 'Speichern' : 'Plan erstellen'}
          </button>
        </div>
      </div>

      {/* Week Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {weeks.map((w, i) => (
          <button
            key={w.id}
            onClick={() => setActiveWeekIdx(i)}
            className={`group flex items-center gap-1 whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeWeekIdx === i
                ? 'bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/30'
                : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white'
            }`}
          >
            W{w.order}
            {activeWeekIdx === i && (
              <span className="flex gap-0.5 ml-1">
                <button onClick={(e) => { e.stopPropagation(); duplicateWeek(i); }} className="hover:text-blue-400" title="Duplizieren"><Copy size={10} /></button>
                {weeks.length > 1 && <button onClick={(e) => { e.stopPropagation(); removeWeek(i); }} className="hover:text-red-400" title="Löschen"><X size={10} /></button>}
              </span>
            )}
          </button>
        ))}
        <button onClick={addWeek} className="px-2 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-[#00FF00] hover:border-[#00FF00]/30">
          <Plus size={14} />
        </button>
      </div>

      {/* Active Week */}
      {activeWeek && (
        <div className="space-y-3">
          {/* Week Focus */}
          <div className="flex items-center gap-2">
            <input
              value={activeWeek.focus}
              onChange={e => updateWeekFocus(activeWeekIdx, e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-white rounded-lg px-3 py-1.5 text-sm flex-1 focus:border-[#00FF00] outline-none"
              placeholder="Wochenfokus..."
            />
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {DAYS.map((day, dayIdx) => {
              const daySessions = activeWeek.sessions.filter(s => s.dayOfWeek === dayIdx);
              return (
                <div key={dayIdx} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-2 min-h-[120px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">{day}</span>
                    <button
                      onClick={() => addSession(activeWeekIdx, dayIdx)}
                      className="text-zinc-600 hover:text-[#00FF00] transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {daySessions.map(session => (
                      <div key={session.id} className="bg-zinc-800/50 rounded-lg p-2 group">
                        <div className="flex items-center justify-between mb-1">
                          <input
                            value={session.title}
                            onChange={e => updateSession(activeWeekIdx, session.id, { title: e.target.value })}
                            className="bg-transparent text-white text-[11px] font-bold outline-none w-full truncate"
                            placeholder="Session..."
                          />
                          <button
                            onClick={() => removeSession(activeWeekIdx, session.id)}
                            className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>

                        {/* Blocks */}
                        {(session.workoutData || []).map((block: any, blockIdx: number) => (
                          <div key={block.id || blockIdx} className="mb-1">
                            {(block.exercises || []).map((ex: any, exIdx: number) => (
                              <div key={ex.id || exIdx} className="flex items-center gap-1 text-[10px] text-zinc-400 py-0.5">
                                <Dumbbell size={8} className="text-zinc-600 shrink-0" />
                                <span className="truncate flex-1">{ex.exerciseName || 'Übung'}</span>
                                <span className="text-zinc-600 shrink-0">{ex.sets?.length || 0}S</span>
                                <button onClick={() => removeExercise(activeWeekIdx, session.id, blockIdx, exIdx)} className="text-zinc-700 hover:text-red-400"><X size={8} /></button>
                              </div>
                            ))}
                            <button
                              onClick={() => setExerciseSelector({ open: true, weekIdx: activeWeekIdx, sessionIdx: activeWeek.sessions.indexOf(session), blockIdx })}
                              className="text-[9px] text-zinc-600 hover:text-[#00FF00] flex items-center gap-0.5 mt-0.5"
                            >
                              <Plus size={8} /> Übung
                            </button>
                          </div>
                        ))}

                        <button
                          onClick={() => addBlock(activeWeekIdx, session.id)}
                          className="text-[9px] text-zinc-700 hover:text-blue-400 flex items-center gap-0.5 mt-1"
                        >
                          <Layers size={8} /> Block
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expanded Session Detail (click to expand a session for set editing) */}
          {activeWeek.sessions.length > 0 && (
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4">
              <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                <Pencil size={14} className="text-zinc-400" /> Session-Details (Sätze bearbeiten)
              </h4>
              <div className="space-y-3">
                {activeWeek.sessions.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map(session => (
                  <details key={session.id} className="group">
                    <summary className="cursor-pointer text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-2 py-1">
                      <span className="text-[#00FF00]">{DAYS[session.dayOfWeek]}</span> — {session.title || 'Session'}
                      <span className="text-zinc-600 text-[10px]">({(session.workoutData || []).reduce((acc: number, b: any) => acc + (b.exercises?.length || 0), 0)} Übungen)</span>
                    </summary>
                    <div className="mt-2 ml-4 space-y-2">
                      {(session.workoutData || []).map((block: any, blockIdx: number) => (
                        <div key={block.id || blockIdx} className="border-l-2 border-zinc-800 pl-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-zinc-600 uppercase font-bold">Block {blockIdx + 1}</span>
                            <button onClick={() => removeBlock(activeWeekIdx, session.id, blockIdx)} className="text-zinc-700 hover:text-red-400"><Trash2 size={10} /></button>
                          </div>
                          {(block.exercises || []).map((ex: any, exIdx: number) => (
                            <div key={ex.id || exIdx} className="bg-zinc-900 rounded-lg p-2 mb-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-white font-bold">{ex.exerciseName || 'Übung'}</span>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => addSet(activeWeekIdx, session.id, blockIdx, exIdx)} className="text-[9px] text-zinc-500 hover:text-[#00FF00]"><Plus size={10} /></button>
                                  <button onClick={() => removeExercise(activeWeekIdx, session.id, blockIdx, exIdx)} className="text-zinc-700 hover:text-red-400"><X size={10} /></button>
                                </div>
                              </div>
                              {/* Sets Table */}
                              <div className="space-y-0.5">
                                <div className="grid grid-cols-5 gap-1 text-[9px] text-zinc-600 uppercase font-bold px-1">
                                  <span>Set</span><span>Wdh</span><span>Gewicht</span><span>RPE</span><span>Pause</span>
                                </div>
                                {(ex.sets || []).map((set: any, setIdx: number) => (
                                  <div key={set.id || setIdx} className="grid grid-cols-5 gap-1 items-center">
                                    <span className="text-[10px] text-zinc-500 pl-1">{setIdx + 1}</span>
                                    <input
                                      type="number"
                                      value={set.reps || ''}
                                      onChange={e => updateSet(activeWeekIdx, session.id, blockIdx, exIdx, setIdx, { reps: Number(e.target.value) })}
                                      className="bg-zinc-800 text-white text-[10px] rounded px-1.5 py-0.5 w-full outline-none focus:bg-zinc-700"
                                      placeholder="10"
                                    />
                                    <input
                                      type="number"
                                      value={set.weight || ''}
                                      onChange={e => updateSet(activeWeekIdx, session.id, blockIdx, exIdx, setIdx, { weight: Number(e.target.value) })}
                                      className="bg-zinc-800 text-white text-[10px] rounded px-1.5 py-0.5 w-full outline-none focus:bg-zinc-700"
                                      placeholder="0"
                                    />
                                    <input
                                      type="number"
                                      value={set.rpe || ''}
                                      onChange={e => updateSet(activeWeekIdx, session.id, blockIdx, exIdx, setIdx, { rpe: Number(e.target.value) || null })}
                                      className="bg-zinc-800 text-white text-[10px] rounded px-1.5 py-0.5 w-full outline-none focus:bg-zinc-700"
                                      placeholder="–"
                                    />
                                    <div className="flex items-center gap-0.5">
                                      <input
                                        type="number"
                                        value={set.restSeconds || ''}
                                        onChange={e => updateSet(activeWeekIdx, session.id, blockIdx, exIdx, setIdx, { restSeconds: Number(e.target.value) })}
                                        className="bg-zinc-800 text-white text-[10px] rounded px-1.5 py-0.5 w-full outline-none focus:bg-zinc-700"
                                        placeholder="90"
                                      />
                                      {(ex.sets?.length || 0) > 1 && (
                                        <button onClick={() => removeSet(activeWeekIdx, session.id, blockIdx, exIdx, setIdx)} className="text-zinc-700 hover:text-red-400 shrink-0"><X size={8} /></button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => setExerciseSelector({ open: true, weekIdx: activeWeekIdx, sessionIdx: activeWeek.sessions.indexOf(session), blockIdx })}
                            className="text-[10px] text-zinc-600 hover:text-[#00FF00] flex items-center gap-1 mt-1"
                          >
                            <Plus size={10} /> Übung hinzufügen
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addBlock(activeWeekIdx, session.id)}
                        className="text-[10px] text-zinc-600 hover:text-blue-400 flex items-center gap-1"
                      >
                        <Layers size={10} /> Neuer Block
                      </button>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template Loader Modal */}
      {showTemplateLoader && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowTemplateLoader(false)}>
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h3 className="text-white font-bold text-sm">Vorlage als Basis laden</h3>
              <button onClick={() => setShowTemplateLoader(false)} className="text-zinc-500 hover:text-white"><X size={16} /></button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[55vh]">
              {loadingTemplates ? (
                <div className="text-center py-8"><Loader2 className="animate-spin mx-auto text-zinc-500" size={24} /></div>
              ) : templates.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-8">Keine Plan-Vorlagen vorhanden.</p>
              ) : (
                <div className="space-y-2">
                  {templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => importTemplate(t.id)}
                      className="w-full text-left bg-zinc-900 hover:bg-zinc-800 rounded-xl p-3 transition-colors"
                    >
                      <p className="text-white font-bold text-sm">{t.name}</p>
                      {t.description && <p className="text-zinc-500 text-xs mt-0.5">{t.description}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-zinc-800">
              <p className="text-zinc-600 text-[10px]">
                <AlertTriangle size={10} className="inline mr-1" />
                Die Vorlage wird als Basis geladen. Änderungen betreffen nur diesen Athleten, nicht die Original-Vorlage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Selector */}
      {exerciseSelector.open && (
        <ExerciseSelector
          isOpen={exerciseSelector.open}
          onSelect={(exercise: any) => {
            const session = activeWeek?.sessions[exerciseSelector.sessionIdx];
            if (session) {
              addExerciseToBlock(exerciseSelector.weekIdx, session.id, exerciseSelector.blockIdx, exercise);
            }
          }}
          onClose={() => setExerciseSelector({ open: false, weekIdx: 0, sessionIdx: 0, blockIdx: 0 })}
        />
      )}

      {/* Unsaved Changes Warning */}
      {dirty && (
        <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 z-30 shadow-lg">
          <AlertTriangle size={14} /> Ungespeicherte Änderungen
          <button onClick={handleSave} disabled={saving} className="bg-[#00FF00] text-black px-3 py-1 rounded-lg ml-2 hover:bg-[#00DD00]">
            {saving ? 'Speichert...' : 'Jetzt speichern'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AthletePlanEditor;
