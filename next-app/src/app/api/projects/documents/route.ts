import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { requireAuth, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const where = user!.role === "admin" ? {} : { user_id: user!.id };
  const docs = await db.documentUpload.findMany({ where, orderBy: { created_at: "desc" } });
  return json(docs);
}

export async function POST(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json();
  const doc = await db.documentUpload.create({
    data: {
      id: uuid(),
      user_id: user!.id,
      document_type: body.document_type || "general",
      file_name: body.file_name || "document",
      file: body.file || null,
      file_size: body.file_size || 0,
    },
  });

  return json(doc, 201);
}
