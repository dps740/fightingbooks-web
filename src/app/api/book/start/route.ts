import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

interface BookPage {
  id: string;
  type: string;
  title: string;
  content: string;
  imageUrl?: string;
  choices?: { id: string; text: string; emoji: string }[];
}

// Generate initial pages using Python backend
async function generateWithPython(animalA: string, animalB: string, environment: string): Promise<{ pages: BookPage[], winner: string }> {
  return new Promise((resolve, reject) => {
    const generatorDir = path.resolve(process.cwd(), '..', 'fightingbooks-redesign');
    const venvPython = path.join(generatorDir, 'venv', 'bin', 'python3');
    const outputDir = path.join(process.cwd(), 'public', 'books');
    const timestamp = Date.now();
    const outputName = `${animalA.replace(/\s+/g, '_')}_vs_${animalB.replace(/\s+/g, '_')}_${timestamp}`;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const args = [
      'cli.py',
      animalA,
      animalB,
      '-e', environment === 'random' ? 'random' : environment,
      '-o', path.join(outputDir, outputName),
      '-f', 'html', // Generate HTML for on-screen viewing
      '--json-output', // Output page data as JSON
    ];

    const proc = spawn(venvPython, args, {
      cwd: generatorDir,
      env: { ...process.env, PYTHONUNBUFFERED: '1' }
    });

    let output = '';
    let errorOutput = '';
    let winner = animalA; // Default

    proc.stdout.on('data', (data) => {
      output += data.toString();
      const winnerMatch = data.toString().match(/Winner:\s*(.+)/);
      if (winnerMatch) winner = winnerMatch[1].trim();
    });

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('Python generator failed:', errorOutput);
        // Return mock data on failure
        resolve(generateMockPages(animalA, animalB, winner));
        return;
      }

      // Try to parse JSON output
      try {
        const jsonMatch = output.match(/JSON_OUTPUT_START(.+)JSON_OUTPUT_END/s);
        if (jsonMatch) {
          const pageData = JSON.parse(jsonMatch[1]);
          resolve({ pages: pageData.pages, winner: pageData.winner || winner });
        } else {
          // Fallback to mock with real winner
          resolve(generateMockPages(animalA, animalB, winner));
        }
      } catch (e) {
        resolve(generateMockPages(animalA, animalB, winner));
      }
    });

    proc.on('error', (err) => {
      console.error('Failed to spawn Python:', err);
      resolve(generateMockPages(animalA, animalB, winner));
    });
  });
}

// Fallback mock pages
function generateMockPages(animalA: string, animalB: string, winner: string): { pages: BookPage[], winner: string } {
  const pages: BookPage[] = [
    {
      id: 'cover',
      type: 'cover',
      title: `${animalA} vs ${animalB}`,
      content: `<p class="text-center text-xl">An epic battle is about to begin!</p>`,
      imageUrl: '/api/placeholder/800/600',
    },
    {
      id: 'intro-a',
      type: 'intro',
      title: `Meet the ${animalA}!`,
      content: `
        <p>The <strong>${animalA}</strong> is one of nature's most formidable creatures.</p>
        <ul>
          <li><strong>Habitat:</strong> Various regions worldwide</li>
          <li><strong>Diet:</strong> Carnivore</li>
          <li><strong>Special Ability:</strong> Incredible strength and speed</li>
        </ul>
        <p class="mt-4 italic">This mighty predator has evolved over millions of years to become the ultimate hunter!</p>
      `,
      imageUrl: '/api/placeholder/800/600',
    },
    {
      id: 'intro-b',
      type: 'intro', 
      title: `Meet the ${animalB}!`,
      content: `
        <p>The <strong>${animalB}</strong> is a fearsome predator known across the world.</p>
        <ul>
          <li><strong>Habitat:</strong> Diverse environments</li>
          <li><strong>Diet:</strong> Carnivore</li>
          <li><strong>Special Ability:</strong> Deadly precision and power</li>
        </ul>
        <p class="mt-4 italic">Nature has crafted this beast into a perfect fighting machine!</p>
      `,
      imageUrl: '/api/placeholder/800/600',
    },
    {
      id: 'stats',
      type: 'stats',
      title: '📊 Tale of the Tape',
      content: `
        <table class="w-full text-center">
          <tr class="border-b border-white/20">
            <td class="py-2 text-red-400 font-bold">${animalA}</td>
            <td class="py-2 text-white/50">STAT</td>
            <td class="py-2 text-blue-400 font-bold">${animalB}</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2">★★★★☆</td>
            <td class="py-2 text-white/50">⚖️ Size</td>
            <td class="py-2">★★★★★</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2">★★★★★</td>
            <td class="py-2 text-white/50">⚡ Speed</td>
            <td class="py-2">★★★☆☆</td>
          </tr>
          <tr class="border-b border-white/10">
            <td class="py-2">★★★★☆</td>
            <td class="py-2 text-white/50">💪 Power</td>
            <td class="py-2">★★★★★</td>
          </tr>
          <tr>
            <td class="py-2">★★★★★</td>
            <td class="py-2 text-white/50">🛡️ Defense</td>
            <td class="py-2">★★★★☆</td>
          </tr>
        </table>
      `,
      imageUrl: '/api/placeholder/800/600',
    },
    {
      id: 'battle-1',
      type: 'battle',
      title: '⚡ The Battle Begins!',
      content: `
        <p>The two mighty creatures face each other across the arena. Tension fills the air as both predators size each other up.</p>
        <p class="my-4">The ${animalA} lets out a powerful roar that echoes across the battlefield! The ${animalB} stands its ground, muscles tensed, ready for combat.</p>
        <p>In a flash of movement, both predators spring into action! The ground shakes with the force of their clash!</p>
      `,
      imageUrl: '/api/placeholder/800/600',
    },
    {
      id: 'battle-2',
      type: 'battle',
      title: '💥 The Clash Intensifies!',
      content: `
        <p>Claws slash through the air! Teeth flash in the sunlight! Neither warrior is willing to back down.</p>
        <p class="my-4">The ${animalA} lands a powerful blow, but the ${animalB} counters with incredible ferocity!</p>
        <p>Back and forth they battle, each looking for the decisive advantage...</p>
      `,
      imageUrl: '/api/placeholder/800/600',
    },
    {
      id: 'battle-3',
      type: 'battle',
      title: '🔥 The Final Showdown!',
      content: `
        <p>Both fighters are giving everything they have! The battle reaches its crescendo!</p>
        <p class="my-4">With one final, mighty effort, ${winner} seizes the moment and delivers the decisive blow!</p>
        <p>The outcome is decided!</p>
      `,
      imageUrl: '/api/placeholder/800/600',
    },
    {
      id: 'victory',
      type: 'victory',
      title: '🏆 The Winner!',
      content: `
        <p class="text-3xl font-bold text-center mb-4">${winner.toUpperCase()} WINS!</p>
        <p>After an incredible battle, the <strong>${winner}</strong> emerges victorious!</p>
        <p class="my-4">It was a close fight, but in the end, ${winner}'s combination of strength, speed, and skill proved to be the deciding factor.</p>
        <p class="text-white/70">But remember - in nature, the outcome depends on many factors like environment, health, and luck. In a different situation, the result might be different!</p>
        <p class="mt-4 text-center text-yellow-300">Every animal is amazing in its own way! 🌟</p>
      `,
      imageUrl: '/api/placeholder/800/600',
    },
  ];

  return { pages, winner };
}

// Add CYOA choices to pages
function addCyoaChoices(pages: BookPage[], animalA: string, animalB: string): BookPage[] {
  // Find the first battle page and convert it to a choice
  const battleIndex = pages.findIndex(p => p.type === 'battle');
  if (battleIndex === -1) return pages;

  const modifiedPages = [...pages];
  
  // Keep only pages up to first battle, then add choice
  const introPages = modifiedPages.slice(0, battleIndex + 1);
  
  // Modify the battle page to be a choice page
  introPages[introPages.length - 1] = {
    ...introPages[introPages.length - 1],
    type: 'choice',
    title: '🤔 What Happens Next?',
    content: `<p>The battle has begun! Both fighters circle each other warily...</p><p class="mt-4">The ${animalA} prepares to make a move. What happens next?</p>`,
    choices: [
      { id: 'attack', text: `${animalA} charges with full force!`, emoji: '💥' },
      { id: 'defend', text: `${animalA} waits for the perfect moment`, emoji: '👁️' },
      { id: 'flank', text: `${animalA} circles around for advantage`, emoji: '🔄' },
    ],
  };

  return introPages;
}

export async function POST(request: NextRequest) {
  try {
    const { animalA, animalB, mode = 'standard', environment = 'random' } = await request.json();

    // Try real generation, fall back to mock
    let result = await generateWithPython(animalA, animalB, environment);
    
    // If CYOA mode, modify pages to include choices
    if (mode === 'cyoa') {
      result.pages = addCyoaChoices(result.pages, animalA, animalB);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Book start error:', error);
    return NextResponse.json({ error: 'Failed to start book' }, { status: 500 });
  }
}
