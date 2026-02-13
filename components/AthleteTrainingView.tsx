import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase, getAssignedPlans, getExercises, autoTrackStrengthGoals, autoTrackConsistencyGoals } from '../services/supabase';
import { ChevronLeft, ChevronRight, Plus, Check, Play, Dumbbell, X, ChevronDown, ChevronUp, Search, Trash2, Trophy, Repeat, Link, Layers, Timer, Square, Pause, ClipboardList, Pencil, CheckCircle, Bookmark, Lock, Zap, TrendingUp, ShoppingBag } from 'lucide-react';
import Button from './Button';
import { Exercise, BlockType, WorkoutSet, WorkoutExercise, WorkoutBlock } from '../types';

interface DayWorkout {
  id: string;
  date: string;
  planName: string;
  sessionTitle: string;
  workoutData: WorkoutBlock[];
  isCustom: boolean;
  completed: boolean;
  duration?: number; // in seconds
  completedAt?: string;
}

interface ExerciseHistory {
  date: string;
  sets: { reps: string; weight: string }[];
}

const BLOCK_TYPE_ICONS: Record<BlockType, React.ReactNode> = {
  'Normal': <Layers size={14} />,
  'Superset': <Link size={14} />,
  'Circuit': <Repeat size={14} />
};

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  'Normal': 'Normal',
  'Superset': 'Supersatz',
  'Circuit': 'Zirkel'
};

const DAYS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const DAYS_FULL = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

const AthleteTrainingView: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });
  
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const today = new Date();
    return (today.getDay() + 6) % 7; // Monday = 0
  });
  
  const [workouts, setWorkouts] = useState<Record<string, DayWorkout[]>>({});
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Block-based active tracking (instead of session-based)
  const [activeBlocks, setActiveBlocks] = useState<Set<string>>(new Set()); // Active block IDs
  const [blockTimers, setBlockTimers] = useState<Record<string, { startTime: Date; elapsed: number }>>({});
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Rest timer - tracks which set triggered it
  const [restTimer, setRestTimer] = useState<{ active: boolean; seconds: number; preset: number; afterSetId: string | null }>({ active: false, seconds: 0, preset: 90, afterSetId: null });
  const restInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Add exercise modal - which session/block to add to
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<{ sessionId: string; blockId?: string } | null>(null);
  const [showBlockTypeModal, setShowBlockTypeModal] = useState<{ sessionId: string; blockId: string } | null>(null);
  const [editingSessionName, setEditingSessionName] = useState<string | null>(null);
  const [editingBlockName, setEditingBlockName] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Current block being built (for adding multiple exercises to same block)
  const [currentBlockId, setCurrentBlockId] = useState<string | null>(null);
  const [currentBlockType, setCurrentBlockType] = useState<BlockType>('Normal');
  const [addedExerciseIds, setAddedExerciseIds] = useState<Set<string>>(new Set());
  
  // Exercise selection
  const [exerciseLibrary, setExerciseLibrary] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  // Exercise history cache
  const [exerciseHistory, setExerciseHistory] = useState<Record<string, { lastSets: { reps: string; weight: string }[]; pb: { weight: string; reps: string } | null }>>({});
  
  // Video preview
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  
  // Move session modal
  const [moveModal, setMoveModal] = useState<{ workoutId: string; currentDate: string } | null>(null);
  const [moveTargetDate, setMoveTargetDate] = useState('');
  
  // Confirmation dialog for starting session while another is active
  const [startConfirm, setStartConfirm] = useState<{ workoutId: string; blockId: string } | null>(null);
  
  // Assigned programs state
  const [assignedPlans, setAssignedPlans] = useState<any[]>([]);

  // Get week dates
  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      return date;
    });
  }, [currentWeekStart]);

  const selectedDate = weekDates[selectedDayIndex];
  const selectedDateKey = selectedDate.toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      loadWorkouts();
    }
  }, [user, currentWeekStart]);

  const loadWorkouts = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Load assigned plans with scheduled sessions
      const assignedPlans = await getAssignedPlans(user.id);
      setAssignedPlans(assignedPlans);
      
      // Load ALL scheduled workouts for the week (both custom and plan-based completion records)
      const { data: scheduleEntries } = await supabase
        .from('athlete_schedule')
        .select('*')
        .eq('athlete_id', user.id)
        .gte('date', weekDates[0].toISOString().split('T')[0])
        .lte('date', weekDates[6].toISOString().split('T')[0]);

      // Build a lookup: "planId-sessionId-date" → completed status from athlete_schedule
      const completionLookup = new Map<string, { completed: boolean; id: string; workoutData: any; duration?: number; completedAt?: string }>();
      (scheduleEntries || []).forEach((entry: any) => {
        // For plan-based entries, use plan_id + session reference as key
        if (entry.plan_id) {
          const key = `${entry.plan_id}-${entry.date}`;
          completionLookup.set(key, {
            completed: entry.completed || false,
            id: entry.id,
            workoutData: entry.workout_data,
            duration: entry.duration_seconds,
            completedAt: entry.completed_at,
          });
        }
      });

      const workoutMap: Record<string, DayWorkout[]> = {};
      
      // Process assigned plans
      assignedPlans.forEach((plan: any) => {
        if (plan.schedule && plan.structure?.weeks) {
          Object.entries(plan.schedule).forEach(([dateKey, sessionId]) => {
            // Find the session in the structure
            plan.structure.weeks.forEach((week: any) => {
              week.sessions?.forEach((session: any) => {
                if (session.id === sessionId) {
                  if (!workoutMap[dateKey]) workoutMap[dateKey] = [];
                  // Check completion from athlete_schedule
                  const completionKey = `${plan.original_plan_id || plan.id}-${dateKey}`;
                  const completionRecord = completionLookup.get(completionKey);
                  workoutMap[dateKey].push({
                    id: `${plan.id}-${session.id}`,
                    date: dateKey,
                    planName: plan.plan_name,
                    sessionTitle: session.title || 'Workout',
                    workoutData: completionRecord?.workoutData || session.workoutData || [],
                    isCustom: false,
                    completed: completionRecord?.completed || false,
                    duration: completionRecord?.duration,
                    completedAt: completionRecord?.completedAt,
                  });
                }
              });
            });
          });
        }
      });

      // Process custom workouts (entries without plan_id)
      (scheduleEntries || []).filter((cw: any) => !cw.plan_id).forEach((cw: any) => {
        const dateKey = cw.date;
        if (!workoutMap[dateKey]) workoutMap[dateKey] = [];
        workoutMap[dateKey].push({
          id: cw.id,
          date: dateKey,
          planName: cw.plan_name || 'Custom',
          sessionTitle: cw.session_title || 'Custom Workout',
          workoutData: cw.workout_data || [],
          isCustom: true,
          completed: cw.completed || false,
          duration: cw.duration_seconds,
          completedAt: cw.completed_at,
        });
      });

      setWorkouts(workoutMap);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };

  // Auto-create session when + is clicked (no modal needed)
  const addSession = async () => {
    if (!user) return;
    
    try {
      const existingSessions = workouts[selectedDateKey] || [];
      const sessionNumber = existingSessions.filter(s => s.isCustom).length + 1;
      const defaultTitle = `Session ${sessionNumber}`;
      
      const { data, error } = await supabase
        .from('athlete_schedule')
        .insert({
          athlete_id: user.id,
          date: selectedDateKey,
          plan_name: 'Eigenes Training',
          session_title: defaultTitle,
          workout_data: [],
          completed: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      await loadWorkouts();
      // Auto-open exercise modal for the new session
      if (data) {
        setShowAddExerciseModal({ sessionId: data.id });
      }
    } catch (error) {
      console.error('Error adding session:', error);
    }
  };

  // Update session title
  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    try {
      const { error } = await supabase
        .from('athlete_schedule')
        .update({ session_title: newTitle })
        .eq('id', sessionId);
      
      if (error) throw error;
      setEditingSessionName(null);
      loadWorkouts();
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  // Load exercise library when modal opens
  useEffect(() => {
    if (showAddExerciseModal) {
      loadExerciseLibrary();
    }
  }, [showAddExerciseModal]);

  const loadExerciseLibrary = async () => {
    try {
      const data = await getExercises();
      setExerciseLibrary(data.map((e: any) => ({
        id: e.id,
        name: e.name,
        description: e.description,
        category: e.category,
        difficulty: e.difficulty,
        trackingType: e.tracking_type,
        videoUrl: e.video_url,
        thumbnailUrl: e.thumbnail_url,
        defaultSets: e.default_sets,
        defaultVisibleMetrics: e.default_visible_metrics,
      } as Exercise)));
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  // Filter exercises based on search
  const filteredExercises = useMemo(() => {
    if (!exerciseSearch.trim()) return exerciseLibrary.slice(0, 20);
    const search = exerciseSearch.toLowerCase();
    return exerciseLibrary.filter(e => 
      e.name.toLowerCase().includes(search) || 
      e.category?.toLowerCase().includes(search)
    ).slice(0, 20);
  }, [exerciseLibrary, exerciseSearch]);

  // Add exercise to session - adds to current block or creates one if needed
  const addExerciseToSession = async (exercise: Exercise) => {
    if (!user || !showAddExerciseModal) return;
    
    try {
      const { sessionId, blockId } = showAddExerciseModal;
      const dayWorkouts = workouts[selectedDateKey] || [];
      const session = dayWorkouts.find(w => w.id === sessionId);
      if (!session) return;

      let updatedWorkoutData = [...(session.workoutData || [])];
      
      // Use exercise defaults if available, otherwise fallback to 3 sets
      const defaultSets: WorkoutSet[] = (exercise.defaultSets && exercise.defaultSets.length > 0)
        ? exercise.defaultSets.map(s => ({ ...s, id: `set-${Date.now()}-${Math.random().toString(36).substr(2,5)}` }))
        : Array.from({ length: 3 }, (_, i) => ({
            id: `set-${Date.now()}-${i}`,
            type: 'Normal' as const,
            reps: '10',
            weight: '',
          }));

      const newExercise: WorkoutExercise = {
        id: `ex-${Date.now()}`,
        exerciseId: exercise.id,
        name: exercise.name,
        videoUrl: exercise.videoUrl || undefined,
        visibleMetrics: (exercise.defaultVisibleMetrics as any) || ['reps', 'weight'],
        sets: defaultSets,
      };

      // Determine which block to add to
      const targetBlockId = blockId || currentBlockId;
      
      if (targetBlockId) {
        // Add to existing block
        updatedWorkoutData = updatedWorkoutData.map(block => {
          if (block.id === targetBlockId) {
            return { ...block, exercises: [...block.exercises, newExercise] };
          }
          return block;
        });
      } else {
        // Create first block with selected type
        const newBlockId = `block-${Date.now()}`;
        const newBlock: WorkoutBlock = {
          id: newBlockId,
          name: 'Block A',
          type: currentBlockType,
          exercises: [newExercise]
        };
        updatedWorkoutData.push(newBlock);
        setCurrentBlockId(newBlockId); // Remember this block for subsequent exercises
      }

      const { error } = await supabase
        .from('athlete_schedule')
        .update({ workout_data: updatedWorkoutData })
        .eq('id', sessionId);

      if (error) throw error;

      // Mark exercise as added
      setAddedExerciseIds(prev => new Set([...prev, exercise.id]));
      setExerciseSearch('');
      setSelectedExercise(null);
      loadWorkouts();
    } catch (error) {
      console.error('Error adding exercise:', error);
    }
  };

  // Start a new block (finish current one, start fresh)
  const startNewBlock = () => {
    if (!showAddExerciseModal) return;
    
    const dayWorkouts = workouts[selectedDateKey] || [];
    const session = dayWorkouts.find(w => w.id === showAddExerciseModal.sessionId);
    if (!session) return;
    
    const blockCount = (session.workoutData || []).length;
    const nextLetter = String.fromCharCode(65 + blockCount); // A, B, C...
    
    // Reset current block - next exercise will create a new one
    setCurrentBlockId(null);
    setCurrentBlockType('Normal');
  };

  // Close exercise modal and reset state
  const closeExerciseModal = () => {
    setShowAddExerciseModal(null);
    setSelectedExercise(null);
    setExerciseSearch('');
    setCurrentBlockId(null);
    setCurrentBlockType('Normal');
    setAddedExerciseIds(new Set());
  };

  // Move a custom session to a different date
  const moveSession = async () => {
    if (!moveModal || !moveTargetDate || !user) return;
    try {
      const { error } = await supabase
        .from('athlete_schedule')
        .update({ date: moveTargetDate })
        .eq('id', moveModal.workoutId)
        .eq('athlete_id', user.id);
      if (error) throw error;
      setMoveModal(null);
      setMoveTargetDate('');
      await loadWorkouts();
    } catch (error) {
      console.error('Error moving session:', error);
      alert('Fehler beim Verschieben der Session.');
    }
  };

  // Delete a custom session
  const deleteSession = async (workoutId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('athlete_schedule')
        .delete()
        .eq('id', workoutId)
        .eq('athlete_id', user.id);
      if (error) throw error;
      await loadWorkouts();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  // Wrapper: check if another block is active before starting
  const handleStartBlock = (workoutId: string, blockId: string) => {
    if (activeBlocks.size > 0 && !activeBlocks.has(blockId)) {
      setStartConfirm({ workoutId, blockId });
    } else {
      startBlock(workoutId, blockId);
    }
  };

  // Start block - load history and start timer for this block
  const startBlock = async (workoutId: string, blockId: string) => {
    // Add to active blocks
    setActiveBlocks(prev => new Set([...prev, blockId]));
    setExpandedBlocks(prev => new Set([...prev, blockId]));
    
    // Start block timer
    setBlockTimers(prev => ({
      ...prev,
      [blockId]: { startTime: new Date(), elapsed: 0 }
    }));
    
    // Start global timer interval if not running
    if (!timerInterval.current) {
      timerInterval.current = setInterval(() => {
        setBlockTimers(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(id => {
            updated[id] = { ...updated[id], elapsed: updated[id].elapsed + 1 };
          });
          return updated;
        });
      }, 1000);
    }
    
    // Load exercise history
    const workout = workouts[selectedDateKey]?.find(w => w.id === workoutId);
    const block = workout?.workoutData?.find(b => b.id === blockId);
    const exerciseIds = block?.exercises.map(e => e.exerciseId).filter(Boolean) || [];
    
    if (exerciseIds.length > 0 && user) {
      try {
        const { data: historyData } = await supabase
          .from('workout_logs')
          .select('exercise_id, sets, created_at')
          .eq('athlete_id', user.id)
          .in('exercise_id', exerciseIds)
          .order('created_at', { ascending: false })
          .limit(100);
        
        const historyMap: Record<string, { lastSets: { reps: string; weight: string }[]; pb: { weight: string; reps: string } | null }> = {};
        
        (historyData || []).forEach((log: any) => {
          const exId = log.exercise_id;
          if (!historyMap[exId]) {
            historyMap[exId] = { lastSets: log.sets || [], pb: null };
          }
          (log.sets || []).forEach((set: any) => {
            const weight = parseFloat(set.weight) || 0;
            const reps = parseInt(set.reps) || 0;
            if (weight > 0 && reps > 0) {
              const currentPB = historyMap[exId].pb;
              if (!currentPB || weight > parseFloat(currentPB.weight)) {
                historyMap[exId].pb = { weight: set.weight, reps: set.reps };
              }
            }
          });
        });
        
        setExerciseHistory(prev => ({ ...prev, ...historyMap }));
      } catch (error) {
        console.error('Error loading exercise history:', error);
      }
    }
  };

  // Complete block and save logs
  const completeBlock = async (workoutId: string, blockId: string) => {
    // Stop rest timer if active
    if (restInterval.current) {
      clearInterval(restInterval.current);
      restInterval.current = null;
    }
    setRestTimer({ active: false, seconds: 0, preset: 90, afterSetId: null });
    
    const workout = workouts[selectedDateKey]?.find(w => w.id === workoutId);
    const block = workout?.workoutData?.find(b => b.id === blockId);
    
    if (!block || !user) return;
    
    const blockDuration = blockTimers[blockId]?.elapsed || 0;
    
    try {
      // Save workout log for each exercise in this block
      const logs = block.exercises.map(ex => ({
        athlete_id: user.id,
        exercise_id: ex.exerciseId,
        exercise_name: ex.name,
        sets: ex.sets.map(s => ({
          reps: s.completedReps || s.reps,
          weight: s.completedWeight || s.weight,
        })),
        duration_seconds: blockDuration,
        created_at: new Date().toISOString(),
      }));
      
      if (logs.length > 0) {
        await supabase.from('workout_logs').insert(logs);
      }

      // --- AUTO-TRACK GOALS ---
      // STRENGTH: Extract max weight per exercise for goal tracking
      const exerciseResults = block.exercises
        .filter(ex => ex.exerciseId)
        .map(ex => {
          const maxWeight = Math.max(...ex.sets.map(s => parseFloat(s.completedWeight || s.weight || '0') || 0));
          return { exerciseId: ex.exerciseId!, maxWeight };
        })
        .filter(r => r.maxWeight > 0);

      if (exerciseResults.length > 0) {
        autoTrackStrengthGoals(user.id, exerciseResults);
      }

      // CONSISTENCY: Update session count for this week
      autoTrackConsistencyGoals(user.id);
      
      // Compute updated workout data before state update (avoid race condition)
      const updatedBlocks = workout.workoutData?.map(b => 
        b.id === blockId ? { ...b, isCompleted: true } : b
      ) || [];
      const allCompleted = updatedBlocks.every((b: any) => b.isCompleted);
      const totalDuration = Object.values(blockTimers).reduce<number>((sum, t) => sum + (t as { elapsed: number }).elapsed, 0);

      // Mark block as completed in local state
      setWorkouts(prev => {
        const updated = { ...prev };
        if (updated[selectedDateKey]) {
          updated[selectedDateKey] = updated[selectedDateKey].map(w => {
            if (w.id !== workoutId) return w;
            return { 
              ...w, 
              workoutData: updatedBlocks,
              completed: allCompleted,
              duration: allCompleted ? totalDuration : w.duration,
              completedAt: allCompleted ? new Date().toISOString() : (w as any).completedAt
            };
          });
        }
        return updated;
      });
      
      // Update DB: persist completion state
      if (workout?.isCustom) {
        // Custom workout: update existing athlete_schedule entry
        await supabase
          .from('athlete_schedule')
          .update({ 
            workout_data: updatedBlocks,
            completed: allCompleted,
            duration_seconds: allCompleted ? totalDuration : undefined,
            completed_at: allCompleted ? new Date().toISOString() : undefined,
          })
          .eq('id', workoutId);
      } else {
        // Assigned plan workout: upsert into athlete_schedule for completion tracking
        const [planId, sessionId] = workoutId.split('-');
        await supabase
          .from('athlete_schedule')
          .upsert({
            athlete_id: user.id,
            date: selectedDateKey,
            plan_id: planId,
            plan_name: workout.planName,
            session_title: workout.sessionTitle,
            workout_data: updatedBlocks,
            completed: allCompleted,
            duration_seconds: allCompleted ? totalDuration : null,
            completed_at: allCompleted ? new Date().toISOString() : null,
          }, { onConflict: 'athlete_id,date' });
      }
      
      // Remove from active blocks and auto-start next block
      const currentBlockIdx = workout?.workoutData?.findIndex(b => b.id === blockId) ?? -1;
      const nextBlock = workout?.workoutData?.[currentBlockIdx + 1];
      
      setActiveBlocks(prev => {
        const newSet = new Set(prev);
        newSet.delete(blockId);
        // Auto-start next block if exists
        if (nextBlock && !nextBlock.isCompleted) {
          newSet.add(nextBlock.id);
          setExpandedBlocks(p => new Set([...p, nextBlock.id]));
          setBlockTimers(t => ({ ...t, [nextBlock.id]: { startTime: new Date(), elapsed: 0 } }));
        } else if (newSet.size === 0 && timerInterval.current) {
          // Stop timer if no more active blocks
          clearInterval(timerInterval.current);
          timerInterval.current = null;
        }
        return newSet;
      });
      
      // Clean up completed block timer
      setBlockTimers(prev => {
        const updated = { ...prev };
        delete updated[blockId];
        return updated;
      });
      
    } catch (error) {
      console.error('Error completing block:', error);
    }
  };

  // Check if exercise is complete (all sets done)
  const isExerciseComplete = (exercise: WorkoutExercise) => {
    return exercise.sets?.every(s => s.isCompleted) || false;
  };

  // Check if block is complete (all exercises done)
  const isBlockComplete = (block: WorkoutBlock) => {
    return block.exercises?.every(ex => isExerciseComplete(ex)) || false;
  };

  // Rest timer alert: vibrate + beep when timer expires
  const triggerRestTimerAlert = () => {
    // Vibrate (mobile devices)
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 300]);
    }
    // Audio beep using Web Audio API (no file needed)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.value = 0.3;
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playBeep(880, audioCtx.currentTime, 0.15);
      playBeep(880, audioCtx.currentTime + 0.2, 0.15);
      playBeep(1320, audioCtx.currentTime + 0.4, 0.3);
    } catch (e) {
      // Audio not available, vibration is enough
    }
  };

  // Rest timer functions
  const startRestTimer = (afterSetId: string, seconds?: number) => {
    if (restInterval.current) {
      clearInterval(restInterval.current);
    }
    const preset = seconds || restTimer.preset;
    setRestTimer({ active: true, seconds: preset, preset, afterSetId });
    restInterval.current = setInterval(() => {
      setRestTimer(prev => {
        if (prev.seconds <= 1) {
          if (restInterval.current) clearInterval(restInterval.current);
          triggerRestTimerAlert();
          return { ...prev, active: false, seconds: 0, afterSetId: null };
        }
        return { ...prev, seconds: prev.seconds - 1 };
      });
    }, 1000);
  };

  const stopRestTimer = () => {
    if (restInterval.current) {
      clearInterval(restInterval.current);
      restInterval.current = null;
    }
    setRestTimer(prev => ({ ...prev, active: false, seconds: 0, afterSetId: null }));
  };

  // Add set to exercise (works on workouts directly)
  const addSetToExercise = (workoutId: string, blockId: string, exerciseId: string) => {
    setWorkouts(prev => {
      const updated = { ...prev };
      if (updated[selectedDateKey]) {
        updated[selectedDateKey] = updated[selectedDateKey].map(w => {
          if (w.id !== workoutId) return w;
          return {
            ...w,
            workoutData: w.workoutData?.map(block => {
              if (block.id !== blockId) return block;
              return {
                ...block,
                exercises: block.exercises.map(ex => {
                  if (ex.id !== exerciseId) return ex;
                  const lastSet = ex.sets[ex.sets.length - 1];
                  return {
                    ...ex,
                    sets: [...ex.sets, {
                      id: `set-${Date.now()}`,
                      type: (lastSet?.type || 'Normal') as any,
                      reps: lastSet?.reps || '10',
                      weight: lastSet?.weight || '',
                      rpe: lastSet?.rpe || '',
                      rest: lastSet?.rest || '',
                    }]
                  };
                })
              };
            })
          };
        });
      }
      return updated;
    });
  };
  
  // Add exercise to block (during active block)
  const addExerciseToBlock = (workoutId: string, blockId: string, exercise: Exercise) => {
    const defaultSets: WorkoutSet[] = (exercise.defaultSets && exercise.defaultSets.length > 0)
      ? exercise.defaultSets.map(s => ({ ...s, id: `set-${Date.now()}-${Math.random().toString(36).substr(2,5)}` }))
      : [
          { id: `set-${Date.now()}-1`, type: 'Normal' as const, reps: '10', weight: '' },
          { id: `set-${Date.now()}-2`, type: 'Normal' as const, reps: '10', weight: '' },
          { id: `set-${Date.now()}-3`, type: 'Normal' as const, reps: '10', weight: '' },
        ];
    const newExercise: WorkoutExercise = {
      id: `ex-${Date.now()}`,
      exerciseId: exercise.id,
      name: exercise.name,
      visibleMetrics: (exercise.defaultVisibleMetrics as any) || ['reps', 'weight'],
      sets: defaultSets,
    };
    
    setWorkouts(prev => {
      const updated = { ...prev };
      if (updated[selectedDateKey]) {
        updated[selectedDateKey] = updated[selectedDateKey].map(w => {
          if (w.id !== workoutId) return w;
          return {
            ...w,
            workoutData: w.workoutData?.map(block => {
              if (block.id !== blockId) return block;
              return {
                ...block,
                exercises: [...block.exercises, newExercise]
              };
            })
          };
        });
      }
      return updated;
    });
  };

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update set value (works directly on workouts state)
  const updateSetValue = (workoutId: string, blockId: string, exerciseId: string, setId: string, field: keyof WorkoutSet, value: string) => {
    setWorkouts(prev => {
      const updated = { ...prev };
      if (updated[selectedDateKey]) {
        updated[selectedDateKey] = updated[selectedDateKey].map(w => {
          if (w.id !== workoutId) return w;
          return {
            ...w,
            workoutData: w.workoutData?.map(block => {
              if (block.id !== blockId) return block;
              return {
                ...block,
                exercises: block.exercises.map(ex => {
                  if (ex.id !== exerciseId) return ex;
                  return {
                    ...ex,
                    sets: ex.sets.map(set => {
                      if (set.id !== setId) return set;
                      return { ...set, [field]: value };
                    })
                  };
                })
              };
            })
          };
        });
      }
      return updated;
    });
  };

  // Toggle set completion (works directly on workouts state)
  const toggleSetComplete = (workoutId: string, blockId: string, exerciseId: string, setId: string) => {
    setWorkouts(prev => {
      const updated = { ...prev };
      if (updated[selectedDateKey]) {
        updated[selectedDateKey] = updated[selectedDateKey].map(w => {
          if (w.id !== workoutId) return w;
          return {
            ...w,
            workoutData: w.workoutData?.map(block => {
              if (block.id !== blockId) return block;
              return {
                ...block,
                exercises: block.exercises.map(ex => {
                  if (ex.id !== exerciseId) return ex;
                  return {
                    ...ex,
                    sets: ex.sets.map(set => {
                      if (set.id !== setId) return set;
                      return { ...set, isCompleted: !set.isCompleted };
                    })
                  };
                })
              };
            })
          };
        });
      }
      return updated;
    });
  };

  // Update block name
  const updateBlockName = async (sessionId: string, blockId: string, newName: string) => {
    const dayWorkouts = workouts[selectedDateKey] || [];
    const session = dayWorkouts.find(w => w.id === sessionId);
    if (!session || !session.isCustom) return;
    
    const updatedWorkoutData = session.workoutData.map(block => {
      if (block.id === blockId) {
        return { ...block, name: newName };
      }
      return block;
    });
    
    // Update local state immediately
    setWorkouts(prev => {
      const updated = { ...prev };
      if (updated[selectedDateKey]) {
        updated[selectedDateKey] = updated[selectedDateKey].map(w => 
          w.id === sessionId ? { ...w, workoutData: updatedWorkoutData } : w
        );
      }
      return updated;
    });
    
    // Save to database
    await supabase
      .from('athlete_schedule')
      .update({ workout_data: updatedWorkoutData })
      .eq('id', sessionId);
  };

  // Update block type
  const updateBlockType = async (sessionId: string, blockId: string, newType: BlockType) => {
    const dayWorkouts = workouts[selectedDateKey] || [];
    const session = dayWorkouts.find(w => w.id === sessionId);
    if (!session || !session.isCustom) return;
    
    const updatedWorkoutData = session.workoutData.map(block => {
      if (block.id === blockId) {
        return { ...block, type: newType };
      }
      return block;
    });
    
    try {
      await supabase
        .from('athlete_schedule')
        .update({ workout_data: updatedWorkoutData })
        .eq('id', sessionId);
      
      setShowBlockTypeModal(null);
      loadWorkouts();
    } catch (error) {
      console.error('Error updating block type:', error);
    }
  };

  const selectedDayWorkouts = workouts[selectedDateKey] || [];
  const isToday = new Date().toISOString().split('T')[0] === selectedDateKey;

  // Check if any block in workout is active
  const hasActiveBlock = (workout: DayWorkout) => {
    return workout.workoutData?.some(b => activeBlocks.has(b.id)) || false;
  };
  
  // Get total elapsed time for all active blocks in a workout
  const getWorkoutElapsed = (workout: DayWorkout) => {
    let total = 0;
    workout.workoutData?.forEach(b => {
      if (blockTimers[b.id]) {
        total += blockTimers[b.id].elapsed;
      }
    });
    return total;
  };

  // Format week range for header
  const weekRangeText = `${weekDates[0].getDate()}.${weekDates[0].getMonth() + 1} - ${weekDates[6].getDate()}.${weekDates[6].getMonth() + 1}`;

  // Weekly stats calculation
  const weeklyStats = useMemo(() => {
    let completedSessions = 0;
    let totalSessions = 0;
    let totalDuration = 0;
    let totalSets = 0;
    
    weekDates.forEach(date => {
      const dateKey = date.toISOString().split('T')[0];
      const dayWorkouts = workouts[dateKey] || [];
      totalSessions += dayWorkouts.length;
      
      dayWorkouts.forEach(w => {
        if (w.completed) {
          completedSessions++;
          totalDuration += w.duration || 0;
        }
        w.workoutData?.forEach(block => {
          block.exercises?.forEach(ex => {
            totalSets += ex.sets?.length || 0;
          });
        });
      });
    });
    
    return { completedSessions, totalSessions, totalDuration, totalSets };
  }, [workouts, weekDates]);

  const todayKey = new Date().toISOString().split('T')[0];
  const todayWorkouts = workouts[todayKey] || [];

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* === Today Hero Section === */}
      {!loading && (
        <div className="bg-gradient-to-br from-[#1C1C1E] to-zinc-900 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00FF00]/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{t('training.today')}</p>
            <p className="text-xs text-zinc-400 mb-3">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>

            {(() => {
              const todayUnfinished = todayWorkouts.find(w => !w.completed);
              const todayAny = todayWorkouts[0];

              if (todayUnfinished) {
                return (
                  <div>
                    <h2 className="text-xl font-extrabold text-white mb-1">{todayUnfinished.sessionTitle}</h2>
                    <p className="text-xs text-zinc-500 mb-3">{todayUnfinished.planName} · {t('training.blocks', { count: String(todayUnfinished.workoutData?.length || 0) })}</p>
                    <button
                      onClick={() => {
                        const todayIdx = weekDates.findIndex(d => d.toISOString().split('T')[0] === todayKey);
                        if (todayIdx >= 0) setSelectedDayIndex(todayIdx);
                        const firstBlock = todayUnfinished.workoutData?.[0];
                        if (firstBlock) handleStartBlock(todayUnfinished.id, firstBlock.id);
                      }}
                      className="flex items-center gap-2 px-5 py-3 bg-[#00FF00] text-black rounded-xl font-bold hover:bg-[#00FF00]/90 transition-colors text-sm"
                    >
                      <Play size={18} /> {t('training.startUnit')}
                    </button>
                  </div>
                );
              } else if (todayAny?.completed) {
                return (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#00FF00]/20 flex items-center justify-center">
                      <Check size={24} className="text-[#00FF00]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{t('training.trainingDone')}</h2>
                      <p className="text-xs text-zinc-500">{t('training.sessionCompleted', { name: todayAny.sessionTitle })}</p>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">{t('training.readyToTrain')}</h2>
                    <p className="text-xs text-zinc-500 mb-3">{t('training.modeBEmpty')}</p>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={addSession}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#00FF00] text-black rounded-xl font-bold hover:bg-[#00FF00]/90 transition-colors text-sm"
                      >
                        <Plus size={16} /> {t('training.addSession')}
                      </button>
                      <button
                        onClick={() => window.location.hash = '#/shop'}
                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors text-sm border border-zinc-700"
                      >
                        <ShoppingBag size={16} /> {t('training.discoverPlans')}
                      </button>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}

      {/* Week Navigation */}
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <ChevronLeft size={20} className="text-zinc-400" />
          </button>
          
          <div className="text-center">
            <p className="text-white font-bold">{weekRangeText}</p>
            <p className="text-xs text-zinc-500">
              {currentWeekStart.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          
          <button 
            onClick={() => navigateWeek('next')}
            className="p-2 hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <ChevronRight size={20} className="text-zinc-400" />
          </button>
        </div>

        {/* Day Selector - Mobile */}
        <div className="flex gap-1 md:hidden">
          {weekDates.map((date, i) => {
            const dateKey = date.toISOString().split('T')[0];
            const hasWorkout = (workouts[dateKey] || []).length > 0;
            const isSelected = i === selectedDayIndex;
            const isTodayDate = new Date().toISOString().split('T')[0] === dateKey;
            
            return (
              <button
                key={i}
                onClick={() => setSelectedDayIndex(i)}
                className={`flex-1 py-2 rounded-xl text-center transition-all ${
                  isSelected 
                    ? 'bg-[#00FF00] text-black' 
                    : isTodayDate 
                      ? 'bg-zinc-800 text-white border border-[#00FF00]/50' 
                      : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <p className="text-xs font-bold">{DAYS_DE[i]}</p>
                <p className={`text-lg font-bold ${isSelected ? 'text-black' : ''}`}>{date.getDate()}</p>
                {hasWorkout && !isSelected && (
                  <div className="w-1.5 h-1.5 bg-[#00FF00] rounded-full mx-auto mt-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Day Selector - Tablet/Desktop (shows all days with workouts) */}
        <div className="hidden md:grid md:grid-cols-7 gap-2">
          {weekDates.map((date, i) => {
            const dateKey = date.toISOString().split('T')[0];
            const dayWorkouts = workouts[dateKey] || [];
            const isSelected = i === selectedDayIndex;
            const isTodayDate = new Date().toISOString().split('T')[0] === dateKey;
            
            return (
              <button
                key={i}
                onClick={() => setSelectedDayIndex(i)}
                className={`p-3 rounded-xl transition-all ${
                  isSelected 
                    ? 'bg-[#00FF00] text-black ring-2 ring-[#00FF00] ring-offset-2 ring-offset-[#1C1C1E]' 
                    : isTodayDate 
                      ? 'bg-zinc-800 border border-[#00FF00]/50' 
                      : 'bg-zinc-900 hover:bg-zinc-800'
                }`}
              >
                <p className={`text-xs font-bold ${isSelected ? 'text-black' : 'text-zinc-500'}`}>{DAYS_DE[i]}</p>
                <p className={`text-xl font-bold ${isSelected ? 'text-black' : 'text-white'}`}>{date.getDate()}</p>
                
                {dayWorkouts.length > 0 && !isSelected && (
                  <div className="flex gap-1 justify-center mt-2">
                    {dayWorkouts.slice(0, 3).map(w => (
                      <div 
                        key={w.id}
                        className={`w-1.5 h-1.5 rounded-full ${
                          w.completed ? 'bg-[#00FF00]' : 'bg-zinc-500'
                        }`}
                      />
                    ))}
                    {dayWorkouts.length > 3 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            {DAYS_FULL[selectedDayIndex]}
            {isToday && <span className="text-[#00FF00] ml-2">{t('training.today')}</span>}
          </h2>
          <p className="text-zinc-500 text-sm">
            {selectedDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}
          </p>
        </div>
        
        <button
          onClick={addSession}
          className="flex items-center gap-2 px-4 py-2 bg-[#00FF00] text-black rounded-xl font-bold hover:bg-[#00FF00]/90 transition-colors"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{t('training.session')}</span>
        </button>
      </div>

      {/* Workouts for Selected Day */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">{t('common.loading')}</div>
      ) : selectedDayWorkouts.length === 0 ? (
        <div className="bg-[#1C1C1E] border border-zinc-800 border-dashed rounded-2xl p-6 text-center">
          <Dumbbell size={36} className="mx-auto mb-3 text-zinc-700" />
          <h3 className="text-base font-bold text-white mb-1">{t('training.noTrainingPlanned')}</h3>
          <p className="text-zinc-500 text-xs mb-4">{t('training.emptyDayModeB')}</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button onClick={addSession} className="text-sm">
              <Plus size={16} className="mr-1" /> {t('training.addSession')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {selectedDayWorkouts.map(workout => (
            <div 
              key={workout.id}
              className={`bg-[#1C1C1E] border rounded-2xl overflow-hidden transition-all ${
                workout.completed ? 'border-[#00FF00]/30' : 'border-zinc-800'
              }`}
            >
              {/* Workout Header */}
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">
                      <span className="flex items-center gap-1">{workout.isCustom ? <><Dumbbell size={12} /> Eigenes Training</> : <><ClipboardList size={12} /> {workout.planName}</>}</span>
                    </p>
                    {editingSessionName === workout.id ? (
                      <input
                        type="text"
                        defaultValue={workout.sessionTitle}
                        autoFocus
                        className="text-lg font-bold text-white bg-transparent border-b border-[#00FF00] outline-none w-full"
                        onBlur={(e) => updateSessionTitle(workout.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateSessionTitle(workout.id, (e.target as HTMLInputElement).value);
                          }
                          if (e.key === 'Escape') setEditingSessionName(null);
                        }}
                      />
                    ) : (
                      <h3 
                        className="text-lg font-bold text-white cursor-pointer hover:text-[#00FF00] transition-colors"
                        onClick={() => workout.isCustom && setEditingSessionName(workout.id)}
                      >
                        {workout.sessionTitle}
                        {workout.isCustom && <Pencil size={12} className="text-zinc-600 ml-2 inline" />}
                      </h3>
                    )}
                  </div>
                  
                  {/* Session actions: Move / Delete for custom sessions */}
                  {workout.isCustom && !hasActiveBlock(workout) && (
                    <div className="flex items-center gap-1 mr-2">
                      <button
                        onClick={() => { setMoveModal({ workoutId: workout.id, currentDate: workout.date }); setMoveTargetDate(''); }}
                        className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Session verschieben"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button
                        onClick={() => { if (confirm('Session wirklich löschen?')) deleteSession(workout.id); }}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Session löschen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  {hasActiveBlock(workout) ? (
                    <div className="flex items-center gap-2">
                      <span className="text-orange-400 font-mono text-sm flex items-center gap-1">
                        <Timer size={14} /> {formatTime(getWorkoutElapsed(workout))}
                      </span>
                    </div>
                  ) : workout.completed ? (
                    <button 
                      onClick={() => {
                        // Restart first block to continue training
                        const firstBlock = workout.workoutData?.[0];
                        if (firstBlock) handleStartBlock(workout.id, firstBlock.id);
                      }}
                      className="flex items-center gap-2 text-[#00FF00] hover:bg-[#00FF00]/10 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Check size={18} />
                      <span className="text-sm font-bold">Erledigt</span>
                      {workout.duration && (
                        <span className="text-xs bg-[#00FF00]/20 px-2 py-1 rounded-lg ml-1">
                          {formatTime(workout.duration)}
                        </span>
                      )}
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        // Start first block automatically
                        const firstBlock = workout.workoutData?.[0];
                        if (firstBlock) handleStartBlock(workout.id, firstBlock.id);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-[#00FF00] text-black rounded-xl font-bold hover:bg-[#00FF00]/90 transition-colors"
                    >
                      <Play size={16} /> Start
                    </button>
                  )}
                </div>
                
                {/* Rest Timer Preset - show when any block is active */}
                {hasActiveBlock(workout) && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                    <Timer size={12} className="text-zinc-500" />
                    <span>Pause:</span>
                    {[60, 90, 120, 180].map(sec => (
                      <button
                        key={sec}
                        onClick={() => setRestTimer(prev => ({ ...prev, preset: sec }))}
                        className={`px-1.5 py-0.5 rounded transition-colors ${
                          restTimer.preset === sec 
                            ? 'bg-[#00FF00]/20 text-[#00FF00]' 
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        }`}
                      >
                        {sec < 60 ? `${sec}s` : `${Math.floor(sec/60)}:${(sec%60).toString().padStart(2,'0')}`}
                      </button>
                    ))}
                    <input
                      type="number"
                      inputMode="numeric"
                      value={restTimer.preset}
                      onChange={(e) => setRestTimer(prev => ({ ...prev, preset: Math.max(10, Math.min(600, parseInt(e.target.value) || 90)) }))}
                      className="w-12 bg-zinc-800 border border-zinc-700 rounded px-1 py-0.5 text-center text-white text-xs focus:border-[#00FF00] outline-none"
                      min={10}
                      max={600}
                    />
                    <span className="text-zinc-600">s</span>
                  </div>
                )}
              </div>

              {/* Workout Blocks */}
              <div className="divide-y divide-zinc-800">
                {(workout.workoutData || []).map((block, blockIdx) => {
                  const isExpanded = expandedBlocks.has(block.id);
                  const isBlockActive = activeBlocks.has(block.id);
                  const blockComplete = isBlockComplete(block);
                  const blockType = block.type || 'Normal';
                  
                  return (
                    <div key={block.id} className="bg-zinc-900/50">
                      {/* Block Header */}
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleBlock(block.id)}
                          className="flex-1 p-3 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                              blockType === 'Circuit' ? 'bg-purple-500/20 text-purple-400' :
                              blockType === 'Superset' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-[#00FF00]/10 text-[#00FF00]'
                            }`}>
                              {BLOCK_TYPE_ICONS[blockType]}
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                {editingBlockName === block.id ? (
                                  <input
                                    type="text"
                                    defaultValue={block.name || `Block ${String.fromCharCode(65 + blockIdx)}`}
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                    onBlur={(e) => {
                                      updateBlockName(workout.id, block.id, e.target.value);
                                      setEditingBlockName(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        updateBlockName(workout.id, block.id, (e.target as HTMLInputElement).value);
                                        setEditingBlockName(null);
                                      }
                                      if (e.key === 'Escape') setEditingBlockName(null);
                                    }}
                                    className="font-bold text-white bg-transparent border-b border-[#00FF00] outline-none w-20"
                                  />
                                ) : (
                                  <h4 
                                    className={`font-bold text-white ${workout.isCustom ? 'cursor-pointer hover:text-[#00FF00]' : ''}`}
                                    onClick={(e) => {
                                      if (workout.isCustom) {
                                        e.stopPropagation();
                                        setEditingBlockName(block.id);
                                      }
                                    }}
                                  >
                                    {block.name || `Block ${String.fromCharCode(65 + blockIdx)}`}
                                    {workout.isCustom && <Pencil size={10} className="text-zinc-600 ml-1 inline" />}
                                  </h4>
                                )}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  blockType === 'Circuit' ? 'bg-purple-500/20 text-purple-400' :
                                  blockType === 'Superset' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-zinc-700 text-zinc-400'
                                }`}>
                                  {BLOCK_TYPE_LABELS[blockType]}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-500">
                                {block.exercises?.length || 0} Übungen
                                {blockType === 'Circuit' && block.rounds && ` • ${block.rounds} Runden`}
                              </p>
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp size={20} className="text-zinc-500" /> : <ChevronDown size={20} className="text-zinc-500" />}
                        </button>
                        
                        {/* Block Type Selector for custom sessions */}
                        {workout.isCustom && !isBlockActive && (
                          <>
                            <button
                              onClick={() => setShowBlockTypeModal({ sessionId: workout.id, blockId: block.id })}
                              className="p-2 text-zinc-500 hover:text-white"
                              title="Block-Typ ändern"
                            >
                              <Layers size={16} />
                            </button>
                            {/* Save Block as Template - Paywall Ready */}
                            <button
                              onClick={() => setShowPremiumModal(true)}
                              className="p-2 mr-2 text-zinc-500 hover:text-[#00FF00] relative group"
                              title="Block als Vorlage speichern (Premium)"
                            >
                              <Bookmark size={16} />
                              <Lock size={8} className="absolute -top-0.5 -right-0.5 text-yellow-500" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Block Content */}
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2">
                          {(block.exercises || []).map((exercise, exIdx) => {
                            const history = exerciseHistory[exercise.exerciseId || ''];
                            const pb = history?.pb;
                            const lastSets = history?.lastSets || [];
                            const exerciseComplete = isExerciseComplete(exercise);
                            
                            // Compact summary for completed exercises
                            const getCompactSummary = () => {
                              const sets = exercise.sets || [];
                              const completedSets = sets.filter(s => s.isCompleted);
                              if (completedSets.length === 0) return null;
                              
                              // Group by reps×weight
                              const groups: Record<string, number> = {};
                              completedSets.forEach(s => {
                                const key = `${s.completedReps || s.reps || '?'}×${s.completedWeight || s.weight || '?'}`;
                                groups[key] = (groups[key] || 0) + 1;
                              });
                              
                              return Object.entries(groups).map(([key, count]) => `${count}×${key}kg`).join(', ');
                            };
                            
                            // If exercise is complete and block is not active, show compact view
                            if (exerciseComplete && !isBlockActive) {
                              return (
                                <div 
                                  key={exercise.id} 
                                  className="bg-[#00FF00]/5 border border-[#00FF00]/20 rounded-lg p-2 flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-[#00FF00] rounded-full flex items-center justify-center">
                                      <Check size={14} className="text-black" />
                                    </div>
                                    <p className="font-medium text-white">{exercise.name}</p>
                                  </div>
                                  <span className="text-[#00FF00] font-mono text-sm">{getCompactSummary()}</span>
                                </div>
                              );
                            }
                            
                            return (
                              <div key={exercise.id} className="bg-zinc-900 rounded-lg p-2">
                                {/* Exercise Header with PB */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    {exerciseComplete && (
                                      <div className="w-5 h-5 bg-[#00FF00] rounded-full flex items-center justify-center">
                                        <Check size={12} className="text-black" />
                                      </div>
                                    )}
                                    <p className={`font-medium ${exerciseComplete ? 'text-[#00FF00]' : 'text-white'}`}>{exercise.name}</p>
                                    {exercise.videoUrl && (
                                      <button
                                        onClick={() => setVideoPreview(exercise.videoUrl || null)}
                                        className="p-1 rounded-md hover:bg-zinc-700 text-zinc-500 hover:text-blue-400 transition-colors"
                                        title="Video ansehen"
                                      >
                                        <Play size={12} />
                                      </button>
                                    )}
                                  </div>
                                  {pb && isBlockActive && (
                                    <div className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                                      <Trophy size={12} />
                                      <span>{pb.weight}kg × {pb.reps}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Sets - Metrics-aware layout */}
                                <div className="space-y-2">
                                  {(() => {
                                    const metrics = exercise.visibleMetrics || ['reps', 'weight'];
                                    const hasReps = metrics.includes('reps');
                                    const hasWeight = metrics.includes('weight');
                                    const hasRpe = metrics.includes('rpe');
                                    const hasTime = metrics.includes('time');
                                    const hasDistance = metrics.includes('distance');
                                    const hasTempo = metrics.includes('tempo');
                                    const hasPct1rm = metrics.includes('pct_1rm');

                                    const METRIC_LABELS: Record<string, string> = {
                                      reps: 'Wdh', weight: 'kg', rpe: 'RPE', time: 'Zeit',
                                      distance: 'm', tempo: 'Tempo', pct_1rm: '%1RM',
                                    };

                                    return (exercise.sets || []).map((set, setIdx) => {
                                      const lastSet = lastSets[setIdx];
                                      const hasTarget = !workout.isCustom && (set.reps || set.weight || set.time || set.distance);

                                      return (
                                        <React.Fragment key={set.id}>
                                        <div 
                                          className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                                            set.isCompleted ? 'bg-[#00FF00]/10 ring-1 ring-[#00FF00]/30' : 'bg-zinc-800'
                                          }`}
                                        >
                                          {/* Set Number + Type badge */}
                                          <div className="flex flex-col items-center w-6 shrink-0">
                                            <span className="text-xs font-bold text-zinc-500">{setIdx + 1}</span>
                                            {set.type && set.type !== 'Normal' && (
                                              <span className={`text-[8px] font-bold leading-none mt-0.5 ${
                                                set.type === 'Warmup' ? 'text-yellow-500' : set.type === 'Dropset' ? 'text-purple-400' : 'text-blue-400'
                                              }`}>{set.type === 'Warmup' ? 'W' : set.type === 'Dropset' ? 'D' : 'A'}</span>
                                            )}
                                          </div>
                                          
                                          {/* Target values (coach prescribed) */}
                                          {hasTarget && (
                                            <div className="flex items-center gap-1 text-[11px] text-zinc-500 bg-zinc-700/50 px-2 py-1 rounded shrink-0">
                                              {hasReps && set.reps && <span>{set.reps}</span>}
                                              {hasReps && hasWeight && set.reps && set.weight && <span className="text-zinc-600">×</span>}
                                              {hasWeight && set.weight && <><span>{set.weight}</span><span className="text-[9px]">kg</span></>}
                                              {hasTime && set.time && <span>{set.time}s</span>}
                                              {hasDistance && set.distance && <span>{set.distance}m</span>}
                                              {hasPct1rm && set.pct_1rm && <span>{set.pct_1rm}%</span>}
                                              {hasTempo && set.tempo && <span className="font-mono">{set.tempo}</span>}
                                              {hasRpe && set.rpe && <span className="text-orange-400">@{set.rpe}</span>}
                                            </div>
                                          )}
                                          
                                          {/* Input Fields - during active session */}
                                          {isBlockActive ? (
                                            <div className="flex items-center gap-1 flex-1 flex-wrap">
                                              {hasReps && (
                                                <>
                                                  <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder={set.reps || lastSet?.reps || '10'}
                                                    value={set.completedReps || ''}
                                                    onChange={(e) => updateSetValue(workout.id, block.id, exercise.id, set.id, 'completedReps', e.target.value)}
                                                    className="w-14 bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-white text-center text-sm focus:border-[#00FF00] outline-none"
                                                  />
                                                  <span className="text-zinc-500 text-[10px]">Wdh</span>
                                                </>
                                              )}
                                              {hasReps && hasWeight && <span className="text-zinc-600 mx-0.5">×</span>}
                                              {hasWeight && (
                                                <>
                                                  <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder={set.weight || lastSet?.weight || '0'}
                                                    value={set.completedWeight || ''}
                                                    onChange={(e) => updateSetValue(workout.id, block.id, exercise.id, set.id, 'completedWeight', e.target.value)}
                                                    className="w-16 bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-white text-center text-sm focus:border-[#00FF00] outline-none"
                                                  />
                                                  <span className="text-zinc-500 text-[10px]">kg</span>
                                                </>
                                              )}
                                              {hasTime && (
                                                <>
                                                  <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    placeholder={set.time || '60'}
                                                    value={set.completedTime || ''}
                                                    onChange={(e) => updateSetValue(workout.id, block.id, exercise.id, set.id, 'completedTime', e.target.value)}
                                                    className="w-16 bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-white text-center text-sm focus:border-[#00FF00] outline-none"
                                                  />
                                                  <span className="text-zinc-500 text-[10px]">Sek</span>
                                                </>
                                              )}
                                              {hasDistance && (
                                                <>
                                                  <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder={set.distance || '0'}
                                                    value={set.completedDistance || ''}
                                                    onChange={(e) => updateSetValue(workout.id, block.id, exercise.id, set.id, 'completedDistance', e.target.value)}
                                                    className="w-16 bg-zinc-700 border border-zinc-600 rounded px-2 py-1.5 text-white text-center text-sm focus:border-[#00FF00] outline-none"
                                                  />
                                                  <span className="text-zinc-500 text-[10px]">m</span>
                                                </>
                                              )}
                                              {hasRpe && (
                                                <input
                                                  type="text"
                                                  inputMode="decimal"
                                                  placeholder={set.rpe || 'RPE'}
                                                  value={set.completedRpe || ''}
                                                  onChange={(e) => updateSetValue(workout.id, block.id, exercise.id, set.id, 'completedRpe', e.target.value)}
                                                  className="w-12 bg-orange-500/10 border border-orange-500/30 rounded px-1 py-1.5 text-orange-400 text-center text-sm focus:border-orange-500 outline-none"
                                                />
                                              )}
                                            </div>
                                          ) : (
                                            /* Preview mode - show values based on metrics */
                                            !hasTarget && (
                                              <div className="flex items-center gap-1 text-sm text-zinc-400 flex-wrap">
                                                {hasReps && <span>{set.reps || '10'}</span>}
                                                {hasReps && hasWeight && <span className="text-zinc-600">×</span>}
                                                {hasWeight && <><span>{set.weight || '-'}</span><span className="text-[10px]">kg</span></>}
                                                {hasTime && <span>{set.time || '-'}s</span>}
                                                {hasDistance && <span>{set.distance || '-'}m</span>}
                                                {hasPct1rm && set.pct_1rm && <span className="text-blue-400 text-xs">{set.pct_1rm}%</span>}
                                                {hasTempo && set.tempo && <span className="text-xs font-mono text-zinc-500">{set.tempo}</span>}
                                              </div>
                                            )
                                          )}
                                          
                                          {/* RPE target badge (non-active view) */}
                                          {!isBlockActive && set.rpe && (
                                            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded shrink-0">
                                              RPE {set.rpe}
                                            </span>
                                          )}

                                          {/* Rest badge */}
                                          {set.rest && !isBlockActive && (
                                            <span className="text-[10px] bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded shrink-0">
                                              {set.rest}s
                                            </span>
                                          )}
                                          
                                          {/* Complete Button */}
                                          {isBlockActive && (
                                            <button 
                                              onClick={() => {
                                                toggleSetComplete(workout.id, block.id, exercise.id, set.id);
                                                if (!set.isCompleted) startRestTimer(set.id, set.rest ? parseInt(set.rest) : undefined);
                                              }}
                                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                                                set.isCompleted 
                                                  ? 'bg-[#00FF00] text-black' 
                                                  : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                                              }`}
                                            >
                                              <Check size={16} />
                                            </button>
                                          )}
                                        </div>
                                        
                                        {/* Inline Rest Timer */}
                                        {restTimer.active && restTimer.afterSetId === set.id && (
                                          <div className="flex items-center justify-center gap-3 py-2 bg-orange-500/10 rounded-lg animate-pulse">
                                            <span className="text-orange-400 text-sm flex items-center gap-1"><Timer size={14} /> Pause</span>
                                            <span className="text-white font-mono text-xl font-bold">{formatTime(restTimer.seconds)}</span>
                                            <button 
                                              onClick={stopRestTimer}
                                              className="text-orange-400 hover:text-white text-xs"
                                            >
                                              Überspringen
                                            </button>
                                          </div>
                                        )}
                                      </React.Fragment>
                                      );
                                    });
                                  })()}
                                  
                                  {/* Add Set Button - during active session */}
                                  {isBlockActive && (
                                    <button
                                      onClick={() => addSetToExercise(workout.id, block.id, exercise.id)}
                                      className="w-full p-1.5 border border-dashed border-zinc-700 rounded-lg text-zinc-500 text-xs hover:border-[#00FF00] hover:text-[#00FF00] transition-colors flex items-center justify-center gap-1"
                                    >
                                      <Plus size={12} /> Satz
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Add Exercise to Block Button (for custom sessions) */}
                          {workout.isCustom && !isBlockActive && (
                            <button
                              onClick={() => setShowAddExerciseModal({ sessionId: workout.id, blockId: block.id })}
                              className="w-full p-2 border border-dashed border-zinc-700 rounded-xl text-zinc-500 text-sm hover:border-[#00FF00] hover:text-[#00FF00] transition-colors flex items-center justify-center gap-2"
                            >
                              <Plus size={14} /> Übung zu Block hinzufügen
                            </button>
                          )}
                          
                          {/* Block Action Button */}
                          {isBlockActive ? (
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => completeBlock(workout.id, block.id)}
                                fullWidth
                                variant={blockComplete ? 'primary' : 'secondary'}
                              >
                                {blockComplete ? <><Check size={14} className="mr-1" /> Weiter zum nächsten Block</> : 'Block abschließen'}
                              </Button>
                            </div>
                          ) : block.isCompleted ? (
                            <button 
                              onClick={() => handleStartBlock(workout.id, block.id)}
                              className="w-full p-2 text-[#00FF00] text-sm font-medium hover:bg-[#00FF00]/10 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                              <><CheckCircle size={14} className="mr-1" /> Block erledigt – Erneut bearbeiten?</>
                            </button>
                          ) : (
                            <Button 
                              onClick={() => handleStartBlock(workout.id, block.id)}
                              fullWidth
                              variant="secondary"
                            >
                              <Play size={14} className="mr-2" /> Block starten
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add Block/Exercise button for custom sessions */}
                {workout.isCustom && !hasActiveBlock(workout) && (
                  <button 
                    onClick={() => setShowAddExerciseModal({ sessionId: workout.id })}
                    className="w-full p-4 border-t border-zinc-800 text-[#00FF00] text-sm font-medium hover:bg-zinc-800/50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Neuen Block hinzufügen
                  </button>
                )}

                {/* Empty workout message */}
                {(!workout.workoutData || workout.workoutData.length === 0) && !workout.isCustom && (
                  <div className="p-6 text-center text-zinc-500">
                    <p>Keine Übungen definiert</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Exercise Modal - Improved UX */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-lg">Übungen wählen</h3>
                <button onClick={closeExerciseModal} className="text-zinc-500 hover:text-white p-1">
                  <X size={24} />
                </button>
              </div>
              
              {/* Block Type Selector - Only show if no block created yet */}
              {!currentBlockId && !showAddExerciseModal.blockId && (
                <div className="flex gap-2 mb-3">
                  {(['Normal', 'Superset', 'Circuit'] as BlockType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => setCurrentBlockType(type)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        currentBlockType === type
                          ? type === 'Circuit' ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500' :
                            type === 'Superset' ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500' :
                            'bg-[#00FF00]/20 text-[#00FF00] ring-1 ring-[#00FF00]'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      {BLOCK_TYPE_ICONS[type]}
                      {BLOCK_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Current block info */}
              {(currentBlockId || showAddExerciseModal.blockId) && (
                <div className="bg-zinc-800 rounded-xl p-2 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">
                    Übungen werden zu <span className="text-white font-bold">Block A</span> hinzugefügt
                  </span>
                  <button
                    onClick={startNewBlock}
                    className="text-xs text-[#00FF00] hover:underline"
                  >
                    + Neuer Block
                  </button>
                </div>
              )}
              
              {/* Added count */}
              {addedExerciseIds.size > 0 && (
                <div className="mt-2 text-xs text-[#00FF00]">
                  <span className="flex items-center gap-1"><Check size={12} /> {addedExerciseIds.size} Übung{addedExerciseIds.size > 1 ? 'en' : ''} hinzugefügt</span>
                </div>
              )}
            </div>
            
            {/* Search */}
            <div className="p-4 pb-2 shrink-0">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  placeholder="Übung suchen..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 pl-10 text-white focus:border-[#00FF00] outline-none"
                  autoFocus
                />
              </div>
            </div>
            
            {/* Exercise List */}
            <div className="p-4 pt-2 flex-1 overflow-y-auto">
              <div className="space-y-2">
                {filteredExercises.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-8">Keine Übungen gefunden</p>
                ) : (
                  filteredExercises.map(exercise => {
                    const isAdded = addedExerciseIds.has(exercise.id);
                    
                    return (
                      <button
                        key={exercise.id}
                        onClick={() => !isAdded && addExerciseToSession(exercise)}
                        disabled={isAdded}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                          isAdded
                            ? 'bg-[#00FF00]/10 border-[#00FF00]/30 cursor-default'
                            : 'bg-zinc-900 border-zinc-800 hover:border-[#00FF00] group'
                        }`}
                      >
                        <div>
                          <p className={`font-medium ${isAdded ? 'text-[#00FF00]' : 'text-white group-hover:text-[#00FF00]'}`}>
                            {exercise.name}
                          </p>
                          <p className="text-xs text-zinc-500">{exercise.category} • {exercise.difficulty}</p>
                        </div>
                        {isAdded ? (
                          <div className="text-[#00FF00]">
                            <Check size={20} />
                          </div>
                        ) : (
                          <div className="text-[#00FF00] opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus size={20} />
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-zinc-800 shrink-0">
              <Button onClick={closeExerciseModal} fullWidth>
                {addedExerciseIds.size > 0 ? `Fertig (${addedExerciseIds.size} Übungen)` : 'Schließen'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Block Type Modal */}
      {showBlockTypeModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-white">Block-Typ wählen</h3>
              <button onClick={() => setShowBlockTypeModal(null)} className="text-zinc-500 hover:text-white p-2">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 space-y-2">
              {(['Normal', 'Superset', 'Circuit'] as BlockType[]).map(type => (
                <button
                  key={type}
                  onClick={() => updateBlockType(showBlockTypeModal.sessionId, showBlockTypeModal.blockId, type)}
                  className={`w-full p-4 rounded-xl border transition-all flex items-center gap-3 ${
                    type === 'Circuit' ? 'border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10' :
                    type === 'Superset' ? 'border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/10' :
                    'border-zinc-700 hover:border-[#00FF00] hover:bg-[#00FF00]/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    type === 'Circuit' ? 'bg-purple-500/20 text-purple-400' :
                    type === 'Superset' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-[#00FF00]/10 text-[#00FF00]'
                  }`}>
                    {BLOCK_TYPE_ICONS[type]}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white">{BLOCK_TYPE_LABELS[type]}</p>
                    <p className="text-xs text-zinc-500">
                      {type === 'Normal' && 'Übungen nacheinander ausführen'}
                      {type === 'Superset' && 'Übungen direkt hintereinander ohne Pause'}
                      {type === 'Circuit' && 'Alle Übungen als Zirkel durchlaufen'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Premium Feature Modal - All Premium Features */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-gradient-to-b from-[#1C1C1E] to-black border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl my-4">
            {/* Hero Section */}
            <div className="relative p-6 pb-4 text-center bg-gradient-to-b from-[#00FF00]/10 to-transparent">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M0%200h1v1H0z%22%20fill%3D%22%2300FF00%22%20fill-opacity%3D%22.03%22%2F%3E%3C%2Fsvg%3E')] opacity-50"></div>
              
              <div className="relative">
                <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#00FF00]/20 to-[#00FF00]/5 rounded-2xl flex items-center justify-center border border-[#00FF00]/30 shadow-[0_0_30px_rgba(0,255,0,0.2)]">
                  <Zap size={28} className="text-[#00FF00]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-1">Premium freischalten</h2>
                <p className="text-zinc-400 text-sm">Hol dir Zugang zu allen erweiterten Features</p>
              </div>
            </div>

            {/* All Premium Features */}
            <div className="px-5 py-3">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-3">Was du freischaltest</p>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Block-Vorlagen */}
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Bookmark size={18} className="text-blue-400" />
                  </div>
                  <p className="font-bold text-white text-xs">Block-Vorlagen</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Speichern & wiederverwenden</p>
                </div>

                {/* Analytics & Tracking */}
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <TrendingUp size={18} className="text-purple-400" />
                  </div>
                  <p className="font-bold text-white text-xs">Analytics</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Fortschritt & Statistiken</p>
                </div>

                {/* Personal Records */}
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <Trophy size={18} className="text-yellow-400" />
                  </div>
                  <p className="font-bold text-white text-xs">PR-Tracking</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Persönliche Rekorde</p>
                </div>

                {/* Volumen-Analyse */}
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center">
                  <div className="w-10 h-10 mx-auto mb-2 bg-[#00FF00]/10 rounded-lg flex items-center justify-center">
                    <Layers size={18} className="text-[#00FF00]" />
                  </div>
                  <p className="font-bold text-white text-xs">Volumen-Charts</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Push/Pull/Legs Analyse</p>
                </div>
              </div>
            </div>

            {/* Benefits Summary */}
            <div className="px-5 py-3">
              <div className="flex items-center gap-3 p-3 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
                <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center shrink-0">
                  <Repeat size={16} className="text-orange-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-xs">Spare Zeit & trainiere smarter</p>
                  <p className="text-[10px] text-zinc-500">Nutze datenbasierte Insights für bessere Ergebnisse</p>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="p-5 pt-2 space-y-3">
              <div className="bg-gradient-to-r from-[#00FF00]/10 to-transparent p-3 rounded-xl border border-[#00FF00]/20">
                <p className="text-[10px] text-zinc-400 mb-0.5">Alles inklusive mit einem</p>
                <p className="text-base font-bold text-white flex items-center gap-2">
                  <span className="text-[#00FF00]">Coaching</span> oder <span className="text-[#00FF00]">Premium</span> Paket
                </p>
              </div>

              <button 
                onClick={() => {
                  setShowPremiumModal(false);
                  window.location.href = '/shop';
                }}
                className="w-full py-3.5 bg-[#00FF00] text-black font-bold rounded-xl text-base shadow-[0_0_20px_rgba(0,255,0,0.3)] hover:shadow-[0_0_30px_rgba(0,255,0,0.5)] transition-all active:scale-[0.98]"
              >
                Pakete ansehen
              </button>
              
              <button 
                onClick={() => setShowPremiumModal(false)}
                className="w-full py-2 text-zinc-500 text-sm hover:text-white transition-colors"
              >
                Später
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Session Modal */}
      {moveModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setMoveModal(null)}>
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">Session verschieben</h3>
              <button onClick={() => setMoveModal(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Neues Datum</label>
                <input
                  type="date"
                  value={moveTargetDate}
                  onChange={e => setMoveTargetDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-[#00FF00] outline-none [color-scheme:dark]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setMoveModal(null)}
                  className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={moveSession}
                  disabled={!moveTargetDate || moveTargetDate === moveModal.currentDate}
                  className="flex-1 py-3 bg-[#00FF00] text-black rounded-xl font-bold hover:bg-[#00FF00]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Verschieben
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start Confirmation Dialog */}
      {startConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setStartConfirm(null)}>
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 text-center space-y-3">
              <div className="w-12 h-12 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center">
                <Pause size={24} className="text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Session bereits aktiv</h3>
              <p className="text-sm text-zinc-400">
                Du hast bereits einen aktiven Block. Möchtest du trotzdem einen weiteren starten?
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStartConfirm(null)}
                  className="flex-1 py-3 bg-zinc-800 text-white rounded-xl font-medium hover:bg-zinc-700 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    startBlock(startConfirm.workoutId, startConfirm.blockId);
                    setStartConfirm(null);
                  }}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors"
                >
                  Trotzdem starten
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {videoPreview && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setVideoPreview(null)}>
          <div className="bg-[#1C1C1E] border border-zinc-800 w-full max-w-lg rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-3 border-b border-zinc-800">
              <h4 className="text-white font-bold text-sm">Übungsvideo</h4>
              <button onClick={() => setVideoPreview(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="aspect-video bg-black">
              {videoPreview.includes('youtube.com') || videoPreview.includes('youtu.be') ? (
                <iframe
                  src={videoPreview.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={videoPreview} controls className="w-full h-full" autoPlay />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AthleteTrainingView;
