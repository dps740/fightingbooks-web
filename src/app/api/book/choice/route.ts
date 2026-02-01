import { NextRequest, NextResponse } from 'next/server';

interface ChoiceRequest {
  animalA: string;
  animalB: string;
  choiceId: string;
  choiceText: string;
  previousChoices: string[];
}

// Generate image using fal.ai Flux
async function generateImage(prompt: string): Promise<string> {
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) {
    console.log('No FAL_API_KEY, using placeholder');
    return `https://placehold.co/512x512/1a1a1a/d4af37?text=${encodeURIComponent(prompt.slice(0, 20))}`;
  }

  const fullPrompt = `${prompt}, detailed painted wildlife illustration, ANATOMICALLY ACCURATE animal anatomy, correct number of limbs, realistic proportions, no human features on animals, natural history museum quality art, educational wildlife book, detailed fur/scales/feathers texture, dramatic lighting, ABSOLUTELY NO TEXT OR WORDS IN THE IMAGE`;

  try {
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_size: 'square_hd',
        num_inference_steps: 4,
      }),
    });

    if (!response.ok) {
      console.error('Fal.ai error:', await response.text());
      return `https://placehold.co/512x512/1a1a1a/d4af37?text=${encodeURIComponent(prompt.slice(0, 20))}`;
    }

    const result = await response.json();
    return result.images?.[0]?.url || `https://placehold.co/512x512/1a1a1a/d4af37?text=Image`;
  } catch (error) {
    console.error('Image generation error:', error);
    return `https://placehold.co/512x512/1a1a1a/d4af37?text=${encodeURIComponent(prompt.slice(0, 20))}`;
  }
}

// Generate next scene based on choice
const generateNextScene = async (req: ChoiceRequest, choiceNumber: number) => {
  const { animalA, animalB, choiceId, choiceText } = req;
  
  const pages = [];
  
  let sceneTitle, sceneContent, imagePrompt;
  
  // Generate battle scene based on choice with variety
  if (choiceId === 'attack') {
    sceneTitle = '💥 Aggressive Attack!';
    sceneContent = `
      <p>The ${animalA} charges forward with incredible speed!</p>
      <p>You chose: ${choiceText}</p>
      <p>The ${animalB} barely has time to react as the ${animalA} closes the distance with a fierce assault!</p>
      <p>Dust and debris fly as the two titans clash!</p>
    `;
    imagePrompt = `${animalA} aggressively attacking ${animalB}, dynamic action scene, intense battle`;
  } else if (choiceId === 'defend') {
    sceneTitle = '👁️ Patient Strategy';
    sceneContent = `
      <p>The ${animalA} holds back, watching every move with calculated precision...</p>
      <p>You chose: ${choiceText}</p>
      <p>The ${animalB} grows impatient and makes a hasty move!</p>
      <p>The ${animalA} seizes the opportunity to counter!</p>
    `;
    imagePrompt = `${animalA} defensively positioned against ${animalB}, tense standoff, strategic battle`;
  } else {
    sceneTitle = '🔄 Tactical Positioning';
    sceneContent = `
      <p>The ${animalA} moves with purpose, seeking the perfect angle...</p>
      <p>You chose: ${choiceText}</p>
      <p>The ${animalB} tries to track the movement but loses sight momentarily!</p>
      <p>This could be the opening the ${animalA} needs!</p>
    `;
    imagePrompt = `${animalA} circling around ${animalB}, tactical movement, battle scene from side angle`;
  }
  
  // Generate battle scene image
  const battleImage = await generateImage(imagePrompt);
  
  pages.push({
    id: `battle-${choiceNumber}`,
    type: 'battle',
    title: sceneTitle,
    content: sceneContent,
    imageUrl: battleImage,
  });

  // After 3 choices, end the battle
  if (req.previousChoices.length >= 2) {
    // Determine winner based on choices made
    const aggressiveChoices = [...req.previousChoices, choiceId].filter(c => c === 'attack').length;
    const winner = aggressiveChoices >= 2 ? animalA : animalB;
    
    // Generate victory image
    const victoryImage = await generateImage(`${winner} victorious, triumphant pose, winner of the battle`);
    
    pages.push({
      id: 'victory',
      type: 'victory',
      title: '🏆 The Winner!',
      content: `
        <p class="text-3xl font-bold text-yellow-400 text-center mb-4">${winner.toUpperCase()} WINS!</p>
        <p>After an incredible battle shaped by YOUR choices, the ${winner} emerges victorious!</p>
        <p class="mt-4">Your adventure had ${req.previousChoices.length + 1} key decisions that led to this outcome.</p>
        <p class="mt-4 text-gray-400">Want a different ending? Try making different choices next time! 🌟</p>
      `,
      imageUrl: victoryImage,
    });
  } else {
    // Add another choice with varied questions
    const nextChoiceNum = req.previousChoices.length + 2;
    const questionVariations = [
      `<p>The battle rages on! Both creatures are wounded but determined.</p><p>What should ${animalA} do next?</p>`,
      `<p>The fight continues to escalate! ${animalB} is preparing another attack.</p><p>How should ${animalA} respond?</p>`,
      `<p>A critical moment! Both fighters are looking for an opening.</p><p>What's ${animalA}'s next move?</p>`,
    ];
    
    const choiceImage = await generateImage(`${animalA} and ${animalB} mid-battle, both wounded, tense moment`);
    
    pages.push({
      id: `choice-${nextChoiceNum}`,
      type: 'choice',
      title: '🤔 The Battle Continues!',
      content: questionVariations[(req.previousChoices.length) % questionVariations.length],
      imageUrl: choiceImage,
      choices: [
        { id: 'attack', text: `${animalA} goes for a powerful strike!`, emoji: '⚔️' },
        { id: 'defend', text: `${animalA} dodges and counterattacks!`, emoji: '🛡️' },
        { id: 'flank', text: `${animalA} tries a surprise maneuver!`, emoji: '🎯' },
      ],
    });
  }

  return pages;
};

export async function POST(request: NextRequest) {
  try {
    const body: ChoiceRequest = await request.json();
    
    const choiceNumber = body.previousChoices.length + 2;
    const pages = await generateNextScene(body, choiceNumber);

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Choice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate scene' }, { status: 500 });
  }
}
