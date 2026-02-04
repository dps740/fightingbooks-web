# FightingBooks Launch Checklist

**Target Launch:** February 2026
**Last Updated:** 2026-02-04

---

## Pre-Go-Live (David)

- [ ] Delete duplicate Vercel project (`fightingbooks-web`)
- [ ] Buy domain (optional but recommended)
  - Option: fightingbooks.com or whowould.win
  - Add to Vercel: Project Settings → Domains
- [ ] Enable Vercel Analytics (Project Settings → Analytics → Enable)
- [ ] Review env vars in Vercel dashboard (all 11 should be set)

## Post Custom Domain Setup (David)

- [ ] Submit to Google Search Console (after domain is live)
  1. Go to: https://search.google.com/search-console
  2. Add property → enter your custom domain
  3. Verify ownership (HTML tag or DNS method)
  4. Submit sitemap: `https://[yourdomain]/sitemap.xml`
  - **Wait until custom domain is configured before doing this**

## Pre-Go-Live (Scout) ✅

- [x] Meta descriptions for all pages
- [x] OpenGraph tags for social sharing
- [x] Admin email protection
- [x] Forgot password flow
- [x] Feedback collection + alerts
- [x] Supabase backup script
- [x] Fix signup page pricing info
- [x] Remove duplicate header logo
- [ ] Create OG image (1200x630px) - needs design

## Pending Deployment

All changes committed, waiting for Vercel deploy limit reset at **4:39 PM MT**.

Commits ready to deploy:
- `feat: Add My Account pages - login, change password, feedback`
- `feat: Add admin email protection + fix signup pricing`
- `feat: Add forgot password flow`
- Meta descriptions & SEO improvements

---

## Post-Go-Live Testing (Scout)

### User Journey Test
- [ ] Visit homepage, verify loads correctly
- [ ] Create test account (testuser+[timestamp]@test.com)
- [ ] Verify login works
- [ ] Verify tier shows as "FREE"
- [ ] Generate Lion vs Tiger book
- [ ] Verify book completes with images
- [ ] Test PDF download
- [ ] Test CYOA mode (Lion vs Tiger)
- [ ] Submit feedback via /feedback
- [ ] Verify feedback alert received
- [ ] Test logout
- [ ] Test forgot password flow (request + reset)

### Access Control Test
- [ ] Visit /admin while logged out → should redirect
- [ ] Visit /admin with non-admin account → should redirect
- [ ] Login with admin email → /admin should work

### Mobile Test
- [ ] Homepage renders correctly
- [ ] Fighter selection works on touch
- [ ] Book generation works
- [ ] All pages accessible

### Error Scenarios
- [ ] Invalid login credentials → proper error message
- [ ] Weak password on signup → proper error message
- [ ] Network error simulation → graceful handling

## Post-Go-Live Testing (David) - 3 minutes

- [ ] Login with david.smith@epsilon-three.com
- [ ] Verify /admin access works
- [ ] Quick visual check on mobile
- [ ] Generate one book end-to-end

---

## Security Audit (1 week post-launch)

| Check | Status | Notes |
|-------|--------|-------|
| Admin routes protected | ✅ | Email whitelist |
| API auth where needed | 🔍 | Review needed |
| No secrets in client code | 🔍 | Audit needed |
| Rate limiting on auth | ⏳ | Consider adding |
| CORS configuration | 🔍 | Check needed |
| Input validation | 🔍 | Review needed |

---

## Future Enhancements (Post-Launch)

- [ ] Email confirmation on signup (needs SMTP)
- [ ] Custom domain setup
- [ ] "Build Your Own Animal" teaser card
- [ ] Error monitoring (Sentry)
- [ ] Stripe live mode for payments
- [ ] Enhanced analytics events

---

## Emergency Contacts

- **Supabase Dashboard:** https://supabase.com/dashboard/project/jezhpdzptxgncvksdrzz
- **Vercel Dashboard:** https://vercel.com/davids-projects-cf97160a/fighting_books
- **GitHub Repo:** https://github.com/dps740/fightingbooks-web

---

## Rollback Plan

If critical issues post-launch:
1. Vercel: Deployments → find last working → "..." → Promote to Production
2. Database: Restore from ~/clawd/backups/fightingbooks/

---

*Scout runs weekly backups and monitors feedback via heartbeat.*
