import React, { useState, useEffect } from 'react';
import { getWeeksByPlan, getSessionsByWeek, createWeek, createSession, deleteWeek, deleteSession, updateWeek, updateSession, updatePlan } from '../../services/supabase';
import { TrainingPlan, TrainingWeek, TrainingSession } from '../../types';
import Button from '../Button';
import Input from '../Input';
import ConfirmationModal from '../ConfirmationModal';
import SessionBuilder from './SessionBuilder';
import LibrarySelectorV2, { LibraryMode } from './LibrarySelectorV2';
import { useLanguage } from '../../context/LanguageContext';
import { ChevronLeft, Plus, Trash2, X, Save, Pencil, GripVertical, Copy, ClipboardList, Calendar, Lock, AlertTriangle, Moon } from 'lucide-react';
import SessionPreviewCard from './SessionPreviewCard';
import { useAuth } from '../../context/AuthContext';

interface PlanEditorProps {
  plan: TrainingPlan;
  onBack: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PlanEditor: React.FC<PlanEditorProps> = ({ plan: initialPlan, onBack }) => {
  const { t } = useLanguage();
  const { user, userProfile } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<TrainingPlan>(initialPlan);
  // Check if this is a system plan (read-only for non-owners)
  const isSystemPlan = (currentPlan as any).is_system_plan || (currentPlan as any).isSystemPlan;
  const planCoachId = (currentPlan as any).coach_id || currentPlan.coachId;
  const isOwner = user?.id === planCoachId;
  const isAdmin = userProfile?.role === 'ADMIN';
  
  // Admins can always edit. System plans are read-only only for non-admin non-owners.
  const isReadOnly = isSystemPlan && !isOwner && !isAdmin && planCoachId !== undefined;
  const [weeks, setWeeks] = useState<TrainingWeek[]>([]);
  const [activeWeek, setActiveWeek] = useState<TrainingWeek | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals State
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(null);
  const [editingPlanMeta, setEditingPlanMeta] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', description: '' });

  // Library Selector State
  const [librarySelector, setLibrarySelector] = useState<{ isOpen: boolean; mode: LibraryMode; dayIndex?: number }>({
      isOpen: false,
      mode: 'week'
  });

  // Confirmation State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'week' | 'session' | null;
    id: string | null;
  }>({ isOpen: false, type: null, id: null });

  // Drag State
  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null);
  const [draggedWeekId, setDraggedWeekId] = useState<string | null>(null);

  // Load Weeks
  useEffect(() => {
    const fetchWeeks = async () => {
      if (!currentPlan.id) return;
      try {
        const data = await getWeeksByPlan(currentPlan.id);
        const fetchedWeeks = data.map((d: any) => ({ id: d.id, planId: d.plan_id, order: d.order, focus: d.focus, restDays: d.rest_days || [] } as TrainingWeek));
        setWeeks(fetchedWeeks);
        if (fetchedWeeks.length > 0 && !activeWeek) {
          setActiveWeek(fetchedWeeks[0]);
        }
      } catch (error) {
        console.error("Error fetching weeks", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWeeks();
  }, [currentPlan.id]);

  // Load Sessions for Active Week
  useEffect(() => {
    const fetchSessions = async () => {
      if (!currentPlan.id || !activeWeek) {
        setSessions([]);
        return;
      }
      try {
        const data = await getSessionsByWeek(activeWeek.id);
        const fetchedSessions = data.map((d: any) => ({
          id: d.id, weekId: d.week_id, dayOfWeek: d.day_of_week, title: d.title,
          description: d.description, order: d.order, workoutData: d.workout_data
        } as TrainingSession));
        
        fetchedSessions.sort((a, b) => {
          if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
          return a.order - b.order;
        });

        setSessions(fetchedSessions);
      } catch (error) {
        console.error("Error fetching sessions", error);
      }
    };
    fetchSessions();
  }, [currentPlan.id, activeWeek]);

  useEffect(() => {
    if (editingPlanMeta) {
      setPlanForm({
        name: currentPlan.name,
        description: currentPlan.description || ''
      });
    }
  }, [editingPlanMeta, currentPlan]);

  // --- PLAN METADATA ACTIONS ---
  const handleUpdatePlanMeta = async () => {
    try {
      await updatePlan(currentPlan.id, {
        name: planForm.name,
        description: planForm.description
      });
      setCurrentPlan({ ...currentPlan, name: planForm.name, description: planForm.description });
      setEditingPlanMeta(false);
    } catch (error) {
      console.error("Error updating plan:", error);
    }
  };

  // --- WEEK ACTIONS ---
  const handleAddWeek = async () => {
      setLibrarySelector({ isOpen: true, mode: 'week' });
  };

  const handleCreateNewWeek = async () => {
    if (isReadOnly) return;
    const nextOrder = weeks.length + 1;
    try {
      const newWeekData = await createWeek({
        plan_id: currentPlan.id,
        order: nextOrder,
        focus: `Week ${nextOrder}`
      });
      const newWeek = { id: newWeekData.id, planId: currentPlan.id, order: nextOrder, focus: `Week ${nextOrder}` };
      setWeeks([...weeks, newWeek]);
      setActiveWeek(newWeek);
      setLibrarySelector({ isOpen: false, mode: 'week' });
    } catch (error) {
      console.error("Error adding week", error);
    }
  };

  const handleImportWeek = async (weekData: any) => {
      if (isReadOnly) return;
      const nextOrder = weeks.length + 1;
      try {
          // Create new week via Supabase
          const newWeekData = await createWeek({
              plan_id: currentPlan.id,
              order: nextOrder,
              focus: `${weekData.focus || 'Week'} (Copy)`
          });

          // If importing from existing week with sessions, copy them too
          if (weekData.planId && weekData.id) {
             const existingSessions = await getSessionsByWeek(weekData.id);
             for (const sData of existingSessions) {
                 await createSession({
                     week_id: newWeekData.id,
                     day_of_week: sData.day_of_week,
                     title: sData.title,
                     description: sData.description,
                     order: sData.order,
                     workout_data: sData.workout_data
                 });
             }
          }

          const newWeek = { id: newWeekData.id, planId: currentPlan.id, order: nextOrder, focus: newWeekData.focus };
          setWeeks([...weeks, newWeek]);
          setActiveWeek(newWeek);
          setLibrarySelector({ isOpen: false, mode: 'week' });

      } catch(error) {
          console.error("Error importing week", error);
      }
  };

  const requestDeleteWeek = () => {
    if(activeWeek) setConfirmModal({ isOpen: true, type: 'week', id: activeWeek.id });
  };

  const confirmDeleteWeek = async () => {
    if (!activeWeek || !confirmModal.id || isReadOnly) return;
    try {
      await deleteWeek(activeWeek.id);
      const updatedWeeks = weeks.filter(w => w.id !== activeWeek.id);
      setWeeks(updatedWeeks);
      setActiveWeek(updatedWeeks.length > 0 ? updatedWeeks[0] : null);
    } catch (error) {
      console.error("Error deleting week", error);
    } finally {
        setConfirmModal({ isOpen: false, type: null, id: null });
    }
  };

  const handleDuplicateWeek = async () => {
      if(!activeWeek) return;
      handleImportWeek({ ...activeWeek, planId: currentPlan.id });
  };

  const handleUpdateWeekFocus = async (newFocus: string) => {
    if(!activeWeek || isReadOnly) return;
    if(newFocus !== activeWeek.focus) {
        try {
            await updateWeek(activeWeek.id, { focus: newFocus });
            setWeeks(weeks.map(w => w.id === activeWeek.id ? {...w, focus: newFocus} : w));
            setActiveWeek({...activeWeek, focus: newFocus});
        } catch(error) {
            console.error("Error updating focus", error);
        }
    }
  };

  const handleWeekDragStart = (e: React.DragEvent, weekId: string) => {
    setDraggedWeekId(weekId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleWeekDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
  };

  const handleWeekDrop = async (e: React.DragEvent, targetWeekId: string) => {
      e.preventDefault();
      if (!draggedWeekId || draggedWeekId === targetWeekId) return;
      const draggedIndex = weeks.findIndex(w => w.id === draggedWeekId);
      const targetIndex = weeks.findIndex(w => w.id === targetWeekId);
      if (draggedIndex === -1 || targetIndex === -1) return;
      const newWeeks = [...weeks];
      const [movedWeek] = newWeeks.splice(draggedIndex, 1);
      newWeeks.splice(targetIndex, 0, movedWeek);
      const updatedWeeks = newWeeks.map((w, index) => ({ ...w, order: index + 1 }));
      setWeeks(updatedWeeks);
      setDraggedWeekId(null);
      if (isReadOnly) return;
      try {
          const promises = updatedWeeks.map(w => 
              updateWeek(w.id, { order: w.order })
          );
          await Promise.all(promises);
      } catch (error) {
          console.error("Failed to reorder weeks", error);
      }
  };

  // --- REST DAY TOGGLE ---
  const handleToggleRestDay = async (dayIndex: number) => {
    if (!activeWeek || isReadOnly) return;
    const current = activeWeek.restDays || [];
    const updated = current.includes(dayIndex)
      ? current.filter(d => d !== dayIndex)
      : [...current, dayIndex];
    const updatedWeek = { ...activeWeek, restDays: updated };
    setActiveWeek(updatedWeek);
    setWeeks(weeks.map(w => w.id === activeWeek.id ? updatedWeek : w));
    try {
      await updateWeek(activeWeek.id, { rest_days: updated });
    } catch (error) {
      console.error('Error toggling rest day', error);
    }
  };

  // --- SESSION ACTIONS ---
  const handleAddSession = async (dayIndex: number) => {
    if (!activeWeek) return;
    setLibrarySelector({ isOpen: true, mode: 'session', dayIndex });
  };

  const handleCreateNewSession = async () => {
    if (!activeWeek || typeof librarySelector.dayIndex !== 'number' || isReadOnly) return;
    const dayIndex = librarySelector.dayIndex;
    const daySessions = sessions.filter(s => s.dayOfWeek === dayIndex);
    const maxOrder = daySessions.length > 0 ? Math.max(...daySessions.map(s => s.order)) : 0;
    const title = t('planner.newSession'); 

    try {
      const newSessionData = await createSession({
        week_id: activeWeek.id,
        day_of_week: dayIndex,
        title: title,
        order: maxOrder + 1,
        description: '',
        workout_data: []
      });
      const createdSession = { 
        id: newSessionData.id, 
        weekId: activeWeek.id,
        dayOfWeek: dayIndex,
        title: title,
        order: maxOrder + 1,
        description: '',
        workoutData: []
      };
      setSessions([...sessions, createdSession]);
      setEditingSession(createdSession); 
      setLibrarySelector({ isOpen: false, mode: 'session' });
    } catch (error) {
      console.error("Error adding session", error);
    }
  };

  const handleImportSession = async (sessionData: any) => {
      if (!activeWeek || typeof librarySelector.dayIndex !== 'number' || isReadOnly) return;
      const dayIndex = librarySelector.dayIndex;
      const daySessions = sessions.filter(s => s.dayOfWeek === dayIndex);
      const maxOrder = daySessions.length > 0 ? Math.max(...daySessions.map(s => s.order)) : 0;
      try {
          const created = await createSession({
              week_id: activeWeek.id,
              day_of_week: dayIndex,
              title: sessionData.title || 'Session',
              description: sessionData.description || '',
              order: maxOrder + 1,
              workout_data: sessionData.workoutData || sessionData.workout_data || []
          });
          const newSession = { 
              id: created.id, 
              weekId: activeWeek.id,
              dayOfWeek: dayIndex,
              title: sessionData.title || 'Session',
              description: sessionData.description || '',
              order: maxOrder + 1,
              workoutData: sessionData.workoutData || sessionData.workout_data || []
          };
          setSessions([...sessions, newSession]);
          setLibrarySelector({ isOpen: false, mode: 'session' });
      } catch (error) {
          console.error("Error importing session", error);
      }
  };

  const handleSessionSaveComplete = async () => {
     if (!activeWeek) return;
      try {
        const data = await getSessionsByWeek(activeWeek.id);
        const fetchedSessions = data.map((d: any) => ({
          id: d.id, 
          weekId: d.week_id, 
          dayOfWeek: d.day_of_week, 
          title: d.title,
          description: d.description, 
          order: d.order, 
          workoutData: d.workout_data
        } as TrainingSession));
        fetchedSessions.sort((a, b) => {
          if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
          return a.order - b.order;
        });
        setSessions(fetchedSessions);
      } catch (error) {
        console.error("Error refreshing sessions", error);
      }
  };

  const requestDeleteSession = (sessionId: string) => {
    setConfirmModal({ isOpen: true, type: 'session', id: sessionId });
  };

  const confirmDeleteSession = async () => {
    if (!activeWeek || !confirmModal.id || isReadOnly) return;
    const sessionId = confirmModal.id;
    try {
      await deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      if (editingSession?.id === sessionId) setEditingSession(null);
    } catch (error) {
      console.error("Error deleting session", error);
    } finally {
        setConfirmModal({ isOpen: false, type: null, id: null });
    }
  };

  const handleDuplicateSession = async (session: TrainingSession) => {
      if(!activeWeek || isReadOnly) return;
      const daySessions = sessions.filter(s => s.dayOfWeek === session.dayOfWeek);
      const maxOrder = daySessions.length > 0 ? Math.max(...daySessions.map(s => s.order)) : 0;
      try {
          const created = await createSession({
              week_id: activeWeek.id,
              day_of_week: session.dayOfWeek,
              title: `${session.title} (Copy)`,
              description: session.description || '',
              order: maxOrder + 1,
              workout_data: session.workoutData || []
          });
          const newSession = { 
              id: created.id, 
              weekId: activeWeek.id,
              dayOfWeek: session.dayOfWeek,
              title: `${session.title} (Copy)`,
              description: session.description || '',
              order: maxOrder + 1,
              workoutData: session.workoutData || []
          } as TrainingSession;
          setSessions([...sessions, newSession]);
      } catch (error) {
          console.error("Error duplicating session", error);
      }
  };

  const handleDragStart = (e: React.DragEvent, session: TrainingSession) => {
    e.dataTransfer.setData("sessionId", session.id);
    e.dataTransfer.effectAllowed = "move";
    setDraggedSessionId(session.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnDay = async (e: React.DragEvent, targetDayIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const sessionId = e.dataTransfer.getData("sessionId");
    if (!sessionId || !activeWeek) return;
    const sessionToMove = sessions.find(s => s.id === sessionId);
    if (!sessionToMove) return;
    if (sessionToMove.dayOfWeek !== targetDayIndex) {
        const targetDaySessions = sessions.filter(s => s.dayOfWeek === targetDayIndex);
        const newOrder = targetDaySessions.length > 0 ? Math.max(...targetDaySessions.map(s => s.order)) + 1 : 1;
        const updatedSessions = sessions.map(s => {
            if (s.id === sessionId) {
                return { ...s, dayOfWeek: targetDayIndex, order: newOrder };
            }
            return s;
        });
        setSessions(updatedSessions);
        setDraggedSessionId(null);
        if (isReadOnly) return;
        try {
             await updateSession(sessionId, {
                 day_of_week: targetDayIndex,
                 order: newOrder
             });
        } catch(err) {
            console.error("Failed to persist drag drop", err);
        }
    } else {
        setDraggedSessionId(null);
    }
  };

  const handleDropOnSession = async (e: React.DragEvent, targetSession: TrainingSession) => {
      e.preventDefault();
      e.stopPropagation();
      const draggedId = e.dataTransfer.getData("sessionId");
      if (!draggedId || !activeWeek || draggedId === targetSession.id) return;
      const draggedSession = sessions.find(s => s.id === draggedId);
      if(!draggedSession) return;
      const draggedNewData = { dayOfWeek: targetSession.dayOfWeek, order: targetSession.order };
      const targetNewData = { dayOfWeek: draggedSession.dayOfWeek, order: draggedSession.order };
      const updatedSessions = sessions.map(s => {
          if (s.id === draggedId) return { ...s, ...draggedNewData };
          if (s.id === targetSession.id) return { ...s, ...targetNewData };
          return s;
      });
      updatedSessions.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.order - b.order;
      });
      setSessions(updatedSessions);
      setDraggedSessionId(null);
      if (isReadOnly) return;
      try {
          const p1 = updateSession(draggedId, { day_of_week: draggedNewData.dayOfWeek, order: draggedNewData.order });
          const p2 = updateSession(targetSession.id, { day_of_week: targetNewData.dayOfWeek, order: targetNewData.order });
          await Promise.all([p1, p2]);
      } catch(err) {
          console.error("Failed to swap sessions", err);
      }
  };

  if (loading) return <div className="text-zinc-500">{t('common.loading')}</div>;

  return (
    <div className="space-y-6 h-full min-h-[calc(100vh-140px)] flex flex-col relative animate-in fade-in">
      <ConfirmationModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'week' ? t('planner.deleteWeekConfirmTitle') : t('planner.deleteSessionConfirmTitle')}
        message={
            confirmModal.type === 'week' 
            ? t('planner.deleteWeekConfirmMessage')
            : t('planner.deleteSessionConfirmMessage')
        }
        confirmText={t('common.yesDelete')}
        cancelText={t('common.cancel')}
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

      {/* Read-Only Banner */}
      {isReadOnly && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
          <Lock size={20} />
          <div>
            <p className="font-semibold">Nur-Lesen-Modus</p>
            <p className="text-sm opacity-80">Dies ist ein System-Plan und kann nicht bearbeitet werden. Du kannst ihn duplizieren, um eine eigene Version zu erstellen.</p>
          </div>
          <button 
            onClick={handleDuplicateWeek}
            className="ml-auto px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-sm font-medium transition-colors"
          >
            Plan duplizieren
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 border-b border-zinc-800 pb-6 justify-between shrink-0">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={onBack} className="p-3 bg-[#1C1C1E] rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1 min-w-0">
              <div className={`flex items-center gap-3 group ${isReadOnly ? '' : 'cursor-pointer'}`} onClick={() => !isReadOnly && setEditingPlanMeta(true)}>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white group-hover:text-[#00FF00] transition-colors tracking-tight truncate">
                    {currentPlan.name}
                  </h2>
                  {isSystemPlan && (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-bold rounded uppercase">
                      System
                    </span>
                  )}
                  {!isReadOnly && <Pencil size={18} className="text-zinc-600 group-hover:text-[#00FF00] opacity-0 group-hover:opacity-100 transition-all shrink-0" />}
              </div>
              <p className="text-sm text-zinc-500 line-clamp-1 mt-1">{currentPlan.description || "No description provided."}</p>
            </div>
        </div>
        {isReadOnly && (
          <div className="hidden md:block px-4 py-2 bg-amber-500/10 rounded-full border border-amber-500/30">
             <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
               Nur Lesen
             </span>
          </div>
        )}
      </div>

      {/* Week Navigation */}
      <div className="flex flex-col gap-4">
         {/* Week Tabs */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide flex-1">
            {weeks.map((week) => (
                <div
                    key={week.id}
                    draggable
                    onDragStart={(e) => handleWeekDragStart(e, week.id)}
                    onDragOver={handleWeekDragOver}
                    onDrop={(e) => handleWeekDrop(e, week.id)}
                    className="relative group/week flex-shrink-0"
                >
                    <button
                        onClick={() => setActiveWeek(week)}
                        className={`flex flex-col items-start px-5 py-3 rounded-2xl min-w-[140px] transition-all border cursor-grab active:cursor-grabbing shadow-lg
                            ${activeWeek?.id === week.id 
                            ? 'bg-[#00FF00] text-black border-[#00FF00] scale-105 z-10' 
                            : 'bg-[#1C1C1E] text-zinc-400 border-zinc-800 hover:border-zinc-600'
                            }
                            ${draggedWeekId === week.id ? 'opacity-30 border-dashed' : ''}
                        `}
                    >
                        <span className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${activeWeek?.id === week.id ? 'text-black/60' : 'text-zinc-600'}`}>
                        {t('planner.week')} {week.order}
                        </span>
                        <span className="font-bold text-sm truncate w-full text-left">
                            {week.focus || `Focus ${week.order}`}
                        </span>
                    </button>
                </div>
            ))}
            <button 
                onClick={handleAddWeek}
                className="h-[64px] w-[64px] flex items-center justify-center bg-[#1C1C1E] border border-zinc-800 text-zinc-500 hover:text-[#00FF00] hover:border-[#00FF00] rounded-2xl transition-all shrink-0 hover:shadow-[0_0_15px_rgba(0,255,0,0.15)] flex-shrink-0"
                title="Add New Week"
            >
                <Plus size={28} />
            </button>
            </div>
            
            {activeWeek && (
            <div className="flex items-center gap-1 ml-4 border-l border-zinc-800 pl-4 hidden md:flex">
                <button
                    onClick={handleDuplicateWeek}
                    className="p-3 bg-[#1C1C1E] rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                    <Copy size={20} />
                </button>
                <button 
                    onClick={requestDeleteWeek}
                    className="p-3 bg-[#1C1C1E] rounded-xl text-zinc-500 hover:text-red-500 hover:bg-zinc-800 transition-colors"
                >
                    <Trash2 size={20} />
                </button>
            </div>
            )}
        </div>

        {/* Week Focus Input */}
        {activeWeek && (
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-[#1C1C1E] px-6 py-4 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-colors shadow-sm">
            <span className="text-[#00FF00] text-xs font-bold uppercase tracking-widest whitespace-nowrap">Week Focus</span>
            <input 
                className="bg-transparent text-white focus:outline-none flex-1 font-bold text-lg placeholder-zinc-700 w-full"
                placeholder="e.g. Volume Accumulation..."
                value={activeWeek.focus || ''}
                onChange={(e) => {
                    const newFocus = e.target.value;
                    setWeeks(weeks.map(w => w.id === activeWeek.id ? {...w, focus: newFocus} : w));
                    setActiveWeek({...activeWeek, focus: newFocus});
                }}
                onBlur={(e) => handleUpdateWeekFocus(e.target.value)}
            />
             <div className="flex items-center justify-end gap-2 md:hidden pt-2 border-t border-zinc-800">
                 <button
                    onClick={handleDuplicateWeek}
                    className="p-2 text-zinc-500 hover:text-white bg-zinc-900 rounded-lg"
                >
                    <Copy size={18} />
                </button>
                 <button 
                    onClick={requestDeleteWeek}
                    className="p-2 text-zinc-500 hover:text-red-500 bg-zinc-900 rounded-lg"
                >
                    <Trash2 size={18} />
                </button>
             </div>
            </div>
        )}
      </div>

      {/* Weekly Schedule Grid */}
      <div className="flex-1 bg-[#000000] rounded-3xl border border-zinc-800 select-none shadow-2xl overflow-hidden flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-7 h-full overflow-y-auto md:divide-x divide-zinc-800 scrollbar-hide">
          {DAYS.map((dayName, index) => {
            const daySessions = sessions.filter(s => s.dayOfWeek === index);
            const isRestDay = (activeWeek?.restDays || []).includes(index);
            
            return (
              <div 
                key={dayName} 
                className={`flex flex-col h-auto md:h-full min-h-[150px] border-b md:border-b-0 border-zinc-800/50 transition-colors ${isRestDay ? 'bg-zinc-900/60' : 'bg-[#1C1C1E]/20'}`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropOnDay(e, index)}
              >
                {/* Day Header */}
                <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-[#1C1C1E]/80 backdrop-blur-sm sticky top-0 z-20">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold uppercase text-[10px] tracking-widest ${isRestDay ? 'text-blue-400' : 'text-zinc-500'}`}>{dayName}</span>
                    {isRestDay && <span className="text-[8px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded font-bold">REST</span>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleRestDay(index)}
                      className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${isRestDay ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-zinc-800 text-zinc-600 hover:text-zinc-400 hover:bg-zinc-700'}`}
                      title={isRestDay ? 'Ruhetag deaktivieren' : 'Als Ruhetag markieren'}
                    >
                      <Moon size={12} />
                    </button>
                    {!isRestDay && (
                      <button 
                        onClick={() => handleAddSession(index)}
                        className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-[#00FF00] hover:bg-zinc-700 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sessions List */}
                <div className="p-3 space-y-3 flex-1">
                  {daySessions.map((session) => (
                    <div 
                      key={session.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, session)}
                      onDrop={(e) => handleDropOnSession(e, session)}
                    >
                      <SessionPreviewCard
                        title={session.title}
                        workoutData={session.workoutData}
                        onClick={() => setEditingSession(session)}
                        onDuplicate={() => handleDuplicateSession(session)}
                        onDelete={() => requestDeleteSession(session.id)}
                        isDragging={draggedSessionId === session.id}
                      />
                    </div>
                  ))}
                  
                  {daySessions.length === 0 && !isRestDay && (
                     <div 
                      onClick={() => handleAddSession(index)}
                      className="h-full min-h-[60px] flex items-center justify-center text-zinc-800 hover:text-zinc-600 cursor-pointer transition-colors border-2 border-dashed border-transparent hover:border-zinc-800 rounded-2xl m-1"
                     >
                       <Plus size={24} className="opacity-50" />
                     </div>
                  )}
                  {isRestDay && daySessions.length === 0 && (
                    <div className="h-full min-h-[60px] flex flex-col items-center justify-center text-blue-400/40 gap-1">
                      <Moon size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Ruhetag</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editingSession && activeWeek && (
        <SessionBuilder 
          planId={currentPlan.id}
          weekId={activeWeek.id}
          session={editingSession}
          onClose={() => setEditingSession(null)}
          onSaveComplete={handleSessionSaveComplete}
        />
      )}

      {editingPlanMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-[#1C1C1E] border border-zinc-800 w-full max-w-md rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <h3 className="text-xl font-bold text-white">{t('planner.editPlanDetails')}</h3>
              <button onClick={() => setEditingPlanMeta(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <Input 
                label={t('planner.planName')} 
                value={planForm.name} 
                onChange={(e) => setPlanForm({...planForm, name: e.target.value})}
                autoFocus
              />
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">{t('planner.description')}</label>
                <textarea 
                  className="w-full bg-[#121212] border border-transparent text-white rounded-xl px-4 py-3 focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00] h-32 resize-none placeholder-zinc-700"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({...planForm, description: e.target.value})}
                />
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/30 rounded-b-3xl">
              <Button variant="secondary" onClick={() => setEditingPlanMeta(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleUpdatePlanMeta} className="flex items-center gap-2">
                <Save size={18} /> {t('planner.updatePlan')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanEditor;