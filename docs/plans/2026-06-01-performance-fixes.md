# Performance Fix Implementation Plan

> **For agentic workers:** Use subagent-driven-development or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate the major performance bottlenecks causing slow page loads across the app.

**Architecture:** Remove write-on-read patterns, consolidate to a single DB connection pool, batch sequential DB operations, add pagination to list endpoints, and reduce over-fetching with leaner includes.

**Tech Stack:** Prisma 7, PostgreSQL (Supabase), Next.js 16 API routes, TypeScript

---

## File Map

| File | Change | Responsibility |
|------|--------|---------------|
| `src/lib/db.ts` | Modify | Consolidate connection pool config |
| `src/app/api/projects/route.ts` | Modify | Remove write-on-read, add pagination, lean includes |
| `src/app/api/bids/route.ts` | Modify | Batch rank updates, add pagination |
| `src/app/api/projects/auto-close/route.ts` | Create | Dedicated endpoint for auto-closing expired projects |
| `src/lib/supplier-workflow-db.ts` | Modify | Convert dynamic import to static |
| `src/app/api/dashboard/stats/route.ts` | Modify | Add cache headers |
| `src/app/api/notifications/route.ts` | Modify | Add pagination |
| `src/services/api.ts` | Modify | Add pagination params to list calls |

---

### Task 1: Remove write-on-read from projects GET

**Files:**
- Create: `src/app/api/projects/auto-close/route.ts`
- Modify: `src/app/api/projects/route.ts`

- [ ] **Step 1: Create dedicated auto-close endpoint**

```typescript
// src/app/api/projects/auto-close/route.ts
import { db } from "@/lib/db";
import { requireRole, json } from "@/lib/api-utils";

export async function POST(request: Request) {
  const { error } = await requireRole(request, "admin");
  if (error) return error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db.project.updateMany({
    where: { status: "active", deadline: { lt: today }, is_archived: false },
    data: { status: "closed" },
  });

  return json({ closed: result.count });
}
```

- [ ] **Step 2: Remove updateMany from projects GET**

In `src/app/api/projects/route.ts`, delete these lines (around line 17-20):

```typescript
// DELETE THIS BLOCK:
// Auto-close expired active projects
await db.project.updateMany({
  where: { status: "active", deadline: { lt: today }, is_archived: false },
  data: { status: "closed" },
});
```

- [ ] **Step 3: Verify projects load without the write**

Run: `npm run build`
Expected: Build succeeds, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/projects/auto-close/route.ts src/app/api/projects/route.ts
git commit -m "perf: move auto-close logic out of projects GET into dedicated endpoint"
```

---

### Task 2: Consolidate database connection pools

**Files:**
- Modify: `src/lib/db.ts`

- [ ] **Step 1: Add pool size limit and idle timeout to db.ts**

Replace the entire `src/lib/db.ts` with:

```typescript
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient; pool: Pool };

function createPool() {
  const url = process.env.DATABASE_URL || "";
  return new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

function createClient() {
  const pool = globalForPrisma.pool ?? createPool();
  if (!globalForPrisma.pool) globalForPrisma.pool = pool;
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter } as any);
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

- [ ] **Step 2: Add pool limit to db-direct.ts**

In `src/lib/db-direct.ts`, modify the Pool creation (around line 18):

```typescript
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/lib/db.ts src/lib/db-direct.ts
git commit -m "perf: consolidate pool config, limit to 15 total connections"
```

---

### Task 3: Batch bid rank recalculation

**Files:**
- Modify: `src/app/api/bids/route.ts`

- [ ] **Step 1: Replace sequential rank updates with transaction batch**

In `src/app/api/bids/route.ts`, find the rank recalculation block (around line 175-178):

```typescript
// REPLACE THIS:
const allBids = await db.bid.findMany({ where: { project_id: projectId }, select: { id: true, bid_amount: true, submitted_at: true } });
const ranked = recalculateRanks(allBids);
for (const r of ranked) {
  await db.bid.update({ where: { id: r.id }, data: { rank: r.rank } });
}
```

With:

```typescript
const allBids = await db.bid.findMany({ where: { project_id: projectId }, select: { id: true, bid_amount: true, submitted_at: true } });
const ranked = recalculateRanks(allBids);
await db.$transaction(
  ranked.map((r) => db.bid.update({ where: { id: r.id }, data: { rank: r.rank } }))
);
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/bids/route.ts
git commit -m "perf: batch rank updates in single transaction"
```

---

### Task 4: Add pagination to projects endpoint

**Files:**
- Modify: `src/app/api/projects/route.ts`
- Modify: `src/services/api.ts`

- [ ] **Step 1: Add pagination params to projects GET**

In `src/app/api/projects/route.ts`, after the `statusFilter` line, add:

```typescript
const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize")) || 20));
const skip = (page - 1) * pageSize;
```

Then modify the `findMany` call to add `take` and `skip`:

```typescript
const projects = await db.project.findMany({
  where,
  include: {
    created_by: { select: { id: true, full_name: true, email: true } },
    procurement_request: { select: { id: true, project_title: true, status: true } },
    project_business_types: { include: { business_type: true } },
    bids: user!.role === "supplier"
      ? { where: { supplier_id: user!.id }, select: { id: true, status: true, submitted_at: true, bid_amount: true } }
      : { select: { id: true, status: true, bid_amount: true, supplier_id: true, company_name: true } },
  },
  orderBy: { created_at: "desc" },
  take: pageSize,
  skip,
});
```

For admin, also get total count:

```typescript
if (user!.role !== "supplier") {
  const total = await db.project.count({ where });
  return json({ results: projects, total, page, pageSize });
}
```

- [ ] **Step 2: Update API service to pass pagination params**

In `src/services/api.ts`, update `projectsAPI.getAll`:

```typescript
getAll: (statusFilter?: string, page = 1, pageSize = 20) =>
  api.get("/projects", { params: { ...(statusFilter && statusFilter !== "All" ? { status: statusFilter } : {}), page, pageSize } }),
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/projects/route.ts src/services/api.ts
git commit -m "perf: add pagination to projects endpoint"
```

---

### Task 5: Convert dynamic imports to static

**Files:**
- Modify: `src/app/api/projects/route.ts`
- Modify: `src/app/api/bids/route.ts`
- Modify: `src/app/api/projects/[id]/route.ts`

- [ ] **Step 1: Add static import to projects route**

At the top of `src/app/api/projects/route.ts`, add:

```typescript
import { getSupplierWorkflow } from "@/lib/supplier-workflow-db";
```

Then remove the dynamic import line:

```typescript
// DELETE: const { getSupplierWorkflow } = await import("@/lib/supplier-workflow-db");
```

- [ ] **Step 2: Same for bids route**

At the top of `src/app/api/bids/route.ts`, add:

```typescript
import { getSupplierWorkflow } from "@/lib/supplier-workflow-db";
```

Delete the dynamic import line inside the POST handler.

- [ ] **Step 3: Same for projects/[id] route**

At the top of `src/app/api/projects/[id]/route.ts`, add:

```typescript
import { getSupplierWorkflow } from "@/lib/supplier-workflow-db";
```

Delete the dynamic import line.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/projects/route.ts src/app/api/bids/route.ts src/app/api/projects/[id]/route.ts
git commit -m "perf: replace dynamic imports with static imports on hot paths"
```

---

### Task 6: Add cache headers to dashboard stats

**Files:**
- Modify: `src/app/api/dashboard/stats/route.ts`
- Modify: `src/app/api/projects/public/stats/route.ts` (if exists)

- [ ] **Step 1: Add Cache-Control to dashboard stats response**

In `src/app/api/dashboard/stats/route.ts`, replace the return statement:

```typescript
return new Response(JSON.stringify({ total_projects, total_bids, active_bidding, awarded_contracts }), {
  status: 200,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
  },
});
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/dashboard/stats/route.ts
git commit -m "perf: add 30s cache to dashboard stats"
```

---

### Task 7: Reduce notification over-fetching in supplier layout

**Files:**
- Modify: `src/app/supplier/layout.tsx`

- [ ] **Step 1: Limit notification fetch to unread only**

In `src/app/supplier/layout.tsx`, find the notification auto-clear `useEffect` (around line 80). Replace:

```typescript
const res = await notificationsAPI.getAll();
```

With:

```typescript
const res = await notificationsAPI.getUnreadCount();
```

And remove the entire loop that marks notifications as read on page load. The auto-clear logic should only run when the user explicitly visits the notifications page, not on every layout mount.

Replace the entire notification useEffect with:

```typescript
// Removed: auto-clear notifications on every page load
// Notifications are now only marked read when user visits /supplier/notifications
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/supplier/layout.tsx
git commit -m "perf: remove notification over-fetching from supplier layout"
```

---

## Progress Tracking

- [ ] Task 1: Remove write-on-read from projects GET
- [ ] Task 2: Consolidate database connection pools
- [ ] Task 3: Batch bid rank recalculation
- [ ] Task 4: Add pagination to projects endpoint
- [ ] Task 5: Convert dynamic imports to static
- [ ] Task 6: Add cache headers to dashboard stats
- [ ] Task 7: Reduce notification over-fetching in supplier layout

## Expected Impact

| Fix | Estimated Improvement |
|-----|----------------------|
| Remove write-on-read | -200-500ms per projects page load |
| Pool consolidation | Eliminates connection timeout queuing |
| Batch rank updates | -50ms × N bids per submission |
| Pagination | -500ms+ on large datasets |
| Static imports | -50-100ms cold start per request |
| Cache headers | Eliminates redundant DB hits for 30s |
| Notification fix | -200-400ms per supplier page navigation |

**Total estimated improvement: 1-3 seconds faster page loads.**
