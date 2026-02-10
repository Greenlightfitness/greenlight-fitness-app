import React, { useEffect, useState } from 'react';
import { supabase, getPlans, createAssignedPlan } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserProfile, AssignedPlan, Attention, ActivityFeedItem } from '../types';
import { X, User, Activity, AlertTriangle, Calendar, ChevronRight, Dumbbell, History, Ruler, Weight, TrendingUp, TrendingDown, Heart, Moon, Battery, Trophy, BarChart3, Flame, Plus, Send, Target, ClipboardList } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { calculateFFMI } from '../utils/formulas';

interface AthleteProfileModalProps {
  athleteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const AthleteProfileModal: React.FC<AthleteProfileModalProps> = ({ athleteId, isOpen, onClose }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [activePlan, setActivePlan] = useState<AssignedPlan | null>(null);
  const [attentions, setAttentions] = useState<Attention[]>([]);
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [wellnessData, setWellnessData] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [personalBests, setPersonalBests] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && athleteId) {
      fetchAthleteData(athleteId);
    } else {
        // Reset state on close
        setProfile(null);
        setActivePlan(null);
        setAttentions([]);
        setActivities([]);
    }
  }, [isOpen, athleteId]);

  const fetchAthleteData = async (uid: string) => {
    setLoading(true);
    try {
      // 1. Fetch Profile from Supabase
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      
      if (profileData) {
        setProfile({
          uid: profileData.id,
          email: profileData.email,
          role: profileData.role,
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          nickname: profileData.nickname,
          height: profileData.height,
          weight: profileData.weight,
          bodyFat: profileData.body_fat,
          gender: profileData.gender,
          birthDate: profileData.birth_date,
          restingHeartRate: profileData.resting_heart_rate,
          maxHeartRate: profileData.max_heart_rate,
          createdAt: profileData.created_at,
        } as UserProfile);
      }

      // 2. Fetch Active Plan from Supabase
      const { data: plansData } = await supabase
        .from('assigned_plans')
        .select('*')
        .eq('athlete_id', uid)
        .order('assigned_at', { ascending: false })
        .limit(1);
      
      if (plansData && plansData.length > 0) {
        const p = plansData[0];
        setActivePlan({
          id: p.id,
          athleteId: p.athlete_id,
          coachId: p.coach_id,
          originalPlanId: p.original_plan_id,
          assignedAt: p.assigned_at,
          startDate: p.start_date,
          planName: p.plan_name,
          description: p.description,
          assignmentType: p.assignment_type,
          scheduleStatus: p.schedule_status,
          schedule: p.schedule,
          structure: p.structure,
        } as AssignedPlan);
      }

      // 3. Fetch Open Issues from Supabase
      const { data: attData } = await supabase
        .from('attentions')
        .select('*')
        .eq('athlete_id', uid)
        .eq('status', 'OPEN');
      
      if (attData) {
        setAttentions(attData.map((a: any) => ({
          id: a.id,
          athleteId: a.athlete_id,
          athleteName: a.athlete_name,
          coachId: a.coach_id,
          type: a.type,
          severity: a.severity,
          message: a.message,
          status: a.status,
          createdAt: a.created_at,
        } as Attention)));
      }

      // 4. Fetch Recent Activity from Supabase
      const { data: actData } = await supabase
        .from('activities')
        .select('*')
        .eq('athlete_id', uid)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (actData) {
        setActivities(actData.map((a: any) => ({
          id: a.id,
          athleteId: a.athlete_id,
          athleteName: a.athlete_name,
          type: a.type,
          title: a.title,
          subtitle: a.subtitle,
          metadata: a.metadata,
          createdAt: a.created_at,
        } as ActivityFeedItem)));
      }

      // 5. Fetch Wellness Data from Supabase (last 14 days)
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: wellnessRaw } = await supabase
        .from('daily_wellness')
        .select('*')
        .eq('athlete_id', uid)
        .gte('date', fourteenDaysAgo)
        .order('date', { ascending: true });
      
      if (wellnessRaw) {
        setWellnessData(wellnessRaw);
      }

      // 6. Fetch Weekly Stats from Supabase (last 8 weeks)
      const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: weeklyRaw } = await supabase
        .from('weekly_stats')
        .select('*')
        .eq('athlete_id', uid)
        .gte('week_start', eightWeeksAgo)
        .order('week_start', { ascending: true });
      
      if (weeklyRaw) {
        setWeeklyStats(weeklyRaw);
      }

      // 7. Fetch Personal Bests from Supabase
      const { data: pbsRaw } = await supabase
        .from('exercise_pbs')
        .select('*, exercises(name)')
        .eq('athlete_id', uid)
        .order('achieved_at', { ascending: false })
        .limit(5);
      
      if (pbsRaw) {
        setPersonalBests(pbsRaw);
      }

      // 8. Fetch Daily Stats for volume chart (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: dailyRaw } = await supabase
        .from('daily_stats')
        .select('*')
        .eq('athlete_id', uid)
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: true });
      
      if (dailyRaw) {
        setVolumeData(dailyRaw);
      }

    } catch (error) {
      console.error("Error fetching athlete card data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Mini bar chart component for coach view
  const MiniBarChart: React.FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 32 }) => {
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
          className={`w-1.5 h-1.5 rounded-full ${i < value ? 'bg-[#00FF00]' : 'bg-zinc-700'}`}
        />
      ))}
    </div>
  );

  if (!isOpen) return null;

  // Derived Stats
  const ffmi = profile?.weight && profile?.height && profile?.bodyFat 
    ? calculateFFMI(profile.weight, profile.height, profile.bodyFat) 
    : null;

  const planProgress = activePlan ? (() => {
      let total = 0;
      let done = 0;
      activePlan.structure.weeks.forEach(w => w.sessions.forEach(s => {
          if (s.workoutData) {
              s.workoutData.forEach(b => b.exercises.forEach(e => e.sets.forEach(set => {
                  total++;
                  if (set.isCompleted) done++;
              })));
          }
      }));
      return total === 0 ? 0 : Math.round((done / total) * 100);
  })() : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1C1C1E] border border-zinc-800 w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex justify-between items-start bg-zinc-900/50">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                    {profile?.firstName ? profile.firstName.charAt(0) : profile?.email?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                        {profile?.firstName} {profile?.lastName}
                        {profile?.nickname && <span className="text-zinc-500 text-lg font-normal">"{profile.nickname}"</span>}
                    </h2>
                    <p className="text-zinc-400 text-sm">{profile?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="bg-zinc-800 text-xs px-2 py-0.5 rounded text-zinc-300 border border-zinc-700 uppercase font-bold tracking-wider">{t('auth.athlete')}</span>
                        {attentions.some(a => a.type === 'INJURY') && (
                            <span className="bg-red-500/20 text-red-500 text-xs px-2 py-0.5 rounded border border-red-500/30 uppercase font-bold tracking-wider flex items-center gap-1">
                                <Activity size={12} /> Injured
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Coach Quick Actions */}
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/30">
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={async () => {
                        if (!user) return;
                        const plans = await getPlans(user.id);
                        setAvailablePlans(plans);
                        setShowPlanSelector(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#00FF00]/10 text-[#00FF00] rounded-xl hover:bg-[#00FF00]/20 transition-colors text-sm font-medium"
                >
                    <ClipboardList size={16} />
                    Training zuweisen
                </button>
                <button
                    onClick={() => {
                        onClose();
                        navigate('/planner', { state: { athleteId: athleteId, athleteName: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() } });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-colors text-sm font-medium"
                >
                    <Plus size={16} />
                    Neuen Plan erstellen
                </button>
                <button
                    onClick={() => {
                        onClose();
                        navigate('/chat', { state: { athleteId: athleteId } });
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-xl hover:bg-purple-500/20 transition-colors text-sm font-medium"
                >
                    <Send size={16} />
                    Nachricht
                </button>
            </div>
        </div>

        {/* Plan Selector Modal */}
        {showPlanSelector && (
            <div className="absolute inset-0 z-10 bg-black/80 flex items-center justify-center p-4">
                <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl w-full max-w-md p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Trainingsplan zuweisen</h3>
                    {availablePlans.length === 0 ? (
                        <p className="text-zinc-500 text-sm">Keine Pläne verfügbar. Erstelle zuerst einen Plan im Planner.</p>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {availablePlans.map((plan: any) => (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlanId(plan.id)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                                        selectedPlanId === plan.id 
                                            ? 'bg-[#00FF00]/10 border-[#00FF00]/50 text-white' 
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                                    }`}
                                >
                                    <p className="font-bold">{plan.name}</p>
                                    <p className="text-xs text-zinc-500 mt-1">{plan.description || 'Keine Beschreibung'}</p>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => { setShowPlanSelector(false); setSelectedPlanId(''); }}
                            className="flex-1 py-2 text-zinc-400 hover:text-white transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            onClick={async () => {
                                if (!selectedPlanId || !athleteId || !user) return;
                                setAssigning(true);
                                try {
                                    const plan = availablePlans.find((p: any) => p.id === selectedPlanId);
                                    
                                    // Fetch full plan structure
                                    const { data: weeks } = await supabase
                                        .from('weeks')
                                        .select('*, sessions(*)')
                                        .eq('plan_id', selectedPlanId)
                                        .order('order');
                                    
                                    const structure = {
                                        weeks: (weeks || []).map((w: any) => ({
                                            id: w.id,
                                            order: w.order,
                                            focus: w.focus,
                                            sessions: (w.sessions || []).map((s: any) => ({
                                                id: s.id,
                                                dayOfWeek: s.day_of_week,
                                                title: s.title,
                                                description: s.description,
                                                order: s.order,
                                                workoutData: s.workout_data
                                            }))
                                        }))
                                    };
                                    
                                    await createAssignedPlan({
                                        athlete_id: athleteId,
                                        coach_id: user.id,
                                        original_plan_id: selectedPlanId,
                                        plan_name: plan?.name,
                                        description: plan?.description,
                                        start_date: new Date().toISOString().split('T')[0],
                                        assignment_type: 'ONE_TO_ONE',
                                        schedule_status: 'ACTIVE',
                                        structure: structure
                                    });
                                    
                                    alert('Plan erfolgreich zugewiesen!');
                                    setShowPlanSelector(false);
                                    setSelectedPlanId('');
                                    // Refresh athlete data
                                    fetchAthleteData(athleteId);
                                } catch (error) {
                                    console.error('Error assigning plan:', error);
                                    alert('Fehler beim Zuweisen des Plans');
                                } finally {
                                    setAssigning(false);
                                }
                            }}
                            disabled={!selectedPlanId || assigning}
                            className="flex-1 py-2 bg-[#00FF00] text-black font-bold rounded-xl hover:bg-[#00FF00]/80 transition-colors disabled:opacity-50"
                        >
                            {assigning ? 'Wird zugewiesen...' : 'Zuweisen'}
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {loading ? (
                <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-2 border-[#00FF00] border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <>
                    {/* 1. Critical Attentions */}
                    {attentions.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle size={16} className="text-red-500" /> Active Issues
                            </h3>
                            <div className="grid gap-3">
                                {attentions.map(att => (
                                    <div key={att.id} className="bg-red-950/20 border border-red-900/50 p-4 rounded-2xl flex items-start gap-3">
                                        <div className={`mt-1 w-2 h-2 rounded-full ${att.severity === 'HIGH' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`}></div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-red-200 font-bold text-sm">{att.type}</span>
                                                <span className="text-red-400 text-xs uppercase border border-red-900 px-1.5 rounded">{att.severity}</span>
                                            </div>
                                            <p className="text-red-300 text-sm leading-relaxed">"{att.message}"</p>
                                            <p className="text-red-500/50 text-xs mt-2">{att.createdAt ? new Date(att.createdAt).toLocaleDateString('de-DE') : ''}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 2. Biometrics & Stats */}
                    <div>
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Activity size={16} className="text-[#00FF00]" /> Stats & Biometrics
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                                <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Ruler size={10} /> Height</div>
                                <div className="text-white font-bold text-lg">{profile?.height || '-'} <span className="text-xs text-zinc-500 font-normal">cm</span></div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                                <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Weight size={10} /> Weight</div>
                                <div className="text-white font-bold text-lg">{profile?.weight || '-'} <span className="text-xs text-zinc-500 font-normal">kg</span></div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                                <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Activity size={10} /> Body Fat</div>
                                <div className="text-white font-bold text-lg">{profile?.bodyFat || '-'} <span className="text-xs text-zinc-500 font-normal">%</span></div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                                <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1 flex items-center gap-1"><Dumbbell size={10} /> FFMI</div>
                                <div className="text-[#00FF00] font-bold text-lg">{ffmi || '-'}</div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Active Plan */}
                    <div>
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Calendar size={16} className="text-blue-400" /> Current Training Phase
                        </h3>
                        {activePlan ? (
                            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-white font-bold text-xl">{activePlan.planName}</h4>
                                            <p className="text-zinc-500 text-sm mt-1">Started: {new Date(activePlan.startDate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="bg-black/40 px-3 py-1 rounded-lg border border-zinc-700">
                                            <span className="text-[#00FF00] font-bold">{planProgress}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden">
                                        <div className="bg-[#00FF00] h-full rounded-full transition-all duration-1000" style={{width: `${planProgress}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 border-2 border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500">
                                No active plan assigned.
                            </div>
                        )}
                    </div>

                    {/* 4. Daily Wellness (Coach View) */}
                    <div>
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                            <Heart size={16} className="text-purple-400" /> Daily Wellness
                        </h3>
                        {wellnessData.length > 0 ? (
                            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                                <div className="mb-3">
                                    <MiniBarChart 
                                        data={wellnessData.map(w => ((w.energy_level || 0) + (w.mood || 0) + (6 - (w.stress_level || 3))) / 3)} 
                                        color="#A855F7" 
                                        height={40}
                                    />
                                    <p className="text-xs text-zinc-600 text-center mt-1">Wellness Score (14 Tage)</p>
                                </div>
                                {wellnessData.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-zinc-800">
                                        <div className="text-center">
                                            <Moon size={14} className="mx-auto text-blue-400 mb-1" />
                                            <p className="text-[10px] text-zinc-500">Schlaf</p>
                                            <WellnessDots value={wellnessData[wellnessData.length - 1]?.sleep_quality || 0} />
                                        </div>
                                        <div className="text-center">
                                            <Battery size={14} className="mx-auto text-yellow-400 mb-1" />
                                            <p className="text-[10px] text-zinc-500">Energie</p>
                                            <WellnessDots value={wellnessData[wellnessData.length - 1]?.energy_level || 0} />
                                        </div>
                                        <div className="text-center">
                                            <Activity size={14} className="mx-auto text-red-400 mb-1" />
                                            <p className="text-[10px] text-zinc-500">Stress</p>
                                            <WellnessDots value={6 - (wellnessData[wellnessData.length - 1]?.stress_level || 3)} />
                                        </div>
                                        <div className="text-center">
                                            <Heart size={14} className="mx-auto text-pink-400 mb-1" />
                                            <p className="text-[10px] text-zinc-500">Stimmung</p>
                                            <WellnessDots value={wellnessData[wellnessData.length - 1]?.mood || 0} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="p-4 border-2 border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500 text-sm">
                                Keine Wellness-Daten vorhanden
                            </div>
                        )}
                    </div>

                    {/* 5. Training Volume & Progress */}
                    <div>
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                            <BarChart3 size={16} className="text-blue-400" /> Training Volume
                        </h3>
                        {volumeData.length > 0 ? (
                            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-zinc-500">Letzte 30 Tage</span>
                                    {weeklyStats.length >= 2 && (() => {
                                        const thisWeek = weeklyStats[weeklyStats.length - 1]?.total_volume || 0;
                                        const lastWeek = weeklyStats[weeklyStats.length - 2]?.total_volume || 1;
                                        const change = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
                                        return (
                                            <div className={`flex items-center gap-1 text-xs ${change >= 0 ? 'text-[#00FF00]' : 'text-red-400'}`}>
                                                {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                {Math.abs(change)}%
                                            </div>
                                        );
                                    })()}
                                </div>
                                <MiniBarChart 
                                    data={volumeData.map(d => d.total_volume || 0)} 
                                    color="#00FF00" 
                                    height={48}
                                />
                                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-800">
                                    {[
                                        { label: 'Push', value: volumeData.reduce((s, d) => s + (d.push_volume || 0), 0), color: 'text-blue-400' },
                                        { label: 'Pull', value: volumeData.reduce((s, d) => s + (d.pull_volume || 0), 0), color: 'text-green-400' },
                                        { label: 'Legs', value: volumeData.reduce((s, d) => s + (d.legs_volume || 0), 0), color: 'text-purple-400' }
                                    ].map(item => (
                                        <div key={item.label} className="text-center">
                                            <p className="text-[10px] text-zinc-500">{item.label}</p>
                                            <p className={`text-sm font-bold ${item.color}`}>{Math.round(item.value / 1000)}k</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 border-2 border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500 text-sm">
                                Keine Trainingsdaten vorhanden
                            </div>
                        )}
                    </div>

                    {/* 6. Personal Bests */}
                    {personalBests.length > 0 && (
                        <div>
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Trophy size={16} className="text-yellow-400" /> Personal Records
                            </h3>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                                {personalBests.map((pb, idx) => {
                                    const isRecent = new Date(pb.achieved_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                                    return (
                                        <div 
                                            key={idx}
                                            className={`p-3 border-b border-zinc-800 last:border-0 flex items-center justify-between ${isRecent ? 'bg-yellow-500/5' : ''}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isRecent && <Flame size={12} className="text-yellow-500" />}
                                                <div>
                                                    <p className="text-white text-sm font-medium">{pb.exercises?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-zinc-500">{pb.pb_type}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-[#00FF00]">{pb.weight}kg × {pb.reps}</p>
                                                {isRecent && (
                                                    <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-1 py-0.5 rounded">NEU</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 7. Activity History */}
                    <div>
                        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                            <History size={16} className="text-zinc-400" /> Recent Activity
                        </h3>
                        <div className="space-y-0 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                            {activities.length === 0 ? (
                                <div className="p-4 text-center text-zinc-500 text-sm">No recent activity.</div>
                            ) : (
                                activities.map((act, i) => (
                                    <div key={act.id} className="p-4 border-b border-zinc-800 last:border-0 flex items-center gap-4 hover:bg-zinc-800/50 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-zinc-950 flex items-center justify-center text-zinc-500 shrink-0">
                                            {act.type === 'WORKOUT_COMPLETE' ? <Dumbbell size={16} /> : <Activity size={16} />}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{act.title}</p>
                                            <p className="text-zinc-500 text-xs">{act.createdAt ? new Date(act.createdAt).toLocaleString('de-DE') : ''} • {act.subtitle}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default AthleteProfileModal;