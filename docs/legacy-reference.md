# Legacy TheRentalz codebase (reference)

The legacy TheRentalz site (therentalz.com) is a Laravel PHP app at `/home/wa/Downloads/aetherentalz-fully-working`. It is the source of truth for the Next.js + Node.js rebuild; read it whenever the user says "therentalz" or "rentalz".

Where to look:
- `routes/web.php`: every route (no API routes are used)
- `app/Http/Controllers/`: HomeController (public listings, search, cart), AddController / SellController / ProductController (rent, sell and product ad CRUD), AdminController (admin panel), VenderController (seller dashboard), StripePaymentController, Auth/RegisterController
- `app/Models/`: 19 models (Add, User, Profile, Category, Package, Cart, Subscription, UserPaymentDetail, and others)
- `database/migrations/`: the schema. Some columns (`add_type`, `slug`, `user_status`, `no_of_ads`, `remaining_ads`, `is_admin`, `level`, `cat_slug`) were added outside these migrations, so they aren't all listed there.
- `resources/views/`: Blade views. `web/` holds the public ad forms, `admin/` the admin panel, `emails/` the 5 email templates.
- `app/Mail/Confirmation.php`: the generic mailer

Do NOT copy or repeat anything from `.env` (it holds live Stripe, Google, Facebook, Turnstile and DB secrets). The user should rotate them. The folder has no DB dump, so the real category tree, packages and data are unseen.

See `features-and-rebuild-plan.md` for the feature summary and rebuild plan.
