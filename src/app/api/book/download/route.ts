import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { generatePDF } from '@/lib/pdfGenerator';

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
    const cachePath = path.join(process.cwd(), 'public', 'cache', `${cacheKey}.json`);
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
    const cacheDir = path.join(process.cwd(), 'public', 'cache');
    const cachedPDFPath = path.join(cacheDir, `${cacheKey}.pdf`);
    
    // Check for cached PDF first
    if (fs.existsSync(cachedPDFPath)) {
      const fileBuffer = fs.readFileSync(cachedPDFPath);
      const filename = `${animalA}_vs_${animalB}.pdf`;
      
      console.log(`Serving cached PDF: ${cachedPDFPath}`);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    }
    
    // PDF not cached - try to generate from book JSON
    const bookData = loadCachedBook(cacheKey);
    
    if (!bookData) {
      return NextResponse.json({ 
        error: 'Book not found',
        message: 'Please generate the book first by viewing it, then try downloading again.',
      }, { status: 404 });
    }
    
    console.log(`Generating PDF on-demand for: ${animalA} vs ${animalB}`);
    
    // Generate PDF
    const pdfBuffer = await generatePDF({
      animalA,
      animalB,
      pages: bookData.pages,
      winner: bookData.winner,
    });
    
    // Save to cache for next time
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(cachedPDFPath, pdfBuffer);
    console.log(`PDF cached: ${cachedPDFPath}`);
    
    const filename = `${animalA}_vs_${animalB}.pdf`;
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate PDF',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
