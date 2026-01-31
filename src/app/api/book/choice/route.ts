import { NextRequest, NextResponse } from 'next/server';

interface ChoiceRequest {
  animalA: string;
  animalB: string;
  choiceId: string;
  choiceText: string;
  previousChoices: string[];
}

// Generate next scene based on choice
const generateNextScene = (req: ChoiceRequest, choiceNumber: number) => {
  const { animalA, animalB, choiceId, choiceText } = req;
  
  const pages = [];
  
  // Generate battle scene based on choice
  if (choiceId === 'attack') {
    pages.push({
      id: `battle-${choiceNumber}`,
      type: 'battle',
      title: '💥 Aggressive Attack!',
      content: `
        <p>The ${animalA} charges forward with incredible speed!</p>
        <p>${choiceText}</p>
        <p>The ${animalB} barely has time to react as the ${animalA} closes the distance!</p>
      `,
      imageUrl: '/api/placeholder/800/600',
    });
  } else if (choiceId === 'defend') {
    pages.push({
      id: `battle-${choiceNumber}`,
      type: 'battle',
      title: '👁️ Patient Strategy',
      content: `
        <p>The ${animalA} holds back, watching every move...</p>
        <p>${choiceText}</p>
        <p>The ${animalB} grows impatient and makes a hasty move!</p>
      `,
      imageUrl: '/api/placeholder/800/600',
    });
  } else {
    pages.push({
      id: `battle-${choiceNumber}`,
      type: 'battle',
      title: '🔄 Tactical Positioning',
      content: `
        <p>The ${animalA} moves with purpose, seeking advantage...</p>
        <p>${choiceText}</p>
        <p>The ${animalB} tries to track the movement but loses sight momentarily!</p>
      `,
      imageUrl: '/api/placeholder/800/600',
    });
  }

  // After 3 choices, end the battle
  if (req.previousChoices.length >= 2) {
    // Determine winner based on choices made
    const aggressiveChoices = [...req.previousChoices, choiceId].filter(c => c === 'attack').length;
    const winner = aggressiveChoices >= 2 ? animalA : animalB;
    
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
      imageUrl: '/api/placeholder/800/600',
    });
  } else {
    // Add another choice
    const nextChoiceNum = req.previousChoices.length + 2;
    pages.push({
      id: `choice-${nextChoiceNum}`,
      type: 'choice',
      title: '🤔 The Battle Continues!',
      content: `<p>Both animals are still fighting! What happens next?</p>`,
      imageUrl: '/api/placeholder/800/600',
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
    
    // Simulate generation time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const choiceNumber = body.previousChoices.length + 2;
    const pages = generateNextScene(body, choiceNumber);

    return NextResponse.json({ pages });
  } catch (error) {
    console.error('Choice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate scene' }, { status: 500 });
  }
}
