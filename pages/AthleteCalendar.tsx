import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAssignedPlans, supabase } from '../services/supabase';
import { Calendar, ChevronLeft, ChevronRight, Plus, X, Check, Clock, Dumbbell } from 'lucide-react';
import Button from '../components/Button';

interface ScheduledWorkout {
  id: string;
  date: string;
  planId: string;
  planName: string;
  weekNumber: number;
  dayNumber: number;
  sessionTitle: string;
  workoutData: any;
  completed: boolean;
}

interface OwnedPlan {
  id: string;
  plan_name: string;
  structure: any;
  schedule_status: string;
}

const AthleteCalendar: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [ownedPlans, setOwnedPlans] = useState<OwnedPlan[]>([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Schedule Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<OwnedPlan | null>(null);
  const [scheduleStartDate, setScheduleStartDate] = useState('');
  const [scheduleDuration, setScheduleDuration] = useState<'1_WEEK' | '2_WEEKS' | 'FULL'>('1_WEEK');
  
  // Day Detail Modal
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayWorkouts, setDayWorkouts] = useState<ScheduledWorkout[]>([]);

  useEffect(() => {
    if (user) {
      fetchOwnedPlans();
      fetchScheduledWorkouts();
    }
  }, [user]);

  const fetchOwnedPlans = async () => {
    if (!user) return;
    try {
      const data = await getAssignedPlans(user.id);
      setOwnedPlans(data || []);
    } catch (error) {
      console.error('Error fetching owned plans:', error);
    }
  };

  const fetchScheduledWorkouts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('athlete_schedule')
        .select('*')
        .eq('athlete_id', user.id)
        .order('date', { ascending: true });
      
      if (error && error.code !== 'PGRST116') throw error;
      setScheduledWorkouts(data || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const schedulePlan = async () => {
    if (!user || !selectedPlan || !scheduleStartDate) return;
    
    try {
      const startDate = new Date(scheduleStartDate);
      const structure = selectedPlan.structure;
      const weeks = structure?.weeks || [];
      
      // Determine how many weeks to schedule
      let weeksToSchedule = weeks.length;
      if (scheduleDuration === '1_WEEK') weeksToSchedule = Math.min(1, weeks.length);
      if (scheduleDuration === '2_WEEKS') weeksToSchedule = Math.min(2, weeks.length);
      
      const workoutsToInsert: any[] = [];
      
      for (let weekIdx = 0; weekIdx < weeksToSchedule; weekIdx++) {
        const week = weeks[weekIdx];
        const sessions = week.sessions || [];
        
        sessions.forEach((session: any) => {
          const dayOffset = (weekIdx * 7) + (session.dayOfWeek - 1);
          const sessionDate = new Date(startDate);
          sessionDate.setDate(sessionDate.getDate() + dayOffset);
          
          workoutsToInsert.push({
            athlete_id: user.id,
            plan_id: selectedPlan.id,
            plan_name: selectedPlan.plan_name,
            week_number: weekIdx + 1,
            day_number: session.dayOfWeek,
            session_title: session.title || `Day ${session.dayOfWeek}`,
            workout_data: session.workoutData,
            date: sessionDate.toISOString().split('T')[0],
            completed: false,
          });
        });
      }
      
      if (workoutsToInsert.length > 0) {
        const { error } = await supabase
          .from('athlete_schedule')
          .insert(workoutsToInsert);
        
        if (error) throw error;
      }
      
      setShowScheduleModal(false);
      setSelectedPlan(null);
      fetchScheduledWorkouts();
      
    } catch (error) {
      console.error('Error scheduling plan:', error);
      alert('Fehler beim Einplanen. Bitte versuche es erneut.');
    }
  };

  const toggleWorkoutComplete = async (workout: ScheduledWorkout) => {
    try {
      const { error } = await supabase
        .from('athlete_schedule')
        .update({ completed: !workout.completed })
        .eq('id', workout.id);
      
      if (error) throw error;
      
      setScheduledWorkouts(prev => 
        prev.map(w => w.id === workout.id ? { ...w, completed: !w.completed } : w)
      );
      setDayWorkouts(prev =>
        prev.map(w => w.id === workout.id ? { ...w, completed: !w.completed } : w)
      );
    } catch (error) {
      console.error('Error updating workout:', error);
    }
  };

  const deleteWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('athlete_schedule')
        .delete()
        .eq('id', workoutId);
      
      if (error) throw error;
      
      setScheduledWorkouts(prev => prev.filter(w => w.id !== workoutId));
      setDayWorkouts(prev => prev.filter(w => w.id !== workoutId));
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday start
    
    return { daysInMonth, startingDay };
  };

  const getWorkoutsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return scheduledWorkouts.filter(w => w.date === dateStr);
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const today = new Date();
  const isToday = (day: number) => 
    today.getDate() === day && 
    today.getMonth() === currentDate.getMonth() && 
    today.getFullYear() === currentDate.getFullYear();

  const monthNames = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const openDayDetail = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDay(date);
    setDayWorkouts(getWorkoutsForDay(day));
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Kalender <span className="text-[#00FF00]">.</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Plane dein Training</p>
        </div>
        
        <Button 
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-2"
          disabled={ownedPlans.length === 0}
        >
          <Plus size={18} /> Plan einplanen
        </Button>
      </div>

      {/* Owned Plans Quick View */}
      {ownedPlans.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {ownedPlans.map(plan => (
            <button
              key={plan.id}
              onClick={() => { setSelectedPlan(plan); setShowScheduleModal(true); }}
              className="flex-shrink-0 bg-[#1C1C1E] border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white hover:border-[#00FF00]/50 transition-colors"
            >
              <span className="text-[#00FF00] mr-2">●</span>
              {plan.plan_name}
            </button>
          ))}
        </div>
      )}

      {/* Calendar Navigation */}
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-zinc-400" />
          </button>
          
          <h2 className="text-lg font-bold text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-zinc-400" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {dayNames.map(day => (
            <div key={day} className="py-2 text-center text-xs font-bold text-zinc-500 uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for starting day offset */}
          {Array.from({ length: startingDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20 border-b border-r border-zinc-800/50 bg-zinc-900/30" />
          ))}
          
          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const workouts = getWorkoutsForDay(day);
            const hasWorkouts = workouts.length > 0;
            const allCompleted = hasWorkouts && workouts.every(w => w.completed);
            
            return (
              <button
                key={day}
                onClick={() => openDayDetail(day)}
                className={`h-20 border-b border-r border-zinc-800/50 p-1 text-left hover:bg-zinc-800/50 transition-colors relative ${
                  isToday(day) ? 'bg-[#00FF00]/10' : ''
                }`}
              >
                <span className={`text-xs font-bold ${isToday(day) ? 'text-[#00FF00]' : 'text-zinc-400'}`}>
                  {day}
                </span>
                
                {hasWorkouts && (
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                    {workouts.slice(0, 3).map(w => (
                      <div 
                        key={w.id}
                        className={`w-1.5 h-1.5 rounded-full ${
                          w.completed ? 'bg-[#00FF00]' : 'bg-zinc-500'
                        }`}
                      />
                    ))}
                    {workouts.length > 3 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">Plan einplanen</h3>
              <button onClick={() => { setShowScheduleModal(false); setSelectedPlan(null); }} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Plan Selection */}
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Trainingsplan</label>
                <select
                  value={selectedPlan?.id || ''}
                  onChange={(e) => setSelectedPlan(ownedPlans.find(p => p.id === e.target.value) || null)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-[#00FF00] outline-none"
                >
                  <option value="">Plan auswählen...</option>
                  {ownedPlans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.plan_name}</option>
                  ))}
                </select>
              </div>
              
              {/* Start Date */}
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Startdatum</label>
                <input
                  type="date"
                  value={scheduleStartDate}
                  onChange={(e) => setScheduleStartDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:border-[#00FF00] outline-none [color-scheme:dark]"
                />
              </div>
              
              {/* Duration */}
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-2">Zeitraum</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: '1_WEEK', label: '1 Woche' },
                    { value: '2_WEEKS', label: '2 Wochen' },
                    { value: 'FULL', label: 'Komplett' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setScheduleDuration(opt.value as any)}
                      className={`py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
                        scheduleDuration === opt.value
                          ? 'bg-[#00FF00] text-black'
                          : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={schedulePlan} 
                fullWidth 
                disabled={!selectedPlan || !scheduleStartDate}
                className="mt-4"
              >
                <Calendar size={18} className="mr-2" /> Einplanen
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-end justify-center animate-in slide-in-from-bottom">
          <div className="bg-[#1C1C1E] border-t border-zinc-800 rounded-t-3xl w-full max-w-md max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">
                {selectedDay.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {dayWorkouts.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Dumbbell size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Keine Workouts geplant</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayWorkouts.map(workout => (
                    <div 
                      key={workout.id}
                      className={`bg-zinc-900 border rounded-xl p-4 ${
                        workout.completed ? 'border-[#00FF00]/30' : 'border-zinc-800'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-zinc-500 mb-1">{workout.planName} • Woche {workout.weekNumber}</p>
                          <h4 className={`font-bold ${workout.completed ? 'text-zinc-500 line-through' : 'text-white'}`}>
                            {workout.sessionTitle}
                          </h4>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleWorkoutComplete(workout)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              workout.completed 
                                ? 'bg-[#00FF00] text-black' 
                                : 'bg-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => deleteWorkout(workout.id)}
                            className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 hover:text-red-500 flex items-center justify-center transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && ownedPlans.length === 0 && (
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-8 text-center">
          <Calendar size={48} className="mx-auto mb-4 text-zinc-700" />
          <h3 className="text-lg font-bold text-white mb-2">Keine Trainingspläne</h3>
          <p className="text-zinc-500 text-sm">Kaufe einen Trainingsplan im Shop, um ihn hier einzuplanen.</p>
        </div>
      )}
    </div>
  );
};

export default AthleteCalendar;
