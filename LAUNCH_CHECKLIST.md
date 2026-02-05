# FightingBooks Launch Checklist

**Domain:** whowouldwinbooks.com
**Last Updated:** 2026-02-05 00:53 UTC

---

## Pre-Go-Live (David) ✅ ALL COMPLETE

- [x] Delete duplicate Vercel project (`fightingbooks-web`)
- [x] Buy domain → whowouldwinbooks.com
- [x] Enable Vercel Analytics (Project Settings → Analytics → Enable)
- [x] Review env vars in Vercel dashboard (all 11 set + NEXT_PUBLIC_SITE_URL)

## Pre-Go-Live (Scout) ✅ ALL COMPLETE

- [x] Meta descriptions for all pages
- [x] OpenGraph tags for social sharing
- [x] OG image (1200x630px)
- [x] Admin email protection
- [x] Forgot password flow
- [x] Feedback collection + alerts
- [x] Supabase backup script
- [x] Fix signup page pricing info
- [x] Remove duplicate header logo
- [x] Google Search Console — verified + sitemap submitted
- [x] robots.txt — sitemap URL updated to whowouldwinbooks.com
- [x] Canonical tags — added to all pages
- [x] Domain redirect — 301 from fightingbooks.vercel.app → whowouldwinbooks.com
- [x] All fallback URLs in code updated to new domain
- [x] Persistent login (1yr cookies + refresh token)
- [x] Admin account created (tier3 Ultimate)
- [x] Auth pages restyled to match theme
- [x] Old credits model completely removed
- [x] Dead code cleanup (old dashboard, /api/user, webhook credits code)
- [x] Signup route fixed (removed non-existent DB columns)
- [x] Admin page hooks bug fixed
- [x] All pages consistently themed (jungle/gold/red)

## Post-Go-Live Smoke Test (David) — IN PROGRESS

- [x] Login with admin account
- [ ] Verify /admin loads and works ← RETEST NEEDED (was broken, now fixed)
- [ ] Generate one book end-to-end (standard mode)
- [ ] Test CYOA mode (Adventure)
- [ ] Test PDF download
- [ ] Quick visual check on mobile
- [ ] Test Stripe checkout (test card: 4242 4242 4242 4242)

## Post-Go-Live Automated Tests ✅ COMPLETE (22 tests)

- [x] Homepage loads (200)
- [x] Signup page loads
- [x] Login page loads
- [x] Forgot password page loads
- [x] Reset password page loads
- [x] Feedback page loads
- [x] Blog loads (16 articles)
- [x] Sitemap.xml valid with correct domain
- [x] OG meta tags present
- [x] Meta descriptions present
- [x] Admin route protected (client-side)
- [x] API auth returns proper errors
- [x] Mobile user-agent works
- [x] 404 page works
- [x] robots.txt exists with correct sitemap
- [x] Canonical tags present
- [x] HTTPS working with HSTS
- [x] Response times < 3s
- [x] Old domain redirects to new

## Security Audit (1 week post-launch)

| Check | Status | Notes |
|-------|--------|-------|
| Admin routes protected | ✅ | Email whitelist (client + server) |
| API auth where needed | ✅ | Tier checks on generation |
| No secrets in client code | 🔍 | Needs audit |
| Rate limiting on auth | ⏳ | Consider adding |
| CORS configuration | 🔍 | Check needed |
| Input validation | 🔍 | Review needed |
| Proper SMTP for emails | ⏳ | Configure Resend/SendGrid |

## Future Enhancements (Post-Launch)

- [ ] Configure real SMTP (Resend/SendGrid) for password reset emails
- [ ] Email confirmation on signup
- [ ] Amazon Associates account for affiliate links
- [ ] Create content_reports table in Supabase
- [ ] Error monitoring (Sentry)
- [ ] Stripe live mode for payments
- [ ] Enhanced analytics events
- [ ] "Build Your Own Animal" teaser card

## Emergency Contacts

- **Supabase Dashboard:** https://supabase.com/dashboard/project/jezhpdzptxgncvksdrzz
- **Vercel Dashboard:** https://vercel.com/davids-projects-cf97160a/fighting_books
- **GitHub Repo:** https://github.com/dps740/fightingbooks-web
- **Google Search Console:** https://search.google.com/search-console

## Rollback Plan

If critical issues post-launch:
1. Vercel: Deployments → find last working → "..." → Promote to Production
2. Database: Restore from ~/clawd/backups/fightingbooks/

---

*Scout runs weekly backups and monitors feedback via heartbeat.*
