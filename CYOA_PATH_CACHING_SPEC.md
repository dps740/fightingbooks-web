# CYOA Path Caching Specification
**Priority:** HIGH - Core business model
**Status:** Ready for implementation

---

## Goal
Cache every possible CYOA story path so that:
1. Users get consistent experiences (same choices each visit)
2. All 27 paths per matchup eventually get generated
3. Builds content library over time (business model)

---

## Cache Key Structure

### Current (Standard Books)
```
fightingbooks/cache/{animalA}-vs-{animalB}-neutral.json
```

### New (CYOA)
```
# Decision gates (the 3 sets of choices) - cached once per matchup
fightingbooks/cyoa/{animalA}-vs-{animalB}/gates.json

# Each story path - 27 possible combinations
fightingbooks/cyoa/{animalA}-vs-{animalB}/path-A-A-A.json
fightingbooks/cyoa/{animalA}-vs-{animalB}/path-A-A-B.json
fightingbooks/cyoa/{animalA}-vs-{animalB}/path-A-A-N.json
fightingbooks/cyoa/{animalA}-vs-{animalB}/path-A-B-A.json
... (27 total: 3 choices × 3 gates = 3³)
```

---

## Data Structures

### gates.json (cached once per matchup)
```json
{
  "animalA": "Lion",
  "animalB": "Tiger",
  "createdAt": "2026-02-04T05:00:00Z",
  "gates": [
    {
      "title": "THE STALK BEGINS",
      "intro": "In the sun-drenched savanna...",
      "choices": [
        { "id": "g1-A", "text": "The Lion circles...", "emoji": "🦁", "favors": "A" },
        { "id": "g1-B", "text": "The Tiger crouches...", "emoji": "🐯", "favors": "B" },
        { "id": "g1-N", "text": "Both predators pause...", "emoji": "⚔️", "favors": "neutral" }
      ]
    },
    // ... gates 2 and 3
  ]
}
```

### path-A-B-N.json (one per path)
```json
{
  "path": "A-B-N",
  "animalA": "Lion",
  "animalB": "Tiger",
  "createdAt": "2026-02-04T05:30:00Z",
  "outcomes": [
    {
      "gate": 1,
      "choice": "A",
      "text": "The Lion's strategic circling pays off...",
      "imageUrl": "https://blob.vercel.../outcome-1-A.jpg"
    },
    {
      "gate": 2,
      "choice": "B",
      "text": "The Tiger's ambush catches the Lion off guard...",
      "imageUrl": "https://blob.vercel.../outcome-2-B.jpg"
    },
    {
      "gate": 3,
      "choice": "N",
      "text": "Both animals circle warily...",
      "imageUrl": "https://blob.vercel.../outcome-3-N.jpg"
    }
  ],
  "winner": "Tiger",
  "victoryText": "After an incredible battle...",
  "victoryImageUrl": "https://blob.vercel.../victory-tiger.jpg",
  "finalScore": { "A": 1, "B": 3 }
}
```

---

## Implementation Steps

### Phase 3a: Cache Decision Gates
1. On first CYOA visit for a matchup:
   - Check for `gates.json` in blob storage
   - If not found: generate gates, save to blob
   - If found: load cached gates
2. Display same choices every time for that matchup

### Phase 3b: Cache Outcome Pages
1. When user makes a choice, build path string (e.g., "A")
2. After choice, check if outcome is cached:
   - Key: `path-{currentPath}.json`
   - If partial path exists, load cached outcome
   - If not, generate and cache
3. Track running path through session: "" → "A" → "A-B" → "A-B-N"

### Phase 3c: Pre-generation (Optional)
1. Admin tool to pre-generate all 27 paths
2. Background job: after any CYOA completion, queue generation of sibling paths
3. Popular matchups: pre-generate on deploy

---

## API Changes

### GET /api/book/start (mode=cyoa)
```javascript
// Check for cached gates
const gates = await loadCachedGates(animalA, animalB);
if (!gates) {
  gates = await generateCyoaGates(animalA, animalB);
  await saveCachedGates(animalA, animalB, gates);
}
```

### POST /api/book/choice
```javascript
// Build path from session
const newPath = currentPath + '-' + choiceFavors; // e.g., "A-B"

// Check for cached outcome
const cachedOutcome = await loadCachedOutcome(animalA, animalB, newPath);
if (cachedOutcome) {
  return cachedOutcome;
}

// Generate and cache
const outcome = await generateOutcome(...);
await saveCachedOutcome(animalA, animalB, newPath, outcome);
return outcome;
```

---

## Admin Panel Updates

### Cache Management Tab
Show CYOA books separately:
```
📚 Standard Books
  - Lion vs Tiger (neutral)
  - Gorilla vs Bear (neutral)

🎮 CYOA Books
  - Lion vs Tiger
    - gates.json ✅
    - Paths: 3/27 cached
      - A-A-A ✅
      - A-B-N ✅
      - B-B-B ✅
      - A-A-B ❌ (not yet generated)
      ...
```

### Pre-generate Button
"Generate All Paths" button per matchup (27 API calls)

---

## Session State

Client needs to track:
```javascript
const [cyoaPath, setCyoaPath] = useState('');  // Builds up: '' → 'A' → 'A-B' → 'A-B-N'
```

Pass to API:
```javascript
fetch('/api/book/choice', {
  body: JSON.stringify({
    ...existing,
    currentPath: cyoaPath,  // NEW
  })
});
```

---

## Migration

Existing CYOA sessions (in-progress) won't have cached data.
- Graceful fallback: if no cache, generate fresh (current behavior)
- New sessions will start building cache

---

## Estimated Effort
- Phase 3a (Gates caching): 2-3 hours
- Phase 3b (Outcome caching): 3-4 hours  
- Phase 3c (Pre-generation): 2-3 hours
- Admin updates: 1-2 hours

**Total: ~10-12 hours**

---

## Success Metrics
- Gates load from cache on repeat visits
- Same choices shown for same matchup
- Outcome pages cached per path
- Admin shows path coverage per matchup
