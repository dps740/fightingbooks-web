#!/bin/bash
# Regenerate 8 free animals with ZERO mention of National Geographic anywhere
FAL_KEY="c0f1713d-6fa5-41a0-8f4e-84defdb39eed:bfb696c0dce01f989089febd9b8990f8"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/fighters"

gen() {
  local file="$1" prompt="$2"
  echo "→ $file"
  local resp=$(curl -s "https://fal.run/fal-ai/flux/schnell" \
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

# NEGATIVE: NO mention of National Geographic, no brand names at all
NEG="ABSOLUTELY NO TEXT NO WORDS NO LOGOS NO WATERMARKS NO SYMBOLS NO BRAND NAMES, clean image only"

a() {
  local slug="$1" name="$2" habitat="$3" action="$4" closeup="$5" secrets="$6"
  echo ""
  echo "=== $name ==="
  gen "${slug}.jpg" "${name} portrait, powerful muscular build, intelligent eyes, natural coloring and markings, lush natural habitat background, professional wildlife photo, dramatic natural lighting, hyperrealistic, ${NEG}"
  gen "${slug}-habitat.jpg" "${name} ${habitat}, environmental wide shot showing full habitat, professional wildlife documentary style, natural behavior, ${NEG}"
  gen "${slug}-action.jpg" "${name} ${action}, intense action moment, professional wildlife photo, NO WEAPONS NO HUMAN POSES, ${NEG}"
  gen "${slug}-closeup.jpg" "Extreme close-up of ${name} face, ${closeup}, every detail visible, shallow depth of field, intimate wildlife portrait, ${NEG}"
  gen "${slug}-secrets.jpg" "${name} ${secrets}, educational nature scene showing natural behavior, professional wildlife photo, ${NEG}"
}

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
  "sitting peacefully in misty Rwandan mountain rainforest, dense green vegetation, bamboo shoots, volcanic mountains, morning fog" \
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
echo "=== DONE: 40 images regenerated (no NG references) ==="
