-- Backfill real supplier rows from existing bids so supplier joins resolve again.
-- Run this in Supabase SQL Editor.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH bid_supplier_data AS (
  SELECT DISTINCT ON (b.supplier_id)
    b.supplier_id AS id,
    COALESCE(NULLIF(b.company_name, ''), 'Supplier') AS company_name,
    COALESCE(NULLIF(b.company_name, ''), 'Supplier') AS full_name,
    COALESCE(b.submitted_at, now()) AS created_at,
    COALESCE(b.updated_at, now()) AS updated_at
  FROM bids_bid b
  WHERE b.supplier_id IS NOT NULL
  ORDER BY b.supplier_id, b.updated_at DESC NULLS LAST, b.submitted_at DESC NULLS LAST
)
INSERT INTO public.users (
  id,
  full_name,
  role,
  created_at,
  updated_at,
  company_profile,
  email,
  password_hash,
  status,
  company_name,
  company_address,
  phone,
  business_type,
  verification_status,
  email_verified,
  email_verified_at,
  verified_at,
  is_active
)
SELECT
  id,
  full_name,
  'supplier',
  created_at,
  updated_at,
  company_name,
  'supplier+' || replace(id::text, '-', '') || '@local',
  crypt('supplier123', gen_salt('bf')),
  'approved',
  company_name,
  NULL,
  NULL,
  NULL,
  'verified',
  true,
  now(),
  now(),
  true
FROM bid_supplier_data
ON CONFLICT (id) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  role = 'supplier',
  company_profile = EXCLUDED.company_profile,
  email = EXCLUDED.email,
  password_hash = COALESCE(public.users.password_hash, EXCLUDED.password_hash),
  status = 'approved',
  company_name = EXCLUDED.company_name,
  verification_status = 'verified',
  email_verified = true,
  email_verified_at = COALESCE(public.users.email_verified_at, now()),
  verified_at = COALESCE(public.users.verified_at, now()),
  is_active = true,
  updated_at = now();
