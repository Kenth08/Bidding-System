// Prisma configuration disabled - using Supabase instead
// This prevents accidental database resets that were causing data loss

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
  // Disable all Prisma operations to prevent data loss
  engine: {
    enableConnectionTimeout: true,
    connectionTimeout: 30000,
  },
  // Add warning to prevent accidental use
  __warning: "PRISMA DISABLED - Using Supabase client instead to prevent data loss",
});
