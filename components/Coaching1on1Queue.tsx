import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { UserCheck, Clock, ClipboardList, AlertCircle, ChevronRight, Loader2, Users, CheckCircle2, Eye, UserPlus, Search } from 'lucide-react';

interface QueueItem {
  id: string;
  athlete_id: string;
  coach_id: string;
  product_id: string;
  status: string;
  started_at: string;
  created_at: string;
  athlete: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
  coach: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  } | null;
  product: {
    id: string;
    title: string;
    type: string;
    coaching_duration_weeks?: number;
    sessions_per_week?: number;
    intake_form_enabled?: boolean;
  } | null;
  intake?: {
    id: string;
    status: string;
    submitted_at?: string;
    experience_level?: string;
    sessions_per_week?: number;
    injuries?: string;
    goals_text?: string;
  } | null;
}

interface Coaching1on1QueueProps {
  onViewAthlete?: (athleteId: string) => void;
}

const Coaching1on1Queue: React.FC<Coaching1on1QueueProps> = ({ onViewAthlete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending_intake' | 'intake_submitted' | 'active'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [coaches, setCoaches] = useState<any[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchQueue();
      fetchCoaches();
    }
  }, [user]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coaching_relationships')
        .select(`
          *,
          athlete:profiles!coaching_relationships_athlete_id_fkey(id, email, first_name, last_name, avatar_url),
          coach:profiles!coaching_relationships_coach_id_fkey(id, email, first_name, last_name),
          product:products(id, title, type, coaching_duration_weeks, sessions_per_week, intake_form_enabled)
        `)
        .in('status', ['ACTIVE', 'PAUSED'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Also fetch intake status for each relationship
      const withIntake = await Promise.all((data || []).map(async (item: any) => {
        // Only fetch intake for 1:1 coaching products
        if (item.product?.type !== 'COACHING_1ON1') return null;
        
        const { data: intake } = await supabase
          .from('coaching_intake')
          .select('id, status, submitted_at, experience_level, sessions_per_week, injuries, goals_text')
          .eq('coaching_relationship_id', item.id)
          .maybeSingle();

        return { ...item, intake };
      }));

      setItems(withIntake.filter(Boolean) as QueueItem[]);
    } catch (e) {
      console.error('Error fetching 1:1 queue:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoaches = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('role', ['COACH', 'ADMIN']);
      setCoaches(data || []);
    } catch (e) {
      console.error('Error fetching coaches:', e);
    }
  };

  const handleReassignCoach = async (relationshipId: string, newCoachId: string) => {
    setAssigningId(relationshipId);
    try {
      await supabase
        .from('coaching_relationships')
        .update({ coach_id: newCoachId })
        .eq('id', relationshipId);
      await fetchQueue();
    } catch (e) {
      console.error('Error reassigning coach:', e);
    } finally {
      setAssigningId(null);
    }
  };

  const getIntakeStatus = (item: QueueItem) => {
    if (!item.product?.intake_form_enabled) return 'no_intake';
    if (!item.intake) return 'pending';
    return item.intake.status.toLowerCase();
  };

  const getStatusBadge = (item: QueueItem) => {
    const intakeStatus = getIntakeStatus(item);
    switch (intakeStatus) {
      case 'no_intake':
        return <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">Kein Fragebogen</span>;
      case 'pending':
        return <span className="text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Clock size={10} /> Intake ausstehend</span>;
      case 'submitted':
        return <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1"><ClipboardList size={10} /> Intake erhalten</span>;
      case 'reviewed':
        return <span className="text-[10px] font-bold bg-[#00FF00]/20 text-[#00FF00] px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={10} /> Reviewed</span>;
      default:
        return null;
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'pending_intake') return getIntakeStatus(item) === 'pending';
    if (filter === 'intake_submitted') return getIntakeStatus(item) === 'submitted';
    if (filter === 'active') return getIntakeStatus(item) === 'reviewed' || getIntakeStatus(item) === 'no_intake';
    return true;
  }).filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const name = `${item.athlete?.first_name || ''} ${item.athlete?.last_name || ''} ${item.athlete?.email || ''}`.toLowerCase();
    return name.includes(search);
  });

  const athleteName = (a: any) => {
    if (a?.first_name || a?.last_name) return `${a.first_name || ''} ${a.last_name || ''}`.trim();
    return a?.email?.split('@')[0] || 'Athlet';
  };

  const coachName = (c: any) => {
    if (c?.first_name || c?.last_name) return `${c.first_name || ''} ${c.last_name || ''}`.trim();
    return c?.email?.split('@')[0] || '–';
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }); }
    catch { return d; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-zinc-500" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <Users size={20} className="text-blue-400" />
          1:1 Coaching Queue
          <span className="text-xs text-zinc-500 font-normal ml-1">({items.length})</span>
        </h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Suchen..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-8 pr-3 py-1.5 text-xs focus:border-[#00FF00] outline-none w-40"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {[
          { id: 'all' as const, label: 'Alle', count: items.length },
          { id: 'pending_intake' as const, label: 'Intake ausstehend', count: items.filter(i => getIntakeStatus(i) === 'pending').length },
          { id: 'intake_submitted' as const, label: 'Intake erhalten', count: items.filter(i => getIntakeStatus(i) === 'submitted').length },
          { id: 'active' as const, label: 'Aktiv', count: items.filter(i => ['reviewed', 'no_intake'].includes(getIntakeStatus(i))).length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === tab.id
                ? 'bg-[#00FF00]/20 text-[#00FF00] border border-[#00FF00]/30'
                : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-white'
            }`}
          >
            {tab.label} {tab.count > 0 && <span className="ml-1 opacity-70">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Queue List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-zinc-800">
          <Users size={32} className="mx-auto text-zinc-700 mb-2" />
          <p className="text-zinc-500 text-sm">Keine 1:1 Coaching-Beziehungen{filter !== 'all' ? ' in dieser Kategorie' : ''}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {item.athlete?.avatar_url ? (
                    <img src={item.athlete.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-zinc-500 font-bold text-sm">
                      {(item.athlete?.first_name?.[0] || item.athlete?.email?.[0] || '?').toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-bold text-sm">{athleteName(item.athlete)}</p>
                    {getStatusBadge(item)}
                  </div>
                  <p className="text-zinc-500 text-xs truncate">{item.athlete?.email}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-600">
                    <span>Produkt: <span className="text-zinc-400">{item.product?.title || '–'}</span></span>
                    <span>Seit: <span className="text-zinc-400">{formatDate(item.started_at || item.created_at)}</span></span>
                    {item.product?.sessions_per_week && (
                      <span>{item.product.sessions_per_week}x/Wo</span>
                    )}
                  </div>

                  {/* Intake Summary (if submitted) */}
                  {item.intake?.status === 'SUBMITTED' && (
                    <div className="mt-2 bg-blue-500/5 border border-blue-500/10 rounded-lg p-2 space-y-1">
                      <p className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">Intake-Zusammenfassung</p>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {item.intake.experience_level && (
                          <span className="text-zinc-400">Level: <span className="text-white">{item.intake.experience_level}</span></span>
                        )}
                        {item.intake.sessions_per_week && (
                          <span className="text-zinc-400">Sessions: <span className="text-white">{item.intake.sessions_per_week}x/Wo</span></span>
                        )}
                        {item.intake.injuries && (
                          <span className="text-zinc-400 col-span-2">Verletzungen: <span className="text-yellow-400">{item.intake.injuries.substring(0, 60)}{item.intake.injuries.length > 60 ? '...' : ''}</span></span>
                        )}
                        {item.intake.goals_text && (
                          <span className="text-zinc-400 col-span-2">Ziele: <span className="text-white">{item.intake.goals_text.substring(0, 60)}{item.intake.goals_text.length > 60 ? '...' : ''}</span></span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 shrink-0">
                  {/* Coach Assignment */}
                  <select
                    value={item.coach_id || ''}
                    onChange={e => handleReassignCoach(item.id, e.target.value)}
                    disabled={assigningId === item.id}
                    className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-2 py-1 text-xs focus:border-[#00FF00] outline-none max-w-[140px]"
                  >
                    <option value="">Coach zuweisen</option>
                    {coaches.map(c => (
                      <option key={c.id} value={c.id}>
                        {coachName(c)}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => navigate(`/coaching/${item.athlete_id}`)}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1"
                  >
                    <ClipboardList size={12} /> Dossier
                  </button>
                  {onViewAthlete && (
                    <button
                      onClick={() => onViewAthlete(item.athlete_id)}
                      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-[#00FF00] transition-colors px-2 py-1"
                    >
                      <Eye size={12} /> Profil
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Coaching1on1Queue;
