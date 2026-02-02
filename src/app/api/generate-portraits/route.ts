import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DINOSAURS = [
  'Tyrannosaurus Rex',
  'Velociraptor', 
  'Triceratops',
  'Spinosaurus',
  'Stegosaurus',
  'Ankylosaurus',
  'Pteranodon',
  'Brachiosaurus'
];

async function generateAndSaveImage(name: string): Promise<{ name: string; success: boolean; url?: string; error?: string }> {
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) {
    return { name, success: false, error: 'No FAL_API_KEY' };
  }

  const filename = name.toLowerCase().replace(/ /g, '-');
  const prompt = `${name} dinosaur portrait, powerful pose, majestic prehistoric wildlife photography style, dramatic lighting, detailed painted wildlife illustration, ANATOMICALLY ACCURATE dinosaur anatomy, natural history museum quality art, educational wildlife book, detailed scales texture, ABSOLUTELY NO TEXT OR WORDS IN THE IMAGE`;

  try {
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_size: 'square_hd',
        num_inference_steps: 4,
      }),
    });

    if (!response.ok) {
      return { name, success: false, error: `Fal.ai error: ${response.status}` };
    }

    const result = await response.json();
    const imageUrl = result.images?.[0]?.url;
    
    if (!imageUrl) {
      return { name, success: false, error: 'No image URL returned' };
    }
    
    // Download image
    const imgResponse = await fetch(imageUrl);
    const buffer = Buffer.from(await imgResponse.arrayBuffer());
    
    // Save to public/fighters
    const fightersDir = path.join(process.cwd(), 'public', 'fighters');
    if (!fs.existsSync(fightersDir)) {
      fs.mkdirSync(fightersDir, { recursive: true });
    }
    
    const filepath = path.join(fightersDir, `${filename}.jpg`);
    fs.writeFileSync(filepath, buffer);
    
    return { name, success: true, url: `/fighters/${filename}.jpg` };
  } catch (error) {
    return { name, success: false, error: String(error) };
  }
}

export async function POST(request: NextRequest) {
  // Simple auth check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.ADMIN_SECRET || 'fightingbooks-admin'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: { name: string; success: boolean; url?: string; error?: string }[] = [];
  
  for (const dino of DINOSAURS) {
    console.log(`Generating: ${dino}...`);
    const result = await generateAndSaveImage(dino);
    results.push(result);
    
    // Rate limiting
    await new Promise(r => setTimeout(r, 1500));
  }
  
  const successful = results.filter(r => r.success).length;
  
  return NextResponse.json({
    message: `Generated ${successful}/${DINOSAURS.length} dinosaur portraits`,
    results,
  });
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint with Bearer token to generate dinosaur portraits',
    dinosaurs: DINOSAURS,
  });
}
