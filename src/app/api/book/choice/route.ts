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
  taleOfTheTape?: {
    animalA: { strength: number; speed: number; weapons: number; defense: number };
    animalB: { strength: number; speed: number; weapons: number; defense: number };
  };
}

// Generate image using fal.ai Flux
async function generateImage(prompt: string, cacheKey?: string): Promise<string> {
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) {
    console.log('No FAL_API_KEY, using placeholder');
    return `https://placehold.co/512x512/1a1a1a/d4af37?text=${encodeURIComponent(prompt.slice(0, 20))}`;
  }

  const fullPrompt = `${prompt}, STYLE: wildlife documentary photography, National Geographic quality, photorealistic nature photography, dramatic natural lighting. ANATOMY: animals in NATURAL quadruped or species-appropriate poses only, correct number of limbs, realistic proportions. FORBIDDEN: NO human features, NO human hands or arms, NO bipedal poses, NO celebration poses, NO raised limbs, NO anthropomorphism, NO human clothing, NO fantasy elements, ABSOLUTELY NO TEXT OR WORDS IN THE IMAGE. Animals must behave like REAL WILD ANIMALS.`;

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

    // If this was the 3rd decision, determine winner using Tale of the Tape + choices
    if (gateNumber === 3) {
      // Calculate base strength from Tale of the Tape (if available)
      let baseScoreA = 50; // Default baseline
      let baseScoreB = 50;
      
      if (body.taleOfTheTape) {
        const statsA = body.taleOfTheTape.animalA;
        const statsB = body.taleOfTheTape.animalB;
        // Average of stats gives base "power level" (0-100 scale)
        baseScoreA = (statsA.strength + statsA.speed + statsA.weapons + statsA.defense) / 4;
        baseScoreB = (statsB.strength + statsB.speed + statsB.weapons + statsB.defense) / 4;
      }
      
      // User choices can swing the battle (each point = 5% swing)
      // Max user score is 6 (1+2+3), so max swing is 30%
      const choiceSwingA = newScore.A * 5;
      const choiceSwingB = newScore.B * 5;
      
      // Final battle score
      const finalScoreA = baseScoreA + choiceSwingA;
      const finalScoreB = baseScoreB + choiceSwingB;
      
      console.log(`Final battle scores - ${animalA}: ${finalScoreA} (base ${baseScoreA} + choices ${choiceSwingA}) vs ${animalB}: ${finalScoreB} (base ${baseScoreB} + choices ${choiceSwingB})`);
      
      // Determine winner
      const winner = finalScoreA > finalScoreB ? animalA : finalScoreB > finalScoreA ? animalB : (Math.random() > 0.5 ? animalA : animalB);
      const loser = winner === animalA ? animalB : animalA;
      
      // Generate victory image
      const victoryImage = await generateImage(`${winner} standing dominant over defeated opponent, natural animal posture on all fours, wild predator after successful hunt, nature documentary style, no human poses no celebration no raised limbs`);
      
      // Determine how decisive the victory was
      const scoreDiff = Math.abs(finalScoreA - finalScoreB);
      const victoryType = scoreDiff > 20 ? 'dominant' : scoreDiff > 10 ? 'hard-fought' : 'narrow';
      const victoryDesc = victoryType === 'dominant' 
        ? `${winner} dominated this battle from start to finish!`
        : victoryType === 'hard-fought'
        ? `After an intense struggle, ${winner} emerges victorious!`
        : `In an incredibly close fight, ${winner} barely edges out the win!`;
      
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
            <p class="results-title">🎯 BATTLE RESULTS</p>
            <p class="results-desc">${victoryDesc}</p>
            <p class="results-note">Your choices combined with each animal's natural abilities to determine the outcome!</p>
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
