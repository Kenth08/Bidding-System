Admin & School Head SQL — README

What this contains
- `create_admin_head.sql` — SQL to update-or-insert two accounts:
  - admin@gmail.com (role `admin`) with example password `AdminPass123!`
  - head@gmail.com (role `school_head`) with example password `head123`

How to run
1. Open your Supabase project.
2. Go to "SQL" -> "Query Editor".
3. Paste the contents of `create_admin_head.sql` and run.

Important notes
- The script uses `pgcrypto` functions `crypt()` and `gen_salt('bf')` to compute bcrypt hashes on the server. The script includes `CREATE EXTENSION IF NOT EXISTS pgcrypto;` but if you are denied permission, compute bcrypt hashes locally and replace `crypt(...)` expressions with the hashed string.
 - If your `public.users` table uses a UUID `id` column but had no default, the script now sets a server default using `gen_random_uuid()` when applicable and also explicitly generates UUIDs for inserted rows so `id` will not be NULL.
 - If your `id` column is an integer serial, the UUID generation will not apply; instead run a variant that sets a proper sequence default or compute integer ids via your existing sequence. Reply here and I will provide the exact SQL for integer `id` columns.
- Replace the example plaintext passwords before running in production.
- After running, ask the administrators to reset their passwords immediately.
- If you want different emails or passwords, edit the SQL before running.

Next steps
- Run the SQL and then try logging in as `admin@gmail.com` and `head@gmail.com` using the passwords you chose.
- If login fails, reply here with the error message and I will help debug.
