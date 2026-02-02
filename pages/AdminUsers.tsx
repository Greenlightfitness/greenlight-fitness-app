import React, { useState, useEffect } from 'react';
import { getAllUsers, updateProfile } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserProfile, UserRole } from '../types';
import { Users, Search, Shield, User, ShieldCheck, Dumbbell } from 'lucide-react';

const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateProfile(userId, { role: newRole });
      
      // Optimistic update
      setUsers(users.map(u => u.uid === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Failed to update role");
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
                                    <select 
                                        value={u.role}
                                        onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                                        className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:border-[#00FF00] focus:outline-none"
                                    >
                                        <option value={UserRole.ATHLETE}>{t('auth.athlete')}</option>
                                        <option value={UserRole.COACH}>{t('auth.coach')}</option>
                                        <option value={UserRole.ADMIN}>{t('auth.admin')}</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;