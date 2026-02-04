import { NextRequest, NextResponse } from 'next/server';
import { list, del } from '@vercel/blob';

const ADMIN_SECRET = 'fightingbooks-admin-2026';
const CYOA_CACHE_VERSION = 'v1';

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
export async function DELETE(request: NextRequest) {
  const auth = request.headers.get('Authorization');
  if (auth !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { matchupKey, pathOnly } = await request.json();
    
    if (!matchupKey) {
      return NextResponse.json({ error: 'matchupKey required' }, { status: 400 });
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
