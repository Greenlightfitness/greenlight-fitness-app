import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActiveGoals, getGoalCheckpoints, createGoalCheckpoint } from '../services/supabase';
import { Goal, GoalCheckpoint } from '../types';
import { Target, TrendingUp, Trophy, Plus, ChevronRight, Flame, Dumbbell, Scale, Activity, Pencil, Check, X } from 'lucide-react';
import GoalForm from './GoalForm';

interface GoalWidgetProps {
    compact?: boolean;
    onGoalClick?: (goal: Goal) => void;
}

const GoalWidget: React.FC<GoalWidgetProps> = ({ compact = false, onGoalClick }) => {
    const { user } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);
    const [updateValue, setUpdateValue] = useState('');

    useEffect(() => {
        if (user) {
            fetchGoals();
        }
    }, [user]);

    const fetchGoals = async () => {
        if (!user) return;
        setLoading(false);
        try {
            const data = await getActiveGoals(user.id);
            const goalsWithProgress = data.map((g: any) => {
                const progress = g.start_value !== null && g.target_value > g.start_value
                    ? Math.min(100, Math.round(((g.current_value - g.start_value) / (g.target_value - g.start_value)) * 100))
                    : 0;
                return {
                    id: g.id,
                    athleteId: g.athlete_id,
                    coachId: g.coach_id,
                    title: g.title,
                    description: g.description,
                    goalType: g.goal_type,
                    targetValue: g.target_value,
                    targetUnit: g.target_unit,
                    startValue: g.start_value,
                    currentValue: g.current_value,
                    startDate: g.start_date,
                    targetDate: g.target_date,
                    exerciseId: g.exercise_id,
                    metricKey: g.metric_key,
                    status: g.status,
                    achievedAt: g.achieved_at,
                    createdAt: g.created_at,
                    progressPercentage: progress,
                    exercise: g.exercise,
                } as Goal;
            });
            setGoals(goalsWithProgress);
        } catch (error) {
            console.error('Error fetching goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const getGoalIcon = (type: string) => {
        switch (type) {
            case 'STRENGTH': return <Dumbbell size={16} />;
            case 'BODY_COMP': return <Scale size={16} />;
            case 'ENDURANCE': return <Activity size={16} />;
            case 'CONSISTENCY': return <Flame size={16} />;
            default: return <Target size={16} />;
        }
    };

    const getGoalColor = (type: string) => {
        switch (type) {
            case 'STRENGTH': return 'text-blue-400 bg-blue-500/20';
            case 'BODY_COMP': return 'text-purple-400 bg-purple-500/20';
            case 'ENDURANCE': return 'text-orange-400 bg-orange-500/20';
            case 'CONSISTENCY': return 'text-yellow-400 bg-yellow-500/20';
            default: return 'text-[#00FF00] bg-[#00FF00]/20';
        }
    };

    const getDaysRemaining = (targetDate: string) => {
        const target = new Date(targetDate);
        const today = new Date();
        const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const isAutoTracked = (goalType: string) => goalType === 'STRENGTH' || goalType === 'CONSISTENCY';

    const handleUpdateProgress = async (goalId: string) => {
        const val = parseFloat(updateValue);
        if (isNaN(val)) return;
        try {
            await createGoalCheckpoint({
                goal_id: goalId,
                value: val,
                source: 'MANUAL',
            });
            setUpdatingGoalId(null);
            setUpdateValue('');
            fetchGoals();
        } catch (error) {
            console.error('Error updating goal progress:', error);
        }
    };

    if (loading) {
        return (
            <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-zinc-800 rounded w-1/3 mb-4"></div>
                    <div className="h-20 bg-zinc-800 rounded"></div>
                </div>
            </div>
        );
    }

    // Compact view for dashboard - Premium Card Style
    if (compact) {
        return (
            <>
                <div className="bg-gradient-to-r from-[#00FF00]/10 to-transparent border border-[#00FF00]/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#00FF00]/20 rounded-xl flex items-center justify-center">
                                <Target size={24} className="text-[#00FF00]" />
                            </div>
                            <div>
                                <p className="text-white font-bold">Meine Ziele</p>
                                <p className="text-sm text-zinc-400">
                                    {goals.length === 0 ? 'Setze dein erstes Ziel' : `${goals.length} aktive${goals.length === 1 ? 's' : ''} Ziel${goals.length === 1 ? '' : 'e'}`}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowForm(true)}
                            className="px-4 py-2 bg-[#00FF00] text-black font-bold rounded-xl text-sm flex items-center shadow-[0_0_15px_rgba(0,255,0,0.3)] hover:shadow-[0_0_20px_rgba(0,255,0,0.5)] transition-all"
                        >
                            <Plus size={16} className="mr-1" /> Ziel
                        </button>
                    </div>

                    {goals.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#00FF00]/10 space-y-3">
                            {goals.slice(0, 2).map(goal => {
                                const daysRemaining = getDaysRemaining(goal.targetDate);
                                const autoTracked = isAutoTracked(goal.goalType);
                                const isUpdating = updatingGoalId === goal.id;
                                return (
                                    <div 
                                        key={goal.id} 
                                        className="bg-black/30 border border-zinc-800/50 rounded-xl p-3 hover:border-[#00FF00]/30 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getGoalColor(goal.goalType)}`}>
                                                {getGoalIcon(goal.goalType)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-white truncate">{goal.title}</h4>
                                                <p className="text-xs text-zinc-500">
                                                    {goal.currentValue} / {goal.targetValue} {goal.targetUnit}
                                                    {autoTracked && <span className="ml-1 text-[#00FF00]/60">• Auto</span>}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!autoTracked && !isUpdating && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setUpdatingGoalId(goal.id); setUpdateValue(String(goal.currentValue)); }}
                                                        className="w-7 h-7 bg-zinc-800 hover:bg-[#00FF00]/20 text-zinc-400 hover:text-[#00FF00] rounded-lg flex items-center justify-center transition-colors"
                                                        title="Fortschritt aktualisieren"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                )}
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-[#00FF00]">{goal.progressPercentage || 0}%</p>
                                                    <p className="text-[10px] text-zinc-500">{daysRemaining > 0 ? `${daysRemaining}d` : 'Abgelaufen'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Inline Quick Update */}
                                        {isUpdating && (
                                            <div className="flex items-center gap-2 mb-2 animate-in fade-in duration-150" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="number"
                                                    inputMode="decimal"
                                                    value={updateValue}
                                                    onChange={(e) => setUpdateValue(e.target.value)}
                                                    autoFocus
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateProgress(goal.id); if (e.key === 'Escape') setUpdatingGoalId(null); }}
                                                    className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-sm focus:border-[#00FF00] outline-none"
                                                    placeholder={`Aktueller Wert (${goal.targetUnit})`}
                                                />
                                                <button onClick={() => handleUpdateProgress(goal.id)} className="w-8 h-8 bg-[#00FF00] text-black rounded-lg flex items-center justify-center hover:bg-[#00FF00]/80 transition-colors">
                                                    <Check size={14} />
                                                </button>
                                                <button onClick={() => setUpdatingGoalId(null)} className="w-8 h-8 bg-zinc-800 text-zinc-400 rounded-lg flex items-center justify-center hover:text-white transition-colors">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        )}
                                        
                                        {/* Progress Bar */}
                                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-[#00FF00] to-[#00FF00]/70 rounded-full transition-all duration-500"
                                                style={{ width: `${goal.progressPercentage || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {goals.length > 2 && (
                                <button className="w-full text-center text-xs text-zinc-500 hover:text-[#00FF00] py-1 transition-colors">
                                    +{goals.length - 2} weitere Ziele anzeigen
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {showForm && (
                    <GoalForm 
                        onClose={() => setShowForm(false)} 
                        onSave={() => {
                            setShowForm(false);
                            fetchGoals();
                        }}
                    />
                )}
            </>
        );
    }

    // Full view
    return (
        <>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Meine Ziele</h2>
                    <button 
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#00FF00] text-black rounded-xl font-bold hover:bg-[#00FF00]/80 transition-colors"
                    >
                        <Plus size={18} /> Neues Ziel
                    </button>
                </div>

                {goals.length === 0 ? (
                    <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-12 text-center">
                        <Target size={48} className="text-zinc-700 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Setze dein erstes Ziel</h3>
                        <p className="text-zinc-500 mb-6">Definiere messbare Ziele und verfolge deinen Fortschritt.</p>
                        <button 
                            onClick={() => setShowForm(true)}
                            className="px-6 py-3 bg-[#00FF00] text-black rounded-xl font-bold hover:bg-[#00FF00]/80 transition-colors"
                        >
                            Ziel erstellen
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {goals.map(goal => (
                            <div 
                                key={goal.id} 
                                className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-6 hover:border-zinc-700 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getGoalColor(goal.goalType)}`}>
                                            {getGoalIcon(goal.goalType)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{goal.title}</h3>
                                            {goal.description && (
                                                <p className="text-sm text-zinc-500 mt-1">{goal.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-[#00FF00]">{goal.progressPercentage || 0}%</div>
                                        <div className="text-xs text-zinc-500">{getDaysRemaining(goal.targetDate)} Tage</div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-4">
                                    <div 
                                        className="h-full bg-gradient-to-r from-[#00FF00] to-[#00FF00]/70 rounded-full transition-all duration-500"
                                        style={{ width: `${goal.progressPercentage || 0}%` }}
                                    />
                                </div>

                                <div className="flex justify-between text-sm mb-4">
                                    <div>
                                        <span className="text-zinc-500">Start:</span>
                                        <span className="text-white ml-2">{goal.startValue} {goal.targetUnit}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500">Aktuell:</span>
                                        <span className="text-[#00FF00] font-bold ml-2">{goal.currentValue} {goal.targetUnit}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-500">Ziel:</span>
                                        <span className="text-white ml-2">{goal.targetValue} {goal.targetUnit}</span>
                                    </div>
                                </div>

                                {/* Update / Auto-tracked info */}
                                {isAutoTracked(goal.goalType) ? (
                                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                                        <TrendingUp size={12} className="text-[#00FF00]" />
                                        <span>Wird automatisch aus deinen Workouts aktualisiert</span>
                                    </div>
                                ) : updatingGoalId === goal.id ? (
                                    <div className="flex items-center gap-2 animate-in fade-in duration-150">
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            value={updateValue}
                                            onChange={(e) => setUpdateValue(e.target.value)}
                                            autoFocus
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateProgress(goal.id); if (e.key === 'Escape') setUpdatingGoalId(null); }}
                                            className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-2 focus:border-[#00FF00] outline-none"
                                            placeholder={`Neuer Wert (${goal.targetUnit})`}
                                        />
                                        <button onClick={() => handleUpdateProgress(goal.id)} className="px-4 py-2 bg-[#00FF00] text-black rounded-xl font-bold hover:bg-[#00FF00]/80 transition-colors flex items-center gap-1">
                                            <Check size={14} /> Speichern
                                        </button>
                                        <button onClick={() => setUpdatingGoalId(null)} className="px-3 py-2 bg-zinc-800 text-zinc-400 rounded-xl hover:text-white transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { setUpdatingGoalId(goal.id); setUpdateValue(String(goal.currentValue)); }}
                                        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-[#00FF00] transition-colors"
                                    >
                                        <Pencil size={14} /> Fortschritt aktualisieren
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showForm && (
                <GoalForm 
                    onClose={() => setShowForm(false)} 
                    onSave={() => {
                        setShowForm(false);
                        fetchGoals();
                    }}
                />
            )}
        </>
    );
};

export default GoalWidget;
