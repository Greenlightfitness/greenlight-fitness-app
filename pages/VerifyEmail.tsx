import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Button from '../components/Button';

type VerificationStatus = 'loading' | 'success' | 'error' | 'already_verified';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Supabase handles email verification via URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'signup' || type === 'email_change') {
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              throw error;
            }

            setStatus('success');
          } else {
            // Check if user is already verified
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              setStatus('already_verified');
            } else {
              throw new Error('Ungültiger Bestätigungslink');
            }
          }
        } else {
          // No type parameter, check current session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setStatus('already_verified');
          } else {
            throw new Error('Kein gültiger Bestätigungslink gefunden');
          }
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Fehler bei der E-Mail-Bestätigung');
      }
    };

    // Small delay to show loading state
    setTimeout(verifyEmail, 1000);
  }, [searchParams]);

  const handleContinue = () => {
    navigate('/');
  };

  const handleResendEmail = async () => {
    // This would need to be implemented with a stored email
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-8 max-w-md w-full text-center">
        
        {/* Loading State */}
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-[#00FF00]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Loader2 size={32} className="text-[#00FF00] animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">E-Mail wird bestätigt...</h1>
            <p className="text-zinc-400">Bitte warte einen Moment</p>
          </>
        )}

        {/* Success State */}
        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-[#00FF00]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-[#00FF00]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">E-Mail bestätigt! 🎉</h1>
            <p className="text-zinc-400 mb-8">
              Dein Account ist jetzt aktiviert. Du kannst Greenlight Fitness jetzt nutzen.
            </p>
            
            <div className="bg-[#00FF00]/5 border border-[#00FF00]/20 rounded-xl p-4 mb-6">
              <p className="text-[#00FF00] text-sm font-medium">
                Willkommen bei Greenlight Fitness!
              </p>
            </div>

            <Button onClick={handleContinue} fullWidth>
              Zum Dashboard →
            </Button>
          </>
        )}

        {/* Already Verified State */}
        {status === 'already_verified' && (
          <>
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail size={32} className="text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Bereits bestätigt</h1>
            <p className="text-zinc-400 mb-8">
              Deine E-Mail-Adresse wurde bereits bestätigt. Du kannst direkt loslegen.
            </p>
            <Button onClick={handleContinue} fullWidth>
              Zum Dashboard →
            </Button>
          </>
        )}

        {/* Error State */}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Bestätigung fehlgeschlagen</h1>
            <p className="text-zinc-400 mb-2">
              {errorMessage || 'Der Bestätigungslink ist ungültig oder abgelaufen.'}
            </p>
            <p className="text-zinc-500 text-sm mb-8">
              Bitte fordere einen neuen Bestätigungslink an.
            </p>
            
            <div className="space-y-3">
              <Button onClick={handleResendEmail} fullWidth>
                Neuen Link anfordern
              </Button>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 text-zinc-400 hover:text-white transition-colors"
              >
                Zurück zum Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
