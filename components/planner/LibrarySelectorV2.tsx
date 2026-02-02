import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  getBlockTemplates,
  getSessionTemplates,
  getWeekTemplates,
  getPlans,
  getWeeksByPlan,
  getSessionsByWeek,
} from '../../services/supabase';
import Button from '../Button';
import { 
  Search, X, Plus, Copy, FileText, Calendar, Layers, 
  ChevronRight, Tag, Sparkles, Clock, Zap 
} from 'lucide-react';

export type LibraryMode = 'week' | 'session' | 'block';

interface LibrarySelectorProps {
  mode: LibraryMode;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
  onCreateNew: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  source: string;
  tags?: string[];
  isTemplate: boolean;
  data: any;
  score: number;
}

const LibrarySelectorV2: React.FC<LibrarySelectorProps> = ({ 
  mode, isOpen, onClose, onSelect, onCreateNew 
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'library'>('templates');

  useEffect(() => {
    if (isOpen && user) {
      setSearchTerm('');
      loadContent();
    }
  }, [isOpen, user, mode]);

  const loadContent = async () => {
    setLoading(true);
    if (!user?.id) return;

    try {
      const gatheredResults: SearchResult[] = [];

      // 1. Load Templates (priority)
      if (mode === 'block') {
        const templates = await getBlockTemplates(user.id);
        templates.forEach((t: any) => {
          gatheredResults.push({
            id: t.id,
            title: t.name,
            subtitle: t.description || 'Block Template',
            source: t.is_system_template ? 'System' : 'Eigene Vorlagen',
            tags: t.tags,
            isTemplate: true,
            data: t.block_data,
            score: t.is_system_template ? 90 : 100,
          });
        });
      } else if (mode === 'session') {
        const templates = await getSessionTemplates(user.id);
        templates.forEach((t: any) => {
          gatheredResults.push({
            id: t.id,
            title: t.name,
            subtitle: t.description || `${t.estimated_duration_min || '?'}min Session`,
            source: t.is_system_template ? 'System' : 'Eigene Vorlagen',
            tags: t.tags,
            isTemplate: true,
            data: t.session_data,
            score: t.is_system_template ? 90 : 100,
          });
        });
      } else if (mode === 'week') {
        const templates = await getWeekTemplates(user.id);
        templates.forEach((t: any) => {
          gatheredResults.push({
            id: t.id,
            title: t.name,
            subtitle: t.focus || t.description || 'Wochen Template',
            source: t.is_system_template ? 'System' : 'Eigene Vorlagen',
            tags: t.tags,
            isTemplate: true,
            data: t.week_data,
            score: t.is_system_template ? 90 : 100,
          });
        });
      }

      // 2. Load from existing plans (library)
      const plans = await getPlans(user.id);
      
      for (const plan of plans) {
        const weeks = await getWeeksByPlan(plan.id);
        
        for (const weekData of weeks) {
          const week = {
            id: weekData.id,
            planId: weekData.plan_id,
            order: weekData.order,
            focus: weekData.focus,
          };

          if (mode === 'week') {
            gatheredResults.push({
              id: week.id,
              title: week.focus || `Woche ${week.order}`,
              subtitle: `Woche ${week.order}`,
              source: plan.name,
              isTemplate: false,
              data: { ...week, planId: plan.id },
              score: 50,
            });
          }

          if (mode === 'session' || mode === 'block') {
            const sessions = await getSessionsByWeek(week.id);
            
            for (const sessionData of sessions) {
              const session = {
                id: sessionData.id,
                weekId: sessionData.week_id,
                dayOfWeek: sessionData.day_of_week,
                title: sessionData.title,
                description: sessionData.description,
                order: sessionData.order,
                workoutData: sessionData.workout_data,
              };

              if (mode === 'session') {
                gatheredResults.push({
                  id: session.id,
                  title: session.title,
                  subtitle: week.focus || `Woche ${week.order}`,
                  source: plan.name,
                  isTemplate: false,
                  data: session,
                  score: 40,
                });
              }

              if (mode === 'block' && session.workoutData) {
                session.workoutData.forEach((block: any) => {
                  gatheredResults.push({
                    id: block.id,
                    title: block.name,
                    subtitle: `${session.title} (${block.exercises?.length || 0} Übungen)`,
                    source: plan.name,
                    isTemplate: false,
                    data: block,
                    score: 30,
                  });
                });
              }
            }
          }
        }
      }

      // Sort by score (templates first)
      gatheredResults.sort((a, b) => b.score - a.score);
      setResults(gatheredResults);
    } catch (error) {
      console.error('Library fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Semantic search
  const searchResults = (items: SearchResult[], query: string): SearchResult[] => {
    if (!query.trim()) return items;
    
    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/).filter(w => w.length > 1);

    return items.map(item => {
      let score = item.score;
      const titleLower = item.title.toLowerCase();
      const subtitleLower = item.subtitle.toLowerCase();
      const tagsLower = item.tags?.map(t => t.toLowerCase()) || [];

      // Exact match
      if (titleLower === queryLower) score += 100;
      else if (titleLower.startsWith(queryLower)) score += 80;
      else if (titleLower.includes(queryLower)) score += 60;

      // Word matching
      words.forEach(word => {
        if (titleLower.includes(word)) score += 30;
        if (subtitleLower.includes(word)) score += 15;
        if (tagsLower.some(tag => tag.includes(word))) score += 25;
      });

      return { ...item, score };
    }).filter(item => item.score > (item.isTemplate ? 90 : 30))
      .sort((a, b) => b.score - a.score);
  };

  const filteredResults = searchResults(
    results.filter(r => activeTab === 'templates' ? r.isTemplate : !r.isTemplate),
    searchTerm
  );

  const templateCount = results.filter(r => r.isTemplate).length;
  const libraryCount = results.filter(r => !r.isTemplate).length;

  if (!isOpen) return null;

  const getIcon = () => {
    switch (mode) {
      case 'week': return <Calendar size={20} className="text-[#00FF00]" />;
      case 'session': return <FileText size={20} className="text-[#00FF00]" />;
      case 'block': return <Layers size={20} className="text-[#00FF00]" />;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'week': return 'Woche';
      case 'session': return 'Session';
      case 'block': return 'Block';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#1a1a1a] border border-gray-700 w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#1a1a1a]">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <h3 className="text-lg font-bold text-white">{getModeLabel()} hinzufügen</h3>
              <p className="text-xs text-gray-500">Vorlage wählen oder neu erstellen</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Create New Option */}
        <div className="p-4 border-b border-gray-800">
          <button
            onClick={onCreateNew}
            className="w-full flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-[#00FF00] group transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#00FF00]/20 flex items-center justify-center group-hover:bg-[#00FF00] group-hover:text-black transition-colors">
                <Zap size={24} className="text-[#00FF00] group-hover:text-black" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-white group-hover:text-[#00FF00]">
                  Neu erstellen
                </h4>
                <p className="text-sm text-gray-500">
                  Leeren {getModeLabel()} von Grund auf erstellen
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-600 group-hover:text-[#00FF00]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'templates'
                ? 'text-[#00FF00] border-b-2 border-[#00FF00] bg-[#00FF00]/5'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles size={16} />
            Vorlagen
            <span className="px-2 py-0.5 bg-gray-800 rounded text-xs">{templateCount}</span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'library'
                ? 'text-[#00FF00] border-b-2 border-[#00FF00] bg-[#00FF00]/5'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Copy size={16} />
            Aus Plänen
            <span className="px-2 py-0.5 bg-gray-800 rounded text-xs">{libraryCount}</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-800 bg-gray-900/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder={`${getModeLabel()} suchen... (Name, Tags, Beschreibung)`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00] outline-none"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="animate-spin w-8 h-8 border-2 border-[#00FF00] border-t-transparent rounded-full mb-3"></div>
              Lade Bibliothek...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-xl">
              <Search size={40} className="mx-auto mb-3 text-gray-700" />
              <p className="text-gray-500">
                {searchTerm 
                  ? `Keine Ergebnisse für "${searchTerm}"` 
                  : `Keine ${activeTab === 'templates' ? 'Vorlagen' : 'Einträge'} vorhanden`
                }
              </p>
              <button
                onClick={onCreateNew}
                className="mt-4 text-[#00FF00] text-sm hover:underline"
              >
                Neuen {getModeLabel()} erstellen →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredResults.map((result) => (
                <div
                  key={`${result.source}-${result.id}`}
                  onClick={() => onSelect(result.data)}
                  className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-[#00FF00] hover:bg-gray-800/80 cursor-pointer transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white group-hover:text-[#00FF00] truncate">
                        {result.title}
                      </h4>
                      {result.isTemplate && (
                        <span className="text-[9px] bg-[#00FF00]/20 text-[#00FF00] px-2 py-0.5 rounded-full font-bold">
                          VORLAGE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span className="bg-gray-900 px-2 py-0.5 rounded border border-gray-700">
                        {result.source}
                      </span>
                      <span>• {result.subtitle}</span>
                    </div>
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.tags.slice(0, 4).map(tag => (
                          <span key={tag} className="flex items-center gap-1 text-[10px] bg-gray-700 text-gray-400 px-2 py-0.5 rounded">
                            <Tag size={8} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="ml-4 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg group-hover:bg-[#00FF00] group-hover:text-black font-medium text-sm transition-colors flex items-center gap-2">
                    <Copy size={14} />
                    Verwenden
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800 bg-gray-900/50 flex items-center justify-between text-xs text-gray-500">
          <span>
            {filteredResults.length} von {results.length} Einträgen
          </span>
          <span className="flex items-center gap-1">
            <Sparkles size={12} className="text-[#00FF00]" />
            Semantische Suche aktiv
          </span>
        </div>
      </div>
    </div>
  );
};

export default LibrarySelectorV2;
