import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdfGenerator';
import { generateEPUB } from '@/lib/epubGenerator';

// POST endpoint - accepts book data directly
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { animalA, animalB, pages, winner, format = 'pdf' } = body;

    if (!animalA || !animalB || !pages || !winner) {
      return NextResponse.json({ 
        error: 'Missing required data',
        message: 'Please provide animalA, animalB, pages, and winner'
      }, { status: 400 });
    }

    console.log(`Generating ${format.toUpperCase()} for: ${animalA} vs ${animalB} (${pages.length} pages)`);

    const fileExtension = format === 'epub' ? 'epub' : 'pdf';
    const contentType = format === 'epub' ? 'application/epub+zip' : 'application/pdf';
    const filename = `${animalA}_vs_${animalB}.${fileExtension}`;

    let fileBuffer: Buffer;

    if (format === 'epub') {
      fileBuffer = await generateEPUB({
        animalA,
        animalB,
        pages,
        winner,
      });
    } else {
      fileBuffer = await generatePDF({
        animalA,
        animalB,
        pages,
        winner,
      });
    }

    console.log(`Generated ${format.toUpperCase()}: ${fileBuffer.length} bytes`);

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate file',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// GET endpoint - for backwards compatibility, redirects to regenerate
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
    // Fetch book data fresh
    const requestUrl = new URL(request.url);
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;
    
    console.log(`GET download: fetching book for ${animalA} vs ${animalB}...`);
    
    const bookResponse = await fetch(
      `${baseUrl}/api/book/start?a=${encodeURIComponent(animalA)}&b=${encodeURIComponent(animalB)}&env=${encodeURIComponent(environment)}&mode=standard`,
      { cache: 'no-store' }
    );

    if (!bookResponse.ok) {
      return NextResponse.json({ 
        error: 'Failed to generate book',
        message: 'Could not generate the book data. Please try again.',
      }, { status: 500 });
    }

    const bookData = await bookResponse.json();
    
    console.log(`Got book with ${bookData.pages?.length} pages, generating ${format.toUpperCase()}...`);

    const fileExtension = format === 'epub' ? 'epub' : 'pdf';
    const contentType = format === 'epub' ? 'application/epub+zip' : 'application/pdf';
    const filename = `${animalA}_vs_${animalB}.${fileExtension}`;

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

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download GET error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate file',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
