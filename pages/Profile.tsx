import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import { signOut, requestDataDeletion, requestDataExport, exportUserData, createAuditLog } from '../services/supabase';
import { User, Settings, LogOut, Globe, Calculator, UserCog, Mail, Shield, Download, Trash2, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import { UserRole } from '../types';
import Button from '../components/Button';
import CalculatorsModal from '../components/CalculatorsModal';
import ProfileSetupWizard from '../components/ProfileSetupWizard';

const Profile: React.FC = () => {
  const { userProfile, user, activeRole, setActiveRole, canSwitchRole } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [showTools, setShowTools] = useState(false);
  const [showEditWizard, setShowEditWizard] = useState(false);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  const handleExportData = async () => {
    if (!user) return;
    setExportLoading(true);
    try {
      const data = await exportUserData(user.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `greenlight-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      await createAuditLog({
        user_id: user.id,
        action: 'DATA_EXPORT',
        table_name: 'all',
      });
      
      fetch('/api/send-gdpr-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, type: 'export_ready', name: userProfile?.nickname }),
      }).catch(() => {});
      
      alert('Datenexport erfolgreich heruntergeladen!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export fehlgeschlagen. Bitte versuche es erneut.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    if (!user || !user.email) return;
    setDeleteLoading(true);
    try {
      await requestDataDeletion(user.id, user.email, deleteReason);
      
      await createAuditLog({
        user_id: user.id,
        action: 'DELETION_REQUESTED',
        new_data: { reason: deleteReason },
      });
      
      fetch('/api/send-gdpr-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, type: 'deletion_request_received', name: userProfile?.nickname }),
      }).catch(() => {});
      
      alert('Löschantrag wurde eingereicht. Du erhältst eine Bestätigung per E-Mail.');
      setShowDeleteConfirm(false);
      setDeleteReason('');
    } catch (error) {
      console.error('Deletion request failed:', error);
      alert('Fehler beim Einreichen des Löschantrags.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'de' : 'en');
  };

  if (showEditWizard) {
      return <ProfileSetupWizard onComplete={() => setShowEditWizard(false)} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <CalculatorsModal isOpen={showTools} onClose={() => setShowTools(false)} />

      {/* Header Profile Card */}
      <div className="bg-gradient-to-br from-[#1C1C1E] to-black border border-zinc-800 rounded-[2rem] p-6 text-center relative overflow-hidden">
          <div className="w-24 h-24 rounded-full bg-zinc-800 border-4 border-[#1C1C1E] mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-[#00FF00] shadow-xl">
              {userProfile?.nickname?.charAt(0) || userProfile?.email?.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
              {userProfile?.nickname || userProfile?.firstName || "Athlete"}
          </h1>
          <p className="text-zinc-500 text-sm">{user?.email}</p>
          
          <div className="flex justify-center gap-4 mt-6">
              <div className="text-center">
                  <span className="block text-xl font-bold text-white">{userProfile?.height || '-'}</span>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">cm</span>
              </div>
              <div className="w-px bg-zinc-800 h-8 self-center"></div>
              <div className="text-center">
                  <span className="block text-xl font-bold text-white">{userProfile?.weight || '-'}</span>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">kg</span>
              </div>
          </div>
      </div>

      {/* Main Actions */}
      <div className="grid gap-4">
          <button 
            onClick={() => setShowTools(true)}
            className="flex items-center gap-4 p-5 bg-[#1C1C1E] border border-zinc-800 rounded-2xl hover:bg-zinc-900 transition-all group"
          >
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#00FF00] group-hover:scale-110 transition-transform">
                  <Calculator size={24} />
              </div>
              <div className="text-left flex-1">
                  <h3 className="text-white font-bold text-lg">{t('tools.title')}</h3>
                  <p className="text-zinc-500 text-sm">1RM, FFMI, Macros, Zones</p>
              </div>
          </button>

          <button 
            onClick={() => setShowEditWizard(true)}
            className="flex items-center gap-4 p-5 bg-[#1C1C1E] border border-zinc-800 rounded-2xl hover:bg-zinc-900 transition-all group"
          >
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                  <UserCog size={24} />
              </div>
              <div className="text-left flex-1">
                  <h3 className="text-white font-bold text-lg">Edit Profile</h3>
                  <p className="text-zinc-500 text-sm">Update body stats & bio</p>
              </div>
          </button>
      </div>

      {/* Role Switcher (for dual-role users) */}
      {canSwitchRole && (
        <div className="space-y-4 pt-4">
          <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest px-2">Ansicht wechseln</h3>
          
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <RefreshCw size={18} className="text-[#00FF00]" />
                <span className="text-white font-medium">Aktive Rolle</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveRole(UserRole.ATHLETE)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                    activeRole === UserRole.ATHLETE
                      ? 'bg-[#00FF00] text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Athlet
                </button>
                <button
                  onClick={() => setActiveRole(UserRole.COACH)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                    activeRole === UserRole.COACH
                      ? 'bg-[#00FF00] text-black'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Coach
                </button>
              </div>
              <p className="text-zinc-600 text-xs mt-3">Wechsle zwischen Athlet- und Coach-Ansicht</p>
            </div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      <div className="space-y-4 pt-4">
          <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest px-2">App Settings</h3>
          
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
              <button onClick={toggleLanguage} className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors">
                  <div className="flex items-center gap-3">
                      <Globe size={18} className="text-zinc-400" />
                      <span className="text-white font-medium">Language</span>
                  </div>
                  <span className="text-zinc-500 text-sm font-bold uppercase">{language === 'en' ? 'English' : 'Deutsch'}</span>
              </button>
              
              <div className="w-full flex items-center justify-between p-4 bg-zinc-950/50 cursor-default">
                  <div className="flex items-center gap-3">
                      <Settings size={18} className="text-zinc-400" />
                      <span className="text-zinc-500 font-medium">Version</span>
                  </div>
                  <span className="text-zinc-600 text-sm">v1.0.2</span>
              </div>
          </div>
      </div>

      {/* Privacy & Data Section (GDPR) */}
      <div className="space-y-4 pt-4">
          <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest px-2">Datenschutz (DSGVO)</h3>
          
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
              <Link to="/legal/privacy" className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors">
                  <div className="flex items-center gap-3">
                      <FileText size={18} className="text-zinc-400" />
                      <span className="text-white font-medium">Datenschutzerklärung</span>
                  </div>
                  <span className="text-zinc-600">→</span>
              </Link>
              
              <button onClick={handleExportData} disabled={exportLoading} className="w-full flex items-center justify-between p-4 hover:bg-zinc-900 transition-colors disabled:opacity-50">
                  <div className="flex items-center gap-3">
                      <Download size={18} className="text-[#00FF00]" />
                      <div className="text-left">
                          <span className="text-white font-medium block">Meine Daten exportieren</span>
                          <span className="text-zinc-500 text-xs">Art. 20 DSGVO - Datenportabilität</span>
                      </div>
                  </div>
                  {exportLoading ? <span className="text-zinc-500 text-sm">Lädt...</span> : <span className="text-zinc-600">↓</span>}
              </button>
              
              <button onClick={() => setShowDeleteConfirm(true)} className="w-full flex items-center justify-between p-4 hover:bg-red-500/10 transition-colors">
                  <div className="flex items-center gap-3">
                      <Trash2 size={18} className="text-red-500" />
                      <div className="text-left">
                          <span className="text-red-400 font-medium block">Account & Daten löschen</span>
                          <span className="text-zinc-500 text-xs">Art. 17 DSGVO - Recht auf Löschung</span>
                      </div>
                  </div>
              </button>
          </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Account löschen?</h3>
                <p className="text-zinc-500 text-sm">Diese Aktion kann nicht rückgängig gemacht werden.</p>
              </div>
            </div>
            
            <div className="bg-zinc-900 rounded-xl p-4 mb-4">
              <p className="text-zinc-300 text-sm mb-2">Folgende Daten werden gelöscht:</p>
              <ul className="text-zinc-500 text-sm space-y-1">
                <li>• Profildaten & Körperdaten</li>
                <li>• Alle Trainingspläne</li>
                <li>• Aktivitäts-Logs & Fortschritt</li>
                <li>• Hochgeladene Dateien</li>
              </ul>
            </div>
            
            <div className="mb-4">
              <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block mb-2">Grund (optional)</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Warum möchtest du deinen Account löschen?"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white text-sm resize-none focus:outline-none focus:border-red-500"
                rows={2}
              />
            </div>
            
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowDeleteConfirm(false)}>
                Abbrechen
              </Button>
              <Button variant="danger" fullWidth onClick={handleRequestDeletion} disabled={deleteLoading}>
                {deleteLoading ? 'Wird eingereicht...' : 'Löschung beantragen'}
              </Button>
            </div>
            
            <p className="text-zinc-600 text-xs text-center mt-4">
              Dein Antrag wird innerhalb von 30 Tagen bearbeitet (Art. 17 DSGVO).
            </p>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="pt-8 pb-12">
          <Button variant="danger" fullWidth onClick={handleLogout} className="h-14 rounded-2xl text-lg flex items-center justify-center gap-2">
              <LogOut size={20} /> {t('nav.logout')}
          </Button>
      </div>
    </div>
  );
};

export default Profile;