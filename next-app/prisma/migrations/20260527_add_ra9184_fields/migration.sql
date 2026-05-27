-- Migration: add RA 9184 compliance fields (May 27, 2026)

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "philgeps_registration_expiry" TIMESTAMP;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "bir_form_2303" TEXT;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "valid_id_type" VARCHAR(255);

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "valid_id_number" VARCHAR(255);

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "representative_job_title" VARCHAR(255);

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "iso_certificate_type" VARCHAR(255);

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "iso_certificate" VARCHAR(255);

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "iso_certificate_expiry" TIMESTAMP;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "bank_name" VARCHAR(255);

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "bank_account_name" VARCHAR(255);

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "bank_account_number" VARCHAR(255);

-- Document uploads: per-document verification notes and verifier metadata
ALTER TABLE "document_uploads"
  ADD COLUMN IF NOT EXISTS "verification_notes" TEXT;

ALTER TABLE "document_uploads"
  ADD COLUMN IF NOT EXISTS "verified_by_id" UUID;

ALTER TABLE "document_uploads"
  ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP;

-- Bids: signature and SCM details
ALTER TABLE "bids_bid"
  ADD COLUMN IF NOT EXISTS "past_scm_issues_details" TEXT;

ALTER TABLE "bids_bid"
  ADD COLUMN IF NOT EXISTS "signed_bid_form" VARCHAR(255);

ALTER TABLE "bids_bid"
  ADD COLUMN IF NOT EXISTS "digital_signature" VARCHAR(255);

ALTER TABLE "bids_bid"
  ADD COLUMN IF NOT EXISTS "signature_name" VARCHAR(255);

ALTER TABLE "bids_bid"
  ADD COLUMN IF NOT EXISTS "signature_signed_at" TIMESTAMP;

-- End migration
