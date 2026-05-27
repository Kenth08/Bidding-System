-- SQL: create_admin_head.sql
-- Run this in Supabase SQL editor (or psql) to ensure admin and school-head accounts exist
-- WARNING: Replace the example passwords before running in production.

-- Ensure pgcrypto is available (for crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;
 
-- If `id` is a UUID column, set a server default using gen_random_uuid().
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    EXECUTE 'ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid()';
  END IF;
END
$$;
-- Update existing admin (if present)
UPDATE public.users
SET
  password_hash = crypt('AdminPass123!', gen_salt('bf')),
  role = 'admin',
  full_name = 'Administrator',
  email_verified = true,
  is_active = true,
  status = 'active',
  updated_at = now()
WHERE email = 'admin@gmail.com';

-- Insert admin if not exists
INSERT INTO public.users (id, email, password_hash, role, full_name, email_verified, is_active, status, created_at, updated_at)
SELECT gen_random_uuid(), 'admin@gmail.com', crypt('AdminPass123!', gen_salt('bf')), 'admin', 'Administrator', true, true, 'active', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@gmail.com');

-- Update existing school head (if present)
UPDATE public.users
SET
  password_hash = crypt('head123', gen_salt('bf')),
  role = 'school_head',
  full_name = 'School Head',
  email_verified = true,
  is_active = true,
  status = 'active',
  updated_at = now()
WHERE email = 'head@gmail.com';

-- Insert school head if not exists
INSERT INTO public.users (id, email, password_hash, role, full_name, email_verified, is_active, status, created_at, updated_at)
SELECT gen_random_uuid(), 'head@gmail.com', crypt('head123', gen_salt('bf')), 'school_head', 'School Head', true, true, 'active', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'head@gmail.com');

COMMIT;

-- Notes:
-- 1) The SQL uses PostgreSQL's crypt() + gen_salt('bf') to create bcrypt hashes on the server; pgcrypto must be installed.
-- 2) Change the plaintext passwords to secure values before running. After running, inform users to change their passwords.
-- 3) If your DB does not support crypt()/gen_salt, compute bcrypt hashes locally and update the statements to set password_hash = '<bcrypt-hash>'.
-- 4) This script updates or inserts only the two accounts and sets them active and email_verified=true.
