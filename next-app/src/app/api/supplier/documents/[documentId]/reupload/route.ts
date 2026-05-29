import { POST as reuploadDocument } from "@/app/api/auth/supplier-documents/[documentType]/route";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  return reuploadDocument(request, {
    params: Promise.resolve({ documentType: documentId }),
  });
}
