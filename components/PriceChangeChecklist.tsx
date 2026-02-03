import React, { useState } from 'react';
import { AlertTriangle, Scale, CheckCircle, Clock, Mail, Users, CreditCard, ExternalLink, Info, X } from 'lucide-react';

interface PriceChangeChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  changeType: 'price_increase' | 'price_decrease' | 'interval_change' | 'name_change';
  oldValue: string;
  newValue: string;
  productTitle: string;
  hasActiveSubscriptions?: boolean;
}

const PriceChangeChecklist: React.FC<PriceChangeChecklistProps> = ({
  isOpen,
  onClose,
  onConfirm,
  changeType,
  oldValue,
  newValue,
  productTitle,
  hasActiveSubscriptions = false,
}) => {
  const [checklist, setChecklist] = useState({
    understand_impact: false,
    existing_unchanged: false,
    will_notify_customers: false,
    stripe_manual: false,
    legal_compliance: false,
  });

  const isPriceIncrease = changeType === 'price_increase';
  const requiresAllChecks = isPriceIncrease && hasActiveSubscriptions;

  const allChecked = requiresAllChecks 
    ? Object.values(checklist).every(v => v) 
    : checklist.understand_impact;

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getChangeDescription = () => {
    switch (changeType) {
      case 'price_increase':
        return { label: 'Preiserhöhung', color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' };
      case 'price_decrease':
        return { label: 'Preissenkung', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' };
      case 'interval_change':
        return { label: 'Intervall-Änderung', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' };
      case 'name_change':
        return { label: 'Namensänderung', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' };
      default:
        return { label: 'Änderung', color: 'text-zinc-400', bgColor: 'bg-zinc-500/10', borderColor: 'border-zinc-500/30' };
    }
  };

  const change = getChangeDescription();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#1C1C1E] to-black border border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl my-4">
        
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-amber-500/10 to-transparent">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white p-2"
          >
            <X size={20} />
          </button>
          <div className="w-14 h-14 mx-auto mb-4 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30">
            <AlertTriangle size={28} className="text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-white text-center">Produkt-Änderung bestätigen</h2>
          <p className="text-zinc-400 text-sm text-center mt-2">
            Bitte prüfe die Checkliste vor dem Speichern
          </p>
        </div>

        {/* Change Summary */}
        <div className="px-6 py-4">
          <div className={`${change.bgColor} border ${change.borderColor} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500 font-bold uppercase">{change.label}</span>
              <span className={`text-xs ${change.color} font-bold`}>{productTitle}</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-zinc-400 line-through">{oldValue}</span>
              <span className="text-white">→</span>
              <span className={`${change.color} font-bold`}>{newValue}</span>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="px-6 py-4 space-y-3">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mb-3">
            Checkliste {requiresAllChecks && <span className="text-red-400">(alle Punkte erforderlich)</span>}
          </p>

          {/* Always show: Understand Impact */}
          <label 
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              checklist.understand_impact 
                ? 'bg-[#00FF00]/10 border-[#00FF00]/30' 
                : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
            }`}
            onClick={() => toggleCheck('understand_impact')}
          >
            <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
              checklist.understand_impact ? 'bg-[#00FF00] text-black' : 'bg-zinc-800 border border-zinc-700'
            }`}>
              {checklist.understand_impact && <CheckCircle size={14} />}
            </div>
            <div>
              <p className="text-sm font-medium text-white">Ich verstehe die Auswirkungen</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Änderungen gelten nur für <strong>neue Käufe</strong>
              </p>
            </div>
          </label>

          {/* Show for subscriptions with price increase */}
          {isPriceIncrease && (
            <>
              <label 
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  checklist.existing_unchanged 
                    ? 'bg-[#00FF00]/10 border-[#00FF00]/30' 
                    : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                }`}
                onClick={() => toggleCheck('existing_unchanged')}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                  checklist.existing_unchanged ? 'bg-[#00FF00] text-black' : 'bg-zinc-800 border border-zinc-700'
                }`}>
                  {checklist.existing_unchanged && <CheckCircle size={14} />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    <CreditCard size={14} className="text-blue-400" />
                    Bestehende Abos bleiben unverändert
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Stripe behält den alten Preis für laufende Subscriptions
                  </p>
                </div>
              </label>

              {hasActiveSubscriptions && (
                <>
                  <label 
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      checklist.will_notify_customers 
                        ? 'bg-[#00FF00]/10 border-[#00FF00]/30' 
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                    }`}
                    onClick={() => toggleCheck('will_notify_customers')}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      checklist.will_notify_customers ? 'bg-[#00FF00] text-black' : 'bg-zinc-800 border border-zinc-700'
                    }`}>
                      {checklist.will_notify_customers && <CheckCircle size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        <Mail size={14} className="text-purple-400" />
                        Ich werde Kunden informieren (falls nötig)
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Bei Preiserhöhungen für Bestandskunden: 30 Tage Vorlauf
                      </p>
                    </div>
                  </label>

                  <label 
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      checklist.stripe_manual 
                        ? 'bg-[#00FF00]/10 border-[#00FF00]/30' 
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                    }`}
                    onClick={() => toggleCheck('stripe_manual')}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      checklist.stripe_manual ? 'bg-[#00FF00] text-black' : 'bg-zinc-800 border border-zinc-700'
                    }`}>
                      {checklist.stripe_manual && <CheckCircle size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        <ExternalLink size={14} className="text-cyan-400" />
                        Stripe-Änderungen manuell vornehmen
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Preise im Stripe Dashboard separat anpassen
                      </p>
                    </div>
                  </label>

                  <label 
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      checklist.legal_compliance 
                        ? 'bg-[#00FF00]/10 border-[#00FF00]/30' 
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                    }`}
                    onClick={() => toggleCheck('legal_compliance')}
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      checklist.legal_compliance ? 'bg-[#00FF00] text-black' : 'bg-zinc-800 border border-zinc-700'
                    }`}>
                      {checklist.legal_compliance && <CheckCircle size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        <Scale size={14} className="text-yellow-400" />
                        Rechtliche Anforderungen beachtet
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        DSGVO: Sonderkündigungsrecht bei Preiserhöhungen
                      </p>
                    </div>
                  </label>
                </>
              )}
            </>
          )}
        </div>

        {/* Info Box */}
        <div className="px-6 py-3">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <p className="text-xs text-blue-400 flex items-start gap-2">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>
                Detaillierte Anleitung findest du in der Dokumentation unter{' '}
                <code className="bg-blue-500/20 px-1 rounded">docs/STRIPE_PRICE_CHANGES.md</code>
              </span>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-3 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-zinc-800 text-zinc-300 font-bold rounded-xl hover:bg-zinc-700 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={!allChecked}
            className={`flex-1 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              allChecked 
                ? 'bg-[#00FF00] text-black hover:bg-[#00FF00]/80' 
                : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle size={18} />
            Bestätigen & Speichern
          </button>
        </div>

        {/* Progress indicator */}
        {requiresAllChecks && (
          <div className="px-6 pb-4">
            <div className="flex justify-center gap-1">
              {Object.values(checklist).map((checked, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-colors ${checked ? 'bg-[#00FF00]' : 'bg-zinc-700'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceChangeChecklist;
