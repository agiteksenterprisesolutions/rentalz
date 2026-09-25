# Database mapping (legacy Laravel → new MySQL/Prisma)

Schema: `server/prisma/schema.prisma`

| Legacy table | New model | Notes |
|---|---|---|
| users | User | `name`, `role` enum (ADMIN/MODERATOR/USER); soft delete. `no_of_ads/remaining_ads/user_status` become `AdCreditLot` rows |
| profiles | Profile | 1:1 with User, created with the user |
| states | City | UAE emirates/cities |
| categories | Category | 3-level tree, `slug`, `level`, `isPopular` replaces hard-coded IDs 81–88 |
| makes | Make | |
| adds | Ad | `AdType` (RENT/SELL/PREMIUM/PRODUCT) + `AdStatus` enum replace `add_type` and status 0/1/2/4; daily/weekly/monthly prices; `price` = lowest, for sorting |
| photos + images | AdPhoto | R2 object `key` (public URL derived from `R2_PUBLIC_URL`); the temp `images` staging table is gone |
| favourites | Favourite | composite PK (userId, adId) |
| my_searches | SavedSearch | stores filter JSON instead of per-result rows |
| add__search__statuses | AdEvent | VIEW / SEARCH_IMPRESSION / PHONE_CLICK / WHATSAPP_CLICK |
| package_categories, packages | PackageCategory, Package | |
| carts | Cart, CartItem | per user, not per PHP session |
| subscriptions, user_payment_details | Order, OrderItem | prices snapshotted; totals computed server-side; Stripe ids stored |
| contacts | Contact | |
| insurances | InsuranceLead | |
| metas | Setting | key/value JSON: `seo.default` and `seo.pages` (validated, read by the Next.js frontend) |
| users.remaining_ads | AdCreditLot | credit ledger: one lot per purchase / free grant / admin grant, with its own featured days and run length |
| — | RefreshToken, Permission, RolePermission, AuditLog | new: JWT sessions, RBAC, audit trail |

## Commands
```bash
cd server
npx prisma migrate dev --name init   # create tables (needs DATABASE_URL in .env)
npm run seed:permissions             # roles → permissions
npm run seed:admin                   # first admin (ADMIN_EMAIL / ADMIN_PASSWORD)
npm run db:studio
```

## Data migration
The legacy dump is imported by `server/src/seed/import-legacy.js` (`npm run import:legacy`).
1. Load the dump into a scratch database named `legacy` on the same MySQL server (or set `LEGACY_DATABASE_URL`).
2. Run `npm run import:legacy`. It is re-runnable: reference data, users and ads are upserted; events, contacts and
   insurance leads are only imported into empty tables.

Mapping rules: legacy `status` 1 → APPROVED, anything else → PENDING; `add_type` rest → PRODUCT; warranty 0/1/2 →
yes/no/not applicable (null); operator and insurance 1/2 → yes/no; bcrypt `$2y$` hashes are re-prefixed to `$2b$`.
Skipped on purpose: the `testing@example.com*` test accounts, `my_searches` (per-result rows, not real saved searches)
and `user_payment_details` (references users that no longer exist and the `subscriptions` table is empty).
Ad photos are uploaded to R2 by `npm run upload:legacy-photos`, which reads `server/legacy-photo-manifest.json` (legacy path → target `key`) and creates the AdPhoto rows.
