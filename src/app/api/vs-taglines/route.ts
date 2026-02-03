import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { fighterA, fighterB } = await request.json();

    if (!fighterA || !fighterB) {
      return NextResponse.json({ error: 'Missing fighter names' }, { status: 400 });
    }

    const prompt = `Generate dramatic fighter introductions for a "Who Would Win?" battle.

Fighters: ${fighterA} vs ${fighterB}

For each fighter, provide:
1. A killer stat (real measurement - bite force PSI, speed MPH, weight LBS, claw/fang size inches)
2. A dramatic 4-6 word tagline
3. A special ability or trait (2-3 words)

Style: ESPN boxing intro meets National Geographic. Punchy. Factual but hyped.

Return JSON only:
{
  "fighterA": {
    "stat": "660 LBS",
    "tagline": "Silent death from the jungle",
    "special": "AMBUSH HUNTER"
  },
  "fighterB": {
    "stat": "3,700 PSI BITE",  
    "tagline": "Ancient armored predator",
    "special": "DEATH ROLL"
  }
}

CRITICAL: Use REAL measurements for these specific animals. No made-up numbers.
Keep stats SHORT (number + unit only, e.g. "420 LBS" or "50 MPH" or "4-INCH CLAWS").
Taglines should be dramatic but grounded in the animal's real hunting style or habitat.`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return NextResponse.json({
      fighterA: result.fighterA || { stat: '???', tagline: 'Ready to fight', special: 'WILD CARD' },
      fighterB: result.fighterB || { stat: '???', tagline: 'Ready to fight', special: 'WILD CARD' },
    });
  } catch (error) {
    console.error('VS taglines error:', error);
    // Return fallback on error
    return NextResponse.json({
      fighterA: { stat: '???', tagline: 'Apex predator', special: 'DEADLY' },
      fighterB: { stat: '???', tagline: 'Born to fight', special: 'FIERCE' },
    });
  }
}
