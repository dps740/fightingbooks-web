import { NextRequest, NextResponse } from 'next/server';
import { put, head, BlobNotFoundError } from '@vercel/blob';

// Simple admin key check (you can make this more secure)
const ADMIN_KEY = process.env.ADMIN_KEY || 'fightingbooks-admin-2024';

// Animal-specific features for accurate depictions
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

// Image prompts for each page type
const IMAGE_PROMPTS: Record<string, (animalA: string, animalB: string) => string> = {
  'cover': (a, b) => `${a} facing ${b} dramatically, epic showdown, wildlife art`,
  'battle1': (a, b) => `${a} and ${b} facing off, tense confrontation, sizing each other up, dramatic standoff`,
  'battle2': (a, b) => `${a} attacking ${b}, first strike, action shot, motion blur, intense combat`,
  'battle3': (a, b) => `${b} counter-attacking ${a}, fierce battle, both animals fighting, dramatic action`,
  'battle4': (a, b) => `${a} and ${b} locked in combat, intense struggle, close quarters battle, dynamic pose`,
  'battle5': (a, b) => `${a} and ${b} final decisive moment, climactic battle scene, one gaining advantage`,
  'victory': (a, b) => `victorious animal powerful stance after battle, realistic animal behavior, dramatic lighting, wildlife photography`,
};

// Page ID to image key mapping
const PAGE_TO_IMAGE_KEY: Record<string, string> = {
  'cover': 'cover',
  'battle-1': 'battle1',
  'battle-2': 'battle2',
  'battle-3': 'battle3',
  'battle-4': 'battle4',
  'battle-5': 'battle5',
  'victory': 'victory',
};

const BOOK_CACHE_VERSION = 'v7';

function getCacheKey(animalA: string, animalB: string, environment: string): string {
  const sorted = [animalA.toLowerCase(), animalB.toLowerCase()].sort();
  return `${BOOK_CACHE_VERSION}_${sorted[0]}_vs_${sorted[1]}_${environment}`.replace(/[^a-z0-9_]/g, '_');
}

function getAnimalFeatures(animalName: string): { include: string, avoid: string } {
  const key = animalName.toLowerCase();
  return ANIMAL_FEATURES[key] || { include: '', avoid: '' };
}

async function generateImage(prompt: string, cacheKey: string): Promise<string> {
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) {
    return `https://placehold.co/512x512/1a1a1a/d4af37?text=No+API+Key`;
  }

  // Extract animal names and add features
  let animalFeatures = '';
  for (const animal of Object.keys(ANIMAL_FEATURES)) {
    if (prompt.toLowerCase().includes(animal)) {
      const features = ANIMAL_FEATURES[animal];
      animalFeatures += ` [${animal.toUpperCase()}: ${features.include}. ${features.avoid}]`;
    }
  }

  const fullPrompt = `${prompt},${animalFeatures} detailed painted wildlife illustration, natural history museum quality art, educational wildlife book style, dramatic lighting, detailed fur/scales/feathers texture, ANATOMICALLY CORRECT: each animal has exactly ONE head and ONE body, correct number of limbs for species, species-accurate distinctive markings, realistic proportions, NEVER merge animals together, each animal is SEPARATE and DISTINCT, NO human weapons (no swords no guns no armor), NO anthropomorphism, NO human clothing on animals, NO fantasy elements, NO extra limbs or heads, NO conjoined animals, NO mutant features, ABSOLUTELY NO TEXT OR WORDS IN THE IMAGE`;

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
      throw new Error(`Fal.ai error: ${await response.text()}`);
    }

    const result = await response.json();
    const imageUrl = result.images?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error('No image URL returned');
    }
    
    // Upload to Vercel Blob
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    const blob = await put(`fightingbooks/${cacheKey}.jpg`, imageBuffer, {
      access: 'public',
      contentType,
    });
    
    return blob.url;
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
}

async function loadCachedBook(cacheKey: string): Promise<any | null> {
  const blobPath = `fightingbooks/cache/${cacheKey}.json`;
  
  try {
    const blobInfo = await head(blobPath);
    const response = await fetch(blobInfo.url);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    if (!(error instanceof BlobNotFoundError)) {
      console.error('Cache load error:', error);
    }
  }
  return null;
}

async function saveCachedBook(cacheKey: string, data: any): Promise<void> {
  try {
    const jsonData = JSON.stringify(data);
    await put(`fightingbooks/cache/${cacheKey}.json`, jsonData, {
      access: 'public',
      contentType: 'application/json',
    });
  } catch (error) {
    console.error('Cache save error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { animalA, animalB, pageId, adminKey, environment = 'neutral' } = body;

    console.log(`[ADMIN] Regenerate request: ${animalA} vs ${animalB}, page: ${pageId}`);

    // Simple auth check
    if (adminKey !== ADMIN_KEY) {
      console.log(`[ADMIN] Auth failed`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!animalA || !animalB || !pageId) {
      return NextResponse.json({ error: 'Missing animalA, animalB, or pageId' }, { status: 400 });
    }

    const imageKey = PAGE_TO_IMAGE_KEY[pageId];
    if (!imageKey) {
      return NextResponse.json({ 
        error: `Invalid pageId. Valid options: ${Object.keys(PAGE_TO_IMAGE_KEY).join(', ')}` 
      }, { status: 400 });
    }

    // Load existing cached book
    const cacheKey = getCacheKey(animalA, animalB, environment);
    console.log(`[ADMIN] Looking for cached book: ${cacheKey}`);
    const cachedBook = await loadCachedBook(cacheKey);
    
    if (!cachedBook) {
      console.log(`[ADMIN] Book not found in cache`);
    } else {
      console.log(`[ADMIN] Found cached book with ${cachedBook.pages?.length} pages`);
    }
    
    if (!cachedBook) {
      return NextResponse.json({ 
        error: 'Book not found in cache. Generate it first by viewing it normally.' 
      }, { status: 404 });
    }

    // Generate new image
    const promptFn = IMAGE_PROMPTS[imageKey];
    const prompt = promptFn(animalA, animalB);
    
    // Sort for consistent cache key
    const sortedNames = [animalA.toLowerCase().replace(/\s+/g, '-'), animalB.toLowerCase().replace(/\s+/g, '-')].sort();
    const imgPrefix = `${sortedNames[0]}-vs-${sortedNames[1]}`;
    const imageCacheKey = `${imgPrefix}-${imageKey}-${Date.now()}`; // Add timestamp to bust image cache
    
    console.log(`[ADMIN] Regenerating ${pageId} for ${animalA} vs ${animalB}`);
    const newImageUrl = await generateImage(prompt, imageCacheKey);
    
    // Find and update the page
    const pageIndex = cachedBook.pages.findIndex((p: any) => p.id === pageId);
    if (pageIndex === -1) {
      return NextResponse.json({ error: `Page ${pageId} not found in book` }, { status: 404 });
    }
    
    const oldImageUrl = cachedBook.pages[pageIndex].imageUrl;
    cachedBook.pages[pageIndex].imageUrl = newImageUrl;
    
    // Save updated book
    await saveCachedBook(cacheKey, cachedBook);
    
    return NextResponse.json({
      success: true,
      pageId,
      oldImageUrl,
      newImageUrl,
      message: `Regenerated ${pageId} image for ${animalA} vs ${animalB}`,
    });
  } catch (error) {
    console.error('Admin regenerate error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to regenerate image: ${errorMessage}` }, { status: 500 });
  }
}
