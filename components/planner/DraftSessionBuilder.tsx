import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getExerciseById } from '../../services/supabase';
import { WorkoutBlock, WorkoutExercise, WorkoutSet, BlockType, Exercise } from '../../types';
import Button from '../Button';
import ExerciseSelector from './ExerciseSelector';
import ExerciseEditorModal from '../ExerciseEditorModal';
import ConfirmationModal from '../ConfirmationModal';
import LibrarySelectorV2 from './LibrarySelectorV2';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, Save, Plus, GripVertical, Trash2, 
  ChevronDown, ChevronUp, Layers, Repeat, Link, Pencil
} from 'lucide-react';

interface DraftSessionBuilderProps {
  session: { id: string; title: string; description: string; workoutData: WorkoutBlock[] };
  onClose: () => void;
  onSave: (updated: { title: string; description: string; workoutData: WorkoutBlock[] }) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const DraftSessionBuilder: React.FC<DraftSessionBuilderProps> = ({ session, onClose, onSave }) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState(session.title);
  const [description, setDescription] = useState(session.description || '');
  
  const [workoutData, setWorkoutData] = useState<WorkoutBlock[]>(() => {
    const raw = session.workoutData ? JSON.parse(JSON.stringify(session.workoutData)) : [];
    // Normalize blocks to ensure they have required properties
    return raw.map((block: any, i: number) => ({
      ...block,
      id: block.id || generateId(),
      name: block.name || `Block ${String.fromCharCode(65 + i)}`,
      type: block.type === 'NORMAL' ? 'Normal' : (block.type || 'Normal'),
      exercises: (block.exercises || []).map((ex: any) => ({
        ...ex,
        id: ex.id || generateId(),
        name: ex.name || ex.exerciseName || 'Übung',
        exerciseId: ex.exerciseId || ex.exercise_id || '',
        visibleMetrics: ex.visibleMetrics || ['reps', 'weight', 'rpe'],
        sets: (ex.sets || []).map((s: any) => ({
          ...s,
          id: s.id || generateId(),
          type: s.type || 'Normal',
        })),
      })),
    }));
  });
  
  const [isExerciseSelectorOpen, setIsExerciseSelectorOpen] = useState(false);
  const [targetBlockId, setTargetBlockId] = useState<string | null>(null);
  const [targetInsertionIndex, setTargetInsertionIndex] = useState<number | undefined>(undefined);
  
  const [isExerciseEditorOpen, setIsExerciseEditorOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [blockInsertIndex, setBlockInsertIndex] = useState<number | undefined>(undefined);

  const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null);
  const [draggedExercise, setDraggedExercise] = useState<{blockId: string, index: number} | null>(null);

  const [openHeaderMenu, setOpenHeaderMenu] = useState<{blockId: string, exerciseId: string, colIndex: number} | null>(null);

  const [saving, setSaving] = useState(false);

  const [deleteData, setDeleteData] = useState<{
    type: 'block' | 'exercise';
    blockId: string;
    exerciseId?: string;
  } | null>(null);

  const METRIC_OPTIONS = [
    { key: 'reps', label: t('editor.metric_reps') },
    { key: 'weight', label: t('editor.metric_weight') },
    { key: 'pct_1rm', label: t('editor.metric_pct_1rm') },
    { key: 'rpe', label: t('editor.metric_rpe') },
    { key: 'distance', label: t('editor.metric_distance') },
    { key: 'time', label: t('editor.metric_time') },
    { key: 'tempo', label: t('editor.metric_tempo') },
  ];

  // --- BLOCK ACTIONS ---
  const openBlockSelector = (index?: number) => {
      setBlockInsertIndex(index);
      setIsLibraryOpen(true);
  };

  const handleCreateNewBlock = () => {
    const newBlock: WorkoutBlock = {
      id: generateId(),
      name: `Block ${String.fromCharCode(65 + workoutData.length)}`, 
      type: 'Normal',
      exercises: []
    };
    if (typeof blockInsertIndex === 'number') {
        const updated = [...workoutData];
        updated.splice(blockInsertIndex, 0, newBlock);
        setWorkoutData(updated);
    } else {
        setWorkoutData([...workoutData, newBlock]);
    }
    setIsLibraryOpen(false);
  };

  const handleImportBlock = (blockData: any) => {
      const newBlock: WorkoutBlock = {
          ...blockData,
          id: generateId(),
          exercises: blockData.exercises.map((ex: any) => ({
              ...ex,
              id: generateId(),
              sets: ex.sets.map((s: any) => ({ ...s, id: generateId() }))
          }))
      };
      if (typeof blockInsertIndex === 'number') {
        const updated = [...workoutData];
        updated.splice(blockInsertIndex, 0, newBlock);
        setWorkoutData(updated);
    } else {
        setWorkoutData([...workoutData, newBlock]);
    }
    setIsLibraryOpen(false);
  };

  const updateBlockName = (blockId: string, name: string) => {
    setWorkoutData(workoutData.map(b => b.id === blockId ? { ...b, name } : b));
  };

  const confirmDeleteBlock = () => {
    if (!deleteData || deleteData.type !== 'block') return;
    setWorkoutData(workoutData.filter(b => b.id !== deleteData.blockId));
    setDeleteData(null);
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= workoutData.length) return;
    const updated = [...workoutData];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setWorkoutData(updated);
  };

  const updateBlockType = (blockId: string, type: BlockType) => {
    setWorkoutData(workoutData.map(b => b.id === blockId ? { ...b, type } : b));
  };

  const updateBlockMeta = (blockId: string, field: 'rounds' | 'restBetweenRounds', value: string) => {
    setWorkoutData(workoutData.map(b => b.id === blockId ? { ...b, [field]: value } : b));
  };

  // --- EXERCISE ACTIONS ---
  const openExerciseSelector = (blockId: string, index?: number) => {
    setTargetBlockId(blockId);
    setTargetInsertionIndex(index);
    setIsExerciseSelectorOpen(true);
  };

  const handleExerciseSelect = (ex: Exercise) => {
    if (!targetBlockId) return;
    setWorkoutData(workoutData.map(block => {
      if (block.id !== targetBlockId) return block;
      const initialSets: WorkoutSet[] = (ex.defaultSets && ex.defaultSets.length > 0) 
        ? ex.defaultSets.map(s => ({ ...s, id: generateId() }))
        : Array(3).fill(null).map(() => ({
            id: generateId(),
            type: 'Normal',
            reps: '',
            weight: '',
            pct_1rm: '',
            rpe: '',
            rest: ''
          }));
      const visibleMetrics = (ex.defaultVisibleMetrics as any) || ['reps', 'weight', 'rpe'];
      const newExercise: WorkoutExercise = {
        id: generateId(),
        exerciseId: ex.id,
        name: ex.name,
        videoUrl: ex.videoUrl,
        visibleMetrics,
        sets: initialSets
      };
      let updatedExercises = [...block.exercises];
      if (typeof targetInsertionIndex === 'number') {
        updatedExercises.splice(targetInsertionIndex, 0, newExercise);
      } else {
        updatedExercises.push(newExercise);
      }
      return { ...block, exercises: updatedExercises };
    }));
  };

  const openExerciseEditor = async (exerciseId: string) => {
    try {
        const exercise = await getExerciseById(exerciseId);
        if (exercise) {
            setExerciseToEdit(exercise);
            setIsExerciseEditorOpen(true);
        }
    } catch (error) {
        console.error("Error fetching exercise details:", error);
    }
  };

  const confirmDeleteExercise = () => {
    if (!deleteData || deleteData.type !== 'exercise' || !deleteData.exerciseId) return;
    setWorkoutData(workoutData.map(block => {
      if (block.id !== deleteData.blockId) return block;
      return { ...block, exercises: block.exercises.filter(e => e.id !== deleteData.exerciseId) };
    }));
    setDeleteData(null);
  };

  const moveExercise = (blockId: string, fromIndex: number, toIndex: number) => {
    setWorkoutData(workoutData.map(block => {
      if (block.id !== blockId) return block;
      const updatedEx = [...block.exercises];
      if (toIndex < 0 || toIndex >= updatedEx.length) return block;
      const [moved] = updatedEx.splice(fromIndex, 1);
      updatedEx.splice(toIndex, 0, moved);
      return { ...block, exercises: updatedEx };
    }));
  };

  const handleExerciseDragStart = (e: React.DragEvent, blockId: string, index: number) => {
      e.stopPropagation();
      setDraggedExercise({ blockId, index });
  };

  const handleExerciseDrop = (e: React.DragEvent, targetBlockId: string, targetIndex: number) => {
      e.preventDefault();
      e.stopPropagation();
      if (!draggedExercise) return;
      if (draggedExercise.blockId !== targetBlockId) return;
      if (draggedExercise.index === targetIndex) return;
      moveExercise(targetBlockId, draggedExercise.index, targetIndex);
      setDraggedExercise(null);
  };

  const updateExerciseNotes = (blockId: string, exerciseId: string, notes: string) => {
    setWorkoutData(workoutData.map(block => {
      if (block.id !== blockId) return block;
      return { ...block, exercises: block.exercises.map(ex => ex.id === exerciseId ? { ...ex, notes } : ex) };
    }));
  };

  const changeMetricColumn = (blockId: string, exerciseId: string, colIndex: number, newMetricKey: any) => {
    setWorkoutData(workoutData.map(block => {
      if (block.id !== blockId) return block;
      return {
        ...block,
        exercises: block.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          const newMetrics = [...(ex.visibleMetrics || ['reps', 'weight', 'rpe'])];
          newMetrics[colIndex] = newMetricKey;
          return { ...ex, visibleMetrics: newMetrics };
        })
      };
    }));
    setOpenHeaderMenu(null);
  };

  // --- SET ACTIONS ---
  const addSet = (blockId: string, exerciseId: string) => {
    setWorkoutData(workoutData.map(block => {
      if (block.id !== blockId) return block;
      return {
        ...block,
        exercises: block.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          const lastSet = ex.sets[ex.sets.length - 1];
          const newSet: WorkoutSet = lastSet 
            ? { ...lastSet, id: generateId() } 
            : { id: generateId(), type: 'Normal' };
          return { ...ex, sets: [...ex.sets, newSet] };
        })
      };
    }));
  };

  const removeSet = (blockId: string, exerciseId: string, setId: string) => {
    setWorkoutData(workoutData.map(block => {
      if (block.id !== blockId) return block;
      return {
        ...block,
        exercises: block.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
        })
      };
    }));
  };

  const updateSet = (blockId: string, exerciseId: string, setId: string, field: keyof WorkoutSet, value: string) => {
    setWorkoutData(workoutData.map(block => {
      if (block.id !== blockId) return block;
      return {
        ...block,
        exercises: block.exercises.map(ex => {
          if (ex.id !== exerciseId) return ex;
          return { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) };
        })
      };
    }));
  };

  // --- SAVE ---
  const handleSave = () => {
    setSaving(true);
    const cleanedWorkoutData = JSON.parse(JSON.stringify(workoutData));
    onSave({ title, description, workoutData: cleanedWorkoutData });
    setSaving(false);
  };

  const content = (
    <div className="fixed inset-0 z-[60] bg-[#121212] flex flex-col animate-in fade-in duration-200">
      
      <ConfirmationModal 
        isOpen={!!deleteData}
        title={deleteData?.type === 'block' ? "Block löschen?" : "Übung löschen?"}
        message={t('common.yesDeletePerm')}
        isDangerous
        onConfirm={deleteData?.type === 'block' ? confirmDeleteBlock : confirmDeleteExercise}
        onCancel={() => setDeleteData(null)}
      />

      <LibrarySelectorV2 
          mode="block"
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          onSelect={handleImportBlock}
          onCreateNew={handleCreateNewBlock}
      />

      <ExerciseEditorModal 
         isOpen={isExerciseEditorOpen}
         onClose={() => setIsExerciseEditorOpen(false)}
         exerciseToEdit={exerciseToEdit}
         onSave={() => {}}
      />

      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 safe-area-top">
        <div className="flex items-center gap-4 w-full">
          <Button variant="secondary" onClick={onClose} className="shrink-0">
            <X size={20} />
          </Button>
          <div className="flex flex-col flex-1">
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent text-white font-bold text-xl focus:outline-none placeholder-zinc-600 w-full"
              placeholder={t('planner.sessionTitle')}
            />
             <span className="text-xs text-zinc-500">{t('planner.advancedBuilder')}</span>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 w-full md:w-auto justify-center">
          <Save size={18} /> {saving ? t('planner.saving') : t('planner.saveSession')}
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-5xl mx-auto w-full safe-area-bottom" onClick={() => setOpenHeaderMenu(null)}>
        
        {workoutData.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-zinc-800 rounded-lg">
            <h3 className="text-zinc-400 text-lg font-medium mb-2">{t('planner.emptySession')}</h3>
            <p className="text-zinc-500 mb-6">{t('planner.startCreating')}</p>
            <Button onClick={() => openBlockSelector()}>{t('planner.addBlock')} A</Button>
          </div>
        )}

        {workoutData.map((block, bIndex) => {
            const isCircuit = block.type === 'Circuit';
            const isSuperset = block.type === 'Superset';
            
            return (
                <div key={block.id} className="relative group/block-wrapper">
                    
                    {/* Block Insert Zone Above */}
                    <div className="h-4 -mt-6 mb-2 relative group/insert-block z-10 flex items-center justify-center">
                        <div className="absolute inset-x-0 h-[1px] bg-[#00FF00] opacity-0 group-hover/insert-block:opacity-50 transition-opacity"></div>
                        <button 
                            onClick={() => openBlockSelector(bIndex)} 
                            className="bg-zinc-900 border border-[#00FF00] text-[#00FF00] rounded-full p-1 opacity-0 group-hover/insert-block:opacity-100 transition-opacity transform scale-75 hover:scale-100"
                            title={t('planner.insertBlock')}
                        >
                            <Plus size={16} />
                        </button>
                    </div>

                    <div 
                        className={`
                            rounded-lg overflow-hidden relative transition-all
                            ${isCircuit 
                                ? 'bg-zinc-900 border-2 border-orange-500/20' 
                                : 'bg-zinc-900 border border-zinc-800'
                            }
                        `}
                        draggable
                        onDragStart={(e) => {
                             if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') {
                                 e.preventDefault();
                                 return;
                             }
                             setDraggedBlockIndex(bIndex);
                             e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            if (draggedBlockIndex !== null && draggedBlockIndex !== bIndex) {
                                moveBlock(draggedBlockIndex, bIndex);
                                setDraggedBlockIndex(null);
                            }
                        }}
                    >
                        {/* Block Header */}
                        <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3
                            ${isCircuit ? 'bg-orange-950/20 border-orange-500/20' : 'bg-zinc-950 border-zinc-800'}
                        `}>
                            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-[200px] flex-wrap">
                                <div className="flex flex-col gap-1 mr-2">
                                     <button onClick={() => moveBlock(bIndex, bIndex - 1)} disabled={bIndex === 0} className="text-zinc-600 hover:text-white disabled:opacity-30">
                                         <ChevronUp size={14} />
                                     </button>
                                     <button onClick={() => moveBlock(bIndex, bIndex + 1)} disabled={bIndex === workoutData.length - 1} className="text-zinc-600 hover:text-white disabled:opacity-30">
                                         <ChevronDown size={14} />
                                     </button>
                                </div>
                                <div className="cursor-grab text-zinc-600 hover:text-white" title="Drag to reorder block">
                                    <GripVertical size={20} />
                                </div>
                                
                                <div className="flex items-center gap-3 flex-1 flex-wrap">
                                    <div className="flex items-baseline gap-2">
                                        <span className={`text-sm font-bold uppercase tracking-wider ${isCircuit ? 'text-orange-400' : 'text-[#00FF00]'}`}>
                                            {t('planner.block')}
                                        </span>
                                        <input
                                            className={`font-bold text-lg bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-[#00FF00] focus:outline-none transition-all px-1 w-full max-w-[150px]
                                                ${isCircuit ? 'text-orange-400' : 'text-[#00FF00]'}
                                            `}
                                            value={block.name}
                                            onChange={(e) => updateBlockName(block.id, e.target.value)}
                                            placeholder="Name"
                                        />
                                    </div>
                                    
                                    <div className="relative">
                                        <select
                                            value={block.type || 'Normal'}
                                            onChange={(e) => updateBlockType(block.id, e.target.value as BlockType)}
                                            className={`
                                                appearance-none pl-8 pr-8 py-1 rounded text-sm font-medium focus:outline-none cursor-pointer border w-full sm:w-auto
                                                ${block.type === 'Normal' ? 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white' : ''}
                                                ${block.type === 'Superset' ? 'bg-[#00FF00]/10 border-[#00FF00]/30 text-[#00FF00]' : ''}
                                                ${block.type === 'Circuit' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : ''}
                                            `}
                                        >
                                            <option value="Normal">{t('planner.type_straight')}</option>
                                            <option value="Superset">{t('planner.type_superset')}</option>
                                            <option value="Circuit">{t('planner.type_circuit')}</option>
                                        </select>
                                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-current pointer-events-none opacity-70" />
                                    </div>
                                </div>

                                {isCircuit && (
                                    <div className="flex items-center gap-2 ml-2 border-l border-zinc-700 pl-4 animate-in fade-in slide-in-from-left-2 w-full sm:w-auto mt-2 sm:mt-0">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-zinc-500 font-medium whitespace-nowrap">{t('planner.rounds')}</label>
                                            <input className="w-12 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-center text-white focus:border-orange-500 outline-none"
                                                value={block.rounds || ''} onChange={(e) => updateBlockMeta(block.id, 'rounds', e.target.value)} placeholder="3" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs text-zinc-500 font-medium whitespace-nowrap">{t('planner.rest')}</label>
                                            <input className="w-16 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-center text-white focus:border-orange-500 outline-none"
                                                value={block.restBetweenRounds || ''} onChange={(e) => updateBlockMeta(block.id, 'restBetweenRounds', e.target.value)} placeholder="90s" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
                                <button onClick={() => openExerciseSelector(block.id)} 
                                    className="flex-1 sm:flex-none justify-center px-3 py-1.5 bg-zinc-800 hover:bg-[#00FF00] hover:text-black text-zinc-300 rounded text-sm font-medium flex items-center gap-1 transition-colors">
                                    <Plus size={16} /> <span>{t('planner.addExercise')}</span>
                                </button>
                                <button onClick={() => setDeleteData({ type: 'block', blockId: block.id })}
                                    className="p-2 text-zinc-600 hover:text-red-500 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Exercises Container */}
                        <div className={`divide-y divide-zinc-800 p-2 ${isSuperset ? 'border-l-4 border-[#00FF00]/50 ml-0 pl-0' : ''}`}>
                            {block.exercises.length === 0 ? (
                                <div className="p-8 text-center text-zinc-600 text-sm">
                                    {t('planner.noExercisesInBlock')}
                                </div>
                            ) : (
                                block.exercises.map((exercise, eIndex) => {
                                    const visibleMetrics = exercise.visibleMetrics || ['reps', 'weight', 'rpe'];
                                    
                                    return (
                                        <div key={exercise.id} className="relative">
                                            {eIndex > 0 && (
                                                <div className="h-2 -mt-1 -mb-1 relative z-20 group/insert-ex flex items-center justify-center">
                                                    <div className="absolute inset-x-4 h-[2px] bg-[#00FF00] opacity-0 group-hover/insert-ex:opacity-30 transition-opacity"></div>
                                                    <button onClick={() => openExerciseSelector(block.id, eIndex)}
                                                        className="bg-zinc-900 border border-[#00FF00] text-[#00FF00] rounded-full p-0.5 opacity-0 group-hover/insert-ex:opacity-100 transition-opacity transform scale-75 hover:scale-100 shadow-lg"
                                                        title={t('planner.insertExercise')}>
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                            )}

                                            <div 
                                                className={`p-4 transition-colors relative
                                                    ${isSuperset ? 'bg-zinc-900/50 hover:bg-zinc-900 ml-1' : 'bg-zinc-900'}
                                                    ${isCircuit ? 'hover:bg-orange-500/5' : ''}
                                                    ${draggedExercise?.index === eIndex && draggedExercise?.blockId === block.id ? 'opacity-30' : ''}
                                                `}
                                                draggable
                                                onDragStart={(e) => handleExerciseDragStart(e, block.id, eIndex)}
                                                onDragOver={(e) => e.preventDefault()}
                                                onDrop={(e) => handleExerciseDrop(e, block.id, eIndex)}
                                            >
                                                {isSuperset && eIndex < block.exercises.length - 1 && (
                                                    <div className="absolute -left-[3px] top-[50%] bottom-[-50%] w-[2px] bg-[#00FF00]/20 z-0"></div>
                                                )}

                                                {/* Exercise Header */}
                                                <div className="flex items-start justify-between mb-4 relative z-10 flex-wrap gap-2">
                                                    <div className="flex items-center gap-3 w-full">
                                                        <div className="flex flex-col gap-1">
                                                            <button onClick={() => moveExercise(block.id, eIndex, eIndex - 1)} disabled={eIndex === 0} className="text-zinc-700 hover:text-white disabled:opacity-0 disabled:pointer-events-none"><ChevronUp size={16} /></button>
                                                            <button onClick={() => moveExercise(block.id, eIndex, eIndex + 1)} disabled={eIndex === block.exercises.length - 1} className="text-zinc-700 hover:text-white disabled:opacity-0 disabled:pointer-events-none"><ChevronDown size={16} /></button>
                                                        </div>
                                                        
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 cursor-grab
                                                            ${isCircuit ? 'bg-orange-500/10 text-orange-500' : ''}
                                                            ${isSuperset ? 'bg-[#00FF00]/10 text-[#00FF00]' : ''}
                                                            ${!isCircuit && !isSuperset ? 'bg-zinc-800 text-zinc-400' : ''}
                                                        `}>
                                                            {block.name.charAt(0)}
                                                        </div>

                                                        <div className="flex-1 min-w-[150px]">
                                                            <div className="flex items-center gap-2 group/title">
                                                                <h4 className="font-bold text-white text-lg flex items-center gap-2 leading-tight">{exercise.name}</h4>
                                                                <button onClick={() => openExerciseEditor(exercise.exerciseId)}
                                                                    className="text-zinc-600 hover:text-[#00FF00] opacity-0 group-hover/title:opacity-100 transition-opacity" title={t('editor.editDetails')}>
                                                                    <Pencil size={14} />
                                                                </button>
                                                            </div>
                                                            <input className="bg-transparent text-sm text-zinc-400 placeholder-zinc-700 w-full focus:outline-none focus:text-white mt-1 border-b border-transparent focus:border-zinc-700 transition-all pb-1"
                                                                placeholder={t('planner.notesPlaceholder')} value={exercise.notes || ''}
                                                                onChange={(e) => updateExerciseNotes(block.id, exercise.id, e.target.value)} />
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-2 ml-auto">
                                                            <button onClick={() => setDeleteData({ type: 'exercise', blockId: block.id, exerciseId: exercise.id })}
                                                                className="p-2 text-zinc-500 hover:text-red-500"><X size={18} /></button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Sets Table */}
                                                <div className="w-full overflow-x-auto pb-2">
                                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                                        <thead>
                                                            <tr className="text-xs text-zinc-500 border-b border-zinc-800">
                                                                <th className="p-2 w-10 text-center">#</th>
                                                                <th className="p-2 w-28">Type</th>
                                                                
                                                                {visibleMetrics.map((metricKey: any, colIndex) => {
                                                                    const metricDef = METRIC_OPTIONS.find(m => m.key === metricKey) || { label: metricKey };
                                                                    return (
                                                                        <th key={colIndex} className="p-2 relative">
                                                                            <button onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setOpenHeaderMenu(
                                                                                        openHeaderMenu?.colIndex === colIndex && openHeaderMenu?.exerciseId === exercise.id 
                                                                                        ? null : { blockId: block.id, exerciseId: exercise.id, colIndex }
                                                                                    );
                                                                                }}
                                                                                className="flex items-center gap-1 hover:text-white transition-colors">
                                                                                {metricDef.label} <ChevronDown size={10} />
                                                                            </button>
                                                                            
                                                                            {openHeaderMenu?.blockId === block.id && 
                                                                             openHeaderMenu?.exerciseId === exercise.id && 
                                                                             openHeaderMenu?.colIndex === colIndex && (
                                                                                <div className="absolute top-full left-0 mt-1 w-32 bg-zinc-900 border border-zinc-700 rounded shadow-xl z-30 py-1">
                                                                                    {METRIC_OPTIONS.map(opt => (
                                                                                        <button key={opt.key} onClick={(e) => { e.stopPropagation(); changeMetricColumn(block.id, exercise.id, colIndex, opt.key); }}
                                                                                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-800 ${metricKey === opt.key ? 'text-[#00FF00]' : 'text-zinc-300'}`}>
                                                                                            {opt.label}
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </th>
                                                                    );
                                                                })}

                                                                <th className="p-2">{t('planner.rest')}</th>
                                                                <th className="p-2 w-8"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="text-sm">
                                                            {exercise.sets.map((set, sIndex) => (
                                                                <tr key={set.id} className="group/row hover:bg-zinc-800/30 transition-colors">
                                                                    <td className="p-2 text-center text-zinc-500 font-mono">{sIndex + 1}</td>
                                                                    <td className="p-2">
                                                                        <select value={set.type} onChange={(e) => updateSet(block.id, exercise.id, set.id, 'type', e.target.value)}
                                                                            className={`bg-transparent border-none focus:ring-0 text-xs font-medium cursor-pointer ${
                                                                                set.type === 'Warmup' ? 'text-yellow-500' :
                                                                                set.type === 'Dropset' ? 'text-red-400' :
                                                                                set.type === 'AMRAP' ? 'text-[#00FF00]' : 'text-zinc-300'
                                                                            }`}>
                                                                            <option value="Normal">{t('editor.type_normal')}</option>
                                                                            <option value="Warmup">{t('editor.type_warmup')}</option>
                                                                            <option value="Dropset">{t('editor.type_dropset')}</option>
                                                                            <option value="AMRAP">{t('editor.type_amrap')}</option>
                                                                        </select>
                                                                    </td>
                                                                    
                                                                    {visibleMetrics.map((metricKey: any, idx) => (
                                                                        <td key={idx} className="p-2">
                                                                            <input className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 w-20 text-center text-white focus:border-[#00FF00] outline-none" 
                                                                                value={(set as any)[metricKey] || ''} 
                                                                                onChange={(e) => updateSet(block.id, exercise.id, set.id, metricKey, e.target.value)} 
                                                                                placeholder="-" />
                                                                        </td>
                                                                    ))}

                                                                    <td className="p-2">
                                                                        <input className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 w-16 text-center text-zinc-300 focus:border-[#00FF00] outline-none" 
                                                                            value={set.rest || ''} onChange={(e) => updateSet(block.id, exercise.id, set.id, 'rest', e.target.value)} placeholder="s" />
                                                                    </td>
                                                                    <td className="p-2 text-right">
                                                                        <button onClick={() => removeSet(block.id, exercise.id, set.id)} className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <X size={14} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <button onClick={() => addSet(block.id, exercise.id)}
                                                    className="mt-2 text-xs font-medium text-zinc-500 hover:text-[#00FF00] flex items-center gap-1 transition-colors">
                                                    <Plus size={14} /> {t('planner.addSet')}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            );
        })}

        <Button onClick={() => openBlockSelector()} variant="secondary" fullWidth className="py-4 border-2 border-dashed border-zinc-800 bg-transparent hover:border-[#00FF00] hover:text-[#00FF00] flex items-center justify-center gap-2">
          <Plus size={20} /> {t('planner.addNextBlock')}
        </Button>
      </div>

      <ExerciseSelector 
        isOpen={isExerciseSelectorOpen}
        onClose={() => setIsExerciseSelectorOpen(false)}
        onSelect={handleExerciseSelect}
      />
    </div>
  );

  return createPortal(content, document.body);
};

export default DraftSessionBuilder;
