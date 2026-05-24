import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    message: "Test endpoint works",
    timestamp: new Date().toISOString(),
    path: "/api/test-simple"
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: "POST works too",
    timestamp: new Date().toISOString()
  });
}