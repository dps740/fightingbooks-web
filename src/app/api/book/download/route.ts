import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// Same cache key logic as book/start
function getCacheKey(animalA: string, animalB: string, environment: string): string {
  const sorted = [animalA.toLowerCase(), animalB.toLowerCase()].sort();
  return `${sorted[0]}_vs_${sorted[1]}_${environment}`.replace(/[^a-z0-9_]/g, '_');
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
    // Check for cached PDF first
    const cacheKey = getCacheKey(animalA, animalB, environment);
    const cachedPDFPath = path.join(process.cwd(), 'public', 'cache', `${cacheKey}.pdf`);
    
    if (fs.existsSync(cachedPDFPath)) {
      // Serve cached PDF
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
    
    // PDF not cached - return error (frontend should generate book first)
    return NextResponse.json({ 
      error: 'PDF not available',
      message: 'Please generate the book first before downloading',
    }, { status: 404 });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ 
      error: 'Failed to download book',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
