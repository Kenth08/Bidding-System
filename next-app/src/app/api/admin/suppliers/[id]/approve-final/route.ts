import { POST as approveAllUnlock } from "@/app/api/auth/suppliers/[id]/approve-all-unlock/route";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return approveAllUnlock(request, { params });
}
