import React, { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore/lite';
import { db } from '../services/firebase';
import { UserProfile, AssignedPlan, Attention, ActivityFeedItem } from '../types';
import { X, User, Activity, AlertTriangle, Calendar, ChevronRight, Dumbbell, History, Ruler, Weight } from 'lucide-react';
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

    } catch (error) {
      console.error("Error fetching athlete card data:", error);
    } finally {
      setLoading(false);
    }
  };

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

                    {/* 4. Activity History */}
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