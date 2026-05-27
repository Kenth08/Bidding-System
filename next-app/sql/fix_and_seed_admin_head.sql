-- fix_and_seed_admin_head.sql
-- Single-run script: detects `users.id` type, fixes defaults/sequences, and upserts admin and school_head accounts.
-- IMPORTANT: Replace the example passwords before running in production.

-- Ensure pgcrypto (for crypt(), gen_salt(), gen_random_uuid()) is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  id_type TEXT;
  seq_name TEXT;
BEGIN
  SELECT data_type INTO id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id';

  IF id_type IS NULL THEN
    RAISE EXCEPTION 'Table public.users does not have column id';
  END IF;

  IF id_type = 'uuid' THEN
    -- Ensure default UUID generator
    BEGIN
      EXECUTE 'ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid()';
    EXCEPTION WHEN OTHERS THEN
      -- ignore if cannot alter (will still generate explicit ids below)
      RAISE NOTICE 'Could not set default gen_random_uuid() on public.users.id: %', SQLERRM;
    END;

    -- Ensure no NULL ids
    EXECUTE 'UPDATE public.users SET id = gen_random_uuid() WHERE id IS NULL';

    -- Upsert admin
    EXECUTE $ins_admin$
      WITH upsert AS (
        UPDATE public.users
        SET password_hash = crypt('AdminPass123!', gen_salt('bf')),
            role = 'admin', full_name = 'Administrator', email_verified = true,
            is_active = true, status = 'active', updated_at = now()
        WHERE email = 'admin@gmail.com'
        RETURNING *
      )
      INSERT INTO public.users (id, email, password_hash, role, full_name, email_verified, is_active, status, created_at, updated_at)
      SELECT gen_random_uuid(), 'admin@gmail.com', crypt('AdminPass123!', gen_salt('bf')), 'admin', 'Administrator', true, true, 'active', now(), now()
      WHERE NOT EXISTS (SELECT 1 FROM upsert);
    $ins_admin$;

    -- Upsert school head
    EXECUTE $ins_head$
      WITH upsert AS (
        UPDATE public.users
        SET password_hash = crypt('head123', gen_salt('bf')),
            role = 'school_head', full_name = 'School Head', email_verified = true,
            is_active = true, status = 'active', updated_at = now()
        WHERE email = 'head@gmail.com'
        RETURNING *
      )
      INSERT INTO public.users (id, email, password_hash, role, full_name, email_verified, is_active, status, created_at, updated_at)
      SELECT gen_random_uuid(), 'head@gmail.com', crypt('head123', gen_salt('bf')), 'school_head', 'School Head', true, true, 'active', now(), now()
      WHERE NOT EXISTS (SELECT 1 FROM upsert);
    $ins_head$;

  ELSE
    -- integer / bigint handling
    SELECT pg_get_serial_sequence('public.users', 'id') INTO seq_name;

    IF seq_name IS NOT NULL THEN
      BEGIN
        EXECUTE format('ALTER TABLE public.users ALTER COLUMN id SET DEFAULT nextval(%L)', seq_name);
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not set default nextval for sequence %: %', seq_name, SQLERRM;
      END;
    ELSE
      -- create and initialize a sequence
      EXECUTE 'CREATE SEQUENCE IF NOT EXISTS public.users_id_seq';
      EXECUTE 'SELECT setval(''public.users_id_seq'', COALESCE((SELECT MAX(id) FROM public.users), 0) + 1, false)';
      EXECUTE 'ALTER TABLE public.users ALTER COLUMN id SET DEFAULT nextval(''public.users_id_seq'')';
      seq_name := 'public.users_id_seq';
    END IF;

    -- Assign ids to NULLs using sequence
    IF seq_name IS NOT NULL THEN
      EXECUTE format('UPDATE public.users SET id = nextval(%L) WHERE id IS NULL', seq_name);
    END IF;

    -- Upsert admin (no id column specified so default sequence provides id)
    EXECUTE $ins_admin_int$
      WITH upsert AS (
        UPDATE public.users
        SET password_hash = crypt('AdminPass123!', gen_salt('bf')),
            role = 'admin', full_name = 'Administrator', email_verified = true,
            is_active = true, status = 'active', updated_at = now()
        WHERE email = 'admin@gmail.com'
        RETURNING *
      )
      INSERT INTO public.users (email, password_hash, role, full_name, email_verified, is_active, status, created_at, updated_at)
      SELECT 'admin@gmail.com', crypt('AdminPass123!', gen_salt('bf')), 'admin', 'Administrator', true, true, 'active', now(), now()
      WHERE NOT EXISTS (SELECT 1 FROM upsert);
    $ins_admin_int$;

    -- Upsert school head
    EXECUTE $ins_head_int$
      WITH upsert AS (
        UPDATE public.users
        SET password_hash = crypt('head123', gen_salt('bf')),
            role = 'school_head', full_name = 'School Head', email_verified = true,
            is_active = true, status = 'active', updated_at = now()
        WHERE email = 'head@gmail.com'
        RETURNING *
      )
      INSERT INTO public.users (email, password_hash, role, full_name, email_verified, is_active, status, created_at, updated_at)
      SELECT 'head@gmail.com', crypt('head123', gen_salt('bf')), 'school_head', 'School Head', true, true, 'active', now(), now()
      WHERE NOT EXISTS (SELECT 1 FROM upsert);
    $ins_head_int$;

  END IF;
END
$$;

-- Notes:
-- 1) Replace 'AdminPass123!' and 'head123' with secure temporary passwords before running.
-- 2) After successful login, force a password reset for seeded accounts.
-- 3) This script attempts to be idempotent: running it multiple times will update existing accounts and insert only if missing.
-- 4) If you prefer a node-based seed that uses bcrypt and Prisma, I can add `prisma/seed-admins.js` instead.
