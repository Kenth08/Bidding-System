import { db } from "@/lib/db";
import { json } from "@/lib/api-utils";

export async function GET() {
  const count = await db.bid.count();
  return json({ count });
}
