# Tech Infrastructure Costs v3

**Updated:** 2026-02-03

## Tier Structure

| Tier | Price | Animals | Static Books | CYOA Matchups | Paths/CYOA |
|------|-------|---------|--------------|---------------|------------|
| Free | $0 | 8 | 28 | 1 (Lion vs Tiger) | 8 |
| Tier 2 | $9.99 | 30 | 435 | 435 | 8 |
| Tier 3 | $19.99 | 47 | 1,081 | 1,081 | 8 |

**CYOA:** 3 gates × 2 choices = 8 paths per matchup

---

## Hosting (Vercel - Free Tier)

- Serverless Functions: 100GB-hours/month (free)
- Bandwidth: 100GB/month (free)
- Builds: Unlimited (free)

## Storage

- Vercel Blob (first 10GB): Free
- Estimated usage: 4-5GB for full cache
- Cost: $0

## Domain

- whowouldwinbooks.com: ~$12/year

---

## Generation Costs

### Per-Item Costs

| Item | Cost |
|------|------|
| Static book (text + images) | $0.04 |
| CYOA path (text + images) | $0.04 |

### Maximum Content

| Item | Count | Max Cost |
|------|-------|----------|
| All static books | 1,081 | $43.24 |
| All CYOA paths | 8,648 | $345.92 |
| **TOTAL MAX** | | **$389.16** |

### Pre-Generated at Launch

| Item | Count | Cost |
|------|-------|------|
| Free tier static books | 28 | $1.12 |
| Lion vs Tiger CYOA | 8 paths | $0.32 |
| **TOTAL** | | **$1.44** |

---

## Realistic Usage Model

Not all content gets generated. Based on power-law distribution:

| Timeframe | Static Books (%) | CYOA Paths (%) | Estimated Cost |
|-----------|------------------|----------------|----------------|
| Year 1 | ~42% | ~27% | ~$112 |
| Year 2 | ~54% | ~39% | ~$158 (cumulative) |

**Why less than 100%:**
- Popular matchups (Lion/Tiger, Shark/Croc) dominate
- Long tail combinations rarely explored
- Caching means early users generate, later users benefit

---

## Payment Processing

| Provider | Fee |
|----------|-----|
| Stripe | 2.9% + $0.30/transaction |

**Net Revenue per Sale:**
- Tier 2 ($9.99): $9.40 net
- Tier 3 ($19.99): $19.11 net

---

## Total Fixed Costs Summary

| Item | Year 1 | Ongoing |
|------|--------|---------|
| Domain | $12 | $12/year |
| Hosting | $0 | $0 |
| Pre-generation | $1.44 | One-time |
| **Total Fixed** | **~$13** | **$12/year** |

---

## Break-Even Analysis

**Worst Case (100% content generated):**
- Max cost: $389
- Break-even: 42 Tier 2 sales OR 21 Tier 3 sales

**Realistic (30% content generated):**
- Estimated cost: ~$117
- Break-even: 13 Tier 2 sales OR 7 Tier 3 sales

---

## When to Upgrade Vercel

Pro plan ($20/mo) needed if:
- >100GB bandwidth/month (~50K+ active users)
- Need longer function timeouts
- Team collaboration features

---

## Refund Policy

- 30-day money-back guarantee, no questions asked
- Estimated refund rate: 3-5%
- Exception: Abuse accounts (no refund)
- On refund: Downgrade to Free tier

---

## Changes from v2

| Metric | v2 | v3 | Change |
|--------|----|----|--------|
| Gates per CYOA | 5 | 3 | -40% |
| Paths per matchup | 32 | 8 | -75% |
| Max CYOA paths | 34,592 | 8,648 | -75% |
| Max generation cost | ~$2,000 | $389 | -80% |
| Break-even (worst) | 170 sales | 42 sales | -75% |
