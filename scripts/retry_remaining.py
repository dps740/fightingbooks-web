#!/usr/bin/env python3
"""Retry the remaining 5 images using forced thumbnail URLs and long delays."""
import json
import os
import time
import urllib.request
import urllib.parse
import re

OUTPUT_DIR = os.path.expanduser("~/clawd/projects/fightingbooks-web/public/fighters/dino-sourced")

# Remaining images with forced smaller thumb width
REMAINING = [
    {
        "dino": "brachiosaurus", "type": "secrets",
        "title": "File:Macronaria scrubbed enh.jpg",
        "width": 800,  # Original is 1000, request 800 to force thumb
    },
    {
        "dino": "pteranodon", "type": "portrait", 
        "title": "File:Pteranodon cranial anatomy.jpg",
        "width": 700,  # Original is 822
    },
    {
        "dino": "pteranodon", "type": "closeup",
        "title": "File:Pteranodon cranial anatomy (cropped).jpg", 
        "width": 600,  # Original is 738
    },
    {
        "dino": "spinosaurus", "type": "secrets",
        "title": "File:Spinosaurus life restoration with Onchopristis.jpg",
        "width": 600,  # Original is 727
    },
    {
        "dino": "stegosaurus", "type": "closeup",
        "title": "File:Stegosaurus stenops sophie wiki martyniuk.png",
        "width": 600,  # Original is 744
    },
]

def get_thumb_info(title, width):
    """Fetch info with forced thumbnail width."""
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
        "User-Agent": "FightingBooksBot/1.0 (educational book; polite single-thread; contact: david@smith.com)"
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode())
    
    pages = data.get("query", {}).get("pages", {})
    for page_id, page_data in pages.items():
        if "imageinfo" in page_data:
            info = page_data["imageinfo"][0]
            return info
    return None


def download(url, filepath):
    """Download with a browser-like approach via the REST thumbnail endpoint."""
    req = urllib.request.Request(url, headers={
        "User-Agent": "FightingBooksBot/1.0 (educational book project)",
        "Accept": "image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    })
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
        with open(filepath, "wb") as f:
            f.write(data)
    return len(data)


def main():
    results = []
    
    for item in REMAINING:
        dino = item["dino"]
        img_type = item["type"]
        title = item["title"]
        width = item["width"]
        
        outfile = f"{dino}-{img_type}-source"
        
        print(f"\n=== {dino}/{img_type} ===")
        
        # Long polite delay
        delay = 20
        print(f"  Waiting {delay}s...")
        time.sleep(delay)
        
        # Get API info
        print(f"  Fetching info for: {title} (width={width})")
        info = get_thumb_info(title, width)
        if not info:
            print(f"  ERROR: No info returned")
            continue
        
        # Get URLs
        thumb_url = info.get("thumburl", "")
        orig_url = info.get("url", "")
        thumb_w = info.get("thumbwidth", 0)
        thumb_h = info.get("thumbheight", 0)
        mime = info.get("mime", "")
        
        ext_meta = info.get("extmetadata", {})
        license_short = ext_meta.get("LicenseShortName", {}).get("value", "unknown")
        artist_html = ext_meta.get("Artist", {}).get("value", "unknown")
        artist = re.sub(r'<[^>]+>', '', artist_html).strip()
        license_url = ext_meta.get("LicenseUrl", {}).get("value", "")
        desc = ext_meta.get("ImageDescription", {}).get("value", "")[:200]
        
        # Determine URL to use - prefer thumb
        dl_url = thumb_url if thumb_url else orig_url
        
        ext = ".jpg"
        if "png" in mime:
            ext = ".png"
        # But thumbs of PNGs are often .png too
        if thumb_url and ".jpg" in thumb_url:
            ext = ".jpg"
        elif thumb_url and ".png" in thumb_url:
            ext = ".png"
        
        filepath = os.path.join(OUTPUT_DIR, f"{outfile}{ext}")
        
        print(f"  License: {license_short}")
        print(f"  Thumb: {thumb_w}x{thumb_h}")
        print(f"  URL: {dl_url[:80]}...")
        
        # Download with long delay
        print(f"  Waiting 10s before download...")
        time.sleep(10)
        
        try:
            size = download(dl_url, filepath)
            if size < 100:
                print(f"  WARNING: File only {size} bytes, likely an error page")
                os.remove(filepath)
                continue
            print(f"  ✅ Downloaded: {size / 1024:.1f} KB -> {outfile}{ext}")
            results.append({
                "dino": dino,
                "type": img_type,
                "filename": f"{outfile}{ext}",
                "source_title": title,
                "source_url": f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(title)}",
                "direct_url": dl_url,
                "license": license_short.lower(),
                "license_url": license_url,
                "artist": artist,
                "description": desc,
                "dimensions": f"{thumb_w}x{thumb_h}",
                "file_size_kb": round(size / 1024, 1),
            })
        except Exception as e:
            print(f"  ❌ Failed: {e}")
    
    # Merge with existing
    existing_path = os.path.join(OUTPUT_DIR, "_download_results.json")
    with open(existing_path) as f:
        existing = json.load(f)
    
    existing["downloaded"].extend(results)
    with open(existing_path, "w") as f:
        json.dump(existing, f, indent=2)
    
    print(f"\n\nSUMMARY: Downloaded {len(results)} of {len(REMAINING)} remaining images")
    for r in results:
        print(f"  ✅ {r['filename']}")
    
    # Show final gaps
    all_dl = existing["downloaded"]
    needs = {
        "ankylosaurus": {"portrait", "closeup", "action", "habitat", "secrets"},
        "brachiosaurus": {"portrait", "closeup", "action", "habitat", "secrets"},
        "pteranodon": {"portrait", "closeup", "action", "habitat", "secrets"},
        "spinosaurus": {"portrait", "action", "secrets"},
        "stegosaurus": {"portrait", "closeup", "action", "secrets"},
        "velociraptor": {"action", "secrets", "closeup"},
    }
    total_missing = 0
    for dino, needed in needs.items():
        filled = {d["type"] for d in all_dl if d["dino"] == dino}
        gaps = needed - filled
        if gaps:
            print(f"  ⚠️ {dino}: missing {', '.join(gaps)}")
            total_missing += len(gaps)
        else:
            print(f"  ✅ {dino}: complete")
    
    if total_missing == 0:
        print(f"\n🎉 All {sum(len(v) for v in needs.values())} images sourced!")

if __name__ == "__main__":
    main()
