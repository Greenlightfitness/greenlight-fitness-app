import React, { useState } from 'react';
import { X, Mail, Send, UserPlus, Copy, Check, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import Input from './Input';

interface InviteAthleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const InviteAthleteModal: React.FC<InviteAthleteModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user, userProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [autoApproveCoaching, setAutoApproveCoaching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ code: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !email) return;

    setLoading(true);
    setError('');

    try {
      // Create invitation
      const { data, error: insertError } = await supabase
        .from('invitations')
        .insert({
          invited_by: user.id,
          email: email.toLowerCase().trim(),
          personal_message: personalMessage || null,
          role: 'ATHLETE',
          auto_approve_coaching: autoApproveCoaching,
          is_bonus_grant: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const inviteLink = `https://dev.greenlight-fitness.de/invite/${data.invitation_code}`;
      
      // Send invitation email
      try {
        await fetch('/api/send-invitation-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            inviterName: userProfile?.nickname || userProfile?.firstName || 'Coach',
            personalMessage: personalMessage || null,
            inviteLink,
            inviteCode: data.invitation_code,
          })
        });
      } catch (emailError) {
        console.error('Email send error:', emailError);
      }

      setSuccess({ code: data.invitation_code, link: inviteLink });
      onSuccess?.();
    } catch (err: any) {
      console.error('Invitation error:', err);
      if (err.code === '23505') {
        setError('Diese E-Mail wurde bereits eingeladen.');
      } else {
        setError(err.message || 'Fehler beim Erstellen der Einladung');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!success) return;
    await navigator.clipboard.writeText(success.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setEmail('');
    setPersonalMessage('');
    setError('');
    setSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#00FF00]/10 rounded-xl flex items-center justify-center">
                <UserPlus size={20} className="text-[#00FF00]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Athlet einladen</h2>
                <p className="text-xs text-zinc-500">Per E-Mail oder Link</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X size={20} className="text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            /* Success State */
            <div className="text-center">
              <div className="w-16 h-16 bg-[#00FF00]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Check size={32} className="text-[#00FF00]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Einladung erstellt!</h3>
              <p className="text-zinc-400 text-sm mb-6">
                Die E-Mail wurde an <strong className="text-white">{email}</strong> gesendet.
              </p>
              
              {/* Copy Link */}
              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 mb-6">
                <p className="text-xs text-zinc-500 mb-2">Einladungslink:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-[#00FF00] break-all">
                    {success.link}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    className={`p-2 rounded-lg transition-colors ${
                      copied ? 'bg-[#00FF00]/20 text-[#00FF00]' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <Button onClick={handleClose} fullWidth>
                Fertig
              </Button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  E-Mail-Adresse *
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="athlet@beispiel.de"
                    className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 pl-12 text-white placeholder-zinc-600 focus:border-[#00FF00] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Personal Message */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Persönliche Nachricht (optional)
                </label>
                <textarea
                  value={personalMessage}
                  onChange={(e) => setPersonalMessage(e.target.value)}
                  placeholder="Hey! Ich freue mich darauf, mit dir zusammenzuarbeiten..."
                  rows={3}
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-[#00FF00] focus:outline-none resize-none"
                />
              </div>

              {/* Auto-Approve Coaching */}
              <div className="flex items-center gap-3 p-4 bg-zinc-900/50 rounded-xl">
                <input
                  type="checkbox"
                  id="autoApprove"
                  checked={autoApproveCoaching}
                  onChange={(e) => setAutoApproveCoaching(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-600 bg-black text-[#00FF00] focus:ring-[#00FF00] focus:ring-offset-0"
                />
                <label htmlFor="autoApprove" className="flex-1">
                  <span className="text-white text-sm font-medium block">
                    Coaching automatisch freischalten
                  </span>
                  <span className="text-zinc-500 text-xs">
                    Der Athlet wird automatisch dir als Coach zugewiesen
                  </span>
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button type="submit" fullWidth disabled={loading || !email}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Wird gesendet...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send size={18} />
                    Einladung senden
                  </span>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteAthleteModal;
