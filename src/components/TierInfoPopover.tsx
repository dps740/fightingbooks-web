'use client';

import { useState } from 'react';

interface TierInfoPopoverProps {
  isAuthenticated: boolean;
  currentTier: string;
}

export default function TierInfoPopover({ isAuthenticated, currentTier }: TierInfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isPaid = currentTier === 'paid' || currentTier === 'tier2' || currentTier === 'tier3';

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-white/60 hover:text-white text-sm transition-colors"
      >
        <span className="underline decoration-dotted underline-offset-2">
          {isPaid ? '👑 Full Access' : 'Why are some locked?'}
        </span>
      </button>

      {isOpen && !isPaid && (
        <div
          className="absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-72 bg-[#1a1a2e] border-2 border-[#FFD700] rounded-xl p-4 shadow-2xl"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="text-center">
            <p className="text-white/80 text-sm mb-3">
              {isAuthenticated 
                ? 'Unlock all 47 animals, Adventure mode, and Tournaments!'
                : 'Sign up free for 8 animals, or unlock everything!'}
            </p>

            <div className="bg-white/5 rounded-lg p-3 border border-[#FFD700]/30">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-bold">👑 Full Access</span>
                <span className="font-bangers text-[#FFD700] text-xl">$4.99</span>
              </div>
              <p className="text-white/60 text-xs">47 animals • Adventure • Tournaments • One-time</p>
            </div>

            {!isAuthenticated && (
              <div className="mt-3 bg-blue-900/30 rounded-lg p-2 border border-blue-500/20">
                <p className="text-white/70 text-xs">🎁 Free account = 8 animals + Classic mode</p>
              </div>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1a1a2e] border-l-2 border-t-2 border-[#FFD700] rotate-45" />
        </div>
      )}
    </div>
  );
}
