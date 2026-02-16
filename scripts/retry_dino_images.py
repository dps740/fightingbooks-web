#!/usr/bin/env python3
"""Retry downloading failed dinosaur images using thumbnail URLs with polite delays."""
import json
import os
import sys
import time
import urllib.request
import urllib.parse
import re

OUTPUT_DIR = os.path.expanduser("~/clawd/projects/fightingbooks-web/public/fighters/dino-sourced")

# Load existing results
with open(os.path.join(OUTPUT_DIR, "_download_results.json")) as f:
    results = json.load(f)

# What we already have
downloaded = results["downloaded"]
already_have = {(d["dino"], d["type"]) for d in downloaded}

# What failed and needs retry
RETRY_LIST = [
    # (dino, type, wikimedia_title)
    # Brachiosaurus gaps
    ("brachiosaurus", "habitat", "File:Brachiosaurus alimentándose del follage.jpg"),
    ("brachiosaurus", "secrets", "File:Macronaria scrubbed enh.jpg"),
    # Pteranodon gaps  
    ("pteranodon", "portrait", "File:Pteranodon cranial anatomy.jpg"),
    ("pteranodon", "closeup", "File:Pteranodon cranial anatomy (cropped).jpg"),
    ("pteranodon", "action", "File:Pteranodontians and mosasaur.jpg"),
    # Spinosaurus gaps
    ("spinosaurus", "portrait", "File:Spinosaurus 2020 reconstruction.jpg"),
    ("spinosaurus", "action", "File:Spinosaurus durbed.jpg"),
    ("spinosaurus", "secrets", "File:Spinosaurus life restoration with Onchopristis.jpg"),
    # Stegosaurus gaps
    ("stegosaurus", "portrait", "File:Stegosaurus BW.jpg"),
    ("stegosaurus", "closeup", "File:Stegosaurus stenops sophie wiki martyniuk.png"),
    ("stegosaurus", "secrets", "File:Stegosaurus et Ceratosaurus.jpg"),
    # Velociraptor gaps
    ("velociraptor", "closeup", "File:Velociraptor head.png"),
    ("velociraptor", "secrets", "File:Velociraptor attacking Protoceratops.jpg"),
]

def fetch_thumb_url(title, width=1024):
    """Get thumbnail URL for an image using the API."""
    params = {
        "action": "query",
        "titles": title,
        "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata",
        "iiurlwidth": str(width),
        "format": "json",
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={
        "User-Agent": "FightingBooksBot/1.0 (educational children's book project; polite single-threaded)"
    })
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
    
    pages = data.get("query", {}).get("pages", {})
    for page_id, page_data in pages.items():
        if "imageinfo" in page_data:
            info = page_data["imageinfo"][0]
            return info
    return None


def extract_license(extmetadata):
    """Extract license info."""
    license_short = extmetadata.get("LicenseShortName", {}).get("value", "unknown").lower()
    license_url = extmetadata.get("LicenseUrl", {}).get("value", "")
    artist = extmetadata.get("Artist", {}).get("value", "unknown")
    desc = extmetadata.get("ImageDescription", {}).get("value", "")
    artist = re.sub(r'<[^>]+>', '', artist).strip()
    return {
        "license": license_short,
        "license_url": license_url,
        "artist": artist,
        "description": desc[:200] if desc else "",
    }


def download_image(url, filepath):
    """Download with retries."""
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={
                "User-Agent": "FightingBooksBot/1.0 (educational children's book project; polite single-threaded)"
            })
            with urllib.request.urlopen(req, timeout=30) as resp:
                with open(filepath, "wb") as f:
                    f.write(resp.read())
            return os.path.getsize(filepath)
        except Exception as e:
            print(f"    Attempt {attempt+1} failed: {e}")
            if attempt < 2:
                wait = (attempt + 1) * 10
                print(f"    Waiting {wait}s before retry...")
                time.sleep(wait)
    return None


def main():
    new_downloads = []
    
    for dino, img_type, title in RETRY_LIST:
        if (dino, img_type) in already_have:
            print(f"SKIP {dino}/{img_type}: already downloaded")
            continue
        
        print(f"\n--- {dino}/{img_type} ---")
        print(f"  Source: {title}")
        
        # Polite delay
        print("  Waiting 5s (rate limit)...")
        time.sleep(5)
        
        # Get image info with thumbnail URL
        info = fetch_thumb_url(title, width=1024)
        if not info:
            print(f"  ERROR: Could not fetch info for {title}")
            continue
        
        ext_meta = info.get("extmetadata", {})
        license_info = extract_license(ext_meta)
        
        # Use thumburl if available, fall back to url
        img_url = info.get("thumburl", info.get("url", ""))
        thumb_width = info.get("thumbwidth", info.get("width", 0))
        thumb_height = info.get("thumbheight", info.get("height", 0))
        full_width = info.get("width", 0)
        full_height = info.get("height", 0)
        mime = info.get("mime", "")
        
        print(f"  License: {license_info['license']}")
        print(f"  Full size: {full_width}x{full_height}")
        print(f"  Thumb: {thumb_width}x{thumb_height}")
        print(f"  URL: {img_url[:80]}...")
        
        # Determine extension
        ext = ".jpg"
        if "png" in mime:
            ext = ".png"
        
        out_name = f"{dino}-{img_type}-source{ext}"
        out_path = os.path.join(OUTPUT_DIR, out_name)
        
        # Polite delay before download
        print("  Waiting 3s before download...")
        time.sleep(3)
        
        size = download_image(img_url, out_path)
        if size:
            print(f"  Downloaded: {size / 1024:.1f} KB -> {out_name}")
            new_downloads.append({
                "dino": dino,
                "type": img_type,
                "filename": out_name,
                "source_title": title,
                "source_url": f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(title)}",
                "direct_url": img_url,
                "license": license_info["license"],
                "license_url": license_info["license_url"],
                "artist": license_info["artist"],
                "description": license_info["description"],
                "dimensions": f"{full_width}x{full_height}",
                "thumb_dimensions": f"{thumb_width}x{thumb_height}",
                "file_size_kb": round(size / 1024, 1),
            })
            already_have.add((dino, img_type))
        else:
            print(f"  FAILED to download")
    
    # Merge with existing results
    all_downloaded = downloaded + new_downloads
    with open(os.path.join(OUTPUT_DIR, "_download_results.json"), "w") as f:
        json.dump({
            "downloaded": all_downloaded,
            "skipped": [],
        }, f, indent=2)
    
    print(f"\n\nRETRY SUMMARY:")
    print(f"  New downloads: {len(new_downloads)}")
    print(f"  Total: {len(all_downloaded)}")
    
    # Check final status
    needs = {
        "ankylosaurus": {"portrait", "closeup", "action", "habitat", "secrets"},
        "brachiosaurus": {"portrait", "closeup", "action", "habitat", "secrets"},
        "pteranodon": {"portrait", "closeup", "action", "habitat", "secrets"},
        "spinosaurus": {"portrait", "action", "secrets"},
        "stegosaurus": {"portrait", "closeup", "action", "secrets"},
        "velociraptor": {"action", "secrets", "closeup"},
    }
    
    for dino, needed in needs.items():
        filled = {d["type"] for d in all_downloaded if d["dino"] == dino}
        gaps = needed - filled
        if gaps:
            print(f"  {dino}: STILL MISSING {', '.join(gaps)}")
        else:
            print(f"  {dino}: ✅ complete")


if __name__ == "__main__":
    main()
