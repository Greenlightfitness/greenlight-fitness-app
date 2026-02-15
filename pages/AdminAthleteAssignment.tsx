import React, { useState, useEffect } from 'react';
import { getAthletesWithCoaching, getUsersByRole, getAllUsers, assignAthleteToCoach, endCoachingRelationship, updateProfile, getProducts, grantCoachingManually, createCoachingRelationship, createInvitation, createNotification } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import { Users, Search, UserPlus, X, Check, Link2, Unlink, ChevronDown, User, Dumbbell, Shield, ShieldCheck, Gift, Mail, Bell, MessageCircle } from 'lucide-react';
import { showLocalNotification } from '../services/notifications';

interface AthleteWithCoaching {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  created_at: string;
  coaching_relationships: {
    id: string;
    coach_id: string;
    status: string;
    started_at: string;
    coach: any;
  }[];
}

interface Coach {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
}

const AdminAthleteAssignment: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const [athletes, setAthletes] = useState<AthleteWithCoaching[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCoach, setFilterCoach] = useState<string>('all');
  
  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteWithCoaching | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [assignReason, setAssignReason] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [athleteData, coachData] = await Promise.all([
        getAthletesWithCoaching(),
        getUsersByRole('COACH')
      ]);
      
      // Also include admins as potential coaches
      const adminData = await getUsersByRole('ADMIN');
      
      setAthletes(athleteData as AthleteWithCoaching[]);
      setCoaches([...coachData, ...adminData] as Coach[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAssignModal = (athlete: AthleteWithCoaching) => {
    setSelectedAthlete(athlete);
    setSelectedCoachId('');
    setAssignReason('');
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedAthlete || !selectedCoachId) return;
    setAssigning(true);
    
    try {
      await assignAthleteToCoach(
        selectedAthlete.id,
        selectedCoachId,
        assignReason || 'Admin-Zuweisung'
      );
      
      // Send notifications
      const coach = coaches.find(c => c.id === selectedCoachId);
      const athleteName = getAthleteName(selectedAthlete);
      const coachName = coach ? getCoachName(coach) : 'Coach';
      
      // Send email notifications (fire and forget)
      try {
        // Notify athlete
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'coaching_approved',
            to: selectedAthlete.email,
            data: {
              athleteName,
              coachName,
              productName: '1:1 Coaching',
              startDate: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
              dashboardLink: `${window.location.origin}/`,
            },
          }),
        });
        
        // Notify coach
        if (coach?.email) {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'coaching_request_coach',
              to: coach.email,
              data: {
                coachName,
                athleteName,
                athleteEmail: selectedAthlete.email,
                productName: '1:1 Coaching',
                requestDate: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                dashboardLink: `${window.location.origin}/coach/crm`,
              },
            }),
          });
        }
      } catch (emailErr) {
        console.warn('Email notification failed (non-critical):', emailErr);
      }
      
      // Push notification (local browser)
      showLocalNotification('Coach zugewiesen', {
        body: `${athleteName} wurde ${coachName} zugewiesen.`,
        tag: 'coach-assigned',
      });

      // In-App Bell notification for the coach
      createNotification({
        user_id: selectedCoachId,
        type: 'coach_assignment',
        title: 'Neuer Athlet zugewiesen',
        message: `${athleteName} wurde dir als Athlet zugewiesen.`,
      }).catch(err => console.error('Coach notification failed:', err));
      
      await fetchData();
      setShowAssignModal(false);
    } catch (error: any) {
      console.error("Error assigning athlete:", error);
      if (error.message?.includes('duplicate') || error.code === '23505') {
        alert("Dieser Athlet ist bereits diesem Coach zugewiesen.");
      } else {
        alert("Fehler bei der Zuweisung");
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (relationshipId: string, athleteName: string, coachName: string) => {
    if (!confirm(`Möchtest du die Zuweisung von ${athleteName} zu ${coachName} wirklich beenden?`)) {
      return;
    }
    
    try {
      await endCoachingRelationship(relationshipId);
      await fetchData();
    } catch (error) {
      console.error("Error ending relationship:", error);
      alert("Fehler beim Beenden der Zuweisung");
    }
  };

  const getAthleteName = (athlete: AthleteWithCoaching) => {
    if (athlete.first_name || athlete.last_name) {
      return `${athlete.first_name || ''} ${athlete.last_name || ''}`.trim();
    }
    return athlete.display_name || athlete.email.split('@')[0];
  };

  const getCoachName = (coach: any) => {
    if (!coach) return 'Unbekannt';
    // Handle both single object and array from Supabase
    const c = Array.isArray(coach) ? coach[0] : coach;
    if (!c) return 'Unbekannt';
    if (c.first_name || c.last_name) {
      return `${c.first_name || ''} ${c.last_name || ''}`.trim();
    }
    return c.email?.split('@')[0] || 'Unbekannt';
  };

  const getCoachEmail = (coach: any) => {
    if (!coach) return '';
    const c = Array.isArray(coach) ? coach[0] : coach;
    return c?.email || '';
  };

  const getActiveCoach = (athlete: AthleteWithCoaching) => {
    const activeRelationship = athlete.coaching_relationships?.find(r => r.status === 'ACTIVE');
    return activeRelationship ? activeRelationship : null;
  };

  // Filter athletes
  const filteredAthletes = athletes.filter(a => {
    const matchesSearch = 
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.first_name && a.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (a.last_name && a.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filterCoach === 'all') return matchesSearch;
    if (filterCoach === 'unassigned') {
      return matchesSearch && !getActiveCoach(a);
    }
    return matchesSearch && getActiveCoach(a)?.coach_id === filterCoach;
  });

  // Stats
  const totalAthletes = athletes.length;
  const assignedAthletes = athletes.filter(a => getActiveCoach(a)).length;
  const unassignedAthletes = totalAthletes - assignedAthletes;

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            Athleten-Zuweisung
            <span className="text-[#00FF00] text-sm bg-[#00FF00]/10 px-3 py-1 rounded-full border border-[#00FF00]/20">
              Admin
            </span>
          </h1>
          <p className="text-zinc-400 mt-2">CRM & Athleten-Coach-Zuweisungen zentral verwalten</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Coach Filter */}
          <div className="relative">
            <select
              value={filterCoach}
              onChange={(e) => setFilterCoach(e.target.value)}
              className="appearance-none bg-[#1C1C1E] border border-zinc-800 text-white rounded-xl px-4 py-3 pr-10 focus:border-[#00FF00] outline-none"
            >
              <option value="all">Alle Coaches</option>
              <option value="unassigned">Ohne Coach</option>
              {coaches.map(c => (
                <option key={c.id} value={c.id}>{getCoachName(c)}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={16} />
          </div>
          
          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text"
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1C1C1E] border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-600 focus:border-[#00FF00] focus:outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1C1C1E] border border-zinc-800 p-6 rounded-2xl">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Athleten Gesamt</div>
          <div className="text-3xl font-bold text-white">{totalAthletes}</div>
        </div>
        <div className="bg-[#1C1C1E] border border-zinc-800 p-6 rounded-2xl">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Mit Coach</div>
          <div className="text-3xl font-bold text-[#00FF00]">{assignedAthletes}</div>
        </div>
        <div className="bg-[#1C1C1E] border border-zinc-800 p-6 rounded-2xl">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Ohne Coach</div>
          <div className="text-3xl font-bold text-amber-500">{unassignedAthletes}</div>
        </div>
      </div>

      {/* Athletes Table */}
      {loading ? (
        <div className="text-zinc-500">Lade Daten...</div>
      ) : (
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-900 text-zinc-500 text-xs font-bold uppercase tracking-wider border-b border-zinc-800">
                  <th className="p-6">Athlet</th>
                  <th className="p-6">Coach</th>
                  <th className="p-6">Zugewiesen am</th>
                  <th className="p-6 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredAthletes.map(athlete => {
                  const activeCoaching = getActiveCoach(athlete);
                  
                  return (
                    <tr key={athlete.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400">
                            {athlete.first_name ? athlete.first_name.charAt(0) : athlete.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white">{getAthleteName(athlete)}</div>
                            <div className="text-sm text-zinc-500">{athlete.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        {activeCoaching ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#00FF00]/10 border border-[#00FF00]/30 flex items-center justify-center">
                              <Dumbbell size={14} className="text-[#00FF00]" />
                            </div>
                            <div>
                              <div className="font-medium text-white">{getCoachName(activeCoaching.coach)}</div>
                              <div className="text-xs text-zinc-500">{getCoachEmail(activeCoaching.coach)}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-500 italic">Kein Coach zugewiesen</span>
                        )}
                      </td>
                      <td className="p-6 text-sm text-zinc-500">
                        {activeCoaching 
                          ? new Date(activeCoaching.started_at).toLocaleDateString('de-DE')
                          : '-'
                        }
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {activeCoaching ? (
                            <>
                              <button
                                onClick={() => openAssignModal(athlete)}
                                className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
                                title="Anderen Coach zuweisen"
                              >
                                <Link2 size={16} />
                              </button>
                              <button
                                onClick={() => handleUnassign(
                                  activeCoaching.id,
                                  getAthleteName(athlete),
                                  getCoachName(activeCoaching.coach)
                                )}
                                className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                                title="Zuweisung beenden"
                              >
                                <Unlink size={16} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => openAssignModal(athlete)}
                              className="flex items-center gap-2 px-4 py-2 bg-[#00FF00]/10 text-[#00FF00] rounded-lg hover:bg-[#00FF00]/20 transition-colors font-medium"
                            >
                              <UserPlus size={16} />
                              Coach zuweisen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {filteredAthletes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-zinc-500">
                      Keine Athleten gefunden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedAthlete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1C1C1E] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-white">Coach zuweisen</h3>
                <p className="text-sm text-zinc-500">für {getAthleteName(selectedAthlete)}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">Coach auswählen</label>
                <select
                  value={selectedCoachId}
                  onChange={(e) => setSelectedCoachId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                >
                  <option value="">Coach wählen...</option>
                  {coaches.map(c => (
                    <option key={c.id} value={c.id}>
                      {getCoachName(c)} ({c.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">Grund (optional)</label>
                <input
                  type="text"
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  placeholder="Z.B. 1:1 Premium Coaching, Test..."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                />
              </div>

              {getActiveCoach(selectedAthlete) && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-amber-400 text-sm">
                    <strong>Hinweis:</strong> Dieser Athlet hat bereits einen Coach. 
                    Die bisherige Zuweisung muss zuerst beendet werden.
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-3 text-zinc-400 hover:text-white transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedCoachId || assigning || !!getActiveCoach(selectedAthlete)}
                className="flex-1 px-4 py-3 bg-[#00FF00] text-black font-bold rounded-xl hover:bg-[#00FF00]/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check size={18} />
                {assigning ? 'Wird zugewiesen...' : 'Zuweisen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAthleteAssignment;
