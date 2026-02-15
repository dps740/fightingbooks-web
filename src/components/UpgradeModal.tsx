'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserTier } from '@/lib/tierAccess';

interface UpgradeOption {
  tier: UserTier;
  name: string;
  price: string;
  animals: number;
  recurring?: boolean;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lockedAnimal?: string;
  lockedFeature?: string; // 'cyoa' | 'tournament' | 'create_own' | null
  currentTier: UserTier;
  upgradeOptions: UpgradeOption[];
  onUpgrade: (tier: UserTier) => void;
  isAuthenticated?: boolean;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  lockedAnimal,
  lockedFeature,
  currentTier,
  upgradeOptions,
  onUpgrade,
  isAuthenticated,
}: UpgradeModalProps) {
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePromoRedeem = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    try {
      const response = await fetch('/api/promo/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase() }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPromoSuccess(true);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setPromoError(data.error || 'Invalid code');
      }
    } catch {
      setPromoError('Something went wrong. Try again.');
    } finally {
      setPromoLoading(false);
    }
  };

  // Determine if the locked content needs member or ultimate
  const needsUltimate = lockedFeature === 'cyoa' || lockedFeature === 'create_own' ||
    (lockedAnimal && !['Lion', 'Tiger', 'Grizzly Bear', 'Polar Bear', 'Gorilla', 'Great White Shark', 'Orca', 'Crocodile',
      'Elephant', 'Hippo', 'Rhino', 'Wolf', 'Jaguar',
      'Leopard', 'Eagle', 'Giant Panda', 'Electric Eel', 'Moose', 'Cape Buffalo', 'Great Horned Owl',
      'Alligator', 'Mandrill', 'Cheetah', 'Hyena', 'Walrus', 'Octopus'].includes(lockedAnimal));

  const headerText = lockedAnimal
    ? needsUltimate
      ? `${lockedAnimal} requires Ultimate!`
      : `${lockedAnimal} requires Member access`
    : lockedFeature === 'cyoa'
    ? 'Adventure mode requires Ultimate!'
    : lockedFeature === 'tournament'
    ? 'Tournament mode requires Member access'
    : lockedFeature === 'create_own'
    ? 'Create Your Own requires Ultimate!'
    : 'Unlock more animals & features!';

  const memberBenefits = [
    '🥊 30 Real Animals (435 matchups!)',
    '⚔️ Tournament bracket mode',
    '📥 PDF downloads',
    '🆕 Future real animal additions',
  ];

  const ultimateBenefits = [
    '👑 ALL 47+ Animals (real, dinos, fantasy)',
    '🎭 Choose Your Own Adventure mode',
    '⚔️ Tournament bracket mode',
    '✨ Create Your Own animal matchups',
    '🦖 Dinosaurs & 🐉 Fantasy creatures',
    '📅 +2 new animals every month',
    '📥 PDF downloads',
  ];

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
          className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] rounded-2xl p-6 max-w-lg mx-4 border-4 border-[#FFD700] shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔓</div>
            <h2 className="font-bangers text-3xl text-[#FFD700]" style={{ textShadow: '2px 2px 0 #000' }}>
              UPGRADE
            </h2>
            <p className="text-white/80 mt-2">{headerText}</p>
          </div>

          {/* Tier options */}
          <div className="space-y-4 mb-4">
            {/* Member tier (show if not already member+) */}
            {currentTier === 'unregistered' && (
              <div className={`rounded-xl p-5 border-2 ${needsUltimate ? 'border-white/20' : 'border-[#FFD700]'} bg-gradient-to-r from-[#1a2a00]/50 to-[#1a1a00]/50`}>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="font-bangers text-2xl text-white">🥊 Member</h3>
                    <p className="text-white/60 text-sm">One payment, yours forever</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bangers text-3xl text-[#FFD700]">$4.99</p>
                    <p className="text-white/50 text-xs">one-time</p>
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4">
                  {memberBenefits.map((benefit, i) => (
                    <li key={i} className="text-white/80 text-sm flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>

                {currentTier === 'unregistered' ? (
                  <a
                    href="/signup?redirect=upgrade"
                    className="block w-full py-3 rounded-lg font-bangers text-xl text-center bg-gradient-to-r from-green-400 to-emerald-500 text-black hover:scale-105 transition-all"
                  >
                    SIGN UP & GET MEMBER — $4.99
                  </a>
                ) : (
                  <button
                    onClick={() => onUpgrade('member' as UserTier)}
                    className="w-full py-3 rounded-lg font-bangers text-xl bg-gradient-to-r from-green-400 to-emerald-500 text-black hover:scale-105 transition-all"
                  >
                    GET MEMBER — $4.99
                  </button>
                )}
              </div>
            )}

            {/* Ultimate tier */}
            <div className={`rounded-xl p-5 border-2 ${needsUltimate ? 'border-[#FFD700]' : 'border-purple-500/50'} bg-gradient-to-r from-[#2a1a3a]/50 to-[#1a0a2a]/50 relative`}>
              {needsUltimate && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#FFD700] text-black font-bangers text-sm rounded-full">
                  RECOMMENDED
                </div>
              )}
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-bangers text-2xl text-white">👑 Ultimate</h3>
                  <p className="text-white/60 text-sm">Everything, updated monthly</p>
                </div>
                <div className="text-right">
                  <p className="font-bangers text-3xl text-purple-300">$4.99</p>
                  <p className="text-white/50 text-xs">per month</p>
                </div>
              </div>

              <ul className="space-y-1.5 mb-4">
                {ultimateBenefits.map((benefit, i) => (
                  <li key={i} className="text-white/80 text-sm flex items-center gap-2">
                    <span className="text-purple-400">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>

              {currentTier === 'unregistered' ? (
                <a
                  href="/signup?redirect=upgrade"
                  className="block w-full py-3 rounded-lg font-bangers text-xl text-center bg-gradient-to-r from-purple-400 to-pink-500 text-white hover:scale-105 transition-all"
                >
                  SIGN UP & GO ULTIMATE — $4.99/mo
                </a>
              ) : (
                <button
                  onClick={() => onUpgrade('ultimate' as UserTier)}
                  className="w-full py-3 rounded-lg font-bangers text-xl bg-gradient-to-r from-purple-400 to-pink-500 text-white hover:scale-105 transition-all"
                >
                  GO ULTIMATE — $4.99/mo
                </button>
              )}
            </div>
          </div>

          {/* Promo code section */}
          {(currentTier === 'member' || (currentTier === 'unregistered' && isAuthenticated)) && (
            <div className="bg-white/5 rounded-lg p-4 mb-4">
              <p className="text-white/60 text-sm mb-2">Have a promo code?</p>
              {promoSuccess ? (
                <div className="text-green-400 text-center font-bold">✅ Code applied! Refreshing...</div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="flex-1 bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-mono tracking-wider focus:outline-none focus:border-[#FFD700]"
                    maxLength={20}
                  />
                  <button
                    onClick={handlePromoRedeem}
                    disabled={promoLoading || !promoCode.trim()}
                    className="px-4 py-2 bg-[#FFD700] text-black rounded-lg font-bold text-sm hover:bg-yellow-300 disabled:opacity-50 transition-all"
                  >
                    {promoLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
              {promoError && <p className="text-red-400 text-xs mt-1">{promoError}</p>}
            </div>
          )}

          {/* No free signup tier — guests go straight to Member or Ultimate */}

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-2 text-white/50 hover:text-white transition-colors text-sm"
          >
            Maybe later
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
