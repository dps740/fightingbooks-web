#!/usr/bin/env python3
"""
Battle content generator for FightingBooks SEO pages.
Generates 1,300+ word markdown articles for animal vs animal matchups.

Usage:
  python3 generate-battle-content.py --slug lion-vs-tiger
  python3 generate-battle-content.py --animals '[["Lion", "Tiger"], ["Gorilla", "Grizzly Bear"]]'
  python3 generate-battle-content.py --batch  # generates all battles in BATCH_LIST
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import date
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
BATTLES_DIR = PROJECT_DIR / "content" / "battles"
FIGHTERS_DATA_PATH = PROJECT_DIR / "data" / "animal-facts.json"
ENV_FILE = PROJECT_DIR / ".env.local"

# Default batch list for --batch mode
BATCH_LIST = [
    ("Lion", "Tiger"),
    ("Gorilla", "Grizzly Bear"),
    ("Orca", "Great White Shark"),
    ("Elephant", "Rhino"),
    ("Hippo", "Crocodile"),
    ("Wolf", "Lion"),
    ("Polar Bear", "Grizzly Bear"),
    ("Jaguar", "Leopard"),
    ("Cheetah", "Lion"),
    ("T-Rex", "Triceratops"),
    ("T-Rex", "Spinosaurus"),
    ("Velociraptor", "T-Rex"),
    ("Gorilla", "Lion"),
    ("Crocodile", "Great White Shark"),
    ("Hippo", "Rhino"),
    ("Anaconda", "Crocodile"),
    ("Tiger", "Grizzly Bear"),
    ("Eagle", "Wolf"),
    ("Hyena", "Lion"),
    ("Walrus", "Polar Bear"),
    ("Elephant", "Hippo"),
    ("Dragon", "T-Rex"),
    ("Griffin", "Eagle"),
    ("Moose", "Wolf"),
    ("Komodo Dragon", "King Cobra"),
]

# All 47 animals in the FightingBooks roster
ALL_ANIMALS = [
    # Real Animals (30)
    "Lion", "Tiger", "Grizzly Bear", "Polar Bear", "Gorilla",
    "Great White Shark", "Orca", "Crocodile", "Elephant", "Hippo",
    "Rhino", "Hammerhead Shark", "King Cobra", "Anaconda", "Wolf",
    "Jaguar", "Leopard", "Eagle", "Giant Panda", "Electric Eel",
    "Moose", "Cape Buffalo", "Great Horned Owl", "Python", "Alligator",
    "Mandrill", "Cheetah", "Hyena", "Walrus", "Octopus",
    # Dinosaurs (8)
    "T-Rex", "Velociraptor", "Triceratops", "Spinosaurus",
    "Stegosaurus", "Ankylosaurus", "Pteranodon", "Brachiosaurus",
    # Fantasy (9)
    "Dragon", "Griffin", "Hydra", "Phoenix", "Cerberus",
    "Chimera", "Manticore", "Basilisk", "Kraken",
]

def generate_all_pairs():
    """Generate every unique (A, B) pair from ALL_ANIMALS. C(47,2) = 1,081 pairs."""
    pairs = []
    for i in range(len(ALL_ANIMALS)):
        for j in range(i + 1, len(ALL_ANIMALS)):
            pairs.append((ALL_ANIMALS[i], ALL_ANIMALS[j]))
    return pairs


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_env():
    """Load env vars from .env.local file."""
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if key not in os.environ:
                    os.environ[key] = val


def get_openai_key():
    load_env()
    key = os.environ.get("OPENAI_API_KEY", "")
    if not key:
        sys.exit("ERROR: OPENAI_API_KEY not found in environment or .env.local")
    return key


def animal_to_slug(name: str) -> str:
    """Convert 'Grizzly Bear' → 'grizzly-bear'."""
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def pair_to_slug(a: str, b: str) -> str:
    return f"{animal_to_slug(a)}-vs-{animal_to_slug(b)}"


def load_animal_facts() -> dict:
    if FIGHTERS_DATA_PATH.exists():
        try:
            return json.loads(FIGHTERS_DATA_PATH.read_text())
        except Exception:
            pass
    return {}


def get_animal_context(name: str, facts: dict) -> str:
    """Return a short JSON blob of known facts for an animal to ground GPT."""
    key = animal_to_slug(name).replace("-", " ")
    for fkey, fval in facts.items():
        if fkey.lower() == key or fval.get("name", "").lower() == name.lower():
            return json.dumps(fval, indent=2)[:1500]
    return ""


# ---------------------------------------------------------------------------
# Content generation
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are an expert zoologist and science writer who creates engaging, 
accurate, SEO-optimised battle analysis articles for a kids/family audience that is also 
read by adults. Your tone is enthusiastic, authoritative, and fun. 
Write at approximately a 7th grade reading level but with accurate scientific facts."""

def build_user_prompt(animal_a: str, animal_b: str, facts_a: str, facts_b: str) -> str:
    year = date.today().year
    slug_a = animal_to_slug(animal_a)
    slug_b = animal_to_slug(animal_b)
    
    facts_section = ""
    if facts_a:
        facts_section += f"\n\nKnown facts about {animal_a}:\n{facts_a}"
    if facts_b:
        facts_section += f"\n\nKnown facts about {animal_b}:\n{facts_b}"

    return f"""Write a 1,300–1,600 word SEO battle article about {animal_a} vs {animal_b}.

The article must follow this EXACT structure with these EXACT markdown headers:

---
title: "{animal_a} vs {animal_b}: Who Would Win in a Fight? ({year})"
description: "Brief 150-character description with a key stat from each animal and a hint at the winner."
keywords: ["{animal_a.lower()} vs {animal_b.lower()}", "who would win", "{animal_a.lower()} vs {animal_b.lower()} fight", "animal battle", "{animal_a.lower()} fight", "{animal_b.lower()} fight"]
date: "{date.today().isoformat()}"
animal_a: "{animal_a}"
animal_b: "{animal_b}"
---

# {animal_a} vs {animal_b}: Who Would Win? ({year})

[One punchy, dramatic opening paragraph — 2-3 sentences that hook the reader with the central tension. No hedging.]

---

## Meet the Fighters

### The {animal_a}

[2-3 sentences describing the animal, its habitat and reputation.]

**Physical Stats:**
- **Weight:** [use ONLY the weight from the Known facts below — do not invent]
- **Length / Height:** [use ONLY the size from the Known facts below]
- **Top Speed:** [use ONLY the speed from the Known facts below]
- **Bite Force / Strength:** [use ONLY bite force / strength from Known facts, or omit if not provided]

**Weapons:**
- [weapon 1 — from Known facts if available]
- [weapon 2]
- [weapon 3]

**Fighting Style:**
[2-3 sentences describing how this animal actually fights — specific tactics, solo vs pack, ambush vs direct, etc.]

### The {animal_b}

[2-3 sentences describing the animal, its habitat and reputation.]

**Physical Stats:**
- **Weight:** [use ONLY the weight from the Known facts below — do not invent]
- **Length / Height:** [use ONLY the size from the Known facts below]
- **Top Speed:** [use ONLY the speed from the Known facts below]
- **Bite Force / Strength:** [use ONLY bite force / strength from Known facts, or omit if not provided]

**Weapons:**
- [weapon 1]
- [weapon 2]
- [weapon 3]

**Fighting Style:**
[2-3 sentences describing how this animal actually fights.]

---

## Tale of the Tape

| Stat | {animal_a} | {animal_b} | Advantage |
|------|-----------|-----------|-----------|
| Weight | [value] | [value] | [winner or "Even"] |
| Length / Size | [value] | [value] | [winner or "Even"] |
| Speed | [value] | [value] | [winner or "Even"] |
| Bite Force / Strength | [value] | [value] | [winner or "Even"] |
| Special Weapons | [value] | [value] | [winner or "Even"] |
| Fighting Experience | [value] | [value] | [winner or "Even"] |

---

## The Battle

[4 paragraphs of vivid, present-tense narrative. Describe a realistic fight scenario. Be specific about tactics used, how each animal attacks and defends. Build tension. Make it feel like a wildlife documentary. Include specific detail like "a 1,200-pound gorilla" rather than just "the gorilla". End with a clear outcome.]

---

## The Verdict

**Winner: [Animal Name]**

[2-3 paragraphs explaining the reasoning. Reference specific stats from the table. Acknowledge what the loser does well. Give odds like "7 out of 10 fights". Then add a "But what if they fought in [alternate environment]?" twist paragraph that flips the result.]

---

## FAQ

**Could a {animal_a} kill a {animal_b}?**
[2-3 sentence answer with specifics]

**Who is stronger, a {animal_a} or a {animal_b}?**
[2-3 sentence answer comparing strength metrics]

**What are the odds in a {animal_a} vs {animal_b} fight?**
[2-3 sentence answer giving a probability estimate and why]

**Has a {animal_a} ever fought a {animal_b} in real life?**
[2-3 sentence answer — historical encounters, zoo incidents, or realistic speculation]

---

*Generate your own {animal_a} vs {animal_b} illustrated battle book at whowouldwinbooks.com*{facts_section}

⚠️ STATS ACCURACY — CRITICAL:
- Use ONLY the numerical values from "Known facts" above (weight, speed, bite force, weapons)
- Do NOT round up, exaggerate, or invent statistics — even if you think you know them
- If a stat isn't in the Known facts, use a conservative real-world estimate and flag it with "(approx.)"
- Wrong stats erode the site's credibility with readers who know these animals

OTHER RULES:
- The article must be at least 1,300 words
- Include the YAML frontmatter block exactly as shown above (between --- delimiters)
- Do not add any text before the opening --- frontmatter delimiter
- Use only the headers shown — do not invent new sections"""


def generate_content(animal_a: str, animal_b: str, api_key: str, facts: dict) -> str:
    """Call OpenAI API and return the generated markdown."""
    import urllib.request
    import urllib.error

    facts_a = get_animal_context(animal_a, facts)
    facts_b = get_animal_context(animal_b, facts)
    user_prompt = build_user_prompt(animal_a, animal_b, facts_a, facts_b)

    payload = {
        "model": "gpt-4o-mini",
        "temperature": 0.7,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    }

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
            return result["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"OpenAI API error {e.code}: {body}")


def save_content(slug: str, content: str) -> Path:
    """Save generated content to content/battles/{slug}.md."""
    BATTLES_DIR.mkdir(parents=True, exist_ok=True)
    filepath = BATTLES_DIR / f"{slug}.md"
    filepath.write_text(content, encoding="utf-8")
    return filepath


def generate_pair(animal_a: str, animal_b: str, api_key: str, facts: dict, force: bool = False) -> bool:
    """Generate content for one pair. Returns True on success."""
    slug = pair_to_slug(animal_a, animal_b)
    out_path = BATTLES_DIR / f"{slug}.md"

    if out_path.exists() and not force:
        print(f"  ⏭  Skipping {slug} (already exists, use --force to overwrite)")
        return True

    print(f"  ⚔️  Generating: {animal_a} vs {animal_b} → {slug}.md")
    try:
        content = generate_content(animal_a, animal_b, api_key, facts)
        path = save_content(slug, content)
        words = len(content.split())
        print(f"  ✅  Saved {path.name} ({words} words)")
        return True
    except Exception as exc:
        print(f"  ❌  Failed: {exc}")
        return False


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def parse_slug(slug: str):
    """Parse 'lion-vs-tiger' into ('Lion', 'Tiger')."""
    vs_idx = slug.index("-vs-")
    raw_a = slug[:vs_idx]
    raw_b = slug[vs_idx + 4:]
    to_name = lambda s: " ".join(w.capitalize() for w in s.split("-"))
    return to_name(raw_a), to_name(raw_b)


def main():
    parser = argparse.ArgumentParser(description="Generate FightingBooks battle content")
    parser.add_argument("--slug", help='Slug like "lion-vs-tiger"')
    parser.add_argument("--animals", help='JSON array of pairs: [["Lion","Tiger"],...]')
    parser.add_argument("--batch", action="store_true", help="Generate all battles in BATCH_LIST")
    parser.add_argument("--all-matchups", action="store_true", help="Generate ALL 1,081 matchups (skips existing files)")
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    args = parser.parse_args()

    api_key = get_openai_key()
    facts = load_animal_facts()
    BATTLES_DIR.mkdir(parents=True, exist_ok=True)

    if args.slug:
        animal_a, animal_b = parse_slug(args.slug)
        success = generate_pair(animal_a, animal_b, api_key, facts, force=args.force)
        sys.exit(0 if success else 1)

    elif args.animals:
        pairs = json.loads(args.animals)
        total = len(pairs)
        successes = 0
        for i, pair in enumerate(pairs, 1):
            animal_a, animal_b = pair[0], pair[1]
            print(f"\n[{i}/{total}]", end=" ")
            ok = generate_pair(animal_a, animal_b, api_key, facts, force=args.force)
            if ok:
                successes += 1
            if i < total:
                time.sleep(1)  # rate limiting courtesy delay
        print(f"\n✅  Done: {successes}/{total} generated successfully")

    elif args.batch:
        total = len(BATCH_LIST)
        successes = 0
        for i, (animal_a, animal_b) in enumerate(BATCH_LIST, 1):
            print(f"\n[{i}/{total}]", end=" ")
            ok = generate_pair(animal_a, animal_b, api_key, facts, force=args.force)
            if ok:
                successes += 1
            if i < total:
                time.sleep(1)  # courtesy delay
        print(f"\n✅  Done: {successes}/{total} generated successfully")

    elif args.all_matchups:
        all_pairs = generate_all_pairs()
        total = len(all_pairs)
        # Count already-done so progress is accurate
        existing = sum(
            1 for a, b in all_pairs
            if (BATTLES_DIR / f"{pair_to_slug(a, b)}.md").exists()
        )
        print(f"🚀  Generating all {total} matchups ({existing} already exist, will skip)")
        successes = 0
        skipped = 0
        failed = 0
        for i, (animal_a, animal_b) in enumerate(all_pairs, 1):
            slug = pair_to_slug(animal_a, animal_b)
            if (BATTLES_DIR / f"{slug}.md").exists() and not args.force:
                skipped += 1
                continue
            print(f"\n[{i}/{total}]", end=" ")
            ok = generate_pair(animal_a, animal_b, api_key, facts, force=args.force)
            if ok:
                successes += 1
            else:
                failed += 1
            time.sleep(0.5)  # gentle rate-limit buffer

        print(f"\n✅  All done!")
        print(f"   Generated: {successes}  |  Skipped (existing): {skipped}  |  Failed: {failed}")

        # Auto-commit and push if anything was generated
        if successes > 0:
            import subprocess
            print("\n📦  Committing and pushing to GitHub...")
            try:
                subprocess.run(
                    ["git", "add", "content/battles/"],
                    cwd=str(BATTLES_DIR.parent.parent),
                    check=True,
                )
                subprocess.run(
                    ["git", "commit", "-m",
                     f"content: add {successes} battle pages (bulk generation)"],
                    cwd=str(BATTLES_DIR.parent.parent),
                    check=True,
                )
                subprocess.run(
                    ["git", "push", "origin", "main"],
                    cwd=str(BATTLES_DIR.parent.parent),
                    check=True,
                )
                print("🚀  Pushed to GitHub — Vercel will deploy automatically")
            except subprocess.CalledProcessError as e:
                print(f"⚠️  Git push failed: {e} — run manually: git add content/battles/ && git commit && git push")

    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
