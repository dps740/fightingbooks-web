#!/bin/bash
# Generate educational images for 5 new animals using Flux Dev
# Replacing: Komodo Dragon, Honey Badger, Cassowary, Black Panther, Wolverine
# Adding: Hammerhead Shark, Electric Eel, Great Horned Owl, Narwhal, Mandrill

FAL_KEY="c0f1713d-6fa5-41a0-8f4e-84defdb39eed:bfb696c0dce01f989089febd9b8990f8"
OUT="$(dirname "$0")/../public/fighters"

gen() {
  local file="$1" prompt="$2"
  echo "→ $file"
  local resp=$(curl -s "https://fal.run/fal-ai/flux/dev" \
    -H "Authorization: Key $FAL_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": $(echo "$prompt" | jq -Rs .), \"image_size\": \"square_hd\", \"num_inference_steps\": 28}")
  local url=$(echo "$resp" | jq -r '.images[0].url // empty')
  if [ -n "$url" ]; then
    curl -s "$url" -o "${OUT}/${file}"
    echo "  ✅ $(stat -f%z "${OUT}/${file}") bytes"
  else
    echo "  ❌ $(echo $resp | head -c 200)"
  fi
  sleep 1
}

animal_gen() {
  local slug="$1" name="$2" habitat_desc="$3" action_desc="$4" closeup_desc="$5" secrets_desc="$6"
  
  echo ""
  echo "=== $name ==="
  
  gen "${slug}.jpg" "${name} portrait, powerful build, intelligent eyes staring at camera, natural coloring and markings, lush natural habitat background, National Geographic wildlife photography, dramatic natural lighting, hyperrealistic, ABSOLUTELY NO TEXT OR WORDS OR LETTERS OR NUMBERS"
  
  gen "${slug}-habitat.jpg" "${name} ${habitat_desc}, environmental wide shot showing full habitat, wildlife documentary photography, natural behavior, ABSOLUTELY NO TEXT OR WORDS OR LETTERS OR NUMBERS"
  
  gen "${slug}-action.jpg" "${name} ${action_desc}, intense action moment, wildlife photography, ABSOLUTELY NO TEXT OR WORDS OR LETTERS OR NUMBERS"
  
  gen "${slug}-closeup.jpg" "Extreme close-up of ${name} face and head, ${closeup_desc}, every detail visible, shallow depth of field, intimate wildlife portrait, ABSOLUTELY NO TEXT OR WORDS OR LETTERS OR NUMBERS"
  
  gen "${slug}-secrets.jpg" "${name} ${secrets_desc}, educational nature scene showing natural behavior, wildlife photography, ABSOLUTELY NO TEXT OR WORDS OR LETTERS OR NUMBERS"
}

echo "=========================================="
echo "Generating 5 new animals with Flux Dev"
echo "=========================================="

animal_gen "hammerhead-shark" "Hammerhead shark" \
  "swimming in warm tropical ocean waters, school of hammerheads visible, coral reef below, sunlight filtering through blue water" \
  "hunting at speed through a massive school of fish, using wide head to pin stingray to sandy ocean floor, powerful predatory strike" \
  "distinctive wide T-shaped hammer head seen from front, wide-set eyes on each end of cephalofoil, grey skin texture, underwater shot" \
  "scanning the ocean floor using electroreceptor sensors in its wide head to detect hidden prey buried in sand, showing its unique sensory hunting advantage"

animal_gen "electric-eel" "Electric eel" \
  "gliding through murky Amazonian river waters, dense tropical vegetation visible above waterline, tangled roots and river bottom, South American freshwater habitat" \
  "discharging powerful electric shock with visible electrical arcs in water, stunning a fish prey, bio-luminescent effect around its long serpentine body" \
  "elongated face with small dark eyes, wide flat mouth, smooth dark olive-brown skin with slight iridescence, whisker-like barbels near mouth" \
  "three electric organs visible as glowing bands along its long body, demonstrating the specialized cells called electrocytes that generate up to 860 volts of electricity"

animal_gen "great-horned-owl" "Great horned owl" \
  "perched on a thick pine branch in moonlit old-growth forest, stars visible through canopy, nocturnal woodland setting, soft moonlight" \
  "swooping down with massive talons extended to catch a rabbit, wings fully spread showing enormous wingspan, silent flight attack from darkness" \
  "intense bright yellow eyes with dark pupils, prominent feathered ear tufts (horns), facial disc pattern, barred chest feathers, intimidating stare" \
  "rotating its head nearly 270 degrees while perched, demonstrating incredible neck flexibility, showing how it can see in almost every direction without moving its body"

animal_gen "narwhal" "Narwhal" \
  "pod of narwhals swimming in frigid Arctic waters with icebergs and sea ice, dark grey mottled bodies, long spiral tusks visible above water surface" \
  "two male narwhals crossing their long spiral tusks in a sparring display, cold Arctic water splashing, dramatic jousting behavior" \
  "close view of narwhal head showing mottled grey-white skin, small dark eye, the base of the iconic spiral tusk emerging from upper left jaw" \
  "narwhal using its long spiral tusk as a sensory organ, detecting changes in water temperature and salinity, millions of nerve endings in the tusk glowing with sensitivity"

animal_gen "mandrill" "Mandrill primate" \
  "walking through dense Central African tropical rainforest floor, dappled sunlight, lush green vegetation, fallen logs and ferns" \
  "displaying aggressive threat with mouth wide open showing enormous razor-sharp canine fangs, vivid blue and red face colors intensified with adrenaline" \
  "vivid bright blue ridged nose flanked by deep red nostrils and red lip, golden beard, intense amber eyes, most colorful face of any mammal" \
  "adult male mandrill with bright blue and purple rump sitting prominently, showing how the most colorful males are the dominant leaders of the troop"

echo ""
echo "=========================================="
echo "Done! Generated 25 images for 5 new animals"
echo "=========================================="
