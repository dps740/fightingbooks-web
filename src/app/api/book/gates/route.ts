import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { put, head, BlobNotFoundError } from '@vercel/blob';

// Must match start/route.ts and choice/route.ts
const CYOA_CACHE_VERSION = 'v2';

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

interface AnimalFacts {
  name: string;
  weapons: string[];
  defenses: string[];
  speed: string;
  habitat: string;
}

// Generate a cache key for CYOA gates (consistent ordering)
function getCyoaCacheKey(animalA: string, animalB: string): string {
  const sorted = [animalA.toLowerCase().replace(/\s+/g, '-'), animalB.toLowerCase().replace(/\s+/g, '-')].sort();
  return `${sorted[0]}-vs-${sorted[1]}`;
}

// Load cached CYOA gates from Vercel Blob
async function loadCachedCyoaGates(cacheKey: string): Promise<{ gates: any[] } | null> {
  const blobPath = `fightingbooks/cyoa/${cacheKey}/gates-${CYOA_CACHE_VERSION}.json`;
  try {
    const blobInfo = await head(blobPath);
    const response = await fetch(blobInfo.url);
    if (response.ok) {
      const data = await response.json();
      console.log(`[GATES] Cache HIT: ${cacheKey}`);
      return data;
    }
  } catch (error) {
    if (!(error instanceof BlobNotFoundError)) {
      console.error(`[GATES] Cache error:`, error);
    }
  }
  return null;
}

// Save CYOA gates to Vercel Blob
async function saveCachedCyoaGates(cacheKey: string, data: any): Promise<void> {
  const blobPath = `fightingbooks/cyoa/${cacheKey}/gates-${CYOA_CACHE_VERSION}.json`;
  try {
    await put(blobPath, JSON.stringify(data), {
      access: 'public',
      contentType: 'application/json',
    });
    console.log(`[GATES] Saved: ${cacheKey}`);
  } catch (error) {
    console.error(`[GATES] Save error:`, error);
  }
}

// Generate animal facts (lightweight version for gate generation)
async function generateAnimalFacts(animalName: string): Promise<AnimalFacts> {
  const prompt = `Return brief combat facts about a ${animalName} as JSON:
{
  "name": "Common name",
  "weapons": ["primary weapon", "secondary weapon", "special tactic"],
  "defenses": ["main defense", "secondary defense"],
  "speed": "top speed with comparison",
  "habitat": "primary habitat"
}`;

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 200,
    });
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Facts error:', error);
    return {
      name: animalName,
      weapons: ['Powerful attack', 'Sharp claws', 'Raw strength'],
      defenses: ['Thick hide', 'Quick reflexes'],
      speed: 'Fast when needed',
      habitat: 'Various environments',
    };
  }
}

// Generate CYOA choices using AI for all 3 gates
async function generateCyoaGates(animalA: string, animalB: string, factsA: AnimalFacts, factsB: AnimalFacts): Promise<any[]> {
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
- This is a 1v1 battle - ONE animal on each side, NO teamwork
- ALWAYS name the specific animal in each choice
- NO arena, stadium, or fighting ring references - this happens in the WILD
- Titles should be UNIQUE and SPECIFIC to what's happening
- The 3 gates should FLOW as a narrative: Gate 1 = opening encounter, Gate 2 = escalation, Gate 3 = decisive moment

Return JSON:
{
  "gates": [
    {
      "title": "DRAMATIC CONTEXTUAL TITLE",
      "intro": "One sentence setting the wild scene",
      "choices": [
        { "text": "What THE ${animalA.toUpperCase()} does", "icon": "emoji", "favors": "A", "outcome": "Brief hint of what happens (2-3 sentences)" },
        { "text": "What THE ${animalB.toUpperCase()} does", "icon": "emoji", "favors": "B", "outcome": "Brief hint" },
        { "text": "Neutral action involving BOTH animals by name", "icon": "emoji", "favors": "neutral", "outcome": "Brief hint" }
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

    const processedGates = [];
    for (let i = 0; i < 3; i++) {
      const gate = gates[i] || {};
      const choices = gate.choices || [];
      while (choices.length < 3) {
        choices.push({
          text: 'The encounter intensifies!',
          icon: '⚡',
          favors: 'neutral',
          outcome: 'Both animals hold their ground!',
        });
      }
      processedGates.push({
        title: gate.title || ['The Encounter', 'The Chase', 'The Showdown'][i],
        intro: gate.intro || 'The tension builds in the wild...',
        choices: choices.slice(0, 3),
        gateNumber: i + 1,
      });
    }
    return processedGates;
  } catch (error) {
    console.error('CYOA gates error:', error);
    return [
      {
        title: 'The Clearing', intro: 'The two predators spot each other...', gateNumber: 1,
        choices: [
          { text: `The ${animalA} charges forward!`, icon: '💨', favors: 'A', outcome: 'A burst of speed!' },
          { text: `The ${animalB} stands its ground!`, icon: '🌿', favors: 'B', outcome: 'Size dominates!' },
          { text: 'Both circle warily!', icon: '🔄', favors: 'neutral', outcome: 'A tense standoff!' },
        ],
      },
      {
        title: 'The Strike', intro: 'The first attack is launched...', gateNumber: 2,
        choices: [
          { text: `The ${animalA} leaps to higher ground!`, icon: '🦁', favors: 'A', outcome: 'Agility wins!' },
          { text: `The ${animalB} counters with raw power!`, icon: '🛡️', favors: 'B', outcome: 'Strength prevails!' },
          { text: 'A glancing blow — both regroup!', icon: '⚔️', favors: 'neutral', outcome: 'A draw!' },
        ],
      },
      {
        title: 'The Final Moment', intro: 'One final clash...', gateNumber: 3,
        choices: [
          { text: `The ${animalA} goes all out!`, icon: '🔥', favors: 'A', outcome: 'Maximum aggression!' },
          { text: `The ${animalB} delivers a calculated strike!`, icon: '🎯', favors: 'B', outcome: 'Precision!' },
          { text: 'Both give everything!', icon: '💥', favors: 'neutral', outcome: 'An epic clash!' },
        ],
      },
    ];
  }
}

// Generate battle background image with caching
async function generateBattleBg(animalA: string, animalB: string): Promise<string> {
  const nameA = animalA.toLowerCase().replace(/\s+/g, '-');
  const nameB = animalB.toLowerCase().replace(/\s+/g, '-');
  const cacheKey = `${nameA}-vs-${nameB}-cyoa-bg`;
  const blobPath = `fightingbooks/${cacheKey}.jpg`;

  // Check blob cache
  try {
    const blobInfo = await head(blobPath);
    console.log(`[GATES] BG cache HIT: ${cacheKey}`);
    return blobInfo.url;
  } catch (error) {
    if (!(error instanceof BlobNotFoundError)) {
      console.error('[GATES] BG cache error:', error);
    }
  }

  // Generate new image
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) return `https://placehold.co/512x512/1a1a1a/d4af37?text=Battle`;

  try {
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `${animalA} and ${animalB} facing off, epic battle scene, dramatic dark battlefield, wildlife documentary photography, photorealistic, dramatic lighting. ABSOLUTELY NO TEXT IN THE IMAGE.`,
        image_size: 'square_hd',
        num_inference_steps: 4,
      }),
    });

    if (!response.ok) return `https://placehold.co/512x512/1a1a1a/d4af37?text=Battle`;

    const result = await response.json();
    const imageUrl = result.images?.[0]?.url;
    if (!imageUrl) return `https://placehold.co/512x512/1a1a1a/d4af37?text=Battle`;

    // Upload to blob
    const imgResponse = await fetch(imageUrl);
    const imgBuffer = await imgResponse.arrayBuffer();
    const blob = await put(blobPath, imgBuffer, {
      access: 'public',
      contentType: 'image/jpeg',
    });
    console.log(`[GATES] BG generated: ${cacheKey}`);
    return blob.url;
  } catch (error) {
    console.error('[GATES] BG generation error:', error);
    return `https://placehold.co/512x512/1a1a1a/d4af37?text=Battle`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { animalA, animalB, forceRegenerate = false } = await request.json();

    if (!animalA || !animalB) {
      return NextResponse.json({ error: 'Missing animal names' }, { status: 400 });
    }

    const cyoaCacheKey = getCyoaCacheKey(animalA, animalB);

    // Try cache first
    let cachedGates = forceRegenerate ? null : await loadCachedCyoaGates(cyoaCacheKey);

    if (!cachedGates) {
      console.log(`[GATES] Generating new gates for ${animalA} vs ${animalB}`);
      // Generate facts + gates in parallel
      const [factsA, factsB] = await Promise.all([
        generateAnimalFacts(animalA),
        generateAnimalFacts(animalB),
      ]);
      const gates = await generateCyoaGates(animalA, animalB, factsA, factsB);

      cachedGates = { gates };
      await saveCachedCyoaGates(cyoaCacheKey, {
        animalA,
        animalB,
        createdAt: new Date().toISOString(),
        gates,
      });
    }

    // Build gate 1 page (with battle background image)
    const [battleBg] = await Promise.all([
      generateBattleBg(animalA, animalB),
    ]);

    const nameA = animalA.toLowerCase().replace(/\s+/g, '-');
    const nameB = animalB.toLowerCase().replace(/\s+/g, '-');
    const portraitA = `/fighters/${nameA}.jpg`;
    const portraitB = `/fighters/${nameB}.jpg`;

    const firstGate = cachedGates.gates[0];
    const gatePage = {
      id: 'decision-1',
      type: 'choice',
      title: firstGate.title,
      content: `<p class="decision-intro">${firstGate.intro}</p>`,
      imageUrl: battleBg,
      choices: firstGate.choices,
      gateNumber: 1,
      animalAPortrait: portraitA,
      animalBPortrait: portraitB,
    };

    return NextResponse.json({
      gatePage,
      gatesReady: true,
      _cacheStatus: cachedGates ? 'HIT' : 'MISS',
    });
  } catch (error) {
    console.error('Gates generation error:', error);
    return NextResponse.json({ error: 'Failed to generate adventure gates' }, { status: 500 });
  }
}
