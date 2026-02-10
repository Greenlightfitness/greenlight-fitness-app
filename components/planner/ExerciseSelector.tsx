import React, { useState, useEffect, useMemo } from 'react';
import { getExercises, createExercise } from '../../services/supabase';
import { Exercise } from '../../types';
import Input from '../Input';
import Button from '../Button';
import { useLanguage } from '../../context/LanguageContext';
import { Search, X, Plus, ChevronRight, Save, Filter } from 'lucide-react';

interface ExerciseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-[#00FF00] text-black',
  Intermediate: 'bg-yellow-500 text-black',
  Advanced: 'bg-red-500 text-white',
};

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const { t } = useLanguage();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');
  
  // Create New Exercise State
  const [isCreating, setIsCreating] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: '',
    category: '',
    difficulty: 'Beginner'
  });

  useEffect(() => {
    if (isOpen) {
      fetchExercises();
      setIsCreating(false);
      setNewExercise({ name: '', category: '', difficulty: 'Beginner' });
      setSearchTerm('');
      setCategoryFilter('ALL');
      setDifficultyFilter('ALL');
    }
  }, [isOpen]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const data = await getExercises();
      const fetched = data.map((e: any) => ({
        id: e.id,
        name: e.name,
        description: e.description,
        category: e.category,
        difficulty: e.difficulty,
        trackingType: e.tracking_type,
        videoUrl: e.video_url,
        thumbnailUrl: e.thumbnail_url,
        defaultSets: e.default_sets,
        defaultVisibleMetrics: e.default_visible_metrics,
        isArchived: e.is_archived,
      } as Exercise));
      setExercises(fetched.filter(ex => !ex.isArchived));
    } catch (error) {
      console.error("Error fetching exercises", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndSelect = async () => {
    if (!newExercise.name || !newExercise.category) return;
    
    setLoading(true);
    try {
        const data = await createExercise({
            name: newExercise.name,
            category: newExercise.category,
            difficulty: newExercise.difficulty,
            description: 'Created from Session Builder',
            is_archived: false,
        });
        
        const createdEx = { id: data.id, name: data.name, category: data.category, difficulty: data.difficulty, description: data.description } as Exercise;
        
        onSelect(createdEx);
        onClose();
    } catch (error) {
        console.error("Error creating exercise", error);
        alert("Could not create exercise.");
    } finally {
        setLoading(false);
    }
  };

  // Extract unique categories from exercises
  const categories = useMemo(() => {
    const cats = new Set(exercises.map(ex => ex.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [exercises]);

  // Semantic search: splits query into words, matches name/category/description/difficulty
  const filteredExercises = useMemo(() => {
    let results = exercises;

    // Category filter
    if (categoryFilter !== 'ALL') {
      results = results.filter(ex => ex.category === categoryFilter);
    }

    // Difficulty filter
    if (difficultyFilter !== 'ALL') {
      results = results.filter(ex => ex.difficulty === difficultyFilter);
    }

    // Semantic text search
    if (searchTerm.trim()) {
      const words = searchTerm.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      results = results
        .map(ex => {
          const nameLower = ex.name.toLowerCase();
          const catLower = (ex.category || '').toLowerCase();
          const descLower = (ex.description || '').toLowerCase();
          const diffLower = (ex.difficulty || '').toLowerCase();
          const haystack = `${nameLower} ${catLower} ${descLower} ${diffLower}`;

          let score = 0;
          const queryLower = searchTerm.toLowerCase();

          // Exact name match → highest
          if (nameLower === queryLower) score += 200;
          else if (nameLower.startsWith(queryLower)) score += 150;
          else if (nameLower.includes(queryLower)) score += 100;

          // Word-level matching
          words.forEach(word => {
            if (nameLower.includes(word)) score += 40;
            if (catLower.includes(word)) score += 20;
            if (descLower.includes(word)) score += 10;
            if (diffLower.includes(word)) score += 5;
          });

          return { ex, score };
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(r => r.ex);
    }

    return results;
  }, [exercises, searchTerm, categoryFilter, difficultyFilter]);

  const activeFilterCount = (categoryFilter !== 'ALL' ? 1 : 0) + (difficultyFilter !== 'ALL' ? 1 : 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#1C1C1E]">
          <h3 className="text-xl font-bold text-white">
            {isCreating ? t('selector.titleCreate') : t('selector.titleSelect')}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Search + Filters */}
        {!isCreating && (
            <div className="border-b border-zinc-800 bg-zinc-900/50">
              {/* Search Input */}
              <div className="p-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input 
                    type="text"
                    placeholder="Übung suchen (Name, Kategorie, Beschreibung...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-10 py-3 text-white focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00] outline-none"
                    autoFocus
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Pills */}
              {categories.length > 0 && (
                <div className="px-4 pb-2">
                  <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                    <button
                      onClick={() => setCategoryFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                        categoryFilter === 'ALL'
                          ? 'bg-white text-black'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                      }`}
                    >
                      Alle
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(categoryFilter === cat ? 'ALL' : cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                          categoryFilter === cat
                            ? 'bg-[#00FF00] text-black'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Difficulty Filter + Create Link */}
              <div className="px-4 pb-3 flex items-center justify-between gap-3">
                <div className="flex gap-1.5">
                  {DIFFICULTY_LEVELS.map(level => (
                    <button
                      key={level}
                      onClick={() => setDifficultyFilter(difficultyFilter === level ? 'ALL' : level)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                        difficultyFilter === level
                          ? DIFFICULTY_COLORS[level]
                          : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                  {activeFilterCount > 0 && (
                    <button
                      onClick={() => { setCategoryFilter('ALL'); setDifficultyFilter('ALL'); }}
                      className="px-2 py-1 text-[10px] text-zinc-500 hover:text-[#00FF00] flex items-center gap-1"
                    >
                      <X size={10} /> Reset
                    </button>
                  )}
                </div>
                <button 
                    onClick={() => { setIsCreating(true); setNewExercise({...newExercise, name: searchTerm}); }}
                    className="text-xs text-[#00FF00] font-medium hover:underline flex items-center gap-1 shrink-0"
                >
                    <Plus size={12} /> {t('selector.createLink')}
                </button>
              </div>
            </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
            
            {isCreating ? (
                <div className="space-y-4 max-w-md mx-auto mt-4">
                    <Input 
                        label={t('editor.name')} 
                        value={newExercise.name}
                        onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                        placeholder="e.g. Barbell Squat"
                        autoFocus
                    />
                    <Input 
                        label={t('editor.category')} 
                        value={newExercise.category}
                        onChange={(e) => setNewExercise({...newExercise, category: e.target.value})}
                        placeholder="e.g. Legs"
                    />
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-zinc-400">{t('editor.difficulty')}</label>
                        <select
                            value={newExercise.difficulty}
                            onChange={(e) => setNewExercise({...newExercise, difficulty: e.target.value})}
                            className="bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2 focus:outline-none focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00]"
                        >
                            <option value="Beginner">{t('editor.beginner')}</option>
                            <option value="Intermediate">{t('editor.intermediate')}</option>
                            <option value="Advanced">{t('editor.advanced')}</option>
                        </select>
                    </div>

                    <div className="pt-4 flex gap-2">
                        <Button variant="secondary" onClick={() => setIsCreating(false)} fullWidth>{t('common.cancel')}</Button>
                        <Button onClick={handleCreateAndSelect} fullWidth disabled={loading || !newExercise.name}>
                            {loading ? t('editor.saving') : t('selector.createBtn')}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                {loading ? (
                    <div className="text-center text-zinc-500 py-10">{t('selector.loading')}</div>
                ) : filteredExercises.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-zinc-500">{t('selector.noExercises')}</p>
                      {(searchTerm || activeFilterCount > 0) && (
                        <button
                          onClick={() => { setSearchTerm(''); setCategoryFilter('ALL'); setDifficultyFilter('ALL'); }}
                          className="mt-2 text-xs text-[#00FF00] hover:underline"
                        >
                          Filter zurücksetzen
                        </button>
                      )}
                    </div>
                ) : (
                    <>
                      <div className="text-[10px] text-zinc-600 mb-2">{filteredExercises.length} Übung{filteredExercises.length !== 1 ? 'en' : ''}</div>
                      {filteredExercises.map((ex) => (
                        <div 
                            key={ex.id}
                            onClick={() => { onSelect(ex); onClose(); }}
                            className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-[#00FF00] hover:bg-zinc-900 cursor-pointer transition-colors group"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex flex-col min-w-0">
                                <h4 className="font-bold text-white group-hover:text-[#00FF00] transition-colors truncate">{ex.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{ex.category}</span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${DIFFICULTY_COLORS[ex.difficulty || 'Beginner'] || 'bg-zinc-700 text-zinc-400'}`}>
                                    {ex.difficulty || 'Beginner'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button className="shrink-0 ml-2 px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold group-hover:bg-[#00FF00] group-hover:text-black transition-colors flex items-center gap-1">
                              <Plus size={14} /> {t('selector.add')}
                            </button>
                        </div>
                      ))}
                    </>
                )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseSelector;