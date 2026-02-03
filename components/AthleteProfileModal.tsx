import React, { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore/lite';
import { db } from '../services/firebase';
import { supabase } from '../services/supabase';
import { UserProfile, AssignedPlan, Attention, ActivityFeedItem } from '../types';
import { X, User, Activity, AlertTriangle, Calendar, ChevronRight, Dumbbell, History, Ruler, Weight, TrendingUp, TrendingDown, Heart, Moon, Battery, Trophy, BarChart3, Flame } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { calculateFFMI } from '../utils/formulas';

interface AthleteProfileModalProps {
  athleteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const AthleteProfileModal: React.FC<AthleteProfileModalProps> = ({ athleteId, isOpen, onClose }) => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
      // 1. Fetch Profile
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
      }

      // 2. Fetch Active Plan
      const planQ = query(collection(db, 'assigned_plans'), where('athleteId', '==', uid));
      const planSnap = await getDocs(planQ);
      if (!planSnap.empty) {
        // Sort by assigned date desc, take first
        const plans = planSnap.docs.map(d => ({id: d.id, ...d.data()} as AssignedPlan));
        plans.sort((a,b) => (b.assignedAt?.seconds || 0) - (a.assignedAt?.seconds || 0));
        setActivePlan(plans[0]);
      }

      // 3. Fetch Open Issues (Injuries/Attentions)
      const attQ = query(
          collection(db, 'attentions'), 
          where('athleteId', '==', uid),
          where('status', '==', 'OPEN')
      );
      const attSnap = await getDocs(attQ);
      setAttentions(attSnap.docs.map(d => ({id: d.id, ...d.data()} as Attention)));

      // 4. Fetch Recent Activity
      const actQ = query(
          collection(db, 'activities'), 
          where('athleteId', '==', uid),
          orderBy('createdAt', 'desc'),
          limit(5)
      );
      const actSnap = await getDocs(actQ);
      setActivities(actSnap.docs.map(d => ({id: d.id, ...d.data()} as ActivityFeedItem)));

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
                                            <p className="text-red-500/50 text-xs mt-2">{new Date(att.createdAt?.seconds * 1000).toLocaleDateString()}</p>
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
                                            <p className="text-zinc-500 text-xs">{new Date(act.createdAt?.seconds * 1000).toLocaleString()} • {act.subtitle}</p>
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