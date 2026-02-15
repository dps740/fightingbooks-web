# WhoWouldWinBooks.com — Pinterest + SEO Execution Plan

**Created:** 2026-02-14
**Status:** Ready to execute

---

## Part 1: SEO Audit Findings & Fixes

### 🔴 Critical Issues

#### 1. Three articles are unreachable (404)
**Files exist but aren't in `VALID_SLUGS` in `src/app/blog/[slug]/page.tsx`:**
- `honey-badger-vs-lion.md` — not in VALID_SLUGS
- `komodo-dragon-vs-king-cobra.md` — not in VALID_SLUGS  
- `who-would-win-complete-guide.md` — not in VALID_SLUGS

**Fix:** Add to `ARTICLE_ANIMALS` mapping in `src/app/blog/[slug]/page.tsx`:
```typescript
'honey-badger-vs-lion': ['Honey Badger', 'Lion'],
'komodo-dragon-vs-king-cobra': ['Komodo Dragon', 'King Cobra'],
'who-would-win-complete-guide': undefined,
```
**Effort:** 5 minutes | **Impact:** High (3 articles getting zero traffic)

#### 2. Most articles lack frontmatter metadata
Only 4 of 19 articles have YAML frontmatter (title, description, keywords). The other 15 rely on extracting H1 and first italic line — which produces weak meta descriptions.

**Articles without frontmatter:** All battle articles (anaconda-vs-crocodile, crocodile-vs-shark, elephant-vs-rhino, gorilla-vs-bear, gorilla-vs-lion, hippo-vs-crocodile, hippo-vs-rhino, honey-badger-vs-lion, jaguar-vs-leopard, komodo-dragon-vs-king-cobra, lion-vs-tiger, orca-vs-great-white-shark, polar-bear-vs-grizzly-bear, tiger-vs-bear, wolf-vs-lion)

**Fix:** Add frontmatter to all 15 articles. Example for `lion-vs-tiger.md`:
```yaml
---
title: "Lion vs Tiger: Who Would Win in a Fight? (2026 Analysis)"
description: "Lion vs Tiger breakdown with real stats — size, speed, bite force, fighting style. Science-backed analysis of who wins this classic animal battle."
keywords: ["lion vs tiger", "lion vs tiger who would win", "lion or tiger who would win", "lion vs tiger fight"]
date: "2026-02-08"
---
```
**Effort:** 1 hour | **Impact:** High (proper meta descriptions = better CTR from Google)

#### 3. Blog page metadata: `generateMetadata` uses italic subtitle as description
**File:** `src/app/blog/[slug]/page.tsx` line ~89
The description falls back to the first `*italic*` line which is a creative subtitle, not an SEO description.

**Fix:** Update `getArticleData()` to parse YAML frontmatter (use `gray-matter` package) and prefer frontmatter description over italic extraction.
**Effort:** 30 minutes | **Impact:** High

### 🟡 Important Issues

#### 4. No JSON-LD structured data
No Article schema, no FAQ schema, no BreadcrumbList. These help with rich snippets in Google.

**Fix:** Add to `src/app/blog/[slug]/page.tsx`:
```tsx
<script type="application/ld+json">
{JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.metadata.title,
  "description": article.metadata.description,
  "url": `https://whowouldwinbooks.com/blog/${slug}`,
  "publisher": { "@type": "Organization", "name": "Who Would Win Books" },
  "datePublished": "2026-02-08"
})}
</script>
```
Also add FAQPage schema to battle articles (extract Q&A sections).
**Effort:** 1 hour | **Impact:** Medium-High (rich snippets increase CTR 20-30%)

#### 5. No canonical URLs on blog articles
`layout.tsx` has `alternates.canonical: "/"` globally, but individual articles don't set their own canonical.

**Fix:** In `generateMetadata` for blog slugs:
```typescript
alternates: { canonical: `/blog/${slug}` },
```
**Effort:** 5 minutes | **Impact:** Medium

#### 6. No `/matchups` index page
A page listing all possible animal matchups (47 × 46 / 2 = 1,081 combos) would be a massive SEO magnet for "[animal] vs [animal]" long-tail searches.

**Fix:** Create `src/app/matchups/page.tsx`:
- Grid of all matchup combinations
- Each links to either existing blog article (if one exists) or the book generator with animals pre-selected
- Include H1: "Animal Matchups — Who Would Win?"
- Filter by category (Real, Dinosaur, Fantasy)

**Effort:** 2-3 hours | **Impact:** Very High (captures thousands of long-tail "[X] vs [Y]" searches)

#### 7. Related articles aren't contextually relevant
Currently shows first 4 slugs from VALID_SLUGS that aren't the current article. Should show articles with shared animals.

**Fix:** Filter related articles by shared animals in the matchup.
**Effort:** 30 minutes | **Impact:** Medium (reduces bounce, increases pages/session)

#### 8. Sitemap fallback URL is wrong
`src/app/sitemap.ts` falls back to `https://fightingbooks.vercel.app` if `NEXT_PUBLIC_SITE_URL` isn't set.

**Fix:** Change fallback to `https://whowouldwinbooks.com`
**Effort:** 1 minute | **Impact:** Low (env var is set in production, but safety net)

#### 9. No Pinterest meta tags
No `<meta property="og:pin_description">` or Pinterest-specific tags. No Rich Pin validation.

**Fix:** Add to `layout.tsx` head or per-page metadata:
```html
<meta name="pinterest-rich-pin" content="true" />
```
And ensure all OG tags are complete (they mostly are).
**Effort:** 10 minutes | **Impact:** Medium (enables Rich Pins)

### 🟢 Keyword Gap Opportunities

#### High-value keywords NOT currently targeted:

| Keyword | Est. Volume | Current Coverage | Action |
|---------|------------|-----------------|--------|
| "who would win printable" | 500/mo | ❌ None | Create printable worksheet page |
| "who would win worksheet" | 800/mo | ❌ None | Same — printable worksheets |
| "who would win activities" | 400/mo | 🟡 Partial (classroom-resources) | Add "activities" to title |
| "animal vs animal for kids" | 300/mo | ❌ None | Add "for kids" to battle articles |
| "who would win reading level" | 600/mo | 🟡 Partial (book-list) | Add reading level section |
| "t-rex vs [animal]" | 2k/mo+ | ❌ None | Create dinosaur battle articles |
| "who would win pdf" | 300/mo | ❌ None | Offer downloadable battle cards |

#### New content to create (priority order):
1. **Dinosaur battle articles** (T-Rex vs Triceratops, T-Rex vs Spinosaurus, etc.) — huge search volume
2. **Printable battle cards / worksheets** — "printable" keywords are purchase-intent for educators
3. **"Who Would Win Reading Level" guide** — parents search this before buying
4. **More battle articles** from top-volume matchups not yet covered:
   - Eagle vs Hawk
   - Cheetah vs Leopard
   - T-Rex vs Spinosaurus
   - Shark vs Crocodile (exists but could be expanded)

### 🔧 Technical SEO Checklist

- [ ] Fix VALID_SLUGS (3 missing articles)
- [ ] Add frontmatter to all 15 battle articles
- [ ] Install `gray-matter` and update markdown parsing
- [ ] Add JSON-LD Article schema
- [ ] Add canonical URLs per article
- [ ] Create `/matchups` page
- [ ] Fix sitemap fallback URL
- [ ] Add Pinterest meta tag
- [ ] Fix related articles logic
- [ ] Verify Google Search Console is set up (⚠️ unknown — check with David)
- [ ] Submit sitemap to Google Search Console
- [ ] Add `<meta name="google-site-verification">` if needed

---

## Part 2: Pinterest Strategy

### Account Setup

1. **Create Pinterest Business Account**
   - Go to business.pinterest.com
   - Sign up with scoutyscout9@gmail.com (or David's preferred email)
   - Business name: "Who Would Win Books"
   - Category: Education / Kids / Books
   
2. **Claim Website**
   - Add HTML meta tag or upload verification file to `public/`
   - Enables Rich Pins and attribution

3. **Enable Rich Pins**
   - Requires proper OG tags (mostly done — need to validate)
   - Apply at developers.pinterest.com/tools/url-debugger/

4. **Create Boards:**
   - "Who Would Win — Animal Battles" (main board)
   - "Lion vs Tiger & Big Cat Battles"
   - "Ocean Predators — Shark vs Orca"
   - "Bear Battles — Grizzly vs Polar Bear"
   - "Dinosaur Battles"
   - "Fantasy Creature Battles"
   - "Educational Animal Activities"
   - "Classroom Resources — Animal Science"
   - "Kids Books About Animals"

### Pin Content Strategy

#### Volume Opportunity
- 47 fighters = **1,081 unique matchup combinations**
- Each matchup = 1 pin minimum (2-3 variations = 2,000-3,000 pins)
- Plus: educational pins, book list pins, worksheet pins

#### Pin Format

**Image specs:**
- Size: 1000×1500px (2:3 ratio — Pinterest optimal)
- Format: Bold, colorful, text overlay
- Template: Split-screen with two animals, "VS" in center, "WHO WOULD WIN?" text
- Style: Match site's dark/gold aesthetic

**Pin anatomy:**
```
┌─────────────────────┐
│   WHO WOULD WIN?    │  ← Bold header
│                     │
│  🦁      VS     🐯 │  ← Animal images/emojis
│  LION         TIGER │  ← Animal names
│                     │
│  "Find out who wins │  ← Hook text
│   in this epic      │
│   animal battle!"   │
│                     │
│ whowouldwinbooks.com│  ← URL branding
└─────────────────────┘
```

**Title format:** "[Animal 1] vs [Animal 2]: Who Would Win? 🦁🐯"
**Description format:** "Who wins — [Animal 1] or [Animal 2]? Compare size, speed, bite force, and weapons in this epic animal battle. Perfect for kids who love animals! Read the full breakdown → #WhoWouldWin #AnimalBattle #KidsScience #AnimalsForKids"

**Link destination:**
- If blog article exists → `/blog/[slug]`
- If no article → `/?animal1=[X]&animal2=[Y]` (homepage with pre-selection)

#### Pin Categories (by content type)

1. **Battle Pins** (1,081+ pins) — "X vs Y: Who Would Win?"
2. **Fact Pins** (47 pins) — "5 Amazing Facts About [Animal]"
3. **Comparison Pins** (47 pins) — "[Animal] Stats Card" (like a trading card)
4. **Educational Pins** (10-20) — "Free Animal Battle Worksheets" / "Classroom Activities"
5. **Book Pins** (35+) — Cover images linking to book list article

### Batch Pin Creation

#### Image Generation Approach
Use our existing FAL.ai integration to generate pin images:
1. Create a pin template in HTML/CSS (or Canva template)
2. Script to generate all 1,081 matchup images
3. Use animal images we already have on the site, or generate simple illustrations

**Recommended tool: Canva Bulk Create**
- Upload a CSV with animal1, animal2, title, description
- Apply template to all rows
- Export all pins at once
- Free tier supports this

**Alternative: Programmatic with Node.js**
- Use `@napi-rs/canvas` or `sharp` to compose pin images
- Template: background + animal images + text overlays
- Script generates all 1,081 images to a folder

#### Scheduling Approach

**Tool: Tailwind (tailwindapp.com)**
- Best Pinterest scheduler
- SmartSchedule picks optimal times
- $15/mo for 1 account, 100 pins/mo
- Bulk upload via CSV

**Alternative: Pinterest API (free, DIY)**
- Apply for API access at developers.pinterest.com
- Rate limit: ~1,000 pins/day
- Script to upload + schedule pins over 30 days
- More effort but free and fully automated

**Posting cadence:**
- Start: 10-15 pins/day (first 2 weeks)
- Ramp: 20-30 pins/day (weeks 3-4)  
- Cruise: 10-15 pins/day ongoing (fresh + repins)
- Never post all 1,081 at once — Pinterest penalizes bulk spam

---

## Part 3: Priority Execution Plan

### Phase 1: Quick Wins (Week 1) — ~4 hours
| # | Task | File(s) | Effort |
|---|------|---------|--------|
| 1 | Fix VALID_SLUGS — add 3 missing articles | `src/app/blog/[slug]/page.tsx` | 5 min |
| 2 | Fix sitemap fallback URL | `src/app/sitemap.ts` | 1 min |
| 3 | Add canonical URLs to blog articles | `src/app/blog/[slug]/page.tsx` | 5 min |
| 4 | Add frontmatter to all 15 battle articles | `content/articles/*.md` | 1 hr |
| 5 | Install gray-matter, parse frontmatter | `src/app/blog/[slug]/page.tsx`, `package.json` | 30 min |
| 6 | Add JSON-LD Article schema | `src/app/blog/[slug]/page.tsx` | 30 min |
| 7 | Add Pinterest meta tag | `src/app/layout.tsx` | 5 min |
| 8 | Fix related articles logic | `src/app/blog/[slug]/page.tsx` | 30 min |

### Phase 2: Content Expansion (Week 2) — ~6 hours
| # | Task | Effort |
|---|------|--------|
| 1 | Create `/matchups` index page | 2-3 hrs |
| 2 | Write 3 dinosaur battle articles (T-Rex focused) | 2 hrs |
| 3 | Create printable battle card template | 1 hr |

### Phase 3: Pinterest Launch (Week 2-3) — ~8 hours
| # | Task | Effort |
|---|------|--------|
| 1 | Set up Pinterest Business account | 30 min |
| 2 | Claim + verify website | 30 min |
| 3 | Create boards | 30 min |
| 4 | Design pin image template | 1 hr |
| 5 | Build pin image generation script | 3 hrs |
| 6 | Generate first batch (100 priority matchups) | 1 hr |
| 7 | Set up Tailwind or Pinterest API scheduler | 1 hr |
| 8 | Begin posting (10-15/day) | Ongoing |

### Phase 4: Scale (Week 4+) — Ongoing
| # | Task | Effort |
|---|------|--------|
| 1 | Generate remaining 981 matchup pin images | 2 hrs |
| 2 | Write 5 more battle articles (keyword-driven) | 3 hrs |
| 3 | Create printable worksheets for classroom keywords | 2 hrs |
| 4 | Set up Google Search Console (if not done) | 30 min |
| 5 | Monitor Pinterest analytics, double down on winners | Ongoing |

---

## Key Metrics to Track

**SEO:**
- Google Search Console: impressions, clicks, average position
- Target: 1,000 organic clicks/month within 3 months
- Key pages: battle articles, matchups page, book list

**Pinterest:**
- Monthly views, saves, outbound clicks
- Target: 100k monthly views within 3 months
- Top performing pin formats and matchups
- Click-through rate to site

---

## Summary

**Total estimated effort to full execution: ~20 hours over 4 weeks**

The biggest ROI items:
1. **Fix 3 missing articles** (5 min → instant traffic recovery)
2. **Create /matchups page** (3 hrs → captures 1000s of long-tail searches)
3. **Pinterest pin generation** (5 hrs → 1,081 pins driving traffic indefinitely)
4. **Add frontmatter + structured data** (2 hrs → better CTR from Google)

All of these are things we can execute without David's input, except:
- ⚠️ **Google Search Console** — need to check if it's set up (may need David's Google account)
- ⚠️ **Pinterest account** — need David to decide which email to use
- ⚠️ **Tailwind subscription** — $15/mo, needs David's approval (or use free Pinterest API)
