import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import Button from '../components/Button';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setTokenValid(true);
      } else {
        // Try to get session from URL hash (Supabase redirects with hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          setTokenValid(!error);
        } else {
          setTokenValid(false);
        }
      }
    };
    
    checkSession();
  }, [searchParams]);

  const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.match(/[a-z]/) && pwd.match(/[A-Z]/)) strength++;
    if (pwd.match(/[0-9]/)) strength++;
    if (pwd.match(/[^a-zA-Z0-9]/)) strength++;
    
    if (strength <= 1) return { strength, label: 'Schwach', color: 'bg-red-500' };
    if (strength === 2) return { strength, label: 'Mittel', color: 'bg-yellow-500' };
    if (strength === 3) return { strength, label: 'Gut', color: 'bg-blue-500' };
    return { strength, label: 'Stark', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Zurücksetzen des Passworts');
    } finally {
      setLoading(false);
    }
  };

  // Loading state while checking token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="animate-pulse text-zinc-500">Wird geladen...</div>
      </div>
    );
  }

  // Invalid or expired token
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link ungültig</h1>
          <p className="text-zinc-400 mb-6">
            Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.
          </p>
          <Button onClick={() => navigate('/login')} fullWidth>
            Zurück zum Login
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#00FF00]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-[#00FF00]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Passwort geändert!</h1>
          <p className="text-zinc-400 mb-6">
            Dein Passwort wurde erfolgreich aktualisiert. Du wirst zum Login weitergeleitet...
          </p>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#00FF00] animate-pulse" style={{ width: '100%' }} />
          </div>
        </div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-[#1C1C1E] border border-zinc-800 rounded-[2rem] p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock size={32} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Neues Passwort</h1>
          <p className="text-zinc-400">Erstelle ein neues, sicheres Passwort</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Neues Passwort
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-[#00FF00] focus:outline-none pr-12"
                placeholder="Mindestens 8 Zeichen"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {/* Password Strength */}
            {password && (
              <div className="mt-3">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        i <= passwordStrength.strength ? passwordStrength.color : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${
                  passwordStrength.strength <= 1 ? 'text-red-400' :
                  passwordStrength.strength === 2 ? 'text-yellow-400' :
                  passwordStrength.strength === 3 ? 'text-blue-400' : 'text-green-400'
                }`}>
                  {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Passwort bestätigen
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full bg-black border rounded-xl px-4 py-3 text-white focus:outline-none ${
                confirmPassword && confirmPassword !== password
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-zinc-700 focus:border-[#00FF00]'
              }`}
              placeholder="Passwort wiederholen"
              required
            />
            {confirmPassword && confirmPassword !== password && (
              <p className="text-red-400 text-xs mt-1">Passwörter stimmen nicht überein</p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            fullWidth
            disabled={loading || !password || !confirmPassword || password !== confirmPassword}
          >
            {loading ? 'Wird gespeichert...' : 'Passwort ändern'}
          </Button>
        </form>

        {/* Back to Login */}
        <p className="text-center text-zinc-500 text-sm mt-6">
          <button
            onClick={() => navigate('/login')}
            className="text-[#00FF00] hover:underline"
          >
            Zurück zum Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
