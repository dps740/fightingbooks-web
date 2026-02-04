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
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
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
            className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-3 w-[380px] sm:w-[580px]"
          >
            {/* Arrow */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1a1a2e] rotate-45 border-l border-t border-[#FFD700]"></div>
            
            {/* Content */}
            <div className="bg-[#1a1a2e] rounded-xl border-4 border-[#FFD700] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-[#8B0000] to-[#CC0000] px-4 py-2">
                <h3 className="font-bangers text-2xl text-[#FFD700] text-center" style={{ textShadow: '2px 2px 0 #000' }}>
                  UNLOCK THE ULTIMATE BATTLES
                </h3>
              </div>
              
              <div className="p-4">
                {/* Tier Columns */}
                <div className="grid grid-cols-3 gap-3">
                  
                  {/* Free Tier */}
                  <div className={`rounded-lg border-2 ${currentTier === 'free' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-white/20 bg-black/20'}`}>
                    <div className="bg-green-800 py-1 rounded-t-md text-center">
                      <span className="font-bangers text-white text-lg">FREE</span>
                    </div>
                    <div className="p-3 text-xs">
                      {/* Big number */}
                      <div className="text-center mb-3">
                        <div className="font-bangers text-3xl text-white">28</div>
                        <div className="text-white/60 uppercase tracking-wide text-[10px]">Unique Books</div>
                      </div>
                      
                      {/* Features */}
                      <div className="space-y-1.5 text-white/80">
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-400 font-bold">»</span>
                          <span>8 fighters</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-400 font-bold">»</span>
                          <span>Classic mode</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-400 font-bold">»</span>
                          <span>8-fighter tournaments</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-white/40">
                          <span className="font-bold">×</span>
                          <span>Adventure mode</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-white/40">
                          <span className="font-bold">×</span>
                          <span>PDF downloads</span>
                        </div>
                      </div>
                      
                      {!isAuthenticated ? (
                        <a href="/signup" className="mt-3 block bg-green-600 hover:bg-green-500 text-white text-xs py-2 px-2 rounded font-bangers transition-colors border-2 border-green-400 text-center">
                          SIGN UP FREE
                        </a>
                      ) : currentTier === 'free' ? (
                        <div className="mt-3 text-[#FFD700] text-xs font-bangers text-center">CURRENT</div>
                      ) : null}
                    </div>
                  </div>

                  {/* Tier 2 - Real Animals */}
                  <div className={`rounded-lg border-2 ${currentTier === 'tier2' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-white/20 bg-black/20'}`}>
                    <div className="bg-blue-800 py-1 rounded-t-md text-center">
                      <span className="font-bangers text-white text-lg">REAL ANIMALS</span>
                    </div>
                    <div className="p-3 text-xs">
                      {/* Big number */}
                      <div className="text-center mb-3">
                        <div className="font-bangers text-3xl text-white">435</div>
                        <div className="text-white/60 uppercase tracking-wide text-[10px]">Unique Books</div>
                      </div>
                      
                      {/* Features */}
                      <div className="space-y-1.5 text-white/80">
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-400 font-bold">»</span>
                          <span>30 real animals</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-400 font-bold">»</span>
                          <span>Classic + Tournament</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-400 font-bold">»</span>
                          <span className="text-[#FFD700]">PDF downloads</span>
                        </div>
                        <div className="bg-gradient-to-r from-purple-900/80 to-purple-800/80 rounded p-1.5 border border-purple-500/50">
                          <div className="text-[#FFD700] font-bangers">435 ADVENTURES</div>
                          <div className="text-white/60 text-[10px]">You control every battle!</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-center">
                        <div className="font-bangers text-[#FFD700] text-xl">$9.99</div>
                        <div className="text-white/40 text-[10px]">one-time</div>
                      </div>
                      {currentTier === 'tier2' && (
                        <div className="mt-1 text-[#FFD700] text-xs font-bangers text-center">CURRENT</div>
                      )}
                    </div>
                  </div>

                  {/* Tier 3 - Ultimate */}
                  <div className={`rounded-lg border-2 ${currentTier === 'tier3' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-[#FFD700]/50 bg-black/20'} relative`}>
                    {/* Best Value Badge */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black text-[10px] font-bangers px-3 py-1 rounded-full whitespace-nowrap">
                      BEST VALUE
                    </div>
                    <div className="bg-gradient-to-r from-purple-800 to-pink-800 py-1 rounded-t-md text-center">
                      <span className="font-bangers text-white text-lg">ULTIMATE</span>
                    </div>
                    <div className="p-3 text-xs">
                      {/* Big number */}
                      <div className="text-center mb-3">
                        <div className="font-bangers text-3xl text-white">1,081</div>
                        <div className="text-white/60 uppercase tracking-wide text-[10px]">Unique Books</div>
                      </div>
                      
                      {/* Features */}
                      <div className="space-y-1.5 text-white/80">
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-400 font-bold">»</span>
                          <span>47 fighters total</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-400 font-bold">»</span>
                          <span className="text-orange-300">8 Dinosaurs</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-400 font-bold">»</span>
                          <span className="text-pink-300">9 Fantasy creatures</span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <span className="text-green-400 font-bold">»</span>
                          <span className="text-[#FFD700]">PDF downloads</span>
                        </div>
                        <div className="bg-gradient-to-r from-purple-900/80 to-pink-900/80 rounded p-1.5 border border-purple-500/50">
                          <div className="text-[#FFD700] font-bangers">1,081 ADVENTURES</div>
                          <div className="text-white/60 text-[10px]">Every matchup playable!</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-center">
                        <div className="font-bangers text-[#FFD700] text-xl">$19.99</div>
                        <div className="text-white/40 text-[10px]">one-time</div>
                      </div>
                      {currentTier === 'tier3' && (
                        <div className="mt-1 text-[#FFD700] text-xs font-bangers text-center">CURRENT</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom - PDF callout */}
                <div className="mt-4 bg-black/30 rounded-lg p-2 text-center">
                  <div className="text-white/70 text-xs">
                    <span className="text-[#FFD700] font-bold">PDF Downloads</span> — Print at home or read on any device
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
