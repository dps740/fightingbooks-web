#!/usr/bin/env python3
"""Fetch dinosaur images from Wikimedia Commons with license verification."""
import json
import os
import sys
import time
import urllib.request
import urllib.parse

OUTPUT_DIR = os.path.expanduser("~/clawd/projects/fightingbooks-web/public/fighters/dino-sourced")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Candidates organized by dinosaur and image type
# Each entry: (wikimedia_filename, intended_type)
CANDIDATES = {
    "ankylosaurus": [
        ("File:Ankylosaurus magniventris reconstruction.png", "portrait"),
        ("File:Ankylosaurus head 47.JPG", "closeup"),
        ("File:Ankylosaurus 73906.JPG", "action"),
        ("File:Hell Creek dinosaurs and pterosaurs by durbed.jpg", "habitat"),
        ("File:Ankylosaurus dinosaur.png", "secrets"),
        ("File:Ankylosaurus magniventris by sphenaphinae.png", "portrait-alt"),
        ("File:Ankylosaurus TD.png", "action-alt"),
    ],
    "brachiosaurus": [
        ("File:Brachiosaurus DB.jpg", "portrait"),
        ("File:Brachiosaurus NT new.jpg", "closeup"),
        ("File:Brachiosaurus BW.jpg", "action"),
        ("File:Brachiosaurus alimentándose del follage.jpg", "habitat"),
        ("File:Macronaria scrubbed enh.jpg", "secrets"),
        ("File:Brachiosaurus altithorax side profile.png", "portrait-alt"),
        ("File:Brachiosaurus-1.jpg", "habitat-alt"),
    ],
    "pteranodon": [
        ("File:Pteranodon cranial anatomy.jpg", "portrait"),
        ("File:Pteranodon cranial anatomy (cropped).jpg", "closeup"),
        ("File:Pteranodontians and mosasaur.jpg", "action"),
        ("File:Chicxulub impact - artist impression.jpg", "secrets"),
        ("File:TTT Cretaceous (2).png", "habitat"),
    ],
    "spinosaurus": [
        ("File:Spinosaurus 2020 reconstruction.jpg", "portrait"),
        ("File:Spinosaurus durbed.jpg", "action"),
        ("File:Spinosaurus life restoration with Onchopristis.jpg", "secrets"),
        ("File:Spinosaurus aegyptiacus by a.r.m.jpg", "portrait-alt"),
        ("File:Spinosaurus by Joschua Knüppe 2020.jpg", "action-alt"),
        ("File:Bahariya Formation McAfee.jpg", "habitat"),
        ("File:Life reconstruction of Spinosaurus aegyptiacus.png", "portrait-alt2"),
        ("File:Spinosaurus aegyptiacus reconstructed as an semi-aquatic animal.jpg", "secrets-alt"),
    ],
    "stegosaurus": [
        ("File:Stegosaurus BW.jpg", "portrait"),
        ("File:Stegosaurus stenops sophie wiki martyniuk.png", "closeup"),
        ("File:Stegosaurus armatus by durbed.jpg", "action"),
        ("File:Stegosaurus junto a la vegetación típica del jurásico..jpg", "habitat"),
        ("File:Stegosaurus et Ceratosaurus.jpg", "secrets"),
        ("File:Stegosaurus ungulatus colored final.png", "portrait-alt"),
        ("File:Stegosaurus and Coelurus.jpg", "action-alt"),
    ],
    "velociraptor": [
        ("File:Velociraptor dinoguy2.jpg", "portrait"),
        ("File:Velociraptor head.png", "closeup"),
        ("File:Velociraptor v. Protoceratops.jpg", "action"),
        ("File:Velociraptor attacking Protoceratops.jpg", "secrets"),
        ("File:Velociraptor mongoliensis jmallon.jpg", "action-alt"),
        ("File:Velociraptor mongoliensis.jpg", "portrait-alt"),
        ("File:Fred Wierum Velociraptor.png", "closeup-alt"),
        ("File:Velociraptor Restoration.png", "action-alt2"),
    ],
}

# Acceptable licenses for commercial use
ACCEPTABLE_LICENSES = {
    "cc-by-4.0", "cc-by-3.0", "cc-by-2.5", "cc-by-2.0", "cc-by-1.0",
    "cc-by-sa-4.0", "cc-by-sa-3.0", "cc-by-sa-2.5", "cc-by-sa-2.0",
    "cc-zero", "pd", "public domain", "gfdl",
    "cc0", "cc-by", "cc-by-sa",
}

def fetch_image_info(titles):
    """Fetch image info for a batch of files from Wikimedia Commons API."""
    # API supports up to 50 titles at once
    encoded_titles = "|".join(titles)
    params = {
        "action": "query",
        "titles": encoded_titles,
        "prop": "imageinfo",
        "iiprop": "url|size|mime|extmetadata",
        "format": "json",
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    
    req = urllib.request.Request(url, headers={
        "User-Agent": "FightingBooksBot/1.0 (educational project)"
    })
    
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
    
    return data.get("query", {}).get("pages", {})


def extract_license(extmetadata):
    """Extract license info from extmetadata."""
    license_short = extmetadata.get("LicenseShortName", {}).get("value", "unknown").lower()
    license_url = extmetadata.get("LicenseUrl", {}).get("value", "")
    artist = extmetadata.get("Artist", {}).get("value", "unknown")
    desc = extmetadata.get("ImageDescription", {}).get("value", "")
    
    # Clean up artist (strip HTML)
    import re
    artist = re.sub(r'<[^>]+>', '', artist).strip()
    
    return {
        "license": license_short,
        "license_url": license_url,
        "artist": artist,
        "description": desc[:200] if desc else "",
    }


def is_license_ok(license_str):
    """Check if a license is acceptable for commercial use.
    
    Acceptable: CC0, CC-BY (any version), CC-BY-SA (any version), Public Domain, GFDL
    NOT acceptable: CC-BY-NC, CC-BY-ND, CC-BY-NC-SA, CC-BY-NC-ND (non-commercial or no-derivatives)
    """
    ls = license_str.lower().strip()
    
    # Reject non-commercial or no-derivatives
    if "nc" in ls or "nd" in ls:
        return False
    
    # Accept these
    acceptable_patterns = [
        "public domain", "pd", "cc0", "cc-zero",
        "cc by", "cc-by",  # CC-BY any version (including CC-BY-SA)
        "gfdl",
    ]
    for pattern in acceptable_patterns:
        if pattern in ls:
            return True
    return False


def download_image(url, filepath):
    """Download an image file."""
    req = urllib.request.Request(url, headers={
        "User-Agent": "FightingBooksBot/1.0 (educational project)"
    })
    with urllib.request.urlopen(req) as resp:
        with open(filepath, "wb") as f:
            f.write(resp.read())
    return os.path.getsize(filepath)


def main():
    results = {}
    all_titles = []
    title_to_dino = {}
    
    for dino, candidates in CANDIDATES.items():
        results[dino] = {}
        for title, img_type in candidates:
            all_titles.append(title)
            title_to_dino[title] = (dino, img_type)
    
    # Batch fetch in groups of 50
    all_info = {}
    for i in range(0, len(all_titles), 50):
        batch = all_titles[i:i+50]
        print(f"Fetching info for batch {i//50 + 1} ({len(batch)} files)...")
        pages = fetch_image_info(batch)
        for page_id, page_data in pages.items():
            title = page_data.get("title", "")
            if "imageinfo" in page_data:
                all_info[title] = page_data["imageinfo"][0]
        time.sleep(1)
    
    # Process results
    report = []
    downloaded = []
    skipped = []
    
    for dino, candidates in CANDIDATES.items():
        print(f"\n=== {dino.upper()} ===")
        needed_types = set()
        if dino == "spinosaurus":
            needed_types = {"portrait", "action", "secrets"}
        elif dino == "stegosaurus":
            needed_types = {"portrait", "closeup", "action", "secrets"}
        elif dino == "velociraptor":
            needed_types = {"action", "secrets", "closeup"}
        else:
            needed_types = {"portrait", "closeup", "action", "habitat", "secrets"}
        
        filled_types = set()
        
        for title, img_type in candidates:
            # Skip alt candidates if primary is filled
            base_type = img_type.split("-")[0]  # "portrait-alt" -> "portrait"
            if base_type in filled_types:
                continue
            if base_type not in needed_types:
                continue
                
            info = all_info.get(title, None)
            if not info:
                print(f"  SKIP {title}: no info found")
                skipped.append((dino, img_type, title, "no info found"))
                continue
            
            ext_meta = info.get("extmetadata", {})
            license_info = extract_license(ext_meta)
            img_url = info.get("url", "")
            width = info.get("width", 0)
            height = info.get("height", 0)
            mime = info.get("mime", "")
            
            # Check license
            if not is_license_ok(license_info["license"]):
                print(f"  SKIP {title}: license '{license_info['license']}' not acceptable")
                skipped.append((dino, img_type, title, f"license: {license_info['license']}"))
                continue
            
            # Check minimum size
            if width < 400 and height < 400:
                print(f"  SKIP {title}: too small ({width}x{height})")
                skipped.append((dino, img_type, title, f"too small: {width}x{height}"))
                continue
            
            # Determine file extension
            ext = ".jpg"
            if "png" in mime:
                ext = ".png"
            elif "svg" in mime:
                ext = ".svg"
            
            out_name = f"{dino}-{base_type}-source{ext}"
            out_path = os.path.join(OUTPUT_DIR, out_name)
            
            print(f"  DOWNLOADING {title}")
            print(f"    License: {license_info['license']}")
            print(f"    Size: {width}x{height}")
            print(f"    -> {out_name}")
            
            try:
                size = download_image(img_url, out_path)
                print(f"    Downloaded: {size / 1024:.1f} KB")
                filled_types.add(base_type)
                downloaded.append({
                    "dino": dino,
                    "type": base_type,
                    "filename": out_name,
                    "source_title": title,
                    "source_url": f"https://commons.wikimedia.org/wiki/{urllib.parse.quote(title)}",
                    "direct_url": img_url,
                    "license": license_info["license"],
                    "license_url": license_info["license_url"],
                    "artist": license_info["artist"],
                    "description": license_info["description"],
                    "dimensions": f"{width}x{height}",
                    "file_size_kb": round(size / 1024, 1),
                })
                time.sleep(0.5)
            except Exception as e:
                print(f"    ERROR: {e}")
                skipped.append((dino, img_type, title, str(e)))
        
        # Report gaps
        missing = needed_types - filled_types
        if missing:
            print(f"  GAPS: {', '.join(missing)}")
    
    # Save results as JSON for the report generator
    with open(os.path.join(OUTPUT_DIR, "_download_results.json"), "w") as f:
        json.dump({
            "downloaded": downloaded,
            "skipped": [(d, t, title, reason) for d, t, title, reason in skipped],
        }, f, indent=2)
    
    print(f"\n\nSUMMARY:")
    print(f"  Downloaded: {len(downloaded)} images")
    print(f"  Skipped: {len(skipped)} candidates")
    
    # Show gaps
    for dino in CANDIDATES:
        if dino == "spinosaurus":
            needed = {"portrait", "action", "secrets"}
        elif dino == "stegosaurus":
            needed = {"portrait", "closeup", "action", "secrets"}
        elif dino == "velociraptor":
            needed = {"action", "secrets", "closeup"}
        else:
            needed = {"portrait", "closeup", "action", "habitat", "secrets"}
        
        filled = {d["type"] for d in downloaded if d["dino"] == dino}
        gaps = needed - filled
        if gaps:
            print(f"  {dino}: MISSING {', '.join(gaps)}")
        else:
            print(f"  {dino}: ✅ all types filled")


if __name__ == "__main__":
    main()
