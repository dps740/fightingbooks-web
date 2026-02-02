# FightingBooks Homepage Specification

## Required Sections (In Order)

### 1. Navigation Bar
- Logo: "🥊 FightingBooks" (left)
- "📚 Battle Guides" link (right)
- Background: `bg-black/20 backdrop-blur-sm`

### 2. Hero Section
- "WHO WOULD WIN?" banner (yellow background, red text, border)
- Subheading: "Create Your Own Battle Book!"
- Tagline: "Inspired by Jerry Pallotta's bestselling series"

### 3. Fighter Selection - Street Fighter 2 Style

**⚠️ CRITICAL: This layout must NEVER be vertical!**

```
┌─────────────────┐      ┌─────────────────┐
│   RED CORNER    │  VS  │  BLUE CORNER    │
│     (LEFT)      │      │     (RIGHT)     │
└─────────────────┘      └─────────────────┘
┌───────────────────────────────────────────┐
│         CHARACTER GRID (BOTTOM)            │
└───────────────────────────────────────────┘
```

- **Layout (STRICT REQUIREMENTS):**
  - **ALWAYS HORIZONTAL:** Red and Blue must be SIDE-BY-SIDE on ALL screen sizes
  - **RED on LEFT, BLUE on RIGHT** - Street Fighter 2 character select style
  - **VS badge in CENTER** between them (not above or below)
  - **Character grid BELOW** the selection boxes (8 columns desktop, 4-6 mobile)
  - **Code:** Use `grid grid-cols-[1fr,auto,1fr]` (3-column grid)
  - **DO NOT:** Use `flex-col`, vertical stacking, or responsive breakpoints that change to vertical
  - **Minimum height:** 250px for red/blue boxes
  - **Equal width:** Both boxes get equal space (1fr each)
  
- **Fighter Grid:**
  - 24+ real animals with photos
  - 8 fantasy creatures
  - "Use Your Imagination" card ($1 custom option)
  
- **Selected Fighter Display:**
  - Shows animal photo as background
  - Name overlaid at bottom
  - "SELECTING" indicator for active corner

### 4. Battle Mode Selection (appears when both fighters selected)
- Header: "⚔️ CHOOSE YOUR BATTLE MODE"
- **Three mode cards:**
  1. 📖 CLASSIC - "Epic battle story"
  2. 🎮 INTERACTIVE - "YOU decide! Make 3 key choices"
  3. 🏆 TOURNAMENT - "8-fighter bracket championship"
- CREATE BOOK button (large, yellow, prominent)

### 5. What's Inside Your Book?
- Header: "📚 WHAT'S INSIDE YOUR BOOK?"
- **Four feature cards:**
  1. 🌍 HABITAT - "Learn where they live and survive"
  2. 🔬 REAL FACTS - "Size, speed, weapons, and abilities"
  3. 📊 TALE OF THE TAPE - "Compare stats like a championship bout"
  4. ⚔️ EPIC BATTLE - "Watch them face off in an illustrated showdown"

### 6. Blog CTA Section
- Background: `bg-black/30`
- Red gradient box with yellow border
- Header: "📚 WANT TO LEARN MORE?"
- Description: "Read in-depth battle guides with real facts, scientific analysis, and expert verdicts!"
- Button: "🔥 READ BATTLE GUIDES" → `/blog`

### 7. Tournament Mode Standalone CTA
- Background: `bg-gradient-to-r from-amber-900 via-yellow-900 to-orange-900`
- Header: "🏆 TOURNAMENT MODE"
- Description: "Pick 8 animals and run a bracket tournament to crown the ultimate champion!"
- Button: "🎮 START TOURNAMENT" → `/tournament`

### 8. Official Books - Amazon Affiliate Section
- Background: `bg-gradient-to-b from-[#232f3e] to-[#131921]`
- Badge: "📚 OFFICIAL BOOK SERIES"
- Header: "GET THE REAL BOOKS!"
- Description: "Jerry Pallotta's bestselling Who Would Win? series — 26+ titles with amazing illustrations by Rob Bolster!"
- **Horizontal scrolling carousel** with book covers
- **Books to include (minimum 8-10):**
  - Lion vs Tiger (0545175712)
  - Killer Whale vs Great White Shark (0545175739)
  - Tyrannosaurus Rex vs Velociraptor (0545175720)
  - Polar Bear vs Grizzly Bear (0545175747)
  - Hammerhead vs Bull Shark (0545301718)
  - Komodo Dragon vs King Cobra (0545301726)
  - Ultimate Shark Rumble (1338672142)
  - Ultimate Ocean Rumble (0545681138)
- Button: "🛒 Shop Full Collection on Amazon"
- Disclaimer: "FightingBooks is a fan project. As an Amazon Associate we earn from qualifying purchases."

### 9. Footer
- Background: `bg-[#0d1f0d]`
- Text: "Made with ❤️ for animal fans • AI-powered educational content"

## Design Consistency Rules

### Colors
- Primary green gradient: `linear-gradient(180deg, #1a472a 0%, #2d5a3d 30%, #1e3d2a 100%)`
- Yellow/Gold: `#FFD700`
- Red: `#CC0000` / `#8B0000`
- Blue: `#0066CC` / `#0047AB`

### Fonts
- Headers: `font-bangers` (Bangers)
- Body: `font-comic` (Comic Neue)

### Border Style
- Book-style borders: `border-[#8B5A2B]` (brown)
- Call-to-action borders: `border-[#FFD700]` (gold)

## Fighter Assets

### Real Animals (24)
1. Lion
2. Tiger
3. Grizzly Bear
4. Polar Bear
5. Gorilla
6. Great White Shark
7. Orca
8. Crocodile
9. Elephant
10. Hippo
11. Rhino
12. Komodo Dragon
13. King Cobra
14. Anaconda
15. Wolf
16. Jaguar
17. Leopard
18. Eagle
19. Wolverine
20. Honey Badger
21. Moose
22. Cape Buffalo
23. Cassowary
24. Python

### Fantasy Creatures (8)
1. Dragon
2. Griffin
3. Hydra
4. Phoenix
5. Cerberus
6. Chimera
7. Manticore
8. Basilisk

## Image Requirements
- All fighter portraits: AI-generated, fierce/dramatic style
- Consistent art style across all 32 fighters
- Saved to: `public/fighters/[name].jpg`
- Aspect ratio: Square (1:1)
- Resolution: 512x512 minimum

## Verification Checklist
Before any homepage deployment:
- [ ] All 9 sections present in order
- [ ] Fighter selection works (click red/blue → grid → select)
- [ ] 3 battle modes visible after selection
- [ ] Blog CTA section present
- [ ] Tournament CTA section present
- [ ] Amazon books carousel present (8+ books)
- [ ] All images loading
- [ ] No broken links
- [ ] Mobile responsive

## Change Log
- 2026-02-02: Initial spec created after accidental section removal
