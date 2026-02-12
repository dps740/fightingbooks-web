'use client';

import { useState, useEffect } from 'react';
import { UserTier, getAccessibleAnimals, FREE_ANIMALS, canAccessCyoa, canAccessTournament } from './tierAccess';

interface TierData {
  tier: UserTier;
  name: string;
  animals: string[];
  badge: string;
  isAuthenticated: boolean;
  cyoaAccess: boolean;
  tournamentAccess: boolean;
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
    cyoaAccess: false,
    tournamentAccess: false,
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
          setData(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to fetch tier',
          }));
        }
      } catch (error) {
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
  return 'Unlock all 47 animals for $3.99';
}

// Check if CYOA is locked (client-side)
export function isCyoaLocked(tier: UserTier): boolean {
  return !canAccessCyoa(tier);
}

// Check if Tournament is locked (client-side)
export function isTournamentLocked(tier: UserTier): boolean {
  return !canAccessTournament(tier);
}
