export interface PopularMatchupSeed {
  animal1: string;
  animal2: string;
  reason: string;
}

export const POPULAR_MATCHUP_SEEDS: PopularMatchupSeed[] = [
  { animal1: 'Lion', animal2: 'Tiger', reason: 'The classic big-cat showdown' },
  { animal1: 'Gorilla', animal2: 'Grizzly Bear', reason: 'Strength vs raw bear power' },
  { animal1: 'Great White Shark', animal2: 'Orca', reason: 'Ocean apex predator battle' },
  { animal1: 'Hippo', animal2: 'Crocodile', reason: 'River tank vs ambush hunter' },
  { animal1: 'Elephant', animal2: 'Rhino', reason: 'Heavyweight herbivore clash' },
  { animal1: 'Wolf', animal2: 'Lion', reason: 'Pack hunter vs king of the savanna' },
  { animal1: 'Tyrannosaurus Rex', animal2: 'Triceratops', reason: 'Iconic dinosaur rivalry' },
  { animal1: 'Spinosaurus', animal2: 'Tyrannosaurus Rex', reason: 'Two giant predators head-to-head' },
  { animal1: 'Dragon', animal2: 'Kraken', reason: 'Sky firepower vs sea terror' },
  { animal1: 'Hydra', animal2: 'Cerberus', reason: 'Mythical multi-headed monsters' },
  { animal1: 'Lion', animal2: 'Dragon', reason: 'Real predator vs fantasy beast' },
  { animal1: 'Orca', animal2: 'Kraken', reason: 'Top marine hunter vs legend' },
];

export function toBattleSlugPart(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toBattleSlug(animal1: string, animal2: string): string {
  return `${toBattleSlugPart(animal1)}-vs-${toBattleSlugPart(animal2)}`;
}
