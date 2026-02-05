'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowLeft, Check, AlertCircle } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check if user is logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch('/api/user/tier');
        const data = await response.json();
        if (!data.isAuthenticated) {
          router.push('/login');
        } else {
          setIsAuthenticated(true);
        }
      } catch {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated === null) {
    return (
      <main 
        className="min-h-screen p-4 md:p-8 flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)' }}
      >
        <div className="animate-spin text-4xl">⏳</div>
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
          {/* Back button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white/70 hover:text-[#FFD700] mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to generator
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 
              className="text-3xl font-bangers text-[#FFD700] mb-2"
              style={{ textShadow: '2px 2px 0 #000' }}
            >
              Change Password
            </h1>
            <p className="text-white/70">
              Update your account password
            </p>
          </div>

          {/* Success message */}
          {success && (
            <div className="bg-green-900/50 border border-green-500 text-green-200 p-4 rounded-xl mb-6 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Password changed successfully!
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0d0d1a] border-2 border-[#FFD700]/30 rounded-xl focus:border-[#FFD700] focus:outline-none text-white placeholder:text-white/30"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                'Update Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
