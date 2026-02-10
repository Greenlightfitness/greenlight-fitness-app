import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAthleteActiveCoaching } from '../services/supabase';
import CoachChat from '../components/CoachChat';
import { MessageCircle, Lock, CheckCircle2, Loader2 } from 'lucide-react';
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
      <div className="flex items-center justify-center h-[calc(100vh-180px)] text-zinc-500">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  // Active coaching → show real CoachChat
  if (coaching) {
    const coach = Array.isArray(coaching.coach) ? coaching.coach[0] : coaching.coach;
    const coachName = coach?.first_name
      ? `${coach.first_name} ${coach.last_name || ''}`.trim()
      : coach?.display_name || coach?.email?.split('@')[0] || 'Coach';

    return (
      <div className="flex flex-col h-[calc(100vh-180px)] animate-in fade-in">
        <CoachChat
          relationshipId={coaching.id}
          partnerId={coaching.coach_id}
          partnerName={coachName}
          currentUserId={user!.id}
          hasAccess={true}
          isFullPage={true}
        />
      </div>
    );
  }

  // No coaching → sales page
  return (
    <div className="pb-32 animate-in slide-in-from-bottom-8">
      <div className="flex flex-col items-center text-center pt-8 pb-6">
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
  );
};

export default Chat;