// User tier definitions and access control
// v4 Tier Structure:
// - unregistered: 4 free sample books only (pre-made, read-only, no login needed)
// - member ($4.99 one-time): All 26 real animals, standard + tournament mode
// - ultimate ($4.99/month): Everything — all 43+ animals, all modes, CYOA, create-your-own, +2 animals/month

export type UserTier = 'unregistered' | 'member' | 'ultimate';

// Legacy tier mapping (for existing DB records)
export function normalizeTier(tier: string): UserTier {
  if (tier === 'ultimate') return 'ultimate';
  if (tier === 'tier2' || tier === 'tier3' || tier === 'paid' || tier === 'member') return 'member';
  // 'free' accounts get same access as unregistered (4 sample books only)
  return 'unregistered';
}

// The 4 free sample matchups (pre-generated, available without login)
export const FREE_SAMPLE_MATCHUPS = [
  { animalA: 'Lion', animalB: 'Tiger' },
  { animalA: 'Gorilla', animalB: 'Grizzly Bear' },
  { animalA: 'Great White Shark', animalB: 'Orca' },
  { animalA: 'Polar Bear', animalB: 'Crocodile' },
];

// All real animals (26 total)
export const REAL_ANIMALS = [
  'Lion', 'Tiger', 'Grizzly Bear', 'Polar Bear',
  'Gorilla', 'Great White Shark', 'Orca', 'Crocodile',
  'Elephant', 'Hippo', 'Rhino', 'Wolf', 'Jaguar',
  'Leopard', 'Eagle', 'Giant Panda', 'Electric Eel',
  'Moose', 'Cape Buffalo', 'Great Horned Owl',
  'Alligator', 'Mandrill', 'Cheetah', 'Hyena',
  'Walrus', 'Octopus', 'Hammerhead Shark',
  'King Cobra', 'Python', 'Anaconda'
];

// Dinosaurs (8 total) - Paid only
export const DINOSAUR_ANIMALS = [
  'Tyrannosaurus Rex', 'Velociraptor', 'Triceratops', 'Spinosaurus',
  'Stegosaurus', 'Brachiosaurus', 'Ankylosaurus', 'Pteranodon'
];

// Fantasy (9 total) - Paid only
export const FANTASY_ANIMALS = [
  'Dragon', 'Griffin', 'Hydra', 'Phoenix', 'Cerberus',
  'Chimera', 'Manticore', 'Basilisk', 'Kraken'
];

// All animals (43 total)
export const ALL_ANIMALS = [...REAL_ANIMALS, ...DINOSAUR_ANIMALS, ...FANTASY_ANIMALS];

// Get accessible animals for a tier
export function getAccessibleAnimals(tier: UserTier): string[] {
  switch (tier) {
    case 'unregistered':
      return []; // No animal selector access — only 4 pre-made sample books
    case 'member':
      return REAL_ANIMALS;
    case 'ultimate':
      return ALL_ANIMALS;
    default:
      return [];
  }
}

// Check if a matchup is a free sample (available to everyone)
export function isFreeSampleMatchup(animalA: string, animalB: string): boolean {
  return FREE_SAMPLE_MATCHUPS.some(m =>
    (m.animalA === animalA && m.animalB === animalB) ||
    (m.animalA === animalB && m.animalB === animalA)
  );
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

// Check if CYOA mode is accessible (ultimate only)
export function canAccessCyoa(tier: UserTier): boolean {
  return tier === 'ultimate';
}

// Check if Tournament mode is accessible (member + ultimate)
export function canAccessTournament(tier: UserTier): boolean {
  return tier === 'member' || tier === 'ultimate';
}

// Check if Create Your Own is accessible (ultimate only)
export function canAccessCreateOwn(tier: UserTier): boolean {
  return tier === 'ultimate';
}

// Monthly generation limit for custom animals (ultimate tier)
export const CUSTOM_ANIMAL_MONTHLY_LIMIT = 20;

// Get the animal's category
export function getAnimalCategory(animal: string): 'real' | 'dinosaur' | 'fantasy' {
  if (REAL_ANIMALS.includes(animal)) return 'real';
  if (DINOSAUR_ANIMALS.includes(animal)) return 'dinosaur';
  if (FANTASY_ANIMALS.includes(animal)) return 'fantasy';
  return 'real';
}

// Get required tier to access an animal
export function getRequiredTier(animal: string): UserTier {
  if (REAL_ANIMALS.includes(animal)) return 'member';
  return 'ultimate'; // dinos + fantasy
}

// Get upgrade options for a tier
export function getUpgradeOptions(currentTier: UserTier): Array<{ tier: UserTier; name: string; price: string; animals: number; recurring?: boolean }> {
  switch (currentTier) {
    case 'unregistered':
      return [
        { tier: 'member', name: 'Member', price: '$4.99', animals: 26 },
        { tier: 'ultimate', name: 'Ultimate', price: '$4.99/mo', animals: 43, recurring: true },
      ];
    case 'member':
      return [
        { tier: 'ultimate', name: 'Ultimate', price: '$4.99/mo', animals: 43, recurring: true },
      ];
    case 'ultimate':
      return [];
    default:
      return [];
  }
}

// Get tier display info
export function getTierInfo(tier: UserTier): { name: string; animals: number; badge: string; description: string } {
  switch (tier) {
    case 'unregistered':
      return { name: 'Guest', animals: 0, badge: '🎫', description: '4 free sample books' };
    case 'member':
      return { name: 'Member', animals: 26, badge: '🥊', description: '26 real animals + tournaments' };
    case 'ultimate':
      return { name: 'Ultimate', animals: 43, badge: '👑', description: 'Everything + CYOA + create your own' };
    default:
      return { name: 'Guest', animals: 0, badge: '🎫', description: '4 free sample books' };
  }
}
