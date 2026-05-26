# Next.js App — Setup & Development Guide

## Prerequisites

- Node.js 18+
- npm
- Access to the Supabase PostgreSQL database (same one used by the Django backend)

---

## 1. Install Dependencies

```bash
cd next-app
npm install
```

This automatically runs `prisma generate` via the `postinstall` script.

---

## 2. Environment Variables

Create a `.env` file in the `next-app/` directory:

```env
# Database (same Supabase connection string from backend/.env)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Supabase (client-side — prefixed with NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase (server-side)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Note:** The `DATABASE_URL` must be the same database the Django backend uses. Prisma connects directly to it.

---

## 3. Prisma Setup

### Generate the client (already done by `npm install`)

```bash
npm run db:generate
```

### Introspect existing database (pull schema from Supabase)

```bash
npm run db:pull
```

This updates `prisma/schema.prisma` to match the current database tables.

### Push schema changes to database

```bash
npm run db:push
```

Use this when you modify `schema.prisma` and want to sync without creating migration files.

### Create a migration

```bash
npm run db:migrate
```

Creates a migration file in `prisma/migrations/` and applies it.

### Open Prisma Studio (visual DB browser)

```bash
npm run db:studio
```

Opens a browser UI at `http://localhost:5555` to view/edit database records.

---

## 4. Run the Development Server

```bash
npm run dev
```

The app runs at **http://localhost:3000**.

---

## 5. Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start Next.js dev server (port 3000) |
| `build` | `npm run build` | Generate Prisma client + production build |
| `start` | `npm run start` | Start production server |
| `lint` | `npm run lint` | Run ESLint |
| `db:generate` | `npm run db:generate` | Regenerate Prisma client after schema changes |
| `db:pull` | `npm run db:pull` | Pull current DB schema into prisma/schema.prisma |
| `db:push` | `npm run db:push` | Push schema.prisma changes to DB |
| `db:migrate` | `npm run db:migrate` | Create + apply migration |
| `db:studio` | `npm run db:studio` | Open Prisma Studio GUI |

---

## 6. Project Structure

```
next-app/
├── prisma/
│   └── schema.prisma          # Database schema (mirrors Django models)
├── prisma.config.ts           # Prisma config (loads DATABASE_URL from .env)
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── page.tsx           # Landing page (/)
│   │   ├── login/page.tsx     # Login (/login)
│   │   ├── register/page.tsx  # Supplier registration (/register)
│   │   ├── results/page.tsx   # Public results (/results)
│   │   ├── admin/             # Admin pages (/admin/*)
│   │   ├── supplier/          # Supplier pages (/supplier/*)
│   │   ├── school-head/       # School Head pages (/school-head/*)
│   │   └── api/               # API route handlers
│   ├── components/            # Reusable UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Server utilities (db, auth, actions)
│   ├── services/api.ts        # Axios client for frontend API calls
│   ├── stores/auth.ts         # Zustand auth store
│   ├── types/                 # TypeScript interfaces
│   └── middleware.ts          # JWT auth middleware
├── .env                       # Environment variables (not committed)
├── package.json
└── tsconfig.json
```

---

## 7. How It Connects to the Database

```
Browser → Next.js API Routes (src/app/api/*) → Prisma Client → Supabase PostgreSQL
```

- **Prisma** replaces Django ORM — same database, same tables
- **API routes** replace Django REST Framework views
- **JWT (jose)** replaces SimpleJWT — tokens are compatible format
- The frontend calls `/api/*` routes (same-origin, no CORS needed)

---

## 8. Common Tasks

### After modifying prisma/schema.prisma:
```bash
npm run db:generate   # Regenerate TypeScript types
npm run db:push       # Sync changes to database
```

### After pulling latest code:
```bash
npm install           # Installs deps + generates Prisma client
```

### Reset and re-introspect from live database:
```bash
npm run db:pull       # Overwrites schema.prisma with live DB state
npm run db:generate   # Regenerate client
```

---

## 9. Troubleshooting

| Issue | Fix |
|-------|-----|
| `PrismaClientInitializationError` | Check `DATABASE_URL` in `.env` is correct |
| `Cannot find module '@prisma/client'` | Run `npm run db:generate` |
| `relation "xxx" does not exist` | Run `npm run db:pull` to sync schema |
| Port 3000 in use | Use `npm run dev -- -p 3001` |
| JWT errors | Check `JWT_SECRET` matches between environments |

---

## 10. Development Credentials

```
Admin: admin@gmail.com / admin123
```

Same credentials as the Django backend — they share the same database.
