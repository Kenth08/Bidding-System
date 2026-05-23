# Next.js Migration Plan

## Why

- **Solo developer** — managing separate frontend (React + Vite) and backend (Django + DRF) is overhead
- **Unified codebase** — one repo, one deploy, one language (TypeScript everywhere)
- **Simpler deployment** — Next.js handles both SSR/CSR and API routes in one process
- **Better DX** — no CORS config, no proxy setup, shared types between frontend and backend

## What

Migrate the existing **Blockchain E-Procurement System** from:
- `frontend/` (React 19 + Vite 7 + Tailwind CSS 3.4 + JavaScript)
- `backend/` (Django 5.1 + DRF 3.15 + SimpleJWT)

Into:
- `next-app/` (Next.js 16 + TypeScript + Tailwind CSS 4 + App Router)

### Rules
- **Pixel-perfect UI** — no redesign, no restyle, no improvements
- **Same database** — connect to the same Supabase PostgreSQL
- **Same behavior** — all workflows remain identical
- **No deletions without permission** — old `frontend/` and `backend/` stay until explicitly told to remove

## How — Migration Strategy

### Approach
1. Build in `next-app/` subfolder (isolated from existing code)
2. Reference `frontend/` for exact UI replication
3. Once verified, delete old folders and move Next.js to root

### Package Manager
- **npm** (not pnpm — caused build script approval issues on Windows)

---

## Current Progress

| Step | Status | Notes |
|------|--------|-------|
| 1. Scaffold Next.js | ✅ Done | `npx create-next-app@latest next-app --typescript --tailwind --eslint --app --src-dir` |
| 2. Configure Tailwind + globals.css | ✅ Done | Copied exact CSS variables, Inter font, custom theme (navy-900, glow shadow) |
| 3. Install dependencies | ✅ Done | axios, lucide-react, zustand, @tanstack/react-query, zod, jose, bcryptjs, prisma, @prisma/client, uuid, @supabase/supabase-js |
| 4. Define TypeScript types | ✅ Done | src/types/ — user, project, bid, procurement, blockchain, notification |
| 5. Set up Prisma schema | ✅ Done | prisma/schema.prisma — all Django models mirrored, validated, client generated |
| 5b. Set up lib + stores + services | ✅ Done | db.ts, auth.ts (jose JWT), supabase.ts, stores/auth.ts (zustand), services/api.ts |
| 6. Build API routes | ⬜ Pending | |
| 7. Set up auth (middleware) | ⬜ Pending | |
| 8. Migrate frontend components | ⬜ Pending | |
| 9. Migrate pages | ⬜ Pending | |
| 10. Test & verify | ⬜ Pending | |

---

## Step-by-Step Plan

### Step 1 — Scaffold ✅
```bash
npx create-next-app@latest next-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

### Step 2 — Tailwind + Global Styles ✅
- Replaced `globals.css` with exact copy of `frontend/src/index.css`
- Added Tailwind v4 `@theme inline` block for custom colors (`navy-900`) and shadows (`glow`)
- Inter font imported via Google Fonts

### Step 3 — Install Dependencies (IN PROGRESS)
```bash
cd next-app
npm install axios lucide-react @supabase/supabase-js zustand @tanstack/react-query zod jose bcryptjs prisma @prisma/client uuid
```

| Package | Replaces | Purpose |
|---------|----------|---------|
| `axios` | Same as before | HTTP client with interceptors |
| `lucide-react` | Same as before | Icon library |
| `@supabase/supabase-js` | Same as before | Supabase client |
| `zustand` | React Context (AuthContext + DataContext) | Simpler state management, no provider nesting |
| `@tanstack/react-query` | Manual useEffect + useState fetching | Auto caching, loading states, refetch |
| `zod` | Django serializer validation | Type-safe request/response validation |
| `jose` | SimpleJWT | JWT sign/verify/refresh in API routes |
| `bcryptjs` | Django password hashing | Password hashing |
| `prisma` + `@prisma/client` | Django ORM | Database ORM with type safety |
| `uuid` | Django uuid4 | UUID generation for primary keys |

### Step 4 — TypeScript Types
Create `src/types/` with interfaces mirroring Django models:
- `user.ts` — User (id, email, full_name, role, status, company fields)
- `project.ts` — Project (id, title, budget, deadline, status, procurement_type, etc.)
- `bid.ts` — Bid (id, project, supplier, bid_amount, status, documents, etc.)
- `procurement.ts` — Procurement request (id, project_title, budget, status, etc.)
- `blockchain.ts` — BlockchainRecord (id, project, bid, winner, hash, etc.)
- `notification.ts` — Notification (id, recipient, type, title, message, is_read, etc.)

### Step 5 — Prisma Schema
- Create `prisma/schema.prisma` mirroring all Django models
- Connect to same Supabase PostgreSQL via `DATABASE_URL`
- Run `npx prisma db pull` to introspect existing tables
- Generate client with `npx prisma generate`

### Step 6 — API Routes
Map all Django endpoints to Next.js `src/app/api/` route handlers:

| Django Path | Next.js Route | Methods |
|-------------|---------------|---------|
| `/api/v1/auth/login/` | `/api/auth/login/route.ts` | POST |
| `/api/v1/auth/register/` | `/api/auth/register/route.ts` | POST |
| `/api/v1/auth/me/` | `/api/auth/me/route.ts` | GET, PATCH |
| `/api/v1/auth/token/refresh/` | `/api/auth/token/refresh/route.ts` | POST |
| `/api/v1/auth/users/` | `/api/auth/users/route.ts` | GET, POST |
| `/api/v1/auth/users/<id>/` | `/api/auth/users/[id]/route.ts` | PATCH, DELETE |
| `/api/v1/auth/suppliers/` | `/api/auth/suppliers/route.ts` | GET |
| `/api/v1/auth/suppliers/<id>/status/` | `/api/auth/suppliers/[id]/status/route.ts` | PATCH |
| `/api/v1/projects/` | `/api/projects/route.ts` | GET, POST |
| `/api/v1/projects/<id>/` | `/api/projects/[id]/route.ts` | GET, PATCH, DELETE |
| `/api/v1/projects/<id>/publish/` | `/api/projects/[id]/publish/route.ts` | PATCH |
| `/api/v1/projects/<id>/archive/` | `/api/projects/[id]/archive/route.ts` | PATCH |
| `/api/v1/projects/<id>/unarchive/` | `/api/projects/[id]/unarchive/route.ts` | PATCH |
| `/api/v1/projects/history/` | `/api/projects/history/route.ts` | GET |
| `/api/v1/projects/approved-records/` | `/api/projects/approved-records/route.ts` | GET |
| `/api/v1/projects/audit-logs/` | `/api/projects/audit-logs/route.ts` | GET |
| `/api/v1/projects/documents/` | `/api/projects/documents/route.ts` | GET, POST |
| `/api/v1/projects/public/stats/` | `/api/projects/public/stats/route.ts` | GET |
| `/api/v1/procurement-requests/` | `/api/procurement-requests/route.ts` | GET, POST |
| `/api/v1/procurement-requests/<id>/` | `/api/procurement-requests/[id]/route.ts` | GET, PATCH, DELETE |
| `/api/v1/procurement-requests/<id>/review/` | `/api/procurement-requests/[id]/review/route.ts` | PATCH |
| `/api/v1/bids/` | `/api/bids/route.ts` | GET, POST |
| `/api/v1/bids/public/` | `/api/bids/public/route.ts` | GET |
| `/api/v1/bids/<id>/` | `/api/bids/[id]/route.ts` | GET, PATCH |
| `/api/v1/bids/<id>/review/` | `/api/bids/[id]/review/route.ts` | PATCH |
| `/api/v1/bids/<id>/remarks/` | `/api/bids/[id]/remarks/route.ts` | PATCH |
| `/api/v1/bids/<id>/select/` | `/api/bids/[id]/select/route.ts` | PATCH |
| `/api/v1/bids/<id>/record/` | `/api/bids/[id]/record/route.ts` | POST |
| `/api/v1/bids/<id>/documents/noa/` | `/api/bids/[id]/documents/noa/route.ts` | GET |
| `/api/v1/bids/<id>/documents/ntp/` | `/api/bids/[id]/documents/ntp/route.ts` | GET |
| `/api/v1/bids/<id>/documents/resolution/` | `/api/bids/[id]/documents/resolution/route.ts` | GET |
| `/api/v1/blockchain/public/` | `/api/blockchain/public/route.ts` | GET |
| `/api/v1/blockchain/verify/` | `/api/blockchain/verify/route.ts` | GET |
| `/api/v1/blockchain/admin/` | `/api/blockchain/admin/route.ts` | GET |
| `/api/v1/blockchain/admin/<id>/` | `/api/blockchain/admin/[id]/route.ts` | GET |
| `/api/v1/blockchain/supplier/` | `/api/blockchain/supplier/route.ts` | GET |
| `/api/v1/notifications/` | `/api/notifications/route.ts` | GET |
| `/api/v1/notifications/unread-count/` | `/api/notifications/unread-count/route.ts` | GET |
| `/api/v1/notifications/read-all/` | `/api/notifications/read-all/route.ts` | PATCH |
| `/api/v1/notifications/<id>/read/` | `/api/notifications/[id]/read/route.ts` | PATCH |
| `/api/v1/dashboard/stats/` | `/api/dashboard/stats/route.ts` | GET |
| `/api/v1/reports/procurement/` | `/api/reports/procurement/route.ts` | GET |
| `/api/v1/reports/suppliers/` | `/api/reports/suppliers/route.ts` | GET |
| `/api/v1/public/results/` | `/api/public/results/route.ts` | GET |

### Step 7 — Auth Middleware
- `src/middleware.ts` — validates JWT from Authorization header
- Protects `/admin/*`, `/supplier/*`, `/school-head/*` routes
- Checks user role matches allowed roles per route
- Replaces Django's `IsAdmin`, `IsSchoolHead`, `IsSupplier` permission classes

### Step 8 — Migrate Frontend Components
Copy from `frontend/src/components/` → `next-app/src/components/`:
- `.jsx` → `.tsx` (add TypeScript types)
- JSX stays **exactly the same** — same Tailwind classes, same structure
- Replace `useNavigate()` → `useRouter()` from `next/navigation`
- Replace `useLocation()` → `usePathname()` from `next/navigation`
- Replace `<Link>` from react-router-dom → `<Link>` from `next/link`
- Add `"use client"` directive to components using hooks/state

Components to migrate:
```
components/
├── shared/       → Modal, StatusBadge, StatCard, Toast, EmptyState, NotificationPanel, ConfirmDialog, AwardDocumentModal, SearchBar, ProtectedRoute
├── admin/        → AdminHeader, AdminSidebar, AdminSearchDropdown
├── supplier/     → SupplierHeader, SupplierSidebar, SupplierSearchDropdown, SupplierProfileModal, SupplierSettingsModal
├── school_head/  → SchoolHeadHeader, SchoolHeadSidebar
└── ui/           → Skeleton, LoadingButton
```

### Step 9 — Migrate Pages
Map current pages to Next.js file-based routing:

| Current File | Next.js Route |
|-------------|---------------|
| `pages/public/LandingPage.jsx` | `app/page.tsx` |
| `pages/auth/LoginPage.jsx` | `app/login/page.tsx` |
| `pages/auth/RegisterPage.jsx` | `app/register/page.tsx` |
| `pages/public/PublicResultsPage.jsx` | `app/results/page.tsx` |
| `layouts/AdminLayout.jsx` | `app/admin/layout.tsx` |
| `pages/admin/AdminDashboard.jsx` | `app/admin/page.tsx` |
| `pages/admin/AdminProjects.jsx` | `app/admin/projects/page.tsx` |
| `pages/admin/AdminProcurementPlanning.jsx` | `app/admin/procurement/page.tsx` |
| `pages/admin/AdminSuppliers.jsx` | `app/admin/suppliers/page.tsx` |
| `pages/admin/AdminBidEvaluation.jsx` | `app/admin/bid-evaluation/page.tsx` |
| `pages/admin/AdminAwarding.jsx` | `app/admin/awarding/page.tsx` |
| `pages/admin/AdminUsers.jsx` | `app/admin/users/page.tsx` |
| `pages/admin/AdminBlockchain.jsx` | `app/admin/blockchain/page.tsx` |
| `pages/admin/AdminReports.jsx` | `app/admin/reports/page.tsx` |
| `layouts/SupplierLayout.jsx` | `app/supplier/layout.tsx` |
| `pages/supplier/SupplierDashboard.jsx` | `app/supplier/page.tsx` |
| `pages/supplier/SupplierProjects.jsx` | `app/supplier/projects/page.tsx` |
| `pages/supplier/SupplierMyBids.jsx` | `app/supplier/bids/page.tsx` |
| `pages/supplier/SupplierResults.jsx` | `app/supplier/results/page.tsx` |
| `pages/supplier/SupplierProfile.jsx` | `app/supplier/profile/page.tsx` |
| `layouts/SchoolHeadLayout.jsx` | `app/school-head/layout.tsx` |
| `pages/school_head/SchoolHeadDashboard.jsx` | `app/school-head/page.tsx` |
| `pages/school_head/SchoolHeadRequests.jsx` | `app/school-head/requests/page.tsx` |
| `pages/school_head/SchoolHeadApprovedProjects.jsx` | `app/school-head/history/page.tsx` |

### Step 10 — Test & Verify
- Run both apps side-by-side (old on :5174, new on :3000)
- Compare every page visually — must be pixel-perfect
- Test all workflows per role (login, CRUD, bid submission, etc.)
- Verify API responses match Django's output format
- Once confirmed working → ask permission to delete old folders and move to root

---

## Project Structure (Final)

```
next-app/
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Landing page
│   │   ├── globals.css
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── results/page.tsx
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── procurement/page.tsx
│   │   │   ├── suppliers/page.tsx
│   │   │   ├── bid-evaluation/page.tsx
│   │   │   ├── awarding/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── blockchain/page.tsx
│   │   │   └── reports/page.tsx
│   │   ├── supplier/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── bids/page.tsx
│   │   │   ├── results/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── school-head/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── requests/page.tsx
│   │   │   └── history/page.tsx
│   │   └── api/
│   │       ├── auth/...
│   │       ├── projects/...
│   │       ├── procurement-requests/...
│   │       ├── bids/...
│   │       ├── blockchain/...
│   │       ├── notifications/...
│   │       ├── dashboard/...
│   │       ├── reports/...
│   │       └── public/...
│   ├── components/
│   │   ├── shared/
│   │   ├── admin/
│   │   ├── supplier/
│   │   ├── school_head/
│   │   └── ui/
│   ├── stores/                         # Zustand stores
│   │   ├── auth.ts
│   │   └── data.ts
│   ├── services/
│   │   └── api.ts                      # Axios instance (baseURL: '/api')
│   ├── lib/
│   │   ├── db.ts                       # Prisma client
│   │   ├── auth.ts                     # JWT helpers
│   │   ├── procurementStatus.ts
│   │   └── supabase.ts
│   ├── hooks/
│   │   └── useOutsideClick.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── project.ts
│   │   ├── bid.ts
│   │   ├── blockchain.ts
│   │   ├── notification.ts
│   │   └── procurement.ts
│   └── middleware.ts
├── prisma/
│   └── schema.prisma
├── tailwind.config.ts (not needed — Tailwind v4 uses CSS)
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── package.json
└── .env.local
```

---

## Environment Variables (`next-app/.env.local`)

```env
# Database
DATABASE_URL=postgresql://...  # Same Supabase connection string

# Auth
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Supabase (client-side)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase (server-side)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Key Decisions Made

1. **npm over pnpm** — pnpm v11 has build script approval issues on Windows that block installation
2. **Tailwind v4** — comes with Next.js 16, uses CSS-based config (`@theme`) instead of `tailwind.config.js`
3. **Zustand over Context** — simpler, better performance, less boilerplate (UI stays identical)
4. **TanStack Query over manual fetching** — auto caching, loading states (UI stays identical)
5. **Prisma over raw SQL** — type-safe ORM, connects to same Supabase DB
6. **jose over jsonwebtoken** — works in Edge runtime (Next.js middleware), smaller bundle
7. **Same Supabase DB** — no data migration needed, Prisma introspects existing tables
