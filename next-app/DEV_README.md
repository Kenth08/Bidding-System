Local development quickstart
===========================

1) Start Postgres (Docker)

```powershell
# from repo root (next-app)
cd next-app
docker compose up -d
```

This starts a Postgres container named `bidding-db` with DB `bidding_system` and user `postgres`/`postgres` bound to host port 5433.

2) Verify DB is reachable

```powershell
# quick Node check
node -e "const {Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL||'postgresql://postgres:postgres@localhost:5433/bidding_system'});p.connect().then(c=>{console.log('connected');c.release();process.exit(0)}).catch(e=>{console.error(e);process.exit(1)})"

# or use psql if installed
psql "postgresql://postgres:postgres@localhost:5433/bidding_system" -c "SELECT 1;"
```

3) Install deps, run migrations and seed

```powershell
cd next-app
npm install
npm run migrate:run
npx prisma db seed
```

4) Start dev server

```powershell
npm run dev
# Open http://localhost:3000
```

5) What to expect / checks
- `LOCAL_MODE=true` in `.env.local` — app will use the local Postgres adapter.
- Registration/login should not trigger external Google OAuth or outgoing SMTP (local mode skips sending).
- Verify data in the DB with `psql` or the Node check above.

6) If you prefer SQLite for a quick demo
- I can convert Prisma to SQLite (temporary) to avoid Docker; say "Use SQLite" and I'll make the changes.

Security note: do not commit `.env.local` to Git. Rotate any exposed SMTP credentials.
