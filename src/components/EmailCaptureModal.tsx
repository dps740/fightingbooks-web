'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
}

export default function EmailCaptureModal({ isOpen, onClose, onSubmit }: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/capture-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'custom_book_gate' }),
      });
      if (!res.ok) throw new Error('Failed to save');
      localStorage.setItem('fb_email', email);
      onSubmit(email);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1a1a2e] rounded-2xl p-8 max-w-md w-full border-4 border-[#FFD700] relative"
            style={{ boxShadow: '0 0 40px rgba(255,215,0,0.3)' }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-white/50 hover:text-white text-2xl leading-none"
            >
              ×
            </button>

            {/* Icon */}
            <div className="text-center mb-4">
              <span className="text-5xl">📖</span>
            </div>

            <h2
              className="font-bangers text-2xl sm:text-3xl text-[#FFD700] text-center mb-2"
              style={{ textShadow: '2px 2px 0 #000' }}
            >
              Get Your Free Custom Book
            </h2>

            <p className="text-white/80 text-center text-sm mb-6">
              Enter your email to create your first custom wildlife book
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@example.com"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border-2 border-white/20 text-white placeholder-white/40 focus:border-[#FFD700] focus:outline-none transition-colors text-lg"
                autoFocus
              />

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-4 rounded-xl font-bangers text-2xl bg-gradient-to-b from-yellow-400 to-orange-500 text-red-900 border-3 border-yellow-600 shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {loading ? '⏳ Saving...' : '⚔️ Create My Book'}
              </button>
            </form>

            <p className="text-white/40 text-xs text-center mt-4">
              We&apos;ll send reading tips and new animal updates. No spam. Unsubscribe anytime.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
