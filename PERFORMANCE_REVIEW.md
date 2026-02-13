# Performance Review & Optimization Plan

## Scope reviewed
- Product goals and architecture docs.
- Next.js app structure and runtime setup.
- Core generation APIs (`/api/book/start`, `/api/book/choice`) and homepage/reader rendering paths.

## Executive assessment
The project is **functionally strong but not performance-optimal yet**.

- You already have major wins in place: cached books/CYOA paths, pre-generated educational images, and parallelized generation in key places.
- The biggest remaining bottlenecks are now in **frontend payload/rendering** and **server route hot paths** (notably synchronous filesystem operations and broad middleware matching).

## What is already good
1. **Caching as a first-class strategy is implemented** (book/CYOA/image reuse). This aligns with the product goal of repeat instant experiences and lower per-book cost.
2. **Parallel generation exists** for facts/stats and battle images.
3. **Pre-generated educational image set** reduces dynamic generation work.

## Highest-impact improvements (prioritized)

### 1) Reduce homepage + reader client cost (bundle + render work)
**Why this matters:** `/` and `/read` appear to carry heavy client-side logic and animation/image rendering, which are the most user-visible pages.

**Evidence:**
- Homepage is a full client component and imports `framer-motion` directly at the page root.
- Reader and homepage use many raw `<img>` elements rather than `next/image`, which the Next lint rules flag as potential LCP/bandwidth regressions.

**Actions:**
- Split homepage into server shell + smaller client islands (mode selector, fighter picker, overlays).
- Lazy-load motion-heavy components (`dynamic(() => import(...), { ssr: false })`) where SEO is not needed.
- Replace critical `<img>` above-the-fold assets with `next/image` + explicit sizes + `priority` on hero/LCP elements.
- Keep decorative/non-critical images lazy.

**Expected outcome:** noticeably faster first load, better mobile responsiveness, lower bandwidth.

### 2) Remove synchronous filesystem I/O in request path
**Why this matters:** blocking Node event loop in hot API routes increases tail latency under concurrency.

**Evidence:**
- Stats cache load/save uses `existsSync/readFileSync/writeFileSync` in `/api/book/start`.

**Actions:**
- Replace sync FS calls with async `fs/promises`.
- Load file cache once per process boot (memoized) and flush periodically / on mutation.
- Prefer Vercel KV/Blob metadata for distributed cache consistency if multiple instances matter.

**Expected outcome:** improved p95/p99 latency and better scalability during traffic spikes.

### 3) Narrow middleware/proxy matcher scope
**Why this matters:** current redirect middleware runs on almost all paths, adding per-request overhead globally.

**Evidence:**
- Matcher currently catches nearly everything except `_next/static`, `_next/image`, and `favicon.ico`.
- Build warns that `middleware` convention is deprecated in Next 16 in favor of `proxy`.

**Actions:**
- Migrate to `proxy.ts` (Next 16 path).
- Restrict matching to host redirect scenarios only (or explicit paths) to avoid unnecessary execution.

**Expected outcome:** lower global request overhead and cleaner Next 16 compatibility.

### 4) Improve auth/tier check cost on generation endpoint
**Why this matters:** `/api/book/start` does auth token read, optional refresh, and DB lookup before generation. This is repeated on every generation request.

**Evidence:**
- `POST /api/book/start` calls `getUserTier()` before access checks; `getUserTier()` can perform auth refresh + `users` table query.

**Actions:**
- Cache resolved tier briefly (e.g., signed cookie claim or short-lived edge cache keyed by user id + updated_at version).
- Skip refresh/query for known unauthenticated flows early.
- Add lightweight timing logs around each stage to quantify impact.

**Expected outcome:** reduced overhead on every generation start and better throughput.

### 5) Add explicit performance budgets + observability
**Why this matters:** without budgets, regressions accumulate.

**Actions:**
- Define targets: homepage LCP, JS KB budget, `/api/book/start` p95 latency (cache hit vs miss), generation completion SLA.
- Track cache hit ratio for standard books and CYOA paths.
- Add synthetic checks for key user journeys.

**Expected outcome:** measurable, maintainable performance gains instead of one-off tuning.

## Secondary improvements
- Convert large static fighter arrays and constants to data files loaded server-side where possible.
- Preconnect/dns-prefetch for key third-party domains used at runtime.
- Consider queueing or backpressure controls for concurrent image generations in high load.
- Audit long-term branch/docs drift (README claims Next 15 while package is Next 16) to avoid incorrect tuning assumptions.

## Practical roadmap (2-week suggestion)

### Week 1 (high ROI, low risk)
1. Migrate middleware -> proxy + narrow matcher.
2. Replace critical homepage/reader `<img>` with `next/image`.
3. Convert sync FS cache calls in `/api/book/start` to async/memoized.
4. Add timing logs for generation stages and cache hit/miss dimensions.

### Week 2 (structural)
1. Split homepage into server/client islands and lazy-load heavy motion blocks.
2. Introduce tier-resolution short cache.
3. Add dashboards/alerts for LCP, API p95, cache hit ratio.

## Bottom line
You’re **closer to “production-capable” than “optimized”**: architecture choices are good, but the next gains come from reducing frontend payload and removing blocking server hot-path work. If you implement the top 4 items above, you should see material improvements in both perceived speed and backend tail latency.
