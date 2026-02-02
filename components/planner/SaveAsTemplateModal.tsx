import React, { useState } from 'react';
import { 
  Save, 
  X, 
  Tag, 
  Layers, 
  Calendar,
  CalendarDays,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  createBlockTemplate,
  createSessionTemplate,
  createWeekTemplate,
} from '../../services/supabase';

type TemplateType = 'block' | 'session' | 'week';

interface SaveAsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TemplateType;
  data: any;
  onSaved?: (template: any) => void;
}

const TYPE_CONFIG = {
  block: {
    title: 'Block als Template speichern',
    icon: Layers,
    dataKey: 'block_data',
  },
  session: {
    title: 'Session als Template speichern',
    icon: Calendar,
    dataKey: 'session_data',
  },
  week: {
    title: 'Woche als Template speichern',
    icon: CalendarDays,
    dataKey: 'week_data',
  },
};

export const SaveAsTemplateModal: React.FC<SaveAsTemplateModalProps> = ({
  isOpen,
  onClose,
  type,
  data,
  onSaved,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState<number | undefined>();
  const [saving, setSaving] = useState(false);

  const config = TYPE_CONFIG[type];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
      setTags([...tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSave = async () => {
    if (!name.trim() || !user?.id) return;
    setSaving(true);

    try {
      const baseTemplate = {
        coach_id: user.id,
        name: name.trim(),
        description: description.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      let savedTemplate;

      if (type === 'block') {
        savedTemplate = await createBlockTemplate({
          ...baseTemplate,
          block_type: data.type || 'Normal',
          block_data: data,
        });
      } else if (type === 'session') {
        savedTemplate = await createSessionTemplate({
          ...baseTemplate,
          estimated_duration_min: estimatedDuration,
          session_data: data,
        });
      } else {
        savedTemplate = await createWeekTemplate({
          ...baseTemplate,
          focus: data.focus,
          sessions_per_week: data.sessions?.length || 0,
          week_data: data,
        });
      }

      onSaved?.(savedTemplate);
      onClose();
      
      // Reset form
      setName('');
      setDescription('');
      setTags([]);
      setEstimatedDuration(undefined);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Fehler beim Speichern des Templates');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 w-full max-w-md">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00ff94]/20 rounded-lg">
              <config.icon size={20} className="text-[#00ff94]" />
            </div>
            <h3 className="text-lg font-semibold text-white">{config.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Template-Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Standard Warm-Up, PPL Push Day"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00ff94]/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Beschreibung
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kurze Beschreibung des Templates..."
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00ff94]/50 resize-none"
            />
          </div>

          {/* Estimated Duration (for sessions) */}
          {type === 'session' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Geschätzte Dauer (Minuten)
              </label>
              <input
                type="number"
                value={estimatedDuration || ''}
                onChange={(e) => setEstimatedDuration(parseInt(e.target.value) || undefined)}
                placeholder="z.B. 45"
                min={1}
                max={300}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00ff94]/50"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Tag hinzufügen..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00ff94]/50"
              />
              <button
                onClick={handleAddTag}
                className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                <Plus size={18} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-sm bg-[#00ff94]/20 text-[#00ff94] px-3 py-1 rounded-full"
                  >
                    <Tag size={12} />
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <span className="text-xs text-gray-500 uppercase">Daten-Vorschau:</span>
            <pre className="mt-2 text-xs text-gray-400 overflow-x-auto max-h-24">
              {JSON.stringify(data, null, 2).slice(0, 200)}...
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#00ff94] text-black rounded-lg font-medium hover:bg-[#00ff94]/90 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Speichern...' : 'Als Template speichern'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveAsTemplateModal;
