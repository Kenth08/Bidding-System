import { GET as getWorkflow } from "@/app/api/auth/suppliers/[id]/documents/route";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return getWorkflow(request, { params });
}
