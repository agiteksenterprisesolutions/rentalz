# TheRentalz (Next.js + Node.js)

Rebuild of therentalz.com, a UAE marketplace for renting and selling equipment and vehicles, moving from
Laravel/PHP to a JavaScript stack.

```
therentalz-next/
├── client/   Next.js (App Router, JavaScript, Tailwind)
├── server/   Node.js + Express + Prisma (MySQL)
└── docs/     legacy reference, feature inventory, DB mapping
```

## Stack
- **API:** Express 5, Prisma 7 (MySQL via `@prisma/adapter-mariadb`), JWT (httpOnly cookies, rotating refresh tokens),
  bcrypt, helmet, express-rate-limit, multer + sharp + Cloudflare R2 (S3 API), nodemailer + EJS, Stripe
- **Web:** Next.js, Tailwind, axios, zustand. Auth cookies are issued through Next.js `/api/auth/*` proxy routes.

## Getting started
```bash
# 1. API
cd server
cp .env.example .env        # set DATABASE_URL and secrets (JWT secrets are already generated in the local .env)
npx prisma migrate dev --name init
npm run seed:permissions && npm run seed:admin
npm run dev                 # http://localhost:8000/health

# 2. Web
cd ../client
cp .env.example .env.local
npm run dev                 # http://localhost:3000
```

## Server layout (mirrors the ticketify project)
```
server/
├── index.js                     app bootstrap (helmet, cors, rate limit, routes, error handlers)
├── prisma/schema.prisma
├── prisma.config.ts
└── src/
    ├── config/        prisma.js, mail.js, env.js (fail-fast env validation)
    ├── controllers/   auth.controller.js (+ one file per resource)
    ├── routes/        auth.router.js (+ one router per resource)
    ├── middleware/    verify (verifyUser/optionalUser), acl (RBAC), upload (multer), validate
    ├── services/      email.service.js, storage.service.js
    ├── utils/         asyncHandler, error (ApiError), helper (JWT/bcrypt/cookies/slug), pagination, captcha, rate-limiter
    ├── seed/          seed.permissions.js, seed.admin.js
    └── templates/     EJS emails
```

## Status
- [x] Project scaffold, security baseline, reusable backend utilities
- [x] MySQL schema (all legacy features mapped, see `docs/database.md`)
- [x] Auth API: register, verify email, login, logout, refresh, forgot/reset/change password
- [x] Local MySQL (Docker), first migration, seeds, legacy data import
- [x] Categories, ads (CRUD, photos on R2, moderation) and search API, see `docs/api.md`
- [x] Favourites, saved searches, ad expiry job, non-blocking email (SMTP details pending)
- [x] Packages, cart, Stripe checkout + webhook (live Stripe call untested until a test key is set)
- [x] Refunds, featured days (credit ledger), admin area (stats, users, bulk moderation, contacts, audit log, SEO settings and sitemap feeds)
- [x] Seller profile, avatar, account deletion and dashboard endpoints
- [x] Change email address (confirmation link to the new address, notice to the old one)
- [x] Design system (Industrial Luxe tokens and components, see `docs/design-system.md`)
- [x] Home page (live API data, SEO from admin settings, JSON-LD)
- [x] Logo (public/theRentalz_logo.png) and listings/search page (`/ads`: URL-based filters, sort, pagination, noindex on filtered views)
- [x] Ad detail page (`/ads/[slug]`: gallery, tiered prices, call/WhatsApp click tracking, similar listings, Product + Breadcrumb JSON-LD)
- [x] Seller dashboard (overview, my ads, post/edit ad with photos, favourites + hearts, saved searches, orders, profile, change email)
- [x] Packages, cart (header badge) and Stripe checkout with return page (live payment untested until Stripe keys are set)
- [x] Categories (index + per-category pages), contact form, terms and privacy (drafts, need legal review)
- [x] sitemap.xml and robots.txt (from the API feeds)
- [x] Admin area (overview, ad moderation with bulk actions, users and credits, orders and refunds, packages, messages, insurance leads, audit log, SEO settings)
- [x] Admin: manage categories (with images), cities and makes; create users (server endpoints added)
- [x] System pages: 404 (site and per-section), error boundaries (section, site, global), loading skeletons for listings
- [x] Header rebuild: Browse drop-down (Rent, Buy, All listings), Plans link, profile pill with account menu, dark mode, favicon from the logo
- [x] Plans page: hero, tier cards, full 25-plan comparison table with filters, featured-days explainer, contact CTA, FAQ
- [x] Sign-in and register pages: two-section layout with illustration, Google and Facebook sign-in (needs the redirect URIs registered, see docs/api.md)
- [x] Home hero redesign: transparent machine cut-outs from the legacy assets (public/hero), rotating machine categories with live figures, angled CTA, search panel overlapping the bottom edge
- [ ] Remaining: Stripe and SMTP live tests (need your keys), production build and deploy notes
