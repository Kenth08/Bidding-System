import { db } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function logAudit(action: string, userId: string | null, description: string, resourceType = "", resourceId = "") {
  await db.auditLog.create({
    data: { id: uuid(), action, user_id: userId, description, resource_type: resourceType, resource_id: String(resourceId) },
  });
}

export async function createNotification(params: {
  recipientId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  relatedId?: string;
  resourceType?: string;
  resourceId?: string;
}) {
  await db.notification.create({
    data: {
      id: uuid(),
      recipient_id: params.recipientId,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link || null,
      related_id: params.relatedId || null,
      resource_type: params.resourceType || null,
      resource_id: params.resourceId || null,
    },
  });
}

export async function notifyAdmins(type: string, title: string, message: string, link?: string, relatedId?: string) {
  const admins = await db.user.findMany({ where: { role: "admin", is_active: true } });
  for (const admin of admins) {
    await createNotification({ recipientId: admin.id, type, title, message, link, relatedId });
  }
}

export async function notifyUser(userId: string, type: string, title: string, message: string, link?: string, relatedId?: string) {
  await createNotification({ recipientId: userId, type, title, message, link, relatedId });
}

export async function notifySuppliers(type: string, title: string, message: string, link?: string, relatedId?: string) {
  const suppliers = await db.user.findMany({ where: { role: "supplier", is_active: true } });
  for (const supplier of suppliers) {
    await createNotification({ recipientId: supplier.id, type, title, message, link, relatedId });
  }
}
