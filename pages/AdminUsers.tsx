import React, { useState, useEffect } from 'react';
import { getAllUsers, updateProfile, getProducts, grantCoachingManually, createCoachingRelationship, createInvitation } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserProfile, UserRole } from '../types';
import { Users, Search, Shield, User, ShieldCheck, Dumbbell, Gift, Mail, UserPlus, X, Check } from 'lucide-react';
import Button from '../components/Button';
import ConfirmActionModal, { ConfirmActionConfig, getRoleChangeConfig } from '../components/ConfirmActionModal';

const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Grant Access Modal State
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [coachingProducts, setCoachingProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const [granting, setGranting] = useState(false);
  
  // Confirmation Modal
  const [confirmConfig, setConfirmConfig] = useState<ConfirmActionConfig | null>(null);
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Invite Modal State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteAutoApprove, setInviteAutoApprove] = useState(false);
  const [inviteBonusProduct, setInviteBonusProduct] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      const fetchedUsers = data.map((u: any) => ({
        uid: u.id,
        email: u.email,
        role: u.role,
        displayName: u.display_name,
        firstName: u.first_name,
        lastName: u.last_name,
        createdAt: u.created_at,
      } as UserProfile));
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    const targetUser = users.find(u => u.uid === userId);
    if (!targetUser) return;
    const userName = targetUser.firstName
      ? `${targetUser.firstName} ${targetUser.lastName || ''}`.trim()
      : targetUser.email?.split('@')[0] || 'User';
    const fromRole = targetUser.role as string;
    setConfirmConfig(getRoleChangeConfig(userName, fromRole, newRole));
    setConfirmAction(() => async () => {
      try {
        await updateProfile(userId, { role: newRole });
        setUsers(users.map(u => u.uid === userId ? { ...u, role: newRole } : u));
      } catch (error) {
        console.error("Error updating role:", error);
        alert("Fehler beim Ändern der Rolle");
      }
    });
  };

  const executeConfirm = async () => {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      await confirmAction();
    } finally {
      setConfirmLoading(false);
      setConfirmConfig(null);
      setConfirmAction(null);
    }
  };

  const cancelConfirm = () => {
    setConfirmConfig(null);
    setConfirmAction(null);
    setConfirmLoading(false);
  };

  // Fetch coaching products for grant modal
  const fetchCoachingProducts = async () => {
    try {
      const products = await getProducts(undefined, true);
      const coaching = products.filter((p: any) => p.type === 'COACHING_1ON1');
      setCoachingProducts(coaching);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // Open grant modal for a user
  const openGrantModal = async (targetUser: UserProfile) => {
    setSelectedUser(targetUser);
    setSelectedProductId('');
    setGrantReason('');
    await fetchCoachingProducts();
    setShowGrantModal(true);
  };

  // Grant coaching access manually
  const handleGrantAccess = async () => {
    if (!user || !selectedUser || !selectedProductId) return;
    setGranting(true);
    
    try {
      // Get the product to find coach_id
      const product = coachingProducts.find(p => p.id === selectedProductId);
      if (!product) throw new Error('Produkt nicht gefunden');

      // Create coaching approval (already approved)
      await grantCoachingManually(
        selectedUser.uid,
        selectedProductId,
        user.id,
        grantReason || 'Admin-Freischaltung'
      );

      // Also create the coaching relationship
      await createCoachingRelationship({
        athlete_id: selectedUser.uid,
        coach_id: product.coach_id,
        product_id: selectedProductId,
        is_manual_grant: true,
        grant_reason: grantReason || 'Admin-Freischaltung',
      });

      alert(`Coaching für ${selectedUser.email} freigeschaltet!`);
      setShowGrantModal(false);
    } catch (error) {
      console.error("Error granting access:", error);
      alert("Fehler beim Freischalten");
    } finally {
      setGranting(false);
    }
  };

  // Send invitation
  const handleSendInvitation = async () => {
    if (!user || !inviteEmail) return;
    setSending(true);
    
    try {
      const invitation = await createInvitation({
        email: inviteEmail,
        invited_by: user.id,
        personal_message: inviteMessage || undefined,
        auto_approve_coaching: inviteAutoApprove,
        auto_assign_product_id: inviteAutoApprove && inviteBonusProduct ? inviteBonusProduct : undefined,
        is_bonus_grant: !!inviteBonusProduct,
        bonus_product_id: inviteBonusProduct || undefined,
        bonus_reason: 'Einladungs-Bonus',
      });

      alert(`Einladung an ${inviteEmail} erstellt!\nCode: ${invitation.invitation_code}`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteMessage('');
      setInviteAutoApprove(false);
      setInviteBonusProduct('');
    } catch (error) {
      console.error("Error sending invitation:", error);
      alert("Fehler beim Erstellen der Einladung");
    } finally {
      setSending(false);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.firstName && u.firstName.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
             {t('admin.usersTitle')} <span className="text-[#00FF00] text-sm bg-[#00FF00]/10 px-3 py-1 rounded-full border border-[#00FF00]/20">Admin</span>
           </h1>
           <p className="text-zinc-400 mt-2">{t('admin.usersSubtitle')}</p>
        </div>
        
        <div className="flex items-center gap-3">
            <button
                onClick={async () => {
                    await fetchCoachingProducts();
                    setShowInviteModal(true);
                }}
                className="flex items-center gap-2 px-4 py-3 bg-[#00FF00] text-black font-bold rounded-xl hover:bg-[#00FF00]/80 transition-colors"
            >
                <UserPlus size={18} /> Einladen
            </button>
            <div className="relative w-full md:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text"
                  placeholder={t('common.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1C1C1E] border border-zinc-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder-zinc-600 focus:border-[#00FF00] focus:outline-none transition-all"
                />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#1C1C1E] border border-zinc-800 p-6 rounded-2xl">
              <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{t('admin.totalUsers')}</div>
              <div className="text-3xl font-bold text-white">{users.length}</div>
          </div>
          <div className="bg-[#1C1C1E] border border-zinc-800 p-6 rounded-2xl">
              <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{t('auth.athlete')}s</div>
              <div className="text-3xl font-bold text-white">{users.filter(u => u.role === UserRole.ATHLETE).length}</div>
          </div>
          <div className="bg-[#1C1C1E] border border-zinc-800 p-6 rounded-2xl">
              <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{t('auth.coach')}es</div>
              <div className="text-3xl font-bold text-white">{users.filter(u => u.role === UserRole.COACH || u.role === UserRole.ADMIN).length}</div>
          </div>
      </div>

      {loading ? (
        <div className="text-zinc-500">{t('common.loading')}</div>
      ) : (
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-zinc-900 text-zinc-500 text-xs font-bold uppercase tracking-wider border-b border-zinc-800">
                            <th className="p-6">{t('auth.email')} / Name</th>
                            <th className="p-6">{t('common.role')}</th>
                            <th className="p-6">{t('admin.joined')}</th>
                            <th className="p-6 text-right">{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {filteredUsers.map(u => (
                            <tr key={u.uid} className="hover:bg-zinc-800/30 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold 
                                            ${u.role === UserRole.ADMIN ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 
                                              u.role === UserRole.COACH ? 'bg-[#00FF00]/10 text-[#00FF00] border border-[#00FF00]/30' : 
                                              'bg-zinc-800 text-zinc-400'}`}>
                                            {u.firstName ? u.firstName.charAt(0) : u.email.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white">{u.firstName} {u.lastName}</div>
                                            <div className="text-sm text-zinc-500">{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2">
                                        {u.role === UserRole.ADMIN && <ShieldCheck size={16} className="text-red-500" />}
                                        {u.role === UserRole.COACH && <Dumbbell size={16} className="text-[#00FF00]" />}
                                        {u.role === UserRole.ATHLETE && <User size={16} className="text-zinc-500" />}
                                        <span className={`text-sm font-medium ${
                                            u.role === UserRole.ADMIN ? 'text-red-500' :
                                            u.role === UserRole.COACH ? 'text-[#00FF00]' :
                                            'text-zinc-400'
                                        }`}>
                                            {u.role}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-6 text-sm text-zinc-500">
                                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                                </td>
                                <td className="p-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {u.role === UserRole.ATHLETE && (
                                            <button
                                                onClick={() => openGrantModal(u)}
                                                className="p-2 bg-[#00FF00]/10 text-[#00FF00] rounded-lg hover:bg-[#00FF00]/20 transition-colors"
                                                title="Coaching freischalten"
                                            >
                                                <Gift size={16} />
                                            </button>
                                        )}
                                        <select 
                                            value={u.role}
                                            onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                                            className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:border-[#00FF00] focus:outline-none"
                                        >
                                            <option value={UserRole.ATHLETE}>{t('auth.athlete')}</option>
                                            <option value={UserRole.COACH}>{t('auth.coach')}</option>
                                            <option value={UserRole.ADMIN}>{t('auth.admin')}</option>
                                        </select>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Grant Access Modal */}
      {showGrantModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1C1C1E] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-white">Coaching freischalten</h3>
                <p className="text-sm text-zinc-500">für {selectedUser.email}</p>
              </div>
              <button onClick={() => setShowGrantModal(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">Coaching-Paket</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                >
                  <option value="">Paket auswählen...</option>
                  {coachingProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">Grund (optional)</label>
                <input
                  type="text"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="Z.B. Bonus, Partner, Testphase..."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => setShowGrantModal(false)}
                className="flex-1 px-4 py-3 text-zinc-400 hover:text-white transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleGrantAccess}
                disabled={!selectedProductId || granting}
                className="flex-1 px-4 py-3 bg-[#00FF00] text-black font-bold rounded-xl hover:bg-[#00FF00]/80 transition-colors disabled:opacity-50"
              >
                {granting ? 'Wird freigeschaltet...' : 'Freischalten'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-[#1C1C1E] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <div>
                <h3 className="text-lg font-bold text-white">Neuen Athleten einladen</h3>
                <p className="text-sm text-zinc-500">Einladung per E-Mail versenden</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">E-Mail-Adresse *</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="athlete@example.com"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-2">Persönliche Nachricht (optional)</label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Willkommen bei Greenlight Fitness..."
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none resize-none"
                />
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-white">Voreinstellungen</h4>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inviteAutoApprove}
                    onChange={(e) => setInviteAutoApprove(e.target.checked)}
                    className="w-5 h-5 rounded bg-zinc-800 border-zinc-700 text-[#00FF00] focus:ring-[#00FF00]"
                  />
                  <span className="text-sm text-zinc-300">Automatisch für 1:1 Coaching freischalten</span>
                </label>

                {(inviteAutoApprove || true) && (
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1">Bonus-Coaching-Paket (optional)</label>
                    <select
                      value={inviteBonusProduct}
                      onChange={(e) => setInviteBonusProduct(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:border-[#00FF00] outline-none"
                    >
                      <option value="">Kein Bonus</option>
                      {coachingProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.title} (Gratis)</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-3 text-zinc-400 hover:text-white transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSendInvitation}
                disabled={!inviteEmail || sending}
                className="flex-1 px-4 py-3 bg-[#00FF00] text-black font-bold rounded-xl hover:bg-[#00FF00]/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Mail size={18} />
                {sending ? 'Wird erstellt...' : 'Einladung erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* === CONFIRMATION MODAL === */}
      {confirmConfig && (
        <ConfirmActionModal
          config={confirmConfig}
          loading={confirmLoading}
          onConfirm={executeConfirm}
          onCancel={cancelConfirm}
        />
      )}
    </div>
  );
};

export default AdminUsers;