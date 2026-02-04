// User tier definitions and access control
// Tier Structure:
// - free: 8 animals (first row), Lion vs Tiger CYOA only
// - tier2 ($9.99): 30 real animals, all real CYOA matchups
// - tier3 ($19.99): 47 animals (all), all CYOA matchups

export type UserTier = 'unregistered' | 'free' | 'tier2' | 'tier3';

// Free tier animals (first row of selector grid)
export const FREE_ANIMALS = [
  'Lion', 'Tiger', 'Grizzly Bear', 'Polar Bear',
  'Gorilla', 'Great White Shark', 'Orca', 'Crocodile'
];

// All real animals (30 total) - Tier 2+
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

// Dinosaurs (8 total) - Tier 3 only
export const DINOSAUR_ANIMALS = [
  'Tyrannosaurus Rex', 'Velociraptor', 'Triceratops', 'Spinosaurus',
  'Stegosaurus', 'Ankylosaurus', 'Pteranodon', 'Brachiosaurus'
];

// Fantasy (9 total) - Tier 3 only
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
      return ['Lion', 'Tiger']; // Only Lion vs Tiger allowed
    case 'free':
      return FREE_ANIMALS;
    case 'tier2':
      return REAL_ANIMALS;
    case 'tier3':
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

// Check if CYOA mode is accessible for a matchup
export function canAccessCyoa(tier: UserTier, animalA: string, animalB: string): boolean {
  // Unregistered: No CYOA at all
  if (tier === 'unregistered') {
    return false;
  }
  
  // Free: Only Lion vs Tiger CYOA
  if (tier === 'free') {
    const pair = [animalA.toLowerCase(), animalB.toLowerCase()].sort();
    return pair[0] === 'lion' && pair[1] === 'tiger';
  }
  
  // Tier 2: All real animal matchups
  if (tier === 'tier2') {
    return REAL_ANIMALS.includes(animalA) && REAL_ANIMALS.includes(animalB);
  }
  
  // Tier 3: All matchups
  return true;
}

// Get the animal's category
export function getAnimalCategory(animal: string): 'free' | 'real' | 'dinosaur' | 'fantasy' {
  if (FREE_ANIMALS.includes(animal)) return 'free';
  if (REAL_ANIMALS.includes(animal)) return 'real';
  if (DINOSAUR_ANIMALS.includes(animal)) return 'dinosaur';
  if (FANTASY_ANIMALS.includes(animal)) return 'fantasy';
  return 'real'; // Default for unknown animals
}

// Get required tier to access an animal
export function getRequiredTier(animal: string): UserTier {
  if (FREE_ANIMALS.includes(animal)) return 'free';
  if (REAL_ANIMALS.includes(animal)) return 'tier2';
  return 'tier3'; // Dinosaur or Fantasy
}

// Get upgrade options for a tier
export function getUpgradeOptions(currentTier: UserTier): Array<{ tier: UserTier; name: string; price: string; animals: number }> {
  const options: Array<{ tier: UserTier; name: string; price: string; animals: number }> = [];
  
  if (currentTier === 'unregistered' || currentTier === 'free') {
    options.push({ tier: 'tier2', name: 'Real Animals Pack', price: '$9.99', animals: 30 });
    options.push({ tier: 'tier3', name: 'Ultimate Pack', price: '$19.99', animals: 47 });
  } else if (currentTier === 'tier2') {
    options.push({ tier: 'tier3', name: 'Ultimate Pack', price: '$19.99', animals: 47 });
  }
  
  return options;
}

// Get tier display info
export function getTierInfo(tier: UserTier): { name: string; animals: number; badge: string } {
  switch (tier) {
    case 'unregistered':
      return { name: 'Guest', animals: 2, badge: '🎫' };
    case 'free':
      return { name: 'Free', animals: 8, badge: '⭐' };
    case 'tier2':
      return { name: 'Real Animals', animals: 30, badge: '🦁' };
    case 'tier3':
      return { name: 'Ultimate', animals: 47, badge: '👑' };
    default:
      return { name: 'Free', animals: 8, badge: '⭐' };
  }
}
