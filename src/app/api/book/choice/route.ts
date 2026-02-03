import { NextRequest, NextResponse } from 'next/server';

interface ChoiceRequest {
  animalA: string;
  animalB: string;
  choiceIndex: number;
  gateNumber: number;
  choiceFavors: string;
  choiceOutcome: string;
  currentScore: { A: number; B: number };
  allPages: any[];
}

// Generate image using fal.ai Flux
async function generateImage(prompt: string, cacheKey?: string): Promise<string> {
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

export async function POST(request: NextRequest) {
  try {
    const body: ChoiceRequest = await request.json();
    const { animalA, animalB, choiceFavors, choiceOutcome, currentScore, gateNumber, allPages } = body;

    // Score points based on gate number (1, 2, 3 points)
    const pointValue = gateNumber;
    const newScore = { ...currentScore };
    
    if (choiceFavors === 'A') {
      newScore.A += pointValue;
    } else if (choiceFavors === 'B') {
      newScore.B += pointValue;
    }
    // Neutral choices don't add points

    console.log(`Gate ${gateNumber} choice made. Favors: ${choiceFavors}. Score: A=${newScore.A}, B=${newScore.B}`);

    const pages = [];

    // Add outcome page
    const outcomeImage = await generateImage(`${animalA} and ${animalB} battling, dramatic action scene, ${choiceOutcome}`);
    
    pages.push({
      id: `outcome-${gateNumber}`,
      type: 'battle',
      title: '',
      content: `<p class="outcome-text">${choiceOutcome}</p>`,
      imageUrl: outcomeImage,
    });

    // If this was the 3rd decision, determine winner and add victory page
    if (gateNumber === 3) {
      const winner = newScore.A > newScore.B ? animalA : newScore.B > newScore.A ? animalB : (Math.random() > 0.5 ? animalA : animalB);
      const loser = winner === animalA ? animalB : animalA;
      
      // Generate victory image
      const victoryImage = await generateImage(`${winner} victorious, triumphant powerful stance after battle, realistic wildlife photography style`);
      
      pages.push({
        id: 'victory',
        type: 'victory',
        title: '',
        content: `
          <div class="victory-overlay">
            <p class="victory-label">THE WINNER</p>
            <p class="victory-name">${winner.toUpperCase()}</p>
          </div>
          <div class="cyoa-results">
            <p class="results-title">🎯 YOUR CHOICES DETERMINED THE OUTCOME</p>
            <div class="score-reveal">
              <div class="score-item">
                <span class="score-animal">${animalA}</span>
                <span class="score-value">${newScore.A} points</span>
              </div>
              <div class="score-item">
                <span class="score-animal">${animalB}</span>
                <span class="score-value">${newScore.B} points</span>
              </div>
            </div>
            <p class="results-note">Each decision earned 1-3 points based on which animal it favored!</p>
          </div>
        `,
        imageUrl: victoryImage,
      });
    }

    // Return new pages and updated score
    return NextResponse.json({ 
      pages,
      score: newScore,
      isComplete: gateNumber === 3,
    });
  } catch (error) {
    console.error('Choice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate scene' }, { status: 500 });
  }
}
