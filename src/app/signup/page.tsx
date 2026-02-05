'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Sparkles, ArrowLeft, Check } from 'lucide-react';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  
  // Get redirect URL and message from query params
  const redirectUrl = searchParams.get('redirect');
  const message = searchParams.get('message');
  const isAdventureSignup = message === 'signup_for_adventure';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Redirect to original page if provided, otherwise dashboard
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main 
      className="min-h-screen p-4 md:p-8 flex items-center justify-center font-comic"
      style={{ background: 'linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)' }}
    >
      <div className="max-w-md w-full">
        <div className="bg-[#1a1a2e] border-4 border-[#FFD700] rounded-3xl shadow-2xl p-8">
          {/* Back button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white/70 hover:text-[#FFD700] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to generator
          </button>

          {/* Adventure Mode Banner */}
          {isAdventureSignup && mode === 'signup' && (
            <div className="bg-[#0d0d1a] border-2 border-[#FFD700]/50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-[#FFD700] mb-1">🎮 Adventure Mode Awaits!</h3>
              <p className="text-white/80 text-sm">
                Create a free account to play Choose Your Own Adventure battles!
                Your choices affect the outcome.
              </p>
            </div>
          )}

          {/* Header */}
          <div className="text-center mb-8">
            <h1 
              className="text-3xl font-bangers text-[#FFD700] mb-2"
              style={{ textShadow: '2px 2px 0 #000' }}
            >
              {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-white/70">
              {mode === 'signup' 
                ? (isAdventureSignup ? 'Sign up to unlock Adventure mode!' : 'Start creating unlimited battle books!')
                : 'Sign in to continue creating books'}
            </p>
          </div>

          {/* Pricing info for signup */}
          {mode === 'signup' && (
            <div className="bg-[#0d0d1a] border-2 border-[#FFD700]/50 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-[#FFD700] mb-2">🎁 Free Account Includes</h3>
              <ul className="text-white/80 text-sm space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  8 popular animals (28 matchups)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  Unlimited book generation
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  PDF downloads
                </li>
              </ul>
              <p className="text-[#FFD700]/80 text-xs mt-2">
                Upgrade anytime: Real Animals $9.99 • Ultimate $19.99
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0d0d1a] border-2 border-[#FFD700]/30 rounded-xl focus:border-[#FFD700] focus:outline-none text-white placeholder:text-white/30"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0d0d1a] border-2 border-[#FFD700]/30 rounded-xl focus:border-[#FFD700] focus:outline-none text-white placeholder:text-white/30"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)' }}
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {mode === 'signup' ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center text-sm text-white/70">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button 
                  onClick={() => setMode('login')} 
                  className="text-[#FFD700] font-medium hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button 
                  onClick={() => setMode('signup')} 
                  className="text-[#FFD700] font-medium hover:underline"
                >
                  Create one
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <main 
        className="min-h-screen p-4 md:p-8 flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)' }}
      >
        <div className="text-center">
          <span className="animate-spin text-4xl">⏳</span>
          <p className="mt-4 text-white/70">Loading...</p>
        </div>
      </main>
    }>
      <SignupForm />
    </Suspense>
  );
}
