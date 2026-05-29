import { POST as notifyFlagged } from "@/app/api/auth/suppliers/[id]/notify-flagged/route";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return notifyFlagged(request, { params });
}
