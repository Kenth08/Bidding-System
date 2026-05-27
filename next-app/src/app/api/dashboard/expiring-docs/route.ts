import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { user, error } = await requireRole(request, "admin");
  if (error) return error;

  const now = new Date();
  const cutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Find users with any expiry fields within next 30 days
  const users = await db.user.findMany({
    where: {
      OR: [
        { mayors_permit_expiry: { gte: now, lte: cutoff } },
        { tax_clearance_expiry: { gte: now, lte: cutoff } },
        { philgeps_registration_expiry: { gte: now, lte: cutoff } },
        { iso_certificate_expiry: { gte: now, lte: cutoff } },
      ],
    },
    select: {
      id: true,
      full_name: true,
      company_name: true,
      mayors_permit_expiry: true,
      tax_clearance_expiry: true,
      philgeps_registration_expiry: true,
      iso_certificate_expiry: true,
    },
    orderBy: { mayors_permit_expiry: "asc" },
  });

  const items: any[] = [];
  for (const u of users) {
    if (u.mayors_permit_expiry && u.mayors_permit_expiry >= now && u.mayors_permit_expiry <= cutoff) items.push({ user_id: u.id, name: u.company_name || u.full_name, document: "Mayor's Permit", expiry: u.mayors_permit_expiry });
    if (u.tax_clearance_expiry && u.tax_clearance_expiry >= now && u.tax_clearance_expiry <= cutoff) items.push({ user_id: u.id, name: u.company_name || u.full_name, document: "Tax Clearance", expiry: u.tax_clearance_expiry });
    if (u.philgeps_registration_expiry && u.philgeps_registration_expiry >= now && u.philgeps_registration_expiry <= cutoff) items.push({ user_id: u.id, name: u.company_name || u.full_name, document: "PhilGEPS Registration", expiry: u.philgeps_registration_expiry });
    if (u.iso_certificate_expiry && u.iso_certificate_expiry >= now && u.iso_certificate_expiry <= cutoff) items.push({ user_id: u.id, name: u.company_name || u.full_name, document: "ISO Certificate", expiry: u.iso_certificate_expiry });
  }

  return json({ items, count: items.length });
}
