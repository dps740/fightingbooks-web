#!/bin/bash
# Regenerate ALL images for the 4 free sample books:
# 1. Educational images (8 animals × 5) with NO text/logos
# 2. Battle images (4 matchups × 7) with better prompts
# Then invalidate blob cache for those 4 books

FAL_KEY=$(cat ~/.clawd/.api-keys/fal.key)
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/fighters"

gen() {
  local file="$1" prompt="$2"
  echo "→ $file"
  local resp=$(curl -s "https://fal.run/xai/grok-imagine-image" \
    -H "Authorization: Key $FAL_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": $(echo "$prompt" | jq -Rs .), \"image_size\": \"square_hd\", \"num_inference_steps\": 4}")
  local url=$(echo "$resp" | jq -r '.images[0].url // empty')
  if [ -n "$url" ]; then
    curl -s "$url" -o "${OUT}/${file}"
    echo "  ✅ $(stat -f%z "${OUT}/${file}") bytes"
  else
    echo "  ❌ $(echo $resp | head -c 200)"
  fi
  sleep 0.5
}

a() {
  local slug="$1" name="$2" habitat="$3" action="$4" closeup="$5" secrets="$6"
  echo ""
  echo "=== $name (educational) ==="
  gen "${slug}.jpg" "${name} portrait, powerful muscular build, intelligent eyes, natural coloring and markings, lush natural habitat background, professional wildlife photography, dramatic natural lighting, hyperrealistic, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS NO SYMBOLS NO NATIONAL GEOGRAPHIC"
  gen "${slug}-habitat.jpg" "${name} ${habitat}, environmental wide shot showing full habitat, professional wildlife documentary photography, natural behavior, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS NO SYMBOLS NO NATIONAL GEOGRAPHIC"
  gen "${slug}-action.jpg" "${name} ${action}, intense action moment, professional wildlife photography, NO WEAPONS NO HUMAN POSES, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS NO SYMBOLS NO NATIONAL GEOGRAPHIC"
  gen "${slug}-closeup.jpg" "Extreme close-up of ${name} face, ${closeup}, every detail visible, shallow depth of field, intimate wildlife portrait, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS NO SYMBOLS NO NATIONAL GEOGRAPHIC"
  gen "${slug}-secrets.jpg" "${name} ${secrets}, educational nature scene showing natural behavior, professional wildlife photography, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS NO SYMBOLS NO NATIONAL GEOGRAPHIC"
}

echo "========================================"
echo "PART 1: Educational Images (8 animals)"
echo "========================================"

a "lion" "Male African lion" \
  "resting in golden savanna grassland at sunset, acacia trees in background, pride visible in distance" \
  "roaring with full mane blowing in wind, powerful stance on rocky outcrop, showing teeth in dominance display" \
  "thick golden mane, amber eyes, scarred nose, whiskers catching light" \
  "rubbing head affectionately against another lion in the pride, social bonding behavior, showing gentle family side"

a "tiger" "Bengal tiger" \
  "walking through misty bamboo forest, dappled sunlight on orange and black stripes, lush green jungle" \
  "leaping through water with massive splash, powerful pounce with claws extended, hunting in river" \
  "intense amber eyes with distinctive stripe pattern, white whiskers against orange fur, piercing stare" \
  "swimming confidently across a wide jungle river, showing that tigers love water unlike most cats"

a "gorilla" "Silverback mountain gorilla" \
  "sitting peacefully in misty Rwandan mountain rainforest, dense green vegetation, bamboo shoots, volcanic mountains in background, morning fog" \
  "chest-beating display of dominance, standing upright pounding chest with open mouth showing teeth, powerful aggressive posture, jungle clearing" \
  "deep brown intelligent eyes with visible emotion, thick brow ridge, wide flat nose, weathered leathery black skin, every wrinkle visible" \
  "using a stick as a tool to test water depth in a forest stream, showing intelligence and problem-solving, curious expression"

a "grizzly-bear" "Grizzly bear" \
  "standing in Alaskan river during salmon run, pine forest and mountains in background, autumn colors" \
  "catching a leaping salmon mid-air in rushing river, jaws open wide, water splashing everywhere, powerful fishing stance" \
  "massive head with small rounded ears, dark eyes, distinctive shoulder hump visible, brown fur with grizzled tips" \
  "digging for roots and berries with long curved claws, showing omnivorous foraging behavior, meadow setting"

a "great-white-shark" "Great white shark" \
  "cruising through clear blue ocean water, sunlight streaming from surface above, reef and fish in background" \
  "breaching completely out of the ocean chasing prey, massive body airborne with water cascading off, dramatic ocean surface" \
  "mouth slightly open showing rows of serrated triangular teeth, dark eye, scarred snout, underwater shot" \
  "using electroreception to detect hidden prey, special ampullae of Lorenzini pores visible on snout, hunting in murky water"

a "orca" "Orca killer whale" \
  "pod of orcas swimming together in Pacific Northwest waters, forested coastline and mountains in background, dorsal fins breaking surface" \
  "spy-hopping vertically out of water to scout surroundings, head and eye above waterline, curious intelligent behavior" \
  "distinctive black and white pattern, white eye patch, sleek powerful head emerging from dark water" \
  "teaching young calf to hunt by demonstrating wave-washing technique on ice floe, showing cultural learning"

a "polar-bear" "Polar bear" \
  "walking across vast Arctic sea ice, blue-white ice landscape, freezing breath visible, aurora in sky" \
  "lunging through broken sea ice to catch a seal, explosive burst of power and water, Arctic hunting behavior" \
  "black nose and dark eyes contrasting pure white fur, frost on whiskers, cold breath visible" \
  "mother polar bear with two cubs riding on her back, walking across snow, showing maternal care and family bonds"

a "crocodile" "Saltwater crocodile" \
  "basking on muddy riverbank in tropical mangrove swamp, massive body showing full length, birds nearby" \
  "explosive death roll underwater with prey, spinning motion, raw prehistoric power, murky water" \
  "armored scaly head with yellow reptilian eyes, bumpy textured skin, ancient predator face, partially submerged" \
  "mother gently carrying tiny hatchlings in her massive jaws to water, showing surprising parental care"

echo ""
echo "========================================"
echo "PART 2: Battle Images (4 matchups × 7)"
echo "========================================"

battle() {
  local a1="$1" a2="$2" prefix="$3"
  echo ""
  echo "=== ${a1} vs ${a2} ==="
  gen "battle-${prefix}-cover.jpg" "${a1} and ${a2} facing each other in an epic standoff, dramatic lighting, tense atmosphere, both animals in natural poses ready to fight, detailed realistic wildlife art, cinematic composition, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS"
  gen "battle-${prefix}-battle1.jpg" "${a1} and ${a2} circling each other cautiously, sizing each other up, tense confrontation in the wild, dramatic standoff moment, realistic wildlife art, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS"
  gen "battle-${prefix}-battle2.jpg" "${a1} launching first attack at ${a2}, aggressive lunge, explosive action shot with motion blur, raw power on display, realistic wildlife art, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS"
  gen "battle-${prefix}-battle3.jpg" "${a2} fighting back against ${a1}, fierce counterattack, both animals locked in intense combat, dramatic action, realistic wildlife art, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS"
  gen "battle-${prefix}-battle4.jpg" "${a1} and ${a2} in the thick of battle, close quarters combat, both showing their natural weapons teeth claws strength, intense struggle, realistic wildlife art, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS"
  gen "battle-${prefix}-battle5.jpg" "${a1} and ${a2} in the decisive final moment of their battle, one gaining clear advantage, climactic scene, dramatic lighting, realistic wildlife art, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS"
  gen "battle-${prefix}-victory.jpg" "Victorious wild animal standing proud after battle, natural dominant posture on all fours, wild predator surveying territory, nature documentary style, NO human poses NO celebration NO raised limbs, ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS"
}

battle "Lion" "Tiger" "lion-vs-tiger"
battle "Gorilla" "Grizzly Bear" "gorilla-vs-grizzly-bear"
battle "Great White Shark" "Orca" "great-white-shark-vs-orca"
battle "Polar Bear" "Crocodile" "polar-bear-vs-crocodile"

echo ""
echo "========================================"
echo "COMPLETE"
echo "Educational: 40 images (8 animals × 5)"
echo "Battle: 28 images (4 matchups × 7)"
echo "Total: 68 images"
echo "========================================"
