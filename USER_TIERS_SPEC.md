# User Tiers & Stripe Integration Spec
**Created:** 2026-02-04
**Status:** Ready for implementation

---

## Tier Structure

| Tier | Price | Animals | Static Matchups | CYOA Access |
|------|-------|---------|-----------------|-------------|
| **Unregistered** | $0 | 2 (Lion, Tiger) | 1 (Lion vs Tiger) | ❌ None |
| **Free (registered)** | $0 | 8 | 28 combinations | Lion vs Tiger only |
| **Tier 2 (Real)** | $9.99 | 30 (all real) | 435 combinations | All real matchups |
| **Tier 3 (Ultimate)** | $19.99 | 47 (all) | 1,081 combinations | All matchups |

---

## Animal Categories

### Free Tier Animals (8)
```javascript
const FREE_ANIMALS = [
  'Lion', 'Tiger', 'Grizzly Bear', 'Great White Shark',
  'Gorilla', 'Elephant', 'Crocodile', 'Wolf'
];
```

### Real Animals (30) - Tier 2+
All animals with `category: 'real'` in FIGHTERS array.

### Dinosaurs (8) - Tier 3 only
```javascript
'Tyrannosaurus Rex', 'Velociraptor', 'Triceratops', 'Spinosaurus',
'Stegosaurus', 'Ankylosaurus', 'Pteranodon', 'Brachiosaurus'
```

### Fantasy (9) - Tier 3 only
```javascript
'Dragon', 'Griffin', 'Hydra', 'Phoenix', 'Cerberus',
'Chimera', 'Manticore', 'Basilisk', 'Kraken'
```

---

## Access Rules

### Unregistered Users
- Can ONLY generate: Lion vs Tiger (standard mode)
- No CYOA access
- Prompt to register after viewing book
- Cannot download PDF

### Free (Registered) Users
- Can generate: Any combination of 8 free animals (28 matchups)
- CYOA access: Lion vs Tiger ONLY
- Can download PDFs
- See locked animals with "Upgrade" prompt

### Tier 2 Users ($9.99 one-time)
- Can generate: Any combination of 30 real animals (435 matchups)
- CYOA access: All real animal matchups
- Dinosaurs/fantasy show as locked

### Tier 3 Users ($19.99 one-time)
- Can generate: All 47 animals (1,081 matchups)
- CYOA access: All matchups
- Full access, nothing locked

---

## Database Schema Changes

### Update `profiles` table:
```sql
ALTER TABLE profiles ADD COLUMN tier TEXT DEFAULT 'free';
-- Values: 'free', 'tier2', 'tier3'

ALTER TABLE profiles ADD COLUMN tier_purchased_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN stripe_payment_id TEXT;
```

### Create `purchases` table:
```sql
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  tier TEXT NOT NULL,  -- 'tier2' or 'tier3'
  amount_cents INTEGER NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Changes

### New: `/api/user/tier` (GET)
Returns current user's tier and accessible animals.
```json
{
  "tier": "free",
  "animals": ["Lion", "Tiger", ...],
  "cyoaMatchups": ["lion-vs-tiger"],
  "canUpgradeTo": ["tier2", "tier3"]
}
```

### Update: `/api/checkout/route.ts`
Change from credits to tier purchase:
```javascript
// POST body: { tier: 'tier2' | 'tier3' }
// Creates Stripe checkout for one-time purchase
// Metadata includes: userId, tier
```

### Update: `/api/webhook/route.ts`
On `checkout.session.completed`:
- Update user's tier in profiles table
- Record purchase in purchases table

### Update: `/api/book/start/route.ts`
Add access check:
```javascript
// 1. Parse user from session (or null for unregistered)
// 2. Check if animals are accessible for user's tier
// 3. Check if mode (cyoa) is accessible for matchup
// 4. Return 403 with upgrade prompt if locked
```

---

## UI Changes

### Homepage (`page.tsx`)
1. Add lock icon 🔒 on animals outside user's tier
2. Clicking locked animal shows upgrade modal
3. CYOA mode shows lock if not accessible
4. Add "Upgrade" button in header for free users

### Upgrade Modal
- Show tier comparison table
- "Unlock Real Animals - $9.99" button
- "Unlock Everything - $19.99" button
- Link to Stripe checkout

### Post-Generation Prompt (Unregistered)
After Lion vs Tiger book:
- "Create an account to unlock 8 animals FREE!"
- "Or upgrade for all 47 animals"

### Dashboard Updates
- Show current tier badge
- Show accessible animals count
- Purchase history

---

## Stripe Configuration

### Products to Create in Stripe Dashboard:
1. **Real Animals Pack** - $9.99 (one-time)
   - Product ID: `prod_real_animals`
   - Price ID: `price_tier2`

2. **Ultimate Pack** - $19.99 (one-time)
   - Product ID: `prod_ultimate`
   - Price ID: `price_tier3`

### Webhook Events to Handle:
- `checkout.session.completed` → Update user tier

### Environment Variables:
```
STRIPE_PRICE_TIER2=price_xxx
STRIPE_PRICE_TIER3=price_xxx
```

---

## Implementation Order

### Phase 1: Database & Auth (2-3 hours)
1. Add `tier` column to profiles
2. Create purchases table
3. Update signup to default `tier: 'free'`
4. Create `/api/user/tier` endpoint

### Phase 2: Access Control (2-3 hours)
1. Create `lib/tierAccess.ts` with helper functions
2. Update `/api/book/start` to check access
3. Add 403 responses with upgrade info

### Phase 3: UI Locks (3-4 hours)
1. Add lock icons to animal grid
2. Create upgrade modal component
3. Show CYOA lock for non-accessible matchups
4. Post-generation signup prompt

### Phase 4: Stripe Integration (2-3 hours)
1. Create products in Stripe dashboard
2. Update checkout endpoint for tier purchases
3. Update webhook to set user tier
4. Test full purchase flow

### Phase 5: Polish (1-2 hours)
1. Dashboard tier display
2. Purchase history
3. Email confirmation (optional)

**Total Estimate: 10-15 hours**

---

## Edge Cases

1. **User already has tier, tries to buy lower tier**
   - Show "You already have this!" message
   - Only show upgrade options

2. **Tier 2 user wants Tier 3**
   - Full $19.99 (not $10 upgrade price)
   - Could add upgrade pricing later

3. **Unregistered user tries CYOA**
   - Redirect to signup
   - After signup, redirect back to CYOA

4. **User tries locked animal via direct URL**
   - API returns 403 with tier info
   - UI shows upgrade modal

---

## Success Metrics

- Conversion: Unregistered → Free
- Conversion: Free → Tier 2
- Conversion: Free → Tier 3
- Conversion: Tier 2 → Tier 3
