/**
 * Generate secrets images for all animals
 * Run with: FAL_API_KEY=xxx node scripts/generate-secrets-images.js
 */

const fs = require('fs');
const path = require('path');

const FAL_API_KEY = process.env.FAL_API_KEY;
if (!FAL_API_KEY) {
  console.error('FAL_API_KEY environment variable required');
  process.exit(1);
}

const ANIMALS = [
  'alligator', 'anaconda', 'ankylosaurus', 'basilisk', 'black-panther',
  'brachiosaurus', 'cape-buffalo', 'cassowary', 'cerberus', 'cheetah',
  'chimera', 'crocodile', 'dragon', 'eagle', 'elephant', 'gorilla',
  'great-white-shark', 'griffin', 'grizzly-bear', 'hippo', 'honey-badger',
  'hydra', 'hyena', 'jaguar', 'king-cobra', 'komodo-dragon', 'kraken',
  'leopard', 'lion', 'manticore', 'moose', 'octopus', 'orca', 'phoenix',
  'polar-bear', 'pteranodon', 'python', 'rhino', 'spinosaurus', 'stegosaurus',
  'tiger', 'triceratops', 'tyrannosaurus-rex', 'velociraptor', 'walrus',
  'wolf', 'wolverine'
];

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'fighters');

async function generateImage(animal) {
  const displayName = animal.replace(/-/g, ' ');
  const prompt = `${displayName} mysterious close-up portrait, intense eyes, showing unique features and details, dramatic lighting, wildlife photography, educational illustration, natural history museum quality, detailed texture, ANATOMICALLY CORRECT: exactly ONE head and ONE body, correct number of limbs for the species, no extra heads, ABSOLUTELY NO TEXT OR WORDS IN THE IMAGE`;

  console.log(`Generating: ${animal}...`);

  const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${FAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      image_size: 'square_hd',
      num_inference_steps: 4,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Fal.ai error for ${animal}: ${error}`);
  }

  const result = await response.json();
  const imageUrl = result.images?.[0]?.url;

  if (!imageUrl) {
    throw new Error(`No image URL for ${animal}`);
  }

  // Download and save
  const imageResponse = await fetch(imageUrl);
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  const outputPath = path.join(OUTPUT_DIR, `${animal}-secrets.jpg`);
  fs.writeFileSync(outputPath, buffer);
  console.log(`  Saved: ${outputPath}`);

  // Small delay to avoid rate limiting
  await new Promise(r => setTimeout(r, 500));
}

async function main() {
  console.log(`Generating secrets images for ${ANIMALS.length} animals...`);
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  let success = 0;
  let failed = [];

  for (const animal of ANIMALS) {
    const outputPath = path.join(OUTPUT_DIR, `${animal}-secrets.jpg`);
    
    // Skip if already exists
    if (fs.existsSync(outputPath)) {
      console.log(`Skipping ${animal} (already exists)`);
      success++;
      continue;
    }

    try {
      await generateImage(animal);
      success++;
    } catch (error) {
      console.error(`  FAILED: ${error.message}`);
      failed.push(animal);
    }
  }

  console.log(`\nDone! ${success}/${ANIMALS.length} succeeded`);
  if (failed.length > 0) {
    console.log(`Failed: ${failed.join(', ')}`);
  }
}

main().catch(console.error);
