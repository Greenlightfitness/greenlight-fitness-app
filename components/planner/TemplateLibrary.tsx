import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Calendar, 
  CalendarDays, 
  Plus, 
  Search, 
  Tag, 
  Copy, 
  Trash2, 
  Edit,
  Clock,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getBlockTemplates,
  getSessionTemplates,
  getWeekTemplates,
  createBlockTemplate,
  createSessionTemplate,
  createWeekTemplate,
  deleteBlockTemplate,
  deleteSessionTemplate,
  deleteWeekTemplate,
} from '../../services/supabase';

type TemplateType = 'block' | 'session' | 'week';

interface TemplateLibraryProps {
  onSelectTemplate?: (template: any, type: TemplateType) => void;
  selectionMode?: boolean;
  filterType?: TemplateType;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate,
  selectionMode = false,
  filterType,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TemplateType>(filterType || 'block');
  const [searchQuery, setSearchQuery] = useState('');
  const [blockTemplates, setBlockTemplates] = useState<any[]>([]);
  const [sessionTemplates, setSessionTemplates] = useState<any[]>([]);
  const [weekTemplates, setWeekTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [user?.id]);

  const loadTemplates = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [blocks, sessions, weeks] = await Promise.all([
        getBlockTemplates(user.id),
        getSessionTemplates(user.id),
        getWeekTemplates(user.id),
      ]);
      setBlockTemplates(blocks);
      setSessionTemplates(sessions);
      setWeekTemplates(weeks);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: TemplateType) => {
    if (!confirm('Template wirklich löschen?')) return;
    try {
      if (type === 'block') {
        await deleteBlockTemplate(id);
        setBlockTemplates(prev => prev.filter(t => t.id !== id));
      } else if (type === 'session') {
        await deleteSessionTemplate(id);
        setSessionTemplates(prev => prev.filter(t => t.id !== id));
      } else {
        await deleteWeekTemplate(id);
        setWeekTemplates(prev => prev.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const getFilteredTemplates = () => {
    let templates: any[] = [];
    if (activeTab === 'block') templates = blockTemplates;
    else if (activeTab === 'session') templates = sessionTemplates;
    else templates = weekTemplates;

    if (!searchQuery) return templates;
    
    const query = searchQuery.toLowerCase();
    return templates.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.tags?.some((tag: string) => tag.toLowerCase().includes(query))
    );
  };

  const tabs = [
    { id: 'block' as TemplateType, label: 'Blöcke', icon: Layers, count: blockTemplates.length },
    { id: 'session' as TemplateType, label: 'Sessions', icon: Calendar, count: sessionTemplates.length },
    { id: 'week' as TemplateType, label: 'Wochen', icon: CalendarDays, count: weekTemplates.length },
  ];

  const filteredTemplates = getFilteredTemplates();

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">Template-Bibliothek</h2>
        
        {/* Tabs */}
        {!filterType && (
          <div className="flex gap-2 mb-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#00ff94] text-black'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded text-xs ${
                  activeTab === tab.id ? 'bg-black/20' : 'bg-gray-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Templates durchsuchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00ff94]/50"
          />
        </div>
      </div>

      {/* Template List */}
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Laden...</div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Layers size={40} className="mx-auto mb-2 opacity-50" />
            <p>Keine Templates gefunden</p>
            <p className="text-sm">Erstelle dein erstes Template!</p>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <div
              key={template.id}
              className={`bg-gray-800 rounded-lg border border-gray-700 overflow-hidden transition-all ${
                selectionMode ? 'cursor-pointer hover:border-[#00ff94]' : ''
              }`}
              onClick={() => selectionMode && onSelectTemplate?.(template, activeTab)}
            >
              {/* Template Header */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    template.is_system_template ? 'bg-purple-500/20' : 'bg-[#00ff94]/20'
                  }`}>
                    {activeTab === 'block' && <Layers size={18} className={template.is_system_template ? 'text-purple-400' : 'text-[#00ff94]'} />}
                    {activeTab === 'session' && <Calendar size={18} className={template.is_system_template ? 'text-purple-400' : 'text-[#00ff94]'} />}
                    {activeTab === 'week' && <CalendarDays size={18} className={template.is_system_template ? 'text-purple-400' : 'text-[#00ff94]'} />}
                  </div>
                  <div>
                    <h3 className="font-medium text-white flex items-center gap-2">
                      {template.name}
                      {template.is_system_template && (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                          System
                        </span>
                      )}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-gray-400 line-clamp-1">{template.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {template.estimated_duration_min && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      {template.estimated_duration_min}min
                    </span>
                  )}
                  {!selectionMode && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(expandedId === template.id ? null : template.id);
                        }}
                        className="p-1.5 rounded hover:bg-gray-700 text-gray-400"
                      >
                        {expandedId === template.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {!template.is_system_template && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(template.id, activeTab);
                          }}
                          className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </>
                  )}
                  {selectionMode && (
                    <button className="px-3 py-1 bg-[#00ff94] text-black rounded text-sm font-medium">
                      Verwenden
                    </button>
                  )}
                </div>
              </div>

              {/* Tags */}
              {template.tags?.length > 0 && (
                <div className="px-3 pb-2 flex flex-wrap gap-1">
                  {template.tags.map((tag: string, idx: number) => (
                    <span key={idx} className="flex items-center gap-1 text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                      <Tag size={10} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Expanded Content */}
              {expandedId === template.id && !selectionMode && (
                <div className="border-t border-gray-700 p-3 bg-gray-800/50">
                  <pre className="text-xs text-gray-400 overflow-x-auto">
                    {JSON.stringify(
                      template.block_data || template.session_data || template.week_data,
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TemplateLibrary;
