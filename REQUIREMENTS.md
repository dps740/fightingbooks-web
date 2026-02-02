# FightingBooks Requirements

**Last Updated:** 2026-02-02 06:50 UTC  
**Purpose:** Central requirements document to prevent regressions

---

## 🎯 Core Product Requirements

### Book Content Structure (5+5+5)
**Both web and PDF must have identical structure:**

**Per Animal (5 pages each = 10 total):**
1. **Introduction** - Name, scientific name, basic facts
2. **Habitat** - Where they live and range
3. **Diet & Hunting** - What they eat, how they hunt
4. **Weapons & Defenses** - Arsenal breakdown
5. **Fun Facts** - Amazing/weird facts

**Battle (5 pages):**
1. **Tale of the Tape** - Numerical stats comparison (strength, speed, weapons, defense)
2. **Battle Scene 1** - Opening confrontation
3. **Battle Scene 2** - First strike
4. **Battle Scene 3** - Counter-attack
5. **Battle Scene 4** - Momentum shift
6. **Battle Scene 5** - Decisive finale
7. **Victory Page** - Winner announced + educational message

**Total:** 16-17 pages per book (cover + 10 animal pages + 5-6 battle pages + victory)

### PDF Generation (Option 3 - Current Implementation)

**Requirements:**
1. ✅ PDF generates **alongside** web book (not separately)
2. ✅ **Same content** as web book (5+5+5 structure)
3. ✅ **Cached together:** `{cacheKey}.json` + `{cacheKey}.pdf`
4. ✅ **Instant download:** Serves cached PDF (no regeneration)
5. ✅ **First generation:** +5-10 seconds (acceptable)
6. ✅ **Tool:** Puppeteer (HTML → PDF conversion)

**Files:**
- Generator: `/src/lib/pdfGenerator.ts`
- API: `/src/app/api/book/start/route.ts` (creates both)
- Download: `/src/app/api/book/download/route.ts` (serves cached)

**Cache Location:**
```
public/cache/
├── lion_vs_tiger_neutral.json
├── lion_vs_tiger_neutral.pdf  ← Generated at same time
```

### Homepage Layout (Street Fighter 2 Style)

**⚠️ MOST IMPORTANT VISUAL REQUIREMENT:**

```
[  RED CORNER  ]  VS  [  BLUE CORNER  ]
    (LEFT)            (RIGHT)
────────────────────────────────────────
[     CHARACTER GRID (BOTTOM)        ]
```

**STRICT RULES:**
1. **ALWAYS horizontal** - NEVER vertical stack
2. **RED on LEFT, BLUE on RIGHT** at all screen sizes
3. **VS badge in CENTER** between them
4. **Character grid BELOW** (not embedded in boxes)
5. **Code:** `grid grid-cols-[1fr,auto,1fr]`
6. **No responsive breakpoints** that change to vertical

**Reference:** `HOMEPAGE_SPEC.md` for full homepage requirements

---

## 📱 User Flows

### Standard Book Generation
1. User selects Fighter A (red corner)
2. User selects Fighter B (blue corner)
3. User chooses battle mode (Classic/Interactive/Tournament)
4. Click "CREATE BOOK"
5. System generates:
   - Web book (interactive pages)
   - PDF (cached for download)
6. User reads on screen OR downloads PDF

### Download Flow
1. User clicks "Download PDF" on victory page
2. System checks cache: `public/cache/{cacheKey}.pdf`
3. If exists: Instant download
4. If not exists: Error (user must generate book first)

---

## 🎨 Design System

### Colors
- **Primary:** Green gradient `linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)`
- **Accents:** 
  - Gold/Yellow: `#FFD700`
  - Red: `#CC0000` / `#8B0000`
  - Blue: `#0066CC` / `#0047AB`
- **Borders:**
  - Book-style: `#8B5A2B` (brown)
  - CTA: `#FFD700` (gold)

### Typography
- **Headers:** Bangers (`font-bangers`)
- **Body:** Comic Neue (`font-comic`)

### Spacing
- Section padding: `py-6` to `py-12`
- Card padding: `p-6` to `p-8`
- Grid gaps: `gap-4` to `gap-8`

---

## 🔒 Content Moderation

### Rate Limiting
- **3 generations per hour** per IP
- Prevents abuse of AI generation
- Clear error message when exceeded

### Content Filtering
- Block inappropriate animal names
- Allow fantasy creatures
- "$1 custom" option for user imagination (paywalled)

---

## 📊 Analytics & Monitoring

### Required Tracking
- Page views (Vercel Analytics)
- Book generations (count + animal pairs)
- Download clicks
- Battle mode selection
- Error rates

### Health Monitoring
- Homepage uptime
- Blog page status
- API endpoints health
- Book generation success rate

**Health check script:** `~/clawd/scripts/fightingbooks-monitor.sh`

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All 9 homepage sections present (see `HOMEPAGE_SPEC.md`)
- [ ] Fighter selection is horizontal (RED LEFT, BLUE RIGHT)
- [ ] Character grid below (not embedded)
- [ ] 3 battle modes visible after selection
- [ ] All fighter images loading (32 real + fantasy)
- [ ] Blog CTA section present
- [ ] Tournament CTA present
- [ ] Amazon books carousel (8+ books)

### Post-Deployment
- [ ] Generate test book (Lion vs Tiger)
- [ ] Verify PDF downloads instantly
- [ ] Check PDF content matches web (5+5+5 structure)
- [ ] Test on mobile (horizontal layout preserved)
- [ ] Verify all links working
- [ ] Check analytics tracking

---

## 🐛 Known Issues

### Resolved
- ✅ PDF mismatch with web content (fixed 2026-02-02)
- ✅ Missing homepage sections (spec created 2026-02-02)

### Monitoring
- ⚠️ Puppeteer memory usage (monitor in production)

---

## 📚 Reference Documents

- **Homepage:** `HOMEPAGE_SPEC.md` - Complete visual/section requirements
- **PDF Upgrade:** `FIGHTINGBOOKS_PDF_UPGRADE.md` - Option 3 implementation
- **Session State:** `/home/ubuntu/clawd/SESSION_STATE.md` - Current work status

---

## 🔄 Change Log

### 2026-02-02
- ✅ Implemented Option 3 PDF generation (alongside web)
- ✅ Created `HOMEPAGE_SPEC.md` to prevent regressions
- ✅ Created this `REQUIREMENTS.md` document
- ✅ Updated fighter selection layout requirements (horizontal only)

### 2026-01-31
- ✅ Built homepage with 9 sections
- ✅ Generated 39 AI fighter portraits
- ✅ Implemented Street Fighter 2 style layout
