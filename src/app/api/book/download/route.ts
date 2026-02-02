import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

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
    // Create unique output filename
    const timestamp = Date.now();
    const safeA = animalA.replace(/[^a-z0-9]/gi, '_');
    const safeB = animalB.replace(/[^a-z0-9]/gi, '_');
    const outputName = `${safeA}_vs_${safeB}_${timestamp}`;
    const outputDir = path.join(process.cwd(), 'public', 'books');
    const outputPath = path.join(outputDir, outputName);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Path to the Python generator (reuse existing backend)
    const generatorDir = path.resolve(process.cwd(), '..', 'fightingbooks-redesign');
    const venvPython = path.join(generatorDir, 'venv', 'bin', 'python3');

    // Run the generator
    const args = [
      'cli.py',
      animalA,
      animalB,
      '-e', environment,
      '-o', outputPath,
      '-f', format, // pdf or epub
    ];

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(venvPython, args, {
        cwd: generatorDir,
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      let stderr = '';
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Generator failed with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', reject);
    });

    // Check if file was created
    const filePath = `${outputPath}.${format}`;
    if (!fs.existsSync(filePath)) {
      throw new Error('Generated file not found');
    }

    // Read and send the file
    const fileBuffer = fs.readFileSync(filePath);
    const filename = `${animalA}_vs_${animalB}.${format}`;

    // Set appropriate content type
    const contentType = format === 'epub' 
      ? 'application/epub+zip'
      : 'application/pdf';

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
      error: 'Failed to generate book',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
