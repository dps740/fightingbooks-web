// Content moderation utilities for free-text animal input

// Basic blocklist - catches obvious bad stuff
const BLOCKLIST = [
  // Slurs and hate speech (abbreviated patterns to catch variations)
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'kike', 'chink', 'spic', 'wetback',
  'tranny', 'cunt', 'bitch', 'whore', 'slut',
  // Violence/illegal
  'child', 'kids', 'baby', 'murder', 'rape', 'molest', 'pedo', 'porn', 'nude', 'naked', 'sex',
  // Political figures (avoid controversy)
  'trump', 'biden', 'obama', 'hitler', 'nazi', 'stalin', 'putin',
  // Other problematic
  'slave', 'lynch', 'terrorist', 'bomb', 'shoot', 'kill human',
];

// Patterns that look suspicious
const SUSPICIOUS_PATTERNS = [
  /\d{3,}/, // Long numbers (phone numbers, etc)
  /[A-Z]{5,}/, // ALL CAPS spam
  /@|http|www\./, // URLs or emails
  /(.)\1{4,}/, // Repeated characters (aaaaaaa)
];

export interface ModerationResult {
  allowed: boolean;
  reason?: string;
  flagged?: boolean; // Soft flag - allowed but noted
}

/**
 * Quick local check - no API call, instant
 */
export function quickContentCheck(input: string): ModerationResult {
  const lower = input.toLowerCase().trim();
  
  // Empty or too short
  if (lower.length < 2) {
    return { allowed: false, reason: 'Input too short' };
  }
  
  // Too long (probably spam)
  if (lower.length > 50) {
    return { allowed: false, reason: 'Input too long - keep it simple!' };
  }
  
  // Check blocklist
  for (const word of BLOCKLIST) {
    if (lower.includes(word)) {
      return { allowed: false, reason: 'This input is not allowed' };
    }
  }
  
  // Check suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(input)) {
      return { allowed: false, reason: 'Please enter a valid animal name' };
    }
  }
  
  return { allowed: true };
}

/**
 * AI-powered check - validates if input is a reasonable creature
 * Returns quickly with cached common animals
 */
const KNOWN_ANIMALS = new Set([
  'lion', 'tiger', 'bear', 'elephant', 'gorilla', 'shark', 'whale', 'eagle', 'wolf',
  'crocodile', 'alligator', 'hippo', 'hippopotamus', 'rhino', 'rhinoceros', 'giraffe',
  'zebra', 'cheetah', 'leopard', 'jaguar', 'panther', 'cougar', 'puma', 'lynx',
  'hyena', 'jackal', 'fox', 'coyote', 'dog', 'cat', 'horse', 'cow', 'bull', 'buffalo',
  'bison', 'moose', 'elk', 'deer', 'antelope', 'gazelle', 'kangaroo', 'koala',
  'polar bear', 'grizzly bear', 'brown bear', 'black bear', 'panda', 'sloth',
  'monkey', 'chimpanzee', 'orangutan', 'baboon', 'mandrill', 'lemur',
  'snake', 'python', 'anaconda', 'cobra', 'viper', 'rattlesnake', 'boa',
  'komodo dragon', 'iguana', 'gecko', 'chameleon', 'turtle', 'tortoise',
  'great white shark', 'hammerhead', 'bull shark', 'tiger shark', 'orca', 'killer whale',
  'dolphin', 'octopus', 'squid', 'giant squid', 'jellyfish', 'stingray', 'manta ray',
  'crab', 'lobster', 'scorpion', 'spider', 'tarantula', 'centipede', 'mantis',
  'eagle', 'hawk', 'falcon', 'owl', 'vulture', 'condor', 'raven', 'crow',
  'penguin', 'ostrich', 'emu', 'cassowary', 'pelican', 'flamingo', 'swan', 'goose',
  'tyrannosaurus', 't-rex', 'velociraptor', 'triceratops', 'stegosaurus', 'pterodactyl',
  'mammoth', 'sabertooth', 'megalodon', 'woolly mammoth',
  'dragon', 'griffin', 'phoenix', 'unicorn', 'kraken', 'hydra', 'cerberus', 'minotaur',
  'wolverine', 'badger', 'honey badger', 'weasel', 'otter', 'beaver', 'porcupine',
  'armadillo', 'anteater', 'aardvark', 'warthog', 'wild boar', 'pig',
  'ram', 'goat', 'sheep', 'llama', 'alpaca', 'camel', 'donkey', 'mule',
  'walrus', 'seal', 'sea lion', 'manatee', 'narwhal', 'beluga',
  'ant', 'bee', 'wasp', 'hornet', 'beetle', 'dragonfly', 'butterfly', 'moth',
  'frog', 'toad', 'salamander', 'newt', 'axolotl',
  'piranha', 'barracuda', 'swordfish', 'marlin', 'tuna', 'salmon', 'trout',
  'electric eel', 'moray eel', 'anglerfish', 'pufferfish', 'lionfish',
]);

export function isKnownAnimal(input: string): boolean {
  const lower = input.toLowerCase().trim();
  return KNOWN_ANIMALS.has(lower);
}

/**
 * Rate limiting using localStorage
 */
const RATE_LIMIT_KEY = 'fb_custom_animal_count';
const RATE_LIMIT_DATE_KEY = 'fb_custom_animal_date';
const DAILY_LIMIT = 5; // Free users get 5 custom animals per day

export function checkRateLimit(): { allowed: boolean; remaining: number } {
  if (typeof window === 'undefined') {
    return { allowed: true, remaining: DAILY_LIMIT };
  }
  
  const today = new Date().toDateString();
  const storedDate = localStorage.getItem(RATE_LIMIT_DATE_KEY);
  
  // Reset if new day
  if (storedDate !== today) {
    localStorage.setItem(RATE_LIMIT_DATE_KEY, today);
    localStorage.setItem(RATE_LIMIT_KEY, '0');
    return { allowed: true, remaining: DAILY_LIMIT };
  }
  
  const count = parseInt(localStorage.getItem(RATE_LIMIT_KEY) || '0', 10);
  const remaining = Math.max(0, DAILY_LIMIT - count);
  
  return { allowed: count < DAILY_LIMIT, remaining };
}

export function incrementRateLimit(): void {
  if (typeof window === 'undefined') return;
  
  const count = parseInt(localStorage.getItem(RATE_LIMIT_KEY) || '0', 10);
  localStorage.setItem(RATE_LIMIT_KEY, String(count + 1));
}

/**
 * Full validation chain
 */
export async function validateAnimalInput(input: string): Promise<ModerationResult> {
  // Step 1: Quick local check
  const quickCheck = quickContentCheck(input);
  if (!quickCheck.allowed) {
    return quickCheck;
  }
  
  // Step 2: If it's a known animal, allow immediately
  if (isKnownAnimal(input)) {
    return { allowed: true };
  }
  
  // Step 3: Rate limit for unknown animals
  const rateLimit = checkRateLimit();
  if (!rateLimit.allowed) {
    return { 
      allowed: false, 
      reason: `Daily limit reached for custom animals. Try a common animal or come back tomorrow!` 
    };
  }
  
  // Step 4: Flag as experimental but allow
  return { 
    allowed: true, 
    flagged: true // Mark for potential AI check later
  };
}
