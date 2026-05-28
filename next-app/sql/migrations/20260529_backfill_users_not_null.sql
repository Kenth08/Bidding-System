-- Backfill NULLs and set NOT NULL on critical users columns
BEGIN;

-- Backfill text fields
UPDATE users SET company_name = '' WHERE company_name IS NULL;
UPDATE users SET company_address = '' WHERE company_address IS NULL;
UPDATE users SET phone = '' WHERE phone IS NULL;
UPDATE users SET business_type = '' WHERE business_type IS NULL;

-- Backfill boolean / numeric / enum-like fields
UPDATE users SET not_blacklisted_declaration = false WHERE not_blacklisted_declaration IS NULL;
UPDATE users SET verification_status = 'pending' WHERE verification_status IS NULL;
UPDATE users SET email_verified = false WHERE email_verified IS NULL;
UPDATE users SET email_verification_attempts = 0 WHERE email_verification_attempts IS NULL;
UPDATE users SET is_staff = false WHERE is_staff IS NULL;
UPDATE users SET is_active = true WHERE is_active IS NULL;
UPDATE users SET is_superuser = false WHERE is_superuser IS NULL;

-- Ensure the updates are applied before altering constraints
ANALYZE users;

-- Alter columns to be NOT NULL
ALTER TABLE users ALTER COLUMN company_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN company_address SET NOT NULL;
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
ALTER TABLE users ALTER COLUMN business_type SET NOT NULL;
ALTER TABLE users ALTER COLUMN not_blacklisted_declaration SET NOT NULL;
ALTER TABLE users ALTER COLUMN verification_status SET NOT NULL;
ALTER TABLE users ALTER COLUMN email_verified SET NOT NULL;
ALTER TABLE users ALTER COLUMN email_verification_attempts SET NOT NULL;
ALTER TABLE users ALTER COLUMN is_staff SET NOT NULL;
ALTER TABLE users ALTER COLUMN is_active SET NOT NULL;
ALTER TABLE users ALTER COLUMN is_superuser SET NOT NULL;

COMMIT;

-- End of migration
