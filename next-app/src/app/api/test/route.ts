import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    // Test read-only query (should work with anon key)
    const { data, error } = await supabaseServer
      .from('projects_project')
      .select('id, title')
      .limit(2);
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        code: error.code,
        hint: "Anon key may not have read permission"
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Supabase connection works!",
      data: data || [],
      tables: ["users", "projects_project", "bids_bid", "procurements", "audit_logs", "notifications", "document_uploads"]
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      details: "Check Supabase dashboard → Table Editor → Policies"
    }, { status: 500 });
  }
}