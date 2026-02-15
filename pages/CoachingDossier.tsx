import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, getCoachingIntake, getGoals, getCoachNotes } from '../services/supabase';
import CoachNotesPanel from '../components/CoachNotesPanel';
import GoalWidget from '../components/GoalWidget';
import AthletePlanEditor from '../components/AthletePlanEditor';
import {
  ArrowLeft, User, Target, StickyNote, Dumbbell, Heart, Calendar,
  Loader2, ClipboardList, AlertTriangle, TrendingUp, ChevronRight,
  Activity, Scale, Clock, CheckCircle2, Edit, MessageCircle, BarChart3
} from 'lucide-react';

type DossierTab = 'overview' | 'notes' | 'goals' | 'training' | 'wellness' | 'intake';

const CoachingDossier: React.FC = () => {
  const { athleteId } = useParams<{ athleteId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<DossierTab>('overview');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [relationship, setRelationship] = useState<any>(null);
  const [intake, setIntake] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [wellness, setWellness] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
  const [attentions, setAttentions] = useState<any[]>([]);
  const [bodyMeasurements, setBodyMeasurements] = useState<any[]>([]);
  const [editingPlan, setEditingPlan] = useState(false);

  useEffect(() => {
    if (user && athleteId) fetchAll();
  }, [user, athleteId]);

  const fetchAll = async () => {
    if (!athleteId) return;
    setLoading(true);
    try {
      const [
        { data: profileData },
        { data: relData },
        { data: planData },
        { data: goalsData },
        { data: wellnessData },
        { data: statsData },
        { data: attentionData },
        { data: bodyData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', athleteId).single(),
        supabase.from('coaching_relationships').select('*, product:products(id, title, type, coaching_duration_weeks, sessions_per_week, intake_form_enabled)').eq('athlete_id', athleteId).eq('coach_id', user!.id).eq('status', 'ACTIVE').maybeSingle(),
        supabase.from('assigned_plans').select('*').eq('athlete_id', athleteId).eq('status', 'ACTIVE').order('created_at', { ascending: false }).limit(1),
        supabase.from('goals').select('*, exercise:exercises(id, name)').eq('athlete_id', athleteId).eq('status', 'ACTIVE').order('created_at', { ascending: false }),
        supabase.from('daily_wellness').select('*').eq('athlete_id', athleteId).order('date', { ascending: false }).limit(14),
        supabase.from('weekly_stats').select('*').eq('athlete_id', athleteId).order('week_start', { ascending: false }).limit(8),
        supabase.from('attentions').select('*').eq('athlete_id', athleteId).eq('status', 'OPEN').order('created_at', { ascending: false }).limit(5),
        supabase.from('body_measurements').select('*').eq('user_id', athleteId).order('date', { ascending: false }).limit(10),
      ]);

      setProfile(profileData);
      setRelationship(relData);
      setActivePlan(planData?.[0] || null);
      setGoals(goalsData || []);
      setWellness(wellnessData || []);
      setWeeklyStats(statsData || []);
      setAttentions(attentionData || []);
      setBodyMeasurements(bodyData || []);

      // Fetch intake if relationship exists
      if (relData?.id) {
        try {
          const intakeData = await getCoachingIntake(relData.id);
          setIntake(intakeData);
        } catch {}
      }
    } catch (e) {
      console.error('Error fetching dossier data:', e);
    } finally {
      setLoading(false);
    }
  };

  const athleteName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email?.split('@')[0]
    : 'Athlet';

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }); }
    catch { return d; }
  };

  const tabs: { key: DossierTab; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Übersicht', icon: <User size={16} /> },
    { key: 'notes', label: 'Notizen', icon: <StickyNote size={16} /> },
    { key: 'goals', label: 'Ziele', icon: <Target size={16} /> },
    { key: 'training', label: 'Training', icon: <Dumbbell size={16} /> },
    { key: 'wellness', label: 'Wellness', icon: <Heart size={16} /> },
    { key: 'intake', label: 'Intake', icon: <ClipboardList size={16} /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#00FF00]" size={32} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <AlertTriangle size={48} className="mx-auto text-yellow-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Athlet nicht gefunden</h2>
        <button onClick={() => navigate(-1)} className="text-[#00FF00] text-sm">Zurück</button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-zinc-500 font-bold text-lg">{athleteName[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white">{athleteName}</h1>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              {relationship?.product?.title && <span className="text-blue-400">{relationship.product.title}</span>}
              {relationship && <span>· Seit {formatDate(relationship.started_at)}</span>}
              {relationship?.product?.sessions_per_week && <span>· {relationship.product.sessions_per_week}x/Wo</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveTab('training'); setEditingPlan(true); }}
            className="px-3 py-2 bg-[#00FF00] text-black rounded-xl text-xs font-bold flex items-center gap-1"
          >
            <Dumbbell size={14} /> Plan erstellen
          </button>
          <button
            onClick={() => navigate('/coach/chat')}
            className="px-3 py-2 bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-zinc-700"
          >
            <MessageCircle size={14} /> Chat
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/30'
                : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Alerts */}
            {attentions.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <h3 className="text-red-400 font-bold text-sm flex items-center gap-2 mb-2">
                  <AlertTriangle size={16} /> Offene Aufmerksamkeiten ({attentions.length})
                </h3>
                {attentions.map(a => (
                  <div key={a.id} className="text-xs text-zinc-300 py-1 border-b border-red-500/10 last:border-0">
                    <span className="text-red-300 font-bold">{a.type}:</span> {a.description}
                  </div>
                ))}
              </div>
            )}

            {/* Profile Card */}
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><User size={16} className="text-zinc-400" /> Profil</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {profile.height && <div className="bg-zinc-900 rounded-lg p-2"><p className="text-[10px] text-zinc-600 uppercase">Größe</p><p className="text-white font-bold text-sm">{profile.height} cm</p></div>}
                {profile.weight && <div className="bg-zinc-900 rounded-lg p-2"><p className="text-[10px] text-zinc-600 uppercase">Gewicht</p><p className="text-white font-bold text-sm">{profile.weight} kg</p></div>}
                {profile.body_fat && <div className="bg-zinc-900 rounded-lg p-2"><p className="text-[10px] text-zinc-600 uppercase">KFA</p><p className="text-white font-bold text-sm">{profile.body_fat}%</p></div>}
                {profile.birth_date && <div className="bg-zinc-900 rounded-lg p-2"><p className="text-[10px] text-zinc-600 uppercase">Alter</p><p className="text-white font-bold text-sm">{Math.floor((Date.now() - new Date(profile.birth_date).getTime()) / 31557600000)} J.</p></div>}
              </div>
            </div>

            {/* Active Plan */}
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><Dumbbell size={16} className="text-[#00FF00]" /> Aktiver Plan</h3>
              {activePlan ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold">{activePlan.plan_name}</p>
                    <p className="text-zinc-500 text-xs">Status: {activePlan.schedule_status} · Start: {formatDate(activePlan.start_date)}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('training'); setEditingPlan(true); }}
                    className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs hover:text-white flex items-center gap-1"
                  >
                    <Edit size={12} /> Bearbeiten
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-zinc-500 text-xs mb-2">Noch kein Plan zugewiesen</p>
                  <button
                    onClick={() => { setActiveTab('training'); setEditingPlan(true); }}
                    className="px-4 py-2 bg-[#00FF00] text-black rounded-xl text-xs font-bold"
                  >
                    Plan erstellen
                  </button>
                </div>
              )}
            </div>

            {/* Goals Quick View */}
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-bold text-sm flex items-center gap-2"><Target size={16} className="text-yellow-400" /> Ziele</h3>
                <button onClick={() => setActiveTab('goals')} className="text-xs text-zinc-500 hover:text-[#00FF00] flex items-center gap-1">Alle <ChevronRight size={12} /></button>
              </div>
              {goals.length === 0 ? (
                <p className="text-zinc-600 text-xs">Noch keine Ziele definiert.</p>
              ) : (
                <div className="space-y-2">
                  {goals.slice(0, 3).map(g => {
                    const progress = g.start_value !== null && g.target_value > g.start_value
                      ? Math.min(100, Math.round(((g.current_value - g.start_value) / (g.target_value - g.start_value)) * 100))
                      : 0;
                    return (
                      <div key={g.id} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-white font-bold">{g.title}</span>
                            <span className="text-[#00FF00]">{progress}%</span>
                          </div>
                          <div className="h-1 bg-zinc-800 rounded-full"><div className="h-full bg-[#00FF00] rounded-full" style={{ width: `${progress}%` }} /></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Intake Summary */}
            {intake && intake.status === 'SUBMITTED' && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2"><ClipboardList size={16} className="text-blue-400" /> Intake</h3>
                  <button onClick={() => setActiveTab('intake')} className="text-xs text-zinc-500 hover:text-blue-400 flex items-center gap-1">Details <ChevronRight size={12} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {intake.experience_level && <div><span className="text-zinc-500">Level:</span> <span className="text-white">{intake.experience_level}</span></div>}
                  {intake.sessions_per_week && <div><span className="text-zinc-500">Sessions:</span> <span className="text-white">{intake.sessions_per_week}x/Wo</span></div>}
                  {intake.injuries && <div className="col-span-2"><span className="text-zinc-500">Verletzungen:</span> <span className="text-yellow-400">{intake.injuries}</span></div>}
                  {intake.goals_text && <div className="col-span-2"><span className="text-zinc-500">Ziele:</span> <span className="text-white">{intake.goals_text}</span></div>}
                </div>
              </div>
            )}

            {/* Weekly Stats */}
            {weeklyStats.length > 0 && (
              <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4">
                <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><BarChart3 size={16} className="text-purple-400" /> Letzte Wochen</h3>
                <div className="flex gap-2 overflow-x-auto">
                  {weeklyStats.slice(0, 4).map((w, i) => (
                    <div key={i} className="bg-zinc-900 rounded-lg p-2 min-w-[100px] shrink-0">
                      <p className="text-[10px] text-zinc-600">KW {w.week_number || i + 1}</p>
                      <p className="text-white font-bold text-sm">{w.sessions_completed || 0} Sessions</p>
                      <p className="text-zinc-500 text-[10px]">{w.total_volume ? `${Math.round(w.total_volume / 1000)}t Vol.` : '–'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && athleteId && (
          <div className="animate-in fade-in">
            <CoachNotesPanel athleteId={athleteId} athleteName={athleteName} />
          </div>
        )}

        {/* GOALS TAB */}
        {activeTab === 'goals' && (
          <div className="animate-in fade-in space-y-4">
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4">
              <h3 className="text-white font-bold mb-3">Aktive Ziele ({goals.length})</h3>
              {goals.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-8">Noch keine Ziele definiert.</p>
              ) : (
                <div className="space-y-3">
                  {goals.map(g => {
                    const progress = g.start_value !== null && g.target_value > g.start_value
                      ? Math.min(100, Math.round(((g.current_value - g.start_value) / (g.target_value - g.start_value)) * 100))
                      : 0;
                    const daysLeft = Math.ceil((new Date(g.target_date).getTime() - Date.now()) / 86400000);
                    return (
                      <div key={g.id} className="bg-zinc-900 rounded-xl p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-white font-bold text-sm">{g.title}</p>
                            {g.description && <p className="text-zinc-500 text-xs mt-0.5">{g.description}</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-[#00FF00] font-bold">{progress}%</p>
                            <p className="text-zinc-600 text-[10px]">{daysLeft > 0 ? `${daysLeft}d` : 'Abgelaufen'}</p>
                          </div>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full mb-2">
                          <div className="h-full bg-[#00FF00] rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-zinc-500">
                          <span>Start: {g.start_value} {g.target_unit}</span>
                          <span className="text-[#00FF00] font-bold">Aktuell: {g.current_value} {g.target_unit}</span>
                          <span>Ziel: {g.target_value} {g.target_unit}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRAINING TAB */}
        {activeTab === 'training' && (
          <div className="animate-in fade-in space-y-4">
            {editingPlan ? (
              <AthletePlanEditor
                athleteId={athleteId!}
                athleteName={athleteName}
                coachingRelationshipId={relationship?.id}
                existingPlan={activePlan}
                onSave={() => { setEditingPlan(false); fetchAll(); }}
                onClose={() => setEditingPlan(false)}
              />
            ) : activePlan ? (
              <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold">{activePlan.plan_name}</h3>
                    <p className="text-zinc-500 text-xs">Start: {formatDate(activePlan.start_date)} · Status: {activePlan.schedule_status}</p>
                  </div>
                  <button
                    onClick={() => setEditingPlan(true)}
                    className="px-3 py-2 bg-[#00FF00] text-black rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Edit size={14} /> Plan bearbeiten
                  </button>
                </div>

                {/* Weekly Structure Preview */}
                {activePlan.structure?.weeks && (
                  <div className="space-y-2">
                    {activePlan.structure.weeks.map((week: any, i: number) => (
                      <div key={i} className="bg-zinc-900 rounded-lg p-3">
                        <p className="text-white font-bold text-xs mb-1">Woche {week.order || i + 1}{week.focus ? ` — ${week.focus}` : ''}</p>
                        <div className="flex gap-1 flex-wrap">
                          {week.sessions?.map((s: any, j: number) => {
                            const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
                            const exCount = (s.workoutData || s.workout_data || []).reduce((acc: number, b: any) => acc + (b.exercises?.length || 0), 0);
                            return (
                              <span key={j} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
                                {dayNames[s.dayOfWeek] || `Tag ${s.dayOfWeek}`}: {s.title || 'Session'}{exCount > 0 ? ` (${exCount})` : ''}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-[#1C1C1E] border border-zinc-800 rounded-xl">
                <Dumbbell size={48} className="mx-auto text-zinc-700 mb-4" />
                <p className="text-zinc-500 mb-4">Noch kein Plan zugewiesen.</p>
                <button
                  onClick={() => setEditingPlan(true)}
                  className="px-6 py-3 bg-[#00FF00] text-black rounded-xl font-bold"
                >
                  Plan erstellen
                </button>
              </div>
            )}
          </div>
        )}

        {/* WELLNESS TAB */}
        {activeTab === 'wellness' && (
          <div className="animate-in fade-in space-y-4">
            {/* Recent Wellness */}
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><Heart size={16} className="text-red-400" /> Tägliches Wohlbefinden (letzte 14 Tage)</h3>
              {wellness.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-4">Keine Wellness-Daten vorhanden.</p>
              ) : (
                <div className="space-y-1">
                  {wellness.slice(0, 7).map(w => (
                    <div key={w.id || w.date} className="flex items-center gap-3 py-1.5 border-b border-zinc-800/50 last:border-0">
                      <span className="text-zinc-500 text-xs w-16 shrink-0">{formatDate(w.date)}</span>
                      <div className="flex gap-2 flex-1">
                        {w.mood && <span className="text-xs bg-zinc-900 px-2 py-0.5 rounded">😊 {w.mood}/5</span>}
                        {w.energy && <span className="text-xs bg-zinc-900 px-2 py-0.5 rounded">⚡ {w.energy}/5</span>}
                        {w.sleep_quality && <span className="text-xs bg-zinc-900 px-2 py-0.5 rounded">😴 {w.sleep_quality}/5</span>}
                        {w.stress && <span className="text-xs bg-zinc-900 px-2 py-0.5 rounded">🧠 {w.stress}/5</span>}
                      </div>
                      {w.weight && <span className="text-zinc-400 text-xs">{w.weight}kg</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Body Measurements */}
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4">
              <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2"><Scale size={16} className="text-purple-400" /> Körperdaten</h3>
              {bodyMeasurements.length === 0 ? (
                <p className="text-zinc-500 text-xs text-center py-4">Keine Messungen vorhanden.</p>
              ) : (
                <div className="space-y-1">
                  {bodyMeasurements.slice(0, 5).map(m => (
                    <div key={m.id} className="flex items-center gap-3 py-1.5 border-b border-zinc-800/50 last:border-0">
                      <span className="text-zinc-500 text-xs w-16 shrink-0">{formatDate(m.date)}</span>
                      <div className="flex gap-2 flex-1 text-xs">
                        {m.weight && <span className="text-white">{m.weight}kg</span>}
                        {m.body_fat && <span className="text-zinc-400">{m.body_fat}% KFA</span>}
                        {m.waist && <span className="text-zinc-400">{m.waist}cm Taille</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* INTAKE TAB */}
        {activeTab === 'intake' && (
          <div className="animate-in fade-in space-y-4">
            {!intake ? (
              <div className="text-center py-12 bg-[#1C1C1E] border border-zinc-800 rounded-xl">
                <ClipboardList size={48} className="mx-auto text-zinc-700 mb-4" />
                <p className="text-zinc-500 mb-2">Kein Intake-Fragebogen vorhanden.</p>
                <p className="text-zinc-600 text-xs">Der Athlet wurde noch nicht aufgefordert, den Fragebogen auszufüllen.</p>
              </div>
            ) : (
              <div className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <ClipboardList size={18} className="text-blue-400" /> Intake-Fragebogen
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    intake.status === 'SUBMITTED' ? 'bg-blue-500/20 text-blue-400' :
                    intake.status === 'REVIEWED' ? 'bg-[#00FF00]/20 text-[#00FF00]' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {intake.status}
                  </span>
                </div>

                <div className="grid gap-4">
                  {intake.experience_level && (
                    <div><p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Erfahrungslevel</p><p className="text-white text-sm">{intake.experience_level}</p></div>
                  )}
                  {intake.training_history && (
                    <div><p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Trainingshistorie</p><p className="text-white text-sm">{intake.training_history}</p></div>
                  )}
                  {intake.injuries && (
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-yellow-400 text-xs uppercase tracking-wider mb-1 font-bold">Verletzungen / Einschränkungen</p>
                      <p className="text-white text-sm">{intake.injuries}</p>
                    </div>
                  )}
                  {intake.available_days && intake.available_days.length > 0 && (
                    <div>
                      <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Verfügbare Tage</p>
                      <div className="flex gap-1">
                        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d, i) => (
                          <span key={i} className={`px-2 py-1 rounded text-xs font-bold ${
                            intake.available_days.includes(i) ? 'bg-[#00FF00]/20 text-[#00FF00]' : 'bg-zinc-900 text-zinc-600'
                          }`}>{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {intake.preferred_times && intake.preferred_times.length > 0 && (
                    <div><p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Bevorzugte Zeiten</p><p className="text-white text-sm">{intake.preferred_times.join(', ')}</p></div>
                  )}
                  {intake.sessions_per_week && (
                    <div><p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Sessions / Woche</p><p className="text-white text-sm font-bold">{intake.sessions_per_week}x</p></div>
                  )}
                  {intake.exercise_preferences && (
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Lieblingsübungen</p>
                        <div className="flex flex-wrap gap-1">{(intake.exercise_preferences.likes || []).map((e: string, i: number) => (
                          <span key={i} className="text-xs bg-[#00FF00]/10 text-[#00FF00] px-2 py-0.5 rounded">{e}</span>
                        ))}</div>
                      </div>
                      <div><p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Vermeiden</p>
                        <div className="flex flex-wrap gap-1">{(intake.exercise_preferences.dislikes || []).map((e: string, i: number) => (
                          <span key={i} className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded">{e}</span>
                        ))}</div>
                      </div>
                    </div>
                  )}
                  {intake.goals_text && (
                    <div><p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Ziele</p><p className="text-white text-sm">{intake.goals_text}</p></div>
                  )}
                  {intake.goal_categories && intake.goal_categories.length > 0 && (
                    <div><p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Ziel-Kategorien</p>
                      <div className="flex gap-1">{intake.goal_categories.map((c: string, i: number) => (
                        <span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{c}</span>
                      ))}</div>
                    </div>
                  )}
                  {intake.timeframe_weeks && (
                    <div><p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Zeitrahmen</p><p className="text-white text-sm">{intake.timeframe_weeks} Wochen</p></div>
                  )}
                  {intake.additional_notes && (
                    <div><p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Zusätzliche Hinweise</p><p className="text-white text-sm">{intake.additional_notes}</p></div>
                  )}
                </div>

                {/* Mark as Reviewed */}
                {intake.status === 'SUBMITTED' && (
                  <button
                    onClick={async () => {
                      try {
                        await supabase.from('coaching_intake').update({
                          status: 'REVIEWED',
                          reviewed_at: new Date().toISOString(),
                          reviewed_by: user?.id,
                        }).eq('id', intake.id);
                        setIntake({ ...intake, status: 'REVIEWED' });
                      } catch (e) { console.error(e); }
                    }}
                    className="w-full mt-2 px-4 py-3 bg-[#00FF00] text-black rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} /> Als gelesen markieren
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachingDossier;
