'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserTier } from '@/lib/tierAccess';

interface AccountMenuProps {
  isAuthenticated: boolean;
  email?: string;
  tier: UserTier;
  onUpgrade: () => void;
}

const tierBadges: Record<UserTier, { label: string; shortLabel: string; bg: string; border: string }> = {
  unregistered: { label: 'Level: GUEST', shortLabel: 'GUEST', bg: 'bg-gray-700', border: 'border-gray-500' },
  free: { label: 'Level: FREE', shortLabel: 'FREE', bg: 'bg-green-800', border: 'border-green-500' },
  tier2: { label: 'Level: REAL', shortLabel: 'REAL', bg: 'bg-blue-800', border: 'border-blue-500' },
  tier3: { label: 'Level: ULTIMATE', shortLabel: 'ULTIMATE', bg: 'bg-purple-800', border: 'border-purple-500' },
};

export default function AccountMenu({ isAuthenticated, email, tier, onUpgrade }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const badge = tierBadges[tier];

  // Guest view - Sign Up / Login buttons
  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <a
          href="/login"
          className="px-4 py-2 text-white/80 hover:text-white font-bold text-sm transition-colors"
        >
          Login
        </a>
        <a
          href="/signup"
          className="px-4 py-2 bg-[#FFD700] hover:bg-yellow-400 text-black font-bangers text-sm rounded-lg transition-colors border-2 border-yellow-600"
        >
          SIGN UP FREE
        </a>
      </div>
    );
  }

  // Logged-in view - Tier badge + dropdown
  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${badge.border} ${badge.bg} hover:brightness-110 transition-all`}
      >
        <span className="font-bangers text-white text-sm tracking-wide">{badge.label}</span>
        <svg
          className={`w-4 h-4 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-[#1a1a2e] rounded-xl border-2 border-[#FFD700] shadow-2xl overflow-hidden z-50"
          >
            {/* User Info */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="text-white/60 text-xs truncate">{email}</div>
              <div className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bangers ${badge.bg} text-white`}>
                {badge.shortLabel}
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* Upgrade - only show if not Ultimate */}
              {tier !== 'tier3' && (
                <button
                  onClick={() => { setIsOpen(false); onUpgrade(); }}
                  className="w-full px-4 py-2 text-left text-[#FFD700] hover:bg-white/10 transition-colors flex items-center gap-2 font-bold"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                  </svg>
                  Upgrade
                </button>
              )}

              <a
                href="/"
                className="block px-4 py-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Create Book
              </a>

              <a
                href="/account/password"
                className="block px-4 py-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Change Password
              </a>

              <a
                href="/feedback"
                className="block px-4 py-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Send Feedback
              </a>

              <div className="border-t border-white/10 mt-2 pt-2">
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                  className="w-full px-4 py-2 text-left text-red-400 hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
