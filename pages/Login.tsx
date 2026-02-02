import React, { useState } from 'react';
import { signInWithEmail } from '../services/supabase';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import { useLanguage } from '../context/LanguageContext';
import { ChevronRight } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message || 'Login failed.';
      if (err.message?.includes('Invalid login credentials')) {
          errorMessage = t('auth.invalidCredential');
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-zinc-900/20 to-transparent pointer-events-none"></div>
      
      <div className="w-full max-w-sm z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-white tracking-tighter mb-2">
            GREENLIGHT<span className="text-[#00FF00]">.</span>
          </h1>
          <p className="text-zinc-500 font-medium">{t('auth.loginTitle')}</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label={t('auth.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="coach@example.com"
            className="text-lg"
          />
          <Input
            label={t('auth.password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="text-lg"
          />
          
          <div className="pt-4">
            <Button type="submit" fullWidth disabled={loading} size="lg" className="group">
              {loading ? t('auth.signingIn') : (
                <span className="flex items-center gap-2">{t('auth.signIn')} <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform"/></span>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-10 text-center">
          <p className="text-zinc-500 text-sm mb-4">{t('auth.noAccount')}</p>
          <Link to="/register">
            <Button variant="secondary" fullWidth size="md">
                {t('auth.registerLink')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;