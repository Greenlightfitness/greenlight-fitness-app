import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPurchaseConfirmation, getUserPurchaseConfirmations } from '../services/supabase';
import { CheckCircle2, Package, Clock, UserCheck, ArrowRight, FileText, Shield, Loader2, ClipboardList, MessageCircle } from 'lucide-react';

interface Confirmation {
  id: string;
  confirmation_number: string;
  product_title: string;
  product_type: string;
  amount: number;
  currency: string;
  interval: string;
  status: string;
  coach_id: string | null;
  coach_assigned_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

const PurchaseConfirmation: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [allConfirmations, setAllConfirmations] = useState<Confirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'single' | 'list'>('single');

  const confirmationId = searchParams.get('id');

  useEffect(() => {
    if (!user) return;
    if (confirmationId) {
      loadConfirmation(confirmationId);
    } else {
      loadAllConfirmations();
      setView('list');
    }
  }, [user, confirmationId]);

  const loadConfirmation = async (id: string) => {
    setLoading(true);
    try {
      const data = await getPurchaseConfirmation(id);
      setConfirmation(data);
      setView('single');
    } catch (e) {
      console.error('Error loading confirmation:', e);
      loadAllConfirmations();
      setView('list');
    } finally {
      setLoading(false);
    }
  };

  const loadAllConfirmations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserPurchaseConfirmations(user.id);
      setAllConfirmations(data);
    } catch (e) {
      console.error('Error loading confirmations:', e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('de-DE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  const formatPrice = (amount: number, currency: string, interval: string) => {
    const priceStr = amount === 0 ? 'Kostenlos' : `${amount.toFixed(2)} ${(currency || 'EUR').toUpperCase()}`;
    if (amount === 0) return priceStr;
    if (interval === 'month') return `${priceStr} / Monat`;
    if (interval === 'year') return `${priceStr} / Jahr`;
    return priceStr;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#00FF00]" size={32} />
      </div>
    );
  }

  // Single confirmation view
  if (view === 'single' && confirmation) {
    const isCoaching = confirmation.product_type === 'COACHING_1ON1';

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
        {/* Success Header */}
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-[#00FF00]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-[#00FF00]" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Kauf bestätigt!</h1>
          <p className="text-zinc-400">Vielen Dank für deinen Kauf. Hier ist deine Bestätigung.</p>
        </div>

        {/* Confirmation Card */}
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Confirmation Number Header */}
          <div className="bg-[#00FF00]/10 border-b border-[#00FF00]/20 px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Bestätigungsnummer</p>
              <p className="text-lg font-mono font-bold text-[#00FF00]">{confirmation.confirmation_number}</p>
            </div>
            <Shield size={24} className="text-[#00FF00]/50" />
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Produkt</p>
                <p className="text-white font-bold text-lg">{confirmation.product_title}</p>
                <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg border ${
                  isCoaching ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {isCoaching ? '1:1 Coaching' : 'Trainingsplan'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Betrag</p>
                <p className="text-white font-bold text-lg">
                  {formatPrice(confirmation.amount, confirmation.currency, confirmation.interval)}
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Datum</p>
                <p className="text-zinc-300 text-sm">{formatDate(confirmation.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                <p className="text-[#00FF00] text-sm font-bold flex items-center gap-1">
                  <CheckCircle2 size={14} /> Bestätigt
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 1:1 Coaching Specific Section */}
        {isCoaching && (
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-white font-bold flex items-center gap-2">
              <UserCheck size={18} className="text-blue-400" />
              Dein 1:1 Coaching — Nächste Schritte
            </h3>

            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-[#00FF00]/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[#00FF00] font-bold text-sm">1</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Coach-Zuordnung</p>
                  <p className="text-zinc-400 text-xs">Innerhalb von <strong className="text-white">24 Stunden</strong> wird dir ein persönlicher Coach zugewiesen. Du erhältst eine Benachrichtigung.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-zinc-400 font-bold text-sm">2</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Intake-Fragebogen ausfüllen</p>
                  <p className="text-zinc-400 text-xs">Damit dein Coach deinen Plan optimal erstellen kann, fülle bitte den Fragebogen aus — Ziele, Verletzungen, verfügbare Tage und Vorlieben.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-zinc-400 font-bold text-sm">3</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Individueller Trainingsplan</p>
                  <p className="text-zinc-400 text-xs">Dein Coach erstellt einen maßgeschneiderten Plan basierend auf deinen Angaben und bespricht diesen mit dir.</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-zinc-400 font-bold text-sm">4</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Los geht's!</p>
                  <p className="text-zinc-400 text-xs">Starte dein Training mit persönlicher Begleitung, regelmäßigem Feedback und Anpassungen durch deinen Coach.</p>
                </div>
              </div>
            </div>

            {confirmation.metadata?.intake_form_enabled && (
              <button
                onClick={() => navigate(`/coaching-intake?relationship=${confirmation.metadata?.coaching_relationship_id}`)}
                className="w-full mt-2 px-4 py-3 bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
              >
                <ClipboardList size={18} /> Fragebogen jetzt ausfüllen
              </button>
            )}
          </div>
        )}

        {/* Legal Footer (§312i BGB) */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 space-y-2">
          <h4 className="text-zinc-300 text-sm font-semibold flex items-center gap-2">
            <FileText size={14} /> Rechtliche Hinweise
          </h4>
          <p className="text-zinc-500 text-xs leading-relaxed">
            Diese Kaufbestätigung dient als Nachweis deines Vertragsabschlusses gemäß §312i BGB. 
            Bei Abonnements hast du ein 14-tägiges Widerrufsrecht gemäß §355 BGB. 
            Kündigung ist jederzeit zum Ende der Abrechnungsperiode möglich über dein{' '}
            <Link to="/profile" className="text-[#00FF00] underline">Profil</Link>. 
            Es gelten unsere{' '}
            <Link to="/legal/terms" className="text-[#00FF00] underline">AGB</Link>{' '}
            und{' '}
            <Link to="/legal/privacy" className="text-[#00FF00] underline">Datenschutzerklärung</Link>.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-4 py-3 bg-[#00FF00] text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#00FF00]/80 transition-colors"
          >
            Zum Dashboard <ArrowRight size={16} />
          </button>
          {isCoaching && (
            <button
              onClick={() => navigate('/chat')}
              className="px-4 py-3 bg-zinc-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors"
            >
              <MessageCircle size={16} /> Chat
            </button>
          )}
        </div>
      </div>
    );
  }

  // List view — all confirmations
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
      <h1 className="text-2xl font-extrabold text-white">Meine Käufe</h1>

      {allConfirmations.length === 0 ? (
        <div className="text-center py-16 bg-[#1C1C1E] border border-zinc-800 rounded-2xl">
          <Package size={48} className="mx-auto text-zinc-700 mb-4" />
          <p className="text-zinc-500">Noch keine Käufe vorhanden.</p>
          <button
            onClick={() => navigate('/shop')}
            className="mt-4 px-6 py-2 bg-[#00FF00] text-black rounded-xl font-bold"
          >
            Zum Shop
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {allConfirmations.map(c => (
            <button
              key={c.id}
              onClick={() => navigate(`/purchase-confirmation?id=${c.id}`)}
              className="w-full bg-[#1C1C1E] border border-zinc-800 rounded-xl p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors text-left"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                c.product_type === 'COACHING_1ON1' ? 'bg-blue-500/20 text-blue-400' : 'bg-[#00FF00]/20 text-[#00FF00]'
              }`}>
                {c.product_type === 'COACHING_1ON1' ? <UserCheck size={20} /> : <Package size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{c.product_title}</p>
                <p className="text-zinc-500 text-xs">{formatDate(c.created_at)} · {c.confirmation_number}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-white font-bold text-sm">
                  {c.amount === 0 ? 'Gratis' : `${c.amount.toFixed(2)} €`}
                </p>
                <p className="text-[#00FF00] text-xs flex items-center gap-1 justify-end">
                  <CheckCircle2 size={10} /> Bestätigt
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PurchaseConfirmation;
