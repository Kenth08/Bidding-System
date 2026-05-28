import { db as supabaseDb } from "./db-supabase";
import { dbDirect } from "./db-direct";

const isLocalMode = process.env.LOCAL_MODE === "true" || process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

export const db: any = isLocalMode ? dbDirect : supabaseDb;
