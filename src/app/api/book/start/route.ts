import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs';
import { put, head, BlobNotFoundError } from '@vercel/blob';
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
  size_comparisons?: { item: string; emoji: string; comparison: string }[];
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

// Upload image to Vercel Blob for permanent storage, with base64 fallback
async function uploadToBlob(imageUrl: string, filename: string): Promise<string> {
  let imageBuffer: ArrayBuffer;
  let contentType = 'image/jpeg';
  
  // Step 1: Fetch the image ONCE and store the buffer
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');
    imageBuffer = await response.arrayBuffer();
    contentType = response.headers.get('content-type') || 'image/jpeg';
  } catch (error) {
    console.error('Image fetch error:', error);
    return `https://placehold.co/512x512/1a1a1a/d4af37?text=Image`;
  }
  
  // Step 2: Try Vercel Blob upload
  try {
    const blob = await put(`fightingbooks/${filename}.jpg`, imageBuffer, {
      access: 'public',
      contentType,
    });
    console.log(`Blob upload success: ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error('Blob upload error (falling back to base64):', error);
  }
  
  // Step 3: Fallback to base64 (using already-fetched buffer)
  try {
    const base64 = Buffer.from(imageBuffer).toString('base64');
    console.log(`Using base64 fallback for ${filename}`);
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('Base64 conversion error:', error);
    return `https://placehold.co/512x512/1a1a1a/d4af37?text=Image`;
  }
}

// Animal-specific features to ensure accurate depictions
const ANIMAL_FEATURES: Record<string, { include: string, avoid: string }> = {
  'lion': {
    include: 'male lion with LARGE GOLDEN MANE around face and neck, tawny golden-brown fur, NO STRIPES, solid colored coat',
    avoid: 'NO stripes, NO tiger stripes, NO spotted pattern, NOT orange with black stripes'
  },
  'tiger': {
    include: 'tiger with ORANGE fur with BLACK STRIPES all over body, NO MANE, striped pattern from head to tail',
    avoid: 'NO mane, NO lion mane, NOT solid colored, NOT golden brown without stripes'
  },
  'leopard': {
    include: 'leopard with ROSETTE SPOTS (ring-shaped spots with lighter centers), golden-yellow fur',
    avoid: 'NO stripes, NO mane, NOT solid colored'
  },
  'cheetah': {
    include: 'cheetah with SOLID BLACK SPOTS (not rosettes), slender build, black tear marks on face',
    avoid: 'NO stripes, NO mane, NOT bulky, NOT ring-shaped spots'
  },
  'jaguar': {
    include: 'jaguar with LARGE ROSETTES with spots inside them, stocky muscular build, shorter legs',
    avoid: 'NO stripes, NO mane, NOT slender like cheetah'
  },
};

function getAnimalFeatures(animalName: string): { include: string, avoid: string } {
  const key = animalName.toLowerCase();
  return ANIMAL_FEATURES[key] || { include: '', avoid: '' };
}

// Generate image using fal.ai Flux with retry logic
async function generateImage(prompt: string, cacheKey?: string, retries = 2): Promise<string> {
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) {
    console.log('No FAL_API_KEY, using placeholder');
    return `https://placehold.co/512x512/1a1a1a/d4af37?text=${encodeURIComponent(prompt.slice(0, 20))}`;
  }

  // CHECK FOR EXISTING CACHED IMAGE FIRST
  if (cacheKey) {
    const blobPath = `fightingbooks/${cacheKey}.jpg`;
    try {
      const blobInfo = await head(blobPath);
      console.log(`Image cache HIT: ${cacheKey} -> ${blobInfo.url}`);
      return blobInfo.url;
    } catch (error) {
      if (!(error instanceof BlobNotFoundError)) {
        console.error('Image cache check error:', error);
      }
      // Cache miss - proceed to generate
      console.log(`Image cache MISS: ${cacheKey} - generating new image`);
    }
  }

  // Extract animal names from prompt and add their specific features
  let animalFeatures = '';
  for (const animal of Object.keys(ANIMAL_FEATURES)) {
    if (prompt.toLowerCase().includes(animal)) {
      const features = ANIMAL_FEATURES[animal];
      animalFeatures += ` [${animal.toUpperCase()}: ${features.include}. ${features.avoid}]`;
    }
  }

  const fullPrompt = `${prompt},${animalFeatures} detailed painted wildlife illustration, natural history museum quality art, educational wildlife book style, dramatic lighting, detailed fur/scales/feathers texture, ANATOMICALLY CORRECT: each animal has exactly ONE head and ONE body, correct number of limbs for species, species-accurate distinctive markings, realistic proportions, NEVER merge animals together, each animal is SEPARATE and DISTINCT, NO human weapons (no swords no guns no armor), NO anthropomorphism, NO human clothing on animals, NO fantasy elements, NO extra limbs or heads, NO conjoined animals, NO mutant features, ABSOLUTELY NO TEXT OR WORDS IN THE IMAGE`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for: ${cacheKey || prompt.slice(0, 30)}`);
        await new Promise(r => setTimeout(r, 1000 * attempt)); // Backoff delay
      }
      
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
        const errorText = await response.text();
        console.error(`Fal.ai error (attempt ${attempt + 1}):`, errorText);
        if (attempt === retries) {
          return `https://placehold.co/512x512/1a1a1a/d4af37?text=${encodeURIComponent(prompt.slice(0, 20))}`;
        }
        continue;
      }

      const result = await response.json();
      const imageUrl = result.images?.[0]?.url;
      
      if (!imageUrl) {
        console.error(`No image URL returned (attempt ${attempt + 1})`);
        if (attempt === retries) {
          return `https://placehold.co/512x512/1a1a1a/d4af37?text=Image`;
        }
        continue;
      }
      
      // Upload to Vercel Blob for permanent storage
      const filename = cacheKey || `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const finalUrl = await uploadToBlob(imageUrl, filename);
      console.log(`Generated: ${cacheKey || 'image'}`);
      return finalUrl;
    } catch (error) {
      console.error(`Image generation error (attempt ${attempt + 1}):`, error);
      if (attempt === retries) {
        return `https://placehold.co/512x512/1a1a1a/d4af37?text=${encodeURIComponent(prompt.slice(0, 20))}`;
      }
    }
  }
  
  return `https://placehold.co/512x512/1a1a1a/d4af37?text=${encodeURIComponent(prompt.slice(0, 20))}`;
}

// Generate animal facts using GPT-4o-mini
async function generateAnimalFacts(animalName: string): Promise<AnimalFacts> {
  const prompt = `Generate educational facts about a ${animalName} for a children's "Who Would Win?" style book by Jerry Pallotta.

CRITICAL: Use REAL, ACCURATE measurements for ${animalName}!
- Look up the ACTUAL size and weight of a ${animalName}
- size_comparisons must reflect the REAL dimensions of THIS specific animal
- Do NOT use generic comparisons - make them ACCURATE for ${animalName}

STYLE REQUIREMENTS:
- SHORT, PUNCHY sentences! Kids love excitement!
- Use CAPS for emphasis!
- Compare sizes to things kids know (cars, buses, people, basketballs, etc.)
- Include specific measurements with WOW factor
- Make it DRAMATIC and FUN!

Return JSON only:
{
  "name": "Common name",
  "scientific_name": "Latin name",
  "habitat": "Where they live - be specific and exciting!",
  "size": "Exact measurements PLUS fun comparison (e.g., 'As long as 2 cars! Weighs as much as 40 people!')",
  "diet": "What they eat with DRAMATIC details (how much, how often, hunting style)",
  "weapons": ["Primary weapon with MEASUREMENT and damage potential", "Secondary weapon - what makes it special", "Bonus weapon or tactic"],
  "defenses": ["Main defense with specifics", "Secondary defense", "Special survival trick"],
  "speed": "Top speed with comparison (faster than a car? slower than a bike?)",
  "fun_facts": [
    "AMAZING size/strength comparison kids can visualize",
    "SHOCKING hunting or survival fact",
    "COOL sensory ability or special feature"
  ],
  "size_comparisons": [
    {"item": "object name", "emoji": "relevant emoji", "comparison": "LENGTH: Use REAL measurements! A gorilla is about 5.5 feet tall (as tall as a short adult). A lion is 8 feet long (as long as a sofa). BE SPECIFIC AND ACCURATE!"},
    {"item": "object name", "emoji": "relevant emoji", "comparison": "WEIGHT: Use REAL measurements! A gorilla weighs 400 lbs (as heavy as 2 adult men). A lion weighs 420 lbs. BE SPECIFIC AND ACCURATE!"}
  ],
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
      scientific_name: 'Unknown species',
      habitat: 'Various regions worldwide',
      size: 'Varies by region and species',
      diet: 'Carnivore/Omnivore - hunts for food',
      weapons: ['Sharp claws for gripping', 'Powerful teeth for biting', 'Raw strength'],
      defenses: ['Thick hide for protection', 'Quick reflexes', 'Camouflage abilities'],
      speed: 'Fast runner when needed',
      fun_facts: [
        'This animal is an AMAZING predator!',
        'It sits at the TOP of the food chain!',
        'An INCREDIBLE hunter with years of evolution!'
      ],
      size_comparisons: [
        { item: 'size', emoji: '📏', comparison: `A powerful ${animalName}!` },
        { item: 'weight', emoji: '⚖️', comparison: 'Built for battle!' }
      ],
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
// Stats cache type
type ComparativeStats = {
  strengthA: number; strengthB: number;
  speedA: number; speedB: number;
  weaponsA: number; weaponsB: number;
  defenseA: number; defenseB: number;
  // Specific notes for Tale of the Tape
  strengthNote?: string;
  speedNote?: string;
  weaponsNote?: string;
  defenseNote?: string;
  keyAdvantage?: string;
};

// In-memory cache for stats (persists across requests in same instance)
const statsCache: Map<string, ComparativeStats> = new Map();

// Load stats cache from file
async function loadStatsCache(): Promise<Map<string, ComparativeStats>> {
  try {
    const cachePath = path.join('/tmp', 'cache', 'stats-cache.json');
    if (fs.existsSync(cachePath)) {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Stats cache load error:', error);
  }
  return new Map();
}

// Save stats to cache file
async function saveStatsToCache(key: string, stats: ComparativeStats): Promise<void> {
  try {
    const cacheDir = path.join('/tmp', 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    const cachePath = path.join(cacheDir, 'stats-cache.json');
    
    // Load existing cache
    let existingCache: Record<string, ComparativeStats> = {};
    if (fs.existsSync(cachePath)) {
      existingCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    }
    
    // Add new entry
    existingCache[key] = stats;
    fs.writeFileSync(cachePath, JSON.stringify(existingCache, null, 2));
  } catch (error) {
    console.error('Stats cache save error:', error);
  }
}

// Cache version - bump this to invalidate old cached stats when logic changes
const STATS_CACHE_VERSION = 'v2';

// Generate comparative stats for both animals in one call for better differentiation
async function generateComparativeStats(animalA: string, animalB: string): Promise<ComparativeStats> {
  // Create cache key (sorted to handle A vs B and B vs A) with version
  const sorted = [animalA.toLowerCase(), animalB.toLowerCase()].sort();
  const cacheKey = `${STATS_CACHE_VERSION}-${sorted[0]}-vs-${sorted[1]}`;
  const isReversed = sorted[0] !== animalA.toLowerCase();
  
  // Check in-memory cache first
  if (statsCache.has(cacheKey)) {
    console.log(`Stats cache hit (memory): ${cacheKey}`);
    const cached = statsCache.get(cacheKey)!;
    return isReversed ? swapStats(cached) : cached;
  }
  
  // Check file cache
  const fileCache = await loadStatsCache();
  if (fileCache.has(cacheKey)) {
    console.log(`Stats cache hit (file): ${cacheKey}`);
    const cached = fileCache.get(cacheKey)!;
    statsCache.set(cacheKey, cached); // Populate memory cache
    return isReversed ? swapStats(cached) : cached;
  }
  
  console.log(`Stats cache miss: ${cacheKey} - calling API`);
  
  const prompt = `Compare ${animalA} vs ${animalB} for a "Who Would Win?" battle book.

Rate each animal from 1-10 in these categories with REAL scientific facts.

CRITICAL: The animal with the BETTER stat in the note MUST have the HIGHER score!
- If ${animalA} has higher bite force → ${animalA} gets higher strength score
- If ${animalB} is faster → ${animalB} gets higher speed score
- NEVER give a lower score to the animal with the better stat!

STRENGTH (bite force PSI, lifting power):
- Tiger ~1,050 PSI, Lion ~650 PSI, Crocodile ~3,700 PSI, Jaguar ~1,500 PSI

SPEED (top speed mph):  
- Cheetah 70mph, Lion 50mph, Tiger 35-40mph, Elephant 25mph

WEAPONS (claws, teeth with measurements):
- Tiger: 4-inch claws, 3-inch canines
- Lion: 3-inch claws, 1-inch canines

DEFENSE (hide thickness, size, armor):
- Thickness, muscle mass, evasion ability

Return JSON only:
{
  "strengthA": <number 1-10>,
  "strengthB": <number 1-10>,
  "speedA": <number 1-10>,
  "speedB": <number 1-10>,
  "weaponsA": <number 1-10>,
  "weaponsB": <number 1-10>,
  "defenseA": <number 1-10>,
  "defenseB": <number 1-10>,
  "strengthNote": "Compare both animals' bite force/strength - winner of comparison MUST have higher score above",
  "speedNote": "Compare both animals' speed - faster animal MUST have higher score above",
  "weaponsNote": "Compare both animals' weapons - better armed animal MUST have higher score above",
  "defenseNote": "Compare both animals' defense - better defended MUST have higher score above",
  "keyAdvantage": "One sentence: who has the main advantage and why"
}`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const stats: ComparativeStats = {
      strengthA: result.strengthA || 7,
      strengthB: result.strengthB || 7,
      speedA: result.speedA || 7,
      speedB: result.speedB || 7,
      weaponsA: result.weaponsA || 7,
      weaponsB: result.weaponsB || 7,
      defenseA: result.defenseA || 7,
      defenseB: result.defenseB || 7,
      strengthNote: result.strengthNote || '',
      speedNote: result.speedNote || '',
      weaponsNote: result.weaponsNote || '',
      defenseNote: result.defenseNote || '',
      keyAdvantage: result.keyAdvantage || '',
    };
    
    // Save to both caches
    statsCache.set(cacheKey, stats);
    await saveStatsToCache(cacheKey, stats);
    
    return isReversed ? swapStats(stats) : stats;
  } catch (error) {
    console.error('Comparative stats error:', error);
    // Fallback with some variation
    const fallback: ComparativeStats = {
      strengthA: 7, strengthB: 6,
      speedA: 6, speedB: 7,
      weaponsA: 7, weaponsB: 8,
      defenseA: 8, defenseB: 6,
    };
    return isReversed ? swapStats(fallback) : fallback;
  }
}

// Helper to swap A/B stats when cache key order differs from request order
function swapStats(stats: ComparativeStats): ComparativeStats {
  return {
    strengthA: stats.strengthB, strengthB: stats.strengthA,
    speedA: stats.speedB, speedB: stats.speedA,
    weaponsA: stats.weaponsB, weaponsB: stats.weaponsA,
    defenseA: stats.defenseB, defenseB: stats.defenseA,
    strengthNote: stats.strengthNote,
    speedNote: stats.speedNote,
    weaponsNote: stats.weaponsNote,
    defenseNote: stats.defenseNote,
    keyAdvantage: stats.keyAdvantage,
  };
}

async function generateBook(animalA: string, animalB: string, environment: string): Promise<{ pages: BookPage[], winner: string }> {
  console.log(`Generating book: ${animalA} vs ${animalB} in ${environment}`);
  
  // Generate facts and comparative stats in parallel
  const [factsA, factsB, compStats] = await Promise.all([
    generateAnimalFacts(animalA),
    generateAnimalFacts(animalB),
    generateComparativeStats(animalA, animalB),
  ]);
  
  // Override individual scores with comparative ones
  factsA.strength_score = compStats.strengthA;
  factsA.speed_score = compStats.speedA;
  factsA.weapons_score = compStats.weaponsA;
  factsA.defense_score = compStats.defenseA;
  
  factsB.strength_score = compStats.strengthB;
  factsB.speed_score = compStats.speedB;
  factsB.weapons_score = compStats.weaponsB;
  factsB.defense_score = compStats.defenseB;

  // Generate battle
  const battle = await generateBattle(factsA, factsB, environment);
  const loser = battle.winner === factsA.name ? factsB.name : factsA.name;

  // Use pre-generated educational images + generate only battle-specific images
  // Sort animal names for consistent image cache keys (same as book cache)
  const sortedNames = [animalA.toLowerCase().replace(/\s+/g, '-'), animalB.toLowerCase().replace(/\s+/g, '-')].sort();
  const imgPrefix = `${sortedNames[0]}-vs-${sortedNames[1]}`;
  const nameA = animalA.toLowerCase().replace(/\s+/g, '-');
  const nameB = animalB.toLowerCase().replace(/\s+/g, '-');
  
  console.log(`Starting book generation for ${animalA} vs ${animalB}`);
  
  // Use pre-generated educational images (stored in public/fighters/)
  const imgA_portrait = `/fighters/${nameA}.jpg`;
  const imgA_habitat = `/fighters/${nameA}-habitat.jpg`;
  const imgA_action = `/fighters/${nameA}-action.jpg`;
  const imgA_closeup = `/fighters/${nameA}-closeup.jpg`;
  
  const imgB_portrait = `/fighters/${nameB}.jpg`;
  const imgB_habitat = `/fighters/${nameB}-habitat.jpg`;
  const imgB_action = `/fighters/${nameB}-action.jpg`;
  const imgB_closeup = `/fighters/${nameB}-closeup.jpg`;
  
  console.log('Using pre-generated educational images');
  
  // Generate only battle-specific images (7 total)
  const [coverImg, battleImg1, battleImg2, battleImg3, battleImg4, battleImg5, victoryImg] = await Promise.all([
    generateImage(`${animalA} facing ${animalB} dramatically, epic showdown, wildlife art`, `${imgPrefix}-cover`),
    generateImage(`${animalA} and ${animalB} facing off, tense confrontation, sizing each other up, dramatic standoff`, `${imgPrefix}-battle1`),
    generateImage(`${animalA} attacking ${animalB}, first strike, action shot, motion blur, intense combat`, `${imgPrefix}-battle2`),
    generateImage(`${animalB} counter-attacking ${animalA}, fierce battle, both animals fighting, dramatic action`, `${imgPrefix}-battle3`),
    generateImage(`${animalA} and ${animalB} locked in combat, intense struggle, close quarters battle, dynamic pose`, `${imgPrefix}-battle4`),
    generateImage(`${animalA} and ${animalB} final decisive moment, climactic battle scene, one gaining advantage`, `${imgPrefix}-battle5`),
    generateImage(`${battle.winner} powerful stance after battle, realistic animal behavior, dramatic lighting, wildlife photography`, `${imgPrefix}-victory`),
  ]);
  console.log('Battle images generated');
  
  // Pre-generated secrets images
  const imgA_secrets = `/fighters/${nameA}-secrets.jpg`;
  const imgB_secrets = `/fighters/${nameB}-secrets.jpg`;
  
  // Group images for easy access
  const imagesA = { portrait: imgA_portrait, habitat: imgA_habitat, action: imgA_action, closeup: imgA_closeup, secrets: imgA_secrets };
  const imagesB = { portrait: imgB_portrait, habitat: imgB_habitat, action: imgB_action, closeup: imgB_closeup, secrets: imgB_secrets };

  const pages: BookPage[] = [
    {
      id: 'cover',
      type: 'cover',
      title: `${factsA.name} vs ${factsB.name}`,
      content: `<p class="text-center text-2xl font-black text-[#d4af37]">WHO WOULD WIN?</p>`,
      imageUrl: coverImg,
    },
    
    // Animal A - Educational Pages (Who Would Win? style) - Different images for variety
    {
      id: 'intro-a',
      type: 'intro',
      title: `MEET THE ${factsA.name.toUpperCase()}!`,
      content: `
        <p class="text-lg mb-2" style="text-align: center;"><em style="color: #666;">${factsA.scientific_name}</em></p>
        <div class="did-you-know">
          <p>${factsA.fun_facts[0]}</p>
        </div>
        <div class="habitat-badge">${factsA.habitat.split(',')[0] || factsA.habitat}</div>
      `,
      imageUrl: imagesA.portrait,
    },
    {
      id: 'size-a',
      type: 'intro',
      title: `HOW BIG IS IT?`,
      content: `
        <div class="size-compare">
          ${factsA.size_comparisons && factsA.size_comparisons.length > 0 ? `
            <span class="size-emoji">${factsA.size_comparisons[0].emoji}</span>
            <p>${factsA.size_comparisons[0].comparison}</p>
          ` : `
            <span class="size-emoji">📏</span>
            <p>${factsA.size}</p>
          `}
        </div>
        ${factsA.size_comparisons && factsA.size_comparisons.length > 1 ? `
          <div class="size-compare">
            <span class="size-emoji">${factsA.size_comparisons[1].emoji}</span>
            <p>${factsA.size_comparisons[1].comparison}</p>
          </div>
        ` : ''}
        <div class="think-about-it">
          <p>Could YOU fit under a ${factsA.name}? Would it be taller than your house?</p>
        </div>
      `,
      imageUrl: imagesA.habitat,
    },
    {
      id: 'weapons-a',
      type: 'intro',
      title: `${factsA.name.toUpperCase()} WEAPONS!`,
      content: `
        <div class="weapon-box">
          <p>${factsA.weapons[0]}</p>
        </div>
        ${factsA.weapons[1] ? `<div class="weapon-box"><p>${factsA.weapons[1]}</p></div>` : ''}
        ${factsA.weapons[2] ? `<div class="weapon-box"><p>${factsA.weapons[2]}</p></div>` : ''}
        <div class="did-you-know">
          <p>⚡ TOP SPEED: ${factsA.speed}</p>
        </div>
      `,
      imageUrl: imagesA.action,
    },
    {
      id: 'defense-a',
      type: 'intro',
      title: `${factsA.name.toUpperCase()} DEFENSES!`,
      content: `
        <div class="defense-box">
          <p>${factsA.defenses[0]}</p>
        </div>
        ${factsA.defenses[1] ? `<div class="defense-box"><p>${factsA.defenses[1]}</p></div>` : ''}
        ${factsA.defenses[2] ? `<div class="defense-box"><p>${factsA.defenses[2]}</p></div>` : ''}
        <div class="did-you-know">
          <p>🍖 DIET: ${factsA.diet}</p>
        </div>
      `,
      imageUrl: imagesA.closeup,
    },
    {
      id: 'facts-a',
      type: 'intro',
      title: `${factsA.name.toUpperCase()} SECRETS!`,
      content: `
        ${factsA.fun_facts.slice(1).map(fact => `
          <div class="did-you-know">
            <p>${fact}</p>
          </div>
        `).join('')}
        <div class="think-about-it">
          <p>What would YOU do if you met a ${factsA.name} in the wild?</p>
        </div>
      `,
      imageUrl: imagesA.secrets,
    },
    
    // Animal B - Educational Pages (Who Would Win? style) - Different images for variety
    {
      id: 'intro-b',
      type: 'intro',
      title: `MEET THE ${factsB.name.toUpperCase()}!`,
      content: `
        <p class="text-lg mb-2" style="text-align: center;"><em style="color: #666;">${factsB.scientific_name}</em></p>
        <div class="did-you-know">
          <p>${factsB.fun_facts[0]}</p>
        </div>
        <div class="habitat-badge">${factsB.habitat.split(',')[0] || factsB.habitat}</div>
      `,
      imageUrl: imagesB.portrait,
    },
    {
      id: 'size-b',
      type: 'intro',
      title: `HOW BIG IS IT?`,
      content: `
        <div class="size-compare">
          ${factsB.size_comparisons && factsB.size_comparisons.length > 0 ? `
            <span class="size-emoji">${factsB.size_comparisons[0].emoji}</span>
            <p>${factsB.size_comparisons[0].comparison}</p>
          ` : `
            <span class="size-emoji">📏</span>
            <p>${factsB.size}</p>
          `}
        </div>
        ${factsB.size_comparisons && factsB.size_comparisons.length > 1 ? `
          <div class="size-compare">
            <span class="size-emoji">${factsB.size_comparisons[1].emoji}</span>
            <p>${factsB.size_comparisons[1].comparison}</p>
          </div>
        ` : ''}
        <div class="think-about-it">
          <p>Could YOU fit under a ${factsB.name}? Would it be taller than your house?</p>
        </div>
      `,
      imageUrl: imagesB.habitat,
    },
    {
      id: 'weapons-b',
      type: 'intro',
      title: `${factsB.name.toUpperCase()} WEAPONS!`,
      content: `
        <div class="weapon-box">
          <p>${factsB.weapons[0]}</p>
        </div>
        ${factsB.weapons[1] ? `<div class="weapon-box"><p>${factsB.weapons[1]}</p></div>` : ''}
        ${factsB.weapons[2] ? `<div class="weapon-box"><p>${factsB.weapons[2]}</p></div>` : ''}
        <div class="did-you-know">
          <p>⚡ TOP SPEED: ${factsB.speed}</p>
        </div>
      `,
      imageUrl: imagesB.action,
    },
    {
      id: 'defense-b',
      type: 'intro',
      title: `${factsB.name.toUpperCase()} DEFENSES!`,
      content: `
        <div class="defense-box">
          <p>${factsB.defenses[0]}</p>
        </div>
        ${factsB.defenses[1] ? `<div class="defense-box"><p>${factsB.defenses[1]}</p></div>` : ''}
        ${factsB.defenses[2] ? `<div class="defense-box"><p>${factsB.defenses[2]}</p></div>` : ''}
        <div class="did-you-know">
          <p>🍖 DIET: ${factsB.diet}</p>
        </div>
      `,
      imageUrl: imagesB.closeup,
    },
    {
      id: 'facts-b',
      type: 'intro',
      title: `${factsB.name.toUpperCase()} SECRETS!`,
      content: `
        ${factsB.fun_facts.slice(1).map(fact => `
          <div class="did-you-know">
            <p>${fact}</p>
          </div>
        `).join('')}
        <div class="think-about-it">
          <p>What would YOU do if you met a ${factsB.name} in the wild?</p>
        </div>
      `,
      imageUrl: imagesB.secrets,
    },
    {
      id: 'stats',
      type: 'stats',
      title: 'TALE OF THE TAPE!',
      content: `
        <div class="stat-bar-container">
          <div class="stat-bar-label">💪 STRENGTH</div>
          ${compStats.strengthNote ? `<p class="stat-note">${compStats.strengthNote}</p>` : ''}
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px;">
            <div style="flex: 1;">
              <div class="stat-bar">
                <div class="stat-bar-fill" style="width: ${factsA.strength_score * 10}%; background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%);">
                  ${factsA.strength_score}/10
                </div>
              </div>
              <p style="text-align: center; margin-top: 5px; font-weight: bold; color: #c41e3a;">${factsA.name}</p>
            </div>
            <div style="flex: 1;">
              <div class="stat-bar">
                <div class="stat-bar-fill" style="width: ${factsB.strength_score * 10}%; background: linear-gradient(135deg, #1e4fc4 0%, #0d47a1 100%);">
                  ${factsB.strength_score}/10
                </div>
              </div>
              <p style="text-align: center; margin-top: 5px; font-weight: bold; color: #1e4fc4;">${factsB.name}</p>
            </div>
          </div>

          <div class="stat-bar-label">⚡ SPEED</div>
          ${compStats.speedNote ? `<p class="stat-note">${compStats.speedNote}</p>` : ''}
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px;">
            <div style="flex: 1;">
              <div class="stat-bar">
                <div class="stat-bar-fill" style="width: ${factsA.speed_score * 10}%; background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%);">
                  ${factsA.speed_score}/10
                </div>
              </div>
            </div>
            <div style="flex: 1;">
              <div class="stat-bar">
                <div class="stat-bar-fill" style="width: ${factsB.speed_score * 10}%; background: linear-gradient(135deg, #1e4fc4 0%, #0d47a1 100%);">
                  ${factsB.speed_score}/10
                </div>
              </div>
            </div>
          </div>

          <div class="stat-bar-label">⚔️ WEAPONS</div>
          ${compStats.weaponsNote ? `<p class="stat-note">${compStats.weaponsNote}</p>` : ''}
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px;">
            <div style="flex: 1;">
              <div class="stat-bar">
                <div class="stat-bar-fill" style="width: ${factsA.weapons_score * 10}%; background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%);">
                  ${factsA.weapons_score}/10
                </div>
              </div>
            </div>
            <div style="flex: 1;">
              <div class="stat-bar">
                <div class="stat-bar-fill" style="width: ${factsB.weapons_score * 10}%; background: linear-gradient(135deg, #1e4fc4 0%, #0d47a1 100%);">
                  ${factsB.weapons_score}/10
                </div>
              </div>
            </div>
          </div>

          <div class="stat-bar-label">🛡️ DEFENSE</div>
          ${compStats.defenseNote ? `<p class="stat-note">${compStats.defenseNote}</p>` : ''}
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 20px;">
            <div style="flex: 1;">
              <div class="stat-bar">
                <div class="stat-bar-fill" style="width: ${factsA.defense_score * 10}%; background: linear-gradient(135deg, #c41e3a 0%, #8b0000 100%);">
                  ${factsA.defense_score}/10
                </div>
              </div>
            </div>
            <div style="flex: 1;">
              <div class="stat-bar">
                <div class="stat-bar-fill" style="width: ${factsB.defense_score * 10}%; background: linear-gradient(135deg, #1e4fc4 0%, #0d47a1 100%);">
                  ${factsB.defense_score}/10
                </div>
              </div>
            </div>
          </div>
        </div>

        ${compStats.keyAdvantage ? `
        <div class="did-you-know" style="margin-top: 20px;">
          <p>🎯 KEY ADVANTAGE: ${compStats.keyAdvantage}</p>
        </div>
        ` : `
        <div class="think-about-it" style="margin-top: 20px;">
          <p>${generateTacticalAnalysis(factsA, factsB)}</p>
        </div>
        `}
      `,
    },
    {
      id: 'battle-1',
      type: 'battle',
      title: '',
      content: `<p>${battle.scenes[0]}</p>`,
      imageUrl: battleImg1,
    },
    {
      id: 'battle-2',
      type: 'battle',
      title: '',
      content: `<p>${battle.scenes[1]}</p>`,
      imageUrl: battleImg2,
    },
    {
      id: 'battle-3',
      type: 'battle',
      title: '',
      content: `<p>${battle.scenes[2]}</p>`,
      imageUrl: battleImg3,
    },
    {
      id: 'battle-4',
      type: 'battle',
      title: '',
      content: `<p>${battle.scenes[3]}</p>`,
      imageUrl: battleImg4,
    },
    {
      id: 'battle-5',
      type: 'battle',
      title: '',
      content: `<p>${battle.scenes[4]}</p>`,
      imageUrl: battleImg5,
    },
    {
      id: 'victory',
      type: 'victory',
      title: '',
      content: `
        <div class="victory-overlay">
          <p class="victory-label">THE WINNER</p>
          <p class="victory-name">${battle.winner.toUpperCase()}</p>
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
  const imgPrefix = `${animalA.toLowerCase().replace(/\s+/g, '-')}-vs-${animalB.toLowerCase().replace(/\s+/g, '-')}`;
  const choiceImage = await generateImage(`${animalA} and ${animalB} facing off, tense moment before battle, dramatic standoff`, `${imgPrefix}-choice`);

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

// Book cache version - bump to invalidate old cached books when image/content logic changes
const BOOK_CACHE_VERSION = 'v7';

// Persistent cache using Vercel Blob (survives deployments)
function getCacheKey(animalA: string, animalB: string, environment: string): string {
  // Normalize to always be alphabetical order for consistency
  const sorted = [animalA.toLowerCase(), animalB.toLowerCase()].sort();
  return `${BOOK_CACHE_VERSION}_${sorted[0]}_vs_${sorted[1]}_${environment}`.replace(/[^a-z0-9_]/g, '_');
}

// In-memory URL cache for faster lookups (within same instance)
const blobUrlCache = new Map<string, string>();

async function loadCachedBook(cacheKey: string): Promise<{ pages: BookPage[], winner: string } | null> {
  const blobPath = `fightingbooks/cache/${cacheKey}.json`;
  console.log(`[CACHE-LOAD] Checking blob: ${blobPath}`);
  
  // Try Vercel Blob first (persistent)
  try {
    // Check if we have the URL cached in memory
    let blobUrl = blobUrlCache.get(cacheKey);
    
    if (!blobUrl) {
      console.log(`[CACHE-LOAD] No in-memory URL, calling head()...`);
      // Use head() to check if blob exists and get its URL
      const blobInfo = await head(blobPath);
      blobUrl = blobInfo.url;
      blobUrlCache.set(cacheKey, blobUrl);
      console.log(`[CACHE-LOAD] Found blob URL: ${blobUrl}`);
    } else {
      console.log(`[CACHE-LOAD] Using in-memory URL: ${blobUrl}`);
    }
    
    // Fetch the cached data
    const dataResponse = await fetch(blobUrl);
    if (dataResponse.ok) {
      const data = await dataResponse.json();
      console.log(`[CACHE-LOAD] SUCCESS - Blob cache hit: ${cacheKey}`);
      return data;
    } else {
      console.log(`[CACHE-LOAD] Blob fetch failed: ${dataResponse.status}`);
    }
  } catch (error) {
    // BlobNotFoundError is expected for cache miss
    if (error instanceof BlobNotFoundError) {
      console.log(`[CACHE-LOAD] Blob not found (expected for first generation): ${blobPath}`);
    } else {
      console.error(`[CACHE-LOAD] Blob error:`, error);
    }
  }
  
  // Fallback to /tmp for backward compatibility
  try {
    const cachePath = path.join('/tmp', 'cache', `${cacheKey}.json`);
    if (fs.existsSync(cachePath)) {
      const data = fs.readFileSync(cachePath, 'utf-8');
      console.log(`Cache hit (tmp): ${cacheKey}`);
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Tmp cache error:', error);
  }
  
  console.log(`Cache miss: ${cacheKey}`);
  return null;
}

async function saveCachedBook(cacheKey: string, data: { pages: BookPage[], winner: string }): Promise<void> {
  // Save to Vercel Blob (persistent)
  try {
    const jsonData = JSON.stringify(data);
    const blob = await put(`fightingbooks/cache/${cacheKey}.json`, jsonData, {
      access: 'public',
      contentType: 'application/json',
    });
    // Cache the URL for faster lookups
    blobUrlCache.set(cacheKey, blob.url);
    console.log(`Cache saved to Blob: ${cacheKey} -> ${blob.url}`);
  } catch (error) {
    console.error('Blob cache save error:', error);
  }
  
  // Also save to /tmp for faster local reads
  try {
    const cacheDir = path.join('/tmp', 'cache');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    const cachePath = path.join(cacheDir, `${cacheKey}.json`);
    fs.writeFileSync(cachePath, JSON.stringify(data));
  } catch (error) {
    console.error('Tmp cache save error:', error);
  }
}

async function saveCachedPDF(cacheKey: string, animalA: string, animalB: string, data: { pages: BookPage[], winner: string }): Promise<void> {
  try {
    const cacheDir = path.join('/tmp', 'cache');
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
    console.log(`[CACHE] Looking for book: ${cacheKey}`);
    console.log(`[CACHE] BLOB_READ_WRITE_TOKEN present: ${!!process.env.BLOB_READ_WRITE_TOKEN}`);
    
    let result = await loadCachedBook(cacheKey);
    let cacheStatus = 'HIT';
    
    if (!result) {
      cacheStatus = 'MISS';
      console.log(`[CACHE] ${cacheStatus} - generating new book for ${animalA} vs ${animalB}`);
      // Generate new book
      result = await generateBook(animalA, animalB, environment);
      // Save to cache (JSON + PDF)
      await saveCachedBook(cacheKey, result);
      await saveCachedPDF(cacheKey, animalA, animalB, result); // Generate PDF alongside
    } else {
      console.log(`[CACHE] ${cacheStatus} - returning cached book for ${animalA} vs ${animalB}`);
    }
    
    if (mode === 'cyoa') {
      result.pages = await addCyoaChoices(result.pages, animalA, animalB);
    }

    // Include cache status in response for debugging
    return NextResponse.json({ ...result, _cacheStatus: cacheStatus, _cacheKey: cacheKey });
  } catch (error) {
    console.error('Book start error:', error);
    return NextResponse.json({ error: 'Failed to generate book' }, { status: 500 });
  }
}
