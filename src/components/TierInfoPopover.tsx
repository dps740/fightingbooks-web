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
            className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-3 w-[360px] sm:w-[520px]"
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
                <div className="grid grid-cols-3 gap-3 text-center">
                  
                  {/* Free Tier */}
                  <div className={`rounded-lg border-2 ${currentTier === 'free' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-white/20 bg-black/20'}`}>
                    <div className="bg-green-800 py-1 rounded-t-md">
                      <span className="font-bangers text-white text-lg">FREE</span>
                    </div>
                    <div className="p-3">
                      <div className="font-bangers text-4xl text-white">8</div>
                      <div className="text-white/60 text-xs uppercase tracking-wide mb-3">Fighters</div>
                      
                      <div className="text-left text-xs space-y-2">
                        <div className="text-white/90 font-medium">
                          Classic Battles
                        </div>
                        <div className="text-white/50 text-[11px] leading-relaxed">
                          Lion, Tiger, Bear, Shark, Gorilla, Orca, Croc, Polar Bear
                        </div>
                      </div>
                      
                      {!isAuthenticated ? (
                        <a href="/signup" className="mt-4 block bg-green-600 hover:bg-green-500 text-white text-sm py-2 px-3 rounded font-bangers transition-colors border-2 border-green-400">
                          SIGN UP FREE
                        </a>
                      ) : currentTier === 'free' ? (
                        <div className="mt-4 text-[#FFD700] text-sm font-bangers">CURRENT</div>
                      ) : null}
                    </div>
                  </div>

                  {/* Tier 2 - Real Animals */}
                  <div className={`rounded-lg border-2 ${currentTier === 'tier2' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-white/20 bg-black/20'}`}>
                    <div className="bg-blue-800 py-1 rounded-t-md">
                      <span className="font-bangers text-white text-lg">REAL ANIMALS</span>
                    </div>
                    <div className="p-3">
                      <div className="font-bangers text-4xl text-white">30</div>
                      <div className="text-white/60 text-xs uppercase tracking-wide mb-3">Fighters</div>
                      
                      <div className="text-left text-xs space-y-2">
                        <div className="text-white/90">
                          <span className="text-green-400 font-bold">+</span> Wolves, Eagles, Jaguars
                        </div>
                        <div className="text-white/90">
                          <span className="text-green-400 font-bold">+</span> Hippos, Rhinos, Elephants
                        </div>
                        <div className="bg-gradient-to-r from-purple-900/80 to-purple-800/80 rounded p-2 mt-2 border border-purple-500/50">
                          <div className="text-[#FFD700] font-bangers text-sm">ADVENTURE MODE</div>
                          <div className="text-white/70 text-[10px] mt-0.5">You control the battle!</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 font-bangers text-[#FFD700] text-2xl">$9.99</div>
                      <div className="text-white/40 text-[10px]">one-time</div>
                      {currentTier === 'tier2' && (
                        <div className="mt-1 text-[#FFD700] text-sm font-bangers">CURRENT</div>
                      )}
                    </div>
                  </div>

                  {/* Tier 3 - Ultimate */}
                  <div className={`rounded-lg border-2 ${currentTier === 'tier3' ? 'border-[#FFD700] bg-[#FFD700]/10' : 'border-[#FFD700]/50 bg-black/20'} relative`}>
                    {/* Best Value Badge */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black text-[10px] font-bangers px-3 py-1 rounded-full whitespace-nowrap">
                      BEST VALUE
                    </div>
                    <div className="bg-gradient-to-r from-purple-800 to-pink-800 py-1 rounded-t-md">
                      <span className="font-bangers text-white text-lg">ULTIMATE</span>
                    </div>
                    <div className="p-3">
                      <div className="font-bangers text-4xl text-white">47</div>
                      <div className="text-white/60 text-xs uppercase tracking-wide mb-3">Fighters</div>
                      
                      <div className="text-left text-xs space-y-2">
                        <div className="text-white/90">
                          <span className="text-green-400 font-bold">+</span> All 30 real animals
                        </div>
                        <div className="bg-gradient-to-r from-orange-900/80 to-red-900/80 rounded p-2 border border-orange-500/50">
                          <div className="text-orange-300 font-bangers text-sm">8 DINOSAURS</div>
                          <div className="text-white/60 text-[10px]">T-Rex, Raptor, Triceratops...</div>
                        </div>
                        <div className="bg-gradient-to-r from-pink-900/80 to-purple-900/80 rounded p-2 border border-pink-500/50">
                          <div className="text-pink-300 font-bangers text-sm">9 FANTASY</div>
                          <div className="text-white/60 text-[10px]">Dragon, Griffin, Hydra, Kraken...</div>
                        </div>
                        <div className="text-[#FFD700]/80 text-[10px] font-bold mt-1">
                          + Full Adventure Mode
                        </div>
                      </div>
                      
                      <div className="mt-2 font-bangers text-[#FFD700] text-2xl">$19.99</div>
                      <div className="text-white/40 text-[10px]">one-time</div>
                      {currentTier === 'tier3' && (
                        <div className="mt-1 text-[#FFD700] text-sm font-bangers">CURRENT</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom CTA */}
                <div className="mt-4 text-center">
                  <p className="text-white/50 text-xs">
                    One-time purchase · Instant unlock · 1,000+ battle combinations
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
