import { PATCH as reviewDocument } from "@/app/api/auth/suppliers/[id]/documents/route";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  const { id, documentId } = await params;
  const body = await request.json().catch(() => ({}));
  const forwarded = new Request(request.url, {
    method: "PATCH",
    headers: request.headers,
    body: JSON.stringify({ ...body, documentType: documentId, action: "approve" }),
  });
  return reviewDocument(forwarded, { params: Promise.resolve({ id }) });
}
