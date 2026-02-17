import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs';
import { put, head, del, list, BlobNotFoundError } from '@vercel/blob';
import { generatePDF } from '@/lib/pdfGenerator';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import {
  UserTier,
  canAccessMatchup,
  canAccessAnimal,
  canAccessCyoa,
  isFreeSampleMatchup,
  getRequiredTier,
  getTierInfo,
  getUpgradeOptions,
  normalizeTier,
  FANTASY_ANIMALS,
  DINOSAUR_ANIMALS,
} from '@/lib/tierAccess';

// Dinosaur reference images for image conditioning (improves anatomical accuracy)
// These are served from public/fighters/refs/ and used as image_url with Flux Dev
const DINO_REFERENCE_IMAGES: Record<string, { url: string; strength: number }> = {
  'stegosaurus': { url: '/fighters/refs/stegosaurus.png', strength: 0.8 },
  'brachiosaurus': { url: '/fighters/refs/brachiosaurus.png', strength: 0.8 },
  'spinosaurus': { url: '/fighters/refs/spinosaurus.png', strength: 0.8 },
  'velociraptor': { url: '/fighters/refs/velociraptor.png', strength: 0.8 },
};

// Supabase client for auth
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Get user's tier from session
async function getUserTier(): Promise<{ tier: UserTier; userId: string | null }> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;

    if (!token) {
      return { tier: 'unregistered', userId: null };
    }

    const supabase = getSupabase();
    let { data: { user }, error } = await supabase.auth.getUser(token);

    // If access token expired, try refreshing
    if (error || !user) {
      const refreshToken = cookieStore.get('sb-refresh-token')?.value;
      if (refreshToken) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });
        if (!refreshError && refreshData.session && refreshData.user) {
          user = refreshData.user;
          error = null;
          cookieStore.set('sb-access-token', refreshData.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365,
          });
          cookieStore.set('sb-refresh-token', refreshData.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365,
          });
        }
      }
    }

    if (error || !user) {
      return { tier: 'unregistered', userId: null };
    }

    // Admin emails always get full access
    const ADMIN_EMAILS = ['david.smith@epsilon-three.com'];
    const isAdmin = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

    // Get tier from users table
    const { data: profile } = await supabase
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .single();

    return {
      tier: isAdmin ? 'ultimate' : normalizeTier(profile?.tier || 'free'),
      userId: user.id,
    };
  } catch (error) {
    console.error('getUserTier error:', error);
    return { tier: 'unregistered', userId: null };
  }
}

interface AnimalStats {
  strength: number;
  speed: number;
  weapons: number;
  defense: number;
}

interface BookPage {
  id: string;
  type: string;
  title: string;
  content: string;
  imageUrl?: string;
  choices?: { id: string; text: string; emoji: string; favors?: string; outcome?: string }[];
  gateNumber?: number;
  animalAPortrait?: string;
  animalBPortrait?: string;
  stats?: {
    animalA: AnimalStats;
    animalB: AnimalStats;
  };
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
  'electric eel': {
    include: 'electric eel, long serpentine freshwater fish with smooth dark olive-brown skin, elongated body, small eyes, flat wide mouth, South American river habitat',
    avoid: 'NOT a snake, NOT a moray eel, this is a freshwater FISH with a long body, NO scales visible'
  },
  'great horned owl': {
    include: 'great horned owl with prominent feathered ear tufts, intense yellow eyes, barred brown and white plumage, large powerful talons, facial disc pattern',
    avoid: 'NO small owl species, must be LARGE and imposing, NOT a snowy owl, NOT white'
  },
  'giant panda': {
    include: 'giant panda bear with distinctive black and white fur, black eye patches around eyes, black ears, black legs and shoulders, white face and body, round stocky build, bamboo forest',
    avoid: 'NOT a red panda, NOT a raccoon, NOT a regular bear, must show iconic BLACK AND WHITE coloring'
  },
  'mandrill': {
    include: 'mandrill primate with vivid bright blue ridged nose, red nostrils and lips, golden beard, olive-brown fur, colorful blue and purple rump, large canine fangs',
    avoid: 'NOT a baboon, NOT a monkey without colors, must show the distinctive VIVID blue and red facial coloring'
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

// Image model override (set by admin bypass for Dev-quality regeneration)
let _imageModelOverride: { model: string; steps: number } | null = null;

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
      // Add cache-busting param based on upload time to defeat browser/CDN caching
      const cacheBust = blobInfo.uploadedAt ? `?v=${new Date(blobInfo.uploadedAt).getTime()}` : `?v=${Date.now()}`;
      console.log(`Image cache HIT: ${cacheKey} -> ${blobInfo.url}${cacheBust}`);
      return `${blobInfo.url}${cacheBust}`;
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

  // Detect if prompt contains fantasy or dinosaur creatures
  const promptLower = prompt.toLowerCase();
  const hasFantasy = FANTASY_ANIMALS.some(a => promptLower.includes(a.toLowerCase()));
  const hasDinosaur = DINOSAUR_ANIMALS.some(a => promptLower.includes(a.toLowerCase()));
  
  let stylePrompt: string;
  if (hasFantasy) {
    // Fantasy creatures need a different art style - no "photorealistic wildlife" or "NO fantasy elements"
    stylePrompt = `STYLE: epic fantasy illustration, detailed mythological creature art, dramatic cinematic lighting, rich colors, detailed textures on scales/fur/feathers/wings, high fantasy concept art quality. ANATOMY: each creature has species-accurate anatomy as described in mythology, correct proportions for mythological depiction. CRITICAL SPECIES SEPARATION: Each creature must be its own DISTINCT species with NO blending between the two fighters. FORBIDDEN - NEVER INCLUDE: NO human features whatsoever, NO human hands, NO human arms, NO bipedal standing poses unless species-appropriate, NO raised fists or celebration poses, NO human-like expressions, NO anthropomorphism, NO human clothing, NO human weapons (no swords no guns no armor), NO extra heads beyond what the species has (e.g. hydra has multiple, griffin has one), NO cartoon style. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO WRITING, NO CAPTIONS, NO LABELS IN THE IMAGE - THE IMAGE MUST CONTAIN ZERO TEXT OF ANY KIND.`;
  } else if (hasDinosaur) {
    // Dinosaurs: photorealistic but prehistoric setting
    stylePrompt = `STYLE: photorealistic paleoart, museum-quality dinosaur illustration, dramatic natural lighting, prehistoric environment, detailed scales/skin texture. ANATOMY: each animal has exactly ONE head and ONE body, correct number of limbs for species, species-accurate distinctive markings, realistic proportions. CRITICAL SPECIES SEPARATION: Each animal must be its own DISTINCT species with NO blending. FORBIDDEN - NEVER INCLUDE: NO human features whatsoever, NO human hands, NO human arms, NO bipedal standing poses unless species-appropriate, NO raised fists or celebration poses, NO human-like expressions, NO anthropomorphism, NO human clothing on animals, NO human weapons, NO fantasy elements, NO extra limbs or heads, NO cartoon style. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO WRITING, NO CAPTIONS, NO LABELS IN THE IMAGE - THE IMAGE MUST CONTAIN ZERO TEXT OF ANY KIND.`;
  } else {
    // Real animals: original photorealistic wildlife style
    stylePrompt = `STYLE: wildlife documentary photography, National Geographic quality, photorealistic nature photography, dramatic natural lighting, detailed fur/scales/feathers texture. ANATOMY: each animal has exactly ONE head and ONE body, correct number of limbs for species, species-accurate distinctive markings, realistic proportions, animals in NATURAL quadruped or species-appropriate poses only. CRITICAL SPECIES SEPARATION: Each animal must be its own DISTINCT species with NO blending. A lion has a mane but NO stripes. A tiger has stripes but NO mane. Keep each animal 100% true to its real species appearance. FORBIDDEN - NEVER INCLUDE: NO human features whatsoever, NO human hands, NO human arms, NO bipedal standing poses, NO raised fists or celebration poses, NO victory poses, NO human-like expressions, NO anthropomorphism, NO human clothing on animals, NO human weapons (no swords no guns no armor), NO fantasy elements, NO extra limbs or heads, NO conjoined or merged animals, NO hybrid animals, NO blended features between species, NO mutant features, NO cartoon style. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO WRITING, NO CAPTIONS, NO LABELS IN THE IMAGE - THE IMAGE MUST CONTAIN ZERO TEXT OF ANY KIND. Animals must behave and pose like REAL WILD ANIMALS in nature.`;
  }

  const fullPrompt = `${prompt},${animalFeatures} ${stylePrompt}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} for: ${cacheKey || prompt.slice(0, 30)}`);
        await new Promise(r => setTimeout(r, 1000 * attempt)); // Backoff delay
      }
      
      // Use Grok Imagine for battle image generation (better quality, $0.02/image via FAL)
      // For dino reference conditioning, use the /edit endpoint
      let grokEndpoint = 'xai/grok-imagine-image';
      let grokBody: Record<string, unknown> = {
        prompt: fullPrompt,
        aspect_ratio: '1:1',
        output_format: 'jpeg',
      };

      // Check if any dinosaur in the prompt has a reference image for conditioning
      if (hasDinosaur) {
        for (const [dinoName, ref] of Object.entries(DINO_REFERENCE_IMAGES)) {
          if (promptLower.includes(dinoName)) {
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whowouldwinbooks.com';
            // Use the /edit endpoint for image-to-image with reference
            grokEndpoint = 'xai/grok-imagine-image/edit';
            grokBody.image_url = `${siteUrl}${ref.url}`;
            console.log(`[DINO-REF] Using Grok Imagine edit with reference for ${dinoName}`);
            break; // Use first matching dino reference
          }
        }
      }

      // Allow model override for admin regeneration (falls back to Flux Dev)
      if (_imageModelOverride) {
        const response = await fetch(`https://fal.run/${_imageModelOverride.model}`, {
          method: 'POST',
          headers: {
            'Authorization': `Key ${falKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: fullPrompt,
            image_size: 'square_hd',
            num_inference_steps: _imageModelOverride.steps,
          }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Fal.ai override error (attempt ${attempt + 1}):`, errorText);
          if (attempt === retries) {
            return `https://placehold.co/512x512/1a1a1a/d4af37?text=${encodeURIComponent(prompt.slice(0, 20))}`;
          }
          continue;
        }
        const result = await response.json();
        const imageUrl = result.images?.[0]?.url;
        if (!imageUrl) {
          if (attempt === retries) return `https://placehold.co/512x512/1a1a1a/d4af37?text=Image`;
          continue;
        }
        const filename = cacheKey || `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const finalUrl = await uploadToBlob(imageUrl, filename);
        console.log(`Generated (override): ${cacheKey || 'image'}`);
        return finalUrl;
      }
      
      const response = await fetch(`https://fal.run/${grokEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(grokBody),
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

// Load pre-verified animal facts from static JSON (avoids LLM hallucination at runtime)
let _cachedStaticFacts: Record<string, AnimalFacts> | null = null;
function loadStaticFacts(): Record<string, AnimalFacts> {
  if (_cachedStaticFacts) return _cachedStaticFacts;
  try {
    const factsPath = path.join(process.cwd(), 'data', 'animal-facts.json');
    const data = JSON.parse(fs.readFileSync(factsPath, 'utf-8'));
    _cachedStaticFacts = data;
    console.log(`[FACTS] Loaded ${Object.keys(data).length} pre-verified animal facts`);
    return data;
  } catch (e) {
    console.error('[FACTS] Could not load static facts:', e);
    return {};
  }
}

// Generate animal facts — uses static pre-verified data first, falls back to LLM
async function generateAnimalFacts(animalName: string): Promise<AnimalFacts> {
  // Check static facts first
  const staticFacts = loadStaticFacts();
  const key = animalName.toLowerCase().replace(/\s+/g, '-');
  if (staticFacts[key]) {
    console.log(`[FACTS] Using pre-verified facts for: ${animalName}`);
    return staticFacts[key];
  }

  // Check custom_animals table (DB-backed animals)
  try {
    const supabase = getSupabase();
    const { data: customAnimal } = await supabase
      .from('custom_animals')
      .select('facts')
      .eq('slug', key)
      .eq('status', 'ready')
      .limit(1)
      .single();

    if (customAnimal?.facts) {
      console.log(`[FACTS] Using custom animal facts for: ${animalName}`);
      return customAnimal.facts as unknown as AnimalFacts;
    }
  } catch (e) {
    console.log(`[FACTS] No custom animal facts for "${animalName}"`);
  }

  console.log(`[FACTS] No static facts for "${animalName}" (key: ${key}), falling back to LLM`);

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
function generateSizePrompt(name: string): string {
  const prompts = [
    `How many ${name}s would it take to be as tall as your school?`,
    `Could a ${name} fit through your front door?`,
    `Is a ${name} bigger or smaller than your family car?`,
    `Would a ${name} be heavier than your teacher?`,
    `Could you ride on a ${name}'s back?`,
    `How many of YOU would weigh the same as one ${name}?`,
    `Would a ${name} fit in your bedroom?`,
    `Could a ${name} hide behind your couch?`,
    `Is a ${name} longer than a school bus?`,
    `Would a ${name} be taller than your dad?`,
    `Could you carry a baby ${name}?`,
    `How many ${name}s could fit in a swimming pool?`,
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

function generateWildPrompt(name: string): string {
  const prompts = [
    `What would YOU do if you met a ${name} in the wild?`,
    `Would you rather be as fast as a ${name} or as strong?`,
    `If you could have one ${name} superpower, which would you pick?`,
    `Could you outsmart a ${name} in a game of hide and seek?`,
    `What would a ${name} think of YOUR house?`,
    `Would a ${name} make a good pet? Why or why not?`,
    `If a ${name} came to your school, what would happen?`,
    `What's the first thing you'd ask a ${name} if it could talk?`,
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
}

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
const STATS_CACHE_VERSION = 'v4';

// Generate comparative stats for both animals in one call for better differentiation
async function generateComparativeStats(animalA: string, animalB: string): Promise<ComparativeStats> {
  // Create cache key (sorted to handle A vs B and B vs A) with version
  const sorted = [animalA.toLowerCase(), animalB.toLowerCase()].sort();
  const cacheKey = `${STATS_CACHE_VERSION}-${sorted[0]}-vs-${sorted[1]}`;
  const isReversed = sorted[0] !== animalA.toLowerCase();
  
  // sortedA/sortedB: animals in alphabetical order (matches cache key)
  // We ALWAYS generate the prompt in sorted order so stats align with cache
  const sortedA = isReversed ? animalB : animalA;
  const sortedB = isReversed ? animalA : animalB;
  
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
  
  console.log(`Stats cache miss: ${cacheKey} - calling API (sorted: ${sortedA} vs ${sortedB})`);
  
  // IMPORTANT: Prompt uses SORTED order so A/B in response matches cache key order.
  // This prevents the bug where scores and notes disagree after a swap.
  const prompt = `Compare ${sortedA} vs ${sortedB} for a "Who Would Win?" battle book for KIDS ages 6-10.

Rate each animal from 1-10 in these categories with REAL scientific facts.
Write the notes in a FUN, EXCITING, kid-friendly style — SHORT punchy sentences, use CAPS for WOW moments, compare to things kids know (cars, bowling balls, school buses), and end each note with "🏆 Edge: [winner]!" or "🏆 Too close to call!" if tied.

CRITICAL: The animal with the BETTER stat in the note MUST have the HIGHER score!
- If ${sortedA} has higher bite force → ${sortedA} gets higher strength score
- If ${sortedB} is faster → ${sortedB} gets higher speed score
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
  "strengthA": <number 1-10 for ${sortedA}>,
  "strengthB": <number 1-10 for ${sortedB}>,
  "speedA": <number 1-10 for ${sortedA}>,
  "speedB": <number 1-10 for ${sortedB}>,
  "weaponsA": <number 1-10 for ${sortedA}>,
  "weaponsB": <number 1-10 for ${sortedB}>,
  "defenseA": <number 1-10 for ${sortedA}>,
  "defenseB": <number 1-10 for ${sortedB}>,
  "strengthNote": "SHORT and EXCITING! Use CAPS, real measurements, and fun comparisons kids understand. Example: 'The Tiger CRUSHES with 1,050 PSI — enough to crack a BOWLING BALL! The Lion hits 650 PSI. 🏆 Edge: Tiger!' Winner MUST have higher score.",
  "speedNote": "SHORT and EXCITING! Use CAPS and fun comparisons. Example: 'The Cheetah hits 70 MPH — faster than a car on the HIGHWAY! The Lion maxes out at 50 MPH. 🏆 Edge: Cheetah!' Faster animal MUST have higher score.",
  "weaponsNote": "SHORT and EXCITING! Use CAPS and measurements. Example: 'Tiger packs 4-INCH razor claws — as long as your FINGER! Lion has 3-inch claws. Both have bone-crushing jaws! 🏆 Edge: Tiger!' Better armed MUST have higher score.",
  "defenseNote": "SHORT and EXCITING! Use CAPS and vivid descriptions. Example: 'The Crocodile has ARMOR-PLATED skin that can stop a bullet! The Shark relies on speed to dodge. 🏆 Edge: Croc!' Better defended MUST have higher score.",
  "keyAdvantage": "One DRAMATIC sentence about the key matchup factor. Use CAPS for emphasis. Example: 'The Tiger has the EDGE in raw firepower, but the Lion fights in PRIDES — and backup changes EVERYTHING!'"
}`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    // Stats are in SORTED order (matching cache key)
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
    
    // Save to both caches (stats are already in sorted/cache-key order)
    statsCache.set(cacheKey, stats);
    await saveStatsToCache(cacheKey, stats);
    
    // Swap to caller's order if needed
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

// Generate Tale of the Tape HTML — Option A face-off bars with bold fonts
// Exported as a standalone function so migration scripts can use it too
function generateTapeHTML(nameA: string, nameB: string, compStats: ComparativeStats, tacticalFallback: string): string {
  const scoreA_str = compStats.strengthA;
  const scoreA_spd = compStats.speedA;
  const scoreA_wpn = compStats.weaponsA;
  const scoreA_def = compStats.defenseA;
  const scoreB_str = compStats.strengthB;
  const scoreB_spd = compStats.speedB;
  const scoreB_wpn = compStats.weaponsB;
  const scoreB_def = compStats.defenseB;

  function statBlock(emoji: string, label: string, sA: number, sB: number, note?: string): string {
    return `
      <div class="tape-stat">
        <div class="tape-stat-label">${emoji} ${label}</div>
        ${note ? `<div class="tape-stat-note">${note}</div>` : ''}
        <div class="tape-stat-row">
          <span class="tape-score tape-score-a">${sA}/10</span>
          <div class="tape-bars">
            <div class="tape-bar-left"><div class="tape-fill tape-fill-a" style="width: ${sA * 10}%;"></div></div>
            <div class="tape-bar-right"><div class="tape-fill tape-fill-b" style="width: ${sB * 10}%;"></div></div>
          </div>
          <span class="tape-score tape-score-b">${sB}/10</span>
        </div>
      </div>`;
  }

  const advantageHTML = compStats.keyAdvantage
    ? `<div class="tape-advantage">
        <div class="tape-advantage-label">💡 KEY ADVANTAGE</div>
        <p>${compStats.keyAdvantage}</p>
      </div>`
    : `<div class="tape-advantage">
        <div class="tape-advantage-label">💡 ANALYSIS</div>
        <p>${tacticalFallback}</p>
      </div>`;

  return `
    <div class="tape-fighters">
      <span class="tape-fighter-a">🔴 ${nameA}</span>
      <span class="tape-vs">VS</span>
      <span class="tape-fighter-b">${nameB} 🔵</span>
    </div>
    ${statBlock('💪', 'STRENGTH', scoreA_str, scoreB_str, compStats.strengthNote)}
    ${statBlock('⚡', 'SPEED', scoreA_spd, scoreB_spd, compStats.speedNote)}
    ${statBlock('⚔️', 'WEAPONS', scoreA_wpn, scoreB_wpn, compStats.weaponsNote)}
    ${statBlock('🛡️', 'DEFENSE', scoreA_def, scoreB_def, compStats.defenseNote)}
    ${advantageHTML}
  `;
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
  // Prompts are derived from the actual battle text for unique, story-matched scenes
  // Style suffix ensures photorealistic quality and prevents text/logos
  const BATTLE_STYLE = 'photorealistic wildlife photography, dramatic natural lighting, shallow depth of field, cinematic composition';
  const BATTLE_NEG = 'ABSOLUTELY NO TEXT NO WORDS NO LETTERS NO LOGOS NO WATERMARKS NO SYMBOLS NO WRITING, NO human features NO fists NO hands NO weapons NO standing upright like humans, ONLY these two animals no other creatures no duplicate animals no extra species, anatomically accurate natural animal bodies';
  
  // Build image prompts from the actual battle scene text
  const sceneToPrompt = (sceneText: string, sceneHint: string) => {
    // Strip any HTML and truncate to keep prompt focused
    const clean = sceneText.replace(/<[^>]*>/g, '').trim().slice(0, 200);
    return `${clean}, ${animalA} and ${animalB}, ${sceneHint}, ${BATTLE_STYLE}, ${BATTLE_NEG}`;
  };

  const [coverImg, battleImg1, battleImg2, battleImg3, battleImg4, battleImg5, victoryImg] = await Promise.all([
    generateImage(`${animalA} on the left facing ${animalB} on the right, intense staredown before battle, two separate distinct animals in natural poses ready to fight, tense atmosphere, ${BATTLE_STYLE}, ${BATTLE_NEG}`, `${imgPrefix}-cover`),
    generateImage(sceneToPrompt(battle.scenes[0], 'initial confrontation, sizing each other up'), `${imgPrefix}-battle1`),
    generateImage(sceneToPrompt(battle.scenes[1], 'first strike, explosive action shot'), `${imgPrefix}-battle2`),
    generateImage(sceneToPrompt(battle.scenes[2], 'fierce counterattack, intense combat'), `${imgPrefix}-battle3`),
    generateImage(sceneToPrompt(battle.scenes[3], 'momentum shift, dramatic turning point'), `${imgPrefix}-battle4`),
    generateImage(sceneToPrompt(battle.scenes[4], 'decisive finale, climactic battle moment'), `${imgPrefix}-battle5`),
    generateImage(`${battle.winner} standing proud after victory, natural dominant animal posture, surveying territory, single animal only, ${BATTLE_STYLE}, ${BATTLE_NEG}`, `${imgPrefix}-victory`),
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
          <p>${generateSizePrompt(factsA.name)}</p>
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
          <p>${generateWildPrompt(factsA.name)}</p>
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
          <p>${generateSizePrompt(factsB.name)}</p>
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
          <p>${generateWildPrompt(factsB.name)}</p>
        </div>
      `,
      imageUrl: imagesB.secrets,
    },
    {
      id: 'stats',
      type: 'stats',
      title: 'TALE OF THE TAPE!',
      content: generateTapeHTML(factsA.name, factsB.name, compStats, generateTacticalAnalysis(factsA, factsB)),
      // Store numeric stats for CYOA winner calculation
      stats: {
        animalA: {
          strength: factsA.strength_score * 10,
          speed: factsA.speed_score * 10,
          weapons: factsA.weapons_score * 10,
          defense: factsA.defense_score * 10,
        },
        animalB: {
          strength: factsB.strength_score * 10,
          speed: factsB.speed_score * 10,
          weapons: factsB.weapons_score * 10,
          defense: factsB.defense_score * 10,
        },
      },
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

// Generate CYOA choices using AI for all 3 gates
async function generateCyoaGates(animalA: string, animalB: string, factsA: AnimalFacts, factsB: AnimalFacts): Promise<any[]> {
  // Generate all 3 decision points with contextual, wild-themed titles in a single API call
  const prompt = `Generate 3 dramatic decision moments for a wild encounter between ${animalA} and ${animalB}.

Animal A (${animalA}):
- Weapons: ${factsA.weapons.join(', ')}
- Speed: ${factsA.speed}
- Natural habitat: ${factsA.habitat}

Animal B (${animalB}):
- Weapons: ${factsB.weapons.join(', ')}
- Speed: ${factsB.speed}
- Natural habitat: ${factsB.habitat}

Create 3 unique decision points that happen during this wild 1v1 encounter (ONE ${animalA} vs ONE ${animalB}).

Each decision point needs:
1. A dramatic, contextual TITLE (2-4 words) specific to THIS battle
2. An intro sentence setting the scene (natural wild setting, NO arena/stadium references)
3. THREE choices in this EXACT order:
   - Choice 1 (LEFT): Favors ${animalA} (red corner) - describe what THE ${animalA.toUpperCase()} does
   - Choice 2 (RIGHT): Favors ${animalB} (blue corner) - describe what THE ${animalB.toUpperCase()} does
   - Choice 3 (CENTER): Neutral - both animals act, neither has advantage

CRITICAL RULES:
- This is a 1v1 battle - ONE animal on each side, NO teamwork, NO "one distracts while the other attacks"
- ALWAYS name the specific animal in each choice (say "The ${animalA}" or "The ${animalB}", never "the predator" or "one of them")
- NO arena, stadium, or fighting ring references - this happens in the WILD
- Titles should be UNIQUE and SPECIFIC to what's happening in that moment
- The setting should feel like a nature documentary

Return JSON:
{
  "gates": [
    {
      "title": "DRAMATIC CONTEXTUAL TITLE",
      "intro": "One sentence setting the wild scene",
      "choices": [
        {
          "text": "What THE ${animalA.toUpperCase()} does (1-2 sentences, NAME the animal)",
          "icon": "single emoji",
          "favors": "A",
          "outcome": "What happens when ${animalA} gains advantage (2-3 sentences)"
        },
        {
          "text": "What THE ${animalB.toUpperCase()} does (1-2 sentences, NAME the animal)",
          "icon": "single emoji", 
          "favors": "B",
          "outcome": "What happens when ${animalB} gains advantage (2-3 sentences)"
        },
        {
          "text": "Neutral action involving BOTH animals by name",
          "icon": "single emoji",
          "favors": "neutral",
          "outcome": "What happens in the standoff (2-3 sentences)"
        }
      ]
    },
    { ... },
    { ... }
  ]
}

The order MUST be: A-favoring, B-favoring, neutral for every gate.`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    const gates = result.gates || [];
    
    // Ensure we have exactly 3 gates with proper structure
    const processedGates = [];
    for (let i = 0; i < 3; i++) {
      const gate = gates[i] || {};
      const choices = gate.choices || [];
      
      // Ensure 3 choices per gate
      while (choices.length < 3) {
        choices.push({
          text: 'The encounter intensifies!',
          icon: '⚡',
          favors: 'neutral',
          outcome: 'Both animals hold their ground, neither giving an inch!',
        });
      }
      
      processedGates.push({
        title: gate.title || ['The Encounter', 'The Chase', 'The Showdown'][i],
        intro: gate.intro || 'The tension builds in the wild...',
        choices: choices.slice(0, 3),
        gateNumber: i + 1, // Keep for internal tracking, but won't display to user
      });
    }
    
    return processedGates;
  } catch (error) {
    console.error('Error generating CYOA gates:', error);
    // Fallback with wild-themed titles
    return [
      {
        title: 'The Clearing',
        intro: 'The two predators spot each other across an open clearing...',
        gateNumber: 1,
        choices: [
          { text: 'A burst of speed across the open ground!', icon: '💨', favors: 'A', outcome: `The faster animal closes the distance in a flash!` },
          { text: 'A slow, intimidating approach through the grass!', icon: '🌿', favors: 'B', outcome: `The larger animal uses its size to dominate the space!` },
          { text: 'Both circle warily, testing each other!', icon: '🔄', favors: 'neutral', outcome: 'Neither commits yet, sizing up the opponent!' },
        ],
      },
      {
        title: 'The Strike',
        intro: 'The first attack is launched...',
        gateNumber: 2,
        choices: [
          { text: 'A powerful leap to gain higher ground!', icon: '🦁', favors: 'A', outcome: `Using agility to gain the advantage!` },
          { text: 'Standing ground with a devastating counter!', icon: '🛡️', favors: 'B', outcome: `Raw power meets the charge head-on!` },
          { text: 'A glancing blow - both animals regroup!', icon: '⚔️', favors: 'neutral', outcome: 'The first exchange ends in a draw!' },
        ],
      },
      {
        title: 'The Final Moment',
        intro: 'One final clash will decide everything...',
        gateNumber: 3,
        choices: [
          { text: 'An all-out assault holding nothing back!', icon: '🔥', favors: 'A', outcome: `Maximum aggression for the win!` },
          { text: 'A patient, calculated finishing move!', icon: '🎯', favors: 'B', outcome: `Precision over power!` },
          { text: 'Both animals give everything they have!', icon: '💥', favors: 'neutral', outcome: 'An epic clash of titans!' },
        ],
      },
    ];
  }
}

// CYOA Cache Version - bump to invalidate cached gates when generation logic changes
const CYOA_CACHE_VERSION = 'v1';

// Generate a cache key for CYOA gates (consistent ordering)
function getCyoaCacheKey(animalA: string, animalB: string): string {
  const sorted = [animalA.toLowerCase().replace(/\s+/g, '-'), animalB.toLowerCase().replace(/\s+/g, '-')].sort();
  return `${sorted[0]}-vs-${sorted[1]}`;
}

// Load cached CYOA gates from Vercel Blob
async function loadCachedCyoaGates(cacheKey: string): Promise<{ gates: any[] } | null> {
  const blobPath = `fightingbooks/cyoa/${cacheKey}/gates-${CYOA_CACHE_VERSION}.json`;
  console.log(`[CYOA-CACHE] Checking blob: ${blobPath}`);
  
  try {
    const blobInfo = await head(blobPath);
    const response = await fetch(blobInfo.url);
    if (response.ok) {
      const data = await response.json();
      console.log(`[CYOA-CACHE] Gates found for ${cacheKey}`);
      return data;
    }
  } catch (error) {
    if (!(error instanceof BlobNotFoundError)) {
      console.error(`[CYOA-CACHE] Error loading gates:`, error);
    }
  }
  
  return null;
}

// Save CYOA gates to Vercel Blob
async function saveCachedCyoaGates(cacheKey: string, data: { animalA: string; animalB: string; createdAt: string; gates: any[] }): Promise<void> {
  const blobPath = `fightingbooks/cyoa/${cacheKey}/gates-${CYOA_CACHE_VERSION}.json`;
  
  try {
    const blob = await put(blobPath, JSON.stringify(data), {
      access: 'public',
      contentType: 'application/json',
    });
    console.log(`[CYOA-CACHE] Gates saved to: ${blob.url}`);
  } catch (error) {
    console.error(`[CYOA-CACHE] Error saving gates:`, error);
  }
}

// Add ONLY the first CYOA gate (progressive reveal)
async function addFirstCyoaGate(pages: BookPage[], animalA: string, animalB: string, cachedData: { gates: any[] }): Promise<BookPage[]> {
  const statsIndex = pages.findIndex(p => p.type === 'stats');
  if (statsIndex === -1) return pages;

  const gates = cachedData.gates;
  if (gates.length === 0) return pages;

  // Get animal portraits for VS header
  const nameA = animalA.toLowerCase().replace(/\s+/g, '-');
  const nameB = animalB.toLowerCase().replace(/\s+/g, '-');
  const portraitA = `/fighters/${nameA}.jpg`;
  const portraitB = `/fighters/${nameB}.jpg`;

  // Generate battle scene image (also cached via generateImage's internal cache)
  const imgPrefix = `${nameA}-vs-${nameB}`;
  const battleBg = await generateImage(
    `${animalA} and ${animalB} facing off, epic battle scene, dramatic dark battlefield`,
    `${imgPrefix}-cyoa-bg`
  );

  // Insert ONLY gate 1 after stats
  const beforeStats = pages.slice(0, statsIndex + 1);
  
  const firstGate = gates[0];
  const firstDecisionPage: BookPage = {
    id: `decision-1`,
    type: 'choice',
    title: firstGate.title,
    content: `<p class="decision-intro">${firstGate.intro}</p>`,
    imageUrl: battleBg,
    choices: firstGate.choices,
    gateNumber: 1,
    animalAPortrait: portraitA,
    animalBPortrait: portraitB,
  };

  return [...beforeStats, firstDecisionPage];
}

// Legacy function - kept for reference but no longer used
async function addCyoaChoicesFromCachedGates(pages: BookPage[], animalA: string, animalB: string, cachedData: { gates: any[] }): Promise<BookPage[]> {
  const statsIndex = pages.findIndex(p => p.type === 'stats');
  if (statsIndex === -1) return pages;

  const gates = cachedData.gates;

  // Get animal portraits for VS header
  const nameA = animalA.toLowerCase().replace(/\s+/g, '-');
  const nameB = animalB.toLowerCase().replace(/\s+/g, '-');
  const portraitA = `/fighters/${nameA}.jpg`;
  const portraitB = `/fighters/${nameB}.jpg`;

  // Generate battle scene image (also cached via generateImage's internal cache)
  const imgPrefix = `${nameA}-vs-${nameB}`;
  const battleBg = await generateImage(
    `${animalA} and ${animalB} facing off, epic battle scene, dramatic dark battlefield`,
    `${imgPrefix}-cyoa-bg`
  );

  // Insert the 3 decision gates after stats
  const beforeStats = pages.slice(0, statsIndex + 1);
  
  const decisionPages: BookPage[] = gates.map((gate, index) => ({
    id: `decision-${index + 1}`,
    type: 'choice',
    title: gate.title,
    content: `<p class="decision-intro">${gate.intro}</p>`,
    imageUrl: battleBg,
    choices: gate.choices,
    gateNumber: index + 1,
    animalAPortrait: portraitA,
    animalBPortrait: portraitB,
  }));

  return [...beforeStats, ...decisionPages];
}

// Add CYOA choices - generates all 3 decision gates upfront (legacy, used when no cache)
async function addCyoaChoices(pages: BookPage[], animalA: string, animalB: string, factsA: AnimalFacts, factsB: AnimalFacts): Promise<BookPage[]> {
  const statsIndex = pages.findIndex(p => p.type === 'stats');
  if (statsIndex === -1) return pages;

  // Generate all 3 gates of choices
  console.log('Generating CYOA gates...');
  const gates = await generateCyoaGates(animalA, animalB, factsA, factsB);

  // Get animal portraits for VS header
  const nameA = animalA.toLowerCase().replace(/\s+/g, '-');
  const nameB = animalB.toLowerCase().replace(/\s+/g, '-');
  const portraitA = `/fighters/${nameA}.jpg`;
  const portraitB = `/fighters/${nameB}.jpg`;

  // Generate battle scene image
  const imgPrefix = `${nameA}-vs-${nameB}`;
  const battleBg = await generateImage(
    `${animalA} and ${animalB} facing off, epic battle scene, dramatic dark battlefield`,
    `${imgPrefix}-cyoa-bg`
  );

  // Insert the 3 decision gates after stats
  const beforeStats = pages.slice(0, statsIndex + 1);
  
  const decisionPages: BookPage[] = gates.map((gate, index) => ({
    id: `decision-${index + 1}`,
    type: 'choice',
    title: gate.title,
    content: `<p class="decision-intro">${gate.intro}</p>`,
    imageUrl: battleBg,
    choices: gate.choices,
    gateNumber: index + 1,
    animalAPortrait: portraitA,
    animalBPortrait: portraitB,
  }));

  return [...beforeStats, ...decisionPages];
}

// Book cache version - bump to invalidate old cached books when image/content logic changes
const BOOK_CACHE_VERSION = 'v9';

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
    const { animalA, animalB, mode = 'standard', environment = 'neutral', forceRegenerate = false, adminSecret, imageModel } = body;

    if (!animalA || !animalB) {
      return NextResponse.json({ error: 'Missing animal names' }, { status: 400 });
    }

    // Admin bypass for automated regeneration (e.g., cache warming)
    const isAdminBypass = adminSecret === process.env.BLOB_READ_WRITE_TOKEN;
    
    // Allow admin to override image model (default is now Dev; use "schnell" for fast/cheap testing)
    if (isAdminBypass && imageModel === 'schnell') {
      _imageModelOverride = { model: 'fal-ai/flux/schnell', steps: 4 };
    } else {
      _imageModelOverride = null;
    }

    // === TIER ACCESS CONTROL (v2: free/paid) ===
    const { tier, userId } = await getUserTier();

    // Check if either animal is a DB-added custom animal (accessible to all logged-in users)
    const isCustomAnimal = async (name: string) => {
      if (canAccessAnimal(tier, name)) return true; // Already accessible via static list
      try {
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        const { data } = await getSupabase().from('custom_animals').select('id, scope').eq('slug', slug).eq('status', 'ready').limit(1).single();
        return !!data; // If it exists in DB, it's accessible
      } catch { return false; }
    };
    const canAccessA = await isCustomAnimal(animalA);
    const canAccessB = await isCustomAnimal(animalB);

    // Check if user can access this matchup (skip for admin bypass, free samples, and custom animals)
    if (!isAdminBypass && !isFreeSampleMatchup(animalA, animalB) && !(canAccessA && canAccessB) && !canAccessMatchup(tier, animalA, animalB)) {
      const upgradeOptions = getUpgradeOptions(tier);
      return NextResponse.json(
        {
          error: 'Tier access required',
          code: 'TIER_REQUIRED',
          message: 'This matchup requires Full Access ($4.99).',
          lockedAnimals: [
            !canAccessA ? animalA : null,
            !canAccessB ? animalB : null,
          ].filter(Boolean),
          requiredTier: getRequiredTier(animalA) === 'ultimate' || getRequiredTier(animalB) === 'ultimate' ? 'ultimate' : 'member',
          currentTier: tier,
          upgradeOptions,
        },
        { status: 403 }
      );
    }

    // Check if CYOA mode is accessible (paid only)
    if (mode === 'cyoa' && !canAccessCyoa(tier)) {
      const upgradeOptions = getUpgradeOptions(tier);

      if (tier === 'unregistered') {
        return NextResponse.json(
          {
            error: 'Sign up required',
            code: 'SIGNUP_REQUIRED',
            message: 'Create a free account, then unlock Adventure mode with Full Access ($4.99)!',
            currentTier: tier,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error: 'Adventure mode requires Full Access',
          code: 'CYOA_TIER_REQUIRED',
          message: 'Adventure mode requires Full Access ($4.99). Unlock all 47 animals, tournaments, and Adventure mode!',
          currentTier: tier,
          upgradeOptions,
        },
        { status: 403 }
      );
    }
    // === END TIER ACCESS CONTROL ===

    // Check cache first (skip if forceRegenerate)
    const cacheKey = getCacheKey(animalA, animalB, environment);
    console.log(`[CACHE] Looking for book: ${cacheKey} (forceRegenerate: ${forceRegenerate})`);
    console.log(`[CACHE] BLOB_READ_WRITE_TOKEN present: ${!!process.env.BLOB_READ_WRITE_TOKEN}`);
    
    // When force regenerating, clear ALL cached assets (book JSON + battle images)
    if (forceRegenerate) {
      console.log(`[CACHE] Force regenerate — clearing all cached assets for ${cacheKey}`);
      try {
        // Clear book cache JSON
        const bookCacheBlob = await list({ prefix: `fightingbooks/cache/${cacheKey}` });
        for (const blob of bookCacheBlob.blobs) {
          await del(blob.url);
          console.log(`[CACHE] Deleted book cache: ${blob.pathname}`);
        }
        // Clear battle image blobs (sort names for consistent prefix)
        const sortedNames = [animalA.toLowerCase().replace(/\s+/g, '-'), animalB.toLowerCase().replace(/\s+/g, '-')].sort();
        const imgPrefix = `${sortedNames[0]}-vs-${sortedNames[1]}`;
        const imgBlobs = await list({ prefix: `fightingbooks/${imgPrefix}` });
        for (const blob of imgBlobs.blobs) {
          await del(blob.url);
          console.log(`[CACHE] Deleted battle image: ${blob.pathname}`);
        }
      } catch (e) {
        console.error('[CACHE] Error clearing cached assets:', e);
      }
    }

    let result = forceRegenerate ? null : await loadCachedBook(cacheKey);
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
    
    // CYOA gates are now loaded separately via /api/book/gates
    // This keeps the initial book load fast and under the 60s timeout

    // Include cache status in response for debugging
    return NextResponse.json({ ...result, _cacheStatus: cacheStatus, _cacheKey: cacheKey });
  } catch (error) {
    console.error('Book start error:', error);
    return NextResponse.json({ error: 'Failed to generate book', message: 'This matchup is taking longer than usual to create. Please try again — progress has been saved!' }, { status: 500 });
  }
}
