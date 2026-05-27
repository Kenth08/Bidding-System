ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS email_verification_code_hash TEXT NULL,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS email_verification_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ NULL;

-- Existing approved suppliers created before this migration are treated as verified.
UPDATE users
SET email_verified = TRUE,
    email_verified_at = COALESCE(email_verified_at, NOW())
WHERE status IN ('approved', 'active')
  AND COALESCE(email_verified, FALSE) = FALSE;