import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAthleteActiveCoaching } from '../services/supabase';
import CoachChat from '../components/CoachChat';
import { MessageCircle, Lock, CheckCircle2, Loader2, ChevronLeft } from 'lucide-react';
import Button from '../components/Button';

const Chat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [coaching, setCoaching] = useState<any>(null);

  useEffect(() => {
    if (user) fetchCoaching();
  }, [user]);

  const fetchCoaching = async () => {
    if (!user) return;
    try {
      const data = await getAthleteActiveCoaching(user.id);
      setCoaching(data);
    } catch (error) {
      console.error('Error fetching coaching:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-500">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  // Active coaching → fullscreen WhatsApp-style chat
  if (coaching) {
    const coach = Array.isArray(coaching.coach) ? coaching.coach[0] : coaching.coach;
    const coachName = coach?.first_name
      ? `${coach.first_name} ${coach.last_name || ''}`.trim()
      : coach?.display_name || coach?.email?.split('@')[0] || 'Coach';
    const coachInitial = coachName.charAt(0).toUpperCase();

    return (
      <div className="flex flex-col h-full animate-in fade-in">
        {/* WhatsApp-style header with back arrow */}
        <div className="flex items-center gap-2 px-2 py-2.5 bg-[#1C1C1E] border-b border-zinc-800 shrink-0 safe-area-top">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-1 text-zinc-400 hover:text-white active:scale-95 transition-all rounded-full"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="w-9 h-9 rounded-full bg-[#00FF00]/10 border border-[#00FF00]/30 flex items-center justify-center">
            <span className="text-[#00FF00] font-bold text-sm">{coachInitial}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{coachName}</p>
            <p className="text-[#00FF00] text-[10px] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00] inline-block" /> Online
            </p>
          </div>
        </div>

        {/* Chat body — fills remaining space */}
        <div className="flex-1 flex flex-col min-h-0">
          <CoachChat
            relationshipId={coaching.id}
            partnerId={coaching.coach_id}
            partnerName={coachName}
            currentUserId={user!.id}
            hasAccess={true}
            isFullPage={true}
            hideHeader={true}
          />
        </div>
      </div>
    );
  }

  // No coaching → sales page with back navigation
  return (
    <div className="flex flex-col h-full animate-in fade-in">
      {/* Header with back */}
      <div className="flex items-center gap-3 px-2 py-2.5 bg-[#1C1C1E] border-b border-zinc-800 shrink-0 safe-area-top">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-1 text-zinc-400 hover:text-white active:scale-95 transition-all rounded-full"
        >
          <ChevronLeft size={24} />
        </button>
        <p className="text-white font-bold text-sm">Chat</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-12">
      <div className="flex flex-col items-center text-center pt-12 pb-6">
        <div className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
          <Lock size={32} className="text-zinc-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-white mb-2">
          1:1 Coaching Chat
        </h1>
        <p className="text-zinc-500 text-sm max-w-xs">
          Der Chat ist nur mit einem aktiven 1:1 Coaching-Paket verfügbar.
        </p>
      </div>

      <div className="space-y-4 px-2">
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-5">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00FF00]/10 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} className="text-[#00FF00]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Custom Programming</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Trainingspläne individuell für deine Ziele.</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-5">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00FF00]/10 flex items-center justify-center shrink-0">
              <MessageCircle size={20} className="text-[#00FF00]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Direkter Chat</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Text- und Sprachnachrichten mit deinem Coach.</p>
            </div>
          </div>
        </div>

        <Button onClick={() => navigate('/shop')} fullWidth className="mt-6 shadow-[0_0_20px_rgba(0,255,0,0.3)]">
          Zum Shop
        </Button>
      </div>
      </div>
    </div>
  );
};

export default Chat;