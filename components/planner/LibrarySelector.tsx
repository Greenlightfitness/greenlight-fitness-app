import React, { useState, useEffect } from 'react';
import { getPlans } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { TrainingPlan, TrainingWeek, TrainingSession, WorkoutBlock } from '../../types';
import Button from '../Button';
import { Search, X, Plus, Copy, FileText, Calendar, Layers, ChevronRight } from 'lucide-react';

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
    sourcePlanName: string;
    data: any; // Full data object
}

const LibrarySelector: React.FC<LibrarySelectorProps> = ({ mode, isOpen, onClose, onSelect, onCreateNew }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
        setSearchTerm('');
        fetchLibraryContent();
    }
  }, [isOpen, user, mode]);

  const fetchLibraryContent = async () => {
      setLoading(true);
      if(!user) return;
      
      try {
          const plans = await getPlans(user.id);
          let gatheredResults: SearchResult[] = [];

          for (const plan of plans) {
              const planName = plan.name || 'Unnamed Plan';
              const weeks = plan.structure?.weeks || [];

              for (const week of weeks) {
                  // --- WEEK MODE ---
                  if (mode === 'week') {
                      gatheredResults.push({
                          id: week.id,
                          title: week.focus || `Week ${week.order}`,
                          subtitle: `${t('dashboard.week')} ${week.order}`,
                          sourcePlanName: planName,
                          data: { ...week, planId: plan.id }
                      });
                  }

                  // If we need sessions or blocks, drill down
                  if (mode === 'session' || mode === 'block') {
                      const sessions = week.sessions || [];
                      
                      for (const session of sessions) {
                          // --- SESSION MODE ---
                          if (mode === 'session') {
                              gatheredResults.push({
                                  id: session.id,
                                  title: session.title || 'Workout',
                                  subtitle: week.focus || `Week ${week.order}`,
                                  sourcePlanName: planName,
                                  data: session
                              });
                          }

                          // --- BLOCK MODE ---
                          if (mode === 'block' && session.workoutData) {
                              session.workoutData.forEach((block: WorkoutBlock) => {
                                  gatheredResults.push({
                                      id: block.id,
                                      title: block.name,
                                      subtitle: `${session.title || 'Workout'} (${block.exercises?.length || 0} Ex)`,
                                      sourcePlanName: planName,
                                      data: block
                                  });
                              });
                          }
                      }
                  }
              }
          }

          setResults(gatheredResults);

      } catch (error) {
          console.error("Library fetch error:", error);
      } finally {
          setLoading(false);
      }
  };

  const filteredResults = results.filter(r => 
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.sourcePlanName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  const getTitle = () => {
      switch(mode) {
          case 'week': return t('library.searchWeeks');
          case 'session': return t('library.searchSessions');
          case 'block': return t('library.searchBlocks');
      }
  };

  const getIcon = () => {
    switch(mode) {
        case 'week': return <Calendar size={20} className="text-[#00FF00]" />;
        case 'session': return <FileText size={20} className="text-[#00FF00]" />;
        case 'block': return <Layers size={20} className="text-[#00FF00]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl h-[80vh] rounded-lg shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
              {getIcon()}
              <h3 className="text-xl font-bold text-white">{t('library.title')}</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Create New Option */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
            <button 
                onClick={onCreateNew}
                className="w-full flex items-center justify-between p-4 bg-zinc-950 border border-zinc-700 rounded-lg hover:border-[#00FF00] group transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-[#00FF00] group-hover:text-black transition-colors">
                        <Plus size={20} />
                    </div>
                    <div className="text-left">
                        <h4 className="font-bold text-white">{t('library.createNew')}</h4>
                        <p className="text-xs text-zinc-400">{t('library.createNewDesc')}</p>
                    </div>
                </div>
                <ChevronRight size={20} className="text-zinc-600 group-hover:text-white" />
            </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 space-y-2">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{t('library.copyFromLibrary')}</h4>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                    type="text"
                    placeholder={getTitle()}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00] outline-none"
                    autoFocus
                />
            </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 bg-black/20">
            {loading ? (
                <div className="text-center text-zinc-500 py-10">{t('library.loading')}</div>
            ) : filteredResults.length === 0 ? (
                <div className="text-center text-zinc-500 py-10 border-2 border-dashed border-zinc-800 rounded-lg">
                    {t('library.noResults')}
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredResults.map((result) => (
                        <div 
                            key={`${result.sourcePlanName}-${result.id}`}
                            onClick={() => onSelect(result.data)}
                            className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded hover:border-[#00FF00] hover:bg-zinc-800 cursor-pointer transition-colors group"
                        >
                            <div>
                                <h4 className="font-bold text-white group-hover:text-[#00FF00] transition-colors">{result.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                                    <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">{t('library.fromPlan')}: {result.sourcePlanName}</span>
                                    <span>• {result.subtitle}</span>
                                </div>
                            </div>
                            <Button variant="secondary" className="group-hover:bg-[#00FF00] group-hover:text-black">
                                <Copy size={16} className="mr-2" /> {t('library.select')}
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default LibrarySelector;