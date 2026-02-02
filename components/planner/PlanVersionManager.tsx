import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Clock, 
  Check, 
  Upload, 
  History,
  Eye,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { 
  getPlanVersions, 
  getCurrentPlanVersion,
  createPlanVersion, 
  publishPlanVersion 
} from '../../services/supabase';

interface PlanVersionManagerProps {
  planId: string;
  planName: string;
  currentStructure: any;
  onVersionChange?: (version: any) => void;
}

export const PlanVersionManager: React.FC<PlanVersionManagerProps> = ({
  planId,
  planName,
  currentStructure,
  onVersionChange,
}) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [currentVersion, setCurrentVersion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVersionNumber, setNewVersionNumber] = useState('');
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [planId]);

  const loadVersions = async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const [allVersions, current] = await Promise.all([
        getPlanVersions(planId),
        getCurrentPlanVersion(planId),
      ]);
      setVersions(allVersions);
      setCurrentVersion(current);
      
      // Suggest next version number
      if (allVersions.length > 0) {
        const latestVersion = allVersions[0].version_number;
        const parts = latestVersion.split('.');
        const minor = parseInt(parts[1] || '0') + 1;
        setNewVersionNumber(`${parts[0]}.${minor}`);
      } else {
        setNewVersionNumber('1.0');
      }
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!newVersionNumber.trim()) return;
    setCreating(true);
    try {
      const newVersion = await createPlanVersion({
        plan_id: planId,
        version_number: newVersionNumber,
        version_notes: newVersionNotes || undefined,
        structure_snapshot: currentStructure,
        is_published: false,
      });
      setVersions(prev => [newVersion, ...prev]);
      setCurrentVersion(newVersion);
      setShowCreateModal(false);
      setNewVersionNotes('');
      
      // Suggest next version
      const parts = newVersionNumber.split('.');
      const minor = parseInt(parts[1] || '0') + 1;
      setNewVersionNumber(`${parts[0]}.${minor}`);
    } catch (error) {
      console.error('Error creating version:', error);
      alert('Fehler beim Erstellen der Version');
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (versionId: string) => {
    if (!confirm('Version veröffentlichen? Athleten können dann diese Version erhalten.')) return;
    setPublishing(versionId);
    try {
      const updated = await publishPlanVersion(versionId);
      setVersions(prev => prev.map(v => v.id === versionId ? updated : v));
    } catch (error) {
      console.error('Error publishing version:', error);
    } finally {
      setPublishing(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-[#00ff94] border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <GitBranch size={20} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Versionsverwaltung</h2>
            <p className="text-sm text-gray-400">
              {planName}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00ff94] text-black rounded-lg font-medium hover:bg-[#00ff94]/90"
        >
          <Sparkles size={16} />
          Neue Version
        </button>
      </div>

      {/* Current Version Badge */}
      {currentVersion && (
        <div className="mx-4 mt-4 p-3 bg-[#00ff94]/10 border border-[#00ff94]/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check size={18} className="text-[#00ff94]" />
            <span className="text-[#00ff94] font-medium">
              Aktuelle Version: v{currentVersion.version_number}
            </span>
          </div>
          {currentVersion.is_published ? (
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
              Veröffentlicht
            </span>
          ) : (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
              Entwurf
            </span>
          )}
        </div>
      )}

      {/* Version List */}
      <div className="p-4 space-y-3">
        {versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History size={40} className="mx-auto mb-2 opacity-50" />
            <p>Noch keine Versionen erstellt</p>
            <p className="text-sm">Erstelle die erste Version deines Plans!</p>
          </div>
        ) : (
          versions.map((version, index) => (
            <div
              key={version.id}
              className={`bg-gray-800 rounded-lg border overflow-hidden transition-all ${
                version.is_current ? 'border-[#00ff94]' : 'border-gray-700'
              }`}
            >
              <div 
                className="p-3 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedVersion(expandedVersion === version.id ? null : version.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    version.is_current ? 'bg-[#00ff94]/20' : 'bg-gray-700'
                  }`}>
                    <GitBranch size={16} className={version.is_current ? 'text-[#00ff94]' : 'text-gray-400'} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">v{version.version_number}</span>
                      {version.is_current && (
                        <span className="text-xs bg-[#00ff94]/20 text-[#00ff94] px-2 py-0.5 rounded">
                          Aktuell
                        </span>
                      )}
                      {version.is_published && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                          Live
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock size={12} />
                      {formatDate(version.created_at)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!version.is_published && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePublish(version.id);
                      }}
                      disabled={publishing === version.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded text-sm hover:bg-purple-500/30"
                    >
                      <Upload size={14} />
                      {publishing === version.id ? '...' : 'Veröffentlichen'}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVersionChange?.(version);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600"
                  >
                    <Eye size={14} />
                    Ansehen
                  </button>
                  {expandedVersion === version.id ? (
                    <ChevronUp size={16} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedVersion === version.id && (
                <div className="border-t border-gray-700 p-3 bg-gray-800/50">
                  {version.version_notes && (
                    <div className="mb-3">
                      <span className="text-xs text-gray-500 uppercase">Änderungen:</span>
                      <p className="text-sm text-gray-300 mt-1">{version.version_notes}</p>
                    </div>
                  )}
                  {version.published_at && (
                    <div className="text-xs text-gray-500">
                      Veröffentlicht am: {formatDate(version.published_at)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Version Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 w-full max-w-md">
            <div className="p-4 border-b border-gray-800">
              <h3 className="text-lg font-semibold text-white">Neue Version erstellen</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Versionsnummer
                </label>
                <input
                  type="text"
                  value={newVersionNumber}
                  onChange={(e) => setNewVersionNumber(e.target.value)}
                  placeholder="z.B. 1.1, 2.0"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00ff94]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Änderungsnotizen (optional)
                </label>
                <textarea
                  value={newVersionNotes}
                  onChange={(e) => setNewVersionNotes(e.target.value)}
                  placeholder="Was wurde geändert?"
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00ff94]/50 resize-none"
                />
              </div>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
                <AlertCircle size={16} className="text-amber-400 mt-0.5" />
                <p className="text-sm text-amber-400">
                  Die aktuelle Plan-Struktur wird als Snapshot gespeichert. 
                  Bestehende Athleten behalten ihre Version.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateVersion}
                disabled={creating || !newVersionNumber.trim()}
                className="px-4 py-2 bg-[#00ff94] text-black rounded-lg font-medium hover:bg-[#00ff94]/90 disabled:opacity-50"
              >
                {creating ? 'Erstelle...' : 'Version erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanVersionManager;
