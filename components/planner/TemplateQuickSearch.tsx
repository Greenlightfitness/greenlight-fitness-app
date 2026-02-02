import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Layers, 
  Calendar, 
  CalendarDays, 
  Plus,
  Clock,
  Tag,
  Sparkles,
  X,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getBlockTemplates,
  getSessionTemplates,
  getWeekTemplates,
} from '../../services/supabase';

type TemplateType = 'block' | 'session' | 'week' | 'all';

interface TemplateQuickSearchProps {
  isOpen: boolean;
  onClose: () => void;
  mode: TemplateType;
  onSelectTemplate: (template: any, type: TemplateType) => void;
  onCreateNew: () => void;
  position?: { x: number; y: number };
  anchorRef?: React.RefObject<HTMLElement>;
}

interface SearchResult {
  id: string;
  name: string;
  description?: string;
  type: TemplateType;
  tags?: string[];
  estimatedDurationMin?: number;
  blockType?: string;
  isSystemTemplate?: boolean;
  data: any;
  score: number;
}

const TYPE_CONFIG = {
  block: { icon: Layers, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Block' },
  session: { icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Session' },
  week: { icon: CalendarDays, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Woche' },
  all: { icon: Search, color: 'text-gray-400', bg: 'bg-gray-500/20', label: 'Alle' },
};

export const TemplateQuickSearch: React.FC<TemplateQuickSearchProps> = ({
  isOpen,
  onClose,
  mode,
  onSelectTemplate,
  onCreateNew,
  position,
  anchorRef,
}) => {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [allTemplates, setAllTemplates] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeType, setActiveType] = useState<TemplateType>(mode);

  // Load templates
  useEffect(() => {
    if (isOpen && user?.id) {
      loadTemplates();
    }
  }, [isOpen, user?.id]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActiveType(mode);
    }
  }, [isOpen, mode]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const loadTemplates = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [blocks, sessions, weeks] = await Promise.all([
        getBlockTemplates(user.id),
        getSessionTemplates(user.id),
        getWeekTemplates(user.id),
      ]);

      const templates: SearchResult[] = [
        ...blocks.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          type: 'block' as TemplateType,
          tags: t.tags,
          blockType: t.block_type,
          isSystemTemplate: t.is_system_template,
          data: t.block_data,
          score: 0,
        })),
        ...sessions.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          type: 'session' as TemplateType,
          tags: t.tags,
          estimatedDurationMin: t.estimated_duration_min,
          isSystemTemplate: t.is_system_template,
          data: t.session_data,
          score: 0,
        })),
        ...weeks.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          type: 'week' as TemplateType,
          tags: t.tags,
          isSystemTemplate: t.is_system_template,
          data: t.week_data,
          score: 0,
        })),
      ];

      setAllTemplates(templates);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Semantic search scoring
  const searchTemplates = (templates: SearchResult[], searchQuery: string): SearchResult[] => {
    if (!searchQuery.trim()) {
      return templates.map(t => ({ ...t, score: 0 }));
    }

    const queryLower = searchQuery.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 1);

    return templates.map(template => {
      let score = 0;
      const nameLower = template.name.toLowerCase();
      const descLower = template.description?.toLowerCase() || '';
      const tagsLower = template.tags?.map(t => t.toLowerCase()) || [];

      // Exact name match - highest score
      if (nameLower === queryLower) score += 100;
      // Name starts with query
      else if (nameLower.startsWith(queryLower)) score += 80;
      // Name contains query
      else if (nameLower.includes(queryLower)) score += 60;

      // Word matching
      queryWords.forEach(word => {
        if (nameLower.includes(word)) score += 30;
        if (descLower.includes(word)) score += 15;
        if (tagsLower.some(tag => tag.includes(word))) score += 25;
      });

      // Tag exact match bonus
      tagsLower.forEach(tag => {
        if (queryLower.includes(tag) || tag.includes(queryLower)) {
          score += 35;
        }
      });

      // System template slight bonus for relevance
      if (template.isSystemTemplate) score += 5;

      return { ...template, score };
    }).sort((a, b) => b.score - a.score);
  };

  // Filtered and searched results
  const filteredResults = useMemo(() => {
    let templates = allTemplates;
    
    // Filter by type if not 'all'
    if (activeType !== 'all') {
      templates = templates.filter(t => t.type === activeType);
    }

    // Apply search
    const searched = searchTemplates(templates, query);
    
    // Only show scored results if there's a query
    if (query.trim()) {
      return searched.filter(t => t.score > 0).slice(0, 10);
    }
    
    return searched.slice(0, 10);
  }, [allTemplates, query, activeType]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredResults.length));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex === 0) {
          onCreateNew();
        } else if (filteredResults[selectedIndex - 1]) {
          const result = filteredResults[selectedIndex - 1];
          onSelectTemplate(result.data, result.type);
        }
        break;
      case 'Escape':
        onClose();
        break;
      case 'Tab':
        e.preventDefault();
        // Cycle through types
        const types: TemplateType[] = mode === 'all' ? ['all', 'block', 'session', 'week'] : [mode];
        if (types.length > 1) {
          const currentIndex = types.indexOf(activeType);
          setActiveType(types[(currentIndex + 1) % types.length]);
        }
        break;
    }
  };

  if (!isOpen) return null;

  const config = TYPE_CONFIG[mode];

  return (
    <div 
      ref={containerRef}
      className="fixed z-[100] w-[420px] bg-[#1a1a1a] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
      style={{
        top: position?.y ?? '20%',
        left: position?.x ?? '50%',
        transform: position ? 'none' : 'translateX(-50%)',
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Search Header */}
      <div className="p-3 border-b border-gray-800">
        <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
          <Search size={18} className="text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={`${config.label} suchen... (↑↓ navigieren, Enter auswählen)`}
            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-500 hover:text-white">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex px-2 py-0.5 bg-gray-700 text-gray-400 text-xs rounded">Esc</kbd>
        </div>

        {/* Type Filter Tabs (only if mode is 'all') */}
        {mode === 'all' && (
          <div className="flex gap-1 mt-3">
            {(['all', 'block', 'session', 'week'] as TemplateType[]).map(type => {
              const typeConfig = TYPE_CONFIG[type];
              return (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeType === type
                      ? 'bg-[#00ff94] text-black'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  <typeConfig.icon size={12} />
                  {typeConfig.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-[#00ff94] border-t-transparent rounded-full mx-auto mb-2"></div>
            Laden...
          </div>
        ) : (
          <>
            {/* Create New Option */}
            <button
              onClick={onCreateNew}
              className={`w-full flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors ${
                selectedIndex === 0 ? 'bg-[#00ff94]/10 border-l-2 border-[#00ff94]' : ''
              }`}
            >
              <div className={`p-2 rounded-lg ${config.bg}`}>
                <Plus size={18} className={config.color} />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-white flex items-center gap-2">
                  <Zap size={14} className="text-[#00ff94]" />
                  Neu erstellen
                </div>
                <div className="text-xs text-gray-500">
                  Leeren {config.label} erstellen
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-600" />
            </button>

            {/* Divider */}
            {filteredResults.length > 0 && (
              <div className="px-4 py-2 bg-gray-800/50">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  {query ? `${filteredResults.length} Ergebnisse` : 'Vorlagen'}
                </span>
              </div>
            )}

            {/* Template Results */}
            {filteredResults.map((result, index) => {
              const resultConfig = TYPE_CONFIG[result.type];
              const isSelected = selectedIndex === index + 1;
              
              return (
                <button
                  key={result.id}
                  onClick={() => onSelectTemplate(result.data, result.type)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors ${
                    isSelected ? 'bg-[#00ff94]/10 border-l-2 border-[#00ff94]' : ''
                  }`}
                >
                  <div className={`p-2 rounded-lg ${resultConfig.bg}`}>
                    <resultConfig.icon size={18} className={resultConfig.color} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium text-white flex items-center gap-2 truncate">
                      {result.name}
                      {result.isSystemTemplate && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">
                          System
                        </span>
                      )}
                      {query && result.score > 0 && (
                        <span className="text-[9px] text-[#00ff94] opacity-50">
                          {Math.round(result.score)}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {result.description || `${resultConfig.label} Template`}
                    </div>
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[9px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Tag size={8} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {result.estimatedDurationMin && (
                      <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Clock size={10} />
                        {result.estimatedDurationMin}min
                      </span>
                    )}
                    {result.blockType && result.blockType !== 'Normal' && (
                      <span className="text-[9px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
                        {result.blockType}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Empty State */}
            {!loading && filteredResults.length === 0 && query && (
              <div className="p-8 text-center text-gray-500">
                <Search size={32} className="mx-auto mb-2 opacity-30" />
                <p>Keine Templates gefunden für "{query}"</p>
                <button
                  onClick={onCreateNew}
                  className="mt-3 text-[#00ff94] text-sm hover:underline"
                >
                  Neuen {config.label} erstellen →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-800 bg-gray-900/50 flex items-center justify-between text-[10px] text-gray-500">
        <div className="flex items-center gap-3">
          <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">↑↓</kbd> Navigieren</span>
          <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">Enter</kbd> Auswählen</span>
          {mode === 'all' && <span><kbd className="px-1 py-0.5 bg-gray-800 rounded">Tab</kbd> Filter</span>}
        </div>
        <span className="flex items-center gap-1">
          <Sparkles size={10} className="text-[#00ff94]" />
          Semantische Suche
        </span>
      </div>
    </div>
  );
};

export default TemplateQuickSearch;
