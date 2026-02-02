import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs';
import { generatePDF } from '@/lib/pdfGenerator';

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

// Convert image URL to base64 data URL for persistence
async function imageToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) return url;
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Image to base64 error:', error);
    return url; // Return original URL as fallback
  }
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
    const imageUrl = result.images?.[0]?.url;
    
    if (!imageUrl) {
      return `https://placehold.co/512x512/1a1a1a/d4af37?text=Image`;
    }
    
    // Convert to base64 for persistence (fal.ai URLs expire)
    return await imageToBase64(imageUrl);
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

// Generate battle narrative with 5 varied scenes
async function generateBattle(animalA: AnimalFacts, animalB: AnimalFacts, environment: string): Promise<{ scenes: string[], winner: string }> {
  const prompt = `Write a 5-scene battle between a ${animalA.name} and a ${animalB.name} in a ${environment} environment for a children's book.

Animal A stats: ${JSON.stringify({ weapons: animalA.weapons, defenses: animalA.defenses, speed: animalA.speed })}
Animal B stats: ${JSON.stringify({ weapons: animalB.weapons, defenses: animalB.defenses, speed: animalB.speed })}

Return JSON only:
{
  "scene1": "Initial confrontation - sizing each other up (2-3 sentences)",
  "scene2": "First strike - one attacks (2-3 sentences with specific moves)",
  "scene3": "Counter-attack - the other fights back (2-3 sentences)",
  "scene4": "Momentum shift - surprise tactic or terrain use (2-3 sentences)",
  "scene5": "Decisive finale - final blow and outcome (2-3 sentences)",
  "winner": "Name of the winning animal",
  "winning_move": "How they won"
}

Make each scene UNIQUE and DIFFERENT. Be exciting but educational. Base the winner on realistic animal capabilities.`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      scenes: [result.scene1, result.scene2, result.scene3, result.scene4, result.scene5],
      winner: result.winner,
    };
  } catch (error) {
    console.error('OpenAI error for battle:', error);
    // Fallback
    const winner = Math.random() > 0.5 ? animalA.name : animalB.name;
    const loser = winner === animalA.name ? animalB.name : animalA.name;
    return {
      scenes: [
        `The ${animalA.name} and ${animalB.name} face off in the ${environment}, eyes locked in fierce determination!`,
        `${animalA.name} makes the first move, using its powerful ${animalA.weapons[0]}!`,
        `${animalB.name} counters with lightning speed, deploying its ${animalB.defenses[0]} for protection!`,
        `The battle shifts as ${winner} finds an opening, using the terrain to its advantage!`,
        `With a final decisive strike using its ${winner === animalA.name ? animalA.weapons[0] : animalB.weapons[0]}, ${winner} claims victory!`,
      ],
      winner,
    };
  }
}

// Generate tactical analysis comparing the two animals
function generateTacticalAnalysis(factsA: AnimalFacts, factsB: AnimalFacts): string {
  const analyses: string[] = [];
  
  // Speed advantage
  if (Math.abs(factsA.speed_score - factsB.speed_score) >= 2) {
    const faster = factsA.speed_score > factsB.speed_score ? factsA : factsB;
    const slower = faster === factsA ? factsB : factsA;
    analyses.push(`${faster.name}'s superior speed (${faster.speed_score}/10 vs ${slower.speed_score}/10) gives it first-strike capability`);
  }
  
  // Strength advantage
  if (Math.abs(factsA.strength_score - factsB.strength_score) >= 2) {
    const stronger = factsA.strength_score > factsB.strength_score ? factsA : factsB;
    const weaker = stronger === factsA ? factsB : factsA;
    analyses.push(`${stronger.name}'s raw power (${stronger.strength_score}/10) could overwhelm ${weaker.name}'s defenses`);
  }
  
  // Weapons advantage
  if (Math.abs(factsA.weapons_score - factsB.weapons_score) >= 2) {
    const better_armed = factsA.weapons_score > factsB.weapons_score ? factsA : factsB;
    analyses.push(`${better_armed.name}'s arsenal (${better_armed.weapons_score}/10) provides multiple attack options`);
  }
  
  // Defense advantage
  if (Math.abs(factsA.defense_score - factsB.defense_score) >= 2) {
    const tougher = factsA.defense_score > factsB.defense_score ? factsA : factsB;
    analyses.push(`${tougher.name}'s defenses (${tougher.defense_score}/10) make it extremely hard to take down`);
  }
  
  // If no major advantages, note it's balanced
  if (analyses.length === 0) {
    return `This is an evenly matched fight! Both animals have comparable stats across all categories, making the outcome unpredictable.`;
  }
  
  return analyses.join('. ') + '.';
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
    
    // Animal A - Educational Pages
    {
      id: 'intro-a',
      type: 'intro',
      title: `Meet the ${factsA.name}!`,
      content: `
        <h3 class="text-2xl font-bold text-[#c62828] mb-3">${factsA.name}</h3>
        <p class="text-lg mb-2"><em>${factsA.scientific_name}</em></p>
        <p class="text-gray-700">The ${factsA.name} is one of nature's most impressive creatures. Let's learn what makes this animal so special!</p>
      `,
      imageUrl: imgA,
    },
    {
      id: 'habitat-a',
      type: 'intro',
      title: `Where ${factsA.name}s Live`,
      content: `
        <h4 class="text-xl font-bold text-[#4caf50] mb-2">🌍 Habitat & Range</h4>
        <p class="mb-3">${factsA.habitat}</p>
        <p class="text-sm text-gray-600 italic">These animals have adapted perfectly to their environment over millions of years!</p>
      `,
    },
    {
      id: 'diet-a',
      type: 'intro',
      title: `What ${factsA.name}s Eat`,
      content: `
        <h4 class="text-xl font-bold text-[#ff9800] mb-2">🍖 Diet & Hunting</h4>
        <p class="mb-2">${factsA.diet}</p>
        <p class="mb-2"><strong>⚡ Speed:</strong> ${factsA.speed}</p>
      `,
    },
    {
      id: 'weapons-a',
      type: 'intro',
      title: `${factsA.name} Arsenal`,
      content: `
        <h4 class="text-xl font-bold text-[#f44336] mb-2">⚔️ Weapons & Defenses</h4>
        <p class="mb-2"><strong>📏 Size:</strong> ${factsA.size}</p>
        <div class="mt-3">
          <p class="font-bold text-red-700">WEAPONS:</p>
          <ul class="list-disc ml-4 mb-3">${factsA.weapons.map(w => `<li>${w}</li>`).join('')}</ul>
          <p class="font-bold text-blue-700">DEFENSES:</p>
          <ul class="list-disc ml-4">${factsA.defenses.map(d => `<li>${d}</li>`).join('')}</ul>
        </div>
      `,
    },
    {
      id: 'facts-a',
      type: 'intro',
      title: `Amazing ${factsA.name} Facts!`,
      content: `
        <h4 class="text-xl font-bold text-[#9c27b0] mb-3">✨ DID YOU KNOW?</h4>
        <ul class="space-y-3">${factsA.fun_facts.map(f => `<li class="text-base">🌟 ${f}</li>`).join('')}</ul>
      `,
    },
    
    // Animal B - Educational Pages
    {
      id: 'intro-b',
      type: 'intro',
      title: `Meet the ${factsB.name}!`,
      content: `
        <h3 class="text-2xl font-bold text-[#1e88e5] mb-3">${factsB.name}</h3>
        <p class="text-lg mb-2"><em>${factsB.scientific_name}</em></p>
        <p class="text-gray-700">The ${factsB.name} is one of nature's most impressive creatures. Let's learn what makes this animal so special!</p>
      `,
      imageUrl: imgB,
    },
    {
      id: 'habitat-b',
      type: 'intro',
      title: `Where ${factsB.name}s Live`,
      content: `
        <h4 class="text-xl font-bold text-[#4caf50] mb-2">🌍 Habitat & Range</h4>
        <p class="mb-3">${factsB.habitat}</p>
        <p class="text-sm text-gray-600 italic">These animals have adapted perfectly to their environment over millions of years!</p>
      `,
    },
    {
      id: 'diet-b',
      type: 'intro',
      title: `What ${factsB.name}s Eat`,
      content: `
        <h4 class="text-xl font-bold text-[#ff9800] mb-2">🍖 Diet & Hunting</h4>
        <p class="mb-2">${factsB.diet}</p>
        <p class="mb-2"><strong>⚡ Speed:</strong> ${factsB.speed}</p>
      `,
    },
    {
      id: 'weapons-b',
      type: 'intro',
      title: `${factsB.name} Arsenal`,
      content: `
        <h4 class="text-xl font-bold text-[#f44336] mb-2">⚔️ Weapons & Defenses</h4>
        <p class="mb-2"><strong>📏 Size:</strong> ${factsB.size}</p>
        <div class="mt-3">
          <p class="font-bold text-red-700">WEAPONS:</p>
          <ul class="list-disc ml-4 mb-3">${factsB.weapons.map(w => `<li>${w}</li>`).join('')}</ul>
          <p class="font-bold text-blue-700">DEFENSES:</p>
          <ul class="list-disc ml-4">${factsB.defenses.map(d => `<li>${d}</li>`).join('')}</ul>
        </div>
      `,
    },
    {
      id: 'facts-b',
      type: 'intro',
      title: `Amazing ${factsB.name} Facts!`,
      content: `
        <h4 class="text-xl font-bold text-[#9c27b0] mb-3">✨ DID YOU KNOW?</h4>
        <ul class="space-y-3">${factsB.fun_facts.map(f => `<li class="text-base">🌟 ${f}</li>`).join('')}</ul>
      `,
    },
    {
      id: 'stats',
      type: 'stats',
      title: 'Tale of the Tape',
      content: `
        <div class="border border-[#d4af37] p-4">
          <table class="w-full text-center">
            <tr class="border-b-2 border-[#d4af37]">
              <td class="py-2 text-[#c41e3a] font-bold text-lg">${factsA.name.toUpperCase()}</td>
              <td class="py-2 text-[#d4af37] font-bold">STAT</td>
              <td class="py-2 text-[#1e4fc4] font-bold text-lg">${factsB.name.toUpperCase()}</td>
            </tr>
            <tr class="border-b border-white/10">
              <td class="py-2 text-xl font-bold">${factsA.strength_score}/10</td>
              <td class="py-2 text-gray-600">💪 STRENGTH</td>
              <td class="py-2 text-xl font-bold">${factsB.strength_score}/10</td>
            </tr>
            <tr class="border-b border-white/10">
              <td class="py-2 text-xl font-bold">${factsA.speed_score}/10</td>
              <td class="py-2 text-gray-600">⚡ SPEED</td>
              <td class="py-2 text-xl font-bold">${factsB.speed_score}/10</td>
            </tr>
            <tr class="border-b border-white/10">
              <td class="py-2 text-xl font-bold">${factsA.weapons_score}/10</td>
              <td class="py-2 text-gray-600">⚔️ WEAPONS</td>
              <td class="py-2 text-xl font-bold">${factsB.weapons_score}/10</td>
            </tr>
            <tr>
              <td class="py-2 text-xl font-bold">${factsA.defense_score}/10</td>
              <td class="py-2 text-gray-600">🛡️ DEFENSE</td>
              <td class="py-2 text-xl font-bold">${factsB.defense_score}/10</td>
            </tr>
          </table>
          <div class="mt-4 p-3 bg-amber-50 rounded border-l-4 border-amber-500">
            <p class="text-sm font-bold text-gray-700">⚔️ TACTICAL ANALYSIS</p>
            <p class="text-sm mt-1">${generateTacticalAnalysis(factsA, factsB)}</p>
          </div>
        </div>
      `,
    },
    {
      id: 'battle-1',
      type: 'battle',
      title: '',
      content: `<p>${battle.scenes[0]}</p>`,
      imageUrl: battleImg,
    },
    {
      id: 'battle-2',
      type: 'battle',
      title: '',
      content: `<p>${battle.scenes[1]}</p>`,
    },
    {
      id: 'battle-3',
      type: 'battle',
      title: '',
      content: `<p>${battle.scenes[2]}</p>`,
    },
    {
      id: 'battle-4',
      type: 'battle',
      title: '',
      content: `<p>${battle.scenes[3]}</p>`,
    },
    {
      id: 'battle-5',
      type: 'battle',
      title: '',
      content: `<p>${battle.scenes[4]}</p>`,
    },
    {
      id: 'victory',
      type: 'victory',
      title: 'The Victor',
      content: `
        <div class="victory-content">
          <div class="text-center mb-6">
            <p class="text-5xl font-black text-[#d4af37] mb-2">${battle.winner.toUpperCase()}</p>
            <p class="text-xl text-gray-700">After an incredible battle, <strong>${battle.winner}</strong> emerges victorious!</p>
          </div>
          <div class="bg-gray-50 p-4 rounded-lg border-2 border-[#d4af37]">
            <p class="text-sm text-gray-600 italic">
              Remember: in nature, outcomes depend on many factors including environment, health, experience, and luck. 
              Both ${factsA.name} and ${factsB.name} are remarkable apex predators, perfectly adapted to their habitats. 
              Every animal is amazing in its own way!
            </p>
          </div>
        </div>
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

// Simple file-based cache for generated books
function getCacheKey(animalA: string, animalB: string, environment: string): string {
  // Normalize to always be alphabetical order for consistency
  const sorted = [animalA.toLowerCase(), animalB.toLowerCase()].sort();
  return `${sorted[0]}_vs_${sorted[1]}_${environment}`.replace(/[^a-z0-9_]/g, '_');
}

async function loadCachedBook(cacheKey: string): Promise<{ pages: BookPage[], winner: string } | null> {
  try {
    const cachePath = path.join(process.cwd(), 'public', 'cache', `${cacheKey}.json`);
    if (fs.existsSync(cachePath)) {
      const data = fs.readFileSync(cachePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Cache load error:', error);
  }
  return null;
}

async function saveCachedBook(cacheKey: string, data: { pages: BookPage[], winner: string }): Promise<void> {
  try {
    const cacheDir = path.join(process.cwd(), 'public', 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    const cachePath = path.join(cacheDir, `${cacheKey}.json`);
    fs.writeFileSync(cachePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Cache save error:', error);
  }
}

async function saveCachedPDF(cacheKey: string, animalA: string, animalB: string, data: { pages: BookPage[], winner: string }): Promise<void> {
  try {
    const cacheDir = path.join(process.cwd(), 'public', 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    const pdfBuffer = await generatePDF({
      animalA,
      animalB,
      pages: data.pages,
      winner: data.winner,
    });
    
    const pdfPath = path.join(cacheDir, `${cacheKey}.pdf`);
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(`PDF cached: ${pdfPath}`);
  } catch (error) {
    console.error('PDF cache save error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { animalA, animalB, mode = 'standard', environment = 'neutral' } = body;

    if (!animalA || !animalB) {
      return NextResponse.json({ error: 'Missing animal names' }, { status: 400 });
    }

    // Check cache first
    const cacheKey = getCacheKey(animalA, animalB, environment);
    let result = await loadCachedBook(cacheKey);
    
    if (!result) {
      // Generate new book
      result = await generateBook(animalA, animalB, environment);
      // Save to cache (JSON + PDF)
      await saveCachedBook(cacheKey, result);
      await saveCachedPDF(cacheKey, animalA, animalB, result); // Generate PDF alongside
    }
    
    if (mode === 'cyoa') {
      result.pages = await addCyoaChoices(result.pages, animalA, animalB);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Book start error:', error);
    return NextResponse.json({ error: 'Failed to generate book' }, { status: 500 });
  }
}
