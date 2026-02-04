'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, ArrowLeft, Check, Send } from 'lucide-react';

export default function FeedbackPage() {
  const router = useRouter();
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Send Feedback
            </h1>
            <p className="text-gray-500">
              Help us make FightingBooks better!
            </p>
          </div>

          {/* Success message */}
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Thank you!</h2>
              <p className="text-gray-500 mb-6">Your feedback has been received.</p>
              <button
                onClick={() => { setSuccess(false); setMessage(''); }}
                className="text-purple-600 font-medium hover:underline"
              >
                Send more feedback
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Feedback type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className={`py-2 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        feedbackType === type.value
                          ? type.value === 'bug' 
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : type.value === 'feature'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your feedback
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none resize-none"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder="your@email.com"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Include if you&apos;d like us to follow up
                </p>
              </div>

              {error && (
                <div className="bg-red-100 text-red-600 p-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
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
        </div>
      </div>
    </main>
  );
}
