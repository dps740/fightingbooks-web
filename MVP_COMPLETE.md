# FightingBooks MVP - Complete Documentation

**Status:** ✅ MVP COMPLETE  
**Date:** 2026-02-03  
**Live URL:** https://fightingbooks.vercel.app  
**Repo:** https://github.com/dps740/fightingbooks-web

---

## 🎯 What We Built

A "Who Would Win?" style children's book generator that creates illustrated AI-powered battle books between any two animals.

---

## ✅ Core Features (All Working)

### 1. Book Generation
- **AI Text:** GPT-4o-mini generates educational facts + battle narrative
- **AI Images:** Fal.ai Flux generates 7 battle images per book
- **Structure:** 16-17 pages per book
  - Cover
  - 5 pages per animal (intro, size, weapons, defense, secrets)
  - Stats comparison ("Tale of the Tape")
  - 5 battle scenes
  - Victory page

### 2. Image System
- **Pre-generated educational images:** 39 animals × 5 images = 195 static images
  - Portrait, habitat, action, closeup, secrets
  - Stored in `/public/fighters/`
- **Dynamic battle images:** Generated per matchup
  - Cover, battle1-5, victory (7 images)
  - Stored in Vercel Blob

### 3. Caching (Vercel Blob)
- **Book JSON cache:** Full book data cached after first generation
- **Image cache:** Battle images persisted in Vercel Blob
- **Cache key format:** `v7_{animal1}_vs_{animal2}_{environment}`
- **Result:** Instant loading for repeat matchups

### 4. PDF Generation
- **Method:** Client-side generation (jsPDF)
- **Trigger:** "Download PDF" button on victory page
- **Content:** Same as web book (all pages + images)

### 5. VS Screen Animation
- **Style:** Street Fighter II inspired
- **Flow:** Fighter portraits slide in → "VS" flash → "FIGHT!" → proceed to book
- **Timing:** Auto-proceeds after 3.5 seconds once book is ready

### 6. Admin Tools
- **URL:** `/admin`
- **Features:**
  - View any cached book
  - Regenerate single image (cover, battle1-5, victory)
  - Regenerate entire book
- **Auth:** Simple key (`fightingbooks-admin-2024`)

### 7. Homepage
- **Style:** Street Fighter 2 character select
- **Layout:** Red corner (left) vs Blue corner (right) - always horizontal
- **Fighters:** 39 pre-generated animals in grid below
- **Modes:** Classic, Interactive (CYOA), Tournament (placeholder)

### 8. Blog Section
- **URL:** `/blog`
- **Content:** 16 SEO-optimized battle articles
- **Purpose:** Organic search traffic

### 9. Content Moderation
- **Rate limiting:** Built into API
- **Report button:** On book reader page
- **Blocklist:** Inappropriate word filter

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Fonts | Bangers + Comic Neue |
| AI Text | OpenAI GPT-4o-mini |
| AI Images | Fal.ai Flux Schnell |
| Storage | Vercel Blob |
| Database | Supabase (configured, not heavily used yet) |
| Payments | Stripe (configured, not wired up) |
| Hosting | Vercel |
| Analytics | Vercel Analytics + Speed Insights |

---

## 📁 Key Files

```
src/
├── app/
│   ├── page.tsx                    # Homepage (fighter select)
│   ├── read/
│   │   ├── page.tsx                # Book reader
│   │   └── VersusScreen.tsx        # VS animation
│   ├── blog/                       # Blog section
│   ├── admin/
│   │   └── page.tsx                # Admin UI
│   └── api/
│       ├── book/
│       │   ├── start/route.ts      # Main generation endpoint
│       │   └── choice/route.ts     # CYOA choices
│       ├── admin/
│       │   └── regenerate-image/   # Single image regen
│       └── report/route.ts         # Content reports
├── lib/
│   ├── pdfGenerator.ts             # Server PDF (Puppeteer)
│   └── clientPdfGenerator.ts       # Client PDF (jsPDF)
└── public/
    └── fighters/                   # 195 pre-generated images
```

---

## 🔐 Environment Variables (Vercel)

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | GPT-4o-mini for text |
| `FAL_API_KEY` | Flux for images |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase connection |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin |
| `STRIPE_SECRET_KEY` | Stripe payments |
| `STRIPE_PRICE_ID` | Product price |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe frontend |

---

## 💰 Cost Per Book

| Component | Cost |
|-----------|------|
| Text (GPT-4o-mini) | ~$0.01 |
| Images (Flux × 7) | ~$0.02 |
| **Total** | **~$0.03/book** |

(Educational images are pre-generated, so only battle images cost per book)

---

## 📊 Current State

### Working Perfectly
- ✅ Book generation (text + images)
- ✅ Caching (Vercel Blob)
- ✅ VS screen animation
- ✅ PDF download
- ✅ Admin image regeneration
- ✅ Homepage fighter selection
- ✅ Blog section
- ✅ Mobile responsive

### Configured But Not Wired Up
- ⏸️ Stripe payments (keys set, no checkout flow)
- ⏸️ Supabase auth (configured, no login UI)
- ⏸️ Tier enforcement (no paywall yet)
- ⏸️ CYOA mode (endpoint exists, UI toggle works)
- ⏸️ Tournament mode (placeholder only)

---

## 🎨 39 Pre-Generated Fighters

**Real Animals (32):**
Lion, Tiger, Bear, Wolf, Eagle, Shark, Crocodile, Gorilla, Elephant, Rhino, Hippo, Komodo Dragon, Anaconda, Python, Cobra, Scorpion, Tarantula, Mantis, Octopus, Squid, Orca, Wolverine, Honey Badger, Cheetah, Leopard, Jaguar, Panther, Hyena, Wild Dog, Moose, Bison, Bull

**Dinosaurs (5):**
T-Rex, Velociraptor, Triceratops, Spinosaurus, Ankylosaurus

**Mythical (2):**
Dragon, Griffin

---

## 🚀 Phase 2 Requirements (Next)

1. **User Accounts**
   - Supabase Auth integration
   - Login/signup UI
   - "My Books" saved history

2. **Payment Integration**
   - Stripe checkout flow
   - Tier selection UI
   - Receipt/confirmation emails

3. **Tier Enforcement**
   - Free: 8 animals only
   - Premium ($9.99): All real animals + dinos + PDF
   - Ultimate ($19.99): Everything + CYOA + custom animals

4. **Custom Animals**
   - $0.99 per custom animal
   - User inputs name → AI generates images
   - Saved to "My Animals"

---

## 📝 Admin Quick Reference

| Action | How |
|--------|-----|
| View book | `/read?a={animal1}&b={animal2}` |
| Force regenerate all | Add `&regenerate=true` to URL |
| Regenerate single image | `/admin` → select page → regenerate |
| Check health | Run `~/clawd/scripts/fightingbooks-monitor.sh` |

---

## 📚 Related Docs

- `REQUIREMENTS.md` - Core product requirements
- `HOMEPAGE_SPEC.md` - Homepage visual spec
- `ADMIN_GUIDE.md` - Admin operations guide
- `README.md` - Setup instructions
- Notion: "📊 Business & Financial Plan" - Pricing & projections

---

*MVP completed 2026-02-03. Ready for Phase 2: Accounts & Payments.*
