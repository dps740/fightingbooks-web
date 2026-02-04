import { NextRequest, NextResponse } from 'next/server';
import { del, list } from '@vercel/blob';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'fightingbooks-admin-2026';

function getCacheKey(animalA: string, animalB: string, environment: string = 'neutral'): string {
  const a = animalA.toLowerCase().replace(/\s+/g, '-');
  const b = animalB.toLowerCase().replace(/\s+/g, '-');
  const sorted = [a, b].sort();
  return `${sorted[0]}-vs-${sorted[1]}-${environment}`;
}

export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { animalA, animalB, environment = 'neutral', deleteImages = false } = await request.json();

    if (!animalA || !animalB) {
      return NextResponse.json({ error: 'Missing animalA or animalB' }, { status: 400 });
    }

    const cacheKey = getCacheKey(animalA, animalB, environment);
    const deleted: string[] = [];
    const errors: string[] = [];

    // Delete book JSON (stored in cache/)
    try {
      await del(`fightingbooks/cache/${cacheKey}.json`);
      deleted.push(`cache/${cacheKey}.json`);
    } catch (e) {
      errors.push(`cache/${cacheKey}.json: ${e instanceof Error ? e.message : 'not found'}`);
    }

    // Delete book PDF (stored in cache/)
    try {
      await del(`fightingbooks/cache/${cacheKey}.pdf`);
      deleted.push(`cache/${cacheKey}.pdf`);
    } catch (e) {
      errors.push(`cache/${cacheKey}.pdf: ${e instanceof Error ? e.message : 'not found'}`);
    }

    // Optionally delete all images for this matchup
    if (deleteImages) {
      const imgPrefix = `fightingbooks/${cacheKey.replace('-neutral', '').replace('-vs-', '-vs-')}`;
      try {
        const blobs = await list({ prefix: imgPrefix });
        for (const blob of blobs.blobs) {
          await del(blob.url);
          deleted.push(blob.pathname);
        }
      } catch (e) {
        errors.push(`images: ${e instanceof Error ? e.message : 'failed'}`);
      }
    }

    return NextResponse.json({
      message: `Deleted cache for ${animalA} vs ${animalB}`,
      cacheKey,
      deleted,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Delete book error:', error);
    return NextResponse.json({
      error: 'Failed to delete book',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

// GET - List cached books
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cacheList = await list({ prefix: 'fightingbooks/cache/' });
    
    // Separate JSON (books) and PDFs
    const books = cacheList.blobs.filter(b => b.pathname.endsWith('.json'));
    const pdfs = cacheList.blobs.filter(b => b.pathname.endsWith('.pdf'));

    return NextResponse.json({
      books: books.map(b => ({
        name: b.pathname.replace('fightingbooks/cache/', '').replace('.json', ''),
        size: b.size,
        uploaded: b.uploadedAt,
      })),
      pdfs: pdfs.map(b => ({
        name: b.pathname.replace('fightingbooks/cache/', '').replace('.pdf', ''),
        size: b.size,
        uploaded: b.uploadedAt,
      })),
      counts: {
        books: books.length,
        pdfs: pdfs.length,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to list cache',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
