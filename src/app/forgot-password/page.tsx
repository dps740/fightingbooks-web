'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, Check } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSuccess(true);
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
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 text-white/70 hover:text-[#FFD700] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </button>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-900/50 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 
                className="text-xl font-bangers text-[#FFD700] mb-2"
                style={{ textShadow: '2px 2px 0 #000' }}
              >
                Check your email
              </h2>
              <p className="text-white/70 mb-6">
                We sent a password reset link to<br />
                <span className="font-medium text-white">{email}</span>
              </p>
              <p className="text-sm text-white/60">
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className="text-[#FFD700] hover:underline"
                >
                  try again
                </button>
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h1 
                  className="text-3xl font-bangers text-[#FFD700] mb-2"
                  style={{ textShadow: '2px 2px 0 #000' }}
                >
                  Forgot Password?
                </h1>
                <p className="text-white/70">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

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
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-white/70">
                Remember your password?{' '}
                <a href="/login" className="text-[#FFD700] font-medium hover:underline">
                  Sign in
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
