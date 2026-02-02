#!/bin/bash
# Generate educational images for all 47 animals
# portrait (already exists), habitat, action, closeup

FAL_KEY="c0f1713d-6fa5-41a0-8f4e-84defdb39eed:bfb696c0dce01f989089febd9b8990f8"
OUTPUT_DIR="../public/fighters"

# All animals
ANIMALS=(
  "alligator"
  "anaconda"
  "ankylosaurus"
  "basilisk"
  "black-panther"
  "brachiosaurus"
  "cape-buffalo"
  "cassowary"
  "cerberus"
  "cheetah"
  "chimera"
  "crocodile"
  "dragon"
  "eagle"
  "elephant"
  "gorilla"
  "great-white-shark"
  "griffin"
  "grizzly-bear"
  "hippo"
  "honey-badger"
  "hydra"
  "hyena"
  "jaguar"
  "king-cobra"
  "komodo-dragon"
  "kraken"
  "leopard"
  "lion"
  "manticore"
  "moose"
  "octopus"
  "orca"
  "phoenix"
  "polar-bear"
  "pteranodon"
  "python"
  "rhino"
  "spinosaurus"
  "stegosaurus"
  "tiger"
  "triceratops"
  "tyrannosaurus-rex"
  "velociraptor"
  "walrus"
  "wolf"
  "wolverine"
)

IMAGE_TYPES=("habitat" "action" "closeup")

generate_image() {
  local animal=$1
  local type=$2
  local output_file="${OUTPUT_DIR}/${animal}-${type}.jpg"
  
  # Skip if already exists
  if [ -f "$output_file" ] && [ $(stat -c%s "$output_file" 2>/dev/null || stat -f%z "$output_file") -gt 10000 ]; then
    echo "  ⏭️  ${animal}-${type} already exists, skipping"
    return 0
  fi
  
  # Format name for prompt
  local name=$(echo "$animal" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
  
  # Create prompt based on type
  local prompt=""
  case $type in
    habitat)
      prompt="${name} in natural habitat, wildlife documentary style, environmental shot, detailed background"
      ;;
    action)
      prompt="${name} hunting or attacking, showing weapons and power, action shot, dynamic pose"
      ;;
    closeup)
      prompt="${name} close-up face showing teeth/eyes/features, intense stare, detailed texture"
      ;;
  esac
  
  local full_prompt="${prompt}, detailed painted wildlife illustration, ANATOMICALLY ACCURATE, natural history museum quality art, educational wildlife book, detailed fur/scales/feathers texture, dramatic lighting, NO TEXT"
  
  # Call FAL API
  local response=$(curl -s "https://fal.run/fal-ai/flux/schnell" \
    -H "Authorization: Key $FAL_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"prompt\": \"${full_prompt}\",
      \"image_size\": \"square_hd\",
      \"num_inference_steps\": 4
    }")
  
  local img_url=$(echo "$response" | jq -r '.images[0].url // empty')
  
  if [ -n "$img_url" ]; then
    curl -s "$img_url" -o "$output_file"
    local size=$(stat -c%s "$output_file" 2>/dev/null || stat -f%z "$output_file")
    echo "  ✅ ${animal}-${type}.jpg (${size} bytes)"
    return 0
  else
    echo "  ❌ Failed: ${animal}-${type}"
    echo "  Response: $response"
    return 1
  fi
}

echo "=========================================="
echo "Generating Educational Images"
echo "Animals: ${#ANIMALS[@]}"
echo "Types: ${IMAGE_TYPES[@]}"
echo "Total: $((${#ANIMALS[@]} * ${#IMAGE_TYPES[@]})) images"
echo "=========================================="

count=0
total=$((${#ANIMALS[@]} * ${#IMAGE_TYPES[@]}))

for animal in "${ANIMALS[@]}"; do
  echo ""
  echo "Processing: $animal"
  for type in "${IMAGE_TYPES[@]}"; do
    generate_image "$animal" "$type"
    count=$((count + 1))
    echo "  Progress: $count / $total"
    sleep 0.5  # Rate limiting
  done
done

echo ""
echo "=========================================="
echo "Complete! Generated $count images"
echo "=========================================="
