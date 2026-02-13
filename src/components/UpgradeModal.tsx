'use client';

import { useState } from 'react';
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
  lockedFeature?: string; // 'cyoa' | 'tournament' | null
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
        // Reload page after brief success message
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

  const benefits = [
    '👑 ALL 47 Animals (real, dinosaurs, fantasy)',
    '🎭 Choose Your Own Adventure mode',
    '🏆 Tournament bracket mode',
    '⚔️ 1,081 battle combinations',
    '📥 PDF downloads',
  ];

  const headerText = lockedAnimal 
    ? `${lockedAnimal} requires Full Access`
    : lockedFeature === 'cyoa'
    ? 'Adventure mode requires Full Access'
    : lockedFeature === 'tournament'
    ? 'Tournament mode requires Full Access'
    : 'Unlock everything!';

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
          className="bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] rounded-2xl p-6 max-w-md mx-4 border-4 border-[#FFD700] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🔓</div>
            <h2 className="font-bangers text-3xl text-[#FFD700]" style={{ textShadow: '2px 2px 0 #000' }}>
              FULL ACCESS
            </h2>
            <p className="text-white/80 mt-2">{headerText}</p>
          </div>

          {/* Single upgrade option */}
          <div className="rounded-xl p-5 border-2 border-[#FFD700] bg-gradient-to-r from-[#2a1a00]/50 to-[#1a1a00]/50 mb-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bangers text-2xl text-white">👑 Everything. Forever.</h3>
                <p className="text-white/60 text-sm">One payment, full access</p>
              </div>
              <div className="text-right">
                <p className="font-bangers text-3xl text-[#FFD700]">$3.99</p>
                <p className="text-white/50 text-xs">one-time</p>
              </div>
            </div>

            {/* Benefits */}
            <ul className="space-y-2 mb-5">
              {benefits.map((benefit, i) => (
                <li key={i} className="text-white/80 text-sm flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>

            {currentTier === 'unregistered' ? (
              <a
                href="/signup?redirect=upgrade"
                className="block w-full py-3 rounded-lg font-bangers text-xl text-center bg-gradient-to-r from-yellow-400 to-orange-500 text-red-900 hover:scale-105 transition-all"
              >
                SIGN UP & UNLOCK — $3.99
              </a>
            ) : (
              <button
                onClick={() => onUpgrade('paid' as UserTier)}
                className="w-full py-3 rounded-lg font-bangers text-xl bg-gradient-to-r from-yellow-400 to-orange-500 text-red-900 hover:scale-105 transition-all"
              >
                UNLOCK NOW — $3.99
              </button>
            )}
          </div>

          {/* Promo code section */}
          {(currentTier === 'free' || (currentTier === 'unregistered' && isAuthenticated)) && (
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

          {/* Sign up prompt for unregistered */}
          {currentTier === 'unregistered' && (
            <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-500/30 text-center mb-4">
              <p className="text-white/80 text-sm">
                🎁 <span className="font-bold">Create a FREE account</span> to unlock 8 animals and classic battles!
              </p>
              <a
                href="/signup"
                className="inline-block mt-2 px-6 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-400 transition-colors"
              >
                Sign Up Free
              </a>
            </div>
          )}

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
