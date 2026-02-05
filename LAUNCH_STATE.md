# FightingBooks Launch State
**Date:** 2026-02-05 03:50 UTC (8:50 PM MT)
**Site:** https://whowouldwinbooks.com
**Status:** 🟢 LIVE

---

## Infrastructure

| Component | Status | Details |
|-----------|--------|---------|
| Domain | ✅ Live | whowouldwinbooks.com (Vercel) |
| SSL | ✅ Valid | Let's Encrypt, auto-renewing |
| Hosting | ✅ Vercel | Auto-deploy from GitHub main branch |
| Database | ✅ Supabase | jezhpdzptxgncvksdrzz.supabase.co |
| Payments | ✅ Stripe LIVE | Real payments enabled |
| AI Text | ✅ OpenAI | GPT-4o-mini for story generation |
| AI Images | ✅ FAL.ai | Flux for fighter/scene images |
| Blob Storage | ✅ Vercel Blob | Book data storage |

## GitHub Repository
- **Repo:** https://github.com/dps740/fightingbooks-web
- **Branch:** main (auto-deploys to Vercel)
- **Latest commit:** d5ae676 - "fix: Allow deselecting fighters by clicking them again in single battle"

## Vercel Environment Variables
All set for production/preview/development:
- `NEXT_PUBLIC_SITE_URL` — Site URL
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase public key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin key
- `OPENAI_API_KEY` — GPT-4o-mini for text
- `FAL_API_KEY` — Flux image generation
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob storage
- `STRIPE_SECRET_KEY` — **LIVE** (sk_live_...)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — **LIVE** (pk_live_...)
- `STRIPE_WEBHOOK_SECRET` — **LIVE** (whsec_...)
- `STRIPE_PRICE_ID` — Legacy, not used (inline pricing active)

**Removed:**
- `STRIPE_PRICE_TIER2` — Removed, using inline pricing ($9.99)
- `STRIPE_PRICE_TIER3` — Removed, using inline pricing ($19.99)

## Pricing & Tiers

| Tier | Label | Price | Animals | Features |
|------|-------|-------|---------|----------|
| free | FREE | $0 | 8 base animals | Standard battle, 1 CYOA gate |
| tier2 | PRO | $9.99 | 30 real animals | All battle modes, 2 CYOA gates |
| tier3 | ULTIMATE | $19.99 | 47 all animals | Everything, all CYOA gates, mythical creatures |

**Upgrade pricing:**
- Free → Pro: $9.99
- Free → Ultimate: $19.99
- Pro → Ultimate: $10.00 (credits previous purchase)

## Stripe Configuration
- **Mode:** LIVE
- **Pricing:** Inline (no pre-created products needed)
- **Webhook:** https://whowouldwinbooks.com/api/webhook
- **Webhook events:** checkout.session.completed
- **Tier upgrade flow:** Checkout → Stripe redirect → Payment → Dashboard confirm → Supabase tier update

## Accounts

### Admin
- **Email:** david.smith@epsilon-three.com
- **Password:** BattleChamp2026!
- **Tier:** tier3 (Ultimate)
- **Admin access:** /admin

### Test User
- **Email:** davidpatricksmith@hotmail.com
- **Password:** TestUser2026!
- **Tier:** tier3 (Ultimate) — upgraded via test checkout
- **Purchase history:** 1 purchase ($10.00 tier3 upgrade)

## Database (Supabase)

### Tables
- `users` — id, email, tier, tier_purchased_at, stripe_payment_id, created_at
- `purchases` — id, user_id, tier, amount_cents, stripe_session_id, stripe_payment_intent, created_at
- `feedback` — id, user_id, type, message, created_at
- `profiles` — User profile data

### Current Data
- 2 users (1 admin, 1 test)
- 1 purchase record

## Pages & Routes

| Route | Status | Notes |
|-------|--------|-------|
| `/` | ✅ | Homepage — fighter selection, battle modes |
| `/signup` | ✅ | Registration (auto-confirm, auto-login) |
| `/login` | ✅ | Login page |
| `/read` | ✅ | Book reader (standard + CYOA) |
| `/tournament/bracket` | ✅ | Tournament bracket mode |
| `/blog` | ✅ | Blog with articles |
| `/blog/[slug]` | ✅ | Individual blog posts |
| `/admin` | ✅ | Admin dashboard (tier3 only) |
| `/feedback` | ✅ | User feedback form |
| `/dashboard` | ✅ | Post-checkout redirect + tier confirm |
| `/account/password` | ✅ | Change password |
| `/forgot-password` | ✅ | Password reset request |
| `/reset-password` | ✅ | Password reset form |

## API Routes

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/auth/signup` | POST | No | Create account |
| `/api/auth/login` | POST | No | Login |
| `/api/auth/logout` | POST | No | Logout |
| `/api/auth/change-password` | POST | Yes | Change password |
| `/api/user/tier` | GET | Optional | Get user tier + available animals |
| `/api/checkout` | POST | Yes | Create Stripe checkout session |
| `/api/checkout/confirm` | POST | No | Confirm purchase + upgrade tier |
| `/api/webhook` | POST | Stripe sig | Stripe webhook handler |
| `/api/book/start` | POST | Optional | Generate book pages |
| `/api/feedback` | POST | Yes | Submit feedback |

## Bugs Fixed During Smoke Test (2026-02-05)

1. ✅ Suspense boundary on reset-password (build error)
2. ✅ React hooks violation in admin page
3. ✅ Auth pages restyled to match theme
4. ✅ Old credits model removed entirely
5. ✅ Signup didn't auto-login (fixed with admin.createUser)
6. ✅ CYOA choice highlighting (all 3 showing YOUR CHOICE)
7. ✅ CYOA loading state (blank white square)
8. ✅ Dashboard redirected to old credits page
9. ✅ Domain references updated throughout
10. ✅ PDF images overflow pages (objectFit: contain)
11. ✅ CYOA progressive reveal timing (requestAnimationFrame)
12. ✅ Stripe checkout failing (wrong env var name)
13. ✅ Stripe env var fallback URL added
14. ✅ Account button hidden on mobile (now always shows)
15. ✅ "Account Type:" label (was "Level:", then "Account:")
16. ✅ Tier label "REAL" → "PRO"
17. ✅ Detailed Stripe error messages
18. ✅ Post-checkout tier auto-confirm (no webhook dependency)
19. ✅ Suspense boundary on dashboard page
20. ✅ Pro→Ultimate upgrade pricing ($10 not $19.99)
21. ✅ Fighter deselection in single battle mode
22. ✅ Stripe PRICE_TIER3 invalid (removed, using inline pricing)

## Known Issues / TODO

### To Retest
- [ ] CYOA progressive reveal — David reported fix didn't take (may be browser cache)

### Post-Launch
- [ ] Mobile thorough testing (basic mobile tested, looks good)
- [ ] Security audit (rate limiting, input sanitization)
- [ ] Analytics integration (Google Analytics / Vercel Analytics)
- [ ] Email receipts for purchases
- [ ] "My Books" — save/retrieve previously generated books
- [ ] Social sharing of battles
- [ ] More blog content for SEO
- [ ] Performance optimization (image lazy loading, etc.)

## SEO
- ✅ Title: "Who Would Win? - Create Epic Animal Battle Books"
- ✅ Meta description set
- ✅ OG image (1200x630)
- ✅ Twitter cards (summary_large_image)
- ✅ Canonical URL
- ✅ robots: index, follow
- ✅ Keywords set

## Monitoring
- FightingBooks health check runs via Scout heartbeat (every ~30 min)
- Checks: Homepage, Blog, API endpoints
- Alerts David on any issues
- Feedback check: Alerts on new user feedback
- Weekly Supabase backup (Sundays)
