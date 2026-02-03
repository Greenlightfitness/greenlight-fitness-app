import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createGoal, getExercises } from '../services/supabase';
import { GoalType } from '../types';
import { X, Target, Dumbbell, Scale, Activity, Flame, Calendar, Hash } from 'lucide-react';
import Button from './Button';
import Input from './Input';

interface GoalFormProps {
    onClose: () => void;
    onSave: () => void;
    athleteId?: string; // For coaches creating goals for athletes
}

const GOAL_TYPES: { id: GoalType; label: string; icon: any; description: string }[] = [
    { id: 'STRENGTH', label: 'Kraft', icon: Dumbbell, description: 'Z.B. Bankdrücken 100kg 1RM' },
    { id: 'BODY_COMP', label: 'Körperkomposition', icon: Scale, description: 'Z.B. 12% Körperfett erreichen' },
    { id: 'ENDURANCE', label: 'Ausdauer', icon: Activity, description: 'Z.B. 5km unter 25 Min.' },
    { id: 'CONSISTENCY', label: 'Konsistenz', icon: Flame, description: 'Z.B. 4x pro Woche trainieren' },
    { id: 'CUSTOM', label: 'Benutzerdefiniert', icon: Target, description: 'Eigenes Ziel definieren' },
];

const GoalForm: React.FC<GoalFormProps> = ({ onClose, onSave, athleteId }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [exercises, setExercises] = useState<any[]>([]);
    
    const [formData, setFormData] = useState({
        goalType: '' as GoalType | '',
        title: '',
        description: '',
        targetValue: 0,
        targetUnit: 'kg',
        startValue: 0,
        startDate: new Date().toISOString().split('T')[0],
        targetDate: '',
        exerciseId: '',
    });

    useEffect(() => {
        fetchExercises();
    }, []);

    const fetchExercises = async () => {
        try {
            const data = await getExercises();
            setExercises(data);
        } catch (error) {
            console.error('Error fetching exercises:', error);
        }
    };

    const handleTypeSelect = (type: GoalType) => {
        setFormData({ ...formData, goalType: type });
        
        // Pre-fill units based on type
        let unit = 'kg';
        if (type === 'ENDURANCE') unit = 'min';
        if (type === 'BODY_COMP') unit = '%';
        if (type === 'CONSISTENCY') unit = 'Einheiten/Woche';
        
        setFormData(prev => ({ ...prev, goalType: type, targetUnit: unit }));
        setStep(2);
    };

    const handleSubmit = async () => {
        if (!user) return;
        setSaving(true);
        
        try {
            await createGoal({
                athlete_id: athleteId || user.id,
                coach_id: athleteId ? user.id : null,
                title: formData.title,
                description: formData.description || null,
                goal_type: formData.goalType as GoalType,
                target_value: formData.targetValue,
                target_unit: formData.targetUnit,
                start_value: formData.startValue || 0,
                start_date: formData.startDate,
                target_date: formData.targetDate,
                exercise_id: formData.exerciseId || null,
            });
            
            onSave();
        } catch (error: any) {
            console.error('Error creating goal:', error);
            const msg = error?.message || error?.code || 'Unbekannter Fehler';
            alert(`Fehler beim Erstellen des Ziels: ${msg}`);
        } finally {
            setSaving(false);
        }
    };

    const isStep2Valid = formData.title && formData.targetValue > 0 && formData.targetDate;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#1C1C1E] border border-zinc-800 w-full max-w-lg rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            {step === 1 ? 'Zieltyp wählen' : 'Ziel definieren'}
                        </h3>
                        <p className="text-sm text-zinc-500 mt-1">
                            {step === 1 ? 'Welche Art von Ziel möchtest du setzen?' : 'Gib die Details für dein Ziel ein'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    
                    {/* Step 1: Select Goal Type */}
                    {step === 1 && (
                        <div className="space-y-3">
                            {GOAL_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => handleTypeSelect(type.id)}
                                    className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                                        formData.goalType === type.id
                                            ? 'bg-[#00FF00]/10 border-[#00FF00]/50 text-[#00FF00]'
                                            : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 text-white'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                        formData.goalType === type.id ? 'bg-[#00FF00]/20' : 'bg-zinc-800'
                                    }`}>
                                        <type.icon size={24} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <h4 className="font-bold">{type.label}</h4>
                                        <p className="text-sm text-zinc-500">{type.description}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Step 2: Goal Details */}
                    {step === 2 && (
                        <div className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-bold text-zinc-400 mb-2">Ziel-Titel *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Z.B. 100kg Bankdrücken"
                                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-zinc-400 mb-2">Beschreibung (optional)</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Weitere Details zu deinem Ziel..."
                                    rows={2}
                                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none resize-none"
                                />
                            </div>

                            {/* Exercise Selection (for STRENGTH goals) */}
                            {formData.goalType === 'STRENGTH' && (
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Übung verknüpfen</label>
                                    <select
                                        value={formData.exerciseId}
                                        onChange={e => setFormData({ ...formData, exerciseId: e.target.value })}
                                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                                    >
                                        <option value="">Keine Übung ausgewählt</option>
                                        {exercises.map(ex => (
                                            <option key={ex.id} value={ex.id}>{ex.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-zinc-500 mt-1">PRs werden automatisch getrackt</p>
                                </div>
                            )}

                            {/* Target Value */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Startwert</label>
                                    <div className="flex">
                                        <input
                                            type="number"
                                            value={formData.startValue || ''}
                                            onChange={e => setFormData({ ...formData, startValue: Number(e.target.value) })}
                                            placeholder="0"
                                            className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-l-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                                        />
                                        <span className="bg-zinc-800 border border-l-0 border-zinc-700 text-zinc-400 px-3 py-3 rounded-r-xl text-sm">
                                            {formData.targetUnit}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Zielwert *</label>
                                    <div className="flex">
                                        <input
                                            type="number"
                                            value={formData.targetValue || ''}
                                            onChange={e => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                                            placeholder="100"
                                            className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-l-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                                        />
                                        <span className="bg-zinc-800 border border-l-0 border-zinc-700 text-zinc-400 px-3 py-3 rounded-r-xl text-sm">
                                            {formData.targetUnit}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Unit (custom) */}
                            {formData.goalType === 'CUSTOM' && (
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Einheit</label>
                                    <input
                                        type="text"
                                        value={formData.targetUnit}
                                        onChange={e => setFormData({ ...formData, targetUnit: e.target.value })}
                                        placeholder="kg, min, km, ..."
                                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                                    />
                                </div>
                            )}

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Startdatum</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">Zieldatum *</label>
                                    <input
                                        type="date"
                                        value={formData.targetDate}
                                        onChange={e => setFormData({ ...formData, targetDate: e.target.value })}
                                        className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step === 2 && (
                    <div className="p-6 border-t border-zinc-800 flex gap-4">
                        <button
                            onClick={() => setStep(1)}
                            className="px-6 py-3 text-zinc-400 hover:text-white transition-colors"
                        >
                            Zurück
                        </button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!isStep2Valid || saving}
                            fullWidth
                        >
                            {saving ? 'Wird gespeichert...' : 'Ziel erstellen'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GoalForm;
