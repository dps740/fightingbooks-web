'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { UserTier } from '@/lib/tierAccess';

interface UpgradeOption {
  tier: UserTier;
  name: string;
  price: string;
  animals: number;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lockedAnimal?: string;
  currentTier: UserTier;
  upgradeOptions: UpgradeOption[];
  onUpgrade: (tier: UserTier) => void;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  lockedAnimal,
  currentTier,
  upgradeOptions,
  onUpgrade,
}: UpgradeModalProps) {
  if (!isOpen) return null;

  const tierBenefits = {
    tier2: [
      '🦁 30 Real Animals',
      '⚔️ 435 Battle Combinations',
      '🎭 Adventure Mode (Real Animals)',
      '📥 PDF Downloads',
    ],
    tier3: [
      '👑 ALL 47 Animals',
      '🦖 8 Dinosaurs',
      '🐉 9 Fantasy Creatures',
      '🎭 Adventure Mode (Everything)',
      '⚔️ 1,081 Battle Combinations',
      '📥 PDF Downloads',
    ],
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] rounded-2xl p-6 max-w-lg mx-4 border-4 border-[#FFD700] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔒</div>
            <h2 className="font-bangers text-3xl text-[#FFD700]" style={{ textShadow: '2px 2px 0 #000' }}>
              UNLOCK MORE ANIMALS!
            </h2>
            {lockedAnimal && (
              <p className="text-white/80 mt-2">
                <span className="font-bold text-[#FFD700]">{lockedAnimal}</span> requires an upgrade
              </p>
            )}
          </div>

          {/* Current tier info */}
          <div className="bg-white/5 rounded-lg p-3 mb-4 text-center">
            <p className="text-white/60 text-sm">
              Your current tier: <span className="text-[#FFD700] font-bold">{currentTier === 'unregistered' ? 'Guest' : currentTier === 'free' ? 'Free' : currentTier === 'tier2' ? 'Real Animals' : 'Ultimate'}</span>
            </p>
          </div>

          {/* Upgrade options */}
          <div className="space-y-4">
            {upgradeOptions.map((option) => (
              <div
                key={option.tier}
                className={`rounded-xl p-4 border-2 transition-all ${
                  option.tier === 'tier3'
                    ? 'border-purple-500 bg-gradient-to-r from-purple-900/50 to-pink-900/50'
                    : 'border-green-500 bg-gradient-to-r from-green-900/50 to-emerald-900/50'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bangers text-xl text-white">
                      {option.tier === 'tier3' ? '👑 ' : '🦁 '}
                      {option.name}
                    </h3>
                    <p className="text-white/60 text-sm">{option.animals} animals</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bangers text-2xl text-[#FFD700]">{option.price}</p>
                    <p className="text-white/50 text-xs">one-time</p>
                  </div>
                </div>

                {/* Benefits */}
                <ul className="space-y-1 mb-4">
                  {tierBenefits[option.tier as 'tier2' | 'tier3']?.map((benefit, i) => (
                    <li key={i} className="text-white/80 text-sm flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onUpgrade(option.tier)}
                  className={`w-full py-3 rounded-lg font-bangers text-xl transition-all hover:scale-105 ${
                    option.tier === 'tier3'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  }`}
                >
                  UNLOCK NOW
                </button>
              </div>
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="mt-4 w-full py-2 text-white/50 hover:text-white transition-colors text-sm"
          >
            Maybe later
          </button>

          {/* Sign up prompt for unregistered */}
          {currentTier === 'unregistered' && (
            <div className="mt-4 p-3 bg-blue-900/30 rounded-lg border border-blue-500/30 text-center">
              <p className="text-white/80 text-sm">
                🎁 <span className="font-bold">Create a FREE account</span> to unlock 8 animals instantly!
              </p>
              <a
                href="/signup"
                className="inline-block mt-2 px-6 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-400 transition-colors"
              >
                Sign Up Free
              </a>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
