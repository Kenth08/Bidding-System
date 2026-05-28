import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  const { password_hash, ...safeUser } = user! as any;
  return json(safeUser);
}

export async function PATCH(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json();
  const allowed = ["full_name", "company_name", "company_address", "phone", "business_type", "representative_name", "tin", "company_profile"] as const;
  const data: Record<string, string> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = String(body[key]);
  }

  // If client provided business_type_ids (array of ids or names), sync junction table
  if (Array.isArray(body.business_type_ids)) {
    const items: string[] = body.business_type_ids.map(String).filter(Boolean);
    if (items.length === 0) {
      return json({ error: "At least one business category is required." }, 400);
    }

    async function resolveBusinessTypeIds(items: string[]) {
      const resolved: string[] = [];
      for (const item of items) {
        let bt = null as any;
        try {
          bt = item.match?.(/[0-9a-fA-F\-]{36}/) ? await db.businessType.findUnique({ where: { id: item } }) : null;
        } catch (e) {
          bt = null;
        }
        if (!bt) bt = await db.businessType.findFirst({ where: { name: { equals: item, mode: "insensitive" } } });
        if (!bt) bt = await db.businessType.create({ data: { id: require("uuid").v4(), name: item, description: "", is_active: true } });
        if (bt) resolved.push(bt.id);
      }
      return resolved;
    }

    const resolvedIds = await resolveBusinessTypeIds(items);

    // Delete unselected mappings
    await db.supplierBusinessType.deleteMany({ where: { supplier_id: user!.id, business_type_id: { notIn: resolvedIds } } });

    // Create selected mappings (skip duplicates)
    await db.supplierBusinessType.createMany({ data: resolvedIds.map((btId) => ({ supplier_id: user!.id, business_type_id: btId })), skipDuplicates: true });

    // Update legacy business_type field
    const first = await db.businessType.findUnique({ where: { id: resolvedIds[0] } });
    if (first) data.business_type = first.name;
  }

  const updated = await db.user.update({ where: { id: user!.id }, data });
  const { password_hash, ...safeUser } = updated as any;
  return json(safeUser);
}
