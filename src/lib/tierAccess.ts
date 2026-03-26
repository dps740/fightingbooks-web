// User tier definitions and access control
// v5 Tier Structure (2026-03-25):
// - unregistered (no account): 4 free sample books only (pre-generated, read-only)
// - unregistered (free signup): 8 popular animals, 28 matchups, cached books only (no new generation)
// - member ($4.99 one-time): All 31 real animals, 465 matchups, full generation, PDFs, tournaments
// - ultimate ($9.99/month): All 48 animals (real + dino + fantasy), CYOA, tournaments, create your own

export type UserTier = 'unregistered' | 'member' | 'ultimate';

// Legacy tier mapping (for existing DB records)
export function normalizeTier(tier: string): UserTier {
  if (tier === 'ultimate') return 'ultimate';
  if (tier === 'tier2' || tier === 'tier3' || tier === 'paid' || tier === 'member') return 'member';
  // 'free' accounts map to unregistered tier (free signup = 8 animals, cached only)
  return 'unregistered';
}

// The 8 free animals (from the 4 sample matchup pairs)
export const FREE_ANIMALS = [
  'Lion', 'Tiger', 'Gorilla', 'Grizzly Bear',
  'Great White Shark', 'Orca', 'Polar Bear', 'Crocodile',
];

// The 4 free sample matchups (pre-generated, available without login)
export const FREE_SAMPLE_MATCHUPS = [
  { animalA: 'Lion', animalB: 'Tiger' },
  { animalA: 'Gorilla', animalB: 'Grizzly Bear' },
  { animalA: 'Great White Shark', animalB: 'Orca' },
  { animalA: 'Polar Bear', animalB: 'Crocodile' },
];

// All real animals (31 total)
export const REAL_ANIMALS = [
  'Lion', 'Tiger', 'Grizzly Bear', 'Polar Bear',
  'Gorilla', 'Great White Shark', 'Orca', 'Crocodile',
  'Elephant', 'Hippo', 'Rhino', 'Wolf', 'Jaguar',
  'Leopard', 'Eagle', 'Giant Panda', 'Electric Eel',
  'Moose', 'Cape Buffalo', 'Great Horned Owl',
  'Alligator', 'Mandrill', 'Cheetah', 'Hyena',
  'Walrus', 'Octopus', 'Hammerhead Shark',
  'King Cobra', 'Python', 'Anaconda', 'Komodo Dragon'
];

// Dinosaurs (8 total) - Ultimate only
export const DINOSAUR_ANIMALS = [
  'Tyrannosaurus Rex', 'Velociraptor', 'Triceratops', 'Spinosaurus',
  'Stegosaurus', 'Brachiosaurus', 'Ankylosaurus', 'Pteranodon'
];

// Fantasy (9 total) - Ultimate only
export const FANTASY_ANIMALS = [
  'Dragon', 'Griffin', 'Hydra', 'Phoenix', 'Cerberus',
  'Chimera', 'Manticore', 'Basilisk', 'Kraken'
];

// All animals (48 total)
export const ALL_ANIMALS = [...REAL_ANIMALS, ...DINOSAUR_ANIMALS, ...FANTASY_ANIMALS];

// Pricing constants (single source of truth)
export const PRICING = {
  member: { amount: 499, display: '$4.99', label: 'one-time' },
  ultimate: { amount: 999, display: '$9.99', label: 'per month' },
};

// Get accessible animals for a tier
export function getAccessibleAnimals(tier: UserTier): string[] {
  switch (tier) {
    case 'unregistered':
      return FREE_ANIMALS; // 8 popular animals only
    case 'member':
      return REAL_ANIMALS; // All 31 real animals
    case 'ultimate':
      return ALL_ANIMALS; // All 48 animals
    default:
      return FREE_ANIMALS;
  }
}

// Check if a matchup is a free sample (available to everyone including no-account)
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

// Check if a tier can trigger new book generation (FAL + OpenAI calls)
// Free/unregistered users can only read cached books — no new generation
export function canGenerate(tier: UserTier): boolean {
  return tier === 'member' || tier === 'ultimate';
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
  if (FREE_ANIMALS.includes(animal)) return 'unregistered';
  if (REAL_ANIMALS.includes(animal)) return 'member';
  return 'ultimate'; // dinos + fantasy
}

// Get upgrade options for a tier
export function getUpgradeOptions(currentTier: UserTier): Array<{ tier: UserTier; name: string; price: string; animals: number; recurring?: boolean }> {
  switch (currentTier) {
    case 'unregistered':
      return [
        { tier: 'member', name: 'Member', price: PRICING.member.display, animals: REAL_ANIMALS.length },
        { tier: 'ultimate', name: 'Ultimate', price: `${PRICING.ultimate.display}/mo`, animals: ALL_ANIMALS.length, recurring: true },
      ];
    case 'member':
      return [
        { tier: 'ultimate', name: 'Ultimate', price: `${PRICING.ultimate.display}/mo`, animals: ALL_ANIMALS.length, recurring: true },
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
      return { name: 'Free', animals: FREE_ANIMALS.length, badge: '🎫', description: `${FREE_ANIMALS.length} popular animals, cached books` };
    case 'member':
      return { name: 'Member', animals: REAL_ANIMALS.length, badge: '🥊', description: `${REAL_ANIMALS.length} real animals + tournaments` };
    case 'ultimate':
      return { name: 'Ultimate', animals: ALL_ANIMALS.length, badge: '👑', description: 'Everything + CYOA + create your own' };
    default:
      return { name: 'Free', animals: FREE_ANIMALS.length, badge: '🎫', description: `${FREE_ANIMALS.length} popular animals, cached books` };
  }
}
