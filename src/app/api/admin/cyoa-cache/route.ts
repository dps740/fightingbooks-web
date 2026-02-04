import { NextRequest, NextResponse } from 'next/server';
import { list, del, put, head } from '@vercel/blob';

const ADMIN_SECRET = 'fightingbooks-admin-2026';
const CYOA_CACHE_VERSION = 'v1';

// Generate image using fal.ai Flux
async function generateImage(prompt: string, cacheKey: string): Promise<string> {
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) {
    throw new Error('No FAL_API_KEY configured');
  }

  const fullPrompt = `${prompt}, STYLE: wildlife documentary photography, National Geographic quality, photorealistic nature photography, dramatic natural lighting. ANATOMY: animals in NATURAL quadruped or species-appropriate poses only, correct number of limbs, realistic proportions. CRITICAL: Each animal must be its own DISTINCT species - DO NOT merge or blend animal features. FORBIDDEN: NO human features, NO human hands or arms, NO bipedal poses, NO celebration poses, NO anthropomorphism. ABSOLUTELY NO TEXT IN THE IMAGE.`;

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
  const tempImageUrl = result.images?.[0]?.url;
  if (!tempImageUrl) {
    throw new Error('No image URL returned');
  }

  // Upload to blob storage
  const imgResponse = await fetch(tempImageUrl);
  const imageBuffer = await imgResponse.arrayBuffer();
  const blob = await put(`fightingbooks/${cacheKey}.jpg`, imageBuffer, {
    access: 'public',
    contentType: 'image/jpeg',
  });

  return blob.url;
}

interface CyoaMatchup {
  key: string; // e.g., "lion-vs-tiger"
  animalA: string;
  animalB: string;
  hasGates: boolean;
  gatesUrl?: string;
  paths: {
    path: string; // e.g., "A-B-N"
    url: string;
    size: number;
    uploaded: string;
  }[];
  pathCount: number;
  totalPaths: 27;
}

// GET: List all CYOA cached data
export async function GET(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // List all CYOA blobs
    const { blobs } = await list({ prefix: 'fightingbooks/cyoa/' });
    
    // Group by matchup
    const matchups = new Map<string, CyoaMatchup>();
    
    for (const blob of blobs) {
      // Parse path: fightingbooks/cyoa/{matchup}/gates-v1.json or path-A-B-N-v1.json
      const parts = blob.pathname.replace('fightingbooks/cyoa/', '').split('/');
      if (parts.length !== 2) continue;
      
      const matchupKey = parts[0]; // e.g., "lion-vs-tiger"
      const filename = parts[1]; // e.g., "gates-v1.json" or "path-A-B-N-v1.json"
      
      // Initialize matchup if needed
      if (!matchups.has(matchupKey)) {
        const animals = matchupKey.split('-vs-');
        matchups.set(matchupKey, {
          key: matchupKey,
          animalA: animals[0]?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '',
          animalB: animals[1]?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '',
          hasGates: false,
          paths: [],
          pathCount: 0,
          totalPaths: 27,
        });
      }
      
      const matchup = matchups.get(matchupKey)!;
      
      // Check if it's gates or a path
      if (filename.startsWith(`gates-${CYOA_CACHE_VERSION}`)) {
        matchup.hasGates = true;
        matchup.gatesUrl = blob.url;
      } else if (filename.startsWith(`path-`) && filename.includes(`-${CYOA_CACHE_VERSION}`)) {
        // Extract path: "path-A-B-N-v1.json" -> "A-B-N"
        const pathMatch = filename.match(/^path-([A-BN-]+)-v\d+\.json$/);
        if (pathMatch) {
          matchup.paths.push({
            path: pathMatch[1],
            url: blob.url,
            size: blob.size,
            uploaded: blob.uploadedAt.toISOString(),
          });
          matchup.pathCount++;
        }
      }
    }
    
    // Sort paths within each matchup
    for (const matchup of matchups.values()) {
      matchup.paths.sort((a, b) => a.path.localeCompare(b.path));
    }
    
    // Convert to array and sort by matchup name
    const result = Array.from(matchups.values()).sort((a, b) => a.key.localeCompare(b.key));
    
    return NextResponse.json({
      matchups: result,
      totalMatchups: result.length,
      totalPaths: result.reduce((sum, m) => sum + m.pathCount, 0),
    });
  } catch (error) {
    console.error('CYOA cache list error:', error);
    return NextResponse.json({ error: 'Failed to list CYOA cache' }, { status: 500 });
  }
}

// DELETE: Delete CYOA cache for a matchup
// Options: { matchupKey, pathOnly?, gatesOnly?, specificPath? }
export async function DELETE(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { matchupKey, pathOnly, gatesOnly, specificPath } = await request.json();
    
    if (!matchupKey) {
      return NextResponse.json({ error: 'matchupKey required' }, { status: 400 });
    }
    
    // Delete a specific path only
    if (specificPath) {
      const blobPath = `fightingbooks/cyoa/${matchupKey}/path-${specificPath}-${CYOA_CACHE_VERSION}.json`;
      try {
        const blobInfo = await head(blobPath);
        await del(blobInfo.url);
        return NextResponse.json({
          success: true,
          deleted: 1,
          message: `Deleted path ${specificPath} for ${matchupKey}`,
        });
      } catch {
        return NextResponse.json({ error: `Path ${specificPath} not found` }, { status: 404 });
      }
    }
    
    // Delete gates only
    if (gatesOnly) {
      const blobPath = `fightingbooks/cyoa/${matchupKey}/gates-${CYOA_CACHE_VERSION}.json`;
      try {
        const blobInfo = await head(blobPath);
        await del(blobInfo.url);
        return NextResponse.json({
          success: true,
          deleted: 1,
          message: `Deleted gates for ${matchupKey}`,
        });
      } catch {
        return NextResponse.json({ error: 'Gates not found' }, { status: 404 });
      }
    }
    
    // List all blobs for this matchup
    const { blobs } = await list({ prefix: `fightingbooks/cyoa/${matchupKey}/` });
    
    let deleted = 0;
    for (const blob of blobs) {
      // If pathOnly, skip gates
      if (pathOnly && blob.pathname.includes('/gates-')) {
        continue;
      }
      await del(blob.url);
      deleted++;
    }
    
    return NextResponse.json({
      success: true,
      deleted,
      message: pathOnly 
        ? `Deleted ${deleted} path(s) for ${matchupKey}`
        : `Deleted all CYOA cache for ${matchupKey}`,
    });
  } catch (error) {
    console.error('CYOA cache delete error:', error);
    return NextResponse.json({ error: 'Failed to delete CYOA cache' }, { status: 500 });
  }
}

// PATCH: Regenerate a specific image in a path
// Body: { matchupKey, path, imageId } where imageId is "outcome-1", "outcome-2", "outcome-3", or "victory"
export async function PATCH(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { matchupKey, path: pathKey, imageId } = await request.json();
    
    if (!matchupKey || !pathKey || !imageId) {
      return NextResponse.json({ error: 'matchupKey, path, and imageId required' }, { status: 400 });
    }
    
    // Load the path JSON
    const blobPath = `fightingbooks/cyoa/${matchupKey}/path-${pathKey}-${CYOA_CACHE_VERSION}.json`;
    let pathData: any;
    let blobUrl: string;
    
    try {
      const blobInfo = await head(blobPath);
      blobUrl = blobInfo.url;
      const response = await fetch(blobUrl);
      pathData = await response.json();
    } catch {
      return NextResponse.json({ error: `Path ${pathKey} not found` }, { status: 404 });
    }
    
    // Find the page with this imageId
    const pageIndex = pathData.pages?.findIndex((p: any) => p.id === imageId);
    if (pageIndex === -1 || pageIndex === undefined) {
      return NextResponse.json({ error: `Image ${imageId} not found in path` }, { status: 404 });
    }
    
    const page = pathData.pages[pageIndex];
    const oldImageUrl = page.imageUrl;
    
    // Parse animal names from matchupKey
    const animals = matchupKey.split('-vs-');
    const animalA = animals[0]?.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '';
    const animalB = animals[1]?.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '';
    
    // Generate appropriate prompt based on image type
    let prompt: string;
    if (imageId === 'victory') {
      // Determine winner from page content (parse from HTML)
      const winnerMatch = page.content?.match(/victory-name[^>]*>([^<]+)/i);
      const winner = winnerMatch?.[1] || animalA;
      prompt = `${winner} standing victorious, proud and powerful, wildlife photography`;
    } else {
      // Outcome image - battle scene
      const outcomeText = page.content?.replace(/<[^>]+>/g, '') || '';
      prompt = `${animalA} and ${animalB} battling, dramatic action scene, ${outcomeText.slice(0, 100)}`;
    }
    
    // Generate new image
    const cacheKey = `${matchupKey}-${pathKey}-${imageId}-${Date.now()}`;
    const newImageUrl = await generateImage(prompt, cacheKey);
    
    // Update the path data
    pathData.pages[pageIndex].imageUrl = newImageUrl;
    
    // Save back to blob
    await put(blobPath, JSON.stringify(pathData), {
      access: 'public',
      contentType: 'application/json',
    });
    
    return NextResponse.json({
      success: true,
      message: `Regenerated ${imageId} image for path ${pathKey}`,
      oldImageUrl,
      newImageUrl,
    });
  } catch (error) {
    console.error('CYOA image regenerate error:', error);
    return NextResponse.json({ error: 'Failed to regenerate image' }, { status: 500 });
  }
}
