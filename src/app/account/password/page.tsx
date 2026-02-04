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
      <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8">
          {/* Back button */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to generator
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Change Password
            </h1>
            <p className="text-gray-500">
              Update your account password
            </p>
          </div>

          {/* Success message */}
          {success && (
            <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Password changed successfully!
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-100 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
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
