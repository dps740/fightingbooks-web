import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import OpenAI from 'openai';
import { put } from '@vercel/blob';
import { CUSTOM_ANIMAL_MONTHLY_LIMIT, normalizeTier } from '@/lib/tierAccess';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function createSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

type ImageType = 'portrait' | 'closeup' | 'action' | 'habitat' | 'secrets';

function getImagePrompt(name: string, type: ImageType): string {
  const prefix = 'epic fantasy illustration, detailed mythological creature art, dramatic cinematic lighting, ';

  const prompts: Record<ImageType, string> = {
    portrait: `${prefix}${name}, full body portrait, natural standing pose in natural habitat, photorealistic wildlife photography, National Geographic quality, dramatic natural lighting, detailed texture, ANATOMICALLY CORRECT: exactly ONE animal with ONE head and correct number of limbs, ABSOLUTELY NO TEXT OR WORDS IN THE IMAGE`,
    closeup: `${prefix}${name}, extreme close-up portrait of face and head, intense eyes, showing unique facial features and details, dramatic studio lighting, wildlife photography, educational illustration, natural history museum quality, detailed texture, ABSOLUTELY NO TEXT OR WORDS IN THE IMAGE`,
    action: `${prefix}${name}, dynamic action shot, hunting or striking or moving at speed, explosive movement, photorealistic wildlife photography, dramatic natural lighting, motion captured, ANATOMICALLY CORRECT: exactly ONE animal, ABSOLUTELY NO TEXT OR WORDS IN THE IMAGE`,
    habitat: `${prefix}${name}, in its natural habitat environment, wide shot showing the animal in context of its ecosystem, photorealistic nature photography, National Geographic quality, golden hour lighting, ANATOMICALLY CORRECT: only this one species visible, ABSOLUTELY NO TEXT OR WORDS IN THE IMAGE`,
    secrets: `${prefix}${name}, mysterious close-up portrait, intense eyes, showing unique features and details, dramatic lighting, wildlife photography, educational illustration, natural history museum quality, detailed texture, ANATOMICALLY CORRECT: exactly ONE head and ONE body, correct number of limbs for the species, ABSOLUTELY NO TEXT OR WORDS IN THE IMAGE`,
  };
  return prompts[type];
}

async function generateFacts(name: string): Promise<Record<string, unknown>> {
  const prompt = `Generate facts about ${name} for a children's educational animal battle book. Return JSON matching this exact schema:
{
  "name": "Display Name",
  "scientific_name": "...",
  "habitat": "...",
  "size": "... fun comparison ...",
  "diet": "...",
  "weapons": ["weapon1", "weapon2", "weapon3"],
  "defenses": ["defense1", "defense2", "defense3"],
  "speed": "...",
  "fun_facts": ["fact1", "fact2", "fact3"],
  "size_comparisons": [
    { "item": "School Bus", "emoji": "🚌", "comparison": "..." },
    { "item": "Person", "emoji": "👤", "comparison": "..." }
  ],
  "strength_score": 7,
  "speed_score": 6,
  "weapons_score": 8,
  "defense_score": 5
}
Make it exciting and educational for kids ages 6-12. Scores are 1-10. For fantasy creatures, base facts on mythology.`;

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

async function generateImage(prompt: string): Promise<string> {
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) throw new Error('FAL_API_KEY not configured');

  const response = await fetch('https://fal.run/xai/grok-imagine-image', {
    method: 'POST',
    headers: {
      'Authorization': `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      aspect_ratio: '1:1',
      output_format: 'jpeg',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`FAL image generation failed: ${errorText}`);
  }

  const result = await response.json();
  const imageUrl = result.images?.[0]?.url;
  if (!imageUrl) throw new Error('No image URL returned from FAL');
  return imageUrl;
}

async function uploadImageToBlob(imageUrl: string, slug: string, type: string): Promise<string> {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  const blob = await put(`fightingbooks/custom/${slug}-${type}.jpg`, buffer, {
    access: 'public',
    contentType: 'image/jpeg',
  });
  return blob.url;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    
    // Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get('sb-access-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let user;
    const authResult = await supabase.auth.getUser(token);
    if (authResult.error || !authResult.data.user) {
      // Try refresh
      const refreshToken = cookieStore.get('sb-refresh-token')?.value;
      if (refreshToken) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
          refresh_token: refreshToken,
        });
        if (refreshError || !refreshData.user) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        user = refreshData.user;
      } else {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    } else {
      user = authResult.data.user;
    }

    // Check tier - must be ultimate
    const { data: profile } = await supabase
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .single();

    const tier = normalizeTier(profile?.tier || 'unregistered');
    if (tier !== 'ultimate') {
      return NextResponse.json({ error: 'Ultimate tier required to create custom animals' }, { status: 403 });
    }

    // Parse request
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json({ error: 'Name must be 50 characters or less' }, { status: 400 });
    }

    const slug = createSlug(name.trim());

    // Rate limiting: check monthly count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('custom_animals')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .gte('created_at', startOfMonth.toISOString());

    if (countError) {
      console.error('Count error:', countError);
      return NextResponse.json({ error: 'Failed to check rate limit' }, { status: 500 });
    }

    if ((count || 0) >= CUSTOM_ANIMAL_MONTHLY_LIMIT) {
      return NextResponse.json({
        error: `Monthly limit reached (${CUSTOM_ANIMAL_MONTHLY_LIMIT} custom animals per month)`,
      }, { status: 429 });
    }

    // Check if user already has this animal
    const { data: existing } = await supabase
      .from('custom_animals')
      .select('id')
      .eq('slug', slug)
      .eq('created_by', user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You already have a creature with this name' }, { status: 409 });
    }

    // Insert with status='generating'
    const { data: animal, error: insertError } = await supabase
      .from('custom_animals')
      .insert({
        name: name.trim(),
        slug,
        category: 'fantasy',
        scope: 'user',
        status: 'generating',
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create animal record' }, { status: 500 });
    }

    // Do generation in background-ish: we return after inserting,
    // but actually we'll do it synchronously since Vercel functions
    // don't support background work easily. The client polls for status.
    try {
      // Generate facts
      console.log(`[CREATE-ANIMAL] Generating facts for ${name}...`);
      const facts = await generateFacts(name.trim());

      // Generate images
      console.log(`[CREATE-ANIMAL] Generating images for ${name}...`);
      const imageTypes: ImageType[] = ['portrait', 'closeup', 'action', 'habitat', 'secrets'];
      const images: Record<string, string> = {};

      for (const type of imageTypes) {
        console.log(`[CREATE-ANIMAL] Generating ${type} image...`);
        const prompt = getImagePrompt(name.trim(), type);
        const falUrl = await generateImage(prompt);
        const blobUrl = await uploadImageToBlob(falUrl, slug, type);
        images[type] = blobUrl;
      }

      // Update row
      const { error: updateError } = await supabase
        .from('custom_animals')
        .update({ facts, images, status: 'ready' })
        .eq('id', animal.id);

      if (updateError) {
        throw new Error('Failed to update animal with generated data');
      }

      console.log(`[CREATE-ANIMAL] ✅ ${name} created by user ${user.id}`);

      return NextResponse.json({
        success: true,
        animal: {
          id: animal.id,
          name: name.trim(),
          slug,
          category: 'fantasy',
          scope: 'user',
          status: 'ready',
          facts,
          images,
        },
      });
    } catch (genError) {
      await supabase
        .from('custom_animals')
        .update({ status: 'failed' })
        .eq('id', animal.id);

      console.error('[CREATE-ANIMAL] Generation error:', genError);
      return NextResponse.json({
        error: `Generation failed: ${genError instanceof Error ? genError.message : 'Unknown error'}`,
        animalId: animal.id,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[CREATE-ANIMAL] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
