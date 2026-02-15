import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getIntakeFormById, createIntakeResponse, getIntakeResponses, updateIntakeResponse, supabase } from '../services/supabase';
import type { IntakeForm, IntakeQuestion } from '../services/supabase';
import { ClipboardList, Check, Loader2, AlertTriangle, Send, Star } from 'lucide-react';

const IntakeFormFill: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const formId = searchParams.get('form');
  const relationshipId = searchParams.get('relationship');
  const productId = searchParams.get('product');

  const [form, setForm] = useState<IntakeForm | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingResponse, setExistingResponse] = useState<any>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (formId) loadForm();
    else setLoading(false);
  }, [formId]);

  const loadForm = async () => {
    if (!formId || !user) return;
    setLoading(true);
    try {
      const f = await getIntakeFormById(formId);
      setForm(f);

      // Check for existing response
      const existing = await getIntakeResponses({
        intake_form_id: formId,
        athlete_id: user.id,
        ...(relationshipId ? { coaching_relationship_id: relationshipId } : {}),
      });
      if (existing.length > 0) {
        const resp = existing[0];
        setExistingResponse(resp);
        setAnswers(resp.answers || {});
        if (resp.status === 'SUBMITTED' || resp.status === 'REVIEWED') {
          setSubmitted(true);
        }
      }
    } catch (err) {
      console.error('Error loading form:', err);
    } finally {
      setLoading(false);
    }
  };

  const setAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setErrors(prev => { const next = { ...prev }; delete next[questionId]; return next; });
  };

  const toggleMultiChoice = (questionId: string, optionId: string) => {
    setAnswers(prev => {
      const current = (prev[questionId] as string[]) || [];
      return {
        ...prev,
        [questionId]: current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId],
      };
    });
    setErrors(prev => { const next = { ...prev }; delete next[questionId]; return next; });
  };

  const validate = (): boolean => {
    if (!form) return false;
    const newErrors: Record<string, string> = {};
    for (const q of form.questions) {
      if (!q.required) continue;
      const val = answers[q.id];
      if (val === undefined || val === null || val === '') {
        newErrors[q.id] = 'Pflichtfeld';
      } else if (Array.isArray(val) && val.length === 0) {
        newErrors[q.id] = 'Bitte mindestens eine Option wählen';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!user || !form || !validate()) return;
    setSaving(true);
    try {
      if (existingResponse) {
        await updateIntakeResponse(existingResponse.id, { answers, status: 'SUBMITTED' });
      } else {
        await createIntakeResponse({
          intake_form_id: form.id,
          athlete_id: user.id,
          coaching_relationship_id: relationshipId || undefined,
          product_id: productId || undefined,
          answers,
          status: 'SUBMITTED',
        });
      }
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting:', err);
      alert('Fehler beim Speichern. Bitte erneut versuchen.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#00FF00]" size={32} />
      </div>
    );
  }

  if (!formId || !form) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <AlertTriangle size={48} className="mx-auto text-yellow-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Fragebogen nicht gefunden</h2>
        <p className="text-zinc-400 mb-4">Bitte öffne diesen Link aus deiner Kaufbestätigung.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-[#00FF00] text-black rounded-xl font-bold">
          Zum Dashboard
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-in fade-in">
        <div className="w-20 h-20 bg-[#00FF00]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check size={40} className="text-[#00FF00]" />
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-2">Fragebogen abgeschickt!</h2>
        <p className="text-zinc-400 mb-6">
          Dein Coach wird sich auf Basis deiner Angaben bei dir melden und deinen individuellen Plan erstellen.
        </p>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-[#00FF00] text-black rounded-xl font-bold">
          Zum Dashboard
        </button>
      </div>
    );
  }

  const renderQuestion = (q: IntakeQuestion, idx: number) => {
    const error = errors[q.id];

    return (
      <div key={q.id} className="space-y-2">
        <label className="text-white text-sm font-medium flex items-center gap-1.5">
          <span className="text-zinc-600 text-xs">{idx + 1}.</span>
          {q.label}
          {q.required && <span className="text-red-400 text-xs">*</span>}
        </label>

        {q.type === 'text' && (
          <textarea
            value={answers[q.id] || ''}
            onChange={e => setAnswer(q.id, e.target.value)}
            placeholder={q.placeholder || 'Deine Antwort...'}
            rows={3}
            className={`w-full bg-[#121212] border text-white rounded-xl px-4 py-3 text-sm focus:border-[#00FF00] outline-none resize-none ${
              error ? 'border-red-500' : 'border-zinc-800'
            }`}
          />
        )}

        {q.type === 'number' && (
          <input
            type="number"
            value={answers[q.id] ?? ''}
            onChange={e => setAnswer(q.id, e.target.value ? Number(e.target.value) : '')}
            placeholder="0"
            className={`w-full bg-[#121212] border text-white rounded-xl px-4 py-3 text-sm focus:border-[#00FF00] outline-none ${
              error ? 'border-red-500' : 'border-zinc-800'
            }`}
          />
        )}

        {q.type === 'rating' && (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setAnswer(q.id, n)}
                className={`w-12 h-12 rounded-xl border text-sm font-bold transition-all flex items-center justify-center gap-0.5 ${
                  answers[q.id] === n
                    ? 'border-[#00FF00] bg-[#00FF00]/20 text-[#00FF00]'
                    : 'border-zinc-800 bg-[#121212] text-zinc-500 hover:border-zinc-600'
                }`}
              >
                {n} <Star size={10} className={answers[q.id] >= n ? 'text-[#00FF00]' : 'text-zinc-700'} />
              </button>
            ))}
          </div>
        )}

        {q.type === 'single_choice' && (
          <div className="space-y-1.5">
            {q.options?.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAnswer(q.id, opt.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                  answers[q.id] === opt.id
                    ? 'border-[#00FF00] bg-[#00FF00]/10'
                    : error ? 'border-red-500/50 bg-[#121212]' : 'border-zinc-800 bg-[#121212] hover:border-zinc-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  answers[q.id] === opt.id ? 'border-[#00FF00]' : 'border-zinc-600'
                }`}>
                  {answers[q.id] === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-[#00FF00]" />}
                </div>
                <span className="text-white text-sm">{opt.label}</span>
              </button>
            ))}
          </div>
        )}

        {q.type === 'multiple_choice' && (
          <div className="space-y-1.5">
            {q.options?.map(opt => {
              const selected = ((answers[q.id] as string[]) || []).includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleMultiChoice(q.id, opt.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selected
                      ? 'border-[#00FF00] bg-[#00FF00]/10'
                      : error ? 'border-red-500/50 bg-[#121212]' : 'border-zinc-800 bg-[#121212] hover:border-zinc-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                    selected ? 'border-[#00FF00] bg-[#00FF00]' : 'border-zinc-600'
                  }`}>
                    {selected && <Check size={12} className="text-black" />}
                  </div>
                  <span className="text-white text-sm">{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    );
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="text-center">
        <ClipboardList size={32} className="mx-auto text-[#00FF00] mb-2" />
        <h1 className="text-2xl font-extrabold text-white">{form.title}</h1>
        {form.description && <p className="text-zinc-400 text-sm mt-1">{form.description}</p>}
      </div>

      {/* Questions */}
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6 space-y-6">
        {form.questions.map((q, idx) => renderQuestion(q, idx))}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={saving}
        className="w-full px-4 py-4 bg-[#00FF00] text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#00FF00]/80 transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {saving ? 'Wird gesendet...' : 'Fragebogen absenden'}
      </button>
    </div>
  );
};

export default IntakeFormFill;
