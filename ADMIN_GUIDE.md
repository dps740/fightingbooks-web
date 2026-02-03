# FightingBooks Admin Guide

## Overview

This guide covers how to manage and fix generated book content, including regenerating bad images and managing the cache.

## Admin Page

**URL:** https://fightingbooks.vercel.app/admin

The admin page provides a simple UI for managing book content.

### Features

1. **View Book** - Open any cached book to review images
2. **Regenerate ALL Images** - Regenerate entire book (all 7 battle images)
3. **Regenerate Single Image** - Fix just one bad image without affecting others

---

## Regenerating Images

### When to Regenerate

Regenerate an image if you see:
- Merged/conjoined animals
- Extra limbs or heads
- Human weapons (swords, guns, armor)
- Anthropomorphic features (animals wearing clothes)
- Anatomically incorrect animals
- Wrong animal features (e.g., tiger with a mane)

### Single Image Regeneration

1. Go to https://fightingbooks.vercel.app/admin
2. Enter both animal names (e.g., "Lion" and "Tiger")
3. Click **"View Book"** to see current images
4. Identify which page has the bad image
5. Select that page from the list:
   - 📕 Cover
   - ⚔️ Battle 1 - Confrontation
   - ⚔️ Battle 2 - First Strike
   - ⚔️ Battle 3 - Counter Attack
   - ⚔️ Battle 4 - Intense Combat
   - ⚔️ Battle 5 - Decisive Moment
   - 🏆 Victory
6. Click **"Regenerate [Page] Image"**
7. Wait ~10 seconds for new image
8. Compare old vs new image shown
9. Click **"View Updated Book"** to verify

### Full Book Regeneration

If multiple images are bad:

1. Go to https://fightingbooks.vercel.app/admin
2. Enter both animal names
3. Click **"Regenerate ALL Images"**
4. Wait ~30 seconds for new book
5. Review all images

**Alternative:** Add `&regenerate=true` to any book URL:
```
https://fightingbooks.vercel.app/read?a=lion&b=tiger&regenerate=true
```

---

## How Caching Works

### Book Cache

- Each animal matchup is cached after first generation
- Cache key format: `v7_{animal1}_vs_{animal2}_{environment}`
- Animals are sorted alphabetically (so "tiger vs lion" = "lion vs tiger")
- Cached in Vercel Blob (persists across deployments)

### Image Cache

- Battle images stored in Vercel Blob
- Pre-generated educational images in `/public/fighters/`
- Educational images (portrait, habitat, action, closeup, secrets) are static
- Battle images (cover, battle1-5, victory) are dynamically generated

### Cache Invalidation

- Single image: Use admin page regeneration
- Full book: Use `?regenerate=true` parameter
- All books: Bump `BOOK_CACHE_VERSION` in code (requires deploy)

---

## Image Generation Details

### Prompts

**Cover:**
```
{animalA} facing {animalB} dramatically, epic showdown, wildlife art
```

**Battle scenes:**
- Battle 1: Tense confrontation, sizing each other up
- Battle 2: First strike, action shot, motion blur
- Battle 3: Counter-attack, fierce battle
- Battle 4: Locked in combat, intense struggle
- Battle 5: Final decisive moment, climactic scene

**Victory:**
```
victorious animal powerful stance after battle, dramatic lighting
```

### Quality Prompts (applied to all)

```
detailed painted wildlife illustration, natural history museum quality art, 
educational wildlife book style, dramatic lighting, detailed fur/scales/feathers texture,
ANATOMICALLY CORRECT: each animal has exactly ONE head and ONE body,
correct number of limbs for species, species-accurate distinctive markings,
realistic proportions, NEVER merge animals together,
each animal is SEPARATE and DISTINCT,
NO human weapons, NO anthropomorphism, NO human clothing,
NO fantasy elements, NO extra limbs or heads, NO conjoined animals
```

### Animal-Specific Features

Some animals have extra prompt guidance to prevent common AI mistakes:

| Animal | Include | Avoid |
|--------|---------|-------|
| Lion | Golden mane, tawny fur | No stripes |
| Tiger | Orange with black stripes | No mane |
| Leopard | Rosette spots | No stripes, no mane |
| Cheetah | Solid black spots, slender | No rosettes |
| Jaguar | Large rosettes with spots inside | Not slender |

---

## Troubleshooting

### "Book not found in cache"

The book hasn't been generated yet. View it normally first:
```
https://fightingbooks.vercel.app/read?a=lion&b=tiger
```

### Images still showing old version

Browser cache. Hard refresh (Ctrl+Shift+R) or clear cache.

### Regeneration fails

Check:
1. Animal names match exactly (case-insensitive)
2. Book exists in cache
3. FAL_API_KEY is set in Vercel env vars

---

## Environment Variables

Required in Vercel:
- `BLOB_READ_WRITE_TOKEN` - For caching (auto-added when Blob store connected)
- `FAL_API_KEY` - For image generation
- `OPENAI_API_KEY` - For text generation

---

## Quick Reference

| Action | How |
|--------|-----|
| View book | `/read?a={animal1}&b={animal2}` |
| Regenerate all | `/read?a={animal1}&b={animal2}&regenerate=true` |
| Admin page | `/admin` |
| Fix single image | Admin page → Select page → Regenerate |

---

*Last updated: 2026-02-03*
