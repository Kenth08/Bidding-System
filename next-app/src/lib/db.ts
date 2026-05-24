// Import the Supabase-based database utility
// This replaces the Prisma client to prevent data loss issues
import { db } from "./db-supabase";

export { db };
