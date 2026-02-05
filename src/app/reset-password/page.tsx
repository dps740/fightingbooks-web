'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, ArrowLeft, Check, AlertCircle } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  // Check for access token in URL (Supabase adds it as hash fragment)
  useEffect(() => {
    // Supabase puts the token in the URL hash, we need to handle it
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      // Token is present, user can reset password
      return;
    }
    
    // Check URL params (some flows use query params)
    const token = searchParams.get('token');
    const type = searchParams.get('type');
    
    if (!hash && !token && type !== 'recovery') {
      // No valid reset token found
      setTokenError(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password,
          // Pass the hash fragment to the API
          accessToken: window.location.hash,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (tokenError) {
    return (
      <main 
        className="min-h-screen p-4 md:p-8 flex items-center justify-center font-comic"
        style={{ background: 'linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)' }}
      >
        <div className="max-w-md w-full">
          <div className="bg-[#1a1a2e] border-4 border-[#FFD700] rounded-3xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-900/50 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 
              className="text-xl font-bangers text-[#FFD700] mb-2"
              style={{ textShadow: '2px 2px 0 #000' }}
            >
              Invalid Reset Link
            </h2>
            <p className="text-white/70 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <a
              href="/forgot-password"
              className="inline-block text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)' }}
            >
              Request New Link
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main 
      className="min-h-screen p-4 md:p-8 flex items-center justify-center font-comic"
      style={{ background: 'linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)' }}
    >
      <div className="max-w-md w-full">
        <div className="bg-[#1a1a2e] border-4 border-[#FFD700] rounded-3xl shadow-2xl p-8">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-900/50 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 
                className="text-xl font-bangers text-[#FFD700] mb-2"
                style={{ textShadow: '2px 2px 0 #000' }}
              >
                Password Reset!
              </h2>
              <p className="text-white/70 mb-6">
                Your password has been successfully updated.
              </p>
              <a
                href="/login"
                className="inline-block text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)' }}
              >
                Sign In
              </a>
            </div>
          ) : (
            <>
              {/* Back button */}
              <button
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 text-white/70 hover:text-[#FFD700] mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </button>

              {/* Header */}
              <div className="text-center mb-8">
                <h1 
                  className="text-3xl font-bangers text-[#FFD700] mb-2"
                  style={{ textShadow: '2px 2px 0 #000' }}
                >
                  Set New Password
                </h1>
                <p className="text-white/70">
                  Enter your new password below
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    New Password
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

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0d0d1a] border-2 border-[#FFD700]/30 rounded-xl focus:border-[#FFD700] focus:outline-none text-white placeholder:text-white/30"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
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
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main 
        className="min-h-screen p-4 md:p-8 flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)' }}
      >
        <div className="max-w-md w-full">
          <div className="bg-[#1a1a2e] border-4 border-[#FFD700] rounded-3xl shadow-2xl p-8 text-center">
            <p className="text-white/70">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
