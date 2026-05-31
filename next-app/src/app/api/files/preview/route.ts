import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get("file") || "";
  if (!file) return NextResponse.json({ error: "Missing file parameter" }, { status: 400 });

  // Absolute URL — redirect directly
  if (file.startsWith("http://") || file.startsWith("https://")) {
    return NextResponse.redirect(file);
  }

  // Local public file path — convert to absolute URL
  if (file.startsWith("/")) {
    return NextResponse.redirect(new URL(file, request.nextUrl.origin));
  }

  // Supabase storage path — generate signed URL
  try {
    const bucket = request.nextUrl.searchParams.get("bucket") || process.env.SUPABASE_BUCKET_NAME || "supplier-documents";
    const { data, error } = await supabaseServer.storage.from(bucket).createSignedUrl(file, 60);
    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "Unable to generate signed url" }, { status: 500 });
    }
    return NextResponse.redirect(data.signedUrl);
  } catch {
    return NextResponse.json({ error: "Failed to preview file" }, { status: 500 });
  }
}
