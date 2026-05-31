# AGENTS.md

This project is a single full-stack Next.js application located in `next-app/`.

See `next-app/AGENTS.md` for the complete project guide, conventions, and rules for AI agents.

## Quick Reference

- **App directory:** `next-app/`
- **Dev server:** `cd next-app && npm run dev` → http://localhost:3000
- **Database:** Supabase PostgreSQL via Prisma 7
- **API routes:** `next-app/src/app/api/`
- **Frontend pages:** `next-app/src/app/`
- **Auth:** JWT (jose) — stored in sessionStorage, sent as Bearer token
- **State:** Zustand (auth store)
- **Styling:** Tailwind CSS 4 (CSS-based @theme, no tailwind.config.js)
- **Package Manager:** npm (not pnpm)

## Architecture

```
User → Next.js App Router → API Routes → Prisma/Supabase PostgreSQL
                                       → Supabase Storage (file uploads)
                                       → Blockchain (Ethers.js → Solidity contract)
                                       → SMTP (email notifications)
```

## User Roles

| Role | Route Prefix | Description |
|------|--------------|-------------|
| `admin` | `/admin/*` | Manages projects, suppliers, bids, awards |
| `school_head` | `/school-head/*` | Creates procurement requests, reviews history |
| `supplier` | `/supplier/*` | Registers, submits bids, views results |
| `viewer` | `/results` | Public bid results & blockchain verification |

## Key Directories

```
next-app/
├── src/
│   ├── app/           # Pages + API routes (App Router)
│   ├── components/    # admin/, supplier/, school_head/, shared/, ui/
│   ├── lib/           # DB, auth, email, blockchain, uploads
│   ├── stores/        # Zustand auth store
│   ├── services/      # Axios API client
│   ├── hooks/         # Custom React hooks
│   └── types/         # TypeScript interfaces
├── prisma/            # Schema, migrations, seed scripts
└── scripts/           # E2E tests, DB utilities
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

## Critical Rules

1. **Never commit `.env`** — only `.env.example` is tracked
2. **UUID primary keys** everywhere
3. **All components are `"use client"`** with client-side data fetching
4. **Default exports** for components
5. **`params` is a Promise** in route handlers — always `await params`
6. **Tailwind only** — no CSS modules or styled-components
