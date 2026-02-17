'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ArrowLeft, Check, Send, Lock } from 'lucide-react';

export default function FeedbackPage() {
  const router = useRouter();
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [authChecking, setAuthChecking] = useState(true);
  const [isMember, setIsMember] = useState(false);

  // Check if user is a member/ultimate
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          // member or ultimate can access feedback
          setIsMember(data.tier === 'member' || data.tier === 'ultimate');
        }
      } catch {
        // Not logged in
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: feedbackType, message, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send feedback');
      }

      setSuccess(true);
      setMessage('');
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

          {/* Loading state */}
          {authChecking && (
            <div className="text-center py-12">
              <span className="text-4xl animate-spin inline-block">⏳</span>
            </div>
          )}

          {/* Not a member */}
          {!authChecking && !isMember && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-[#FFD700]/10 border-2 border-[#FFD700]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-[#FFD700]" />
              </div>
              <h2 className="text-2xl font-bangers text-[#FFD700] mb-2" style={{ textShadow: '2px 2px 0 #000' }}>
                Members Only
              </h2>
              <p className="text-white/70 mb-6">
                Feedback is available for members. Upgrade to share your ideas and help shape FightingBooks!
              </p>
              <button
                onClick={() => router.push('/#pricing')}
                className="text-white py-3 px-6 rounded-xl font-bangers text-lg hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)' }}
              >
                🥊 Become a Member
              </button>
            </div>
          )}

          {/* Member content */}
          {!authChecking && isMember && <>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)' }}>
              <MessageSquare className="w-8 h-8 text-[#FFD700]" />
            </div>
            <h1 
              className="text-3xl font-bangers text-[#FFD700] mb-2"
              style={{ textShadow: '2px 2px 0 #000' }}
            >
              Send Feedback
            </h1>
            <p className="text-white/70">
              Help us make FightingBooks better!
            </p>
          </div>

          {/* Success message */}
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-900/50 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bangers text-[#FFD700] mb-2">Thank you!</h2>
              <p className="text-white/70 mb-6">Your feedback has been received.</p>
              <button
                onClick={() => { setSuccess(false); setMessage(''); }}
                className="text-[#FFD700] font-bold hover:underline"
              >
                Send more feedback
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Feedback type */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  What type of feedback?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'bug', label: '🐛 Bug', color: 'red' },
                    { value: 'feature', label: '✨ Feature', color: 'blue' },
                    { value: 'general', label: '💬 General', color: 'purple' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFeedbackType(type.value as typeof feedbackType)}
                      className={`py-2 px-3 rounded-xl border-2 text-sm font-bangers transition-all ${
                        feedbackType === type.value
                          ? 'border-[#FFD700] bg-[#FFD700]/20 text-[#FFD700]'
                          : 'border-white/20 text-white/60 hover:border-white/40'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Your feedback
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 bg-[#0d0d1a] border-2 border-[#FFD700]/30 rounded-xl focus:border-[#FFD700] focus:outline-none resize-none text-white placeholder:text-white/30"
                  placeholder={
                    feedbackType === 'bug'
                      ? "What went wrong? Please include steps to reproduce..."
                      : feedbackType === 'feature'
                      ? "What feature would you like to see?"
                      : "Tell us what's on your mind..."
                  }
                  rows={5}
                  required
                />
              </div>

              {/* Email (optional) */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Email <span className="text-white/40">(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-[#0d0d1a] border-2 border-[#FFD700]/30 rounded-xl focus:border-[#FFD700] focus:outline-none text-white placeholder:text-white/30"
                  placeholder="your@email.com"
                />
                <p className="text-xs text-white/40 mt-1">
                  Include if you&apos;d like us to follow up
                </p>
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="w-full text-white py-3 rounded-xl font-bangers text-xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)' }}
              >
                {loading ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Feedback
                  </>
                )}
              </button>
            </form>
          )}
          </>}
        </div>
      </div>
    </main>
  );
}
