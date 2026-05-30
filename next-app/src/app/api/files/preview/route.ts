import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const file = url.searchParams.get("file") || "";
  if (!file) return NextResponse.json({ error: "file query is required" }, { status: 400 });

  // If absolute URL or leading slash, just redirect to it
  if (file.startsWith("http://") || file.startsWith("https://") || file.startsWith("/")) {
    return NextResponse.redirect(file);
  }

  try {
    const bucket = process.env.SUPABASE_BUCKET_NAME || "supplier-documents";
    const { data, error } = await supabaseServer.storage.from(bucket).createSignedUrl(file, 60);
    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "Unable to generate signed url" }, { status: 500 });
    }
    return NextResponse.redirect(data.signedUrl);
  } catch (e) {
    return NextResponse.json({ error: "Failed to preview file" }, { status: 500 });
  }
}
