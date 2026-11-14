import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Disc3, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Button } from '../components/common/Button.js';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      await register(email, password, username, displayName);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-violet/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-dark-900 border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-emerald to-brand-cyan flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <Disc3 className="w-7 h-7 text-black animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Join TuneScope</h1>
          <p className="text-xs text-slate-400">
            Discover your auditory DNA & connect with music lovers
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Jordan Miles"
              required
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald transition"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jordan_beats"
              required
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald transition"
            />
          </div>

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
              placeholder="Minimum 6 characters"
              required
              className="w-full bg-dark-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-emerald transition"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-emerald font-semibold hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

