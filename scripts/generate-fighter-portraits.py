#!/usr/bin/env python3
"""
Generate AI portraits for all FightingBooks fighters using FAL
Saves to public/fighters/ directory
"""

import os
import sys
import time
import requests
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

FAL_KEY = os.getenv('FAL_KEY')
if not FAL_KEY:
    print("Error: FAL_KEY environment variable not set")
    sys.exit(1)

FIGHTERS = {
    'real': [
        'Lion', 'Tiger', 'Grizzly Bear', 'Polar Bear', 'Gorilla',
        'Great White Shark', 'Orca', 'Crocodile', 'Elephant', 'Hippo',
        'Rhino', 'Komodo Dragon', 'King Cobra', 'Anaconda', 'Wolf',
        'Jaguar', 'Leopard', 'Eagle', 'Wolverine', 'Honey Badger',
        'Moose', 'Cape Buffalo', 'Cassowary', 'Python'
    ],
    'fantasy': [
        'Dragon', 'Griffin', 'Hydra', 'Phoenix', 'Cerberus',
        'Chimera', 'Manticore', 'Basilisk'
    ]
}

OUTPUT_DIR = Path(__file__).parent.parent / 'public' / 'fighters'
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def generate_portrait(name, category):
    """Generate a single fighter portrait"""
    
    # Create prompt
    if category == 'real':
        prompt = f"Professional wildlife photography portrait of a fierce {name}, dramatic lighting, intimidating expression, detailed fur/scales, cinematic quality, National Geographic style, photorealistic, 4k"
    else:
        prompt = f"Epic fantasy art portrait of a fierce {name}, dramatic lighting, intimidating, detailed scales/feathers, cinematic quality, concept art style, photorealistic, 4k"
    
    print(f"Generating {name}...")
    
    # Call FAL API
    # Grok Imagine via FAL — GROK ONLY per David directive 2026-02-16
    response = requests.post(
        "https://fal.run/xai/grok-imagine-image",
        headers={
            "Authorization": f"Key {FAL_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "prompt": prompt,
            "aspect_ratio": "1:1",
            "output_format": "jpeg"
        }
    )
    
    if response.status_code != 200:
        print(f"  ❌ Failed: {response.status_code}")
        return False
    
    result = response.json()
    image_url = result['images'][0]['url']
    
    # Download image
    img_response = requests.get(image_url)
    if img_response.status_code != 200:
        print(f"  ❌ Failed to download image")
        return False
    
    # Save to file
    filename = name.lower().replace(' ', '-') + '.jpg'
    filepath = OUTPUT_DIR / filename
    
    with open(filepath, 'wb') as f:
        f.write(img_response.content)
    
    print(f"  ✅ Saved to {filepath}")
    return True

def main():
    print("=" * 80)
    print("GENERATING FIGHTER PORTRAITS")
    print("=" * 80)
    
    total = sum(len(fighters) for fighters in FIGHTERS.values())
    generated = 0
    
    for category, fighters in FIGHTERS.items():
        print(f"\n{category.upper()} ANIMALS ({len(fighters)}):")
        for fighter in fighters:
            if generate_portrait(fighter, category):
                generated += 1
            time.sleep(1)  # Rate limiting
    
    print("\n" + "=" * 80)
    print(f"COMPLETE: {generated}/{total} portraits generated")
    print("=" * 80)

if __name__ == '__main__':
    main()
