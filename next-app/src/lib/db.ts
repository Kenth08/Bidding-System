import { db as supabaseDb } from "./db-supabase";
import { dbDirect } from "./db-direct";

const isLocalMode = process.env.LOCAL_MODE === "true" || process.env.NEXT_PUBLIC_LOCAL_MODE === "true";

export const db: any = isLocalMode
	? dbDirect
	: {
			...supabaseDb,
			businessType: (supabaseDb as any).businessType ?? (dbDirect as any).businessType,
			supplierBusinessType: (supabaseDb as any).supplierBusinessType ?? (dbDirect as any).supplierBusinessType,
		};
