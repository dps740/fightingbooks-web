export interface Fighter {
  name: string;
  category: 'real' | 'dinosaur' | 'fantasy';
}

export const FIGHTERS: Fighter[] = [
  { name: 'Lion', category: 'real' },
  { name: 'Tiger', category: 'real' },
  { name: 'Grizzly Bear', category: 'real' },
  { name: 'Polar Bear', category: 'real' },
  { name: 'Gorilla', category: 'real' },
  { name: 'Great White Shark', category: 'real' },
  { name: 'Orca', category: 'real' },
  { name: 'Crocodile', category: 'real' },
  { name: 'Elephant', category: 'real' },
  { name: 'Hippo', category: 'real' },
  { name: 'Rhino', category: 'real' },
  { name: 'Wolf', category: 'real' },
  { name: 'Jaguar', category: 'real' },
  { name: 'Leopard', category: 'real' },
  { name: 'Eagle', category: 'real' },
  { name: 'Giant Panda', category: 'real' },
  { name: 'Electric Eel', category: 'real' },
  { name: 'Moose', category: 'real' },
  { name: 'Cape Buffalo', category: 'real' },
  { name: 'Great Horned Owl', category: 'real' },
  { name: 'Alligator', category: 'real' },
  { name: 'Mandrill', category: 'real' },
  { name: 'Cheetah', category: 'real' },
  { name: 'Hyena', category: 'real' },
  { name: 'Walrus', category: 'real' },
  { name: 'Octopus', category: 'real' },
  // Dinosaurs
  { name: 'Tyrannosaurus Rex', category: 'dinosaur' },
  { name: 'Velociraptor', category: 'dinosaur' },
  { name: 'Triceratops', category: 'dinosaur' },
  { name: 'Spinosaurus', category: 'dinosaur' },
  { name: 'Stegosaurus', category: 'dinosaur' },
  { name: 'Ankylosaurus', category: 'dinosaur' },
  { name: 'Pteranodon', category: 'dinosaur' },
  { name: 'Brachiosaurus', category: 'dinosaur' },
  // Fantasy
  { name: 'Dragon', category: 'fantasy' },
  { name: 'Griffin', category: 'fantasy' },
  { name: 'Hydra', category: 'fantasy' },
  { name: 'Phoenix', category: 'fantasy' },
  { name: 'Cerberus', category: 'fantasy' },
  { name: 'Chimera', category: 'fantasy' },
  { name: 'Manticore', category: 'fantasy' },
  { name: 'Basilisk', category: 'fantasy' },
  { name: 'Kraken', category: 'fantasy' },
];

// Map of blog article slugs to the animal pairs they cover
// Key format: "animal1-lower|animal2-lower" (alphabetical order)
export const BLOG_MATCHUPS: Record<string, string> = {
  'lion|tiger': 'lion-vs-tiger',
  'bear|gorilla': 'gorilla-vs-bear',
  'gorilla|grizzly bear': 'gorilla-vs-bear',
  'crocodile|great white shark': 'crocodile-vs-shark',
  'crocodile|hippo': 'hippo-vs-crocodile',
  'gorilla|lion': 'gorilla-vs-lion',
  'elephant|rhino': 'elephant-vs-rhino',
  'great white shark|orca': 'orca-vs-great-white-shark',
  'lion|wolf': 'wolf-vs-lion',
  'hippo|rhino': 'hippo-vs-rhino',
  'grizzly bear|polar bear': 'polar-bear-vs-grizzly-bear',
  'giant panda|great horned owl': 'giant-panda-vs-great-horned-owl',
  'jaguar|leopard': 'jaguar-vs-leopard',
  'grizzly bear|tiger': 'tiger-vs-bear',
  'crocodile|tiger': 'anaconda-vs-crocodile', // Note: anaconda isn't in fighters list
};

export function getMatchupKey(a: string, b: string): string {
  return [a.toLowerCase(), b.toLowerCase()].sort().join('|');
}

export function getMatchupSlug(a: string, b: string): string | null {
  const key = getMatchupKey(a, b);
  return BLOG_MATCHUPS[key] || null;
}

export function toUrlParam(name: string): string {
  return encodeURIComponent(name);
}

export type AnimalCategory = 'real' | 'dinosaur' | 'fantasy';

export const CATEGORY_INFO: Record<AnimalCategory, { label: string; icon: string }> = {
  real: { label: 'Real Animals', icon: '🦁' },
  dinosaur: { label: 'Dinosaurs', icon: '🦕' },
  fantasy: { label: 'Fantasy Creatures', icon: '🐉' },
};
