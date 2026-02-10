import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, getActiveSubscription, getCoachingRelationship } from '../services/supabase';
import { 
  TrendingUp, 
  TrendingDown,
  Trophy, 
  Flame, 
  Target,
  Calendar,
  Dumbbell,
  Moon,
  Battery,
  Heart,
  Activity,
  ChevronRight,
  Plus,
  BarChart3,
  Zap,
  Bookmark,
  Lock,
  Layers,
  Repeat
} from 'lucide-react';
import Button from '../components/Button';
import GoalWidget from '../components/GoalWidget';
import MyCoach from '../components/MyCoach';

interface WeeklyStats {
  weekStart: string;
  sessionsCompleted: number;
  sessionsPlanned: number;
  totalVolume: number;
  prsHit: number;
}

interface DailyWellness {
  date: string;
  sleepQuality: number;
  sleepHours: number;
  energyLevel: number;
  stressLevel: number;
  muscleSoreness: number;
  mood: number;
}

interface ExercisePB {
  exerciseId: string;
  exerciseName: string;
  pbType: string;
  value: number;
  reps?: number;
  weight?: number;
  achievedAt: string;
  isRecent?: boolean;
}

interface VolumeData {
  date: string;
  volume: number;
  push: number;
  pull: number;
  legs: number;
}

const AthleteDashboard: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [wellnessData, setWellnessData] = useState<DailyWellness[]>([]);
  const [personalBests, setPersonalBests] = useState<ExercisePB[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [todayWellness, setTodayWellness] = useState<DailyWellness | null>(null);
  const [showWellnessModal, setShowWellnessModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hasPremium, setHasPremium] = useState(false);

  // Load all dashboard data
  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Check premium status: active subscription OR active coaching relationship
      const [subscription, coaching] = await Promise.all([
        getActiveSubscription(user.id).catch(() => null),
        getCoachingRelationship(user.id).catch(() => null),
      ]);
      setHasPremium(!!(subscription || coaching));

      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Load weekly stats
      const { data: weeklyData } = await supabase
        .from('weekly_stats')
        .select('*')
        .eq('athlete_id', user.id)
        .gte('week_start', eightWeeksAgo)
        .order('week_start', { ascending: true });

      if (weeklyData) {
        setWeeklyStats(weeklyData.map(w => ({
          weekStart: w.week_start,
          sessionsCompleted: w.sessions_completed || 0,
          sessionsPlanned: w.sessions_planned || 0,
          totalVolume: w.total_volume || 0,
          prsHit: w.prs_hit || 0
        })));
      }

      // Load wellness data
      const { data: wellnessRaw } = await supabase
        .from('daily_wellness')
        .select('*')
        .eq('athlete_id', user.id)
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: true });

      if (wellnessRaw) {
        const mapped = wellnessRaw.map(w => ({
          date: w.date,
          sleepQuality: w.sleep_quality || 0,
          sleepHours: w.sleep_hours || 0,
          energyLevel: w.energy_level || 0,
          stressLevel: w.stress_level || 0,
          muscleSoreness: w.muscle_soreness || 0,
          mood: w.mood || 0
        }));
        setWellnessData(mapped);
        
        // Check for today's wellness
        const todayEntry = mapped.find(w => w.date === today);
        setTodayWellness(todayEntry || null);
      }

      // Load personal bests
      const { data: pbsData } = await supabase
        .from('exercise_pbs')
        .select('*, exercises(name)')
        .eq('athlete_id', user.id)
        .order('achieved_at', { ascending: false })
        .limit(10);

      if (pbsData) {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        setPersonalBests(pbsData.map(pb => ({
          exerciseId: pb.exercise_id,
          exerciseName: pb.exercises?.name || 'Unbekannt',
          pbType: pb.pb_type,
          value: pb.value,
          reps: pb.reps,
          weight: pb.weight,
          achievedAt: pb.achieved_at,
          isRecent: new Date(pb.achieved_at) > oneWeekAgo
        })));
      }

      // Load daily stats for volume chart
      const { data: dailyData } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('athlete_id', user.id)
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: true });

      if (dailyData) {
        setVolumeData(dailyData.map(d => ({
          date: d.date,
          volume: d.total_volume || 0,
          push: d.push_volume || 0,
          pull: d.pull_volume || 0,
          legs: d.legs_volume || 0
        })));
      }

      // Calculate streak from completed workouts
      const { data: scheduleData } = await supabase
        .from('athlete_schedule')
        .select('date, completed')
        .eq('athlete_id', user.id)
        .eq('completed', true)
        .order('date', { ascending: false })
        .limit(30);

      if (scheduleData && scheduleData.length > 0) {
        let streak = 0;
        const sortedDates = scheduleData.map(s => s.date).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        
        for (let i = 0; i < sortedDates.length; i++) {
          const expectedDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          if (sortedDates.includes(expectedDate)) {
            streak++;
          } else {
            break;
          }
        }
        setCurrentStreak(streak);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const thisWeek = weeklyStats[weeklyStats.length - 1];
    const lastWeek = weeklyStats[weeklyStats.length - 2];
    
    const volumeChange = lastWeek && thisWeek 
      ? ((thisWeek.totalVolume - lastWeek.totalVolume) / (lastWeek.totalVolume || 1)) * 100
      : 0;

    const totalVolume = volumeData.reduce((sum, d) => sum + d.volume, 0);
    const avgWellness = wellnessData.length > 0
      ? wellnessData.reduce((sum, w) => sum + ((w.energyLevel + w.mood + (6 - w.stressLevel)) / 3), 0) / wellnessData.length
      : 0;

    return {
      thisWeekSessions: thisWeek?.sessionsCompleted || 0,
      thisWeekPlanned: thisWeek?.sessionsPlanned || 4,
      volumeChange: Math.round(volumeChange),
      totalVolume: Math.round(totalVolume),
      avgWellness: avgWellness.toFixed(1),
      totalPRs: personalBests.filter(pb => pb.isRecent).length
    };
  }, [weeklyStats, volumeData, wellnessData, personalBests]);

  // Wellness form state
  const [wellnessForm, setWellnessForm] = useState({
    sleepQuality: 3,
    sleepHours: 7,
    energyLevel: 3,
    stressLevel: 3,
    muscleSoreness: 3,
    mood: 3
  });

  const saveWellness = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    await supabase.from('daily_wellness').upsert({
      athlete_id: user.id,
      date: today,
      sleep_quality: wellnessForm.sleepQuality,
      sleep_hours: wellnessForm.sleepHours,
      energy_level: wellnessForm.energyLevel,
      stress_level: wellnessForm.stressLevel,
      muscle_soreness: wellnessForm.muscleSoreness,
      mood: wellnessForm.mood
    }, { onConflict: 'athlete_id,date' });
    
    setShowWellnessModal(false);
    loadDashboardData();
  };

  // Mini bar chart component
  const MiniBarChart: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 40 }) => {
    const max = Math.max(...data, 1);
    return (
      <div className="flex items-end gap-0.5" style={{ height }}>
        {data.map((val, i) => (
          <div
            key={i}
            className="flex-1 rounded-t transition-all"
            style={{ 
              height: `${(val / max) * 100}%`,
              backgroundColor: color,
              minHeight: val > 0 ? 2 : 0
            }}
          />
        ))}
      </div>
    );
  };

  // Wellness indicator dots
  const WellnessDots: React.FC<{ value: number; max?: number }> = ({ value, max = 5 }) => (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i < value ? 'bg-[#00FF00]' : 'bg-zinc-700'}`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00FF00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Greeting */}
      <div className="px-4 pt-4 pb-1">
        <h1 className="text-2xl font-bold text-white">
          Hallo{userProfile?.firstName ? `, ${userProfile.firstName}` : userProfile?.displayName ? `, ${userProfile.displayName}` : userProfile?.nickname ? `, ${userProfile.nickname}` : userProfile?.email ? `, ${userProfile.email.split('@')[0]}` : ''} <span className="inline-block animate-in fade-in">👋</span>
        </h1>
      </div>

      {/* Week Stats Header - Premium Style (Green) */}
      <div className="p-4">
        <div className="bg-gradient-to-r from-[#00FF00]/10 to-transparent border border-[#00FF00]/20 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#00FF00]/20 rounded-xl flex items-center justify-center">
                <Calendar size={24} className="text-[#00FF00]" />
              </div>
              <div>
                <p className="text-white font-bold">Diese Woche</p>
                <p className="text-sm text-zinc-400">
                  {stats.thisWeekSessions} von {stats.thisWeekPlanned} Sessions
                </p>
              </div>
            </div>
            <div className="flex gap-4 text-right">
              <div>
                <p className="text-lg font-bold text-orange-500">{currentStreak}</p>
                <p className="text-xs text-zinc-500">Streak</p>
              </div>
              <div>
                <p className="text-lg font-bold text-[#00FF00]">{stats.totalPRs}</p>
                <p className="text-xs text-zinc-500">PRs</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goals Widget - Now at top! */}
      <div className="px-4 mt-4">
        <GoalWidget compact />
      </div>

      {/* Daily Wellness Card - Premium Style with Week Chart */}
      <div className="px-4 mt-4">
        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Heart size={24} className="text-purple-500" />
              </div>
              <div>
                <p className="text-white font-bold">Daily Wellness</p>
                <p className="text-sm text-zinc-400">
                  {todayWellness ? 'Heute eingetragen' : 'Wie fühlst du dich heute?'}
                </p>
              </div>
            </div>
            {!todayWellness ? (
              <button 
                onClick={() => setShowWellnessModal(true)}
                className="px-4 py-2 bg-purple-500 text-white font-bold rounded-xl text-sm flex items-center shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all"
              >
                <Plus size={16} className="mr-1" /> Eintragen
              </button>
            ) : (
              <button 
                onClick={() => setShowWellnessModal(true)}
                className="p-2 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-500/30 transition-all"
              >
                <Plus size={16} />
              </button>
            )}
          </div>

          {/* Wellness Week Chart */}
          {wellnessData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-purple-500/10">
              <p className="text-xs text-zinc-500 mb-2">Letzte 7 Tage</p>
              <div className="flex items-end gap-1 h-16">
                {(() => {
                  // Get last 7 days of wellness data
                  const last7Days = [];
                  for (let i = 6; i >= 0; i--) {
                    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    const dayData = wellnessData.find(w => w.date === date);
                    const avgScore = dayData 
                      ? Math.round(((dayData.sleepQuality + dayData.energyLevel + dayData.mood + (6 - dayData.stressLevel)) / 4) * 20)
                      : 0;
                    last7Days.push({ date, score: avgScore, hasData: !!dayData });
                  }
                  const maxScore = Math.max(...last7Days.map(d => d.score), 1);
                  
                  return last7Days.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className={`w-full rounded-t transition-all ${day.hasData ? 'bg-purple-500' : 'bg-zinc-800'}`}
                        style={{ height: `${day.hasData ? (day.score / maxScore) * 100 : 10}%`, minHeight: '4px' }}
                      />
                      <span className="text-[9px] text-zinc-600">
                        {['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(day.date).getDay()]}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Today's Wellness Details */}
          {todayWellness && (
            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-purple-500/10">
              <div className="text-center">
                <Moon size={14} className="mx-auto text-blue-400 mb-1" />
                <p className="text-[10px] text-zinc-500">Schlaf</p>
                <WellnessDots value={todayWellness.sleepQuality} />
              </div>
              <div className="text-center">
                <Battery size={14} className="mx-auto text-yellow-400 mb-1" />
                <p className="text-[10px] text-zinc-500">Energie</p>
                <WellnessDots value={todayWellness.energyLevel} />
              </div>
              <div className="text-center">
                <Activity size={14} className="mx-auto text-red-400 mb-1" />
                <p className="text-[10px] text-zinc-500">Muskelkater</p>
                <WellnessDots value={6 - todayWellness.muscleSoreness} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Volume Chart - Premium Feature - Premium Style */}
      <div className="px-4 mt-4">
        <div 
          className={`bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-4 relative ${!hasPremium ? 'cursor-pointer' : ''}`}
          onClick={() => !hasPremium && setShowPremiumModal(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 size={24} className="text-blue-500" />
              </div>
              <div>
                <p className="text-white font-bold flex items-center gap-2">
                  Trainingsvolumen
                  {!hasPremium && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">PRO</span>}
                </p>
                <p className="text-sm text-zinc-400">Push / Pull / Legs Analyse</p>
              </div>
            </div>
            {!hasPremium && (
              <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Lock size={14} className="text-yellow-500" />
              </div>
            )}
          </div>
          
          <div className={`mt-4 pt-4 border-t border-blue-500/10 ${!hasPremium ? 'blur-sm pointer-events-none' : ''}`}>
            <div className="h-24">
              <MiniBarChart 
                data={volumeData.map(d => d.volume)} 
                color="#3B82F6" 
                height={96}
              />
            </div>

            {/* Push/Pull/Legs Distribution */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { label: 'Push', value: volumeData.reduce((s, d) => s + d.push, 0), color: 'bg-blue-500' },
                { label: 'Pull', value: volumeData.reduce((s, d) => s + d.pull, 0), color: 'bg-green-500' },
                { label: 'Legs', value: volumeData.reduce((s, d) => s + d.legs, 0), color: 'bg-purple-500' }
              ].map(item => {
                const total = volumeData.reduce((s, d) => s + d.push + d.pull + d.legs, 0) || 1;
                const pct = Math.round((item.value / total) * 100);
                return (
                  <div key={item.label} className="text-center">
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-1">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-xs text-zinc-500">{item.label}</p>
                    <p className="text-sm font-bold">{pct}%</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Bests - Premium Feature - Premium Style */}
      <div className="px-4 mt-4">
        <div 
          className={`bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-2xl p-4 ${!hasPremium ? 'cursor-pointer' : ''}`}
          onClick={() => !hasPremium && setShowPremiumModal(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Trophy size={24} className="text-yellow-500" />
              </div>
              <div>
                <p className="text-white font-bold flex items-center gap-2">
                  Persönliche Rekorde
                  {!hasPremium && <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">PRO</span>}
                </p>
                <p className="text-sm text-zinc-400">Deine besten Leistungen</p>
              </div>
            </div>
            {!hasPremium && (
              <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Lock size={14} className="text-yellow-500" />
              </div>
            )}
          </div>

          <div className={`mt-4 pt-4 border-t border-yellow-500/10 ${!hasPremium ? 'blur-sm pointer-events-none' : ''}`}>
            {personalBests.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-2">
                Noch keine PRs - trainiere weiter!
              </p>
            ) : (
              <div className="space-y-2">
                {personalBests.slice(0, 5).map((pb, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      pb.isRecent ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-black/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {pb.isRecent && <Zap size={14} className="text-yellow-500" />}
                      <div>
                        <p className="font-medium text-white text-sm">{pb.exerciseName}</p>
                        <p className="text-xs text-zinc-500">{pb.pbType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#00FF00]">
                        {pb.weight}kg × {pb.reps}
                      </p>
                      {pb.isRecent && (
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">NEU</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* My Coach Section - at bottom */}
      <div className="px-4 mt-4 mb-8">
        <MyCoach />
      </div>

      {/* Wellness Modal */}
      {showWellnessModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Wie fühlst du dich heute?</h3>
            
            <div className="space-y-4">
              {/* Sleep Quality */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400 flex items-center gap-2">
                    <Moon size={14} /> Schlafqualität
                  </span>
                  <span className="text-sm font-bold">{wellnessForm.sleepQuality}/5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={wellnessForm.sleepQuality}
                  onChange={(e) => setWellnessForm(prev => ({ ...prev, sleepQuality: parseInt(e.target.value) }))}
                  className="w-full accent-[#00FF00]"
                />
              </div>

              {/* Sleep Hours */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Schlafstunden</span>
                  <span className="text-sm font-bold">{wellnessForm.sleepHours}h</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={12}
                  step={0.5}
                  value={wellnessForm.sleepHours}
                  onChange={(e) => setWellnessForm(prev => ({ ...prev, sleepHours: parseFloat(e.target.value) }))}
                  className="w-full accent-[#00FF00]"
                />
              </div>

              {/* Energy Level */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400 flex items-center gap-2">
                    <Battery size={14} /> Energielevel
                  </span>
                  <span className="text-sm font-bold">{wellnessForm.energyLevel}/5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={wellnessForm.energyLevel}
                  onChange={(e) => setWellnessForm(prev => ({ ...prev, energyLevel: parseInt(e.target.value) }))}
                  className="w-full accent-[#00FF00]"
                />
              </div>

              {/* Stress Level */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400 flex items-center gap-2">
                    <Activity size={14} /> Stresslevel
                  </span>
                  <span className="text-sm font-bold">{wellnessForm.stressLevel}/5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={wellnessForm.stressLevel}
                  onChange={(e) => setWellnessForm(prev => ({ ...prev, stressLevel: parseInt(e.target.value) }))}
                  className="w-full accent-[#00FF00]"
                />
              </div>

              {/* Muscle Soreness */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400 flex items-center gap-2">
                    <Dumbbell size={14} /> Muskelkater
                  </span>
                  <span className="text-sm font-bold">{wellnessForm.muscleSoreness}/5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={wellnessForm.muscleSoreness}
                  onChange={(e) => setWellnessForm(prev => ({ ...prev, muscleSoreness: parseInt(e.target.value) }))}
                  className="w-full accent-[#00FF00]"
                />
              </div>

              {/* Mood */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400 flex items-center gap-2">
                    <Heart size={14} /> Stimmung
                  </span>
                  <span className="text-sm font-bold">{wellnessForm.mood}/5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={wellnessForm.mood}
                  onChange={(e) => setWellnessForm(prev => ({ ...prev, mood: parseInt(e.target.value) }))}
                  className="w-full accent-[#00FF00]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="secondary" fullWidth onClick={() => setShowWellnessModal(false)}>
                Abbrechen
              </Button>
              <Button variant="primary" fullWidth onClick={saveWellness}>
                Speichern
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Feature Modal */}
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
    </div>
  );
};

export default AthleteDashboard;
