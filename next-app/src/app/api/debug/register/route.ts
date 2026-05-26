import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { v4 as uuid } from "uuid";

export async function GET() {
  const testUserId = uuid();
  const results: Record<string, any> = {};
  
  // Test 1: Check users table INSERT
  try {
    const { error } = await supabaseServer
      .from('users')
      .insert({
        id: testUserId,
        full_name: 'Test User',
        email: `test-${Date.now()}@test.com`,
        password_hash: 'test',
        role: 'supplier',
        status: 'pending'
      })
      .select()
      .single();
    
    results.users = error ? { error: error.message, code: error.code } : { success: true };
  } catch (error: any) {
    results.users = { error: error.message };
  }
  
  // Test 2: Check document_uploads table INSERT
  try {
    const { error } = await supabaseServer
      .from('document_uploads')
      .insert({
        id: uuid(),
        user_id: testUserId,
        document_type: 'test',
        file_name: 'test.pdf',
        file: '/uploads/test.pdf'
      })
      .select()
      .single();
    
    results.document_uploads = error ? { error: error.message, code: error.code } : { success: true };
  } catch (error: any) {
    results.document_uploads = { error: error.message };
  }
  
  // Test 3: Check audit_logs table INSERT
  try {
    const { error } = await supabaseServer
      .from('audit_logs')
      .insert({
        id: uuid(),
        action: 'TEST',
        user_id: testUserId,
        description: 'Test audit log',
        resource_type: 'test',
        resource_id: 'test'
      })
      .select()
      .single();
    
    results.audit_logs = error ? { error: error.message, code: error.code } : { success: true };
  } catch (error: any) {
    results.audit_logs = { error: error.message };
  }
  
  // Test 4: Check notifications table INSERT
  try {
    const { error } = await supabaseServer
      .from('notifications')
      .insert({
        id: uuid(),
        recipient_id: testUserId,
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test'
      })
      .select()
      .single();
    
    results.notifications = error ? { error: error.message, code: error.code } : { success: true };
  } catch (error: any) {
    results.notifications = { error: error.message };
  }
  
  return NextResponse.json({
    message: 'Table permission test results',
    results,
    summary: {
      allTablesWork: Object.values(results).every(r => !r.error),
      tablesWithErrors: Object.entries(results)
        .filter(([_, r]) => r.error)
        .map(([table, _]) => table)
    }
  });
}