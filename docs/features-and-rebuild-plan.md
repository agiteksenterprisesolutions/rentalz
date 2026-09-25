# TheRentalz: feature inventory and rebuild plan

The user is rebuilding TheRentalz, a UAE classifieds marketplace for equipment and vehicles (rent / sell / premium ads, prices in AED). The new site uses Next.js with a Node.js backend and a new design. It goes in a **separate fresh folder** (name and location not yet chosen as of 2026-09-19), not inside the legacy folder. Legacy code: `legacy-reference.md`.

**Features to replicate**
- **Public site:**
  - Home page with hero search, Rent / Sell / Buy tabs, popular categories, featured carousel ordered by `priority`, and testimonials.
  - Listing pages for rent, sell and premium, with 5 sort modes and 10 per page.
  - A 3-level category tree with slug pages. Category pages only show ads from paid users.
  - Keyword search with filters for type, city, category, make, operator, insurance, warranty, fuel type, price range and year range.
  - Ad detail page with gallery, map, daily / weekly / monthly prices, phone / WhatsApp / share, favourite and add-to-cart.
  - Contact form, terms, privacy, sitemap.xml and a thank-you page.
  - Insurance quote lead form (stored but not read anywhere).
  - Analytics: view and search-impression rows per ad.
- **Auth:**
  - Register with Turnstile captcha, login, password reset and email verification.
  - Google and Facebook OAuth, which is broken in the legacy site.
  - Admin flag on the user (`is_admin`).
  - New users currently get 100 free ads.
- **Seller:**
  - Post rent / sell / product ads, with multi-photo upload and map lat/lng. The stored `price` is the minimum of the entered prices.
  - Edit and delete ads.
  - Favourites, saved searches, profile with avatar, account settings and account deletion.
  - Seller dashboard stats.
- **Payments:**
  - Packages grouped by package category (duration, ad count, AED amount).
  - Session cart and Stripe charge.
  - Ad credits (`no_of_ads` / `remaining_ads`) and a purchase email.
  - Admin approval decrements credits and sets publish and end dates.
- **Moderation:** admin approve or deny with an email to the seller, and reassigning an ad to another user.
- **Admin panel:**
  - Dashboard stats, users, ads (bulk status / featured / priority), categories with image, and package CRUD.
  - Payments table, contact messages, and site-wide SEO meta.

**Agreed direction (not yet confirmed by the user)**
- Next.js App Router with TypeScript and Tailwind.
- NestJS or Express with Prisma on MySQL.
- Stripe Checkout with webhooks, S3 or R2 for images, and Auth.js or JWT.

**Open questions for the user**
- Keep 100 free ads or require a paid plan?
- Keep the product ad type, the insurance form and the ad-in-cart flow?
- Migrate existing data, and keep old URLs?
- Add messaging, reviews or Arabic support?

**Legacy bugs to fix, not copy**
- Turnstile is never verified.
- Stripe charge amounts come from the client.
- Admin routes and ad edit / delete have no authorization.
- Deletes and cache-clear run on GET.
- Status codes are inconsistent (0, 1, 2, 4).
- Hard-coded upload paths.
- Analytics rows inflate on every search.
