import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getIntakeForms, createIntakeForm, updateIntakeForm, deleteIntakeForm, getIntakeResponses } from '../services/supabase';
import type { IntakeForm, IntakeQuestion } from '../services/supabase';
import IntakeFormBuilder from '../components/IntakeFormBuilder';
import { Plus, ArrowLeft, ClipboardList, Archive, Trash2, Edit3, Eye, Copy, Loader2, CheckCircle2, Users, FileText } from 'lucide-react';

const IntakeForms: React.FC = () => {
  const { user } = useAuth();
  const [forms, setForms] = useState<IntakeForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'edit' | 'preview'>('list');
  const [editingForm, setEditingForm] = useState<IntakeForm | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<IntakeQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const data = await getIntakeForms();
      setForms(data);
      // Fetch response counts per form
      const counts: Record<string, number> = {};
      for (const f of data) {
        try {
          const resp = await getIntakeResponses({ intake_form_id: f.id });
          counts[f.id] = resp.length;
        } catch { counts[f.id] = 0; }
      }
      setResponseCounts(counts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetEditor = () => {
    setEditingForm(null);
    setTitle('');
    setDescription('');
    setQuestions([]);
    setError('');
    setSuccess('');
  };

  const handleNew = () => {
    resetEditor();
    setViewMode('edit');
  };

  const handleEdit = (form: IntakeForm) => {
    setEditingForm(form);
    setTitle(form.title);
    setDescription(form.description);
    setQuestions(form.questions || []);
    setViewMode('edit');
    setError('');
    setSuccess('');
  };

  const handlePreview = (form: IntakeForm) => {
    setEditingForm(form);
    setQuestions(form.questions || []);
    setViewMode('preview');
  };

  const handleDuplicate = async (form: IntakeForm) => {
    if (!user) return;
    try {
      await createIntakeForm({
        title: form.title + ' (Kopie)',
        description: form.description,
        questions: form.questions,
        created_by: user.id,
      });
      await fetchForms();
      setSuccess('Fragebogen dupliziert!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleArchive = async (form: IntakeForm) => {
    if (!confirm(`"${form.title}" archivieren?`)) return;
    try {
      await deleteIntakeForm(form.id);
      await fetchForms();
      setSuccess('Fragebogen archiviert');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!title.trim()) { setError('Titel ist erforderlich'); return; }
    if (questions.length === 0) { setError('Mindestens eine Frage ist erforderlich'); return; }
    const emptyLabels = questions.filter(q => !q.label.trim());
    if (emptyLabels.length > 0) { setError('Alle Fragen müssen einen Text haben'); return; }
    const emptyOpts = questions.filter(q => 
      (q.type === 'single_choice' || q.type === 'multiple_choice') && 
      q.options?.some(o => !o.label.trim())
    );
    if (emptyOpts.length > 0) { setError('Alle Antwortoptionen müssen ausgefüllt sein'); return; }

    setSaving(true);
    setError('');
    try {
      if (editingForm) {
        await updateIntakeForm(editingForm.id, { title: title.trim(), description: description.trim(), questions });
      } else {
        await createIntakeForm({ title: title.trim(), description: description.trim(), questions, created_by: user.id });
      }
      await fetchForms();
      setViewMode('list');
      resetEditor();
      setSuccess(editingForm ? 'Fragebogen aktualisiert!' : 'Fragebogen erstellt!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
    catch { return d; }
  };

  // ==================== LIST VIEW ====================
  if (viewMode === 'list') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Intake-Fragebögen</h1>
            <p className="text-zinc-500 text-sm mt-1">Erstelle und verwalte Fragebögen für deine Coaching-Produkte</p>
          </div>
          <button
            onClick={handleNew}
            className="px-4 py-2.5 bg-[#00FF00] text-black rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#00FF00]/80 transition-colors"
          >
            <Plus size={16} /> Neuer Fragebogen
          </button>
        </div>

        {success && (
          <div className="bg-[#00FF00]/10 border border-[#00FF00]/30 rounded-xl p-3 flex items-center gap-2 text-[#00FF00] text-sm">
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#00FF00]" />
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-16 bg-[#1C1C1E] border border-zinc-800 rounded-2xl">
            <ClipboardList size={48} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-400 font-bold text-lg mb-1">Noch keine Fragebögen</p>
            <p className="text-zinc-600 text-sm mb-6">Erstelle deinen ersten Intake-Fragebogen für deine Coaching-Produkte</p>
            <button
              onClick={handleNew}
              className="px-6 py-3 bg-[#00FF00] text-black rounded-xl font-bold text-sm inline-flex items-center gap-2"
            >
              <Plus size={16} /> Ersten Fragebogen erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {forms.map(form => (
              <div key={form.id} className="bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <ClipboardList size={20} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm truncate">{form.title}</h3>
                    {form.description && <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">{form.description}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-zinc-600 text-xs flex items-center gap-1">
                        <FileText size={12} /> {form.questions?.length || 0} Fragen
                      </span>
                      <span className="text-zinc-600 text-xs flex items-center gap-1">
                        <Users size={12} /> {responseCounts[form.id] || 0} Antworten
                      </span>
                      <span className="text-zinc-600 text-xs">Erstellt: {formatDate(form.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handlePreview(form)} className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-zinc-800" title="Vorschau">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => handleEdit(form)} className="p-2 text-zinc-500 hover:text-[#00FF00] rounded-lg hover:bg-zinc-800" title="Bearbeiten">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDuplicate(form)} className="p-2 text-zinc-500 hover:text-blue-400 rounded-lg hover:bg-zinc-800" title="Duplizieren">
                      <Copy size={16} />
                    </button>
                    <button onClick={() => handleArchive(form)} className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800" title="Archivieren">
                      <Archive size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==================== PREVIEW VIEW ====================
  if (viewMode === 'preview' && editingForm) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setViewMode('list'); resetEditor(); }} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-white">Vorschau: {editingForm.title}</h1>
            <p className="text-zinc-500 text-xs">So sieht der Fragebogen für Athleten aus</p>
          </div>
        </div>

        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6 space-y-5">
          <div>
            <h2 className="text-white font-bold text-lg">{editingForm.title}</h2>
            {editingForm.description && <p className="text-zinc-400 text-sm mt-1">{editingForm.description}</p>}
          </div>
          {(editingForm.questions || []).map((q, idx) => (
            <div key={q.id} className="space-y-2">
              <label className="text-white text-sm font-medium flex items-center gap-1">
                {q.label}
                {q.required && <span className="text-red-400 text-xs">*</span>}
              </label>
              {q.type === 'text' && (
                <textarea
                  disabled
                  placeholder={q.placeholder || 'Deine Antwort...'}
                  className="w-full bg-[#121212] border border-zinc-800 text-zinc-500 rounded-xl px-4 py-3 text-sm resize-none h-20"
                />
              )}
              {q.type === 'number' && (
                <input disabled type="number" placeholder="0" className="w-full bg-[#121212] border border-zinc-800 text-zinc-500 rounded-xl px-4 py-3 text-sm" />
              )}
              {q.type === 'rating' && (
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className="w-10 h-10 rounded-lg border border-zinc-700 bg-[#121212] flex items-center justify-center text-zinc-500 text-sm">{n}</div>
                  ))}
                </div>
              )}
              {q.type === 'single_choice' && (
                <div className="space-y-1.5">
                  {q.options?.map(o => (
                    <div key={o.id} className="flex items-center gap-3 p-2.5 bg-[#121212] rounded-lg border border-zinc-800">
                      <div className="w-4 h-4 rounded-full border border-zinc-600 shrink-0" />
                      <span className="text-zinc-400 text-sm">{o.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {q.type === 'multiple_choice' && (
                <div className="space-y-1.5">
                  {q.options?.map(o => (
                    <div key={o.id} className="flex items-center gap-3 p-2.5 bg-[#121212] rounded-lg border border-zinc-800">
                      <div className="w-4 h-4 rounded border border-zinc-600 shrink-0" />
                      <span className="text-zinc-400 text-sm">{o.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => handleEdit(editingForm)} className="flex-1 px-4 py-3 bg-[#00FF00] text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2">
            <Edit3 size={16} /> Bearbeiten
          </button>
          <button onClick={() => { setViewMode('list'); resetEditor(); }} className="px-4 py-3 bg-zinc-800 text-white rounded-xl font-bold text-sm">
            Zurück
          </button>
        </div>
      </div>
    );
  }

  // ==================== EDIT VIEW ====================
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => { setViewMode('list'); resetEditor(); }} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-extrabold text-white">
          {editingForm ? 'Fragebogen bearbeiten' : 'Neuer Fragebogen'}
        </h1>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Title & Description */}
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div>
          <label className="text-zinc-400 text-sm block mb-1">Titel *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="z.B. Standard Coaching Intake"
            className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none text-sm"
          />
        </div>
        <div>
          <label className="text-zinc-400 text-sm block mb-1">Beschreibung (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Beschreibe den Zweck des Fragebogens..."
            rows={2}
            className="w-full bg-[#121212] border border-zinc-800 text-white rounded-xl px-4 py-3 focus:border-[#00FF00] outline-none text-sm resize-none"
          />
        </div>
      </div>

      {/* Questions Builder */}
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6">
        <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
          <ClipboardList size={16} className="text-blue-400" /> Fragen ({questions.length})
        </h2>
        <IntakeFormBuilder questions={questions} onChange={setQuestions} />
      </div>

      {/* Save */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-3 bg-[#00FF00] text-black rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#00FF00]/80 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          {saving ? 'Speichern...' : (editingForm ? 'Änderungen speichern' : 'Fragebogen erstellen')}
        </button>
        <button
          onClick={() => { setViewMode('list'); resetEditor(); }}
          className="px-6 py-3 bg-zinc-800 text-white rounded-xl font-bold text-sm hover:bg-zinc-700"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
};

export default IntakeForms;
