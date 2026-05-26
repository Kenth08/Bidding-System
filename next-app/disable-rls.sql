-- DISABLE RLS ON ALL TABLES (TEMPORARY FIX)
-- Run this in Supabase dashboard → SQL Editor to get your app working
-- Then implement proper RLS policies before production

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE document_uploads DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects_project DISABLE ROW LEVEL SECURITY;
ALTER TABLE bids_bid DISABLE ROW LEVEL SECURITY;
ALTER TABLE procurements DISABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_blockchainrecord DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'users', 'document_uploads', 'audit_logs', 'notifications',
  'projects_project', 'bids_bid', 'procurements', 'blockchain_blockchainrecord'
)
ORDER BY tablename;

-- Expected result: All tables should have rowsecurity = false