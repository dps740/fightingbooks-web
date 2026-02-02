#!/usr/bin/env python3
import os
import sys
import time
import requests
from pathlib import Path

FAL_KEY = "c0f1713d-6fa5-41a0-8f4e-84defdb39eed:bfb696c0dce01f989089febd9b8990f8"
OUTPUT_DIR = Path(__file__).parent.parent / 'public' / 'fighters'

FIGHTERS = [
    'Alligator', 'Black Panther', 'Cheetah', 'Hyena', 
    'Walrus', 'Octopus', 'Kraken'
]

for name in FIGHTERS:
    is_fantasy = name == 'Kraken'
    if is_fantasy:
        prompt = f"Epic fantasy art portrait of a fierce {name}, dramatic lighting, intimidating, detailed scales/tentacles, cinematic quality, concept art style, photorealistic, 4k"
    else:
        prompt = f"Professional wildlife photography portrait of a fierce {name}, dramatic lighting, intimidating expression, detailed fur/scales, cinematic quality, National Geographic style, photorealistic, 4k"
    
    print(f"Generating {name}...")
    
    response = requests.post(
        "https://fal.run/fal-ai/flux/schnell",
        headers={"Authorization": f"Key {FAL_KEY}", "Content-Type": "application/json"},
        json={"prompt": prompt, "image_size": "square", "num_images": 1}
    )
    
    if response.status_code == 200:
        result = response.json()
        image_url = result['images'][0]['url']
        img_response = requests.get(image_url)
        
        filename = name.lower().replace(' ', '-') + '.jpg'
        filepath = OUTPUT_DIR / filename
        
        with open(filepath, 'wb') as f:
            f.write(img_response.content)
        
        print(f"  ✅ Saved to {filepath}")
    else:
        print(f"  ❌ Failed: {response.status_code}")
    
    time.sleep(1)

print(f"\n✅ Generated {len(FIGHTERS)} new portraits")
