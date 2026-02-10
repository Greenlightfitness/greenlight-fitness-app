import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCoachNotes, createCoachNote, updateCoachNote, deleteCoachNote } from '../services/supabase';
import { StickyNote, Plus, Pin, Trash2, Pencil, Check, X, Loader2, Tag } from 'lucide-react';

interface CoachNotesPanelProps {
  athleteId: string;
  athleteName?: string;
}

interface Note {
  id: string;
  title: string | null;
  content: string;
  tags: string[] | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

const CoachNotesPanel: React.FC<CoachNotesPanelProps> = ({ athleteId, athleteName }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New/Edit note state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formPinned, setFormPinned] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (user && athleteId) loadNotes();
  }, [user, athleteId]);

  const loadNotes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getCoachNotes(user.id, athleteId);
      setNotes(data);
    } catch (e) {
      console.error('Error loading coach notes:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !formContent.trim()) return;
    setSaving(true);

    try {
      const tags = formTags.trim() ? formTags.split(',').map(t => t.trim()).filter(Boolean) : undefined;

      if (editingId) {
        await updateCoachNote(editingId, {
          title: formTitle.trim() || undefined,
          content: formContent.trim(),
          tags,
          is_pinned: formPinned,
        });
      } else {
        await createCoachNote({
          coach_id: user.id,
          athlete_id: athleteId,
          title: formTitle.trim() || undefined,
          content: formContent.trim(),
          tags,
          is_pinned: formPinned,
        });
      }

      resetForm();
      await loadNotes();
    } catch (e) {
      console.error('Error saving note:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCoachNote(id);
      setDeleteConfirm(null);
      await loadNotes();
    } catch (e) {
      console.error('Error deleting note:', e);
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      await updateCoachNote(note.id, { is_pinned: !note.is_pinned });
      await loadNotes();
    } catch (e) {
      console.error('Error toggling pin:', e);
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setFormTitle(note.title || '');
    setFormContent(note.content);
    setFormTags(note.tags?.join(', ') || '');
    setFormPinned(note.is_pinned);
    setShowNewForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setShowNewForm(false);
    setFormTitle('');
    setFormContent('');
    setFormTags('');
    setFormPinned(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-zinc-500" size={18} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-white font-bold text-sm flex items-center gap-2">
          <StickyNote size={16} className="text-yellow-400" />
          Notizen {athleteName && <span className="text-zinc-500 font-normal">– {athleteName}</span>}
        </h4>
        {!showNewForm && (
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-1 text-xs text-[#00FF00] hover:text-[#00FF00]/80 font-medium"
          >
            <Plus size={14} /> Neue Notiz
          </button>
        )}
      </div>

      {/* New/Edit Form */}
      {showNewForm && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 space-y-2 animate-in fade-in slide-in-from-top-2">
          <input
            type="text"
            placeholder="Titel (optional)"
            value={formTitle}
            onChange={e => setFormTitle(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:border-[#00FF00] outline-none"
          />
          <textarea
            placeholder="Notiz schreiben..."
            value={formContent}
            onChange={e => setFormContent(e.target.value)}
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:border-[#00FF00] outline-none resize-none"
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Tags (kommagetrennt)"
              value={formTags}
              onChange={e => setFormTags(e.target.value)}
              className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-1.5 text-xs focus:border-[#00FF00] outline-none"
            />
            <button
              onClick={() => setFormPinned(!formPinned)}
              className={`p-1.5 rounded-lg transition-colors ${formPinned ? 'bg-yellow-500/20 text-yellow-400' : 'bg-zinc-800 text-zinc-500 hover:text-yellow-400'}`}
              title="Anheften"
            >
              <Pin size={14} />
            </button>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={resetForm} className="px-3 py-1.5 text-zinc-400 text-xs hover:text-white">
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !formContent.trim()}
              className="px-3 py-1.5 bg-[#00FF00] text-black rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              {editingId ? 'Aktualisieren' : 'Speichern'}
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 && !showNewForm ? (
        <div className="text-center py-6">
          <StickyNote size={24} className="mx-auto text-zinc-700 mb-2" />
          <p className="text-zinc-500 text-xs">Noch keine Notizen für diesen Athleten.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map(note => (
            <div
              key={note.id}
              className={`bg-zinc-900/50 border rounded-xl p-3 transition-all ${
                note.is_pinned ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-zinc-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {note.title && (
                    <p className="text-white font-bold text-sm mb-1 flex items-center gap-1.5">
                      {note.is_pinned && <Pin size={12} className="text-yellow-400 shrink-0" />}
                      {note.title}
                    </p>
                  )}
                  {!note.title && note.is_pinned && (
                    <Pin size={12} className="text-yellow-400 mb-1" />
                  )}
                  <p className="text-zinc-300 text-sm whitespace-pre-wrap">{note.content}</p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Tag size={8} /> {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-zinc-600 mt-2">{formatDate(note.updated_at || note.created_at)}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleTogglePin(note)}
                    className={`p-1 rounded hover:bg-zinc-800 transition-colors ${note.is_pinned ? 'text-yellow-400' : 'text-zinc-600 hover:text-yellow-400'}`}
                  >
                    <Pin size={12} />
                  </button>
                  <button
                    onClick={() => startEdit(note)}
                    className="p-1 rounded text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors"
                  >
                    <Pencil size={12} />
                  </button>
                  {deleteConfirm === note.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(note.id)} className="p-1 rounded text-red-400 hover:bg-red-500/20">
                        <Check size={12} />
                      </button>
                      <button onClick={() => setDeleteConfirm(null)} className="p-1 rounded text-zinc-500 hover:bg-zinc-800">
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(note.id)}
                      className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoachNotesPanel;
