import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface BookPage {
  id: string;
  type: string;
  title: string;
  content: string;
  imageUrl?: string;
  choices?: { id: string; text: string; emoji: string }[];
}

interface AnimalFacts {
  name: string;
  scientific_name: string;
  habitat: string;
  size: string;
  diet: string;
  weapons: string[];
  defenses: string[];
  speed: string;
  fun_facts: string[];
  strength_score: number;
  speed_score: number;
  weapons_score: number;
  defense_score: number;
}

// Lazy init to avoid build-time errors
function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Generate image using fal.ai Flux
async function generateImage(prompt: string): Promise<string> {
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) {
    console.log('No FAL_API_KEY, using placeholder');
    return `https://placehold.co/512x512/1a1a1a/d4af37?text=${encodeURIComponent(prompt.slice(0, 20))}`;
  }

  const fullPrompt = `${prompt}, detailed painted wildlife illustration, ANATOMICALLY ACCURATE animal anatomy, correct number of limbs, realistic proportions, no human features on animals, natural history museum quality art, educational wildlife book, detailed fur/scales/feathers texture, dramatic lighting, ABSOLUTELY NO TEXT OR WORDS IN THE IMAGE`;

  try {
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_size: 'square_hd',
        num_inference_steps: 4,
      }),
    });

    if (!response.ok) {
      console.error('Fal.ai error:', await response.text());
      return `https://placehold.co/512x512/1a1a1a/d4af37?text=${encodeURIComponent(prompt.slice(0, 20))}`;
    }

    const result = await response.json();
    return result.images?.[0]?.url || `https://placehold.co/512x512/1a1a1a/d4af37?text=Image`;
  } catch (error) {
    console.error('Image generation error:', error);
    return `https://placehold.co/512x512/1a1a1a/d4af37?text=${encodeURIComponent(prompt.slice(0, 20))}`;
  }
}

// Generate animal facts using GPT-4o-mini
async function generateAnimalFacts(animalName: string): Promise<AnimalFacts> {
  const prompt = `Generate educational facts about a ${animalName} for a children's "Who Would Win?" style book.

STYLE: SHORT and PUNCHY - every sentence must hit hard! Use comparisons kids understand.

Return JSON only:
{
  "name": "Common name",
  "scientific_name": "Latin name",
  "habitat": "Where they live with specific details",
  "size": "Height/length AND weight with fun comparison",
  "diet": "What they eat with specifics",
  "weapons": ["Weapon 1 with measurement", "Weapon 2", "Weapon 3"],
  "defenses": ["Defense 1", "Defense 2", "Defense 3"],
  "speed": "Top speed with comparison",
  "fun_facts": ["WOW fact 1", "WOW fact 2", "WOW fact 3"],
  "strength_score": 7,
  "speed_score": 6,
  "weapons_score": 8,
  "defense_score": 5
}`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('OpenAI error for facts:', error);
    return {
      name: animalName,
      scientific_name: 'Unknown',
      habitat: 'Various regions worldwide',
      size: 'Varies',
      diet: 'Carnivore/Omnivore',
      weapons: ['Claws', 'Teeth', 'Strength'],
      defenses: ['Thick hide', 'Speed', 'Agility'],
      speed: 'Fast',
      fun_facts: ['Amazing predator', 'Top of food chain', 'Incredible hunter'],
      strength_score: 7,
      speed_score: 7,
      weapons_score: 7,
      defense_score: 7,
    };
  }
}

// Generate battle narrative
async function generateBattle(animalA: AnimalFacts, animalB: AnimalFacts, environment: string): Promise<{ scenes: string[], winner: string }> {
  const prompt = `Write a 3-scene battle between a ${animalA.name} and a ${animalB.name} in a ${environment} environment for a children's book.

Animal A stats: ${JSON.stringify({ weapons: animalA.weapons, defenses: animalA.defenses, speed: animalA.speed })}
Animal B stats: ${JSON.stringify({ weapons: animalB.weapons, defenses: animalB.defenses, speed: animalB.speed })}

Return JSON only:
{
  "scene1": "Opening clash - 2-3 exciting sentences",
  "scene2": "Battle intensifies - 2-3 sentences with specific moves",
  "scene3": "Final showdown - 2-3 sentences with decisive moment",
  "winner": "Name of the winning animal",
  "winning_move": "How they won"
}

Be exciting but educational. Base the winner on realistic animal capabilities.`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      scenes: [result.scene1, result.scene2, result.scene3],
      winner: result.winner,
    };
  } catch (error) {
    console.error('OpenAI error for battle:', error);
    // Fallback
    const winner = Math.random() > 0.5 ? animalA.name : animalB.name;
    return {
      scenes: [
        `The ${animalA.name} and ${animalB.name} face off in the ${environment}!`,
        `They clash with incredible force! Neither backs down!`,
        `With a final mighty effort, ${winner} delivers the decisive blow!`,
      ],
      winner,
    };
  }
}

// Generate all pages with AI
async function generateBook(animalA: string, animalB: string, environment: string): Promise<{ pages: BookPage[], winner: string }> {
  console.log(`Generating book: ${animalA} vs ${animalB} in ${environment}`);
  
  // Generate facts in parallel
  const [factsA, factsB] = await Promise.all([
    generateAnimalFacts(animalA),
    generateAnimalFacts(animalB),
  ]);

  // Generate battle
  const battle = await generateBattle(factsA, factsB, environment);
  const loser = battle.winner === factsA.name ? factsB.name : factsA.name;

  // Generate images in parallel (cover + 2 animal portraits + battle + victory)
  const [coverImg, imgA, imgB, battleImg, victoryImg] = await Promise.all([
    generateImage(`${animalA} facing ${animalB} dramatically, epic showdown, wildlife art`),
    generateImage(`${animalA} portrait, powerful pose, wildlife photography style`),
    generateImage(`${animalB} portrait, powerful pose, wildlife photography style`),
    generateImage(`${animalA} fighting ${animalB}, intense battle, action scene`),
    generateImage(`${battle.winner} victorious, triumphant pose, dramatic lighting`),
  ]);

  const pages: BookPage[] = [
    {
      id: 'cover',
      type: 'cover',
      title: `${factsA.name} vs ${factsB.name}`,
      content: `<p class="text-center text-2xl font-black text-[#d4af37]">WHO WOULD WIN?</p>`,
      imageUrl: coverImg,
    },
    {
      id: 'intro-a',
      type: 'intro',
      title: `Meet the ${factsA.name}!`,
      content: `
        <p><strong>${factsA.name}</strong> (<em>${factsA.scientific_name}</em>)</p>
        <p class="mt-2">📍 <strong>Habitat:</strong> ${factsA.habitat}</p>
        <p>📏 <strong>Size:</strong> ${factsA.size}</p>
        <p>🍖 <strong>Diet:</strong> ${factsA.diet}</p>
        <p>⚡ <strong>Speed:</strong> ${factsA.speed}</p>
        <p class="mt-2"><strong>⚔️ Weapons:</strong></p>
        <ul class="list-disc ml-4">${factsA.weapons.map(w => `<li>${w}</li>`).join('')}</ul>
        <p class="mt-2"><strong>🛡️ Defenses:</strong></p>
        <ul class="list-disc ml-4">${factsA.defenses.map(d => `<li>${d}</li>`).join('')}</ul>
      `,
      imageUrl: imgA,
    },
    {
      id: 'facts-a',
      type: 'intro',
      title: `${factsA.name} Fun Facts!`,
      content: `
        <p class="text-[#d4af37] font-bold mb-2">DID YOU KNOW?</p>
        <ul class="space-y-2">${factsA.fun_facts.map(f => `<li>🌟 ${f}</li>`).join('')}</ul>
      `,
    },
    {
      id: 'intro-b',
      type: 'intro',
      title: `Meet the ${factsB.name}!`,
      content: `
        <p><strong>${factsB.name}</strong> (<em>${factsB.scientific_name}</em>)</p>
        <p class="mt-2">📍 <strong>Habitat:</strong> ${factsB.habitat}</p>
        <p>📏 <strong>Size:</strong> ${factsB.size}</p>
        <p>🍖 <strong>Diet:</strong> ${factsB.diet}</p>
        <p>⚡ <strong>Speed:</strong> ${factsB.speed}</p>
        <p class="mt-2"><strong>⚔️ Weapons:</strong></p>
        <ul class="list-disc ml-4">${factsB.weapons.map(w => `<li>${w}</li>`).join('')}</ul>
        <p class="mt-2"><strong>🛡️ Defenses:</strong></p>
        <ul class="list-disc ml-4">${factsB.defenses.map(d => `<li>${d}</li>`).join('')}</ul>
      `,
      imageUrl: imgB,
    },
    {
      id: 'facts-b',
      type: 'intro',
      title: `${factsB.name} Fun Facts!`,
      content: `
        <p class="text-[#d4af37] font-bold mb-2">DID YOU KNOW?</p>
        <ul class="space-y-2">${factsB.fun_facts.map(f => `<li>🌟 ${f}</li>`).join('')}</ul>
      `,
    },
    {
      id: 'stats',
      type: 'stats',
      title: 'Tale of the Tape',
      content: `
        <div class="border border-[#d4af37] p-3">
          <table class="w-full text-center text-sm">
            <tr class="border-b border-white/20">
              <td class="py-2 text-[#c41e3a] font-bold">${factsA.name.toUpperCase()}</td>
              <td class="py-2 text-[#d4af37]">STAT</td>
              <td class="py-2 text-[#1e4fc4] font-bold">${factsB.name.toUpperCase()}</td>
            </tr>
            <tr class="border-b border-white/10">
              <td class="py-1">${'⭐'.repeat(factsA.strength_score > 5 ? Math.min(factsA.strength_score, 10) : 5)}</td>
              <td class="py-1 text-gray-400">💪 STRENGTH</td>
              <td class="py-1">${'⭐'.repeat(factsB.strength_score > 5 ? Math.min(factsB.strength_score, 10) : 5)}</td>
            </tr>
            <tr class="border-b border-white/10">
              <td class="py-1">${'⭐'.repeat(factsA.speed_score > 5 ? Math.min(factsA.speed_score, 10) : 5)}</td>
              <td class="py-1 text-gray-400">⚡ SPEED</td>
              <td class="py-1">${'⭐'.repeat(factsB.speed_score > 5 ? Math.min(factsB.speed_score, 10) : 5)}</td>
            </tr>
            <tr class="border-b border-white/10">
              <td class="py-1">${'⭐'.repeat(factsA.weapons_score > 5 ? Math.min(factsA.weapons_score, 10) : 5)}</td>
              <td class="py-1 text-gray-400">⚔️ WEAPONS</td>
              <td class="py-1">${'⭐'.repeat(factsB.weapons_score > 5 ? Math.min(factsB.weapons_score, 10) : 5)}</td>
            </tr>
            <tr>
              <td class="py-1">${'⭐'.repeat(factsA.defense_score > 5 ? Math.min(factsA.defense_score, 10) : 5)}</td>
              <td class="py-1 text-gray-400">🛡️ DEFENSE</td>
              <td class="py-1">${'⭐'.repeat(factsB.defense_score > 5 ? Math.min(factsB.defense_score, 10) : 5)}</td>
            </tr>
          </table>
        </div>
      `,
    },
    {
      id: 'battle-1',
      type: 'battle',
      title: 'The Battle Begins!',
      content: `<p>${battle.scenes[0]}</p>`,
      imageUrl: battleImg,
    },
    {
      id: 'battle-2',
      type: 'battle',
      title: 'The Clash Intensifies!',
      content: `<p>${battle.scenes[1]}</p>`,
    },
    {
      id: 'battle-3',
      type: 'battle',
      title: 'The Final Showdown!',
      content: `<p>${battle.scenes[2]}</p>`,
    },
    {
      id: 'victory',
      type: 'victory',
      title: 'THE WINNER!',
      content: `
        <p class="text-4xl font-black text-center mb-4 text-[#d4af37]">${battle.winner.toUpperCase()}</p>
        <p>After an incredible battle, <strong>${battle.winner}</strong> emerges victorious!</p>
        <p class="mt-4 text-gray-400 text-sm">Remember: in nature, outcomes depend on many factors. Every animal is amazing in its own way!</p>
      `,
      imageUrl: victoryImg,
    },
  ];

  return { pages, winner: battle.winner };
}

// Add CYOA choices
async function addCyoaChoices(pages: BookPage[], animalA: string, animalB: string): Promise<BookPage[]> {
  const battleIndex = pages.findIndex(p => p.type === 'battle');
  if (battleIndex === -1) return pages;

  // Generate image for the first choice moment
  const choiceImage = await generateImage(`${animalA} and ${animalB} facing off, tense moment before battle, dramatic standoff`);

  const introPages = pages.slice(0, battleIndex + 1);
  introPages[introPages.length - 1] = {
    ...introPages[introPages.length - 1],
    type: 'choice',
    title: 'What Happens Next?',
    content: `<p>The battle has begun! Both fighters are ready...</p><p>What should ${animalA} do?</p>`,
    imageUrl: choiceImage,
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

    let result = await generateBook(animalA, animalB, environment);
    
    if (mode === 'cyoa') {
      result.pages = await addCyoaChoices(result.pages, animalA, animalB);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Book start error:', error);
    return NextResponse.json({ error: 'Failed to generate book' }, { status: 500 });
  }
}
