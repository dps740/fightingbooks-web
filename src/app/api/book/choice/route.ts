import { NextRequest, NextResponse } from 'next/server';
import { put, head, BlobNotFoundError } from '@vercel/blob';
import OpenAI from 'openai';

// CYOA Cache Version - bump to invalidate when narrative logic changes
const CYOA_CACHE_VERSION = 'v2';

// Lazy init OpenAI to avoid build-time errors
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

interface ChoiceRequest {
  animalA: string;
  animalB: string;
  choiceIndex: number;
  gateNumber: number;
  choiceFavors: string;
  choiceOutcome: string;
  currentScore: { A: number; B: number };
  currentPath: string; // NEW: Track the path (e.g., "", "A", "A-B")
  allPages: any[];
  taleOfTheTape?: {
    animalA: { strength: number; speed: number; weapons: number; defense: number };
    animalB: { strength: number; speed: number; weapons: number; defense: number };
  };
}

// Generate a cache key for CYOA (consistent ordering)
function getCyoaCacheKey(animalA: string, animalB: string): string {
  const sorted = [animalA.toLowerCase().replace(/\s+/g, '-'), animalB.toLowerCase().replace(/\s+/g, '-')].sort();
  return `${sorted[0]}-vs-${sorted[1]}`;
}

// Load cached CYOA gates from Vercel Blob
async function loadCachedGates(cacheKey: string): Promise<{ gates: any[] } | null> {
  const blobPath = `fightingbooks/cyoa/${cacheKey}/gates-${CYOA_CACHE_VERSION}.json`;
  console.log(`[CYOA-GATES] Checking blob: ${blobPath}`);
  
  try {
    const blobInfo = await head(blobPath);
    const response = await fetch(blobInfo.url);
    if (response.ok) {
      const data = await response.json();
      console.log(`[CYOA-GATES] Gates cache HIT`);
      return data;
    }
  } catch (error) {
    if (!(error instanceof BlobNotFoundError)) {
      console.error(`[CYOA-GATES] Error loading gates:`, error);
    }
  }
  
  return null;
}

// Load cached CYOA path outcome from Vercel Blob
async function loadCachedOutcome(cacheKey: string, pathKey: string): Promise<any | null> {
  const blobPath = `fightingbooks/cyoa/${cacheKey}/path-${pathKey}-${CYOA_CACHE_VERSION}.json`;
  console.log(`[CYOA-OUTCOME] Checking blob: ${blobPath}`);
  
  try {
    const blobInfo = await head(blobPath);
    const response = await fetch(blobInfo.url);
    if (response.ok) {
      const data = await response.json();
      console.log(`[CYOA-OUTCOME] Path ${pathKey} cache HIT`);
      return data;
    }
  } catch (error) {
    if (!(error instanceof BlobNotFoundError)) {
      console.error(`[CYOA-OUTCOME] Error loading path:`, error);
    }
  }
  
  return null;
}

// Create next gate page for progressive reveal
// introOverride: dynamic bridge text from the AI that flows from the previous outcome
async function createNextGatePage(animalA: string, animalB: string, gate: any, gateNumber: number, introOverride?: string): Promise<any> {
  const nameA = animalA.toLowerCase().replace(/\s+/g, '-');
  const nameB = animalB.toLowerCase().replace(/\s+/g, '-');
  const portraitA = `/fighters/${nameA}.jpg`;
  const portraitB = `/fighters/${nameB}.jpg`;
  const imgPrefix = `${nameA}-vs-${nameB}`;
  
  // Use cached battle background (was generated during initial load)
  const battleBg = await generateImage(
    `${animalA} and ${animalB} facing off, epic battle scene, dramatic dark battlefield`,
    `${imgPrefix}-cyoa-bg`
  );
  
  // Use dynamic bridge intro if available, otherwise fall back to pre-generated
  const introText = introOverride || gate.intro;
  
  return {
    id: `decision-${gateNumber}`,
    type: 'choice',
    title: gate.title,
    content: `<p class="decision-intro">${introText}</p>`,
    imageUrl: battleBg,
    choices: gate.choices,
    gateNumber,
    animalAPortrait: portraitA,
    animalBPortrait: portraitB,
  };
}

// Save CYOA path outcome to Vercel Blob
async function saveCachedOutcome(cacheKey: string, pathKey: string, data: any): Promise<void> {
  const blobPath = `fightingbooks/cyoa/${cacheKey}/path-${pathKey}-${CYOA_CACHE_VERSION}.json`;
  
  try {
    const blob = await put(blobPath, JSON.stringify(data), {
      access: 'public',
      contentType: 'application/json',
    });
    console.log(`[CYOA-OUTCOME] Path ${pathKey} saved to: ${blob.url}`);
  } catch (error) {
    console.error(`[CYOA-OUTCOME] Error saving path:`, error);
  }
}

// Upload image to Vercel Blob for permanent storage
async function uploadToBlob(imageUrl: string, filename: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to fetch image');
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    const blob = await put(`fightingbooks/${filename}.jpg`, imageBuffer, {
      access: 'public',
      contentType,
    });
    console.log(`[CYOA-IMAGE] Uploaded: ${filename} -> ${blob.url}`);
    return blob.url;
  } catch (error) {
    console.error('Blob upload error:', error);
    return imageUrl; // Fallback to original URL
  }
}

// Generate image using fal.ai Flux with blob caching
async function generateImage(prompt: string, cacheKey?: string): Promise<string> {
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) {
    console.log('No FAL_API_KEY, using placeholder');
    return `https://placehold.co/512x512/1a1a1a/d4af37?text=${encodeURIComponent(prompt.slice(0, 20))}`;
  }

  // Check if image already exists in blob storage
  if (cacheKey) {
    const blobPath = `fightingbooks/${cacheKey}.jpg`;
    try {
      const blobInfo = await head(blobPath);
      console.log(`[CYOA-IMAGE] Cache HIT: ${cacheKey}`);
      return blobInfo.url;
    } catch (error) {
      if (!(error instanceof BlobNotFoundError)) {
        console.error('[CYOA-IMAGE] Cache check error:', error);
      }
      // Cache miss - proceed to generate
    }
  }

  const fullPrompt = `${prompt}, STYLE: wildlife documentary photography, National Geographic quality, photorealistic nature photography, dramatic natural lighting. ANATOMY: animals in NATURAL quadruped or species-appropriate poses only, correct number of limbs, realistic proportions. CRITICAL: Each animal must be its own DISTINCT species - DO NOT merge or blend animal features. A lion has a mane but NO stripes. A tiger has stripes but NO mane. Keep species completely separate and anatomically accurate to their real-world appearance. FORBIDDEN: NO human features, NO human hands or arms, NO bipedal poses, NO celebration poses, NO raised limbs, NO anthropomorphism, NO human clothing, NO fantasy elements, NO hybrid animals, NO merged features between species. ABSOLUTELY NO TEXT, NO WORDS, NO LETTERS, NO NUMBERS, NO WRITING, NO CAPTIONS, NO LABELS IN THE IMAGE - THE IMAGE MUST CONTAIN ZERO TEXT OF ANY KIND. Animals must behave like REAL WILD ANIMALS.`;

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
    const tempImageUrl = result.images?.[0]?.url;
    
    if (!tempImageUrl) {
      return `https://placehold.co/512x512/1a1a1a/d4af37?text=Image`;
    }
    
    // Upload to blob for permanent storage
    if (cacheKey) {
      return await uploadToBlob(tempImageUrl, cacheKey);
    }
    
    return tempImageUrl;
  } catch (error) {
    console.error('Image generation error:', error);
    return `https://placehold.co/512x512/1a1a1a/d4af37?text=${encodeURIComponent(prompt.slice(0, 20))}`;
  }
}

// Generate a flowing narrative outcome using OpenAI, building on previous events
// Returns { outcome, nextIntro } — outcome is the scene text, nextIntro bridges to the next decision
async function generateNarrative(
  animalA: string,
  animalB: string,
  gateNumber: number,
  choiceText: string,
  choiceFavors: string,
  choiceHint: string,
  previousOutcomes: string[],
  isFinal: boolean,
  winner?: string,
  nextGateChoices?: any[], // The choices for the next gate (so the bridge can set them up)
): Promise<{ outcome: string; nextIntro: string }> {
  const storyContext = previousOutcomes.length > 0
    ? `STORY SO FAR:\n${previousOutcomes.map((o, i) => `Scene ${i + 1}: ${o}`).join('\n')}\n\n`
    : '';

  const favorText = choiceFavors === 'A'
    ? `This moment favors the ${animalA}.`
    : choiceFavors === 'B'
    ? `This moment favors the ${animalB}.`
    : `Neither animal gains a clear advantage.`;

  // Build next-gate context so the bridge sets up the upcoming choices
  let nextGateContext = '';
  if (!isFinal && nextGateChoices && nextGateChoices.length > 0) {
    nextGateContext = `\nThe NEXT decision the reader will face involves these options:\n${nextGateChoices.map((c: any) => `- ${c.text}`).join('\n')}\nThe bridge sentence should naturally lead into this decision moment.\n`;
  }

  const sceneInstruction = isFinal
    ? `Write the FINAL CLIMACTIC scene (3-4 sentences). The ${winner} wins this fight. End decisively — show the winning blow and the ${winner === animalA ? animalB : animalA} backing down or being defeated.`
    : `Write the next scene (2-3 sentences) AND a bridge sentence.
This is scene ${gateNumber} of 3. Build tension — the fight isn't over yet.
${nextGateContext}`;

  const formatInstruction = isFinal
    ? `Return ONLY the narrative text, no JSON, no quotes.`
    : `Return JSON only:
{
  "outcome": "The scene narrative (2-3 exciting sentences describing what happens)",
  "nextIntro": "One bridge sentence that flows from the outcome into the next decision moment. Should feel like a cliffhanger or turning point, NOT a scene reset."
}`;

  const prompt = `You are narrating a "Who Would Win?" children's book battle between a ${animalA} and a ${animalB}.

${storyContext}THE READER CHOSE: ${choiceText}
${favorText}

${sceneInstruction}

RULES:
- Continue DIRECTLY from where the story left off — do NOT reset the scene or re-introduce the animals
- Use the animals' REAL abilities (claws, teeth, speed, armor, etc.)
- Exciting but age-appropriate (no gore, no death descriptions)
- Use CAPS for emphasis on exciting words
- Short, punchy sentences kids love
- Reference the specific choice the reader made
- The hint for this outcome is: "${choiceHint}" — use it as inspiration but write fresh text that flows from the story

${formatInstruction}`;

  try {
    if (isFinal) {
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 250,
      });
      return {
        outcome: response.choices[0].message.content?.trim() || choiceHint,
        nextIntro: '',
      };
    } else {
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 300,
      });
      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        outcome: result.outcome || choiceHint,
        nextIntro: result.nextIntro || 'The battle reaches a turning point...',
      };
    }
  } catch (error) {
    console.error('Narrative generation error:', error);
    return { outcome: choiceHint, nextIntro: 'The fight continues...' };
  }
}

// Extract previous CYOA outcome texts from allPages
function extractPreviousOutcomes(allPages: any[]): string[] {
  const outcomes: string[] = [];
  for (const page of allPages) {
    if (page.id?.startsWith('outcome-')) {
      // Strip HTML tags to get plain text
      const text = (page.content || '').replace(/<[^>]+>/g, '').trim();
      if (text) outcomes.push(text);
    }
  }
  return outcomes;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChoiceRequest = await request.json();
    const { animalA, animalB, choiceFavors, choiceOutcome, currentScore, gateNumber, allPages, currentPath = '' } = body;
    // choiceOutcome is now used as a HINT — the AI generates the actual flowing narrative

    // Find the choice text from the allPages (the choice button the user clicked)
    const choiceText = body.allPages
      ?.find((p: any) => p.type === 'choice' && p.gateNumber === gateNumber)
      ?.choices?.[body.choiceIndex]?.text || choiceOutcome;

    // Build the new path by appending the choice (A, B, or N for neutral)
    const choiceCode = choiceFavors === 'A' ? 'A' : choiceFavors === 'B' ? 'B' : 'N';
    const newPath = currentPath ? `${currentPath}-${choiceCode}` : choiceCode;
    
    // Score points based on gate number (1, 2, 3 points)
    const pointValue = gateNumber;
    const newScore = { ...currentScore };
    
    if (choiceFavors === 'A') {
      newScore.A += pointValue;
    } else if (choiceFavors === 'B') {
      newScore.B += pointValue;
    }
    // Neutral choices don't add points

    console.log(`Gate ${gateNumber} choice made. Favors: ${choiceFavors}. Path: ${newPath}. Score: A=${newScore.A}, B=${newScore.B}`);

    // Check for cached outcome
    const cyoaCacheKey = getCyoaCacheKey(animalA, animalB);
    const cachedOutcome = await loadCachedOutcome(cyoaCacheKey, newPath);
    
    // Load cached gates for progressive reveal
    let cachedGates = await loadCachedGates(cyoaCacheKey);
    
    if (cachedOutcome && cachedGates) {
      // Return cached outcome with computed score
      console.log(`[CYOA-OUTCOME] Returning cached outcome for path ${newPath}`);
      
      // PROGRESSIVE REVEAL: Add next gate if not at final gate
      // Use cached nextIntro (bridge text) so narrative flows
      let pages = cachedOutcome.pages;
      if (gateNumber < 3 && cachedGates.gates[gateNumber]) {
        const nextGate = await createNextGatePage(animalA, animalB, cachedGates.gates[gateNumber], gateNumber + 1, cachedOutcome.nextIntro);
        pages = [...pages, nextGate];
      }
      
      return NextResponse.json({
        pages,
        score: newScore,
        newPath,
        isComplete: gateNumber === 3,
        _cacheStatus: 'HIT',
      });
    }

    // Generate new outcome with flowing narrative
    console.log(`[CYOA-OUTCOME] Generating new narrative for path ${newPath}`);
    const pages = [];
    
    // Load gates if not already loaded (needed for progressive reveal)
    if (!cachedGates) {
      cachedGates = await loadCachedGates(cyoaCacheKey);
    }

    // Extract previous outcomes for narrative context
    const previousOutcomes = extractPreviousOutcomes(allPages);

    // Determine winner early if this is the final gate
    let winner: string | undefined;
    if (gateNumber === 3) {
      let baseScoreA = 50;
      let baseScoreB = 50;
      if (body.taleOfTheTape) {
        const statsA = body.taleOfTheTape.animalA;
        const statsB = body.taleOfTheTape.animalB;
        baseScoreA = (statsA.strength + statsA.speed + statsA.weapons + statsA.defense) / 4;
        baseScoreB = (statsB.strength + statsB.speed + statsB.weapons + statsB.defense) / 4;
      }
      const choiceSwingA = newScore.A * 5;
      const choiceSwingB = newScore.B * 5;
      const finalScoreA = baseScoreA + choiceSwingA;
      const finalScoreB = baseScoreB + choiceSwingB;
      winner = finalScoreA > finalScoreB ? animalA : finalScoreB > finalScoreA ? animalB : (Math.random() > 0.5 ? animalA : animalB);
      console.log(`Final scores - ${animalA}: ${finalScoreA} vs ${animalB}: ${finalScoreB} → Winner: ${winner}`);
    }

    // Get next gate's choices so the AI can write a bridge that sets them up
    const nextGateChoices = (!winner && cachedGates && cachedGates.gates[gateNumber])
      ? cachedGates.gates[gateNumber].choices
      : undefined;

    // Generate flowing narrative via OpenAI
    const { outcome: narrativeText, nextIntro } = await generateNarrative(
      animalA, animalB, gateNumber,
      choiceText, choiceFavors, choiceOutcome,
      previousOutcomes, gateNumber === 3, winner,
      nextGateChoices,
    );

    // Generate outcome image
    const nameA = animalA.toLowerCase().replace(/\s+/g, '-');
    const nameB = animalB.toLowerCase().replace(/\s+/g, '-');
    const imgPrefix = `${nameA}-vs-${nameB}`;
    const outcomeImage = await generateImage(
      `${animalA} and ${animalB} battling, dramatic action scene, ${narrativeText.slice(0, 80)}`,
      `${imgPrefix}-outcome-${newPath}`
    );
    
    pages.push({
      id: `outcome-${gateNumber}`,
      type: 'battle',
      title: '',
      content: `<p class="outcome-text">${narrativeText}</p>`,
      imageUrl: outcomeImage,
    });

    // If final gate, add victory page
    if (gateNumber === 3 && winner) {
      const loser = winner === animalA ? animalB : animalA;
      
      const victoryImage = await generateImage(
        `${winner} proud and defiant after battle`,
        `${imgPrefix}-victory-${newPath}`
      );
      
      const scoreDiff = Math.abs(
        ((body.taleOfTheTape?.animalA ? (body.taleOfTheTape.animalA.strength + body.taleOfTheTape.animalA.speed + body.taleOfTheTape.animalA.weapons + body.taleOfTheTape.animalA.defense) / 4 : 50) + newScore.A * 5) -
        ((body.taleOfTheTape?.animalB ? (body.taleOfTheTape.animalB.strength + body.taleOfTheTape.animalB.speed + body.taleOfTheTape.animalB.weapons + body.taleOfTheTape.animalB.defense) / 4 : 50) + newScore.B * 5)
      );
      const victoryType = scoreDiff > 20 ? 'dominant' : scoreDiff > 10 ? 'hard-fought' : 'narrow';
      const victoryDesc = victoryType === 'dominant' 
        ? `${winner} dominated this battle from start to finish!`
        : victoryType === 'hard-fought'
        ? `After an intense struggle, ${winner} emerges victorious!`
        : `In an incredibly close fight, ${winner} barely edges out the win!`;
      
      pages.push({
        id: 'victory',
        type: 'victory',
        title: '',
        content: `
          <div class="victory-overlay">
            <p class="victory-label">THE WINNER</p>
            <p class="victory-name">${winner.toUpperCase()}</p>
          </div>
          <div class="cyoa-results">
            <p class="results-title">🎯 BATTLE RESULTS</p>
            <p class="results-desc">${victoryDesc}</p>
            <p class="results-note">Your choices combined with each animal's natural abilities to determine the outcome!</p>
          </div>
        `,
        imageUrl: victoryImage,
        winner,
        finalScore: newScore,
      });
    }

    // Cache the outcome (includes nextIntro for coherent replays)
    await saveCachedOutcome(cyoaCacheKey, newPath, {
      path: newPath,
      animalA,
      animalB,
      createdAt: new Date().toISOString(),
      nextIntro, // Save bridge text so cached replays also flow
      pages,
    });

    // PROGRESSIVE REVEAL: Add next gate with dynamic bridge intro
    if (gateNumber < 3 && cachedGates && cachedGates.gates[gateNumber]) {
      const nextGate = await createNextGatePage(animalA, animalB, cachedGates.gates[gateNumber], gateNumber + 1, nextIntro);
      pages.push(nextGate);
    }

    // Return new pages and updated score
    return NextResponse.json({ 
      pages,
      score: newScore,
      newPath,
      isComplete: gateNumber === 3,
      _cacheStatus: 'MISS',
    });
  } catch (error) {
    console.error('Choice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate scene' }, { status: 500 });
  }
}
