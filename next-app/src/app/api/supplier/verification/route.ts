import { GET as getSupplierDocs } from "@/app/api/auth/supplier-documents/route";

export async function GET(request: Request) {
  return getSupplierDocs(request);
}
