import { NextRequest, NextResponse } from 'next/server';
import { put, head, BlobNotFoundError } from '@vercel/blob';

// CYOA Cache Version - must match start/route.ts
const CYOA_CACHE_VERSION = 'v1';

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
async function createNextGatePage(animalA: string, animalB: string, gate: any, gateNumber: number): Promise<any> {
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
  
  return {
    id: `decision-${gateNumber}`,
    type: 'choice',
    title: gate.title,
    content: `<p class="decision-intro">${gate.intro}</p>`,
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

export async function POST(request: NextRequest) {
  try {
    const body: ChoiceRequest = await request.json();
    const { animalA, animalB, choiceFavors, choiceOutcome, currentScore, gateNumber, allPages, currentPath = '' } = body;

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
      let pages = cachedOutcome.pages;
      if (gateNumber < 3 && cachedGates.gates[gateNumber]) {
        const nextGate = await createNextGatePage(animalA, animalB, cachedGates.gates[gateNumber], gateNumber + 1);
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

    // Generate new outcome
    console.log(`[CYOA-OUTCOME] Generating new outcome for path ${newPath}`);
    const pages = [];
    
    // Load gates if not already loaded (needed for progressive reveal)
    if (!cachedGates) {
      cachedGates = await loadCachedGates(cyoaCacheKey);
    }

    // Add outcome page
    const nameA = animalA.toLowerCase().replace(/\s+/g, '-');
    const nameB = animalB.toLowerCase().replace(/\s+/g, '-');
    const imgPrefix = `${nameA}-vs-${nameB}`;
    const outcomeImage = await generateImage(
      `${animalA} and ${animalB} battling, dramatic action scene, ${choiceOutcome}`,
      `${imgPrefix}-outcome-${newPath}`
    );
    
    pages.push({
      id: `outcome-${gateNumber}`,
      type: 'battle',
      title: '',
      content: `<p class="outcome-text">${choiceOutcome}</p>`,
      imageUrl: outcomeImage,
    });

    // If this was the 3rd decision, determine winner using Tale of the Tape + choices
    if (gateNumber === 3) {
      // Calculate base strength from Tale of the Tape (if available)
      let baseScoreA = 50; // Default baseline
      let baseScoreB = 50;
      
      if (body.taleOfTheTape) {
        const statsA = body.taleOfTheTape.animalA;
        const statsB = body.taleOfTheTape.animalB;
        // Average of stats gives base "power level" (0-100 scale)
        baseScoreA = (statsA.strength + statsA.speed + statsA.weapons + statsA.defense) / 4;
        baseScoreB = (statsB.strength + statsB.speed + statsB.weapons + statsB.defense) / 4;
      }
      
      // User choices can swing the battle (each point = 5% swing)
      // Max user score is 6 (1+2+3), so max swing is 30%
      const choiceSwingA = newScore.A * 5;
      const choiceSwingB = newScore.B * 5;
      
      // Final battle score
      const finalScoreA = baseScoreA + choiceSwingA;
      const finalScoreB = baseScoreB + choiceSwingB;
      
      console.log(`Final battle scores - ${animalA}: ${finalScoreA} (base ${baseScoreA} + choices ${choiceSwingA}) vs ${animalB}: ${finalScoreB} (base ${baseScoreB} + choices ${choiceSwingB})`);
      
      // Determine winner
      const winner = finalScoreA > finalScoreB ? animalA : finalScoreB > finalScoreA ? animalB : (Math.random() > 0.5 ? animalA : animalB);
      const loser = winner === animalA ? animalB : animalA;
      
      // Generate victory image
      const victoryImage = await generateImage(
        `${winner} proud and defiant`,
        `${imgPrefix}-victory-${newPath}`
      );
      
      // Determine how decisive the victory was
      const scoreDiff = Math.abs(finalScoreA - finalScoreB);
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

    // Cache the outcome (just the outcome pages, not the next gate)
    await saveCachedOutcome(cyoaCacheKey, newPath, {
      path: newPath,
      animalA,
      animalB,
      createdAt: new Date().toISOString(),
      pages,
    });

    // PROGRESSIVE REVEAL: Add next gate if not at final gate
    if (gateNumber < 3 && cachedGates && cachedGates.gates[gateNumber]) {
      const nextGate = await createNextGatePage(animalA, animalB, cachedGates.gates[gateNumber], gateNumber + 1);
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
