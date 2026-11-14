import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Disc3, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/common/Button.js';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setIsDemoLoading(true);
      setError(null);
      await demoLogin();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-emerald/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-violet/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-dark-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-emerald to-brand-cyan flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <Disc3 className="w-7 h-7 text-black animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">TuneScope</h1>
          <p className="text-xs text-slate-400">
            Music intelligence & social music analytics
          </p>
        </div>

        {/* Demo User Fast Track Button */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-emerald/10 via-brand-cyan/10 to-brand-violet/10 border border-brand-emerald/25 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand-emerald" />
            <span className="text-xs font-bold text-white">Instant Demo Access</span>
          </div>
          <p className="text-[11px] text-slate-300">
            Explore with pre-seeded rich scrobbles, Wrapped slide decks, and friend feeds.
          </p>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={isDemoLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-emerald to-brand-cyan text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md hover:opacity-95 transition disabled:opacity-50"
          >
            {isDemoLoading ? 'Launching Demo...' : 'Continue as Alex Mercer (Demo)'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
            Or Sign In
          </span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald transition"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald transition"
            />
          </div>

          <Button
            type="submit"
            variant="secondary"
            size="md"
            className="w-full"
            isLoading={isLoading}
          >
            Sign In
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Don’t have an account?{' '}
          <Link to="/register" className="text-brand-emerald font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

