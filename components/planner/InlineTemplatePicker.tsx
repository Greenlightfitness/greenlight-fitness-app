import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Layers, 
  Calendar, 
  CalendarDays, 
  ChevronDown,
  Sparkles,
  Zap
} from 'lucide-react';
import TemplateQuickSearch from './TemplateQuickSearch';

type PickerMode = 'block' | 'session' | 'week';

interface InlineTemplatePickerProps {
  mode: PickerMode;
  onSelect: (template: any) => void;
  onCreateNew: () => void;
  variant?: 'button' | 'compact' | 'card';
  label?: string;
  className?: string;
}

const MODE_CONFIG = {
  block: { 
    icon: Layers, 
    label: 'Block hinzufügen',
    shortLabel: 'Block',
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
  },
  session: { 
    icon: Calendar, 
    label: 'Session hinzufügen',
    shortLabel: 'Session',
    color: 'text-purple-400',
    bg: 'bg-purple-500/20',
  },
  week: { 
    icon: CalendarDays, 
    label: 'Woche hinzufügen',
    shortLabel: 'Woche',
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
  },
};

export const InlineTemplatePicker: React.FC<InlineTemplatePickerProps> = ({
  mode,
  onSelect,
  onCreateNew,
  variant = 'button',
  label,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const config = MODE_CONFIG[mode];
  const Icon = config.icon;

  const handleOpen = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        x: Math.min(rect.left, window.innerWidth - 440),
        y: Math.min(rect.bottom + 8, window.innerHeight - 500),
      });
    }
    setIsOpen(true);
  };

  const handleSelect = (template: any) => {
    onSelect(template);
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    onCreateNew();
    setIsOpen(false);
  };

  // Compact variant - small icon button
  if (variant === 'compact') {
    return (
      <>
        <button
          ref={buttonRef}
          onClick={handleOpen}
          className={`w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-[#00ff94] text-gray-400 hover:text-black transition-all group ${className}`}
          title={config.label}
        >
          <Plus size={16} />
        </button>
        
        <TemplateQuickSearch
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          mode={mode}
          onSelectTemplate={handleSelect}
          onCreateNew={handleCreateNew}
          position={position}
        />
      </>
    );
  }

  // Card variant - larger clickable area
  if (variant === 'card') {
    return (
      <>
        <button
          ref={buttonRef}
          onClick={handleOpen}
          className={`w-full p-4 border-2 border-dashed border-gray-700 rounded-xl hover:border-[#00ff94] hover:bg-[#00ff94]/5 transition-all group ${className}`}
        >
          <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-[#00ff94]">
            <div className={`p-3 rounded-xl ${config.bg} group-hover:bg-[#00ff94]/20`}>
              <Icon size={24} className={`${config.color} group-hover:text-[#00ff94]`} />
            </div>
            <span className="text-sm font-medium">{label || config.label}</span>
            <span className="text-xs text-gray-600 flex items-center gap-1">
              <Sparkles size={10} />
              Template oder neu
            </span>
          </div>
        </button>
        
        <TemplateQuickSearch
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          mode={mode}
          onSelectTemplate={handleSelect}
          onCreateNew={handleCreateNew}
          position={position}
        />
      </>
    );
  }

  // Default button variant
  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className={`flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl hover:border-[#00ff94] hover:bg-gray-800/80 text-gray-300 hover:text-white transition-all group ${className}`}
      >
        <div className={`p-1.5 rounded-lg ${config.bg}`}>
          <Icon size={14} className={config.color} />
        </div>
        <span className="font-medium text-sm">{label || config.shortLabel}</span>
        <ChevronDown size={14} className="text-gray-500 group-hover:text-[#00ff94]" />
      </button>
      
      <TemplateQuickSearch
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        mode={mode}
        onSelectTemplate={handleSelect}
        onCreateNew={handleCreateNew}
        position={position}
      />
    </>
  );
};

// Quick Add Bar - horizontal bar with all three options
interface QuickAddBarProps {
  onAddBlock: (template?: any) => void;
  onAddSession: (template?: any) => void;
  onAddWeek: (template?: any) => void;
  showWeek?: boolean;
  showSession?: boolean;
  showBlock?: boolean;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  onAddBlock,
  onAddSession,
  onAddWeek,
  showWeek = true,
  showSession = true,
  showBlock = true,
}) => {
  return (
    <div className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-xl border border-gray-800">
      <span className="text-xs text-gray-500 px-2 flex items-center gap-1">
        <Zap size={12} className="text-[#00ff94]" />
        Schnell hinzufügen:
      </span>
      
      {showBlock && (
        <InlineTemplatePicker
          mode="block"
          onSelect={(t) => onAddBlock(t)}
          onCreateNew={() => onAddBlock()}
        />
      )}
      
      {showSession && (
        <InlineTemplatePicker
          mode="session"
          onSelect={(t) => onAddSession(t)}
          onCreateNew={() => onAddSession()}
        />
      )}
      
      {showWeek && (
        <InlineTemplatePicker
          mode="week"
          onSelect={(t) => onAddWeek(t)}
          onCreateNew={() => onAddWeek()}
        />
      )}
    </div>
  );
};

export default InlineTemplatePicker;
