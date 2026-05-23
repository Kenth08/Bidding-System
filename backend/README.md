# Backend (Django)

Professional Django backend scaffold, separated from frontend.

## Structure

- `config/` project config and environment-specific settings
- `apps/` domain apps (`accounts` is included as a starter)
- `manage.py` Django CLI entrypoint

## Quick start

1. Create virtual environment and activate it.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and set `DATABASE_URL` to your Supabase Session Pooler connection string.
4. Run migrations:

```bash
python manage.py migrate
```

5. Run development server:

```bash
python manage.py runserver
```

## PostgreSQL with Supabase

Set `DATABASE_URL` in `.env` to your Supabase Session Pooler connection string on Windows or other IPv4-only networks.
Keep `sslmode=require` in the URL unless Supabase already includes it.

## Authentication Model

This backend uses Django for authentication and authorization only.

- Supabase provides PostgreSQL storage.
- Django stores users, permissions, sessions, and application data in that database.
- Login, registration, and JWT issuance stay in Django.

## API base path

- `GET /api/v1/health/`
- `GET /api/v1/accounts/me/`
