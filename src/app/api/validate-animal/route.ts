import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { animal } = await request.json();
    
    if (!animal || typeof animal !== 'string') {
      return NextResponse.json({ valid: false, reason: 'Invalid input' });
    }
    
    const trimmed = animal.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      return NextResponse.json({ valid: false, reason: 'Input must be 2-50 characters' });
    }
    
    const openai = getOpenAI();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a content validator for a kids' "Who Would Win?" animal battle book app. 
          
Your job: Determine if the input is a valid creature for a fun, educational animal battle.

ALLOW:
- Real animals (lion, shark, elephant)
- Extinct animals (t-rex, mammoth, megalodon)  
- Mythical creatures (dragon, griffin, unicorn)
- Reasonable fantasy creatures (giant spider, dire wolf)

REJECT:
- Human beings, real people, or characters
- Inappropriate/offensive content
- Objects that aren't creatures
- Gibberish or spam

Respond with ONLY valid JSON: {"valid": true} or {"valid": false, "reason": "brief reason"}`
        },
        {
          role: 'user',
          content: `Is this a valid creature for an animal battle book? "${trimmed}"`
        }
      ],
      max_tokens: 50,
      temperature: 0,
    });
    
    const content = response.choices[0]?.message?.content || '{"valid": false}';
    
    try {
      const result = JSON.parse(content);
      return NextResponse.json(result);
    } catch {
      // If AI response isn't valid JSON, reject to be safe
      return NextResponse.json({ valid: false, reason: 'Unable to validate' });
    }
    
  } catch (error) {
    console.error('Validation error:', error);
    // On error, allow but flag - don't block users due to API issues
    return NextResponse.json({ valid: true, flagged: true });
  }
}
