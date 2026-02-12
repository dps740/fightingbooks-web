// User tier definitions and access control
// v2 Tier Structure:
// - unregistered: Lion vs Tiger only, classic only
// - free (signup): 8 animals, classic only, no CYOA/tournament
// - paid ($3.99 one-time): Everything — all 47 animals, all modes, CYOA, tournament

export type UserTier = 'unregistered' | 'free' | 'paid';

// Legacy tier mapping (for existing DB records)
export function normalizeTier(tier: string): UserTier {
  if (tier === 'tier2' || tier === 'tier3' || tier === 'paid') return 'paid';
  if (tier === 'free') return 'free';
  return 'unregistered';
}

// Free tier animals (first row of selector grid)
export const FREE_ANIMALS = [
  'Lion', 'Tiger', 'Grizzly Bear', 'Polar Bear',
  'Gorilla', 'Great White Shark', 'Orca', 'Crocodile'
];

// All real animals (30 total)
export const REAL_ANIMALS = [
  'Lion', 'Tiger', 'Grizzly Bear', 'Polar Bear',
  'Gorilla', 'Great White Shark', 'Orca', 'Crocodile',
  'Elephant', 'Hippo', 'Rhino', 'Komodo Dragon',
  'King Cobra', 'Anaconda', 'Wolf', 'Jaguar',
  'Leopard', 'Eagle', 'Wolverine', 'Honey Badger',
  'Moose', 'Cape Buffalo', 'Cassowary', 'Python',
  'Alligator', 'Black Panther', 'Cheetah', 'Hyena',
  'Walrus', 'Octopus'
];

// Dinosaurs (8 total) - Paid only
export const DINOSAUR_ANIMALS = [
  'Tyrannosaurus Rex', 'Velociraptor', 'Triceratops', 'Spinosaurus',
  'Stegosaurus', 'Ankylosaurus', 'Pteranodon', 'Brachiosaurus'
];

// Fantasy (9 total) - Paid only
export const FANTASY_ANIMALS = [
  'Dragon', 'Griffin', 'Hydra', 'Phoenix', 'Cerberus',
  'Chimera', 'Manticore', 'Basilisk', 'Kraken'
];

// All animals (47 total)
export const ALL_ANIMALS = [...REAL_ANIMALS, ...DINOSAUR_ANIMALS, ...FANTASY_ANIMALS];

// Get accessible animals for a tier
export function getAccessibleAnimals(tier: UserTier): string[] {
  switch (tier) {
    case 'unregistered':
      return ['Lion', 'Tiger'];
    case 'free':
      return FREE_ANIMALS;
    case 'paid':
      return ALL_ANIMALS;
    default:
      return FREE_ANIMALS;
  }
}

// Check if an animal is accessible for a tier
export function canAccessAnimal(tier: UserTier, animal: string): boolean {
  const accessible = getAccessibleAnimals(tier);
  return accessible.includes(animal);
}

// Check if a matchup (both animals) is accessible
export function canAccessMatchup(tier: UserTier, animalA: string, animalB: string): boolean {
  return canAccessAnimal(tier, animalA) && canAccessAnimal(tier, animalB);
}

// Check if CYOA mode is accessible
export function canAccessCyoa(tier: UserTier): boolean {
  return tier === 'paid';
}

// Check if Tournament mode is accessible
export function canAccessTournament(tier: UserTier): boolean {
  return tier === 'paid';
}

// Get the animal's category
export function getAnimalCategory(animal: string): 'free' | 'real' | 'dinosaur' | 'fantasy' {
  if (FREE_ANIMALS.includes(animal)) return 'free';
  if (REAL_ANIMALS.includes(animal)) return 'real';
  if (DINOSAUR_ANIMALS.includes(animal)) return 'dinosaur';
  if (FANTASY_ANIMALS.includes(animal)) return 'fantasy';
  return 'real';
}

// Get required tier to access an animal
export function getRequiredTier(animal: string): UserTier {
  if (FREE_ANIMALS.includes(animal)) return 'free';
  return 'paid';
}

// Get upgrade options for a tier
export function getUpgradeOptions(currentTier: UserTier): Array<{ tier: UserTier; name: string; price: string; animals: number }> {
  if (currentTier === 'paid') return [];
  return [{ tier: 'paid', name: 'Full Access', price: '$3.99', animals: 47 }];
}

// Get tier display info
export function getTierInfo(tier: UserTier): { name: string; animals: number; badge: string } {
  switch (tier) {
    case 'unregistered':
      return { name: 'Guest', animals: 2, badge: '🎫' };
    case 'free':
      return { name: 'Free', animals: 8, badge: '⭐' };
    case 'paid':
      return { name: 'Full Access', animals: 47, badge: '👑' };
    default:
      return { name: 'Free', animals: 8, badge: '⭐' };
  }
}
