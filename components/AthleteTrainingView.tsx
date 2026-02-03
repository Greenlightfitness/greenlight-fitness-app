import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, getAssignedPlans } from '../services/supabase';
import { ChevronLeft, ChevronRight, Plus, Check, Play, Clock, Dumbbell, X, ChevronDown, ChevronUp } from 'lucide-react';
import Button from './Button';

interface WorkoutBlock {
  id: string;
  name: string;
  exercises: {
    id: string;
    name: string;
    sets: {
      id: string;
      reps?: string;
      weight?: string;
      rpe?: string;
      time?: string;
      isCompleted?: boolean;
      actualReps?: string;
      actualWeight?: string;
    }[];
  }[];
}

interface DayWorkout {
  id: string;
  date: string;
  planName: string;
  sessionTitle: string;
  workoutData: WorkoutBlock[];
  isCustom: boolean;
  completed: boolean;
}

const DAYS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const DAYS_FULL = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

const AthleteTrainingView: React.FC = () => {
  const { user } = useAuth();
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
  const [sessionActive, setSessionActive] = useState(false);
  
  // Add custom workout modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [customWorkoutName, setCustomWorkoutName] = useState('');
  
  // Add block modal
  const [showAddBlockModal, setShowAddBlockModal] = useState<string | null>(null); // workoutId
  const [newBlockName, setNewBlockName] = useState('');
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState('3');
  const [newExerciseReps, setNewExerciseReps] = useState('10');

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
      
      // Load custom scheduled workouts
      const { data: customWorkouts } = await supabase
        .from('athlete_schedule')
        .select('*')
        .eq('athlete_id', user.id)
        .gte('date', weekDates[0].toISOString().split('T')[0])
        .lte('date', weekDates[6].toISOString().split('T')[0]);

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
                  workoutMap[dateKey].push({
                    id: `${plan.id}-${session.id}`,
                    date: dateKey,
                    planName: plan.plan_name,
                    sessionTitle: session.title || 'Workout',
                    workoutData: session.workoutData || [],
                    isCustom: false,
                    completed: false, // TODO: track completion
                  });
                }
              });
            });
          });
        }
      });

      // Process custom workouts
      (customWorkouts || []).forEach((cw: any) => {
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

  const addCustomWorkout = async () => {
    if (!user || !customWorkoutName.trim()) return;
    
    try {
      const { error } = await supabase
        .from('athlete_schedule')
        .insert({
          athlete_id: user.id,
          date: selectedDateKey,
          plan_name: 'Custom',
          session_title: customWorkoutName,
          workout_data: [],
          completed: false,
        });
      
      if (error) throw error;
      
      setShowAddModal(false);
      setCustomWorkoutName('');
      loadWorkouts();
    } catch (error) {
      console.error('Error adding custom workout:', error);
    }
  };

  const addBlockToWorkout = async (workoutId: string) => {
    if (!user || !newBlockName.trim() || !newExerciseName.trim()) return;
    
    try {
      // Find the workout in state
      const dayWorkouts = workouts[selectedDateKey] || [];
      const workout = dayWorkouts.find(w => w.id === workoutId);
      if (!workout) return;

      // Create new block with exercise
      const newBlock: WorkoutBlock = {
        id: `block-${Date.now()}`,
        name: newBlockName,
        exercises: [{
          id: `ex-${Date.now()}`,
          name: newExerciseName,
          sets: Array.from({ length: parseInt(newExerciseSets) || 3 }, (_, i) => ({
            id: `set-${Date.now()}-${i}`,
            reps: newExerciseReps || '10',
            weight: '',
          }))
        }]
      };

      const updatedWorkoutData = [...(workout.workoutData || []), newBlock];

      const { error } = await supabase
        .from('athlete_schedule')
        .update({ workout_data: updatedWorkoutData })
        .eq('id', workoutId);

      if (error) throw error;

      setShowAddBlockModal(null);
      setNewBlockName('');
      setNewExerciseName('');
      setNewExerciseSets('3');
      setNewExerciseReps('10');
      loadWorkouts();
    } catch (error) {
      console.error('Error adding block:', error);
    }
  };

  const todayWorkouts = workouts[selectedDateKey] || [];
  const isToday = new Date().toISOString().split('T')[0] === selectedDateKey;

  // Format week range for header
  const weekRangeText = `${weekDates[0].getDate()}.${weekDates[0].getMonth() + 1} - ${weekDates[6].getDate()}.${weekDates[6].getMonth() + 1}`;

  return (
    <div className="space-y-4 animate-in fade-in">
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
                
                {/* Mini workout preview for desktop */}
                {dayWorkouts.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {dayWorkouts.slice(0, 2).map(w => (
                      <div 
                        key={w.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate ${
                          isSelected 
                            ? 'bg-black/20 text-black' 
                            : w.completed 
                              ? 'bg-[#00FF00]/20 text-[#00FF00]' 
                              : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {w.sessionTitle}
                      </div>
                    ))}
                    {dayWorkouts.length > 2 && (
                      <p className={`text-[10px] ${isSelected ? 'text-black/60' : 'text-zinc-600'}`}>
                        +{dayWorkouts.length - 2} more
                      </p>
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
            {isToday && <span className="text-[#00FF00] ml-2">Heute</span>}
          </h2>
          <p className="text-zinc-500 text-sm">
            {selectedDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}
          </p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Hinzufügen</span>
        </button>
      </div>

      {/* Workouts for Selected Day */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500">Lädt...</div>
      ) : todayWorkouts.length === 0 ? (
        <div className="bg-[#1C1C1E] border border-zinc-800 border-dashed rounded-2xl p-8 text-center">
          <Dumbbell size={48} className="mx-auto mb-4 text-zinc-700" />
          <h3 className="text-lg font-bold text-white mb-2">Kein Training geplant</h3>
          <p className="text-zinc-500 text-sm mb-4">Füge ein eigenes Workout hinzu oder plane einen gekauften Plan ein.</p>
          <Button onClick={() => setShowAddModal(true)} className="mx-auto">
            <Plus size={18} className="mr-2" /> Workout hinzufügen
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {todayWorkouts.map(workout => (
            <div 
              key={workout.id}
              className={`bg-[#1C1C1E] border rounded-2xl overflow-hidden transition-all ${
                workout.completed ? 'border-[#00FF00]/30' : 'border-zinc-800'
              }`}
            >
              {/* Workout Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">
                    {workout.isCustom ? '🏋️ Custom' : `📋 ${workout.planName}`}
                  </p>
                  <h3 className="text-lg font-bold text-white">{workout.sessionTitle}</h3>
                </div>
                
                {!sessionActive ? (
                  <Button 
                    onClick={() => {
                      setSessionActive(true);
                      if (workout.workoutData?.[0]) {
                        setExpandedBlocks(new Set([workout.workoutData[0].id]));
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Play size={16} /> Start
                  </Button>
                ) : (
                  <button 
                    onClick={() => setSessionActive(false)}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl font-bold text-sm"
                  >
                    Beenden
                  </button>
                )}
              </div>

              {/* Workout Blocks */}
              <div className="divide-y divide-zinc-800">
                {(workout.workoutData || []).map((block, blockIdx) => {
                  const isExpanded = expandedBlocks.has(block.id);
                  
                  return (
                    <div key={block.id} className="bg-zinc-900/50">
                      {/* Block Header */}
                      <button
                        onClick={() => toggleBlock(block.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#00FF00]/10 text-[#00FF00] rounded-lg flex items-center justify-center font-bold text-sm">
                            {blockIdx + 1}
                          </div>
                          <div className="text-left">
                            <h4 className="font-bold text-white">{block.name || `Block ${blockIdx + 1}`}</h4>
                            <p className="text-xs text-zinc-500">{block.exercises?.length || 0} Übungen</p>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp size={20} className="text-zinc-500" /> : <ChevronDown size={20} className="text-zinc-500" />}
                      </button>

                      {/* Block Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3">
                          {(block.exercises || []).map((exercise, exIdx) => (
                            <div key={exercise.id} className="bg-zinc-900 rounded-xl p-3">
                              <p className="font-medium text-white mb-2">{exercise.name}</p>
                              
                              {/* Sets */}
                              <div className="space-y-2">
                                {(exercise.sets || []).map((set, setIdx) => (
                                  <div 
                                    key={set.id}
                                    className={`flex items-center gap-3 p-2 rounded-lg ${
                                      set.isCompleted ? 'bg-[#00FF00]/10' : 'bg-zinc-800'
                                    }`}
                                  >
                                    <span className="text-xs text-zinc-500 w-6">S{setIdx + 1}</span>
                                    
                                    {/* Target */}
                                    <div className="flex-1 text-sm text-zinc-400">
                                      {set.reps && <span>{set.reps} reps</span>}
                                      {set.weight && <span className="ml-2">@ {set.weight}</span>}
                                      {set.rpe && <span className="ml-2">RPE {set.rpe}</span>}
                                      {set.time && <span>{set.time}</span>}
                                    </div>

                                    {/* Completion Toggle */}
                                    {sessionActive && (
                                      <button 
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                          set.isCompleted 
                                            ? 'bg-[#00FF00] text-black' 
                                            : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                                        }`}
                                      >
                                        <Check size={16} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          
                          {/* Next Block Button */}
                          {sessionActive && blockIdx < (workout.workoutData?.length || 0) - 1 && (
                            <Button 
                              onClick={() => {
                                const nextBlock = workout.workoutData?.[blockIdx + 1];
                                if (nextBlock) {
                                  setExpandedBlocks(prev => {
                                    const next = new Set(prev);
                                    next.delete(block.id);
                                    next.add(nextBlock.id);
                                    return next;
                                  });
                                }
                              }}
                              fullWidth
                              variant="secondary"
                            >
                              Nächster Block →
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add block button for custom workouts */}
                {workout.isCustom && (
                  <button 
                    onClick={() => setShowAddBlockModal(workout.id)}
                    className="w-full p-4 border-t border-zinc-800 text-[#00FF00] text-sm font-medium hover:bg-zinc-800/50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Übung hinzufügen
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

      {/* Add Custom Workout Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-white">Workout hinzufügen</h3>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Name</label>
                <input
                  type="text"
                  value={customWorkoutName}
                  onChange={(e) => setCustomWorkoutName(e.target.value)}
                  placeholder="z.B. Oberkörper, Cardio, ..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-[#00FF00] outline-none"
                  autoFocus
                />
              </div>
              <Button onClick={addCustomWorkout} fullWidth disabled={!customWorkoutName.trim()}>
                Hinzufügen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Block/Exercise Modal */}
      {showAddBlockModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-white">Übung hinzufügen</h3>
              <button onClick={() => setShowAddBlockModal(null)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Block Name</label>
                <input
                  type="text"
                  value={newBlockName}
                  onChange={(e) => setNewBlockName(e.target.value)}
                  placeholder="z.B. Block A, Warm-up, ..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-[#00FF00] outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Übung</label>
                <input
                  type="text"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="z.B. Bankdrücken, Kniebeugen, ..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-[#00FF00] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Sätze</label>
                  <input
                    type="number"
                    value={newExerciseSets}
                    onChange={(e) => setNewExerciseSets(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-[#00FF00] outline-none text-center"
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Wdh.</label>
                  <input
                    type="text"
                    value={newExerciseReps}
                    onChange={(e) => setNewExerciseReps(e.target.value)}
                    placeholder="10"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-[#00FF00] outline-none text-center"
                  />
                </div>
              </div>
              <Button 
                onClick={() => showAddBlockModal && addBlockToWorkout(showAddBlockModal)} 
                fullWidth 
                disabled={!newBlockName.trim() || !newExerciseName.trim()}
              >
                Übung hinzufügen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AthleteTrainingView;
