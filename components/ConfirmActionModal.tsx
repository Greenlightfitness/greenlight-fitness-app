import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Loader2, X, CheckCircle2, Circle } from 'lucide-react';

export interface ChecklistItem {
  id: string;
  label: string;
  required?: boolean;
}

export type ConfirmSeverity = 'warning' | 'danger' | 'info';

export interface ConfirmActionConfig {
  title: string;
  description: string;
  severity: ConfirmSeverity;
  icon?: React.ReactNode;
  checklist?: ChecklistItem[];
  confirmLabel: string;
  cancelLabel?: string;
  requireAllChecks?: boolean;
  doubleConfirmText?: string;
}

interface ConfirmActionModalProps {
  config: ConfirmActionConfig;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({ config, loading, onConfirm, onCancel }) => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [doubleConfirmValue, setDoubleConfirmValue] = useState('');

  const {
    title, description, severity, icon, checklist, confirmLabel,
    cancelLabel = 'Abbrechen', requireAllChecks = true, doubleConfirmText,
  } = config;

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const requiredChecks = checklist?.filter(c => c.required !== false) || [];
  const allRequiredChecked = requireAllChecks
    ? requiredChecks.every(c => checkedItems.has(c.id))
    : true;
  const doubleConfirmOk = doubleConfirmText
    ? doubleConfirmValue.trim().toLowerCase() === doubleConfirmText.trim().toLowerCase()
    : true;
  const canConfirm = allRequiredChecked && doubleConfirmOk && !loading;

  const severityStyles = {
    warning: {
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-500',
      btnBg: 'bg-amber-500 hover:bg-amber-600',
      btnText: 'text-black',
    },
    danger: {
      border: 'border-red-500/30',
      bg: 'bg-red-500/10',
      iconBg: 'bg-red-500/20',
      iconColor: 'text-red-500',
      btnBg: 'bg-red-500 hover:bg-red-600',
      btnText: 'text-white',
    },
    info: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      btnBg: 'bg-blue-500 hover:bg-blue-600',
      btnText: 'text-white',
    },
  };

  const s = severityStyles[severity];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in" onClick={onCancel}>
      <div
        className={`bg-[#1C1C1E] border ${s.border} rounded-2xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0`}>
              {icon || (severity === 'danger'
                ? <ShieldAlert size={24} className={s.iconColor} />
                : <AlertTriangle size={24} className={s.iconColor} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white">{title}</h3>
              <p className="text-zinc-400 text-sm mt-1 leading-relaxed">{description}</p>
            </div>
            <button onClick={onCancel} className="text-zinc-600 hover:text-white transition-colors shrink-0 mt-0.5">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Checklist */}
        {checklist && checklist.length > 0 && (
          <div className="px-6 pb-4">
            <div className={`${s.bg} border ${s.border} rounded-xl p-4 space-y-3`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                Bitte bestätige folgende Punkte:
              </p>
              {checklist.map(item => {
                const checked = checkedItems.has(item.id);
                return (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 cursor-pointer group"
                    onClick={() => toggleCheck(item.id)}
                  >
                    <div className="mt-0.5 shrink-0">
                      {checked ? (
                        <CheckCircle2 size={18} className="text-[#00FF00]" />
                      ) : (
                        <Circle size={18} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                      )}
                    </div>
                    <span className={`text-sm leading-snug transition-colors ${checked ? 'text-white' : 'text-zinc-400'}`}>
                      {item.label}
                      {item.required !== false && <span className="text-red-400 ml-0.5">*</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Double Confirm Input */}
        {doubleConfirmText && (
          <div className="px-6 pb-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">
              Tippe <span className="text-white font-mono bg-zinc-800 px-1.5 py-0.5 rounded">{doubleConfirmText}</span> zur Bestätigung
            </label>
            <input
              type="text"
              value={doubleConfirmValue}
              onChange={e => setDoubleConfirmValue(e.target.value)}
              placeholder={doubleConfirmText}
              className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-xl px-4 py-3 text-sm focus:border-red-500 outline-none transition-colors font-mono"
            />
          </div>
        )}

        {/* Buttons */}
        <div className="p-6 pt-2 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 text-zinc-400 hover:text-white bg-zinc-900 rounded-xl transition-colors text-sm font-medium"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`flex-1 px-4 py-3 ${s.btnBg} ${s.btnText} font-bold rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2`}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;

// --- Predefined configs for common admin actions ---

export const getRoleChangeConfig = (userName: string, fromRole: string, toRole: string): ConfirmActionConfig => {
  if (toRole === 'ADMIN') {
    return {
      title: `${userName} zum Admin befördern?`,
      description: 'Diese Aktion gibt dem Nutzer vollen Zugriff auf die gesamte Plattform — inkl. Nutzerverwaltung, Abrechnungen und Systemeinstellungen.',
      severity: 'danger',
      checklist: [
        { id: 'trust', label: 'Ich vertraue dieser Person und sie benötigt Admin-Zugriff', required: true },
        { id: 'understand', label: 'Mir ist bewusst, dass Admins auf alle Nutzerdaten zugreifen können', required: true },
        { id: 'revoke', label: 'Ich weiß, dass Admin-Rechte jederzeit wieder entzogen werden können', required: true },
      ],
      doubleConfirmText: 'ADMIN',
      confirmLabel: 'Zum Admin befördern',
    };
  }

  if (fromRole === 'ADMIN' && toRole !== 'ADMIN') {
    return {
      title: `Admin-Rechte von ${userName} entziehen?`,
      description: `Die Admin-Berechtigung wird entfernt. Der Nutzer wird auf die Rolle "${toRole}" herabgestuft.`,
      severity: 'danger',
      checklist: [
        { id: 'confirm', label: 'Mir ist bewusst, dass diese Person den Zugang zur Nutzerverwaltung, CRM und Abrechnungen verliert', required: true },
        { id: 'other-admin', label: 'Es gibt mindestens einen weiteren Admin auf der Plattform', required: true },
      ],
      confirmLabel: 'Admin-Rechte entziehen',
    };
  }

  if (fromRole === 'COACH' && toRole === 'ATHLETE') {
    return {
      title: `Coach-Rolle von ${userName} entfernen?`,
      description: 'Dieser Coach wird zum Athleten herabgestuft. Alle aktiven Coaching-Beziehungen bleiben bestehen, aber der Nutzer kann keine neuen Pläne erstellen oder Athleten betreuen.',
      severity: 'warning',
      checklist: [
        { id: 'athletes', label: 'Mir ist bewusst, dass bestehende Athleten möglicherweise einem neuen Coach zugewiesen werden müssen', required: true },
        { id: 'plans', label: 'Erstellte Trainingspläne und Kalender bleiben erhalten', required: false },
        { id: 'confirm', label: 'Ich möchte diese Rolle wirklich ändern', required: true },
      ],
      confirmLabel: 'Coach-Rolle entfernen',
    };
  }

  if (toRole === 'COACH') {
    return {
      title: `${userName} zum Coach befördern?`,
      description: 'Dieser Nutzer erhält Coach-Rechte: Trainingsplanung, Athletenbetreuung, Terminverwaltung und ein öffentliches Coaching-Profil.',
      severity: 'info',
      checklist: [
        { id: 'qualify', label: 'Diese Person ist qualifiziert, Athleten zu betreuen', required: true },
        { id: 'onboard', label: 'Der Nutzer muss ein Coach-Onboarding durchlaufen (wird automatisch gestartet)', required: false },
      ],
      confirmLabel: 'Zum Coach befördern',
    };
  }

  // Generic fallback
  return {
    title: `Rolle von ${userName} ändern?`,
    description: `Die Rolle wird von "${fromRole}" zu "${toRole}" geändert.`,
    severity: 'warning',
    checklist: [
      { id: 'confirm', label: 'Ich möchte diese Rollenänderung wirklich durchführen', required: true },
    ],
    confirmLabel: 'Rolle ändern',
  };
};

export const getUnassignConfig = (athleteName: string, coachName: string): ConfirmActionConfig => ({
  title: `Coaching-Zuweisung beenden?`,
  description: `Die Coaching-Beziehung zwischen ${athleteName} (Athlet) und ${coachName} (Coach) wird beendet.`,
  severity: 'warning',
  checklist: [
    { id: 'understand', label: 'Mir ist bewusst, dass der Athlet keinen Coach mehr hat', required: true },
    { id: 'plans', label: 'Bereits erstellte Trainingspläne bleiben dem Athleten erhalten', required: false },
    { id: 'confirm', label: 'Ich möchte die Zuweisung wirklich beenden', required: true },
  ],
  confirmLabel: 'Zuweisung beenden',
});

export const getRevokePurchaseConfig = (productName: string, userName: string): ConfirmActionConfig => ({
  title: `Kauf widerrufen?`,
  description: `Der Kauf von "${productName}" für ${userName} wird widerrufen. Der Nutzer verliert den Zugang zu diesem Produkt.`,
  severity: 'danger',
  checklist: [
    { id: 'understand', label: 'Mir ist bewusst, dass der Nutzer den Zugang zum Produkt verliert', required: true },
    { id: 'refund', label: 'Eine eventuelle Rückerstattung muss separat über Stripe erfolgen', required: true },
    { id: 'confirm', label: 'Ich möchte den Kauf wirklich widerrufen', required: true },
  ],
  confirmLabel: 'Kauf widerrufen',
});

export const getRevokePlanConfig = (planName: string, userName: string): ConfirmActionConfig => ({
  title: `Trainingsplan entziehen?`,
  description: `Der Trainingsplan "${planName}" wird ${userName} entzogen. Der Fortschritt geht verloren.`,
  severity: 'warning',
  checklist: [
    { id: 'understand', label: 'Mir ist bewusst, dass der Trainingsfortschritt des Athleten verloren gehen kann', required: true },
    { id: 'confirm', label: 'Ich möchte den Plan wirklich entziehen', required: true },
  ],
  confirmLabel: 'Plan entziehen',
});
