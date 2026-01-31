import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

export async function POST(request: NextRequest) {
  const { animalA, animalB, environment } = await request.json();

  if (!animalA || !animalB) {
    return new Response(JSON.stringify({ error: 'Missing animals' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Create a unique output filename
  const timestamp = Date.now();
  const outputName = `${animalA.replace(/\s+/g, '_')}_vs_${animalB.replace(/\s+/g, '_')}_${timestamp}`;
  const outputDir = path.join(process.cwd(), 'public', 'books');
  const outputPath = path.join(outputDir, outputName);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Path to the Python generator
  const generatorDir = path.resolve(process.cwd(), '..', 'fightingbooks-redesign');
  const venvPython = path.join(generatorDir, 'venv', 'bin', 'python3');

  // Create a readable stream for SSE
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendUpdate = (data: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
      };

      try {
        sendUpdate({ status: 'starting', progress: 5, message: '🚀 Starting battle generator...' });

        // Spawn the Python process
        const args = [
          'cli.py',
          animalA,
          animalB,
          '-e', environment === 'random' ? 'random' : environment,
          '-o', outputPath,
          '-f', 'pdf'
        ];

        const proc = spawn(venvPython, args, {
          cwd: generatorDir,
          env: { ...process.env, PYTHONUNBUFFERED: '1' }
        });

        let output = '';
        let winner = '';
        let lastProgress = 5;

        proc.stdout.on('data', (data) => {
          const text = data.toString();
          output += text;
          
          // Parse progress from output
          if (text.includes('Generating content')) {
            sendUpdate({ status: 'generating_content', progress: 20, message: '📝 Writing the epic story...' });
            lastProgress = 20;
          } else if (text.includes('editorial review') || text.includes('Generating images')) {
            sendUpdate({ status: 'generating_images', progress: 40, message: '🎨 Creating illustrations...' });
            lastProgress = 40;
          } else if (text.includes('images have issues') || text.includes('flagged')) {
            sendUpdate({ status: 'generating_images', progress: 70, message: '🎨 Finalizing artwork...' });
            lastProgress = 70;
          } else if (text.includes('Rendering PDF')) {
            sendUpdate({ status: 'rendering_pdf', progress: 85, message: '📖 Assembling your book...' });
            lastProgress = 85;
          } else if (text.includes('Winner:')) {
            const match = text.match(/Winner:\s*(.+)/);
            if (match) winner = match[1].trim();
          }
        });

        proc.stderr.on('data', (data) => {
          console.error('Generator stderr:', data.toString());
        });

        await new Promise<void>((resolve, reject) => {
          proc.on('close', (code) => {
            if (code === 0) {
              resolve();
            } else {
              reject(new Error(`Generator exited with code ${code}`));
            }
          });
          proc.on('error', reject);
        });

        // Check if PDF was created
        const pdfPath = `${outputPath}.pdf`;
        if (fs.existsSync(pdfPath)) {
          sendUpdate({ 
            status: 'complete', 
            progress: 100, 
            message: '✅ Your book is ready!',
            pdfUrl: `/books/${outputName}.pdf`,
            winner: winner || 'Unknown'
          });
        } else {
          throw new Error('PDF was not generated');
        }

      } catch (error) {
        console.error('Generation error:', error);
        sendUpdate({ 
          status: 'error', 
          progress: 0, 
          message: 'Generation failed. Please try again.',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
