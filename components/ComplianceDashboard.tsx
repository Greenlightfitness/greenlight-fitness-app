import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, getActiveCoachingRelationships } from '../services/supabase';
import { Users, Activity, AlertTriangle, Check, Clock, TrendingUp, TrendingDown, Minus, MessageCircle, ChevronRight, Loader2, Search } from 'lucide-react';

interface AthleteCompliance {
  athleteId: string;
  name: string;
  email: string;
  relationshipId: string;
  lastSessionDate: string | null;
  sessionsThisWeek: number;
  sessionsPlanned: number;
  compliancePercent: number;
  wellnessScore: number | null;
  openAttentions: number;
  weightTrend: 'up' | 'down' | 'stable' | null;
  daysSinceLastSession: number | null;
}

interface ComplianceDashboardProps {
  onSelectAthlete?: (athleteId: string) => void;
  onOpenChat?: (relationshipId: string, athleteId: string, athleteName: string) => void;
}

const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ onSelectAthlete, onOpenChat }) => {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<AthleteCompliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'compliance' | 'lastSession' | 'attentions'>('lastSession');

  useEffect(() => {
    if (user) loadComplianceData();
  }, [user]);

  const loadComplianceData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const relationships = await getActiveCoachingRelationships(user.id);
      if (!relationships || relationships.length === 0) {
        setAthletes([]);
        setLoading(false);
        return;
      }

      const now = new Date();
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(now);
      monday.setDate(now.getDate() + mondayOffset);
      monday.setHours(0, 0, 0, 0);
      const sundayStr = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const mondayStr = monday.toISOString().split('T')[0];

      const athleteIds = relationships.map((r: any) => {
        const ath = Array.isArray(r.athlete) ? r.athlete[0] : r.athlete;
        return ath?.id;
      }).filter(Boolean);

      // Batch load: schedule data, attentions, wellness
      const [scheduleRes, attentionRes, wellnessRes] = await Promise.all([
        supabase
          .from('athlete_schedule')
          .select('athlete_id, date, completed')
          .in('athlete_id', athleteIds)
          .gte('date', mondayStr)
          .lte('date', sundayStr),
        supabase
          .from('attentions')
          .select('athlete_id, status')
          .in('athlete_id', athleteIds)
          .eq('status', 'OPEN'),
        supabase
          .from('daily_wellness')
          .select('athlete_id, date, energy_level, mood, stress_level, sleep_quality')
          .in('athlete_id', athleteIds)
          .eq('date', now.toISOString().split('T')[0]),
      ]);

      // Last session per athlete
      const { data: lastSessionData } = await supabase
        .from('athlete_schedule')
        .select('athlete_id, date')
        .in('athlete_id', athleteIds)
        .eq('completed', true)
        .order('date', { ascending: false });

      // Build lookup maps
      const scheduleByAthlete = new Map<string, { total: number; completed: number }>();
      (scheduleRes.data || []).forEach((s: any) => {
        const existing = scheduleByAthlete.get(s.athlete_id) || { total: 0, completed: 0 };
        existing.total++;
        if (s.completed) existing.completed++;
        scheduleByAthlete.set(s.athlete_id, existing);
      });

      const attentionsByAthlete = new Map<string, number>();
      (attentionRes.data || []).forEach((a: any) => {
        attentionsByAthlete.set(a.athlete_id, (attentionsByAthlete.get(a.athlete_id) || 0) + 1);
      });

      const wellnessByAthlete = new Map<string, number>();
      (wellnessRes.data || []).forEach((w: any) => {
        const score = ((w.energy_level || 0) + (w.mood || 0) + (w.sleep_quality || 0) + (6 - (w.stress_level || 3))) / 4;
        wellnessByAthlete.set(w.athlete_id, Math.round(score * 10) / 10);
      });

      const lastSessionByAthlete = new Map<string, string>();
      (lastSessionData || []).forEach((s: any) => {
        if (!lastSessionByAthlete.has(s.athlete_id)) {
          lastSessionByAthlete.set(s.athlete_id, s.date);
        }
      });

      // Build compliance data per athlete
      const complianceData: AthleteCompliance[] = relationships.map((rel: any) => {
        const ath = Array.isArray(rel.athlete) ? rel.athlete[0] : rel.athlete;
        if (!ath) return null;

        const schedule = scheduleByAthlete.get(ath.id) || { total: 0, completed: 0 };
        const lastDate = lastSessionByAthlete.get(ath.id) || null;
        const daysSince = lastDate
          ? Math.floor((now.getTime() - new Date(lastDate + 'T00:00:00').getTime()) / (24 * 60 * 60 * 1000))
          : null;

        return {
          athleteId: ath.id,
          name: [ath.first_name, ath.last_name].filter(Boolean).join(' ') || ath.display_name || ath.email?.split('@')[0] || 'Athlet',
          email: ath.email || '',
          relationshipId: rel.id,
          lastSessionDate: lastDate,
          sessionsThisWeek: schedule.completed,
          sessionsPlanned: Math.max(schedule.total, 3),
          compliancePercent: schedule.total > 0 ? Math.round((schedule.completed / schedule.total) * 100) : 0,
          wellnessScore: wellnessByAthlete.get(ath.id) ?? null,
          openAttentions: attentionsByAthlete.get(ath.id) || 0,
          weightTrend: null,
          daysSinceLastSession: daysSince,
        } as AthleteCompliance;
      }).filter(Boolean) as AthleteCompliance[];

      setAthletes(complianceData);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAthletes = useMemo(() => {
    let list = athletes;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q));
    }
    return list.sort((a, b) => {
      if (sortBy === 'attentions') return b.openAttentions - a.openAttentions;
      if (sortBy === 'compliance') return a.compliancePercent - b.compliancePercent;
      // lastSession: most inactive first
      return (b.daysSinceLastSession ?? 999) - (a.daysSinceLastSession ?? 999);
    });
  }, [athletes, searchQuery, sortBy]);

  const summaryStats = useMemo(() => {
    if (athletes.length === 0) return null;
    const avgCompliance = Math.round(athletes.reduce((s, a) => s + a.compliancePercent, 0) / athletes.length);
    const inactive = athletes.filter(a => (a.daysSinceLastSession ?? 999) > 3).length;
    const withAttentions = athletes.filter(a => a.openAttentions > 0).length;
    return { avgCompliance, inactive, withAttentions, total: athletes.length };
  }, [athletes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-[#00FF00]" size={24} />
      </div>
    );
  }

  if (athletes.length === 0) {
    return (
      <div className="text-center py-8">
        <Users size={32} className="mx-auto text-zinc-600 mb-3" />
        <p className="text-zinc-400 text-sm">Keine aktiven Athleten zugewiesen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {summaryStats && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{summaryStats.total}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Athleten</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${summaryStats.avgCompliance >= 70 ? 'text-[#00FF00]' : summaryStats.avgCompliance >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
              {summaryStats.avgCompliance}%
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Ø Compliance</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${summaryStats.inactive > 0 ? 'text-orange-400' : 'text-[#00FF00]'}`}>
              {summaryStats.inactive}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Inaktiv (&gt;3d)</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
            <p className={`text-2xl font-bold ${summaryStats.withAttentions > 0 ? 'text-red-400' : 'text-[#00FF00]'}`}>
              {summaryStats.withAttentions}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Attentions</p>
          </div>
        </div>
      )}

      {/* Search + Sort */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Athlet suchen..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl pl-9 pr-3 py-2 text-sm focus:border-[#00FF00] outline-none"
          />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="bg-zinc-900 border border-zinc-800 text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-[#00FF00]"
        >
          <option value="lastSession">Inaktivität</option>
          <option value="compliance">Compliance ↑</option>
          <option value="attentions">Attentions ↓</option>
        </select>
      </div>

      {/* Athlete List */}
      <div className="space-y-2">
        {filteredAthletes.map(athlete => {
          const isInactive = (athlete.daysSinceLastSession ?? 999) > 3;
          const hasIssues = athlete.openAttentions > 0;

          return (
            <div
              key={athlete.athleteId}
              className={`bg-zinc-900/50 border rounded-xl p-3 transition-all hover:border-zinc-600 ${
                hasIssues ? 'border-red-500/30' : isInactive ? 'border-orange-500/30' : 'border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  hasIssues ? 'bg-red-500/20 text-red-400' : isInactive ? 'bg-orange-500/20 text-orange-400' : 'bg-[#00FF00]/10 text-[#00FF00]'
                }`}>
                  {athlete.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm truncate">{athlete.name}</p>
                    {hasIssues && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <AlertTriangle size={10} /> {athlete.openAttentions}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Activity size={10} />
                      {athlete.sessionsThisWeek}/{athlete.sessionsPlanned} Sessions
                    </span>
                    {athlete.lastSessionDate ? (
                      <span className={`flex items-center gap-1 ${isInactive ? 'text-orange-400' : ''}`}>
                        <Clock size={10} />
                        {athlete.daysSinceLastSession === 0 ? 'Heute' :
                         athlete.daysSinceLastSession === 1 ? 'Gestern' :
                         `vor ${athlete.daysSinceLastSession}d`}
                      </span>
                    ) : (
                      <span className="text-orange-400 flex items-center gap-1">
                        <Clock size={10} /> Nie trainiert
                      </span>
                    )}
                    {athlete.wellnessScore !== null && (
                      <span className="flex items-center gap-1">
                        {athlete.wellnessScore >= 3.5 ? '😊' : athlete.wellnessScore >= 2.5 ? '😐' : '😟'}
                        {athlete.wellnessScore.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Compliance Ring */}
                <div className="flex items-center gap-2">
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="#27272a" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15" fill="none"
                        stroke={athlete.compliancePercent >= 70 ? '#00FF00' : athlete.compliancePercent >= 40 ? '#EAB308' : '#EF4444'}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${(athlete.compliancePercent / 100) * 94.25} 94.25`}
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                      {athlete.compliancePercent}%
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {onOpenChat && (
                    <button
                      onClick={() => onOpenChat(athlete.relationshipId, athlete.athleteId, athlete.name)}
                      className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-[#00FF00] transition-colors"
                      title="Chat öffnen"
                    >
                      <MessageCircle size={16} />
                    </button>
                  )}
                  {onSelectAthlete && (
                    <button
                      onClick={() => onSelectAthlete(athlete.athleteId)}
                      className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                      title="Profil öffnen"
                    >
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComplianceDashboard;
