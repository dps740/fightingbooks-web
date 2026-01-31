import { NextRequest, NextResponse } from 'next/server';

interface BookPage {
  id: string;
  type: string;
  title: string;
  content: string;
  imageUrl?: string;
  choices?: { id: string; text: string; emoji: string }[];
}

// Animal facts database for more realistic content
const animalFacts: Record<string, { habitat: string; diet: string; size: string; speed: string; weapon: string }> = {
  'lion': { habitat: 'African savannas', diet: 'Large ungulates', size: '420 lbs', speed: '50 mph', weapon: 'Powerful jaws and claws' },
  'tiger': { habitat: 'Asian forests', diet: 'Deer and wild boar', size: '660 lbs', speed: '40 mph', weapon: 'Strongest bite of big cats' },
  'grizzly bear': { habitat: 'North American wilderness', diet: 'Omnivore', size: '800 lbs', speed: '35 mph', weapon: 'Massive paws with 4-inch claws' },
  'gorilla': { habitat: 'African rainforests', diet: 'Herbivore', size: '400 lbs', speed: '25 mph', weapon: 'Incredible arm strength' },
  'great white shark': { habitat: 'Coastal oceans worldwide', diet: 'Seals and fish', size: '5000 lbs', speed: '35 mph', weapon: '300 serrated teeth' },
  'saltwater crocodile': { habitat: 'Indo-Pacific coasts', diet: 'Anything it can catch', size: '2200 lbs', speed: '18 mph', weapon: 'Strongest bite on Earth' },
  'african elephant': { habitat: 'African savannas and forests', diet: 'Herbivore', size: '14000 lbs', speed: '25 mph', weapon: 'Tusks and sheer mass' },
  'polar bear': { habitat: 'Arctic ice', diet: 'Seals', size: '1200 lbs', speed: '25 mph', weapon: 'Powerful swipe and bite' },
  'orca': { habitat: 'All oceans', diet: 'Fish, seals, whales', size: '12000 lbs', speed: '35 mph', weapon: 'Intelligence and teamwork' },
  'hippo': { habitat: 'African rivers', diet: 'Herbivore', size: '4000 lbs', speed: '20 mph', weapon: 'Massive jaws with huge tusks' },
};

function getAnimalFacts(animal: string) {
  const key = animal.toLowerCase();
  return animalFacts[key] || {
    habitat: 'Various regions worldwide',
    diet: 'Carnivore/Omnivore',
    size: 'Varies',
    speed: 'Fast',
    weapon: 'Natural weapons'
  };
}

// Determine winner based on some logic
function determineWinner(animalA: string, animalB: string): string {
  // Simple hash-based "random" but consistent result
  const combined = (animalA + animalB).toLowerCase();
  const hash = combined.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return hash % 2 === 0 ? animalA : animalB;
}

// Generate pages
function generatePages(animalA: string, animalB: string, environment: string): { pages: BookPage[], winner: string } {
  const winner = determineWinner(animalA, animalB);
  const loser = winner === animalA ? animalB : animalA;
  const factsA = getAnimalFacts(animalA);
  const factsB = getAnimalFacts(animalB);

  const pages: BookPage[] = [
    {
      id: 'cover',
      type: 'cover',
      title: `${animalA} vs ${animalB}`,
      content: `<p class="text-center text-xl">WHO WOULD WIN?</p><p class="text-center text-gray-400 mt-4">An epic battle is about to begin!</p>`,
    },
    {
      id: 'intro-a',
      type: 'intro',
      title: `Meet the ${animalA}!`,
      content: `
        <p>The <strong>${animalA}</strong> is one of nature's most formidable creatures.</p>
        <ul class="mt-4 space-y-2">
          <li><strong>Habitat:</strong> ${factsA.habitat}</li>
          <li><strong>Diet:</strong> ${factsA.diet}</li>
          <li><strong>Size:</strong> ${factsA.size}</li>
          <li><strong>Top Speed:</strong> ${factsA.speed}</li>
          <li><strong>Weapon:</strong> ${factsA.weapon}</li>
        </ul>
      `,
    },
    {
      id: 'intro-b',
      type: 'intro', 
      title: `Meet the ${animalB}!`,
      content: `
        <p>The <strong>${animalB}</strong> is a fearsome predator known across the world.</p>
        <ul class="mt-4 space-y-2">
          <li><strong>Habitat:</strong> ${factsB.habitat}</li>
          <li><strong>Diet:</strong> ${factsB.diet}</li>
          <li><strong>Size:</strong> ${factsB.size}</li>
          <li><strong>Top Speed:</strong> ${factsB.speed}</li>
          <li><strong>Weapon:</strong> ${factsB.weapon}</li>
        </ul>
      `,
    },
    {
      id: 'stats',
      type: 'stats',
      title: 'Tale of the Tape',
      content: `
        <div class="border border-[#d4af37] p-4">
          <table class="w-full text-center">
            <tr class="border-b border-white/20">
              <td class="py-3 text-[#c41e3a] font-bold text-lg">${animalA.toUpperCase()}</td>
              <td class="py-3 text-[#d4af37]">VS</td>
              <td class="py-3 text-[#1e4fc4] font-bold text-lg">${animalB.toUpperCase()}</td>
            </tr>
            <tr class="border-b border-white/10">
              <td class="py-2">${factsA.size}</td>
              <td class="py-2 text-gray-500">⚖️ SIZE</td>
              <td class="py-2">${factsB.size}</td>
            </tr>
            <tr class="border-b border-white/10">
              <td class="py-2">${factsA.speed}</td>
              <td class="py-2 text-gray-500">⚡ SPEED</td>
              <td class="py-2">${factsB.speed}</td>
            </tr>
            <tr>
              <td class="py-2 text-sm">${factsA.weapon}</td>
              <td class="py-2 text-gray-500">⚔️ WEAPON</td>
              <td class="py-2 text-sm">${factsB.weapon}</td>
            </tr>
          </table>
        </div>
      `,
    },
    {
      id: 'battle-1',
      type: 'battle',
      title: 'The Battle Begins!',
      content: `
        <p>The two mighty creatures face each other in the ${environment === 'neutral' ? 'arena' : environment}. Tension fills the air.</p>
        <p class="my-4">The ${animalA} lets out a powerful call that echoes across the battlefield! The ${animalB} stands its ground, muscles tensed, ready for combat.</p>
        <p>In a flash of movement, both predators spring into action!</p>
      `,
    },
    {
      id: 'battle-2',
      type: 'battle',
      title: 'The Clash Intensifies!',
      content: `
        <p>Neither warrior is willing to back down!</p>
        <p class="my-4">The ${animalA} uses its ${factsA.weapon.toLowerCase()} with devastating effect, but the ${animalB} counters with its own ${factsB.weapon.toLowerCase()}!</p>
        <p>Back and forth they battle, each looking for the decisive advantage...</p>
      `,
    },
    {
      id: 'battle-3',
      type: 'battle',
      title: 'The Final Showdown!',
      content: `
        <p>Both fighters are giving everything they have!</p>
        <p class="my-4">The ${loser} is tiring... and ${winner} sees the opportunity!</p>
        <p>With one final, mighty effort, <strong>${winner}</strong> seizes the moment!</p>
      `,
    },
    {
      id: 'victory',
      type: 'victory',
      title: 'THE WINNER!',
      content: `
        <p class="text-4xl font-black text-center mb-6 text-[#d4af37]">${winner.toUpperCase()}</p>
        <p>After an incredible battle, the <strong>${winner}</strong> emerges victorious!</p>
        <p class="my-4">It was a close fight, but ${winner}'s combination of ${winner === animalA ? factsA.weapon.toLowerCase() : factsB.weapon.toLowerCase()} proved decisive.</p>
        <p class="text-gray-400 text-sm mt-6">Remember: in nature, outcomes depend on many factors. Every animal is amazing in its own way!</p>
      `,
    },
  ];

  return { pages, winner };
}

// Add CYOA choices to pages
function addCyoaChoices(pages: BookPage[], animalA: string, animalB: string): BookPage[] {
  const battleIndex = pages.findIndex(p => p.type === 'battle');
  if (battleIndex === -1) return pages;

  const modifiedPages = [...pages];
  const introPages = modifiedPages.slice(0, battleIndex + 1);
  
  introPages[introPages.length - 1] = {
    ...introPages[introPages.length - 1],
    type: 'choice',
    title: 'What Happens Next?',
    content: `<p>The battle has begun! Both fighters circle each other...</p><p class="mt-4">The ${animalA} prepares to make a move. What happens next?</p>`,
    choices: [
      { id: 'attack', text: `${animalA} charges with full force!`, emoji: '💥' },
      { id: 'defend', text: `${animalA} waits for the perfect moment`, emoji: '👁️' },
      { id: 'flank', text: `${animalA} circles for advantage`, emoji: '🔄' },
    ],
  };

  return introPages;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { animalA, animalB, mode = 'standard', environment = 'neutral' } = body;

    if (!animalA || !animalB) {
      return NextResponse.json({ error: 'Missing animal names' }, { status: 400 });
    }

    let result = generatePages(animalA, animalB, environment);
    
    if (mode === 'cyoa') {
      result.pages = addCyoaChoices(result.pages, animalA, animalB);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Book start error:', error);
    return NextResponse.json({ error: 'Failed to start book' }, { status: 500 });
  }
}
