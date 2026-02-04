'use client';

import { useState, useEffect } from 'react';
import { UserTier, getAccessibleAnimals, FREE_ANIMALS, REAL_ANIMALS } from './tierAccess';

interface TierData {
  tier: UserTier;
  name: string;
  animals: string[];
  badge: string;
  isAuthenticated: boolean;
  cyoaAccess: string;
  canUpgradeTo: Array<{ tier: UserTier; name: string; price: string; animals: number }>;
  email?: string;
  loading: boolean;
  error: string | null;
}

// Client-side hook to fetch and cache user tier
export function useTier(): TierData {
  const [data, setData] = useState<TierData>({
    tier: 'unregistered',
    name: 'Guest',
    animals: ['Lion', 'Tiger'],
    badge: '🎫',
    isAuthenticated: false,
    cyoaAccess: 'none',
    canUpgradeTo: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchTier() {
      try {
        const response = await fetch('/api/user/tier');
        if (response.ok) {
          const tierData = await response.json();
          setData({
            ...tierData,
            loading: false,
            error: null,
          });
        } else {
          // API error, default to unregistered
          setData(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to fetch tier',
          }));
        }
      } catch (error) {
        // Network error, default to unregistered
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Network error',
        }));
      }
    }

    fetchTier();
  }, []);

  return data;
}

// Check if an animal is locked for a given tier (client-side)
export function isAnimalLocked(tier: UserTier, animalName: string): boolean {
  const accessible = getAccessibleAnimals(tier);
  return !accessible.includes(animalName);
}

// Get lock reason for an animal
export function getLockReason(tier: UserTier, animalName: string): string | null {
  if (!isAnimalLocked(tier, animalName)) return null;

  if (FREE_ANIMALS.includes(animalName)) {
    return null; // Free animals are never locked
  }

  if (REAL_ANIMALS.includes(animalName)) {
    return 'Unlock with Real Animals Pack ($9.99)';
  }

  // Dinosaur or Fantasy
  return 'Unlock with Ultimate Pack ($19.99)';
}

// Check if CYOA is locked for a matchup (client-side)
export function isCyoaLocked(tier: UserTier, animalA: string, animalB: string): boolean {
  if (tier === 'unregistered') return true;
  if (tier === 'tier3') return false;

  // Free tier: only Lion vs Tiger
  if (tier === 'free') {
    const pair = [animalA.toLowerCase(), animalB.toLowerCase()].sort();
    return !(pair[0] === 'lion' && pair[1] === 'tiger');
  }

  // Tier 2: only real animals
  if (tier === 'tier2') {
    return !REAL_ANIMALS.includes(animalA) || !REAL_ANIMALS.includes(animalB);
  }

  return false;
}
