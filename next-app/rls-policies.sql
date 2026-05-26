-- PROPER RLS POLICIES FOR BIDDING SYSTEM
-- Run this in Supabase SQL Editor
-- These policies work with anon key (no service role key needed)

-- 1. USERS TABLE POLICIES
-- Enable INSERT for registration (anyone can create user)
CREATE POLICY "Anyone can insert users for registration" ON users
FOR INSERT WITH CHECK (true);

-- Enable SELECT for own user data
CREATE POLICY "Users can read own data" ON users
FOR SELECT USING (auth.uid() = id OR role IN ('admin', 'school_head'));

-- Enable UPDATE for own user data
CREATE POLICY "Users can update own data" ON users
FOR UPDATE USING (auth.uid() = id OR role IN ('admin', 'school_head'));

-- 2. DOCUMENT_UPLOADS TABLE POLICIES
CREATE POLICY "Users can insert own documents" ON document_uploads
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own documents" ON document_uploads
FOR SELECT USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'school_head')
));

-- 3. AUDIT_LOGS TABLE POLICIES
-- Only admins can insert audit logs (via server-side code)
CREATE POLICY "Server can insert audit logs" ON audit_logs
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read audit logs" ON audit_logs
FOR SELECT USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

-- 4. NOTIFICATIONS TABLE POLICIES
CREATE POLICY "Server can insert notifications" ON notifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own notifications" ON notifications
FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update own notifications" ON notifications
FOR UPDATE USING (auth.uid() = recipient_id);

-- 5. PROJECTS_PROJECT TABLE POLICIES
CREATE POLICY "Anyone can read active projects" ON projects_project
FOR SELECT USING (status = 'active' OR EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'school_head')
));

CREATE POLICY "Admins can manage projects" ON projects_project
FOR ALL USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'school_head')
));

-- 6. BIDS_BID TABLE POLICIES
CREATE POLICY "Suppliers can insert own bids" ON bids_bid
FOR INSERT WITH CHECK (
  auth.uid() = supplier_id AND 
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supplier' AND status IN ('active', 'approved'))
);

CREATE POLICY "Users can read relevant bids" ON bids_bid
FOR SELECT USING (
  auth.uid() = supplier_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'school_head')) OR
  EXISTS (SELECT 1 FROM projects_project WHERE id = project_id AND status = 'awarded')
);

-- 7. PROCUREMENTS TABLE POLICIES
CREATE POLICY "School heads can insert procurements" ON procurements
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'school_head'
));

CREATE POLICY "Users can read relevant procurements" ON procurements
FOR SELECT USING (
  auth.uid() = created_by_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'school_head'))
);

-- 8. BLOCKCHAIN_BLOCKCHAINRECORD TABLE POLICIES
CREATE POLICY "Anyone can read blockchain records" ON blockchain_blockchainrecord
FOR SELECT USING (true);

CREATE POLICY "Admins can insert blockchain records" ON blockchain_blockchainrecord
FOR INSERT WITH CHECK (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

-- VERIFY POLICIES ARE CREATED
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;