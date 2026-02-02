# Tech Infrastructure Costs

## Hosting (Vercel - Free Tier)
- Serverless Functions: 100GB-hours/month (free)
- Bandwidth: 100GB/month (free)
- Builds: Unlimited (free)

## Storage (Vercel Blob)
- First 10GB: Free
- Overage: $0.15/GB/month
- Estimated usage: 4-8GB for full cache

## Domain
- whowouldwinbooks.com: ~$12/year

## API Costs (Variable)
- FAL AI: $0.003/image
- OpenAI: ~$0.15/book text

## Total Fixed Costs
- Year 1: ~$12 (domain only)
- Everything else scales with usage

## When to Upgrade Vercel
- Pro plan ($20/mo) needed if:
  - >100GB bandwidth/month (~50K+ active users)
  - Need longer function timeouts
  - Team collaboration features

## Refund Policy

**Policy:** 30-day money-back guarantee, no questions asked
- Builds trust with parents
- Industry standard for digital products
- Exception: Accounts terminated for abuse (per Fair Usage Policy)

**Estimated Refund Rate:** 3-5%
- Lower than average because:
  - Free tier lets users try before buying
  - Low price point ($9.99/$19.99)
  - Instant delivery = immediate value

**Financial Impact (Conservative @ 5%):**
| Tier | Gross Revenue | Refunds (5%) | Net Revenue |
|------|---------------|--------------|-------------|
| Premium | $5,200 | $260 | $4,940 |
| Ultimate | $5,660 | $283 | $5,377 |
| **Total** | $10,860 | $543 | $10,317 |

**Refund Process:**
- Stripe handles refunds automatically
- User requests via email or dashboard
- Processed within 5-10 business days
- Access revoked upon refund (downgrade to Free tier)

## Updated Cost Model (With Pre-Generation)

### One-Time Pre-Generation Costs
| Item | Count | Cost |
|------|-------|------|
| Fighter portraits | 47 | Already done |
| Habitat images | 47 | $0.14 |
| Action images | 47 | $0.14 |
| Closeup images | 47 | $0.14 |
| Free tier books (28) | 28 | $3.50 |
| Lion vs Tiger CYOA | 27 paths | $3.51 |
| **Total One-Time** | | **~$7.50** |

### Per-Book Generation (NEW matchups only)
| Item | Count | Cost |
|------|-------|------|
| Cover image | 1 | $0.003 |
| Battle images | 5 | $0.015 |
| Victory image | 1 | $0.003 |
| OpenAI text | 1 | $0.15 |
| **Per new book** | | **$0.17** |

### CYOA Per-Choice
| Item | Count | Cost |
|------|-------|------|
| Battle images | 1-2 | $0.003-0.006 |
| OpenAI text | 1 | $0.02 |
| **Per choice** | | **~$0.03** |

### Key Insight
Educational images are SHARED across all matchups.
- Lion portrait used in Lion vs Tiger, Lion vs Bear, Lion vs Shark, etc.
- Only battle-specific images need generation per matchup
- Reduces per-book cost from $0.20 to $0.17 (15% savings)
