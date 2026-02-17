#!/bin/bash
FAL_KEY=$(cat ~/.clawd/.api-keys/fal.key)
OUT="$(dirname "$0")/../public/fighters"

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

animal_gen() {
  local slug="$1" name="$2" habitat_desc="$3" action_desc="$4" closeup_desc="$5" secrets_desc="$6"
  
  echo ""
  echo "=== $name ==="
  
  gen "${slug}.jpg" "${name} portrait, powerful muscular build, intelligent eyes staring at camera, natural coloring and markings, lush natural habitat background, National Geographic wildlife photography, dramatic natural lighting, hyperrealistic, ABSOLUTELY NO TEXT OR WORDS"
  
  gen "${slug}-habitat.jpg" "${name} ${habitat_desc}, environmental wide shot showing full habitat, wildlife documentary photography, natural behavior, ABSOLUTELY NO TEXT OR WORDS"
  
  gen "${slug}-action.jpg" "${name} ${action_desc}, intense action moment, wildlife photography, NO WEAPONS NO HUMAN POSES, ABSOLUTELY NO TEXT OR WORDS"
  
  gen "${slug}-closeup.jpg" "Extreme close-up of ${name} face, ${closeup_desc}, every detail visible, shallow depth of field, intimate wildlife portrait, ABSOLUTELY NO TEXT OR WORDS"
  
  gen "${slug}-secrets.jpg" "${name} ${secrets_desc}, educational nature scene showing natural behavior, wildlife photography, ABSOLUTELY NO TEXT OR WORDS"
}

# Skip gorilla - already done with Dev model
echo "Skipping gorilla (already regenerated with Flux Dev)"

animal_gen "lion" "Male African lion" \
  "resting in golden savanna grassland at sunset, acacia trees in background, pride visible in distance" \
  "roaring with full mane blowing in wind, powerful stance on rocky outcrop, showing teeth in dominance display" \
  "showing thick golden mane, amber eyes, scarred nose, whiskers catching light" \
  "rubbing head affectionately against another lion in the pride, social bonding behavior, showing gentle family side"

animal_gen "tiger" "Bengal tiger" \
  "walking through misty bamboo forest, dappled sunlight on orange and black stripes, lush green jungle" \
  "leaping through water with massive splash, powerful pounce with claws extended, hunting in river" \
  "intense amber eyes with distinctive stripe pattern, white whiskers against orange fur, piercing stare" \
  "swimming confidently across a wide jungle river, showing that tigers love water unlike most cats"

animal_gen "grizzly-bear" "Grizzly bear" \
  "standing in Alaskan river during salmon run, pine forest and mountains in background, autumn colors" \
  "catching a leaping salmon mid-air in rushing river, jaws open wide, water splashing everywhere, powerful fishing stance" \
  "massive head with small rounded ears, dark eyes, distinctive shoulder hump visible, brown fur with grizzled tips" \
  "digging for roots and berries with long curved claws, showing omnivorous foraging behavior, meadow setting"

animal_gen "polar-bear" "Polar bear" \
  "walking across vast Arctic sea ice with aurora borealis in sky, blue-white ice landscape, freezing breath visible" \
  "lunging through broken sea ice to catch a seal, explosive burst of power and water, Arctic hunting behavior" \
  "black nose and dark eyes contrasting pure white fur, frost on whiskers, cold breath visible" \
  "mother polar bear with two cubs riding on her back, walking across snow, showing maternal care and family bonds"

animal_gen "great-white-shark" "Great white shark" \
  "cruising through clear blue ocean water, sunlight streaming from surface above, reef and fish in background" \
  "breaching completely out of the ocean chasing prey, massive body airborne with water cascading off, dramatic ocean surface" \
  "mouth slightly open showing rows of serrated triangular teeth, dark eye, scarred snout, underwater shot" \
  "using electroreception to detect hidden prey, special ampullae of Lorenzini pores visible on snout, hunting in murky water"

animal_gen "orca" "Orca killer whale" \
  "pod of orcas swimming together in Pacific Northwest waters, forested coastline and mountains in background, dorsal fins breaking surface" \
  "spy-hopping vertically out of water to scout surroundings, head and eye above waterline, curious intelligent behavior" \
  "distinctive black and white pattern, white eye patch, sleek powerful head emerging from dark water" \
  "orca teaching young calf to hunt by demonstrating wave-washing technique on ice floe, showing cultural learning"

animal_gen "crocodile" "Saltwater crocodile" \
  "basking on muddy riverbank in tropical mangrove swamp, massive body showing full length, birds nearby" \
  "explosive death roll underwater with prey, spinning motion, raw prehistoric power, murky water" \
  "armored scaly head with yellow reptilian eyes, bumpy textured skin, ancient predator face, partially submerged" \
  "crocodile mother gently carrying tiny hatchlings in her massive jaws to water, showing surprising parental care"

echo ""
echo "=== COMPLETE ==="
echo "Generated 35 images (7 animals × 5 images)"
echo "Gorilla was already done separately"
