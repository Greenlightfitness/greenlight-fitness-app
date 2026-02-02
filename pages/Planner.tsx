import React, { useState, useEffect } from 'react';
import { supabase, getPlans, createPlan, deletePlan, createWeek, getWeeksByPlan, getSessionsByWeek, createAssignedPlan, getUsersByRole, getUsersByRoles } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { TrainingPlan, TrainingWeek, TrainingSession, AssignedPlan, UserProfile, UserRole, AssignmentType } from '../types';
import Button from '../components/Button';
import Input from '../components/Input';
import PlanEditor from '../components/planner/PlanEditor';
import ConfirmationModal from '../components/ConfirmationModal';
import { useLanguage } from '../context/LanguageContext';
import { Calendar as CalendarIcon, Plus, Trash2, ChevronRight, FileText, Copy, Send, X, Users, ArrowRight, Filter, ShieldCheck } from 'lucide-react';

const Planner: React.FC = () => {
  const { user, userProfile } = useAuth();
  const { t } = useLanguage();
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Admin Specific
  const [coachMap, setCoachMap] = useState<Record<string, UserProfile>>({});
  const [coachFilter, setCoachFilter] = useState<string>('ALL');

  // Create Plan Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');

  // Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; planId: string | null }>({
    isOpen: false,
    planId: null
  });

  // Assign Modal State
  const [assignModal, setAssignModal] = useState<{ isOpen: boolean; plan: TrainingPlan | null }>({
    isOpen: false,
    plan: null
  });
  
  // Assignment State
  const [athletes, setAthletes] = useState<UserProfile[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [assignStartDate, setAssignStartDate] = useState('');
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('ONE_TO_ONE');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (user && view === 'list') {
      fetchPlans();
      if (userProfile?.role === UserRole.ADMIN) {
          fetchCoachList();
      }
    }
  }, [user, view, userProfile]);

  useEffect(() => {
      if (assignModal.isOpen) {
          fetchAthletes();
          const today = new Date().toISOString().split('T')[0];
          setAssignStartDate(today);
          setAssignmentType('ONE_TO_ONE');
          setSelectedAthleteId('');
      }
  }, [assignModal.isOpen]);

  const fetchCoachList = async () => {
      try {
          const data = await getUsersByRoles([UserRole.COACH, UserRole.ADMIN]);
          const map: Record<string, UserProfile> = {};
          data.forEach((doc: any) => {
              map[doc.id] = {
                uid: doc.id,
                email: doc.email,
                role: doc.role,
                firstName: doc.first_name,
                lastName: doc.last_name,
              } as UserProfile;
          });
          setCoachMap(map);
      } catch (error) {
          console.error("Error fetching coaches", error);
      }
  };

  const fetchAthletes = async () => {
      try {
          const data = await getUsersByRole(UserRole.ATHLETE);
          const fetchedAthletes = data.map((doc: any) => ({
            uid: doc.id,
            email: doc.email,
            role: doc.role,
            displayName: doc.display_name,
            firstName: doc.first_name,
            lastName: doc.last_name,
          } as UserProfile));
          setAthletes(fetchedAthletes);
      } catch (error) {
          console.error("Error fetching athletes:", error);
      }
  };

  const fetchPlans = async () => {
    if (!user || !userProfile) return;
    setLoading(true);
    try {
      // ADMIN: Fetch ALL plans. 
      // COACH/ATHLETE: Fetch ONLY own plans.
      const coachId = userProfile.role === UserRole.ADMIN ? undefined : user.id;
      const data = await getPlans(coachId);
      
      const fetchedPlans: TrainingPlan[] = data.map((p: any) => ({
        id: p.id,
        coachId: p.coach_id,
        name: p.name,
        description: p.description,
        createdAt: p.created_at,
      }));

      setPlans(fetchedPlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const plan = await createPlan({
        coach_id: user.id,
        name: newPlanName,
        description: newPlanDesc,
      });
      
      // Create first week
      await createWeek({
        plan_id: plan.id,
        order: 1,
        focus: 'Intro Week'
      });

      setNewPlanName('');
      setNewPlanDesc('');
      setShowCreateForm(false);
      fetchPlans();
    } catch (error) {
      console.error("Error creating plan:", error);
    }
  };

  const requestDeletePlan = (e: React.MouseEvent, planId: string) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, planId });
  };

  const confirmDeletePlan = async () => {
    if (!deleteConfirm.planId) return;
    const planId = deleteConfirm.planId;
    
    try {
      await deletePlan(planId);
      setPlans(plans.filter(p => p.id !== planId));
      setDeleteConfirm({ isOpen: false, planId: null });
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

  const handleAssignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModal.plan || !user || !assignStartDate || !selectedAthleteId) return;
    
    setIsAssigning(true);
    try {
        const planId = assignModal.plan.id;
        const weeksRaw = await getWeeksByPlan(planId);
        
        const weeksData = await Promise.all(weeksRaw.map(async (w: any) => {
            const sessionsRaw = await getSessionsByWeek(w.id);
            const sessions: TrainingSession[] = sessionsRaw.map((s: any) => ({
              id: s.id,
              weekId: s.week_id,
              dayOfWeek: s.day_of_week,
              title: s.title,
              description: s.description,
              order: s.order,
              workoutData: s.workout_data,
            })).sort((a: any, b: any) => a.order - b.order);
            return {
              id: w.id,
              planId: w.plan_id,
              order: w.order,
              focus: w.focus,
              sessions: sessions
            };
        }));

        await createAssignedPlan({
            athlete_id: selectedAthleteId,
            coach_id: user.id,
            original_plan_id: planId,
            start_date: assignStartDate,
            assignment_type: assignmentType,
            schedule_status: assignmentType === 'GROUP_FLEX' ? 'PENDING' : 'ACTIVE',
            schedule: {},
            plan_name: assignModal.plan.name,
            description: assignModal.plan.description,
            structure: { weeks: weeksData }
        });

        alert(t('planner.assignSuccess'));
        setAssignModal({ isOpen: false, plan: null });
        setSelectedAthleteId('');
        setAssignStartDate('');

    } catch (error: any) {
        console.error("Assignment Error:", error);
        alert(`${t('planner.assignError')} (${error.message})`);
    } finally {
        setIsAssigning(false);
    }
  };

  const handleDuplicatePlan = async (e: React.MouseEvent, plan: TrainingPlan) => {
    e.stopPropagation();
    if (!user) return;
    const originalText = e.currentTarget.textContent;
    e.currentTarget.textContent = t('planner.duplicatePlanText');

    try {
        // Create new plan
        const newPlan = await createPlan({
            coach_id: user.id,
            name: `${plan.name} (Copy)`,
            description: plan.description || '',
        });
        
        // Get and copy weeks
        const weeksRaw = await getWeeksByPlan(plan.id);

        for (const w of weeksRaw) {
            const newWeek = await createWeek({
              plan_id: newPlan.id,
              order: w.order,
              focus: w.focus,
            });
            
            // Get and copy sessions
            const sessionsRaw = await getSessionsByWeek(w.id);
            for (const s of sessionsRaw) {
              const { data, error } = await supabase
                .from('sessions')
                .insert({
                  week_id: newWeek.id,
                  day_of_week: s.day_of_week,
                  title: s.title,
                  description: s.description,
                  order: s.order,
                  workout_data: s.workout_data,
                })
                .select()
                .single();
              if (error) throw error;
            }
        }
        
        await fetchPlans();
    } catch (error) {
        console.error("Error duplicating plan:", error);
        alert("Failed to create version.");
    } finally {
       if(e.currentTarget) e.currentTarget.textContent = originalText;
    }
  };

  const openPlan = (plan: TrainingPlan) => {
    setSelectedPlan(plan);
    setView('editor');
  };

  const handleBackToList = () => {
    setSelectedPlan(null);
    setView('list');
    fetchPlans();
  };

  // Filter Logic for Admins
  const filteredPlans = plans.filter(p => coachFilter === 'ALL' || p.coachId === coachFilter);

  if (view === 'editor' && selectedPlan) {
    return <PlanEditor plan={selectedPlan} onBack={handleBackToList} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <ConfirmationModal 
        isOpen={deleteConfirm.isOpen}
        title={t('planner.deletePlanConfirmTitle')}
        message={t('planner.deletePlanConfirmMessage')}
        confirmText={t('common.yesDelete')}
        cancelText={t('common.cancel')}
        isDangerous={true}
        onConfirm={confirmDeletePlan}
        onCancel={() => setDeleteConfirm({ isOpen: false, planId: null })}
      />

      {assignModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-[#1C1C1E] border border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Send size={20} className="text-[#00FF00]" /> {t('planner.assignTitle')}
                    </h3>
                    <button onClick={() => setAssignModal({isOpen: false, plan: null})} className="text-zinc-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleAssignPlan} className="p-6 space-y-6">
                    <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{t('planner.planName')}</p>
                        <p className="text-white font-bold text-lg mt-1">{assignModal.plan?.name}</p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-zinc-400">{t('planner.selectAthlete')}</label>
                        <select
                            value={selectedAthleteId}
                            onChange={(e) => setSelectedAthleteId(e.target.value)}
                            required
                            className="bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00FF00] font-medium"
                        >
                            <option value="">-- {t('common.add')} --</option>
                            {athletes.map(athlete => (
                                <option key={athlete.uid} value={athlete.uid}>
                                    {athlete.email} {athlete.displayName ? `(${athlete.displayName})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                             label={t('planner.startDate')}
                             type="date"
                             value={assignStartDate}
                             onChange={(e) => setAssignStartDate(e.target.value)}
                             required
                             className="w-full [color-scheme:dark]"
                         />
                        <div className="flex flex-col gap-2">
                             <label className="text-sm font-bold text-zinc-400">{t('planner.assignmentType')}</label>
                             <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-3 cursor-pointer bg-[#121212] p-2 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors">
                                    <input 
                                        type="radio" 
                                        name="assignType" 
                                        value="ONE_TO_ONE"
                                        checked={assignmentType === 'ONE_TO_ONE'}
                                        onChange={() => setAssignmentType('ONE_TO_ONE')}
                                        className="accent-[#00FF00]"
                                    />
                                    <span className="text-xs text-zinc-300 font-medium">{t('dashboard.typeOneToOne')}</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer bg-[#121212] p-2 rounded-lg border border-zinc-800 hover:border-zinc-600 transition-colors">
                                    <input 
                                        type="radio" 
                                        name="assignType" 
                                        value="GROUP_FLEX"
                                        checked={assignmentType === 'GROUP_FLEX'}
                                        onChange={() => setAssignmentType('GROUP_FLEX')}
                                        className="accent-[#00FF00]"
                                    />
                                    <span className="text-xs text-zinc-300 font-medium">{t('dashboard.typeGroupFlex')}</span>
                                </label>
                             </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="secondary" onClick={() => setAssignModal({isOpen: false, plan: null})}>
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" disabled={isAssigning}>
                            {isAssigning ? t('planner.assigning') : t('planner.assign')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">{t('planner.title')}</h1>
          <p className="text-zinc-400 mt-2 text-lg">{t('planner.subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="flex items-center gap-2 shadow-lg shadow-[#00FF00]/10">
          <Plus size={20} /> {t('planner.createPlan')}
        </Button>
      </div>

      {/* ADMIN FILTER */}
      {userProfile?.role === UserRole.ADMIN && (
          <div className="bg-[#1C1C1E] p-2 rounded-2xl border border-zinc-800 flex items-center gap-4">
              <div className="flex items-center gap-2 pl-4 text-zinc-500">
                  <Filter size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Filter Author</span>
              </div>
              <select 
                value={coachFilter} 
                onChange={(e) => setCoachFilter(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-2 text-sm focus:border-[#00FF00] outline-none min-w-[200px]"
              >
                  <option value="ALL">All Authors</option>
                  <option value={user?.id}>Me (System/Admin)</option>
                  {(Object.values(coachMap) as UserProfile[])
                    .filter(c => c.uid !== user?.uid)
                    .map(c => (
                      <option key={c.uid} value={c.uid}>{c.firstName || c.email} ({c.role})</option>
                  ))}
              </select>
          </div>
      )}

      {showCreateForm && (
        <div className="bg-[#1C1C1E] border border-zinc-800 p-6 rounded-3xl animate-in slide-in-from-top-4 max-w-2xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
              <FileText size={120} />
          </div>
          <h3 className="font-bold text-white text-xl mb-6 relative z-10">{t('planner.newProgram')}</h3>
          <form onSubmit={handleCreatePlan} className="space-y-6 relative z-10">
            <Input 
              label={t('planner.planName')} 
              value={newPlanName} 
              onChange={e => setNewPlanName(e.target.value)}
              required 
              placeholder="e.g. Hypertrophy Block A"
            />
            <div>
              <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">{t('planner.description')}</label>
              <textarea 
                className="w-full bg-[#121212] border border-transparent text-white rounded-xl px-4 py-3 focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00] outline-none transition-all placeholder-zinc-600"
                rows={3}
                value={newPlanDesc}
                onChange={e => setNewPlanDesc(e.target.value)}
                placeholder={t('planner.descPlaceholder')}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>{t('common.cancel')}</Button>
              <Button type="submit">{t('planner.createPlan')}</Button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-zinc-500">{t('common.loading')}</div>
      ) : filteredPlans.length === 0 ? (
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-3xl p-16 flex flex-col items-center justify-center text-zinc-500">
          <CalendarIcon size={64} className="mb-6 text-zinc-800" />
          <h3 className="text-xl font-bold text-white mb-2">{t('planner.noPlans')}</h3>
          <p className="text-base text-zinc-400 max-w-sm text-center">{t('planner.startCreating')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {filteredPlans.map((plan) => {
            const author = coachMap[plan.coachId];
            const isSystem = author?.role === UserRole.ADMIN;
            const isMe = plan.coachId === user?.uid;
            
            // Only show Assign Actions for Coaches/Admins
            const canManage = userProfile?.role === UserRole.COACH || userProfile?.role === UserRole.ADMIN;

            return (
            <div 
              key={plan.id} 
              onClick={() => openPlan(plan)}
              className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-6 cursor-pointer hover:border-[#00FF00]/50 transition-all group relative flex flex-col h-full shadow-lg hover:shadow-2xl hover:-translate-y-1"
            >
              {/* Author Badge for Admin View */}
              {userProfile?.role === UserRole.ADMIN && (
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                      {isSystem ? (
                          <span className="bg-red-500/10 text-red-500 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                              <ShieldCheck size={10} /> System
                          </span>
                      ) : (
                          <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                              {author?.firstName || "Coach"}
                          </span>
                      )}
                  </div>
              )}

              <div className="flex-1">
                <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all duration-300 ${isSystem ? 'bg-red-900/10 border-red-900/30 text-red-500' : 'bg-zinc-900 border-zinc-800 text-[#00FF00] group-hover:bg-[#00FF00] group-hover:text-black'}`}>
                      <FileText size={24} />
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 backdrop-blur-sm border border-zinc-800/50 mt-8">
                        {canManage && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setAssignModal({isOpen: true, plan: plan}); }}
                                className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-[#00FF00] hover:bg-zinc-800 transition-colors"
                                title={t('planner.assign')}
                            >
                                <Send size={16} />
                            </button>
                        )}
                        <button 
                            onClick={(e) => handleDuplicatePlan(e, plan)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title={t('planner.duplicate')}
                        >
                            <Copy size={16} />
                        </button>
                        <button 
                            onClick={(e) => requestDeletePlan(e, plan.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-red-500 hover:bg-zinc-800 transition-colors"
                            title={t('planner.delete')}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight group-hover:text-[#00FF00] transition-colors">{plan.name}</h3>
                <p className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">
                    {plan.description || "No description provided."}
                </p>
              </div>
              
              <div className="mt-8 pt-4 border-t border-zinc-800 flex items-center justify-between">
                 <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{t('planner.planningMode')}</span>
                 <div className="flex items-center gap-2 text-white font-bold text-sm group-hover:translate-x-1 transition-transform">
                    {t('planner.openBuilder')} <ArrowRight size={16} className="text-[#00FF00]" />
                 </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
};

export default Planner;