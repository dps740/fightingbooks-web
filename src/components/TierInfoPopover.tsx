'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TierInfoPopoverProps {
  isAuthenticated: boolean;
  currentTier?: string;
}

export default function TierInfoPopover({ isAuthenticated, currentTier = 'unregistered' }: TierInfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Trigger */}
      <button className="flex items-center gap-1 text-white/70 hover:text-yellow-400 transition-colors text-sm">
        <span>🔒</span>
        <span className="underline decoration-dotted">See what's included</span>
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-[340px] sm:w-[440px]"
          >
            {/* Arrow */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1a1a2e] rotate-45 border-l border-t border-yellow-500/50"></div>
            
            {/* Content */}
            <div className="bg-[#1a1a2e] rounded-xl border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
              <div className="p-4">
                <h3 className="font-bangers text-xl text-yellow-400 text-center mb-3">UNLOCK MORE ANIMALS!</h3>
                
                {/* Tier Columns */}
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  {/* Free Tier */}
                  <div className={`rounded-lg p-2 ${currentTier === 'free' ? 'bg-green-900/50 ring-2 ring-green-500' : 'bg-white/5'}`}>
                    <div className="text-green-400 font-bold mb-1">FREE</div>
                    <div className="text-2xl mb-1">🎁</div>
                    <div className="text-white font-bold">8</div>
                    <div className="text-white/60 text-xs">animals</div>
                    <div className="mt-2 text-white/50 text-xs">
                      Lion, Tiger,<br/>Bear, Shark...
                    </div>
                    {!isAuthenticated && (
                      <a href="/signup" className="mt-2 block bg-green-600 hover:bg-green-500 text-white text-xs py-1 px-2 rounded font-bold transition-colors">
                        Sign Up
                      </a>
                    )}
                    {currentTier === 'free' && (
                      <div className="mt-2 text-green-400 text-xs font-bold">✓ Current</div>
                    )}
                  </div>

                  {/* Tier 2 */}
                  <div className={`rounded-lg p-2 ${currentTier === 'tier2' ? 'bg-blue-900/50 ring-2 ring-blue-500' : 'bg-white/5'}`}>
                    <div className="text-blue-400 font-bold mb-1">REAL</div>
                    <div className="text-2xl mb-1">🦁</div>
                    <div className="text-white font-bold">30</div>
                    <div className="text-white/60 text-xs">animals</div>
                    <div className="mt-2 text-white/50 text-xs">
                      All real animals<br/>+ CYOA mode
                    </div>
                    <div className="mt-2 text-yellow-400 font-bold text-sm">$9.99</div>
                    {currentTier === 'tier2' && (
                      <div className="mt-1 text-blue-400 text-xs font-bold">✓ Current</div>
                    )}
                  </div>

                  {/* Tier 3 */}
                  <div className={`rounded-lg p-2 ${currentTier === 'tier3' ? 'bg-purple-900/50 ring-2 ring-purple-500' : 'bg-white/5'}`}>
                    <div className="text-purple-400 font-bold mb-1">ULTIMATE</div>
                    <div className="text-2xl mb-1">👑</div>
                    <div className="text-white font-bold">47</div>
                    <div className="text-white/60 text-xs">animals</div>
                    <div className="mt-2 text-white/50 text-xs">
                      + Dinosaurs 🦖<br/>+ Fantasy 🐉
                    </div>
                    <div className="mt-2 text-yellow-400 font-bold text-sm">$19.99</div>
                    {currentTier === 'tier3' && (
                      <div className="mt-1 text-purple-400 text-xs font-bold">✓ Current</div>
                    )}
                  </div>
                </div>

                {/* Bottom note */}
                <p className="text-center text-white/40 text-xs mt-3">
                  One-time purchase • Instant unlock
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
