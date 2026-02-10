import React, { useState, useEffect } from 'react';
import {
  getAllUsersForCRM, getUsersByRole, assignAthleteToCoach, endCoachingRelationship,
  updateProfile, getProducts, grantCoachingManually, createCoachingRelationship,
  createInvitation
} from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserRole } from '../types';
import {
  Users, Search, UserPlus, X, Check, Link2, Unlink, ChevronDown, User,
  Dumbbell, Shield, ShieldCheck, Gift, Mail, Bell, MessageCircle, Filter,
  ArrowUpDown, Loader2, Calendar, Package, AlertCircle, Eye, MoreVertical
} from 'lucide-react';
import { showLocalNotification } from '../services/notifications';

interface CRMUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  role: string;
  created_at: string;
  coaching_as_athlete: {
    id: string;
    coach_id: string;
    product_id?: string;
    status: string;
    started_at: string;
    coach: any;
  }[];
  coaching_as_coach: {
    id: string;
    athlete_id: string;
    product_id?: string;
    status: string;
    started_at: string;
    athlete: any;
  }[];
}

type RoleFilter = 'ALL' | 'ATHLETE' | 'COACH' | 'ADMIN';
type StatusFilter = 'ALL' | 'WITH_COACH' | 'WITHOUT_COACH' | 'HAS_ATHLETES';
type SortField = 'name' | 'email' | 'created_at' | 'role';
type SortDir = 'asc' | 'desc';

const AdminCRM: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [allUsers, setAllUsers] = useState<CRMUser[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [productFilter, setProductFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CRMUser | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState('');
  const [assignReason, setAssignReason] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Detail Drawer
  const [detailUser, setDetailUser] = useState<CRMUser | null>(null);

  // Role change
  const [changingRole, setChangingRole] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [userData, productData] = await Promise.all([
        getAllUsersForCRM(),
        getProducts(),
      ]);
      setAllUsers(userData as CRMUser[]);

      // Extract coaches + admins for assignment dropdown
      const coachList = (userData as CRMUser[]).filter(u => u.role === 'COACH' || u.role === 'ADMIN');
      setCoaches(coachList);
      setProducts(productData);
    } catch (error) {
      console.error("Error fetching CRM data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Helpers ---
  const getUserName = (u: any) => {
    if (!u) return 'Unbekannt';
    const obj = Array.isArray(u) ? u[0] : u;
    if (!obj) return 'Unbekannt';
    if (obj.first_name || obj.last_name) return `${obj.first_name || ''} ${obj.last_name || ''}`.trim();
    return obj.display_name || obj.email?.split('@')[0] || 'Unbekannt';
  };

  const getUserEmail = (u: any) => {
    if (!u) return '';
    const obj = Array.isArray(u) ? u[0] : u;
    return obj?.email || '';
  };

  const getActiveCoach = (u: CRMUser) => {
    return u.coaching_as_athlete?.find(r => r.status === 'ACTIVE') || null;
  };

  const getActiveAthletes = (u: CRMUser) => {
    return u.coaching_as_coach?.filter(r => r.status === 'ACTIVE') || [];
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return { label: 'Admin', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: <ShieldCheck size={12} /> };
      case 'COACH': return { label: 'Coach', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: <Dumbbell size={12} /> };
      default: return { label: 'Athlete', color: 'bg-zinc-800 text-zinc-400 border-zinc-700', icon: <User size={12} /> };
    }
  };

  const getLinkedProductNames = (u: CRMUser): string[] => {
    const productIds = new Set<string>();
    u.coaching_as_athlete?.forEach(r => { if (r.product_id) productIds.add(r.product_id); });
    u.coaching_as_coach?.forEach(r => { if (r.product_id) productIds.add(r.product_id); });
    return [...productIds].map(pid => {
      const p = products.find(pr => pr.id === pid);
      return p?.title || pid.slice(0, 8);
    });
  };

  // --- Filtering + Sorting ---
  const filteredUsers = allUsers
    .filter(u => {
      // Search
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        u.email.toLowerCase().includes(term) ||
        (u.first_name && u.first_name.toLowerCase().includes(term)) ||
        (u.last_name && u.last_name.toLowerCase().includes(term)) ||
        (u.display_name && u.display_name.toLowerCase().includes(term));

      // Role
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      // Status
      let matchesStatus = true;
      if (statusFilter === 'WITH_COACH') matchesStatus = !!getActiveCoach(u);
      else if (statusFilter === 'WITHOUT_COACH') matchesStatus = u.role === 'ATHLETE' && !getActiveCoach(u);
      else if (statusFilter === 'HAS_ATHLETES') matchesStatus = getActiveAthletes(u).length > 0;

      // Product
      let matchesProduct = true;
      if (productFilter !== 'ALL') {
        const linked = new Set<string>();
        u.coaching_as_athlete?.forEach(r => { if (r.product_id) linked.add(r.product_id); });
        u.coaching_as_coach?.forEach(r => { if (r.product_id) linked.add(r.product_id); });
        matchesProduct = linked.has(productFilter);
      }

      return matchesSearch && matchesRole && matchesStatus && matchesProduct;
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'name': return dir * getUserName(a).localeCompare(getUserName(b));
        case 'email': return dir * a.email.localeCompare(b.email);
        case 'role': return dir * a.role.localeCompare(b.role);
        case 'created_at':
        default: return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
    });

  // --- Stats ---
  const totalUsers = allUsers.length;
  const totalAthletes = allUsers.filter(u => u.role === 'ATHLETE').length;
  const totalCoaches = allUsers.filter(u => u.role === 'COACH').length;
  const totalAdmins = allUsers.filter(u => u.role === 'ADMIN').length;
  const assignedAthletes = allUsers.filter(u => u.role === 'ATHLETE' && getActiveCoach(u)).length;
  const unassignedAthletes = totalAthletes - assignedAthletes;

  // --- Actions ---
  const openAssignModal = (u: CRMUser) => {
    setSelectedUser(u);
    setSelectedCoachId('');
    setAssignReason('');
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedUser || !selectedCoachId) return;
    setAssigning(true);
    try {
      await assignAthleteToCoach(selectedUser.id, selectedCoachId, assignReason || 'Admin-Zuweisung');

      const coach = coaches.find(c => c.id === selectedCoachId);
      showLocalNotification('Coach zugewiesen', {
        body: `${getUserName(selectedUser)} wurde ${getUserName(coach)} zugewiesen.`,
        tag: 'coach-assigned',
      });

      await fetchData();
      setShowAssignModal(false);
    } catch (error: any) {
      console.error("Error assigning:", error);
      if (error.message?.includes('duplicate') || error.code === '23505') {
        alert("Dieser User ist bereits diesem Coach zugewiesen.");
      } else {
        alert("Fehler bei der Zuweisung: " + (error.message || ''));
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassign = async (relationshipId: string, userName: string, coachName: string) => {
    if (!confirm(`Zuweisung von ${userName} zu ${coachName} wirklich beenden?`)) return;
    try {
      await endCoachingRelationship(relationshipId);
      await fetchData();
    } catch (error) {
      console.error("Error ending relationship:", error);
      alert("Fehler beim Beenden der Zuweisung");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId);
    try {
      await updateProfile(userId, { role: newRole });
      await fetchData();
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Fehler beim Ändern der Rolle");
    } finally {
      setChangingRole(null);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const activeFilterCount = [
    roleFilter !== 'ALL',
    statusFilter !== 'ALL',
    productFilter !== 'ALL',
    searchTerm.length > 0,
  ].filter(Boolean).length;

  // --- RENDER ---
  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            CRM <span className="text-[#00FF00]">.</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Alle User, Coaches & Athleten zentral verwalten</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Gesamt', value: totalUsers, color: 'text-white' },
          { label: 'Athleten', value: totalAthletes, color: 'text-zinc-300' },
          { label: 'Coaches', value: totalCoaches, color: 'text-blue-400' },
          { label: 'Admins', value: totalAdmins, color: 'text-purple-400' },
          { label: 'Mit Coach', value: assignedAthletes, color: 'text-[#00FF00]' },
          { label: 'Ohne Coach', value: unassignedAthletes, color: 'text-amber-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input
              type="text"
              placeholder="Name oder E-Mail suchen..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-[#00FF00] outline-none transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value as RoleFilter)}
              className="appearance-none bg-zinc-900 border border-zinc-800 text-sm text-white rounded-xl px-4 py-2.5 pr-9 focus:border-[#00FF00] outline-none"
            >
              <option value="ALL">Alle Rollen</option>
              <option value="ATHLETE">Athleten</option>
              <option value="COACH">Coaches</option>
              <option value="ADMIN">Admins</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={14} />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as StatusFilter)}
              className="appearance-none bg-zinc-900 border border-zinc-800 text-sm text-white rounded-xl px-4 py-2.5 pr-9 focus:border-[#00FF00] outline-none"
            >
              <option value="ALL">Alle Status</option>
              <option value="WITH_COACH">Mit Coach</option>
              <option value="WITHOUT_COACH">Ohne Coach</option>
              <option value="HAS_ATHLETES">Hat Athleten</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={14} />
          </div>

          {/* Product Filter */}
          <div className="relative">
            <select
              value={productFilter}
              onChange={e => setProductFilter(e.target.value)}
              className="appearance-none bg-zinc-900 border border-zinc-800 text-sm text-white rounded-xl px-4 py-2.5 pr-9 focus:border-[#00FF00] outline-none max-w-[200px]"
            >
              <option value="ALL">Alle Produkte</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={14} />
          </div>

          {/* Active filters count */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => { setSearchTerm(''); setRoleFilter('ALL'); setStatusFilter('ALL'); setProductFilter('ALL'); }}
              className="text-xs text-zinc-500 hover:text-[#00FF00] flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-[#00FF00]/10 transition-colors"
            >
              <X size={12} /> {activeFilterCount} Filter zurücksetzen
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
          <span className="text-xs text-zinc-600">
            {filteredUsers.length} von {totalUsers} Usern
          </span>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-500">
          <Loader2 size={20} className="animate-spin mr-2" /> Lade Daten...
        </div>
      ) : (
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-900/80 text-zinc-500 text-[10px] font-bold uppercase tracking-widest border-b border-zinc-800">
                  <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('name')}>
                    <span className="flex items-center gap-1">User {sortField === 'name' && <ArrowUpDown size={10} />}</span>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('role')}>
                    <span className="flex items-center gap-1">Rolle {sortField === 'role' && <ArrowUpDown size={10} />}</span>
                  </th>
                  <th className="p-4">Coach / Athleten</th>
                  <th className="p-4">Produkte</th>
                  <th className="p-4 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort('created_at')}>
                    <span className="flex items-center gap-1">Registriert {sortField === 'created_at' && <ArrowUpDown size={10} />}</span>
                  </th>
                  <th className="p-4 text-right">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredUsers.map(u => {
                  const activeCoaching = getActiveCoach(u);
                  const activeAthletes = getActiveAthletes(u);
                  const badge = getRoleBadge(u.role);
                  const linkedProducts = getLinkedProductNames(u);

                  return (
                    <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors group">
                      {/* User */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                            u.role === 'COACH' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {u.first_name ? u.first_name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white text-sm truncate">{getUserName(u)}</div>
                            <div className="text-xs text-zinc-600 truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-4">
                        <div className="relative group/role">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-lg border ${badge.color}`}>
                            {badge.icon} {badge.label}
                          </span>
                          {/* Role change dropdown on hover */}
                          <div className="absolute left-0 top-full mt-1 hidden group-hover/role:block z-20">
                            <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl p-1 min-w-[120px]">
                              {['ATHLETE', 'COACH', 'ADMIN'].filter(r => r !== u.role).map(r => (
                                <button
                                  key={r}
                                  onClick={() => handleRoleChange(u.id, r)}
                                  disabled={changingRole === u.id}
                                  className="w-full text-left text-xs px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                                >
                                  → {r}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Coach / Athletes */}
                      <td className="p-4">
                        {u.role === 'ATHLETE' && activeCoaching ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#00FF00]/10 flex items-center justify-center">
                              <Dumbbell size={10} className="text-[#00FF00]" />
                            </div>
                            <div className="text-xs">
                              <span className="text-white font-medium">{getUserName(activeCoaching.coach)}</span>
                            </div>
                          </div>
                        ) : u.role === 'ATHLETE' ? (
                          <span className="text-xs text-zinc-600 italic">Kein Coach</span>
                        ) : activeAthletes.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5">
                              {activeAthletes.slice(0, 4).map(rel => (
                                <div key={rel.id} className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-[#1C1C1E] flex items-center justify-center text-[8px] font-bold text-zinc-400" title={getUserName(rel.athlete)}>
                                  {getUserName(rel.athlete).charAt(0).toUpperCase()}
                                </div>
                              ))}
                              {activeAthletes.length > 4 && (
                                <div className="w-6 h-6 rounded-full bg-zinc-700 border-2 border-[#1C1C1E] flex items-center justify-center text-[8px] font-bold text-zinc-300">
                                  +{activeAthletes.length - 4}
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-zinc-400">{activeAthletes.length} Athlet{activeAthletes.length !== 1 ? 'en' : ''}</span>
                          </div>
                        ) : (u.role === 'COACH' || u.role === 'ADMIN') ? (
                          <span className="text-xs text-zinc-600 italic">Keine Athleten</span>
                        ) : null}
                      </td>

                      {/* Products */}
                      <td className="p-4">
                        {linkedProducts.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {linkedProducts.map((name, i) => (
                              <span key={i} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700 truncate max-w-[120px]">
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-700">—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-xs text-zinc-500">
                        {new Date(u.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                          {/* Detail */}
                          <button
                            onClick={() => setDetailUser(u)}
                            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="Details"
                          >
                            <Eye size={14} />
                          </button>

                          {u.role === 'ATHLETE' && !activeCoaching && (
                            <button
                              onClick={() => openAssignModal(u)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00FF00]/10 text-[#00FF00] rounded-lg hover:bg-[#00FF00]/20 transition-colors text-xs font-bold"
                            >
                              <UserPlus size={12} /> Zuweisen
                            </button>
                          )}

                          {u.role === 'ATHLETE' && activeCoaching && (
                            <>
                              <button
                                onClick={() => openAssignModal(u)}
                                className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/10 transition-colors"
                                title="Anderen Coach zuweisen"
                              >
                                <Link2 size={14} />
                              </button>
                              <button
                                onClick={() => handleUnassign(activeCoaching.id, getUserName(u), getUserName(activeCoaching.coach))}
                                className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Zuweisung beenden"
                              >
                                <Unlink size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-16 text-center">
                      <Users size={32} className="mx-auto mb-3 text-zinc-700" />
                      <p className="text-zinc-500 font-medium">Keine User gefunden</p>
                      <p className="text-zinc-700 text-sm mt-1">Passe deine Filter an.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === DETAIL DRAWER === */}
      {detailUser && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setDetailUser(null)}>
          <div className="w-full max-w-md bg-[#1C1C1E] border-l border-zinc-800 h-full overflow-y-auto animate-in slide-in-from-right" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-[#1C1C1E]/95 backdrop-blur-sm border-b border-zinc-800 p-6 flex justify-between items-center z-10">
              <h3 className="text-lg font-bold text-white">User Details</h3>
              <button onClick={() => setDetailUser(null)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${
                  detailUser.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                  detailUser.role === 'COACH' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-zinc-800 text-zinc-400'
                }`}>
                  {detailUser.first_name ? detailUser.first_name.charAt(0).toUpperCase() : detailUser.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{getUserName(detailUser)}</div>
                  <div className="text-sm text-zinc-500">{detailUser.email}</div>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getRoleBadge(detailUser.role).color}`}>
                      {getRoleBadge(detailUser.role).icon} {getRoleBadge(detailUser.role).label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-zinc-600">
                Registriert am {new Date(detailUser.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>

              {/* Coaching as Athlete */}
              {detailUser.coaching_as_athlete && detailUser.coaching_as_athlete.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Coaching (als Athlet)</h4>
                  <div className="space-y-2">
                    {detailUser.coaching_as_athlete.map(rel => {
                      const productName = products.find(p => p.id === rel.product_id)?.title;
                      return (
                        <div key={rel.id} className={`p-3 rounded-xl border ${rel.status === 'ACTIVE' ? 'border-[#00FF00]/30 bg-[#00FF00]/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Dumbbell size={14} className={rel.status === 'ACTIVE' ? 'text-[#00FF00]' : 'text-zinc-600'} />
                              <span className="text-sm font-medium text-white">{getUserName(rel.coach)}</span>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${rel.status === 'ACTIVE' ? 'bg-[#00FF00]/10 text-[#00FF00]' : 'bg-zinc-800 text-zinc-500'}`}>
                              {rel.status}
                            </span>
                          </div>
                          {productName && <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1"><Package size={10} /> {productName}</div>}
                          <div className="text-xs text-zinc-600 mt-1">Seit {new Date(rel.started_at).toLocaleDateString('de-DE')}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Coaching as Coach */}
              {detailUser.coaching_as_coach && detailUser.coaching_as_coach.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Coaching (als Coach) — {detailUser.coaching_as_coach.filter(r => r.status === 'ACTIVE').length} aktiv</h4>
                  <div className="space-y-2">
                    {detailUser.coaching_as_coach.map(rel => {
                      const productName = products.find(p => p.id === rel.product_id)?.title;
                      return (
                        <div key={rel.id} className={`p-3 rounded-xl border ${rel.status === 'ACTIVE' ? 'border-blue-500/30 bg-blue-500/5' : 'border-zinc-800 bg-zinc-900/50'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <User size={14} className={rel.status === 'ACTIVE' ? 'text-blue-400' : 'text-zinc-600'} />
                              <span className="text-sm font-medium text-white">{getUserName(rel.athlete)}</span>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${rel.status === 'ACTIVE' ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}>
                              {rel.status}
                            </span>
                          </div>
                          {productName && <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1"><Package size={10} /> {productName}</div>}
                          <div className="text-xs text-zinc-600 mt-1">Seit {new Date(rel.started_at).toLocaleDateString('de-DE')}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Linked Products */}
              {getLinkedProductNames(detailUser).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Verknüpfte Produkte</h4>
                  <div className="flex flex-wrap gap-2">
                    {getLinkedProductNames(detailUser).map((name, i) => (
                      <span key={i} className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700">
                        <Package size={10} className="inline mr-1" /> {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Aktionen</h4>
                <div className="space-y-2">
                  {detailUser.role === 'ATHLETE' && !getActiveCoach(detailUser) && (
                    <button
                      onClick={() => { setDetailUser(null); openAssignModal(detailUser); }}
                      className="w-full flex items-center gap-2 px-4 py-3 bg-[#00FF00]/10 text-[#00FF00] rounded-xl hover:bg-[#00FF00]/20 transition-colors text-sm font-bold"
                    >
                      <UserPlus size={16} /> Coach zuweisen
                    </button>
                  )}
                  <div className="flex gap-2">
                    {['ATHLETE', 'COACH', 'ADMIN'].filter(r => r !== detailUser.role).map(r => (
                      <button
                        key={r}
                        onClick={() => handleRoleChange(detailUser.id, r)}
                        disabled={changingRole === detailUser.id}
                        className="flex-1 px-3 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-xl hover:border-zinc-600 hover:text-white transition-colors"
                      >
                        → {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === ASSIGN MODAL === */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1C1C1E] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-white">Coach zuweisen</h3>
                <p className="text-sm text-zinc-500">für {getUserName(selectedUser)}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-zinc-500 hover:text-white"><X size={24} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">Coach auswählen</label>
                <select
                  value={selectedCoachId}
                  onChange={e => setSelectedCoachId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                >
                  <option value="">Coach wählen...</option>
                  {coaches.map(c => (
                    <option key={c.id} value={c.id}>
                      {getUserName(c)} ({c.email}) {c.role === 'ADMIN' ? '[Admin]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">Grund (optional)</label>
                <input
                  type="text"
                  value={assignReason}
                  onChange={e => setAssignReason(e.target.value)}
                  placeholder="Z.B. 1:1 Premium Coaching, Test..."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                />
              </div>

              {getActiveCoach(selectedUser) && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-amber-400 text-sm">
                    <strong>Hinweis:</strong> Dieser Athlet hat bereits einen Coach.
                    Die bisherige Zuweisung muss zuerst beendet werden.
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-800 flex gap-3">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-3 text-zinc-400 hover:text-white transition-colors">
                Abbrechen
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedCoachId || assigning || !!getActiveCoach(selectedUser)}
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

export default AdminCRM;
