import { POST as reuploadDocument } from "@/app/api/auth/supplier-documents/[documentType]/route";
import { getSupplierWorkflow, updateSupplierWorkflow, addSupplierWorkflowActivity } from "@/lib/supplier-workflow-db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;
  
  // Parse the form data from the incoming request and construct a new Request
  // to avoid Next.js stream forwarding errors (Cannot read properties of undefined reading 'read')
  const formData = await request.formData();
  const newRequest = new Request(request.url, {
    method: "POST",
    headers: {
      // Forward authentication and cookies
      cookie: request.headers.get("cookie") || "",
      authorization: request.headers.get("authorization") || "",
    },
    body: formData,
  });

  return reuploadDocument(newRequest, {
    params: Promise.resolve({ documentType: documentId }),
  });
}
