import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ChevronRight, 
  Lock, 
  Unlock,
  CheckCircle,
  Play,
  Info,
  Calendar,
  Users
} from 'lucide-react';
import { getProductModules } from '../../services/supabase';

interface ProductModuleSelectorProps {
  productId: string;
  productTitle: string;
  coachingType: 'ONE_TO_ONE' | 'GROUP_SYNC' | 'GROUP_ASYNC';
  onSelectModule: (module: any, startDate: string) => void;
  onCancel?: () => void;
}

export const ProductModuleSelector: React.FC<ProductModuleSelectorProps> = ({
  productId,
  productTitle,
  coachingType,
  onSelectModule,
  onCancel,
}) => {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    loadModules();
  }, [productId]);

  const loadModules = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await getProductModules(productId);
      setModules(data);
      // Auto-select first entry point
      const firstEntryPoint = data.find((m: any) => m.is_entry_point);
      if (firstEntryPoint) {
        setSelectedModule(firstEntryPoint);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedModule && startDate) {
      onSelectModule(selectedModule, startDate);
    }
  };

  const canSelectModule = (module: any) => {
    // Can select if it's an entry point or if GROUP_ASYNC allows choosing
    if (module.is_entry_point) return true;
    if (coachingType === 'GROUP_ASYNC') return true;
    return false;
  };

  const getCoachingTypeLabel = () => {
    switch (coachingType) {
      case 'ONE_TO_ONE': return { label: '1:1 Coaching', icon: Users, color: 'text-blue-400' };
      case 'GROUP_SYNC': return { label: 'Gruppen-Coaching (Sync)', icon: Users, color: 'text-purple-400' };
      case 'GROUP_ASYNC': return { label: 'Gruppen-Coaching (Async)', icon: Users, color: 'text-[#00ff94]' };
    }
  };

  const typeInfo = getCoachingTypeLabel();

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#00ff94] border-t-transparent rounded-full mx-auto"></div>
        <p className="text-gray-400 mt-3">Lade Module...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-[#00ff94]/10 to-transparent">
        <div className="flex items-center gap-3 mb-2">
          <Package className="text-[#00ff94]" size={24} />
          <h2 className="text-xl font-bold text-white">{productTitle}</h2>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <typeInfo.icon size={14} className={typeInfo.color} />
          <span className={typeInfo.color}>{typeInfo.label}</span>
        </div>
      </div>

      {/* Info Banner for GROUP_ASYNC */}
      {coachingType === 'GROUP_ASYNC' && (
        <div className="mx-6 mt-4 p-3 bg-[#00ff94]/10 border border-[#00ff94]/30 rounded-lg flex items-start gap-2">
          <Info size={16} className="text-[#00ff94] mt-0.5" />
          <p className="text-sm text-[#00ff94]">
            Bei asynchronem Gruppencoaching kannst du frei wählen, mit welchem Modul du startest.
            Die anderen Module werden nach Abschluss freigeschaltet.
          </p>
        </div>
      )}

      {/* Module List */}
      <div className="p-6">
        <h3 className="text-sm font-medium text-gray-400 uppercase mb-4">
          {modules.length} Module verfügbar
        </h3>
        
        <div className="space-y-3">
          {modules.map((module, index) => {
            const isSelectable = canSelectModule(module);
            const isSelected = selectedModule?.id === module.id;
            
            return (
              <div
                key={module.id}
                onClick={() => isSelectable && setSelectedModule(module)}
                className={`relative p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-[#00ff94] bg-[#00ff94]/10'
                    : isSelectable
                    ? 'border-gray-700 bg-gray-800 hover:border-gray-600 cursor-pointer'
                    : 'border-gray-800 bg-gray-800/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Module Number */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    isSelected
                      ? 'bg-[#00ff94] text-black'
                      : isSelectable
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-800 text-gray-500'
                  }`}>
                    {module.module_order}
                  </div>

                  {/* Module Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white">
                        {module.module_name || `Modul ${module.module_order}`}
                      </h4>
                      {module.is_entry_point && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                          Einstieg möglich
                        </span>
                      )}
                    </div>
                    {module.plan && (
                      <p className="text-sm text-gray-400 mt-1">
                        {module.plan.name}
                        {module.plan.description && ` - ${module.plan.description}`}
                      </p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div>
                    {isSelected ? (
                      <CheckCircle className="text-[#00ff94]" size={24} />
                    ) : isSelectable ? (
                      <Unlock className="text-gray-500" size={20} />
                    ) : (
                      <Lock className="text-gray-600" size={20} />
                    )}
                  </div>
                </div>

                {/* Connection Line */}
                {index < modules.length - 1 && (
                  <div className="absolute left-9 top-full w-0.5 h-3 bg-gray-700 z-10" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Start Date Selection */}
      {selectedModule && (
        <div className="px-6 pb-6">
          <div className="p-4 bg-gray-800 rounded-xl">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Calendar size={14} className="inline mr-2" />
              Startdatum wählen
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ff94]/50"
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-6 border-t border-gray-800 flex justify-between gap-4">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors"
          >
            Abbrechen
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={!selectedModule || !startDate}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#00ff94] text-black rounded-xl font-semibold hover:bg-[#00ff94]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Play size={18} />
          Training starten
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default ProductModuleSelector;
