import React, { useState, useEffect } from 'react';
import { Exercise, WorkoutSet } from '../types';
import Input from './Input';
import Button from './Button';
import { useLanguage } from '../context/LanguageContext';
import { X, Save, Wand2, Image as ImageIcon, Layers, Plus, Trash2 } from 'lucide-react';
import { generateExerciseIllustration, generateExerciseDescription, generateExerciseSequence } from '../services/ai';
import { supabase, createExercise, updateExercise, uploadFile, getPublicUrl } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

interface ExerciseEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseToEdit?: Exercise | null;
  onSave: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const ExerciseEditorModal: React.FC<ExerciseEditorModalProps> = ({ isOpen, onClose, exerciseToEdit, onSave }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const METRIC_OPTIONS = [
    { key: 'reps', label: t('editor.metric_reps') },
    { key: 'weight', label: t('editor.metric_weight') },
    { key: 'pct_1rm', label: t('editor.metric_pct_1rm') },
    { key: 'rpe', label: t('editor.metric_rpe') },
    { key: 'distance', label: t('editor.metric_distance') },
    { key: 'time', label: t('editor.metric_time') },
    { key: 'tempo', label: t('editor.metric_tempo') },
  ];

  const [formData, setFormData] = useState<{
    name: string;
    category: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    videoUrl: string;
    thumbnailUrl: string;
    sequenceUrl: string;
    defaultVisibleMetrics: string[];
    defaultSets: WorkoutSet[];
  }>({
    name: '',
    category: '',
    description: '',
    difficulty: 'Beginner',
    videoUrl: '',
    thumbnailUrl: '',
    sequenceUrl: '',
    defaultVisibleMetrics: ['reps', 'weight', 'rpe'],
    defaultSets: []
  });

  const [generatingImg, setGeneratingImg] = useState(false);
  const [generatingSeq, setGeneratingSeq] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (exerciseToEdit) {
        setFormData({
          name: exerciseToEdit.name,
          category: exerciseToEdit.category,
          description: exerciseToEdit.description,
          difficulty: exerciseToEdit.difficulty,
          videoUrl: exerciseToEdit.videoUrl || '',
          thumbnailUrl: exerciseToEdit.thumbnailUrl || '',
          sequenceUrl: exerciseToEdit.sequenceUrl || '',
          defaultVisibleMetrics: exerciseToEdit.defaultVisibleMetrics || ['reps', 'weight', 'rpe'],
          defaultSets: exerciseToEdit.defaultSets || Array(3).fill(null).map(() => ({
             id: generateId(), type: 'Normal', reps: '', weight: '', rpe: '', rest: ''
          }))
        });
      } else {
        setFormData({
          name: '',
          category: '',
          description: '',
          difficulty: 'Beginner',
          videoUrl: '',
          thumbnailUrl: '',
          sequenceUrl: '',
          defaultVisibleMetrics: ['reps', 'weight', 'rpe'],
          defaultSets: Array(3).fill(null).map(() => ({
             id: generateId(), type: 'Normal', reps: '', weight: '', rpe: '', rest: ''
          }))
        });
      }
    }
  }, [isOpen, exerciseToEdit]);

  // Helper to ensure API key is selected
  const ensureApiKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      try {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // @ts-ignore
          await window.aistudio.openSelectKey();
        }
      } catch (e) {
        console.warn("AI Studio key check failed:", e);
      }
    }
  };

  // Upload helper
  const uploadAsset = async (dataUrl: string, folder: 'images' | 'sequences'): Promise<string> => {
    const timestamp = Date.now();
    const safeName = formData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `exercises/${folder}/${safeName}_${timestamp}.png`;
    
    // Convert base64 to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `${safeName}.png`, { type: 'image/png' });
    
    await uploadFile('exercises', fileName, file);
    return getPublicUrl('exercises', fileName);
  };

  const handleGenerateImage = async () => {
    if (!formData.name) return alert("Please enter an exercise name first.");
    
    await ensureApiKey();
    setGeneratingImg(true);
    
    try {
      const base64Image = await generateExerciseIllustration(formData.name, formData.description);
      if (base64Image) {
        const downloadUrl = await uploadAsset(base64Image, 'images');
        setFormData(prev => ({ ...prev, thumbnailUrl: downloadUrl }));
      } else {
        alert("Failed to generate image. Please try again.");
      }
    } catch (error: any) {
      console.error(error);
      alert(`Error generating image: ${error.message}`);
    } finally {
      setGeneratingImg(false);
    }
  };

  const handleGenerateSequence = async () => {
    if (!formData.name) return alert("Please enter an exercise name first.");
    
    await ensureApiKey();
    setGeneratingSeq(true);
    
    try {
      // 1. Generate AI Image
      const base64Seq = await generateExerciseSequence(formData.name);
      
      if (!base64Seq) {
        throw new Error("AI generation returned no image.");
      }

      // 2. Upload to Firebase Storage
      const downloadUrl = await uploadAsset(base64Seq, 'sequences');
      
      // 3. Update State
      setFormData(prev => ({ ...prev, sequenceUrl: downloadUrl }));

    } catch (error: any) {
      console.error(error);
      alert(`Error generating sequence: ${error.message}`);
    } finally {
      setGeneratingSeq(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!formData.name) return alert("Please enter an exercise name first.");
    
    await ensureApiKey();
    setGeneratingDesc(true);
    
    try {
      const desc = await generateExerciseDescription(formData.name, formData.description);
      if (desc) {
        setFormData(prev => ({ ...prev, description: desc }));
      } else {
        alert("Failed to generate description.");
      }
    } catch (error: any) {
      console.error(error);
      alert(`Error generating description: ${error.message}`);
    } finally {
      setGeneratingDesc(false);
    }
  };

  // --- TEMPLATE LOGIC ---
  const toggleMetric = (key: string) => {
    setFormData(prev => {
        const exists = prev.defaultVisibleMetrics.includes(key);
        return {
            ...prev,
            defaultVisibleMetrics: exists 
                ? prev.defaultVisibleMetrics.filter(m => m !== key)
                : [...prev.defaultVisibleMetrics, key]
        };
    });
  };

  const updateSet = (id: string, field: keyof WorkoutSet, value: string) => {
      setFormData(prev => ({
          ...prev,
          defaultSets: prev.defaultSets.map(s => s.id === id ? { ...s, [field]: value } : s)
      }));
  };

  const addSet = () => {
      setFormData(prev => ({
          ...prev,
          defaultSets: [...prev.defaultSets, { id: generateId(), type: 'Normal', reps: '', weight: '', rest: '' }]
      }));
  };

  const removeSet = (id: string) => {
      setFormData(prev => ({
          ...prev,
          defaultSets: prev.defaultSets.filter(s => s.id !== id)
      }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        difficulty: formData.difficulty,
        video_url: formData.videoUrl,
        thumbnail_url: formData.thumbnailUrl,
        sequence_url: formData.sequenceUrl,
        default_visible_metrics: formData.defaultVisibleMetrics,
        default_sets: formData.defaultSets,
      };
      
      if (exerciseToEdit) {
        await updateExercise(exerciseToEdit.id, payload);
      } else {
        await createExercise({
          ...payload,
          author_id: user.id,
          is_archived: false,
        });
      }
      onSave();
      onClose();
    } catch (error: any) {
      console.error("Error saving exercise:", error);
      alert(`Error saving exercise: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700 w-full max-w-4xl rounded-lg shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-zinc-800 shrink-0">
          <h3 className="text-xl font-bold text-white">
            {exerciseToEdit ? t('editor.editTitle') : t('editor.createTitle')}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 flex-1">
          <form id="exercise-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Basic Info */}
            <section className="space-y-4">
                <h4 className="text-[#00FF00] text-sm font-bold uppercase tracking-wider">{t('editor.basicInfo')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                        label={t('editor.name')} 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required 
                        placeholder="e.g. Barbell Squat"
                    />
                    <Input 
                        label={t('editor.category')} 
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})} 
                        required 
                        placeholder="e.g. Legs"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-zinc-400">{t('editor.difficulty')}</label>
                        <select
                            value={formData.difficulty}
                            onChange={(e) => setFormData({...formData, difficulty: e.target.value as any})}
                            className="bg-zinc-900 border border-zinc-700 text-white rounded px-3 py-2 focus:outline-none focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00]"
                        >
                            <option value="Beginner">{t('editor.beginner')}</option>
                            <option value="Intermediate">{t('editor.intermediate')}</option>
                            <option value="Advanced">{t('editor.advanced')}</option>
                        </select>
                    </div>
                    <Input 
                        label={t('editor.videoUrl')} 
                        value={formData.videoUrl} 
                        onChange={e => setFormData({...formData, videoUrl: e.target.value})}
                        placeholder="https://youtube.com/..."
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-zinc-400 block">{t('editor.description')}</label>
                        <button 
                            type="button"
                            onClick={handleGenerateDescription}
                            disabled={generatingDesc || !formData.name}
                            className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-[#00FF00] hover:text-white disabled:opacity-50 transition-colors"
                        >
                            <Wand2 size={12} /> {generatingDesc ? t('editor.generating') : t('editor.generateAI')}
                        </button>
                    </div>
                    <textarea 
                        className="w-full bg-zinc-950 border border-zinc-700 text-white rounded px-3 py-2 focus:border-[#00FF00] focus:ring-1 focus:ring-[#00FF00] resize-none h-24"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Describe the movement execution..."
                    />
                </div>
            </section>

            {/* 2. Default Configuration */}
            <section className="space-y-4 pt-4 border-t border-zinc-800">
                 <div className="flex items-center justify-between">
                    <h4 className="text-[#00FF00] text-sm font-bold uppercase tracking-wider">{t('editor.defaultConfig')}</h4>
                    <span className="text-xs text-zinc-500">{t('editor.defaultConfigHint')}</span>
                 </div>
                 
                 {/* Metrics Toggles */}
                 <div className="flex flex-wrap gap-2">
                    {METRIC_OPTIONS.map(metric => (
                        <button
                            key={metric.key}
                            type="button"
                            onClick={() => toggleMetric(metric.key)}
                            className={`px-3 py-1 text-xs rounded-full border transition-all ${
                                formData.defaultVisibleMetrics.includes(metric.key)
                                ? 'bg-[#00FF00]/10 border-[#00FF00] text-[#00FF00]'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-500'
                            }`}
                        >
                            {metric.label}
                        </button>
                    ))}
                 </div>

                 {/* Sets Table - Responsive Wrapper */}
                 <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[600px]">
                            <thead>
                                <tr className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                                    <th className="p-3 w-12 text-center">#</th>
                                    <th className="p-3 w-32">Type</th>
                                    {formData.defaultVisibleMetrics.map(key => (
                                        <th key={key} className="p-3">{METRIC_OPTIONS.find(m => m.key === key)?.label}</th>
                                    ))}
                                    <th className="p-3">Rest</th>
                                    <th className="p-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.defaultSets.map((set, index) => (
                                    <tr key={set.id} className="border-b border-zinc-800 last:border-0 group">
                                        <td className="p-2 text-center text-zinc-500">{index + 1}</td>
                                        <td className="p-2">
                                            <select 
                                                value={set.type}
                                                onChange={(e) => updateSet(set.id, 'type', e.target.value as any)}
                                                className="bg-transparent border-none text-xs font-medium text-white focus:ring-0 cursor-pointer"
                                            >
                                                <option value="Normal">{t('editor.type_normal')}</option>
                                                <option value="Warmup">{t('editor.type_warmup')}</option>
                                                <option value="Dropset">{t('editor.type_dropset')}</option>
                                            </select>
                                        </td>
                                        {formData.defaultVisibleMetrics.map(key => (
                                            <td key={key} className="p-2">
                                                <input 
                                                    className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-20 text-center text-white focus:border-[#00FF00] outline-none text-xs" 
                                                    value={(set as any)[key] || ''} 
                                                    onChange={(e) => updateSet(set.id, key as any, e.target.value)} 
                                                    placeholder="-" 
                                                />
                                            </td>
                                        ))}
                                        <td className="p-2">
                                            <input 
                                                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 w-16 text-center text-white focus:border-[#00FF00] outline-none text-xs"
                                                value={set.rest || ''}
                                                onChange={(e) => updateSet(set.id, 'rest', e.target.value)}
                                                placeholder="s"
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button 
                                                type="button" 
                                                onClick={() => removeSet(set.id)}
                                                className="text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-2 bg-zinc-900 border-t border-zinc-800">
                        <button type="button" onClick={addSet} className="text-xs font-bold text-zinc-500 hover:text-[#00FF00] flex items-center gap-1">
                            <Plus size={14} /> {t('editor.addSet')}
                        </button>
                    </div>
                 </div>
            </section>

            {/* 3. AI Assets Grid */}
            <section className="space-y-4 pt-4 border-t border-zinc-800">
                 <h4 className="text-[#00FF00] text-sm font-bold uppercase tracking-wider">{t('editor.mediaAssets')}</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Image Generation */}
                    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/50">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-bold text-white flex items-center gap-2">
                                <ImageIcon size={16} /> {t('editor.illustration')}
                            </label>
                            <button 
                                type="button"
                                onClick={handleGenerateImage}
                                disabled={generatingImg || !formData.name}
                                className="text-xs flex items-center gap-1 border border-[#00FF00] text-[#00FF00] bg-transparent px-3 py-1.5 rounded hover:bg-[#00FF00]/10 disabled:opacity-50 transition-all font-medium"
                            >
                                <Wand2 size={12} /> {generatingImg ? t('editor.generating') : t('editor.create')}
                            </button>
                        </div>

                        {formData.thumbnailUrl ? (
                            <div className="relative group">
                                <img 
                                src={formData.thumbnailUrl} 
                                alt="Exercise Illustration" 
                                className="w-full h-40 object-cover rounded border border-zinc-700"
                                />
                                <button
                                type="button"
                                onClick={() => setFormData({...formData, thumbnailUrl: ''})}
                                className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="w-full h-40 bg-zinc-900 border-2 border-dashed border-zinc-800 rounded flex items-center justify-center text-zinc-600 flex-col gap-2">
                                <ImageIcon size={24} />
                                <span className="text-xs">{t('editor.noIllustration')}</span>
                            </div>
                        )}
                    </div>

                    {/* Sequence Generation */}
                    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-950/50 row-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-sm font-bold text-white flex items-center gap-2">
                                <Layers size={16} /> {t('editor.motionSequence')}
                            </label>
                            <button 
                                type="button"
                                onClick={handleGenerateSequence}
                                disabled={generatingSeq || !formData.name}
                                className="text-xs flex items-center gap-1 border border-[#00FF00] text-[#00FF00] bg-transparent px-3 py-1.5 rounded hover:bg-[#00FF00]/10 disabled:opacity-50 transition-all font-medium"
                            >
                                <Wand2 size={12} /> {generatingSeq ? t('editor.generating') : t('editor.createVertical')}
                            </button>
                        </div>

                        {formData.sequenceUrl ? (
                            <div className="relative group flex justify-center bg-black/20 rounded">
                                <img
                                src={formData.sequenceUrl}
                                alt="Step-by-step sequence"
                                className="h-auto w-auto max-h-[300px] object-contain rounded border border-zinc-700"
                                />
                                <button
                                type="button"
                                onClick={() => setFormData({...formData, sequenceUrl: ''})}
                                className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="w-full h-[300px] bg-zinc-900 border-2 border-dashed border-zinc-800 rounded flex items-center justify-center text-zinc-600 flex-col gap-2 aspect-[9/16]">
                                <Layers size={24} />
                                <span className="text-xs text-center px-4">{t('editor.noSequence')}<br/>{t('editor.sequenceHint')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 flex justify-end gap-2 bg-zinc-900/50 rounded-b-lg shrink-0">
           <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
           <Button type="submit" form="exercise-form" disabled={saving}>
             {saving ? t('editor.saving') : t('editor.save')}
           </Button>
        </div>

      </div>
    </div>
  );
};

export default ExerciseEditorModal;