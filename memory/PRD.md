# Ram Nabami Ujapan Committee - PRD

## Original Problem Statement
Build a community committee landing page for Danesh Sheikh Lane Ram Nabami Ujapan Committee with isolated Firestore collections, full CRUD admin panel, no data deletion bugs, and Bengali/English bilingual support.

## Architecture
- **Frontend**: Next.js 15.5.9, React 19, TypeScript, Tailwind CSS
- **Backend**: Firebase Firestore + Firebase Storage
- **AI**: Google Genkit for content enhancement & translation

## Collections (Isolated)
1. **members** (31 official seed records)
2. **works** (5 official seed records)
3. **events** (3 seed records)
4. **news** (6 seed records)
5. **gallery** (auto-sync from works/events/news + custom uploads)
6. **agenda** (1 seed record - বিজয় উৎসব)
7. **settings** (homepage type: logo + backgroundImage)

## Implementation Status

### ✅ Phase 1 (Complete)
- Architecture fixes: isolated listeners, no duplicates, no render loops
- All 6 CRUD managers in admin panel
- Delete confirmation dialogs
- Duplicate prevention (news headline_bn, members name)
- Required field validation
- Bulk CSV import for members
- Gallery auto-sync from collections

### ✅ Phase 2 (Complete) - Date: 2026-05-26
- Homepage background/logo CRUD (uploaded to homepage/background and homepage/logo)
- Logo displayed in Navbar (top-left beside title) + Hero section
- LiveCounters using Firestore getCountFromServer() — no hardcoded values
- Seed All Data button (31 members, 5 works, 3 events, 6 news, 1 agenda)
- Facebook reel iframe embed in news cards (fallback to thumbnail)
- All buttons connected: Home, Works, Members, Events, News, Gallery, Agenda, Contact, Read More, Share, Facebook, Admin
- Production deployment files: Dockerfile, .dockerignore, next.config.ts, DEPLOYMENT.md

## What's Implemented
- ✅ Complete admin CRUD for all 7 collections
- ✅ Real-time listeners with onSnapshot (deduped)
- ✅ Bengali/English language toggle
- ✅ Dark theme preserved
- ✅ Mobile responsive
- ✅ Image/video upload to Firebase Storage
- ✅ Gallery auto-sync button
- ✅ Members bulk CSV import
- ✅ Delete confirmation dialogs
- ✅ One-click seed for all official data
- ✅ Homepage settings (logo + background)
- ✅ Live counters from Firestore
- ✅ Facebook reel embed

## Pending / Future
- Firebase production credentials (user must add to `.env.local`)
- Run "Seed All Data" once after Firebase setup
- Deploy to Vercel/Firebase Hosting

## Test Credentials
N/A — Firebase auth not enabled. Admin panel is public for now.
