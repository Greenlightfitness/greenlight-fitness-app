import React, { useState, useEffect } from 'react';
import { getExercises, createExercise } from '../../services/supabase';
import { Exercise } from '../../types';
import Input from '../Input';
import Button from '../Button';
import { useLanguage } from '../../context/LanguageContext';
import { Search, X, Plus, ChevronRight, Save } from 'lucide-react';

interface ExerciseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const { t } = useLanguage();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ex.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl h-[80vh] rounded-lg shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-xl font-bold text-white">
            {isCreating ? t('selector.titleCreate') : t('selector.titleSelect')}
          </h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Mode Switch / Search */}
        {!isCreating && (
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 space-y-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                type="text"
                placeholder={t('selector.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-white focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00] outline-none"
                autoFocus
                />
            </div>
            <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">{t('selector.cantFind')}</span>
                <button 
                    onClick={() => { setIsCreating(true); setNewExercise({...newExercise, name: searchTerm}); }}
                    className="text-sm text-[#00FF00] font-medium hover:underline flex items-center gap-1"
                >
                    <Plus size={14} /> {t('selector.createLink')}
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
                    <div className="text-center text-zinc-500 py-10">{t('selector.noExercises')}</div>
                ) : (
                    filteredExercises.map((ex) => (
                    <div 
                        key={ex.id}
                        onClick={() => { onSelect(ex); onClose(); }}
                        className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded hover:border-[#00FF00] hover:bg-zinc-900 cursor-pointer transition-colors group"
                    >
                        <div>
                        <h4 className="font-bold text-white group-hover:text-[#00FF00] transition-colors">{ex.name}</h4>
                        <p className="text-xs text-zinc-500">{ex.category} • {ex.difficulty}</p>
                        </div>
                        <Button variant="secondary" className="group-hover:bg-[#00FF00] group-hover:text-black">
                        <Plus size={16} /> {t('selector.add')}
                        </Button>
                    </div>
                    ))
                )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseSelector;