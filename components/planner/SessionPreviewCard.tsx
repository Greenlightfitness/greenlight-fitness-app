import React, { useState } from 'react';
import { WorkoutBlock } from '../../types';
import { MoreVertical, Copy, Trash2, Moon, Dumbbell } from 'lucide-react';

interface SessionPreviewCardProps {
  title: string;
  workoutData?: WorkoutBlock[];
  onClick?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  isRestDay?: boolean;
  isDragging?: boolean;
  className?: string;
  compact?: boolean;
}

// --- Label Generation ---
// Normal block: each exercise gets its own letter (A, B, C)
// Superset block: all exercises share one letter with sub-numbers (D1, D2)
// Circuit block: all exercises share one letter, labeled as circuit

interface ExerciseLabel {
  letter: string;
  sub?: number; // For supersets: 1, 2, 3...
  isCircuit?: boolean;
  isSuperset?: boolean;
}

interface LabeledExercise {
  label: ExerciseLabel;
  name: string;
  setInfo: string;
  badges: string[];
}

function generateLabels(workoutData: WorkoutBlock[]): LabeledExercise[] {
  const result: LabeledExercise[] = [];
  let letterIndex = 0;

  for (const block of workoutData) {
    const blockType = block.type || 'Normal';
    const letter = String.fromCharCode(65 + letterIndex);

    if (blockType === 'Superset' && block.exercises.length > 0) {
      block.exercises.forEach((ex, i) => {
        result.push({
          label: { letter, sub: i + 1, isSuperset: true },
          name: ex.name || 'Übung',
          setInfo: formatSetInfo(ex.sets, ex.visibleMetrics),
          badges: getExerciseBadges(ex.sets),
        });
      });
      letterIndex++;
    } else if (blockType === 'Circuit' && block.exercises.length > 0) {
      block.exercises.forEach((ex) => {
        result.push({
          label: { letter, isCircuit: true },
          name: ex.name || 'Übung',
          setInfo: formatSetInfo(ex.sets, ex.visibleMetrics),
          badges: getExerciseBadges(ex.sets),
        });
      });
      // Add circuit meta info
      if (block.rounds) {
        result[result.length - block.exercises.length].badges.push(`${block.rounds} Runden`);
      }
      letterIndex++;
    } else {
      // Normal block: each exercise gets its own letter
      block.exercises.forEach((ex) => {
        const l = String.fromCharCode(65 + letterIndex);
        result.push({
          label: { letter: l },
          name: ex.name || 'Übung',
          setInfo: formatSetInfo(ex.sets, ex.visibleMetrics),
          badges: getExerciseBadges(ex.sets),
        });
        letterIndex++;
      });
    }
  }

  return result;
}

function formatSetInfo(sets: any[], visibleMetrics?: string[]): string {
  if (!sets || sets.length === 0) return '';

  const setCount = sets.length;
  const metrics = visibleMetrics || ['reps', 'weight'];
  const hasReps = metrics.includes('reps');
  const hasWeight = metrics.includes('weight');
  const hasTime = metrics.includes('time');
  const hasDistance = metrics.includes('distance');

  // Check if all sets have same values (common case)
  const firstSet = sets[0];
  if (!firstSet) return `${setCount} Sets`;

  // Check for AMRAP
  if (firstSet.type === 'AMRAP' && firstSet.reps) {
    return `AMRAP ${firstSet.reps}`;
  }

  // Time-based
  if (hasTime && firstSet.time) {
    return `${setCount} x ${firstSet.time}`;
  }

  // Distance-based
  if (hasDistance && firstSet.distance) {
    return `${setCount} x ${firstSet.distance}m`;
  }

  // Reps + Weight
  if (hasReps && firstSet.reps) {
    const repsVal = firstSet.reps;
    if (hasWeight && firstSet.weight) {
      return `${setCount} x ${repsVal} @ ${firstSet.weight}kg`;
    }
    if (repsVal.toString().toUpperCase() === 'MAX') {
      return `${setCount} x MAX`;
    }
    return `${setCount} x ${repsVal}`;
  }

  return `${setCount} Sets`;
}

function getExerciseBadges(sets: any[]): string[] {
  const badges: string[] = [];
  if (!sets || sets.length === 0) return badges;

  const hasAmrap = sets.some(s => s.type === 'AMRAP');
  if (hasAmrap) badges.push('FOR REPS');

  return badges;
}

// --- Render ---

const LabelCircle: React.FC<{ label: ExerciseLabel }> = ({ label }) => {
  let displayText = label.letter;
  if (label.sub) {
    displayText = `${label.letter}${label.sub}`;
  }

  let bgClass = 'bg-zinc-700/80 text-zinc-300';
  if (label.isSuperset) {
    bgClass = 'bg-[#00FF00]/15 text-[#00FF00]';
  } else if (label.isCircuit) {
    bgClass = 'bg-orange-500/15 text-orange-400';
  }

  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0 ${bgClass}`}>
      {displayText}
    </span>
  );
};

const SessionPreviewCard: React.FC<SessionPreviewCardProps> = ({
  title,
  workoutData,
  onClick,
  onDuplicate,
  onDelete,
  isRestDay,
  isDragging,
  className = '',
  compact = false,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Rest day card
  if (isRestDay) {
    return (
      <div className={`bg-[#1C1C1E] p-3 rounded-2xl border border-zinc-800 flex items-center gap-3 ${className}`}>
        <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center">
          <Moon size={14} className="text-blue-400" />
        </div>
        <div>
          <p className="text-blue-400 font-bold text-sm">Rest</p>
          <p className="text-zinc-600 text-[10px]">1 Set</p>
        </div>
      </div>
    );
  }

  const exercises = workoutData ? generateLabels(workoutData) : [];
  const totalExercises = workoutData?.reduce((acc, b) => acc + b.exercises.length, 0) || 0;

  return (
    <div
      onClick={onClick}
      className={`
        bg-[#1C1C1E] rounded-2xl border border-zinc-800 
        hover:border-[#00FF00]/60 group transition-all cursor-pointer shadow-lg relative
        ${isDragging ? 'opacity-30 border-dashed border-zinc-500 scale-95' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 pb-1">
        <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
          <Dumbbell size={14} className="text-zinc-400" />
        </div>
        <h4 className="font-bold text-white text-sm flex-1 line-clamp-1 leading-tight">{title}</h4>

        {/* Three-dot menu */}
        {(onDuplicate || onDelete) && (
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-1 text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity rounded"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }} />
                <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-20 py-1 min-w-[120px]">
                  {onDuplicate && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDuplicate(); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <Copy size={12} /> Kopieren
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <Trash2 size={12} /> Löschen
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Exercise List */}
      {exercises.length > 0 ? (
        <div className="px-3 pb-3 pt-1 space-y-0.5">
          {exercises.map((ex, i) => (
            <div key={i} className="flex items-start gap-2 py-0.5">
              <LabelCircle label={ex.label} />
              <div className="flex-1 min-w-0">
                <p className="text-zinc-300 text-xs font-medium leading-tight truncate">{ex.name}</p>
                {ex.setInfo && (
                  <p className="text-zinc-600 text-[10px] leading-tight">{ex.setInfo}</p>
                )}
                {ex.badges.length > 0 && (
                  <div className="flex gap-1 mt-0.5">
                    {ex.badges.map((badge, bi) => (
                      <span key={bi} className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0 rounded font-bold uppercase">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Superset/Circuit indicators at bottom */}
          {workoutData && workoutData.some(b => b.type === 'Superset') && (
            <div className="flex items-center gap-1 mt-1 pt-1 border-t border-zinc-800/50">
              <span className="text-[9px] bg-[#00FF00]/10 text-[#00FF00] px-1.5 py-0.5 rounded font-bold">Supersatz</span>
            </div>
          )}
          {workoutData && workoutData.some(b => b.type === 'Circuit') && (
            <div className="flex items-center gap-1 mt-1 pt-1 border-t border-zinc-800/50">
              <span className="text-[9px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded font-bold">Zirkel</span>
            </div>
          )}
        </div>
      ) : (
        <div className="px-3 pb-3 pt-1">
          <p className="text-zinc-700 text-[10px]">Keine Übungen</p>
        </div>
      )}
    </div>
  );
};

export default SessionPreviewCard;
