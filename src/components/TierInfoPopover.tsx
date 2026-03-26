'use client';

import { useState } from 'react';

interface TierInfoPopoverProps {
  isAuthenticated: boolean;
  currentTier: string;
}

export default function TierInfoPopover({ isAuthenticated, currentTier }: TierInfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isPaid = currentTier === 'paid' || currentTier === 'tier2' || currentTier === 'tier3' || currentTier === 'member' || currentTier === 'ultimate';

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
                ? 'Unlock all 48 animals, Adventure mode, and Tournaments!'
                : 'Sign up free for 8 animals, or unlock everything!'}
            </p>

            <div className="space-y-2">
              <div className="bg-white/5 rounded-lg p-3 border border-[#FFD700]/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-bold">🥊 Member</span>
                  <span className="font-bangers text-[#FFD700] text-xl">$4.99</span>
                </div>
                <p className="text-white/60 text-xs">31 real animals • Tournaments • PDFs • One-time</p>
              </div>

              <div className="bg-white/5 rounded-lg p-3 border border-purple-500/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white font-bold">👑 Ultimate</span>
                  <span className="font-bangers text-purple-300 text-xl">$9.99/mo</span>
                </div>
                <p className="text-white/60 text-xs">48 animals • Adventure • Dinos & Fantasy • Create Your Own</p>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="mt-3 bg-blue-900/30 rounded-lg p-2 border border-blue-500/20">
                <p className="text-white/70 text-xs">🎁 Free account = 8 animals + cached battles</p>
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
