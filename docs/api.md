# API: catalog, categories, ads, search

Base path `/api/v1`. Responses are `{ success, message, data }`. Auth is the httpOnly `accessToken` cookie.

## Catalog (public)
| Method | Path | Notes |
|---|---|---|
| GET | `/catalog/cities` | UAE emirates / cities |
| GET | `/catalog/makes` | vehicle and equipment makes |

## Categories
| Method | Path | Access |
|---|---|---|
| GET | `/categories` | public. Nested 3-level tree (cached 5 min); `?popular=true` gives the flat home-page list |
| GET | `/categories/:slug` | public. Category, breadcrumb and children |
| POST | `/categories` | `category:create`. Multipart: `title`, optional `parentId`, `image`, `isPopular`, `sortOrder` |
| PATCH | `/categories/:id` | `category:update`. Parent and level are fixed after creation |
| DELETE | `/categories/:id` | `category:delete`. Refused while it has children or ads |
| GET | `/categories/manage` | `category:update`. The whole tree including inactive categories, never cached |

## Cities and makes
After every create, rename or delete of a city, make or category, the API calls the frontend's `POST /api/revalidate`
(`CORS_ORIGIN` + `/api/revalidate`, header `x-revalidate-secret` = `REVALIDATE_SECRET`, body `{ tags: ["cities" | "makes" | "categories"] }`).
The Next.js site tags those fetches, so the public pages show the change on the next request. The call is fire and forget:
if the frontend is down the edit still succeeds and the site catches up within its hourly refresh. Set the same
`REVALIDATE_SECRET` in `server/.env` and `client/.env.local`.

| Method | Path | Access |
|---|---|---|
| GET | `/catalog/cities`, `/catalog/makes` | public. `Cache-Control: public, no-cache`: copies are re-checked (a cheap 304) before every use, so edits are never hidden |
| POST | `/catalog/cities`, `/catalog/makes` | `city:manage` / `make:manage`. `{ name }`; a duplicate name answers 409 |
| PATCH | `/catalog/cities/:id`, `/catalog/makes/:id` | same permission. `{ name }`; a city's slug follows its name |
| DELETE | `/catalog/cities/:id`, `/catalog/makes/:id` | same permission. Refused (409) while ads use it |

## Ads
| Method | Path | Access |
|---|---|---|
| GET | `/ads` | public. Listing and search (below) |
| GET | `/ads/featured` | public. Home carousel by `priority` (lower first) |
| GET | `/ads/:slug` | public. Detail; owners and staff can open non-public ads. Counts a VIEW for real visitors |
| POST | `/ads/:id/click` | public. `{ type: "PHONE" \| "WHATSAPP" }` |
| GET | `/ads/mine` | signed in. Own ads, `?status=` |
| POST | `/ads` | `ad:create`. Multipart: fields plus up to 15 `photos`. Starts as PENDING |
| PATCH | `/ads/:id` | owner or `ad:update`. An owner editing an approved or rejected ad sends it back to PENDING |
| DELETE | `/ads/:id` | owner or `ad:delete`. Soft delete |
| POST / DELETE | `/ads/:id/photos`, `/ads/:id/photos/:photoId` | owner or `ad:update`. Max 15 photos |
| GET | `/ads/manage` | `ad:list`. Any status; same filters plus `status`, `userId` |
| POST | `/ads/:id/approve` | `ad:approve`. A first publication or renewal spends one of the owner's ad credits; the credit's lot sets the run length and the featured days (see Ad credits) |
| POST | `/ads/:id/reject` | `ad:approve`. `{ reason }`, emails the seller |
| POST | `/ads/:id/feature` | `ad:feature`. `{ isFeatured, priority, days? }`. Without `days` the ad stays featured until an admin removes it |
| POST | `/ads/:id/assign` | `ad:assign`. `{ userId }`; the original creator stays in `creatorId` |

Create / edit fields: `type` (RENT, SELL, PREMIUM, PRODUCT), `title`, `description`, `phone`, `mainCategoryId`,
`subCategoryId`, `leafCategoryId` (must form a chain), `cityId`, `makeId`, `model`, `modelYear`, `capacity`,
`operator` (WITH_OPERATOR, WITHOUT_OPERATOR, BOTH), `insurance`, `warranty`, `transportation`, `fuelType`, `terms`,
`address`, `latitude`, `longitude`, `price`, `dailyPrice`, `weeklyPrice`, `monthlyPrice`.
The stored `price` is always the lowest entered price, computed on the server.

## Search filters (`GET /ads`)
`q` (words are prefix-matched against title, description, make and model), `type`, `city` (id), `category` (id or slug,
matches any level), `make` (id), `operator`, `insurance`, `warranty`, `fuelType`, `minPrice`, `maxPrice`, `minYear`,
`maxYear`, `featured`, `sort` (`newest` default, `oldest`, `price_asc`, `price_desc`, `featured`), `page`, `limit` (max 50).
Public results are APPROVED, not deleted and not past `expiresAt`.

## Favourites (signed in)
| Method | Path | Notes |
|---|---|---|
| GET | `/favourites` | saved ads that are still public, newest first, paginated |
| GET | `/favourites/ids` | just the ad ids, for heart icons on list pages |
| POST / DELETE | `/favourites/:adId` | idempotent; only public ads can be added; max 500 |

## Saved searches (signed in)
| Method | Path | Notes |
|---|---|---|
| GET | `/saved-searches` | own saved searches |
| POST | `/saved-searches` | `{ name?, filters }`. `filters` uses the same keys as `GET /ads`; unknown keys are dropped and invalid values are rejected. Max 20 |
| DELETE | `/saved-searches/:id` | owner only |

The client opens a saved search by passing its `filters` to `GET /ads`.

## Packages
| Method | Path | Access |
|---|---|---|
| GET | `/packages` | public. Active packages grouped by package category, cheapest first |
| GET | `/packages/manage` | `package:update`. Includes inactive packages |
| POST / PATCH | `/packages`, `/packages/:id` | `package:create` / `package:update`. `categoryId`, `name`, `details`, `adCount`, `durationValue`, `durationUnit` (DAY, MONTH), `amount`, `featuredDays`, `hasAnalytics`, `hasSupport`, `isActive` |
| DELETE | `/packages/:id` | `package:delete`. Refused once a package has been ordered; deactivate it instead |

## Cart (signed in)
One cart per user, one line per package. Prices are always read from the package rows; anything price-related in a request is ignored.
| Method | Path | Notes |
|---|---|---|
| GET | `/cart` | items, `total`, `adCredits` (credits the cart would grant). Inactive packages show `available: false` and are left out of the totals |
| POST | `/cart/items` | `{ packageId, quantity }` sets the quantity (1 to 100, max 20 different packages) |
| DELETE | `/cart/items/:packageId`, `/cart` | remove a line / clear the cart |

## Checkout and orders
| Method | Path | Notes |
|---|---|---|
| POST | `/payments/checkout` | cart to PENDING order, plus a Stripe Checkout Session. Returns `{ orderId, url }`; redirect the browser to `url` |
| POST | `/payments/confirm` | `{ orderId }`. Called by the success page: asks Stripe for the real session state and fulfils the order if it was paid. Idempotent |
| POST | `/payments/webhook` | Stripe only. Raw body, authenticated by the `Stripe-Signature` header |
| GET | `/orders`, `/orders/:id` | own orders (`order:read-self`); staff with `order:list` can open any order |
| GET | `/orders/all` | `order:list`. `?status=&userId=` |

Fulfilment (from the webhook or `confirm`) requires the Stripe session to match the order (id, amount, currency). It then
switches the order PENDING to PAID, adds the purchased `adCredits` to the user and empties their cart, all in one
transaction with a conditional update, so retries and races cannot grant credits twice. Unpaid or expired checkouts mark
the order FAILED. Refunds are not handled yet.

### Stripe setup
1. Put the test secret key in `STRIPE_SECRET_KEY`.
2. Add a webhook endpoint `https://<api-host>/api/v1/payments/webhook` for `checkout.session.completed`,
   `checkout.session.expired`, `checkout.session.async_payment_succeeded` and `checkout.session.async_payment_failed`,
   and put its signing secret in `STRIPE_WEBHOOK_SECRET`.
3. Locally: `stripe listen --forward-to localhost:8000/api/v1/payments/webhook` prints a `whsec_...` secret for `.env`.

## Seller account (`/users/me`, signed in)
| Method | Path | Notes |
|---|---|---|
| GET | `/users/me` | account, profile (with `avatarUrl`) and `adCredits` |
| PATCH | `/users/me` | `name`, `phone`, `firstName`, `lastName`, `aboutMe`, `organizationName`, `gender` (male, female, other), `birthday` (`1990-05-31`). Email, role and status cannot be changed here |
| PUT / DELETE | `/users/me/avatar` | multipart `avatar` (JPG, PNG or WebP, 5 MB). Replacing or removing deletes the old file from R2 |
| GET | `/users/me/dashboard` | ads by status and how many expire within 7 days, credit balance and lots, favourites on your ads, views / phone clicks / WhatsApp clicks (last 30 days and all time), views per day for 14 days, top 5 ads by views |
| POST | `/users/me/email` | `{ newEmail, password }`. Starts an email change (see below). Rate limited |
| DELETE | `/users/me/email` | cancels a pending change |
| DELETE | `/users/me` | `{ password }` (accounts without a password, such as Google sign-in, send `{ "confirm": "DELETE" }`). Rate limited |

**Changing the email address.** `POST /users/me/email` needs the current password (so a stolen session alone cannot do
it). It emails a 30-minute link to the NEW address and a heads-up to the old one; nothing changes yet, and `GET /users/me`
shows the request as `pendingEmail`. The link opens the frontend's `/confirm-email-change?token=...` page, which calls the
public `POST /auth/confirm-email-change { token }`. That switches the email, marks it verified and revokes all refresh
tokens, so the user signs in again with the new address (a browser session already open lasts until its 15-minute access
token expires). A second request needs a 2-minute gap; an address that is already registered is rejected, and if it gets
taken before the link is used the confirmation fails with 409. Accounts without a password (Google sign-in) must set one
through "Forgot password" first. If the confirmation email cannot be sent the request is dropped and the API answers 503.

Deleting an account anonymises it instead of erasing the row: email, name, phone, profile and picture are removed, the
ads leave the site, favourites, saved searches and cart are cleared and every session ends. Orders and the audit trail
stay intact, and the email address can be registered again. Unused ad credits are forfeited.

## Auth and email
- **Sessions.** Login sets two httpOnly cookies: a 15-minute access token and a refresh token. The refresh token is stored hashed in `RefreshToken` and rotated on every `POST /auth/refresh-token` (old one deleted, new one issued). A session lasts 7 days, or 30 with "keep me signed in", and each refresh restarts that clock at the same length, so anyone who uses the site at least once within the window stays signed in. Blocking, deleting or resetting the password of a user ends all their sessions. The frontend refreshes automatically when a request answers 401.
- Registration, login and password reset never fail because mail could not be sent.
- Login with an unverified email returns `403` with `code: "EMAIL_NOT_VERIFIED"` and sends a new link (at most one per 2 minutes).
  `POST /auth/resend-verification { email }` does the same on demand and answers identically for every address.
- SMTP is configured with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`.

## Sign in with Google and Facebook
Authorization-code flow, all on the API (`services/social-auth.service.js`); the client id and secret never leave the server.
| Method | Path | Notes |
|---|---|---|
| GET | `/auth/providers` | `{ google, facebook }`: which providers have keys, so the frontend only shows working buttons |
| GET | `/auth/:provider?next=/path` | starts the flow: sets a random `oauth_state` cookie and redirects to the provider |
| GET | `/auth/:provider/callback` | the provider's return address. Checks the state, trades the code for the profile, then finds, links or creates the account and redirects to the frontend `/api/auth/social?code=...` |
| POST | `/auth/social/exchange` | `{ code }`. Trades the one-time code (60 seconds, single use, stored hashed in `SocialLoginCode`) for the normal session cookies |

Account rules: a provider profile without a verified email is refused. An existing account with the same email is linked (and its email marked verified); otherwise a new active, verified account without a password is created. Blocked and deleted accounts are refused. Failures redirect to `/login?error=<code>` (`social_failed`, `social_cancelled`, `social_no_email`, `social_unverified`, `social_blocked`, `social_deleted`, `social_unavailable`).

Set `GOOGLE_CLIENT_ID/SECRET` and `FACEBOOK_CLIENT_ID/SECRET`, and register `<BACKEND_URL><API_VERSION>/auth/<provider>/callback` as an authorised redirect URI with each provider (override the base with `OAUTH_REDIRECT_BASE` behind a proxy).

## Ad credits, featured days and expiry
Credits are a ledger (`AdCreditLot`): each purchase, free grant or admin grant is a lot with its own `featuredDays` and
`durationDays`. Approving an ad spends one credit from the user's oldest lot that still has credits, and that lot decides:
- how long the ad runs (`expiresAt = now + durationDays`), and
- how many days it is featured (`isFeatured`, `featuredUntil`), with `priority` 100 unless an admin already set one.

Package terms are copied onto the order item at checkout, so later package edits do not change what was bought.
A user's balance is the sum of `remaining` over their lots (`adCredits` in `/auth/me` and the login response).

An hourly job marks approved ads past `expiresAt` as EXPIRED and ends featured windows past `featuredUntil`. Public
queries also check both dates, so an ad disappears on time even between runs. Approving an expired ad renews it (one
credit, new window). An owner editing an expired ad sends it back to review.

## Refunds
`POST /orders/:id/refund { reason? }` (`order:refund`) issues a full Stripe refund for a PAID order, then marks it
REFUNDED. A refund made in the Stripe dashboard is picked up from the `charge.refunded` webhook (subscribe to that event
too); partial refunds change nothing and are logged. Unused credits from the order are withdrawn; credits already spent
on published ads stay spent and those ads keep running. The response reports `creditsWithdrawn` and `creditsAlreadyUsed`.

## Admin (`/admin`, signed in, permission per route)
| Method | Path | Permission |
|---|---|---|
| GET | `/admin/stats` | `report:ads` (ads, users, views, unread messages) and/or `report:sales` (revenue, orders, refunds) |
| GET | `/admin/reports/sales?from=&to=` | `report:sales`. Paid revenue per day, default last 30 days, max one year |
| GET | `/admin/users?q=&role=&status=` | `user:list`. Includes each user's `adCredits` |
| POST | `/admin/users` | `user:create`. `{ name, email, password, phone?, role? }`. The account starts ACTIVE with a verified email. A role other than USER also needs `user:change-role`. An email that exists, even on a deleted account, answers 409 |
| GET | `/admin/users/:id` | `user:read`. Profile, ads by status, spend, credit lots |
| PATCH | `/admin/users/:id/status` | `user:block`. `{ status: "ACTIVE" \| "BLOCKED" }`; blocking ends every session |
| PATCH | `/admin/users/:id/role` | `user:change-role`. `{ role }`; the user must sign in again |
| POST | `/admin/users/:id/credits` | `user:update`. `{ credits, featuredDays?, durationDays?, note? }` |
| DELETE | `/admin/users/:id` | `user:delete`. Soft delete; their ads leave the site |
| POST | `/admin/ads/bulk` | per action: `approve` / `reject` need `ad:approve`, `feature` / `unfeature` need `ad:feature`, `delete` needs `ad:delete`. `{ ids (max 100), action, reason?, priority?, days? }`; approvals report success or failure per ad |
| GET / PATCH / DELETE | `/admin/contacts`, `/admin/contacts/:id/read`, `/admin/contacts/:id` | `contact:list` / `contact:delete` |
| GET | `/admin/insurance-leads?q=` | `insurance:list` |
| GET | `/admin/audit-logs?action=&entity=&userId=` | `audit:list` |
| GET / PUT | `/admin/settings`, `/admin/settings/:key` | `setting:read` / `setting:update` |

Admins cannot block, re-role or delete their own account. Ad moderation, refunds, role and status changes, credit
grants, setting changes and bulk actions are written to the audit log.

## Contact form and SEO
| Method | Path | Notes |
|---|---|---|
| POST | `/contact` | public. `{ name, email, message, captchaToken }`, rate limited |
| GET | `/seo/settings` | public. `seo.default` (siteName, titleTemplate with `%s`, title, description, keywords, ogImageUrl) and `seo.pages` (per-route overrides keyed by page slug such as `home`, `rent`) |
| GET | `/seo/sitemap/ads?page=` | public. `{ slug, updatedAt }` for every public ad, 5000 per page |
| GET | `/seo/sitemap/categories` | public. Same for active categories |

The Next.js app owns the SEO output: `generateMetadata` merges `seo.default`, the page override and the ad or category
data it already fetches; `app/sitemap.js` builds from the two sitemap feeds; `robots.js` and JSON-LD live in the frontend.
Admins edit the two settings with `PUT /admin/settings/seo.default` and `/admin/settings/seo.pages`; values are validated
(lengths, http(s) URLs only) and unknown keys are dropped.

## Not done yet
- Search impressions are not recorded (the legacy code wrote a row per result on every search). Left out on purpose.
