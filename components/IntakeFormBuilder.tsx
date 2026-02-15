import React, { useState, useCallback } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Type, List, CheckSquare, Hash, Star, ToggleLeft, ToggleRight, Copy, AlertCircle } from 'lucide-react';
import type { IntakeQuestion } from '../services/supabase';

interface IntakeFormBuilderProps {
  questions: IntakeQuestion[];
  onChange: (questions: IntakeQuestion[]) => void;
  readOnly?: boolean;
}

const QUESTION_TYPES: { type: IntakeQuestion['type']; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'single_choice', label: 'Single-Choice', icon: <List size={16} />, desc: 'Eine Antwort auswählen' },
  { type: 'multiple_choice', label: 'Multiple-Choice', icon: <CheckSquare size={16} />, desc: 'Mehrere Antworten möglich' },
  { type: 'text', label: 'Freitext', icon: <Type size={16} />, desc: 'Offene Texteingabe' },
  { type: 'number', label: 'Zahl', icon: <Hash size={16} />, desc: 'Numerische Eingabe' },
  { type: 'rating', label: 'Bewertung', icon: <Star size={16} />, desc: 'Skala 1-5 oder 1-10' },
];

const generateId = () => Math.random().toString(36).substring(2, 10);

const IntakeFormBuilder: React.FC<IntakeFormBuilderProps> = ({ questions, onChange, readOnly }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const addQuestion = useCallback((type: IntakeQuestion['type']) => {
    const newQ: IntakeQuestion = {
      id: generateId(),
      type,
      label: '',
      required: false,
      ...(type === 'single_choice' || type === 'multiple_choice' ? {
        options: [
          { id: generateId(), label: '' },
          { id: generateId(), label: '' },
        ],
      } : {}),
      ...(type === 'text' ? { placeholder: '' } : {}),
    };
    onChange([...questions, newQ]);
    setExpandedId(newQ.id);
    setShowAddMenu(false);
  }, [questions, onChange]);

  const updateQuestion = useCallback((id: string, updates: Partial<IntakeQuestion>) => {
    onChange(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  }, [questions, onChange]);

  const removeQuestion = useCallback((id: string) => {
    onChange(questions.filter(q => q.id !== id));
    if (expandedId === id) setExpandedId(null);
  }, [questions, onChange, expandedId]);

  const duplicateQuestion = useCallback((q: IntakeQuestion) => {
    const dup: IntakeQuestion = {
      ...q,
      id: generateId(),
      label: q.label + ' (Kopie)',
      options: q.options?.map(o => ({ ...o, id: generateId() })),
    };
    const idx = questions.findIndex(x => x.id === q.id);
    const next = [...questions];
    next.splice(idx + 1, 0, dup);
    onChange(next);
    setExpandedId(dup.id);
  }, [questions, onChange]);

  const moveQuestion = useCallback((fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= questions.length) return;
    const next = [...questions];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    onChange(next);
  }, [questions, onChange]);

  const addOption = useCallback((qId: string) => {
    const q = questions.find(x => x.id === qId);
    if (!q) return;
    updateQuestion(qId, { options: [...(q.options || []), { id: generateId(), label: '' }] });
  }, [questions, updateQuestion]);

  const updateOption = useCallback((qId: string, optId: string, label: string) => {
    const q = questions.find(x => x.id === qId);
    if (!q) return;
    updateQuestion(qId, { options: q.options?.map(o => o.id === optId ? { ...o, label } : o) });
  }, [questions, updateQuestion]);

  const removeOption = useCallback((qId: string, optId: string) => {
    const q = questions.find(x => x.id === qId);
    if (!q || (q.options?.length || 0) <= 1) return;
    updateQuestion(qId, { options: q.options?.filter(o => o.id !== optId) });
  }, [questions, updateQuestion]);

  const getTypeInfo = (type: IntakeQuestion['type']) => QUESTION_TYPES.find(t => t.type === type);

  const handleDragStart = (idx: number) => { setDragIdx(idx); };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      moveQuestion(dragIdx, idx);
      setDragIdx(idx);
    }
  };
  const handleDragEnd = () => { setDragIdx(null); };

  return (
    <div className="space-y-3">
      {questions.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-2xl">
          <AlertCircle size={32} className="mx-auto text-zinc-600 mb-3" />
          <p className="text-zinc-500 text-sm mb-1">Noch keine Fragen erstellt</p>
          <p className="text-zinc-600 text-xs">Füge deine erste Frage hinzu, um den Fragebogen zu bauen</p>
        </div>
      )}

      {questions.map((q, idx) => {
        const typeInfo = getTypeInfo(q.type);
        const isExpanded = expandedId === q.id;

        return (
          <div
            key={q.id}
            draggable={!readOnly}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            className={`bg-[#1C1C1E] border rounded-xl transition-all ${
              isExpanded ? 'border-[#00FF00]/30' : 'border-zinc-800'
            } ${dragIdx === idx ? 'opacity-50' : ''}`}
          >
            {/* Question Header */}
            <div
              className="flex items-center gap-3 p-3 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : q.id)}
            >
              {!readOnly && (
                <div className="cursor-grab text-zinc-600 hover:text-zinc-400">
                  <GripVertical size={16} />
                </div>
              )}
              <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                {typeInfo?.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${q.label ? 'text-white' : 'text-zinc-500 italic'}`}>
                  {q.label || `Frage ${idx + 1} (${typeInfo?.label})`}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{typeInfo?.label}</span>
                  {q.required && (
                    <span className="text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-bold">Pflicht</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-zinc-400 text-xs mr-1">#{idx + 1}</span>
                {isExpanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
              </div>
            </div>

            {/* Expanded Editor */}
            {isExpanded && !readOnly && (
              <div className="px-4 pb-4 space-y-3 border-t border-zinc-800/50 pt-3">
                {/* Label */}
                <div>
                  <label className="text-zinc-500 text-xs block mb-1">Frage</label>
                  <input
                    type="text"
                    value={q.label}
                    onChange={e => updateQuestion(q.id, { label: e.target.value })}
                    placeholder="z.B. Hast du aktuelle Verletzungen?"
                    className="w-full bg-[#121212] border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:border-[#00FF00] outline-none"
                    autoFocus
                  />
                </div>

                {/* Options for choice types */}
                {(q.type === 'single_choice' || q.type === 'multiple_choice') && (
                  <div>
                    <label className="text-zinc-500 text-xs block mb-1">Antwortoptionen</label>
                    <div className="space-y-1.5">
                      {q.options?.map((opt, oi) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <div className={`w-4 h-4 border border-zinc-600 shrink-0 ${q.type === 'single_choice' ? 'rounded-full' : 'rounded'}`} />
                          <input
                            type="text"
                            value={opt.label}
                            onChange={e => updateOption(q.id, opt.id, e.target.value)}
                            placeholder={`Option ${oi + 1}`}
                            className="flex-1 bg-[#121212] border border-zinc-800 text-white rounded-lg px-3 py-1.5 text-sm focus:border-[#00FF00] outline-none"
                          />
                          {(q.options?.length || 0) > 1 && (
                            <button onClick={() => removeOption(q.id, opt.id)} className="text-zinc-600 hover:text-red-400 p-1">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addOption(q.id)}
                      className="mt-2 text-xs text-[#00FF00] hover:text-[#00FF00]/80 flex items-center gap-1"
                    >
                      <Plus size={12} /> Option hinzufügen
                    </button>
                  </div>
                )}

                {/* Placeholder for text type */}
                {q.type === 'text' && (
                  <div>
                    <label className="text-zinc-500 text-xs block mb-1">Platzhalter-Text (optional)</label>
                    <input
                      type="text"
                      value={q.placeholder || ''}
                      onChange={e => updateQuestion(q.id, { placeholder: e.target.value })}
                      placeholder="z.B. Beschreibe deine Situation..."
                      className="w-full bg-[#121212] border border-zinc-800 text-white rounded-lg px-3 py-2 text-sm focus:border-[#00FF00] outline-none"
                    />
                  </div>
                )}

                {/* Required toggle + actions */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                  <button
                    onClick={() => updateQuestion(q.id, { required: !q.required })}
                    className="flex items-center gap-2 text-sm"
                  >
                    {q.required ? (
                      <ToggleRight size={20} className="text-[#00FF00]" />
                    ) : (
                      <ToggleLeft size={20} className="text-zinc-600" />
                    )}
                    <span className={q.required ? 'text-[#00FF00] font-medium' : 'text-zinc-500'}>
                      Pflichtfeld
                    </span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveQuestion(idx, idx - 1)}
                      disabled={idx === 0}
                      className="p-1.5 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Nach oben"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveQuestion(idx, idx + 1)}
                      disabled={idx === questions.length - 1}
                      className="p-1.5 text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Nach unten"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      onClick={() => duplicateQuestion(q)}
                      className="p-1.5 text-zinc-500 hover:text-blue-400"
                      title="Duplizieren"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => removeQuestion(q.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400"
                      title="Löschen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add Question Button */}
      {!readOnly && (
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="w-full py-3 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500 hover:text-[#00FF00] hover:border-[#00FF00]/30 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={16} /> Frage hinzufügen
          </button>

          {showAddMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAddMenu(false)} />
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1C1C1E] border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                {QUESTION_TYPES.map(qt => (
                  <button
                    key={qt.type}
                    onClick={() => addQuestion(qt.type)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
                      {qt.icon}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{qt.label}</p>
                      <p className="text-zinc-500 text-xs">{qt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default IntakeFormBuilder;
