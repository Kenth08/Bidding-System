<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Next.js E-Procurement App

## Project Overview

Migrated version of the Blockchain E-Procurement System. Originally Django + React, now a unified Next.js 16 app with App Router, TypeScript, Prisma, and Tailwind CSS 4.

## Tech Stack

- **Framework:** Next.js 16 (App Router, `src/` directory)
- **Language:** TypeScript (strict)
- **Styling:** Tailwind CSS 4 (CSS-based `@theme`, no tailwind.config.js)
- **ORM:** Prisma 7 → Supabase PostgreSQL
- **Auth:** JWT via `jose` (sign/verify in API routes, middleware protects pages)
- **State:** Zustand (auth store), local component state
- **HTTP Client:** Axios (frontend → `/api/*` same-origin calls)
- **Icons:** Lucide React
- **Package Manager:** npm (not pnpm)



`
## Key Conventions

1. **All components are `"use client"`** — pages use client-side data fetching via `useEffect` + API calls
2. **API routes** are in `src/app/api/` — they use Prisma directly (server-side only)
3. **Auth flow:** Login → API returns JWT → stored in `sessionStorage` → sent as `Authorization: Bearer` header
4. **No React Router** — Next.js file-based routing handles navigation
5. **Default exports** for all components (not named exports)
6. **Tailwind only** — no CSS modules, no styled-components, no inline styles
7. **UUID primary keys** everywhere — use `uuid` package for generation
8. **`params` is a Promise** in route handlers — always `await params` before accessing `.id`

## API Route Pattern

```typescript
import { db } from "@/lib/db";
import { requireAuth, requireRole, json } from "@/lib/api-utils";

export async function GET(request: Request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  // ... use db.model.findMany() etc.
  return json(data);
}
```

## Database

- Same Supabase PostgreSQL as the Django backend
- Prisma schema mirrors Django models exactly
- Table names use Django's naming: `users`, `projects_project`, `bids_bid`, `procurements`, etc.
- Run `npm run db:generate` after schema changes
- Run `npm run db:pull` to sync from live database

## User Roles

| Role | Route | Layout |
|------|-------|--------|
| `admin` | `/admin/*` | AdminLayout |
| `school_head` | `/school-head/*` | SchoolHeadLayout |
| `supplier` | `/supplier/*` | SupplierLayout |
| `viewer` | `/results` (public) | None |

## Environment Variables

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Scripts

```bash
npm run dev          # Dev server on :3000
npm run build        # prisma generate + next build
npm run db:generate  # Regenerate Prisma client
npm run db:pull      # Introspect live DB → schema.prisma
npm run db:push      # Push schema changes to DB
npm run db:migrate   # Create + apply migration
npm run db:studio    # Visual DB browser on :5555
```

## Important Rules for AI Agents

1. **Never commit `.env`** — only `.env.example` is tracked
2. **UUID primary keys** — never use integer IDs
3. **Default exports** — components use `export default function`, not `export { Component }`
4. **`SkeletonTable`** is a named export from `@/components/ui/Skeleton` (not default)
5. **Toast requires `isVisible` prop** — always pass it
6. **Modal requires `isOpen` prop** — always pass it
7. **ConfirmDialog uses `onClose`** not `onCancel`
8. **LoadingButton uses `isLoading`** not `loading`
9. **SearchBar `onChange`** expects `(e: ChangeEvent<HTMLInputElement>) => void`, not a string setter
10. **`projectsAPI.archive(id, reason)`** requires 2 arguments
11. **`suppliersAPI.updateStatus(id, status)`** — no `.approve()` or `.reject()` methods
12. **Prisma route handlers:** `{ params }` type is `{ params: Promise<{ id: string }> }` — must await
