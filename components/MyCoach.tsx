import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAthleteCoachRelationship, checkChatAccess } from '../services/supabase';
import CoachChat from './CoachChat';
import { User, MessageCircle, Calendar, Star, ChevronRight, Shield, Lock } from 'lucide-react';

const MyCoach: React.FC = () => {
  const { user, userProfile: profile } = useAuth();
  const [relationship, setRelationship] = useState<any>(null);
  const [chatAccess, setChatAccess] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadCoachData();
  }, [user]);

  const loadCoachData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rel = await getAthleteCoachRelationship(user.id);
      setRelationship(rel);
      
      const access = await checkChatAccess(user.id);
      setChatAccess(access.hasAccess);
    } catch (err) {
      console.error('Error loading coach data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-32 mb-4" />
        <div className="h-16 bg-zinc-800 rounded" />
      </div>
    );
  }

  if (!relationship) {
    return (
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl p-6">
        <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
          <Shield size={16} className="text-zinc-500" /> Mein Coach
        </h3>
        <div className="flex flex-col items-center py-6 text-center">
          <div className="w-14 h-14 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
            <User size={24} className="text-zinc-600" />
          </div>
          <p className="text-zinc-500 text-sm">Kein Coach zugewiesen</p>
          <p className="text-zinc-600 text-xs mt-1">
            Wende dich an den Admin oder buche ein 1:1 Coaching-Paket
          </p>
        </div>
      </div>
    );
  }

  const coach = relationship.coach;
  const coachName = coach?.first_name
    ? `${coach.first_name} ${coach.last_name || ''}`
    : coach?.display_name || coach?.email || 'Coach';
  const coachInitial = (coach?.first_name || coach?.email || 'C').charAt(0).toUpperCase();
  const product = relationship.product;
  const startDate = relationship.started_at
    ? new Date(relationship.started_at).toLocaleDateString('de-DE')
    : '';

  return (
    <div className="space-y-4">
      {/* Coach Card */}
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="p-5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
            <Star size={16} className="text-[#00FF00]" /> Mein Coach
          </h3>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#00FF00]/10 border-2 border-[#00FF00]/30 flex items-center justify-center shrink-0">
              <span className="text-[#00FF00] font-bold text-xl">{coachInitial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-lg truncate">{coachName}</p>
              <p className="text-zinc-500 text-sm">{coach?.email}</p>
              {startDate && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Calendar size={12} className="text-zinc-600" />
                  <span className="text-zinc-600 text-xs">Seit {startDate}</span>
                </div>
              )}
            </div>
          </div>

          {product && (
            <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Aktives Paket</p>
                <p className="text-white text-sm font-medium mt-0.5">{product.title}</p>
              </div>
              <div className="text-[#00FF00] text-xs font-bold bg-[#00FF00]/10 px-2 py-1 rounded">
                Aktiv
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-zinc-800">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${
              chatAccess
                ? 'hover:bg-zinc-800/50 text-white'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
            disabled={!chatAccess}
          >
            <div className="flex items-center gap-3">
              {chatAccess ? (
                <MessageCircle size={18} className="text-[#00FF00]" />
              ) : (
                <Lock size={18} className="text-zinc-600" />
              )}
              <div className="text-left">
                <p className="text-sm font-medium">
                  {showChat ? 'Chat schließen' : 'Chat mit Coach'}
                </p>
                {!chatAccess && (
                  <p className="text-xs text-zinc-600">Nur mit Chat-Paket verfügbar</p>
                )}
              </div>
            </div>
            <ChevronRight
              size={18}
              className={`transition-transform ${showChat ? 'rotate-90' : ''} ${
                chatAccess ? 'text-zinc-500' : 'text-zinc-700'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Chat Panel */}
      {showChat && user && (
        <div className="animate-in slide-in-from-top duration-300">
          <CoachChat
            relationshipId={relationship.id}
            partnerId={coach.id}
            partnerName={coachName}
            currentUserId={user.id}
            hasAccess={chatAccess}
            onClose={() => setShowChat(false)}
          />
        </div>
      )}
    </div>
  );
};

export default MyCoach;
