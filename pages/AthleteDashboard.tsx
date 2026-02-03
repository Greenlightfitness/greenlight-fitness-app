import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
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
  Zap
} from 'lucide-react';
import Button from '../components/Button';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [wellnessData, setWellnessData] = useState<DailyWellness[]>([]);
  const [personalBests, setPersonalBests] = useState<ExercisePB[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [todayWellness, setTodayWellness] = useState<DailyWellness | null>(null);
  const [showWellnessModal, setShowWellnessModal] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Load all dashboard data
  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
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
      {/* Header */}
      <div className="p-4 pt-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-500 text-sm">Dein Fortschritt auf einen Blick</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {/* Sessions This Week */}
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-[#00FF00]/10 rounded-lg flex items-center justify-center">
              <Calendar size={16} className="text-[#00FF00]" />
            </div>
            <span className="text-xs text-zinc-500">Diese Woche</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{stats.thisWeekSessions}</span>
            <span className="text-zinc-500 text-sm">/ {stats.thisWeekPlanned}</span>
          </div>
          <div className="mt-2 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full bg-[#00FF00] rounded-full transition-all"
              style={{ width: `${Math.min(100, (stats.thisWeekSessions / stats.thisWeekPlanned) * 100)}%` }}
            />
          </div>
        </div>

        {/* Streak */}
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Flame size={16} className="text-orange-500" />
            </div>
            <span className="text-xs text-zinc-500">Streak</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{currentStreak}</span>
            <span className="text-zinc-500 text-sm">Tage</span>
          </div>
          <p className="text-xs text-zinc-600 mt-1">
            {currentStreak > 0 ? 'Weiter so!' : 'Starte heute!'}
          </p>
        </div>

        {/* Volume Trend */}
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <BarChart3 size={16} className="text-blue-500" />
            </div>
            <span className="text-xs text-zinc-500">Volumen</span>
          </div>
          <div className="flex items-center gap-2">
            {stats.volumeChange !== 0 && (
              <div className={`flex items-center gap-0.5 text-xs ${stats.volumeChange > 0 ? 'text-[#00FF00]' : 'text-red-400'}`}>
                {stats.volumeChange > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(stats.volumeChange)}%
              </div>
            )}
          </div>
          <div className="mt-2">
            <MiniBarChart 
              data={volumeData.slice(-7).map(d => d.volume)} 
              color="#3B82F6" 
              height={24}
            />
          </div>
        </div>

        {/* PRs */}
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Trophy size={16} className="text-yellow-500" />
            </div>
            <span className="text-xs text-zinc-500">Neue PRs</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{stats.totalPRs}</span>
            <span className="text-zinc-500 text-sm">diese Woche</span>
          </div>
        </div>
      </div>

      {/* Daily Wellness Card */}
      <div className="px-4 mt-4">
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Heart size={16} className="text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold text-white">Daily Wellness</h3>
                <p className="text-xs text-zinc-500">Wie fühlst du dich heute?</p>
              </div>
            </div>
            {!todayWellness && (
              <Button variant="primary" onClick={() => setShowWellnessModal(true)}>
                <Plus size={16} className="mr-1" /> Eintragen
              </Button>
            )}
          </div>

          {todayWellness ? (
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <Moon size={16} className="mx-auto text-blue-400 mb-1" />
                <p className="text-xs text-zinc-500">Schlaf</p>
                <WellnessDots value={todayWellness.sleepQuality} />
              </div>
              <div className="text-center">
                <Battery size={16} className="mx-auto text-yellow-400 mb-1" />
                <p className="text-xs text-zinc-500">Energie</p>
                <WellnessDots value={todayWellness.energyLevel} />
              </div>
              <div className="text-center">
                <Activity size={16} className="mx-auto text-red-400 mb-1" />
                <p className="text-xs text-zinc-500">Muskelkater</p>
                <WellnessDots value={6 - todayWellness.muscleSoreness} />
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <MiniBarChart 
                data={wellnessData.slice(-14).map(w => (w.energyLevel + w.mood) / 2)} 
                color="#A855F7" 
                height={32}
              />
              <p className="text-xs text-zinc-600 text-center mt-2">Letzte 14 Tage</p>
            </div>
          )}
        </div>
      </div>

      {/* Volume Chart */}
      <div className="px-4 mt-4">
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Trainingsvolumen</h3>
            <span className="text-xs text-zinc-500">Letzte 30 Tage</span>
          </div>
          
          <div className="h-32">
            <MiniBarChart 
              data={volumeData.map(d => d.volume)} 
              color="#00FF00" 
              height={128}
            />
          </div>

          {/* Push/Pull/Legs Distribution */}
          <div className="mt-4 grid grid-cols-3 gap-2">
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

      {/* Personal Bests */}
      <div className="px-4 mt-4">
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Trophy size={16} className="text-yellow-500" />
              Persönliche Rekorde
            </h3>
            <ChevronRight size={16} className="text-zinc-500" />
          </div>

          {personalBests.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-4">
              Noch keine PRs - trainiere weiter!
            </p>
          ) : (
            <div className="space-y-2">
              {personalBests.slice(0, 5).map((pb, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    pb.isRecent ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-zinc-900'
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
    </div>
  );
};

export default AthleteDashboard;
