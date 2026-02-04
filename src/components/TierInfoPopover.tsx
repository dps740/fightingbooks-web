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
      <button className="flex items-center gap-2 text-white/60 hover:text-[#FFD700] transition-colors text-sm font-bold">
        <span className="text-lg">🔒</span>
        <span className="underline decoration-dotted underline-offset-2">Why are some locked?</span>
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-3 w-[360px] sm:w-[500px]"
          >
            {/* Arrow */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1a1a2e] rotate-45 border-l border-t border-[#FFD700]"></div>
            
            {/* Content */}
            <div className="bg-[#1a1a2e] rounded-xl border-4 border-[#FFD700] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#8B0000] to-[#CC0000] px-4 py-2">
                <h3 className="font-bangers text-2xl text-[#FFD700] text-center" style={{ textShadow: '2px 2px 0 #000' }}>
                  UNLOCK MORE FIGHTERS
                </h3>
              </div>
              
              <div className="p-4">
                {/* Tier Columns - Fight Card Style */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  
                  {/* Free Tier */}
                  <div className={`rounded-lg border-2 ${currentTier === 'free' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-white/20 bg-black/20'}`}>
                    <div className="bg-green-800 py-1 rounded-t-md">
                      <span className="font-bangers text-white text-lg">FREE</span>
                    </div>
                    <div className="p-3">
                      <div className="font-bangers text-3xl text-white">8</div>
                      <div className="text-white/60 text-xs uppercase tracking-wide">Fighters</div>
                      
                      <div className="mt-3 text-left text-xs space-y-1">
                        <div className="text-white/80">✓ Lion, Tiger, Bear...</div>
                        <div className="text-white/80">✓ Classic mode</div>
                        <div className="text-white/50">✗ Adventure (CYOA)</div>
                        <div className="text-white/50">✗ Dinosaurs</div>
                        <div className="text-white/50">✗ Fantasy</div>
                      </div>
                      
                      {!isAuthenticated ? (
                        <a href="/signup" className="mt-3 block bg-green-600 hover:bg-green-500 text-white text-sm py-2 px-3 rounded font-bangers transition-colors">
                          SIGN UP FREE
                        </a>
                      ) : currentTier === 'free' ? (
                        <div className="mt-3 text-[#FFD700] text-sm font-bangers">★ CURRENT ★</div>
                      ) : null}
                    </div>
                  </div>

                  {/* Tier 2 - Real Animals */}
                  <div className={`rounded-lg border-2 ${currentTier === 'tier2' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-white/20 bg-black/20'}`}>
                    <div className="bg-blue-800 py-1 rounded-t-md">
                      <span className="font-bangers text-white text-lg">REAL</span>
                    </div>
                    <div className="p-3">
                      <div className="font-bangers text-3xl text-white">30</div>
                      <div className="text-white/60 text-xs uppercase tracking-wide">Fighters</div>
                      
                      <div className="mt-3 text-left text-xs space-y-1">
                        <div className="text-white/80">✓ All real animals</div>
                        <div className="text-white/80">✓ Classic mode</div>
                        <div className="text-green-400 font-bold">✓ Adventure (CYOA)</div>
                        <div className="text-white/50">✗ Dinosaurs</div>
                        <div className="text-white/50">✗ Fantasy</div>
                      </div>
                      
                      <div className="mt-3 font-bangers text-[#FFD700] text-xl">$9.99</div>
                      {currentTier === 'tier2' && (
                        <div className="text-[#FFD700] text-sm font-bangers">★ CURRENT ★</div>
                      )}
                    </div>
                  </div>

                  {/* Tier 3 - Ultimate */}
                  <div className={`rounded-lg border-2 ${currentTier === 'tier3' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-white/20 bg-black/20'} relative`}>
                    {/* Best Value Badge */}
                    <div className="absolute -top-2 -right-2 bg-[#FFD700] text-black text-[10px] font-bold px-2 py-0.5 rounded-full transform rotate-12">
                      BEST
                    </div>
                    <div className="bg-purple-800 py-1 rounded-t-md">
                      <span className="font-bangers text-white text-lg">ULTIMATE</span>
                    </div>
                    <div className="p-3">
                      <div className="font-bangers text-3xl text-white">47</div>
                      <div className="text-white/60 text-xs uppercase tracking-wide">Fighters</div>
                      
                      <div className="mt-3 text-left text-xs space-y-1">
                        <div className="text-white/80">✓ All real animals</div>
                        <div className="text-white/80">✓ Classic mode</div>
                        <div className="text-green-400 font-bold">✓ Adventure (CYOA)</div>
                        <div className="text-green-400 font-bold">✓ 8 Dinosaurs</div>
                        <div className="text-green-400 font-bold">✓ 9 Fantasy</div>
                      </div>
                      
                      <div className="mt-3 font-bangers text-[#FFD700] text-xl">$19.99</div>
                      {currentTier === 'tier3' && (
                        <div className="text-[#FFD700] text-sm font-bangers">★ CURRENT ★</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <p className="text-center text-white/40 text-xs mt-4">
                  One-time purchase • Unlock instantly • No subscription
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
