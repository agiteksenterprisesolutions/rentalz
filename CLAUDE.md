# TheRentalz (Next.js + Node.js rebuild)

- Monorepo: `client/` (Next.js, JS) and `server/` (Express + Prisma + MySQL, JS). Read `README.md` and `docs/`.
- The legacy PHP/Laravel site is at `/home/wa/Downloads/aetherentalz-fully-working`. Use it as the source of truth for
  features and business rules (see `docs/legacy-reference.md`). Never copy anything from its `.env` (live secrets).
- Feature inventory, open questions and legacy bugs to avoid: `docs/features-and-rebuild-plan.md`.
- Structure and conventions follow `/home/wa/ticketify` (server: config/controllers/routes/middleware/services/utils).
- Security baseline: JWT in httpOnly cookies, bcrypt, helmet, rate limiting, RBAC via `requirePermissions`.
  Authorize every mutation (ownership or permission), compute prices server-side, use POST/DELETE (never GET) for state changes.
