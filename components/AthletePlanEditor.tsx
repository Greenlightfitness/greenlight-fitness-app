import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  supabase, createAssignedPlan, updateAssignedPlan, getPlans,
  getWeeksByPlan, getSessionsByWeek, createSession as createSessionDB
} from '../services/supabase';
import { TrainingSession } from '../types';
import DraftSessionBuilder from './planner/DraftSessionBuilder';
import LibrarySelectorV2, { LibraryMode } from './planner/LibrarySelectorV2';
import ConfirmationModal from './ConfirmationModal';
import { useLanguage } from '../context/LanguageContext';
import {
  Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp, Dumbbell,
  Calendar, Copy, FileText, X, Check, Layers, GripVertical,
  Pencil, ChevronLeft, Download, AlertTriangle, Eye, EyeOff,
  ClipboardList, Send, Lock, Unlock
} from 'lucide-react';

interface AthletePlanEditorProps {
  athleteId: string;
  athleteName: string;
  coachingRelationshipId?: string;
  existingPlan?: any;
  onSave?: () => void;
  onClose?: () => void;
}

interface DraftWeek {
  id: string;
  order: number;
  focus: string;
  sessions: DraftSession[];
}

interface DraftSession {
  id: string;
  dayOfWeek: number;
  title: string;
  description: string;
  order: number;
  workoutData: any[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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
  const { t } = useLanguage();

  // Plan metadata
  const [planName, setPlanName] = useState(existingPlan?.plan_name || `Plan für ${athleteName}`);
  const [planDesc, setPlanDesc] = useState(existingPlan?.description || '');
  const [startDate, setStartDate] = useState(existingPlan?.start_date || new Date().toISOString().split('T')[0]);
  const [editingMeta, setEditingMeta] = useState(false);

  // Structure
  const [weeks, setWeeks] = useState<DraftWeek[]>([]);
  const [activeWeek, setActiveWeek] = useState<DraftWeek | null>(null);
  const [sessions, setSessions] = useState<DraftSession[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Draft / Published
  const [publishedWeeks, setPublishedWeeks] = useState<number[]>(existingPlan?.published_weeks || []);

  // Session Editor (fullscreen overlay)
  const [editingSession, setEditingSession] = useState<DraftSession | null>(null);

  // Library Selector
  const [librarySelector, setLibrarySelector] = useState<{ isOpen: boolean; mode: LibraryMode; dayIndex?: number }>({
    isOpen: false, mode: 'week'
  });

  // Confirmation
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; type: 'week' | 'session' | null; id: string | null;
  }>({ isOpen: false, type: null, id: null });

  // Drag
  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null);
  const [draggedWeekId, setDraggedWeekId] = useState<string | null>(null);

  // Template loader
  const [showTemplateLoader, setShowTemplateLoader] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Auto-save timer
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // ============ INIT ============
  useEffect(() => {
    const source = existingPlan?.draft_structure || existingPlan?.structure;
    if (source?.weeks) {
      const parsed = source.weeks.map((w: any, i: number) => ({
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
      }));
      setWeeks(parsed);
      if (parsed.length > 0) {
        setActiveWeek(parsed[0]);
        setSessions(parsed[0].sessions);
      }
    } else {
      const initial = [{ id: genId(), order: 1, focus: 'Woche 1', sessions: [] as DraftSession[] }];
      setWeeks(initial);
      setActiveWeek(initial[0]);
      setSessions([]);
    }
    setPublishedWeeks(existingPlan?.published_weeks || []);
  }, [existingPlan]);

  // Sync sessions when active week changes
  useEffect(() => {
    if (activeWeek) {
      const w = weeks.find(w => w.id === activeWeek.id);
      if (w) setSessions(w.sessions.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.order - b.order;
      }));
    } else {
      setSessions([]);
    }
  }, [activeWeek, weeks]);

  // Auto-save draft every 10s when dirty
  useEffect(() => {
    if (dirty) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        saveDraft();
      }, 10000);
    }
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [dirty, weeks, planName, planDesc, startDate]);

  const markDirty = () => setDirty(true);

  // ============ BUILD STRUCTURE ============
  const buildStructure = () => ({
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
  });

  // ============ SAVE DRAFT (auto) ============
  const saveDraft = async () => {
    if (!user) return;
    const structure = buildStructure();
    try {
      if (existingPlan?.id) {
        await updateAssignedPlan(existingPlan.id, {
          plan_name: planName,
          description: planDesc,
          start_date: startDate,
          draft_structure: structure,
        });
      } else {
        const result = await createAssignedPlan({
          athlete_id: athleteId,
          coach_id: user.id,
          original_plan_id: null,
          start_date: startDate,
          assignment_type: 'ONE_TO_ONE',
          schedule_status: 'ACTIVE',
          schedule: {},
          plan_name: planName,
          description: planDesc,
          draft_structure: structure,
          structure: { weeks: [] },
          published_weeks: [],
        });
        if (result?.id) {
          existingPlan.id = result.id;
        }
      }
      setDirty(false);
    } catch (e) {
      console.error('Auto-save failed:', e);
    }
  };

  // ============ PUBLISH WEEKS ============
  const publishWeek = async (weekIdx: number) => {
    const newPublished = publishedWeeks.includes(weekIdx) ? publishedWeeks : [...publishedWeeks, weekIdx].sort((a, b) => a - b);
    setPublishedWeeks(newPublished);

    // Build published structure (only published weeks)
    const allWeeks = buildStructure().weeks;
    const pubStructure = { weeks: allWeeks.filter((_, i) => newPublished.includes(i)) };

    try {
      if (existingPlan?.id) {
        await updateAssignedPlan(existingPlan.id, {
          plan_name: planName,
          description: planDesc,
          start_date: startDate,
          draft_structure: buildStructure(),
          structure: pubStructure,
          published_weeks: newPublished,
        });
        setDirty(false);
      }
    } catch (e) {
      console.error('Error publishing week:', e);
    }
  };

  const unpublishWeek = async (weekIdx: number) => {
    const newPublished = publishedWeeks.filter(i => i !== weekIdx);
    setPublishedWeeks(newPublished);

    const allWeeks = buildStructure().weeks;
    const pubStructure = { weeks: allWeeks.filter((_, i) => newPublished.includes(i)) };

    try {
      if (existingPlan?.id) {
        await updateAssignedPlan(existingPlan.id, {
          structure: pubStructure,
          published_weeks: newPublished,
        });
      }
    } catch (e) {
      console.error('Error unpublishing week:', e);
    }
  };

  const publishAllWeeks = async () => {
    const allIdxs = weeks.map((_, i) => i);
    setPublishedWeeks(allIdxs);
    const structure = buildStructure();
    try {
      if (existingPlan?.id) {
        await updateAssignedPlan(existingPlan.id, {
          plan_name: planName,
          description: planDesc,
          start_date: startDate,
          draft_structure: structure,
          structure: structure,
          published_weeks: allIdxs,
        });
        setDirty(false);
      }
    } catch (e) {
      console.error('Error publishing all:', e);
    }
  };

  // ============ MANUAL SAVE ============
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const structure = buildStructure();
      const pubStructure = { weeks: structure.weeks.filter((_, i) => publishedWeeks.includes(i)) };

      if (existingPlan?.id) {
        await updateAssignedPlan(existingPlan.id, {
          plan_name: planName,
          description: planDesc,
          start_date: startDate,
          draft_structure: structure,
          structure: pubStructure,
          published_weeks: publishedWeeks,
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
          draft_structure: structure,
          structure: { weeks: [] },
          published_weeks: [],
        });
      }
      setDirty(false);
      onSave?.();
    } catch (e) {
      console.error('Error saving:', e);
      alert('Fehler beim Speichern.');
    } finally {
      setSaving(false);
    }
  };

  // ============ WEEK ACTIONS ============
  const handleAddWeek = () => { setLibrarySelector({ isOpen: true, mode: 'week' }); };

  const handleCreateNewWeek = () => {
    const next = weeks.length + 1;
    const newWeek: DraftWeek = { id: genId(), order: next, focus: `Woche ${next}`, sessions: [] };
    const updated = [...weeks, newWeek];
    setWeeks(updated);
    setActiveWeek(newWeek);
    setLibrarySelector({ isOpen: false, mode: 'week' });
    markDirty();
  };

  const handleImportWeek = async (weekData: any) => {
    const next = weeks.length + 1;
    let importedSessions: DraftSession[] = [];
    if (weekData.planId && weekData.id) {
      try {
        const raw = await getSessionsByWeek(weekData.id);
        importedSessions = raw.map((s: any) => ({
          id: genId(), dayOfWeek: s.day_of_week, title: s.title || '',
          description: s.description || '', order: s.order || 0,
          workoutData: s.workout_data || [],
        }));
      } catch (e) { console.error(e); }
    }
    const newWeek: DraftWeek = {
      id: genId(), order: next,
      focus: `${weekData.focus || 'Woche'} (Kopie)`,
      sessions: importedSessions,
    };
    const updated = [...weeks, newWeek];
    setWeeks(updated);
    setActiveWeek(newWeek);
    setLibrarySelector({ isOpen: false, mode: 'week' });
    markDirty();
  };

  const handleDuplicateWeek = () => {
    if (!activeWeek) return;
    const next = weeks.length + 1;
    const copy: DraftWeek = {
      id: genId(), order: next,
      focus: `${activeWeek.focus} (Kopie)`,
      sessions: activeWeek.sessions.map(s => ({
        ...s, id: genId(),
        workoutData: JSON.parse(JSON.stringify(s.workoutData)),
      })),
    };
    const updated = [...weeks, copy];
    setWeeks(updated);
    setActiveWeek(copy);
    markDirty();
  };

  const requestDeleteWeek = () => {
    if (activeWeek) setConfirmModal({ isOpen: true, type: 'week', id: activeWeek.id });
  };

  const confirmDeleteWeek = () => {
    if (!activeWeek || !confirmModal.id) return;
    const updated = weeks.filter(w => w.id !== activeWeek.id).map((w, i) => ({ ...w, order: i + 1 }));
    setWeeks(updated);
    setActiveWeek(updated.length > 0 ? updated[0] : null);
    setConfirmModal({ isOpen: false, type: null, id: null });
    markDirty();
  };

  const handleUpdateWeekFocus = (newFocus: string) => {
    if (!activeWeek) return;
    if (newFocus !== activeWeek.focus) {
      const updated = weeks.map(w => w.id === activeWeek.id ? { ...w, focus: newFocus } : w);
      setWeeks(updated);
      setActiveWeek({ ...activeWeek, focus: newFocus });
      markDirty();
    }
  };

  // Week drag
  const handleWeekDragStart = (e: React.DragEvent, weekId: string) => { setDraggedWeekId(weekId); e.dataTransfer.effectAllowed = 'move'; };
  const handleWeekDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleWeekDrop = (e: React.DragEvent, targetWeekId: string) => {
    e.preventDefault();
    if (!draggedWeekId || draggedWeekId === targetWeekId) return;
    const from = weeks.findIndex(w => w.id === draggedWeekId);
    const to = weeks.findIndex(w => w.id === targetWeekId);
    if (from === -1 || to === -1) return;
    const newWeeks = [...weeks];
    const [moved] = newWeeks.splice(from, 1);
    newWeeks.splice(to, 0, moved);
    const reordered = newWeeks.map((w, i) => ({ ...w, order: i + 1 }));
    setWeeks(reordered);
    setDraggedWeekId(null);
    markDirty();
  };

  // ============ SESSION ACTIONS ============
  const handleAddSession = (dayIndex: number) => {
    setLibrarySelector({ isOpen: true, mode: 'session', dayIndex });
  };

  const handleCreateNewSession = () => {
    if (!activeWeek || typeof librarySelector.dayIndex !== 'number') return;
    const dayIndex = librarySelector.dayIndex;
    const daySess = sessions.filter(s => s.dayOfWeek === dayIndex);
    const maxOrder = daySess.length > 0 ? Math.max(...daySess.map(s => s.order)) : 0;
    const newSession: DraftSession = {
      id: genId(), dayOfWeek: dayIndex, title: 'Neue Session',
      description: '', order: maxOrder + 1, workoutData: [],
    };
    const updatedWeeks = weeks.map(w => w.id === activeWeek.id ? { ...w, sessions: [...w.sessions, newSession] } : w);
    setWeeks(updatedWeeks);
    setActiveWeek(updatedWeeks.find(w => w.id === activeWeek.id) || activeWeek);
    setEditingSession(newSession);
    setLibrarySelector({ isOpen: false, mode: 'session' });
    markDirty();
  };

  const handleImportSession = async (sessionData: any) => {
    if (!activeWeek || typeof librarySelector.dayIndex !== 'number') return;
    const dayIndex = librarySelector.dayIndex;
    const daySess = sessions.filter(s => s.dayOfWeek === dayIndex);
    const maxOrder = daySess.length > 0 ? Math.max(...daySess.map(s => s.order)) : 0;
    const newSession: DraftSession = {
      id: genId(), dayOfWeek: dayIndex,
      title: sessionData.title || 'Session',
      description: sessionData.description || '',
      order: maxOrder + 1,
      workoutData: sessionData.workoutData || sessionData.workout_data || [],
    };
    const updatedWeeks = weeks.map(w => w.id === activeWeek.id ? { ...w, sessions: [...w.sessions, newSession] } : w);
    setWeeks(updatedWeeks);
    setActiveWeek(updatedWeeks.find(w => w.id === activeWeek.id) || activeWeek);
    setLibrarySelector({ isOpen: false, mode: 'session' });
    markDirty();
  };

  const handleDuplicateSession = (session: DraftSession) => {
    if (!activeWeek) return;
    const daySess = sessions.filter(s => s.dayOfWeek === session.dayOfWeek);
    const maxOrder = daySess.length > 0 ? Math.max(...daySess.map(s => s.order)) : 0;
    const copy: DraftSession = {
      ...session, id: genId(), title: `${session.title} (Kopie)`,
      order: maxOrder + 1,
      workoutData: JSON.parse(JSON.stringify(session.workoutData)),
    };
    const updatedWeeks = weeks.map(w => w.id === activeWeek.id ? { ...w, sessions: [...w.sessions, copy] } : w);
    setWeeks(updatedWeeks);
    setActiveWeek(updatedWeeks.find(w => w.id === activeWeek.id) || activeWeek);
    markDirty();
  };

  const requestDeleteSession = (sessionId: string) => {
    setConfirmModal({ isOpen: true, type: 'session', id: sessionId });
  };

  const confirmDeleteSession = () => {
    if (!activeWeek || !confirmModal.id) return;
    const sid = confirmModal.id;
    const updatedWeeks = weeks.map(w => w.id === activeWeek.id ? { ...w, sessions: w.sessions.filter(s => s.id !== sid) } : w);
    setWeeks(updatedWeeks);
    setActiveWeek(updatedWeeks.find(w => w.id === activeWeek.id) || activeWeek);
    if (editingSession?.id === sid) setEditingSession(null);
    setConfirmModal({ isOpen: false, type: null, id: null });
    markDirty();
  };

  // Session drag
  const handleDragStart = (e: React.DragEvent, session: DraftSession) => {
    e.dataTransfer.setData('sessionId', session.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedSessionId(session.id);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDropOnDay = (e: React.DragEvent, targetDay: number) => {
    e.preventDefault(); e.stopPropagation();
    const sessionId = e.dataTransfer.getData('sessionId');
    if (!sessionId || !activeWeek) return;
    const sess = activeWeek.sessions.find(s => s.id === sessionId);
    if (!sess || sess.dayOfWeek === targetDay) { setDraggedSessionId(null); return; }
    const targetDaySessions = activeWeek.sessions.filter(s => s.dayOfWeek === targetDay);
    const newOrder = targetDaySessions.length > 0 ? Math.max(...targetDaySessions.map(s => s.order)) + 1 : 1;
    const updatedWeeks = weeks.map(w => w.id === activeWeek.id ? {
      ...w, sessions: w.sessions.map(s => s.id === sessionId ? { ...s, dayOfWeek: targetDay, order: newOrder } : s)
    } : w);
    setWeeks(updatedWeeks);
    setActiveWeek(updatedWeeks.find(w => w.id === activeWeek.id) || activeWeek);
    setDraggedSessionId(null);
    markDirty();
  };

  // Session editor save callback
  const handleSessionEditorSave = (updated: { title: string; description: string; workoutData: any[] }) => {
    if (!editingSession || !activeWeek) return;
    const updatedWeeks = weeks.map(w => w.id === activeWeek.id ? {
      ...w, sessions: w.sessions.map(s => s.id === editingSession.id ? { ...s, ...updated } : s)
    } : w);
    setWeeks(updatedWeeks);
    setActiveWeek(updatedWeeks.find(w => w.id === activeWeek.id) || activeWeek);
    setEditingSession(null);
    markDirty();
  };

  // ============ TEMPLATE LOADING ============
  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try { const data = await getPlans(); setTemplates(data); }
    catch (e) { console.error(e); }
    finally { setLoadingTemplates(false); }
  };

  const importTemplate = async (templateId: string) => {
    try {
      const weeksRaw = await getWeeksByPlan(templateId);
      const imported: DraftWeek[] = [];
      for (const w of weeksRaw) {
        const sessRaw = await getSessionsByWeek(w.id);
        imported.push({
          id: genId(), order: w.order,
          focus: w.focus || `Woche ${w.order}`,
          sessions: sessRaw.map((s: any) => ({
            id: genId(), dayOfWeek: s.day_of_week,
            title: s.title || '', description: s.description || '',
            order: s.order || 0, workoutData: s.workout_data || [],
          })),
        });
      }
      if (imported.length > 0) {
        setWeeks(imported);
        setActiveWeek(imported[0]);
        const tmpl = templates.find(t => t.id === templateId);
        if (tmpl && !existingPlan?.id) {
          setPlanName(`${tmpl.name} – ${athleteName}`);
          setPlanDesc(tmpl.description || '');
        }
        setPublishedWeeks([]);
        markDirty();
      }
      setShowTemplateLoader(false);
    } catch (e) { console.error(e); }
  };

  const activeWeekIdx = weeks.findIndex(w => w.id === activeWeek?.id);

  // ============ RENDER ============
  return (
    <div className="space-y-6 h-full min-h-[calc(100vh-140px)] flex flex-col relative animate-in fade-in">
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'week' ? 'Woche löschen?' : 'Session löschen?'}
        message={confirmModal.type === 'week' ? 'Alle Sessions dieser Woche werden gelöscht.' : 'Diese Session wird unwiderruflich gelöscht.'}
        confirmText="Ja, löschen"
        cancelText="Abbrechen"
        isDangerous={true}
        onConfirm={confirmModal.type === 'week' ? confirmDeleteWeek : confirmDeleteSession}
        onCancel={() => setConfirmModal({ isOpen: false, type: null, id: null })}
      />

      <LibrarySelectorV2
        mode={librarySelector.mode}
        isOpen={librarySelector.isOpen}
        onClose={() => setLibrarySelector({ ...librarySelector, isOpen: false })}
        onCreateNew={librarySelector.mode === 'week' ? handleCreateNewWeek : handleCreateNewSession}
        onSelect={librarySelector.mode === 'week' ? handleImportWeek : handleImportSession}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 border-b border-zinc-800 pb-6 justify-between shrink-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {onClose && (
            <button onClick={onClose} className="p-3 bg-[#1C1C1E] rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
              <ChevronLeft size={24} />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setEditingMeta(true)}>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white group-hover:text-[#00FF00] transition-colors tracking-tight truncate">
                {planName}
              </h2>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded uppercase">1:1</span>
              <Pencil size={18} className="text-zinc-600 group-hover:text-[#00FF00] opacity-0 group-hover:opacity-100 transition-all shrink-0" />
            </div>
            <p className="text-sm text-zinc-500 line-clamp-1 mt-1">{planDesc || athleteName} · Start: {startDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowTemplateLoader(true); loadTemplates(); }}
            className="px-3 py-2 bg-[#1C1C1E] border border-zinc-800 text-zinc-400 rounded-xl text-xs font-bold flex items-center gap-1 hover:text-white hover:border-zinc-600">
            <Download size={14} /> Vorlage
          </button>
          <button onClick={publishAllWeeks}
            className="px-3 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-blue-500/20">
            <Send size={14} /> Alle veröffentlichen
          </button>
          <div className="px-4 py-2 bg-[#1C1C1E] rounded-full border border-zinc-800 hidden md:block">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#00FF00]">
              {dirty ? 'Entwurf*' : 'Entwurf'}
            </span>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide flex-1">
            {weeks.map((week, wIdx) => {
              const isPublished = publishedWeeks.includes(wIdx);
              return (
                <div key={week.id} draggable onDragStart={(e) => handleWeekDragStart(e, week.id)}
                  onDragOver={handleWeekDragOver} onDrop={(e) => handleWeekDrop(e, week.id)}
                  className="relative group/week flex-shrink-0">
                  <button onClick={() => setActiveWeek(week)}
                    className={`flex flex-col items-start px-5 py-3 rounded-2xl min-w-[140px] transition-all border cursor-grab active:cursor-grabbing shadow-lg
                      ${activeWeek?.id === week.id
                        ? 'bg-[#00FF00] text-black border-[#00FF00] scale-105 z-10'
                        : 'bg-[#1C1C1E] text-zinc-400 border-zinc-800 hover:border-zinc-600'}
                      ${draggedWeekId === week.id ? 'opacity-30 border-dashed' : ''}
                    `}>
                    <div className="flex items-center gap-2 w-full">
                      <span className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${activeWeek?.id === week.id ? 'text-black/60' : 'text-zinc-600'}`}>
                        Woche {week.order}
                      </span>
                      {isPublished ? (
                        <Eye size={10} className={activeWeek?.id === week.id ? 'text-black/60' : 'text-blue-400'} />
                      ) : (
                        <EyeOff size={10} className={activeWeek?.id === week.id ? 'text-black/40' : 'text-zinc-700'} />
                      )}
                    </div>
                    <span className="font-bold text-sm truncate w-full text-left">{week.focus || `Focus ${week.order}`}</span>
                  </button>
                </div>
              );
            })}
            <button onClick={handleAddWeek}
              className="h-[64px] w-[64px] flex items-center justify-center bg-[#1C1C1E] border border-zinc-800 text-zinc-500 hover:text-[#00FF00] hover:border-[#00FF00] rounded-2xl transition-all shrink-0 hover:shadow-[0_0_15px_rgba(0,255,0,0.15)]">
              <Plus size={28} />
            </button>
          </div>

          {activeWeek && (
            <div className="flex items-center gap-1 ml-4 border-l border-zinc-800 pl-4 hidden md:flex">
              {publishedWeeks.includes(activeWeekIdx) ? (
                <button onClick={() => unpublishWeek(activeWeekIdx)}
                  className="p-3 bg-blue-500/10 rounded-xl text-blue-400 hover:bg-blue-500/20 transition-colors" title="Woche verbergen">
                  <EyeOff size={20} />
                </button>
              ) : (
                <button onClick={() => publishWeek(activeWeekIdx)}
                  className="p-3 bg-[#1C1C1E] rounded-xl text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Woche veröffentlichen">
                  <Eye size={20} />
                </button>
              )}
              <button onClick={handleDuplicateWeek}
                className="p-3 bg-[#1C1C1E] rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
                <Copy size={20} />
              </button>
              <button onClick={requestDeleteWeek}
                className="p-3 bg-[#1C1C1E] rounded-xl text-zinc-500 hover:text-red-500 hover:bg-zinc-800 transition-colors">
                <Trash2 size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Week Focus + Draft Status */}
        {activeWeek && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-[#1C1C1E] px-6 py-4 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors shadow-sm">
            <span className="text-[#00FF00] text-xs font-bold uppercase tracking-widest whitespace-nowrap">Wochenfokus</span>
            <input
              className="bg-transparent text-white focus:outline-none flex-1 font-bold text-lg placeholder-zinc-700 w-full"
              placeholder="z.B. Volume Accumulation..."
              value={activeWeek.focus || ''}
              onChange={(e) => {
                const updated = weeks.map(w => w.id === activeWeek.id ? { ...w, focus: e.target.value } : w);
                setWeeks(updated);
                setActiveWeek({ ...activeWeek, focus: e.target.value });
              }}
              onBlur={(e) => handleUpdateWeekFocus(e.target.value)}
            />
            <div className="flex items-center gap-2">
              {publishedWeeks.includes(activeWeekIdx) ? (
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-full flex items-center gap-1"><Eye size={10} /> Veröffentlicht</span>
              ) : (
                <span className="px-3 py-1 bg-zinc-800 text-zinc-500 text-[10px] font-bold rounded-full flex items-center gap-1"><EyeOff size={10} /> Entwurf</span>
              )}
              <div className="flex items-center gap-1 md:hidden">
                <button onClick={handleDuplicateWeek} className="p-2 text-zinc-500 hover:text-white bg-zinc-900 rounded-lg"><Copy size={18} /></button>
                <button onClick={requestDeleteWeek} className="p-2 text-zinc-500 hover:text-red-500 bg-zinc-900 rounded-lg"><Trash2 size={18} /></button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Schedule Grid — matches PlanEditor exactly */}
      <div className="flex-1 bg-[#000000] rounded-3xl border border-zinc-800 select-none shadow-2xl overflow-hidden flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-7 h-full overflow-y-auto md:divide-x divide-zinc-800 scrollbar-hide">
          {DAYS.map((dayName, index) => {
            const daySessions = sessions.filter(s => s.dayOfWeek === index);
            return (
              <div key={dayName} className="flex flex-col h-auto md:h-full bg-[#1C1C1E]/20 min-h-[150px] border-b md:border-b-0 border-zinc-800/50"
                onDragOver={handleDragOver} onDrop={(e) => handleDropOnDay(e, index)}>
                {/* Day Header */}
                <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-[#1C1C1E]/80 backdrop-blur-sm sticky top-0 z-20">
                  <span className="font-bold text-zinc-500 uppercase text-[10px] tracking-widest">{dayName}</span>
                  <button onClick={() => handleAddSession(index)}
                    className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-[#00FF00] hover:bg-zinc-700 transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
                {/* Sessions */}
                <div className="p-3 space-y-3 flex-1">
                  {daySessions.map((session) => (
                    <div key={session.id} onClick={() => setEditingSession(session)} draggable
                      onDragStart={(e) => handleDragStart(e, session)}
                      className={`bg-[#1C1C1E] p-4 rounded-2xl border border-zinc-800 hover:border-[#00FF00] group transition-all cursor-pointer shadow-lg relative flex flex-col gap-2 hover:-translate-y-0.5
                        ${draggedSessionId === session.id ? 'opacity-30 border-dashed border-zinc-500 scale-95' : ''}
                      `}>
                      <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); handleDuplicateSession(session); }}
                          className="p-1.5 bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors" title="Kopieren">
                          <Copy size={12} />
                        </button>
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm line-clamp-2 pr-2 leading-tight">{session.title}</h4>
                        {session.description && <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{session.description}</p>}
                      </div>
                      {session.workoutData && session.workoutData.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {session.workoutData.map((block: any) => (
                            <span key={block.id || Math.random()} className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                              {block.name || 'Block'}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-[10px] text-zinc-600 font-bold flex items-center gap-1">
                          <ClipboardList size={10} /> {session.workoutData?.reduce((acc: number, b: any) => acc + (b.exercises?.length || 0), 0) || 0} Ex
                        </span>
                        <button onClick={(e) => { e.stopPropagation(); requestDeleteSession(session.id); }}
                          className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {daySessions.length === 0 && (
                    <div onClick={() => handleAddSession(index)}
                      className="h-full min-h-[60px] flex items-center justify-center text-zinc-800 hover:text-zinc-600 cursor-pointer transition-colors border-2 border-dashed border-transparent hover:border-zinc-800 rounded-2xl m-1">
                      <Plus size={24} className="opacity-50" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-screen Session Editor (DraftSessionBuilder) */}
      {editingSession && activeWeek && (
        <DraftSessionBuilder
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSave={handleSessionEditorSave}
        />
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
                  {templates.map(tmpl => (
                    <button key={tmpl.id} onClick={() => importTemplate(tmpl.id)}
                      className="w-full text-left bg-zinc-900 hover:bg-zinc-800 rounded-xl p-3 transition-colors">
                      <p className="text-white font-bold text-sm">{tmpl.name}</p>
                      {tmpl.description && <p className="text-zinc-500 text-xs mt-0.5">{tmpl.description}</p>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-zinc-800">
              <p className="text-zinc-600 text-[10px]">
                <AlertTriangle size={10} className="inline mr-1" />
                Vorlage wird als Basis geladen. Änderungen betreffen nur diesen Athleten.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Plan Meta Editor Modal */}
      {editingMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#1C1C1E] border border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white">Plan bearbeiten</h3>
              <button onClick={() => setEditingMeta(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Plan-Name</label>
                <input className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00] placeholder-zinc-700"
                  value={planName} onChange={e => setPlanName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Beschreibung</label>
                <textarea className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00] h-32 resize-none placeholder-zinc-700"
                  value={planDesc} onChange={e => setPlanDesc(e.target.value)} />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Startdatum</label>
                <input type="date" className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-[#00FF00]"
                  value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
            </div>
            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/30 rounded-b-3xl">
              <button onClick={() => setEditingMeta(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700">Abbrechen</button>
              <button onClick={() => { setEditingMeta(false); markDirty(); }} className="px-4 py-2 bg-[#00FF00] text-black rounded-xl font-bold flex items-center gap-2 hover:bg-[#00DD00]">
                <Save size={18} /> Übernehmen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating save bar */}
      {dirty && (
        <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-700 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-3 z-30 shadow-2xl">
          <span className="text-yellow-400 flex items-center gap-1"><AlertTriangle size={14} /> Entwurf nicht gespeichert</span>
          <button onClick={handleSave} disabled={saving}
            className="bg-[#00FF00] text-black px-4 py-1.5 rounded-xl hover:bg-[#00DD00] flex items-center gap-1">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Speichert...' : 'Entwurf speichern'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AthletePlanEditor;
