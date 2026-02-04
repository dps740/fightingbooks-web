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

    // Delete book JSON
    try {
      await del(`fightingbooks/books/${cacheKey}.json`);
      deleted.push(`books/${cacheKey}.json`);
    } catch (e) {
      errors.push(`books/${cacheKey}.json: ${e instanceof Error ? e.message : 'not found'}`);
    }

    // Delete book PDF
    try {
      await del(`fightingbooks/pdfs/${cacheKey}.pdf`);
      deleted.push(`pdfs/${cacheKey}.pdf`);
    } catch (e) {
      errors.push(`pdfs/${cacheKey}.pdf: ${e instanceof Error ? e.message : 'not found'}`);
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
    const books = await list({ prefix: 'fightingbooks/books/' });
    const pdfs = await list({ prefix: 'fightingbooks/pdfs/' });

    return NextResponse.json({
      books: books.blobs.map(b => ({
        name: b.pathname.replace('fightingbooks/books/', '').replace('.json', ''),
        size: b.size,
        uploaded: b.uploadedAt,
      })),
      pdfs: pdfs.blobs.map(b => ({
        name: b.pathname.replace('fightingbooks/pdfs/', '').replace('.pdf', ''),
        size: b.size,
        uploaded: b.uploadedAt,
      })),
      counts: {
        books: books.blobs.length,
        pdfs: pdfs.blobs.length,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to list cache',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
