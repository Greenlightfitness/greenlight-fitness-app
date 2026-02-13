import React, { useState, useRef, useEffect } from 'react';
import { generateAIPlan, createPlan, createWeek, createSession } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { X, Send, Mic, MicOff, Sparkles, ChevronDown, ChevronRight, Save, AlertTriangle, Key, Loader2, Dumbbell, Calendar, Layers } from 'lucide-react';

interface AIPlanAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated?: () => void;
  context?: any;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  planData?: any;
  meta?: any;
  timestamp: Date;
}

const generateId = () => crypto.randomUUID();

const AIPlanAssistant: React.FC<AIPlanAssistantProps> = ({ isOpen, onClose, onPlanCreated, context }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([0]));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: generateId(),
        role: 'system',
        content: 'Beschreibe den Trainingsplan, den du erstellen möchtest. Du kannst z.B. sagen:\n\n• „4-Wochen Hypertrophie-Plan, 4x/Woche, Push/Pull/Legs"\n• „Ganzkörperplan für Anfänger, 3x pro Woche"\n• „Deload-Woche mit 60% Volumen hinzufügen"',
        timestamp: new Date(),
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice Recognition Setup
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Spracherkennung wird in diesem Browser nicht unterstützt. Bitte verwende Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'de-DE';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Send prompt to AI
  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || isLoading) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: prompt,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await generateAIPlan(prompt, context);

      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: result.plan?.planName
          ? `**${result.plan.planName}** wurde generiert!\n\n${result.plan.planDescription || ''}\n\n${result.plan.weeks?.length || 0} Woche(n) mit insgesamt ${result.plan.weeks?.reduce((sum: number, w: any) => sum + (w.sessions?.length || 0), 0) || 0} Sessions.`
          : 'Plan wurde generiert.',
        planData: result.plan,
        meta: result.meta,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
      setApiKeyMissing(false);
    } catch (error: any) {
      if (error.message === 'API_KEY_MISSING') {
        setApiKeyMissing(true);
        setMessages(prev => [...prev, {
          id: generateId(),
          role: 'system',
          content: '⚠️ Der Gemini API-Key ist noch nicht hinterlegt. Bitte im Supabase Dashboard unter **Edge Functions → Secrets** den Key `GEMINI_API_KEY` setzen.',
          timestamp: new Date(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: generateId(),
          role: 'system',
          content: `Fehler: ${error.message}`,
          timestamp: new Date(),
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Save generated plan as draft
  const handleSavePlan = async (planData: any) => {
    if (!user || !planData || isSaving) return;

    setIsSaving(true);
    try {
      // 1. Create the plan
      const plan = await createPlan({
        coach_id: user.id,
        name: planData.planName || 'AI-generierter Plan',
        description: planData.planDescription || 'Erstellt mit AI Plan Builder',
      });

      // 2. Create weeks and sessions
      for (let wIdx = 0; wIdx < (planData.weeks || []).length; wIdx++) {
        const weekData = planData.weeks[wIdx];
        const week = await createWeek({
          plan_id: plan.id,
          order: wIdx + 1,
          focus: weekData.focus || `Woche ${wIdx + 1}`,
        });

        // 3. Create sessions within each week
        for (let sIdx = 0; sIdx < (weekData.sessions || []).length; sIdx++) {
          const sessionData = weekData.sessions[sIdx];

          // Build workout_data (blocks with exercises and sets)
          const workoutBlocks = (sessionData.blocks || []).map((block: any, bIdx: number) => ({
            id: generateId(),
            name: block.name || String.fromCharCode(65 + bIdx),
            type: block.type || 'Normal',
            rounds: block.rounds,
            restBetweenRounds: block.restBetweenRounds,
            exercises: (block.exercises || []).map((ex: any) => ({
              id: generateId(),
              exerciseId: ex.exerciseId,
              name: ex.name,
              videoUrl: ex.videoUrl,
              visibleMetrics: ex.visibleMetrics || ['reps', 'weight', 'rpe'],
              sets: (ex.sets || []).map((set: any) => ({
                id: generateId(),
                type: set.type || 'Normal',
                reps: set.reps || '',
                weight: set.weight || '',
                pct_1rm: set.pct_1rm || '',
                rpe: set.rpe || '',
                rest: set.rest || '',
                tempo: set.tempo || '',
                distance: set.distance || '',
                time: set.time || '',
              })),
            })),
          }));

          await createSession({
            week_id: week.id,
            title: sessionData.title || `Session ${sIdx + 1}`,
            day_of_week: sessionData.dayOfWeek ?? sIdx,
            order: sIdx + 1,
            workout_data: workoutBlocks,
          });
        }
      }

      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'system',
        content: `✅ **"${planData.planName}"** wurde als Entwurf gespeichert! Du findest ihn jetzt in der Plan-Liste.`,
        timestamp: new Date(),
      }]);

      onPlanCreated?.();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'system',
        content: `Fehler beim Speichern: ${error.message}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleWeek = (idx: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-[71] w-full max-w-lg bg-[#0A0A0A] border-l border-zinc-800 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-base">AI Plan Builder</h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">ALPHA</span>
                <span className="text-[10px] text-zinc-500">Planungs-Assistent</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* API Key Warning */}
        {apiKeyMissing && (
          <div className="mx-4 mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5">
            <Key size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-300">API-Key nicht konfiguriert</p>
              <p className="text-[11px] text-amber-400/70 mt-0.5">
                Supabase Dashboard → Edge Functions → Secrets → <code className="bg-amber-500/10 px-1 rounded">GEMINI_API_KEY</code> hinterlegen.
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id}>
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="bg-violet-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-md max-w-[85%] text-sm">
                    {msg.content}
                  </div>
                </div>
              ) : msg.role === 'system' ? (
                <div className="flex justify-center">
                  <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-3 rounded-xl max-w-[90%] text-xs leading-relaxed whitespace-pre-line">
                    {msg.content.split(/(\*\*.*?\*\*)/).map((part, i) =>
                      part.startsWith('**') && part.endsWith('**')
                        ? <strong key={i} className="text-white">{part.slice(2, -2)}</strong>
                        : <span key={i}>{part}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Assistant text */}
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-4 py-2.5 rounded-2xl rounded-tl-md max-w-[85%] text-sm leading-relaxed">
                      {msg.content.split(/(\*\*.*?\*\*)/).map((part, i) =>
                        part.startsWith('**') && part.endsWith('**')
                          ? <strong key={i} className="text-violet-300">{part.slice(2, -2)}</strong>
                          : <span key={i}>{part}</span>
                      )}
                    </div>
                  </div>

                  {/* Plan Preview */}
                  {msg.planData && (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                      {/* Plan Header */}
                      <div className="p-3 border-b border-zinc-800 bg-zinc-900">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Layers size={14} className="text-violet-400" />
                            <span className="text-sm font-bold text-white">{msg.planData.planName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                            <span>{msg.planData.weeks?.length || 0} Wochen</span>
                            <span>•</span>
                            <span>{msg.planData.weeks?.reduce((s: number, w: any) => s + (w.sessions?.length || 0), 0) || 0} Sessions</span>
                          </div>
                        </div>
                        {msg.planData.planDescription && (
                          <p className="text-[11px] text-zinc-500 mt-1">{msg.planData.planDescription}</p>
                        )}
                      </div>

                      {/* Weeks */}
                      <div className="max-h-64 overflow-y-auto">
                        {(msg.planData.weeks || []).map((week: any, wIdx: number) => (
                          <div key={wIdx} className="border-b border-zinc-800/50 last:border-0">
                            <button
                              onClick={() => toggleWeek(wIdx)}
                              className="w-full flex items-center justify-between p-2.5 hover:bg-zinc-800/30 transition-colors text-left"
                            >
                              <div className="flex items-center gap-2">
                                <Calendar size={12} className="text-zinc-500" />
                                <span className="text-xs font-medium text-zinc-300">Woche {wIdx + 1}</span>
                                {week.focus && <span className="text-[10px] text-zinc-600">— {week.focus}</span>}
                              </div>
                              {expandedWeeks.has(wIdx) ? <ChevronDown size={12} className="text-zinc-600" /> : <ChevronRight size={12} className="text-zinc-600" />}
                            </button>

                            {expandedWeeks.has(wIdx) && (
                              <div className="px-2.5 pb-2.5 space-y-1.5">
                                {(week.sessions || []).map((session: any, sIdx: number) => (
                                  <div key={sIdx} className="bg-zinc-950 rounded-lg p-2.5 border border-zinc-800/50">
                                    <div className="text-xs font-medium text-zinc-200 mb-1.5">{session.title}</div>
                                    <div className="space-y-1">
                                      {(session.blocks || []).map((block: any, bIdx: number) => (
                                        <div key={bIdx}>
                                          {(block.exercises || []).map((ex: any, eIdx: number) => (
                                            <div key={eIdx} className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                              <Dumbbell size={9} className="text-zinc-600 shrink-0" />
                                              <span className="text-zinc-400">{ex.name}</span>
                                              <span className="text-zinc-700">—</span>
                                              <span>{ex.sets?.length || 0}x{ex.sets?.[0]?.reps || '?'}</span>
                                            </div>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Meta */}
                      {msg.meta && msg.meta.exercisesInvalid > 0 && (
                        <div className="p-2 bg-amber-500/5 border-t border-amber-500/10 flex items-center gap-1.5">
                          <AlertTriangle size={10} className="text-amber-400" />
                          <span className="text-[10px] text-amber-400">{msg.meta.exercisesInvalid} Übung(en) nicht zugeordnet</span>
                        </div>
                      )}

                      {/* Save Button */}
                      <div className="p-3 border-t border-zinc-800 bg-zinc-900">
                        <button
                          onClick={() => handleSavePlan(msg.planData)}
                          disabled={isSaving}
                          className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                          {isSaving ? (
                            <><Loader2 size={14} className="animate-spin" /> Speichern...</>
                          ) : (
                            <><Save size={14} /> Als Entwurf speichern</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-2xl rounded-tl-md flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-violet-400" />
                <span className="text-xs text-zinc-400">Generiere Trainingsplan...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-zinc-800 bg-[#0A0A0A]">
          <div className="flex gap-2">
            {/* Voice Button */}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
              title={isListening ? 'Aufnahme stoppen' : 'Spracheingabe'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Beschreibe deinen Trainingsplan..."
                rows={1}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 resize-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none"
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center transition-all disabled:opacity-30 hover:from-violet-500 hover:to-fuchsia-500"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-zinc-600 mt-2 text-center">
            AI Plan Builder Alpha • Verwendet nur vorhandene Übungen aus der Datenbank
          </p>
        </div>
      </div>
    </>
  );
};

export default AIPlanAssistant;
