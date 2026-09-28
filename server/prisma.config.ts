import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node src/seed/seed.permissions.js",
  },
  datasource: {
    // Read directly rather than through Prisma's env() helper: env() throws when the variable is missing,
    // which would break `prisma generate` in the postinstall step on build hosts that only expose runtime
    // secrets later. Commands that actually need a database (migrate, studio) still fail with a clear error.
    url: process.env.DATABASE_URL as string,
  },
});
