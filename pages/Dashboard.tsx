import React, { useEffect, useState, useMemo } from 'react';
import { supabase, getAssignedPlans, updateAssignedPlan, getAttentions, getActivities, getAppointments, createAttention, createActivity, getPlans, getWeeksByPlan, getSessionsByWeek, getPendingCoachingApprovals, approveCoaching, rejectCoaching, updateAppointment, getActiveCoachingRelationships, getAllAthletes, sendAttentionChatNotification } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole, AssignedPlan, AssignedSession, WorkoutSet, Attention, ActivityFeedItem, AttentionType, AttentionSeverity, Appointment, TrainingPlan, TrainingWeek, TrainingSession, CoachingApproval } from '../types';
import { Clock, CheckCircle2, Circle, ChevronLeft, ChevronRight, Calendar as CalendarDays, Flame, Bell, Activity, ChevronDown, ChevronUp, ExternalLink, Zap, Layers, Repeat, Play, Square, Timer, Calculator, Dumbbell, AlertCircle, TrendingUp, User, Moon, Smile, X, MessageSquare, AlertTriangle, Phone, Plus, List, UserCheck, UserX } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import ProfileSetupWizard from '../components/ProfileSetupWizard';
import WorkoutTimer from '../components/WorkoutTimer';
import CalculatorsModal from '../components/CalculatorsModal';
import AthleteProfileModal from '../components/AthleteProfileModal';
import AthleteTrainingView from '../components/AthleteTrainingView';
import AthleteDashboard from './AthleteDashboard';
import CoachChat from '../components/CoachChat';
import ComplianceDashboard from '../components/ComplianceDashboard';
import RevenueWidget from '../components/RevenueWidget';
import { calculateVolumeLoad } from '../utils/formulas';
import { useLocation } from 'react-router-dom';

// Enhanced Line Chart with Gradient
const ModernLineChart = ({ data, color = "#00FF00" }: { data: number[], color?: string }) => {
    if (data.length < 2) return (
        <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600 font-medium">
            No Data
        </div>
    );
    
    const max = Math.max(...data, 1);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((val - min) / range) * 80 - 10; // 10% padding
        return `${x},${y}`;
    }).join(' ');

    const areaPoints = `0,100 ${points} 100,100`;

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
            <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.5"/>
                    <stop offset="100%" stopColor={color} stopOpacity="0"/>
                </linearGradient>
            </defs>
            <path d={`M ${areaPoints}`} fill="url(#chartGradient)" />
            <polyline fill="none" stroke={color} strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {data.map((val, i) => {
                 const x = (i / (data.length - 1)) * 100;
                 const y = 100 - ((val - min) / range) * 80 - 10;
                 return <circle key={i} cx={x} cy={y} r="2" fill="#1C1C1E" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />;
            })}
        </svg>
    );
};

const ReportIssueModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const { t } = useLanguage();
    const { user, userProfile } = useAuth();
    const [type, setType] = useState<AttentionType>('INJURY');
    const [severity, setSeverity] = useState<AttentionSeverity>('MEDIUM');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile) return;
        setLoading(true);
        try {
            const attentionData = await createAttention({
                athlete_id: user.id,
                athlete_name: userProfile.nickname || userProfile.email,
                type,
                severity,
                message,
                status: 'OPEN',
            });
            
            // Also log to Activity Feed
            await createActivity({
                athlete_id: user.id,
                athlete_name: userProfile.nickname || userProfile.email,
                type: 'NOTE',
                title: type === 'INJURY' ? t('dashboard.injuryReported') : 'Reported an Issue',
                subtitle: message,
            });

            // Auto-send system message to coaching chat
            if (attentionData?.id) {
                await sendAttentionChatNotification(user.id, {
                    id: attentionData.id,
                    type,
                    severity,
                    message,
                });
            }

            alert(t('report.success'));
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-[#1C1C1E] border border-zinc-800 w-full max-w-md rounded-2xl p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={24}/></button>
                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    <AlertTriangle className="text-red-500" size={24} /> {t('report.title')}
                </h3>
                <p className="text-zinc-500 text-sm mb-6">{t('report.subtitle')}</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('report.type')}</label>
                        <select value={type} onChange={(e) => setType(e.target.value as AttentionType)} className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-red-500 outline-none">
                            <option value="INJURY">{t('report.injury')}</option>
                            <option value="MISSED_SESSION">{t('report.missed')}</option>
                            <option value="FEEDBACK">{t('report.feedback')}</option>
                            <option value="OTHER">{t('report.other')}</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('report.severity')}</label>
                        <select value={severity} onChange={(e) => setSeverity(e.target.value as AttentionSeverity)} className="bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-red-500 outline-none">
                            <option value="LOW">{t('report.low')}</option>
                            <option value="MEDIUM">{t('report.medium')}</option>
                            <option value="HIGH">{t('report.high')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-1">{t('common.message')}</label>
                        <textarea 
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                            className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-red-500 outline-none h-32 resize-none placeholder-zinc-600"
                            placeholder={t('report.descPlaceholder')}
                        />
                    </div>
                    <Button type="submit" disabled={loading} fullWidth variant="danger">
                        {loading ? t('common.loading') : t('common.submit')}
                    </Button>
                </form>
            </div>
        </div>
    );
};

// --- CUSTOM SESSION SELECTOR ---
const CustomSessionSelector = ({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (session: AssignedSession) => void }) => {
    const { user } = useAuth();
    const [plans, setPlans] = useState<TrainingPlan[]>([]);
    const [weeks, setWeeks] = useState<TrainingWeek[]>([]);
    const [sessions, setSessions] = useState<TrainingSession[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [selectedWeekId, setSelectedWeekId] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(isOpen && user) {
            fetchMyPlans();
        }
    }, [isOpen, user]);

    const fetchMyPlans = async () => {
        if(!user) return;
        setLoading(true);
        try {
            const data = await getPlans(user.id);
            setPlans(data.map((d: any) => ({id: d.id, coachId: d.coach_id, name: d.name, description: d.description} as TrainingPlan)));
        } catch(e) { console.error(e); } finally { setLoading(false); }
    };

    const fetchWeeks = async (planId: string) => {
        setSelectedPlanId(planId);
        setSelectedWeekId('');
        setSessions([]);
        const data = await getWeeksByPlan(planId);
        setWeeks(data.map((d: any) => ({id: d.id, planId: d.plan_id, order: d.order, focus: d.focus} as TrainingWeek)));
    };

    const fetchSessions = async (weekId: string) => {
        setSelectedWeekId(weekId);
        const data = await getSessionsByWeek(weekId);
        setSessions(data.map((d: any) => ({id: d.id, weekId: d.week_id, dayOfWeek: d.day_of_week, title: d.title, description: d.description, order: d.order, workoutData: d.workout_data} as TrainingSession)));
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#1C1C1E] w-full max-w-md rounded-2xl border border-zinc-800 p-6 flex flex-col h-[70vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Select Custom Workout</h3>
                    <button onClick={onClose}><X className="text-zinc-500 hover:text-white" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4">
                    {!selectedPlanId ? (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">My Plans</p>
                            {plans.length === 0 ? <p className="text-zinc-500">No plans found. Create one in Planner.</p> : 
                                plans.map(p => (
                                    <button key={p.id} onClick={() => fetchWeeks(p.id)} className="w-full text-left p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-[#00FF00] transition-all">
                                        <div className="font-bold text-white">{p.name}</div>
                                    </button>
                                ))
                            }
                        </div>
                    ) : !selectedWeekId ? (
                        <div className="space-y-2">
                            <button onClick={() => setSelectedPlanId('')} className="text-xs text-zinc-500 hover:text-white mb-2 flex items-center gap-1"><ChevronLeft size={12}/> Back to Plans</button>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Select Week</p>
                            {weeks.map(w => (
                                <button key={w.id} onClick={() => fetchSessions(w.id)} className="w-full text-left p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-[#00FF00] transition-all">
                                    <div className="font-bold text-white">{w.focus || `Week ${w.order}`}</div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <button onClick={() => setSelectedWeekId('')} className="text-xs text-zinc-500 hover:text-white mb-2 flex items-center gap-1"><ChevronLeft size={12}/> Back to Weeks</button>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Select Session</p>
                            {sessions.map(s => (
                                <button key={s.id} onClick={() => onSelect(s)} className="w-full text-left p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-[#00FF00] transition-all flex justify-between items-center group">
                                    <div>
                                        <div className="font-bold text-white group-hover:text-[#00FF00]">{s.title}</div>
                                        <div className="text-xs text-zinc-500">{s.description || 'No description'}</div>
                                    </div>
                                    <Play size={16} className="text-zinc-500 group-hover:text-[#00FF00]"/>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
  const { user, userProfile, refreshProfile } = useAuth();
  const { t, language } = useLanguage();
  const location = useLocation();
  
  // Athlete State
  const [activePlan, setActivePlan] = useState<AssignedPlan | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [viewMode, setViewMode] = useState<'hub' | 'training'>('hub');
  const [athleteTab, setAthleteTab] = useState<'training' | 'dashboard'>('training');
  
  // Coach Dashboard Data
  const [attentions, setAttentions] = useState<Attention[]>([]);
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [coachingApprovals, setCoachingApprovals] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [myAthletes, setMyAthletes] = useState<any[]>([]);
  const [chatTarget, setChatTarget] = useState<{ relationshipId: string; athleteId: string; athleteName: string } | null>(null);
  const [allAthletes, setAllAthletes] = useState<any[]>([]);
  
  // UI State
  const [expandedBlockIds, setExpandedBlockIds] = useState<Set<string>>(new Set());
  const [sessionActive, setSessionActive] = useState(false);
  const [activeInputTimer, setActiveInputTimer] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCustomSessionSelector, setShowCustomSessionSelector] = useState(false);
  
  // Profile Setup State
  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const [showTools, setShowTools] = useState(false);

  // Wellness State
  const [wellnessLogged, setWellnessLogged] = useState(false);

  // Date State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Flex Scheduling State
  const [availableSessionsForWeek, setAvailableSessionsForWeek] = useState<AssignedSession[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

  // Ad-Hoc Session State
  const [customSession, setCustomSession] = useState<AssignedSession | null>(null);

  useEffect(() => {
      if (location.state?.view) {
        setViewMode(location.state.view);
        // Sync athleteTab with viewMode for consistent navigation
        if (location.state.view === 'hub') {
          setAthleteTab('dashboard');
        } else if (location.state.view === 'training') {
          setAthleteTab('training');
        }
      }
  }, [location.state]);

  useEffect(() => {
    if (!user) return;

    if (userProfile?.role === UserRole.ATHLETE) {
        if (userProfile.onboardingCompleted === undefined || userProfile.onboardingCompleted === false) {
            setShowProfileWizard(true);
        }
        fetchActivePlan();
    } else {
        // Coach / Admin: Fetch Dashboard Data
        fetchCoachDashboardData();
    }
  }, [user, userProfile]);

  const fetchCoachDashboardData = async () => {
      try {
          // Fetch Attentions (Open Issues)
          const attData = await getAttentions();
          const fetchedAttentions = attData
            .filter((d: any) => d.status === 'OPEN')
            .map((d: any) => ({
              id: d.id,
              athleteId: d.athlete_id,
              athleteName: d.athlete_name,
              coachId: d.coach_id,
              type: d.type,
              severity: d.severity,
              message: d.message,
              status: d.status,
              createdAt: d.created_at,
            } as Attention));
          
          setAttentions(fetchedAttentions);

          // Fetch Recent Activity Feed
          const feedData = await getActivities(10);
          setActivityFeed(feedData.map((d: any) => ({
            id: d.id,
            athleteId: d.athlete_id,
            athleteName: d.athlete_name,
            type: d.type,
            title: d.title,
            subtitle: d.subtitle,
            metadata: d.metadata,
            createdAt: d.created_at,
          } as ActivityFeedItem)));

          // Fetch Appointments (Pending)
          const appData = await getAppointments();
          setAppointments(appData
            .filter((d: any) => d.status === 'PENDING')
            .map((d: any) => ({
              id: d.id,
              athleteId: d.athlete_id,
              athleteName: d.athlete_name,
              coachId: d.coach_id,
              date: d.date,
              time: d.time,
              status: d.status,
              type: d.type,
              createdAt: d.created_at,
            } as Appointment)));

          // Fetch Pending Coaching Approvals
          if (user) {
              const approvals = await getPendingCoachingApprovals(user.id);
              setCoachingApprovals(approvals);
          }

          // Fetch My Athletes (Coach's assigned athletes)
          if (user) {
              const relationships = await getActiveCoachingRelationships(user.id);
              setMyAthletes(relationships);
          }

          // Admin: Fetch all athletes
          if (userProfile?.role === UserRole.ADMIN) {
              const athletes = await getAllAthletes();
              setAllAthletes(athletes);
          }

      } catch (error) {
          console.error("Error fetching coach dashboard:", error);
      }
  };

  // Handle coaching approval
  const handleApproveCoaching = async (approvalId: string) => {
      if (!user || !userProfile) return;
      setApprovingId(approvalId);
      try {
          const result = await approveCoaching(approvalId, user.id);
          
          // Send approval email to athlete
          const approval = coachingApprovals.find(a => a.id === approvalId);
          if (approval) {
            try {
              await fetch('/api/send-coaching-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'approved',
                  data: {
                    athleteName: approval.athleteName || 'Athlet',
                    athleteEmail: approval.athleteEmail,
                    coachName: userProfile.nickname || userProfile.firstName || 'Coach',
                    productName: approval.productName || 'Coaching-Paket',
                  }
                })
              });
              console.log('✅ Approval email sent');
            } catch (emailError) {
              console.error('Email send error:', emailError);
            }
          }
          
          // Refresh data
          await fetchCoachDashboardData();
      } catch (error) {
          console.error("Error approving coaching:", error);
          alert("Fehler beim Freischalten.");
      } finally {
          setApprovingId(null);
      }
  };

  // Handle coaching rejection
  const handleRejectCoaching = async (approvalId: string) => {
      if (!user || !userProfile) return;
      const reason = prompt("Grund für die Ablehnung (optional):");
      setApprovingId(approvalId);
      try {
          await rejectCoaching(approvalId, reason || "Keine Angabe");
          
          // Send rejection email to athlete
          const approval = coachingApprovals.find(a => a.id === approvalId);
          if (approval) {
            try {
              await fetch('/api/send-coaching-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'rejected',
                  data: {
                    athleteName: approval.athleteName || 'Athlet',
                    athleteEmail: approval.athleteEmail,
                    coachName: userProfile.nickname || userProfile.firstName || 'Coach',
                    productName: approval.productName || 'Coaching-Paket',
                    reason: reason || 'Keine Angabe',
                  }
                })
              });
              console.log('✅ Rejection email sent');
            } catch (emailError) {
              console.error('Email send error:', emailError);
            }
          }
          
          await fetchCoachDashboardData();
      } catch (error) {
          console.error("Error rejecting coaching:", error);
          alert("Fehler beim Ablehnen.");
      } finally {
          setApprovingId(null);
      }
  };

  // Mark appointment as completed
  const handleCompleteAppointment = async (appointmentId: string) => {
      try {
          await updateAppointment(appointmentId, { status: 'COMPLETED' });
          await fetchCoachDashboardData();
      } catch (error) {
          console.error("Error completing appointment:", error);
      }
  };

  const fetchActivePlan = async () => {
      if (!user) return;
      setLoadingPlan(true);
      try {
          const data = await getAssignedPlans(user.id);
          if (data.length > 0) {
              const plans = data.map((d: any) => ({
                id: d.id,
                athleteId: d.athlete_id,
                coachId: d.coach_id,
                originalPlanId: d.original_plan_id,
                assignedAt: d.assigned_at,
                startDate: d.start_date,
                planName: d.plan_name,
                description: d.description,
                assignmentType: d.assignment_type,
                scheduleStatus: d.schedule_status,
                schedule: d.schedule || {},
                structure: d.structure,
              } as AssignedPlan));
              setActivePlan(plans[0]);
          }
      } catch (error) {
          console.error("Error fetching active plan:", error);
      } finally {
          setLoadingPlan(false);
      }
  };

  // --- ANALYTICS ---
  const analytics = useMemo(() => {
      if (!activePlan) return null;
      let totalSets = 0, completedSets = 0, totalVolume = 0, totalSessions = 0, completedSessionsCount = 0;
      const weeklyVolume: number[] = [];

      activePlan.structure.weeks.forEach((week) => {
          let weekVol = 0;
          week.sessions.forEach(session => {
              totalSessions++;
              let sessionSets = 0, sessionCompletedSets = 0;
              if(session.workoutData) {
                  session.workoutData.forEach(block => {
                      block.exercises.forEach(ex => {
                          ex.sets.forEach(set => {
                              totalSets++; sessionSets++;
                              const isDone = set.isCompleted || (set.completedReps && set.completedReps.length > 0);
                              if (isDone) {
                                  completedSets++; sessionCompletedSets++;
                                  const w = parseFloat(set.completedWeight || '0');
                                  const r = parseFloat(set.completedReps || '0');
                                  if (!isNaN(w) && !isNaN(r)) { 
                                      const setVol = calculateVolumeLoad(w, r);
                                      weekVol += setVol; 
                                      totalVolume += setVol; 
                                  }
                              }
                          });
                      });
                  });
              }
              if (sessionSets > 0 && (sessionCompletedSets / sessionSets) > 0.7) completedSessionsCount++;
          });
          weeklyVolume.push(Math.round(weekVol));
      });
      if (weeklyVolume.length === 1) weeklyVolume.unshift(0);

      return {
          completionRate: totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100),
          totalVolumeTons: (totalVolume / 1000).toFixed(1),
          weeklyVolume,
          completedSessionsCount,
          totalSessions
      };
  }, [activePlan]);

  // --- HELPERS ---
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.morning');
    if (hour < 18) return t('dashboard.afternoon');
    return t('dashboard.evening');
  };

  const normalizeDate = (d: Date) => { const c = new Date(d); c.setHours(0,0,0,0); return c; };
  const formatDateKey = (d: Date) => normalizeDate(d).toISOString().split('T')[0];

  // --- INTERACTION LOGIC ---
  const toggleBlockExpand = (blockId: string) => {
      const newSet = new Set(expandedBlockIds);
      if (newSet.has(blockId)) newSet.delete(blockId);
      else newSet.add(blockId);
      setExpandedBlockIds(newSet);
  };

  const handleStartSession = (firstBlockId?: string) => {
      setSessionActive(true);
      if (firstBlockId) setExpandedBlockIds(new Set([firstBlockId]));
  };

  const handleFinishBlock = (blockId: string, nextBlockId?: string) => {
      const newSet = new Set(expandedBlockIds);
      newSet.delete(blockId);
      if (nextBlockId) {
          newSet.add(nextBlockId);
          setTimeout(() => document.getElementById(`block-${nextBlockId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      }
      setExpandedBlockIds(newSet);
  };

  const handleCompleteSession = async () => {
      setSessionActive(false);
      if (!user || !userProfile) return;
      
      const sessionToComplete = customSession || currentViewData?.session;
      if (!sessionToComplete) return;

      try {
          // Log Activity
          await createActivity({
              athlete_id: user.id,
              athlete_name: userProfile.nickname || userProfile.email,
              type: 'WORKOUT_COMPLETE',
              title: `Completed ${sessionToComplete.title}`,
              subtitle: `${calculateVolumeLoad(1,1)}kg Volume`,
              metadata: {
                  sessionId: sessionToComplete.id,
                  planId: activePlan?.id || 'custom',
                  isCustom: !!customSession
              }
          });
          
          if (customSession) {
              setCustomSession(null);
          }
          // Redirect to Hub to show progress update
          setViewMode('hub');
      } catch (e) {
          console.error("Error completing session:", e);
      }
  };

  const handleLogSet = async (blockId: string, exerciseId: string, setId: string, field: keyof WorkoutSet, value: string) => {
      if (customSession) {
          // Local State Update for Custom Session (not persisted deeply in DB for now, just local for the active session view)
          const updatedSession = { ...customSession };
          if(updatedSession.workoutData) {
              updatedSession.workoutData.forEach(block => {
                  if(block.id === blockId) {
                      block.exercises.forEach(ex => {
                          if(ex.id === exerciseId) {
                              const set = ex.sets.find(s => s.id === setId);
                              if(set) {
                                  (set as any)[field] = value;
                                  if(value.length > 0) set.isCompleted = true;
                              }
                          }
                      })
                  }
              })
          }
          setCustomSession(updatedSession);
          return;
      }

      if (!activePlan) return;
      const updatedPlan = { ...activePlan };
      
      let found = false;
      for (const week of updatedPlan.structure.weeks) {
          for (const session of week.sessions) {
              if (session.workoutData) {
                  for (const block of session.workoutData) {
                      if (block.id === blockId) {
                          for (const ex of block.exercises) {
                              if (ex.id === exerciseId) {
                                  const set = ex.sets.find(s => s.id === setId);
                                  if (set) {
                                      (set as any)[field] = value;
                                      if (value.length > 0) set.isCompleted = true;
                                      found = true;
                                  }
                              }
                          }
                      }
                  }
              }
          }
      }

      if (found) {
          setActivePlan(updatedPlan);
          try {
              await updateAssignedPlan(activePlan.id, { structure: updatedPlan.structure });
          } catch (e) { console.error("Failed to log set", e); }
      }
  };

  const handleTimerStop = (finalTime: number, blockId: string, exerciseId: string, setId: string, field: keyof WorkoutSet) => {
      let timeStr = `${finalTime}s`;
      if (finalTime > 60) {
          const m = Math.floor(finalTime / 60);
          const s = finalTime % 60;
          timeStr = `${m}:${s.toString().padStart(2,'0')}`;
      }
      handleLogSet(blockId, exerciseId, setId, field, timeStr);
      setActiveInputTimer(null);
  };

  const renderTarget = (set: WorkoutSet) => {
      const targets = [];
      if (set.reps) targets.push(`${set.reps} ${t('editor.metric_reps')}`);
      if (set.weight) targets.push(`${set.weight} ${t('editor.metric_weight')}`);
      if (set.rpe) targets.push(`RPE ${set.rpe}`);
      if (set.time) targets.push(set.time);
      if (set.distance) targets.push(set.distance);
      return targets.length > 0 ? targets.join(" • ") : "-";
  };

  // --- SETUP WIZARD (Flex) ---
  const toggleDaySelection = (dayIndex: number) => {
     if (selectedDays.includes(dayIndex)) setSelectedDays(selectedDays.filter(d => d !== dayIndex));
     else setSelectedDays([...selectedDays, dayIndex].sort());
  };

  const handleConfirmSchedule = async () => {
      if (!activePlan) return;
      setIsGeneratingSchedule(true);
      try {
          const newSchedule: Record<string, string> = {};
          const planStart = new Date(activePlan.startDate); 
          activePlan.structure.weeks.forEach((week, wIndex) => {
             const sessions = [...week.sessions].sort((a,b) => a.order - b.order);
             sessions.forEach((session, sIndex) => {
                 const targetDayIndex = selectedDays[sIndex % selectedDays.length]; 
                 const weekStart = new Date(planStart);
                 weekStart.setDate(weekStart.getDate() + (wIndex * 7));
                 const startDayIndex = (weekStart.getDay() + 6) % 7;
                 const sessionDate = new Date(weekStart);
                 sessionDate.setDate(sessionDate.getDate() + (targetDayIndex - startDayIndex));
                 newSchedule[formatDateKey(sessionDate)] = session.id;
             });
          });
          await updateAssignedPlan(activePlan.id, { schedule: newSchedule, schedule_status: 'ACTIVE' });
          setActivePlan({ ...activePlan, schedule: newSchedule, scheduleStatus: 'ACTIVE' });
      } catch (error) { console.error(error); } finally { setIsGeneratingSchedule(false); }
  };

  // --- CALENDAR ---
  const getWeekDays = (anchor: Date) => {
    const d = new Date(anchor);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    return Array.from({length: 7}, (_, i) => {
        const t = new Date(mon); t.setDate(mon.getDate() + i); return t;
    });
  };
  const daysInView = getWeekDays(currentDate);

  const getSessionForDate = (date: Date) => {
      if (!activePlan || !activePlan.startDate) return null;
      const start = normalizeDate(new Date(activePlan.startDate));
      const target = normalizeDate(date);
      const diffDays = Math.floor((target.getTime() - start.getTime()) / (86400000));
      if (diffDays < 0) return null;

      const weekIndex = Math.floor(diffDays / 7);
      const dayIndex = diffDays % 7; 
      const week = activePlan.structure.weeks.find(w => (w.order - 1) === weekIndex);
      if (!week) return { session: null, weekIndex: weekIndex + 1 };

      let session: AssignedSession | undefined;
      if (activePlan.assignmentType === 'GROUP_FLEX') {
          const sid = activePlan.schedule?.[formatDateKey(date)];
          if (sid) session = week.sessions.find(s => s.id === sid);
      } else {
          session = week.sessions.find(s => s.dayOfWeek === dayIndex);
      }
      return { session: session || null, weekIndex: week.order };
  };

  useEffect(() => {
    if (!activePlan || activePlan.assignmentType !== 'GROUP_FLEX') { setAvailableSessionsForWeek([]); return; }
    const start = normalizeDate(new Date(activePlan.startDate));
    const now = normalizeDate(currentDate);
    const wIdx = Math.floor((now.getTime() - start.getTime()) / (86400000 * 7));
    const week = activePlan.structure.weeks.find(w => (w.order - 1) === wIdx);
    setAvailableSessionsForWeek(week ? week.sessions : []);
  }, [activePlan, currentDate]);

  const scheduleSession = async (session: AssignedSession) => {
      if (!activePlan) return;
      const key = formatDateKey(currentDate);
      const newSchedule = { ...activePlan.schedule, [key]: session.id };
      setActivePlan({ ...activePlan, schedule: newSchedule });
      await updateAssignedPlan(activePlan.id, { schedule: newSchedule });
  };

  const currentViewData = getSessionForDate(currentDate);
  
  // Decide which session to show: Custom Ad-Hoc OR Assigned
  const nextWorkout = customSession || currentViewData?.session;

  const handleSelectCustomSession = (session: AssignedSession) => {
      setCustomSession(session);
      setShowCustomSessionSelector(false);
      // Automatically "Start" the view if needed, or let user click Start
  };

  // =========================================================
  // COACH & ADMIN VIEW - MANAGEMENT DASHBOARD
  // =========================================================
  if (userProfile?.role === UserRole.COACH || userProfile?.role === UserRole.ADMIN) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            {/* ... Existing Coach Dashboard ... */}
            {/* Keeping existing coach dashboard code unchanged for brevity in this output block, assume it is here */}
             <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        {getGreeting()}, <span className="text-[#00FF00]">{userProfile?.email?.split('@')[0]}</span>
                    </h1>
                    <p className="text-zinc-400 mt-1">{t('dashboard.teamOverview')}</p>
                </div>
            </div>
            <AthleteProfileModal isOpen={!!selectedAthleteId} athleteId={selectedAthleteId} onClose={() => setSelectedAthleteId(null)} />

            {/* Coach Chat Modal */}
            {chatTarget && user && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="w-full max-w-lg">
                  <CoachChat
                    relationshipId={chatTarget.relationshipId}
                    partnerId={chatTarget.athleteId}
                    partnerName={chatTarget.athleteName}
                    currentUserId={user.id}
                    hasAccess={true}
                    onClose={() => setChatTarget(null)}
                  />
                </div>
              </div>
            )}

            {/* Revenue Widget (Admin Only) */}
            {userProfile?.role === UserRole.ADMIN && (
              <RevenueWidget />
            )}

            {/* Coach KPIs & Feeds */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1C1C1E] p-5 rounded-[1.5rem] border border-zinc-800 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">{t('dashboard.openIssues')}</div>
                        <div className="text-3xl font-bold text-white">{attentions.length}</div>
                        <div className="text-xs text-red-500 mt-1 font-medium">{t('dashboard.highPriority', { count: String(attentions.filter(a => a.severity === 'HIGH').length) })}</div>
                    </div>
                    <div className="absolute right-0 bottom-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <AlertCircle size={40} />
                    </div>
                </div>
                {/* Appointment KPI */}
                <div className="bg-[#1C1C1E] p-5 rounded-[1.5rem] border border-zinc-800 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">{t('dashboard.requests')}</div>
                        <div className="text-3xl font-bold text-white">{appointments.length}</div>
                        <div className="text-xs text-blue-400 mt-1 font-medium">{t('dashboard.pendingApprovals')}</div>
                    </div>
                    <div className="absolute right-0 bottom-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Phone size={40} />
                    </div>
                </div>
            </div>

            {/* Quick Actions & Feed */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Needs Attention / Alerts */}
                <div className="col-span-1 bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Bell size={18} className="text-red-500" /> {t('dashboard.needsAttention')}
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {attentions.length === 0 ? (
                            <p className="text-zinc-500 text-sm italic">{t('dashboard.noOpenIssues')}</p>
                        ) : (
                            attentions.map(att => (
                                <div key={att.id} onClick={() => setSelectedAthleteId(att.athleteId)} className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer group">
                                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-zinc-500 group-hover:text-white transition-colors">
                                        {att.athleteName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between">
                                            <div className="text-sm font-bold text-white truncate group-hover:text-[#00FF00] transition-colors">{att.athleteName}</div>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${att.severity === 'HIGH' ? 'bg-red-500 text-white' : 'bg-zinc-700 text-zinc-300'}`}>{att.type}</span>
                                        </div>
                                        <div className="text-xs text-zinc-400 truncate">{att.message}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Team Activity Feed */}
                <div className="col-span-1 md:col-span-2 bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-[#00FF00]" /> {t('dashboard.recentActivity')}
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {/* Coaching Approvals - Athletes waiting for approval */}
                        {coachingApprovals.length > 0 && (
                            <div className="mb-4 space-y-2">
                                <h4 className="text-xs text-[#00FF00] uppercase font-bold tracking-wider flex items-center gap-2">
                                    <UserCheck size={14} /> Coaching-Anfragen freischalten
                                </h4>
                                {coachingApprovals.map(approval => (
                                    <div key={approval.id} className="p-4 bg-[#00FF00]/5 border border-[#00FF00]/30 rounded-xl">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#00FF00]/20 text-[#00FF00] flex items-center justify-center font-bold">
                                                    {(approval.athlete?.first_name?.[0] || approval.athlete?.email?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">
                                                        {approval.athlete?.first_name ? `${approval.athlete.first_name} ${approval.athlete.last_name || ''}` : approval.athlete?.email}
                                                    </p>
                                                    <p className="text-xs text-zinc-400">{approval.product?.title}</p>
                                                    {approval.consultation_completed ? (
                                                        <span className="text-xs text-[#00FF00] flex items-center gap-1 mt-1">
                                                            <CheckCircle2 size={12} /> Gespräch abgeschlossen
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-yellow-500 flex items-center gap-1 mt-1">
                                                            <Clock size={12} /> Gespräch ausstehend
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleApproveCoaching(approval.id)}
                                                    disabled={approvingId === approval.id}
                                                    className="p-2 bg-[#00FF00] text-black rounded-lg hover:bg-[#00FF00]/80 transition-colors disabled:opacity-50"
                                                    title="Freischalten"
                                                >
                                                    <UserCheck size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleRejectCoaching(approval.id)}
                                                    disabled={approvingId === approval.id}
                                                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                                    title="Ablehnen"
                                                >
                                                    <UserX size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Show Appointments in feed as well */}
                        {appointments.length > 0 && (
                            <div className="mb-4 space-y-2">
                                <h4 className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Neue Termin-Anfragen</h4>
                                {appointments.map(app => (
                                    <div key={app.id} className="flex gap-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl items-center">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                                            <Phone size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-white"><span className="font-bold">{app.athleteName}</span> möchte ein Gespräch.</p>
                                            <p className="text-xs text-zinc-400">{app.date} um {app.time}</p>
                                        </div>
                                        <button 
                                            onClick={() => handleCompleteAppointment(app.id)}
                                            className="text-xs bg-[#00FF00] text-black px-3 py-1.5 rounded font-bold hover:bg-[#00FF00]/80 transition-colors"
                                        >
                                            Abgeschlossen
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activityFeed.length === 0 && appointments.length === 0 ? (
                            <p className="text-zinc-500 text-sm italic">{t('dashboard.noRecentActivity')}</p>
                        ) : (
                            activityFeed.map(feed => (
                                <div key={feed.id} onClick={() => setSelectedAthleteId(feed.athleteId)} className="flex gap-4 border-b border-zinc-800 pb-4 last:border-0 last:pb-0 hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors cursor-pointer group">
                                    <div className="w-10 h-10 rounded-full bg-[#00FF00]/10 text-[#00FF00] flex items-center justify-center font-bold shrink-0 group-hover:scale-110 transition-transform">
                                        {feed.athleteName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm text-white">
                                            <span className="font-bold group-hover:text-[#00FF00] transition-colors">{feed.athleteName}</span> {feed.title}
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {feed.subtitle} {feed.createdAt && `• ${new Date(feed.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Athlete Compliance Dashboard */}
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <User size={18} className="text-[#00FF00]" /> 
                    {userProfile?.role === UserRole.ADMIN ? t('dashboard.allAthletes') : t('dashboard.myAthletes')}
                </h3>
                <ComplianceDashboard
                  onSelectAthlete={(id) => setSelectedAthleteId(id)}
                  onOpenChat={(relId, athId, name) => setChatTarget({ relationshipId: relId, athleteId: athId, athleteName: name })}
                />
            </div>

            {/* Legacy MY ATHLETES Grid (Admin: all athletes) */}
            {userProfile?.role === UserRole.ADMIN && allAthletes.length > 0 && (
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <User size={18} className="text-zinc-400" /> 
                        {t('dashboard.allAthletes')}
                    </h3>
                    <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-400">
                        {allAthletes.length} Athleten
                    </span>
                </div>

                {/* Athletes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(userProfile?.role === UserRole.ADMIN ? allAthletes : myAthletes).length === 0 ? (
                        <div className="col-span-full text-center py-8 text-zinc-500">
                            <User size={32} className="mx-auto mb-2 text-zinc-700" />
                            <p className="text-sm">
                                {userProfile?.role === UserRole.ADMIN 
                                    ? t('dashboard.noAthletesAdmin') 
                                    : t('dashboard.noAthletesCoach')}
                            </p>
                        </div>
                    ) : (
                        (userProfile?.role === UserRole.ADMIN ? allAthletes : myAthletes).map((item: any) => {
                            // For Admin: item is athlete profile directly
                            // For Coach: item is coaching_relationship with nested athlete
                            const athlete = userProfile?.role === UserRole.ADMIN ? item : item.athlete;
                            const relationshipInfo = userProfile?.role === UserRole.ADMIN ? null : item;
                            
                            if (!athlete) return null;
                            
                            return (
                                <div 
                                    key={athlete.id}
                                    onClick={() => setSelectedAthleteId(athlete.id)}
                                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-[#00FF00]/50 hover:bg-zinc-900 transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-[#00FF00]/10 border border-[#00FF00]/20 flex items-center justify-center text-[#00FF00] font-bold text-lg group-hover:scale-110 transition-transform">
                                            {(athlete.first_name?.[0] || athlete.email?.[0] || '?').toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-white truncate group-hover:text-[#00FF00] transition-colors">
                                                {athlete.first_name 
                                                    ? `${athlete.first_name} ${athlete.last_name || ''}` 
                                                    : athlete.email?.split('@')[0]}
                                            </p>
                                            <p className="text-xs text-zinc-500 truncate">{athlete.email}</p>
                                            {relationshipInfo && (
                                                <p className="text-[10px] text-zinc-600 mt-1">
                                                    Seit {new Date(relationshipInfo.started_at).toLocaleDateString('de-DE')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {relationshipInfo && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const name = athlete.first_name 
                                                            ? `${athlete.first_name} ${athlete.last_name || ''}`.trim()
                                                            : athlete.email?.split('@')[0];
                                                        setChatTarget({
                                                            relationshipId: relationshipInfo.id,
                                                            athleteId: athlete.id,
                                                            athleteName: name,
                                                        });
                                                    }}
                                                    className="p-1.5 rounded-lg text-zinc-600 hover:text-[#00FF00] hover:bg-[#00FF00]/10 transition-colors"
                                                    title="Chat öffnen"
                                                >
                                                    <MessageSquare size={14} />
                                                </button>
                                            )}
                                            <ChevronRight size={16} className="text-zinc-600 group-hover:text-[#00FF00] transition-colors" />
                                        </div>
                                    </div>
                                    
                                    {/* Quick Stats Preview */}
                                    {(athlete.weight || athlete.height) && (
                                        <div className="flex gap-3 mt-3 pt-3 border-t border-zinc-800">
                                            {athlete.height && (
                                                <div className="text-center">
                                                    <p className="text-[10px] text-zinc-500">Größe</p>
                                                    <p className="text-xs text-white font-bold">{athlete.height} cm</p>
                                                </div>
                                            )}
                                            {athlete.weight && (
                                                <div className="text-center">
                                                    <p className="text-[10px] text-zinc-500">Gewicht</p>
                                                    <p className="text-xs text-white font-bold">{athlete.weight} kg</p>
                                                </div>
                                            )}
                                            {athlete.body_fat && (
                                                <div className="text-center">
                                                    <p className="text-[10px] text-zinc-500">KFA</p>
                                                    <p className="text-xs text-[#00FF00] font-bold">{athlete.body_fat}%</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
            )}
        </div>
    );
  }

  // --- ATHLETE VIEWS BELOW ---

  if (showProfileWizard) return <ProfileSetupWizard onComplete={async () => {
    await refreshProfile(); // Reload profile to get updated onboardingCompleted
    setShowProfileWizard(false);
  }} />;

  // --- SETUP WIZARD (Athlete) ---
  if (activePlan && activePlan.assignmentType === 'GROUP_FLEX' && activePlan.scheduleStatus === 'PENDING') {
      const count = activePlan.structure.weeks[0]?.sessions.length || 3;
      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in">
              <div className="bg-[#1C1C1E] p-8 rounded-[2rem] border border-zinc-800 shadow-2xl max-w-lg w-full">
                  <CalendarDays size={48} className="text-[#00FF00] mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">{t('dashboard.pendingScheduleTitle')}</h2>
                  <p className="text-zinc-400 mb-8 leading-relaxed">{t('dashboard.pendingScheduleDesc')}</p>
                  <div className="grid grid-cols-4 gap-3 mb-8">
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((l, i) => (
                          <button key={i} onClick={() => toggleDaySelection(i)} className={`p-4 rounded-xl text-sm font-bold transition-all duration-300 ${selectedDays.includes(i) ? 'bg-[#00FF00] text-black shadow-[0_0_10px_rgba(0,255,0,0.4)] transform scale-105' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}>{l}</button>
                      ))}
                  </div>
                  <Button fullWidth onClick={handleConfirmSchedule} disabled={selectedDays.length !== count || isGeneratingSchedule} className="h-12 rounded-xl text-lg">
                      {isGeneratingSchedule ? t('dashboard.generatingSchedule') : t('dashboard.confirmSchedule')}
                  </Button>
              </div>
          </div>
      );
  }

  // === ATHLETE VIEW - Controlled by Bottom Navigation (viewMode from Layout) ===
  // viewMode: 'hub' = Dashboard, 'training' = Training View
  if (viewMode === 'training') {
    return <AthleteTrainingView />;
  }
  
  // Default: Dashboard/Hub view
  return <AthleteDashboard />;
};

export default Dashboard;