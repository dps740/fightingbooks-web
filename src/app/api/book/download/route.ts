import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { generatePDF } from '@/lib/pdfGenerator';
import { generateEPUB } from '@/lib/epubGenerator';

// Must match BOOK_CACHE_VERSION in book/start/route.ts
const BOOK_CACHE_VERSION = 'v7';

// Same cache key logic as book/start
function getCacheKey(animalA: string, animalB: string, environment: string): string {
  const sorted = [animalA.toLowerCase(), animalB.toLowerCase()].sort();
  return `${BOOK_CACHE_VERSION}_${sorted[0]}_vs_${sorted[1]}_${environment}`.replace(/[^a-z0-9_]/g, '_');
}

// Load cached book JSON
function loadCachedBook(cacheKey: string): { pages: any[], winner: string } | null {
  try {
    const cachePath = path.join('/tmp', 'cache', `${cacheKey}.json`);
    if (fs.existsSync(cachePath)) {
      return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load cached book:', e);
  }
  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const animalA = searchParams.get('a');
  const animalB = searchParams.get('b');
  const format = searchParams.get('format') || 'pdf';
  const environment = searchParams.get('env') || 'neutral';

  if (!animalA || !animalB) {
    return NextResponse.json({ error: 'Missing animal names' }, { status: 400 });
  }

  try {
    const cacheKey = getCacheKey(animalA, animalB, environment);
    const cacheDir = path.join('/tmp', 'cache');
    const fileExtension = format === 'epub' ? 'epub' : 'pdf';
    const cachedFilePath = path.join(cacheDir, `${cacheKey}.${fileExtension}`);
    const contentType = format === 'epub' ? 'application/epub+zip' : 'application/pdf';
    const filename = `${animalA}_vs_${animalB}.${fileExtension}`;
    
    // Check for cached file first
    if (fs.existsSync(cachedFilePath)) {
      const fileBuffer = fs.readFileSync(cachedFilePath);
      console.log(`Serving cached ${format.toUpperCase()}: ${cachedFilePath}`);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    }
    
    // File not cached - try to load from cache or fetch fresh
    let bookData = loadCachedBook(cacheKey);
    
    if (!bookData) {
      // Fetch book data by calling the start API internally
      console.log('Book not in cache, fetching fresh...');
      try {
        const baseUrl = process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}` 
          : 'http://localhost:3000';
        const bookResponse = await fetch(
          `${baseUrl}/api/book/start?a=${encodeURIComponent(animalA)}&b=${encodeURIComponent(animalB)}&env=${encodeURIComponent(environment)}&mode=standard`,
          { cache: 'no-store' }
        );
        if (bookResponse.ok) {
          bookData = await bookResponse.json();
        }
      } catch (fetchError) {
        console.error('Failed to fetch book:', fetchError);
      }
    }
    
    if (!bookData) {
      return NextResponse.json({ 
        error: 'Book generation failed',
        message: 'Could not generate the book. Please try again.',
      }, { status: 500 });
    }
    
    console.log(`Generating ${format.toUpperCase()} on-demand for: ${animalA} vs ${animalB}`);
    
    // Generate file based on format
    let fileBuffer: Buffer;
    
    if (format === 'epub') {
      fileBuffer = await generateEPUB({
        animalA,
        animalB,
        pages: bookData.pages,
        winner: bookData.winner,
      });
    } else {
      fileBuffer = await generatePDF({
        animalA,
        animalB,
        pages: bookData.pages,
        winner: bookData.winner,
      });
    }
    
    // Save to cache for next time
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(cachedFilePath, fileBuffer);
    console.log(`${format.toUpperCase()} cached: ${cachedFilePath}`);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ 
      error: `Failed to generate ${format.toUpperCase()}`,
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
