import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { UserPlus, CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';

type InviteStatus = 'loading' | 'valid' | 'invalid' | 'expired' | 'accepted' | 'accepting';

interface InvitationData {
  id: string;
  email: string;
  invitedBy: string;
  inviterName?: string;
  personalMessage?: string;
  role: 'ATHLETE' | 'COACH';
  autoApproveCoaching: boolean;
  expiresAt?: string;
}

const AcceptInvite: React.FC = () => {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { user, userProfile } = useAuth();
  
  const [status, setStatus] = useState<InviteStatus>('loading');
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [error, setError] = useState('');
  
  // Registration form (for non-logged-in users)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (code) {
      checkInvitation();
    }
  }, [code]);

  const checkInvitation = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          id,
          email,
          invited_by,
          personal_message,
          role,
          auto_approve_coaching,
          expires_at,
          status,
          profiles:invited_by (
            nickname,
            first_name,
            last_name
          )
        `)
        .eq('invitation_code', code)
        .single();

      if (error || !data) {
        setStatus('invalid');
        return;
      }

      // Check if already accepted
      if (data.status === 'ACCEPTED') {
        setStatus('accepted');
        return;
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setStatus('expired');
        return;
      }

      // Check if revoked
      if (data.status === 'REVOKED') {
        setStatus('invalid');
        return;
      }

      const inviterProfile = data.profiles as any;
      setInvitation({
        id: data.id,
        email: data.email,
        invitedBy: data.invited_by,
        inviterName: inviterProfile?.nickname || inviterProfile?.first_name || 'Ein Coach',
        personalMessage: data.personal_message,
        role: data.role,
        autoApproveCoaching: data.auto_approve_coaching,
        expiresAt: data.expires_at,
      });
      setEmail(data.email);
      setStatus('valid');
    } catch (err) {
      console.error('Error checking invitation:', err);
      setStatus('invalid');
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;
    
    setStatus('accepting');
    
    try {
      // Update invitation status
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          status: 'ACCEPTED',
          accepted_at: new Date().toISOString(),
          accepted_by_user_id: user.id,
        })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // If auto-approve coaching is enabled, create coaching relationship
      if (invitation.autoApproveCoaching) {
        await supabase.from('coaching_relationships').insert({
          athlete_id: user.id,
          coach_id: invitation.invitedBy,
          status: 'ACTIVE',
          started_at: new Date().toISOString(),
          is_manual_grant: true,
          grant_reason: 'Einladung akzeptiert',
        });

        // Notify coach: In-App + Email
        const athleteDisplayName = user.email?.split('@')[0] || 'Ein Athlet';
        await supabase.from('notifications').insert({
          user_id: invitation.invitedBy,
          type: 'coach_assignment',
          title: 'Einladung angenommen',
          message: `${athleteDisplayName} hat deine Einladung angenommen.`,
          read: false,
        });

        // Email to coach
        const { data: coachP } = await supabase.from('profiles').select('email, first_name').eq('id', invitation.invitedBy).maybeSingle();
        if (coachP?.email) {
          fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'coach_new_athlete',
              to: coachP.email,
              data: {
                coachName: coachP.first_name || 'Coach',
                athleteName: athleteDisplayName,
                athleteEmail: user.email || '',
                assignDate: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                reason: 'Einladung akzeptiert',
                dashboardLink: 'https://greenlight-fitness-app.vercel.app/',
              },
            }),
          }).catch(() => {});
        }
      }

      setStatus('accepted');
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Annehmen der Einladung');
      setStatus('valid');
    }
  };

  const handleRegisterAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;
    
    setRegistering(true);
    setError('');

    try {
      // Register new user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create profile
        await supabase.from('profiles').insert({
          id: authData.user.id,
          email,
          first_name: firstName,
          role: invitation.role,
          created_at: new Date().toISOString(),
        });

        // Update invitation
        await supabase
          .from('invitations')
          .update({
            status: 'ACCEPTED',
            accepted_at: new Date().toISOString(),
            accepted_by_user_id: authData.user.id,
          })
          .eq('id', invitation.id);

        // Create coaching relationship if applicable
        if (invitation.autoApproveCoaching) {
          await supabase.from('coaching_relationships').insert({
            athlete_id: authData.user.id,
            coach_id: invitation.invitedBy,
            status: 'ACTIVE',
            started_at: new Date().toISOString(),
            is_manual_grant: true,
            grant_reason: 'Einladung akzeptiert',
          });

          // Notify coach: In-App + Email
          await supabase.from('notifications').insert({
            user_id: invitation.invitedBy,
            type: 'coach_assignment',
            title: 'Einladung angenommen',
            message: `${firstName || email.split('@')[0]} hat deine Einladung angenommen.`,
            read: false,
          });

          const { data: coachP } = await supabase.from('profiles').select('email, first_name').eq('id', invitation.invitedBy).maybeSingle();
          if (coachP?.email) {
            fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'coach_new_athlete',
                to: coachP.email,
                data: {
                  coachName: coachP.first_name || 'Coach',
                  athleteName: firstName || email.split('@')[0],
                  athleteEmail: email,
                  assignDate: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                  reason: 'Einladung akzeptiert (neuer User)',
                  dashboardLink: 'https://greenlight-fitness-app.vercel.app/',
                },
              }),
            }).catch(() => {});
          }
        }

        setStatus('accepted');
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Registrierung fehlgeschlagen');
    } finally {
      setRegistering(false);
    }
  };

  // Loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-8 max-w-md w-full text-center">
          <Loader2 size={40} className="text-[#00FF00] animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Einladung wird geprüft...</p>
        </div>
      </div>
    );
  }

  // Invalid invitation
  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Ungültige Einladung</h1>
          <p className="text-zinc-400 mb-6">
            Diese Einladung existiert nicht oder wurde zurückgezogen.
          </p>
          <Button onClick={() => navigate('/login')} fullWidth>
            Zum Login
          </Button>
        </div>
      </div>
    );
  }

  // Expired invitation
  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Einladung abgelaufen</h1>
          <p className="text-zinc-400 mb-6">
            Diese Einladung ist leider abgelaufen. Bitte kontaktiere deinen Coach für eine neue Einladung.
          </p>
          <Button onClick={() => navigate('/login')} fullWidth>
            Zum Login
          </Button>
        </div>
      </div>
    );
  }

  // Already accepted
  if (status === 'accepted') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-[#00FF00]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-[#00FF00]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Willkommen! 🎉</h1>
          <p className="text-zinc-400 mb-6">
            Deine Einladung wurde angenommen. Du wirst zum Dashboard weitergeleitet...
          </p>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#00FF00] animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  // Valid invitation - show form
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#00FF00]/20 to-[#00FF00]/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UserPlus size={40} className="text-[#00FF00]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Du bist eingeladen!</h1>
          <p className="text-zinc-400">
            <strong className="text-white">{invitation?.inviterName}</strong> möchte mit dir trainieren
          </p>
        </div>

        {/* Personal Message */}
        {invitation?.personalMessage && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6">
            <p className="text-zinc-500 text-xs font-bold uppercase mb-2">Persönliche Nachricht</p>
            <p className="text-zinc-300 italic">"{invitation.personalMessage}"</p>
          </div>
        )}

        {/* Already logged in */}
        {user ? (
          <div className="space-y-4">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <p className="text-zinc-500 text-xs font-bold uppercase mb-2">Angemeldet als</p>
              <p className="text-white font-medium">{userProfile?.nickname || user.email}</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleAcceptInvitation}
              fullWidth
              disabled={status === 'accepting'}
            >
              {status === 'accepting' ? 'Wird angenommen...' : 'Einladung annehmen'}
            </Button>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={handleRegisterAndAccept} className="space-y-4">
            <div className="bg-[#00FF00]/5 border border-[#00FF00]/20 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <Mail size={20} className="text-[#00FF00]" />
                <div>
                  <p className="text-zinc-400 text-xs">Eingeladen für</p>
                  <p className="text-white font-medium">{invitation?.email}</p>
                </div>
              </div>
            </div>

            <Input
              label="Vorname"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Dein Vorname"
              required
            />

            <Input
              label="Passwort"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              required
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth disabled={registering}>
              {registering ? 'Account wird erstellt...' : 'Account erstellen & beitreten'}
            </Button>

            <p className="text-center text-zinc-500 text-sm">
              Bereits registriert?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#00FF00] hover:underline"
              >
                Anmelden
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
