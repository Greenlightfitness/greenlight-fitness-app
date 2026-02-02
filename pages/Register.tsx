import React, { useState } from 'react';
import { signUpWithEmail, supabase, logConsent, createAuditLog } from '../services/supabase';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { UserRole } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ChevronLeft, Square, CheckSquare } from 'lucide-react';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.ATHLETE);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    if (!acceptedTerms) {
      setError("Bitte akzeptiere die Datenschutzbestimmungen und AGB.");
      return;
    }

    setLoading(true);

    try {
      // 1. Supabase Auth Create (trigger auto-creates profile)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (signUpError) throw signUpError;
      
      const user = data.user;
      if (!user) throw new Error('Registration failed');

      // 2. Update profile with selected role (trigger created with ATHLETE default)
      // Small delay to ensure trigger has created the profile
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: role })
        .eq('id', user.id);
      
      if (updateError) console.warn('Role update error:', updateError);

      // 3. Log GDPR Consent (Art. 7 DSGVO - Nachweispflicht)
      try {
        await logConsent({ user_id: user.id, consent_type: 'TERMS', consent_given: true, consent_version: '1.0' });
        await logConsent({ user_id: user.id, consent_type: 'PRIVACY', consent_given: true, consent_version: '1.0' });
        await createAuditLog({ user_id: user.id, action: 'ACCOUNT_CREATED', table_name: 'profiles', record_id: user.id });
      } catch (consentErr) {
        console.warn('Consent logging failed (non-blocking):', consentErr);
      }

      // 4. Trigger Resend Welcome Email (via Vercel Serverless Function)
      fetch('/api/send-gdpr-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, type: 'account_created', name: user.email?.split('@')[0] }),
      }).catch(err => console.error("Email sending failed (non-blocking)", err));

      navigate('/');
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || 'Registration failed.';
      if (err.message?.includes('Password should be at least')) {
        errorMessage = t('auth.passwordTooShort');
      } else if (err.message?.includes('already registered')) {
        errorMessage = t('auth.emailInUse');
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-6">
      
      <div className="w-full max-w-sm z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Link to="/login" className="inline-flex items-center text-zinc-500 hover:text-white mb-8 transition-colors">
            <ChevronLeft size={20} /> Back
        </Link>
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tighter mb-2">
            {t('auth.registerTitle')}
          </h1>
          <p className="text-zinc-500">Create your Greenlight account.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <Input
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
          <Input
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <div className="flex flex-col gap-2 mb-4">
            <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest ml-1">{t('auth.accountType')}</label>
            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => setRole(UserRole.ATHLETE)}
                    className={`p-4 rounded-xl border text-sm font-bold transition-all ${role === UserRole.ATHLETE ? 'bg-[#00FF00] text-black border-[#00FF00]' : 'bg-[#1C1C1E] text-zinc-400 border-transparent hover:bg-zinc-800'}`}
                >
                    {t('auth.athlete')}
                </button>
                <button
                    type="button"
                    onClick={() => setRole(UserRole.COACH)}
                    className={`p-4 rounded-xl border text-sm font-bold transition-all ${role === UserRole.COACH ? 'bg-[#00FF00] text-black border-[#00FF00]' : 'bg-[#1C1C1E] text-zinc-400 border-transparent hover:bg-zinc-800'}`}
                >
                    {t('auth.coach')}
                </button>
            </div>
          </div>

          {/* DSGVO Consent Checkbox */}
          <div className="flex items-start gap-3 my-4 cursor-pointer" onClick={() => setAcceptedTerms(!acceptedTerms)}>
             <div className={`mt-0.5 transition-colors ${acceptedTerms ? 'text-[#00FF00]' : 'text-zinc-600'}`}>
                 {acceptedTerms ? <CheckSquare size={20} /> : <Square size={20} />}
             </div>
             <p className="text-xs text-zinc-400 select-none">
                 Ich stimme der Verarbeitung meiner Daten gemäß der <Link to="/legal/privacy" target="_blank" className="text-white hover:underline" onClick={e => e.stopPropagation()}>Datenschutzerklärung</Link> zu und akzeptiere die <Link to="/legal/imprint" target="_blank" className="text-white hover:underline" onClick={e => e.stopPropagation()}>AGB</Link>.
             </p>
          </div>
          
          <Button type="submit" fullWidth disabled={loading} size="lg">
            {loading ? t('auth.creating') : t('auth.register')}
          </Button>
        </form>
        
        {/* Developer Mode Toggle */}
        <div className="flex justify-center mt-6">
            <button
                type="button"
                onClick={() => setRole(UserRole.ADMIN)}
                className={`text-[10px] uppercase font-bold tracking-widest transition-colors ${role === UserRole.ADMIN ? 'text-red-500' : 'text-zinc-800 hover:text-zinc-600'}`}
            >
                {t('auth.admin')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Register;