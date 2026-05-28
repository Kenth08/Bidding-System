# Contributing

Quick guide for contributors: copy, paste, and run the commands below to set up a local development environment and open a PR.

Replace <repo-url> and fill `.env.local` values as noted.

---

## PowerShell (Windows)

```powershell
# Clone and create a feature branch
git clone <repo-url>
cd Bidding-System
git checkout -b feature/<short-desc>-<initials>

# Prepare environment
cd next-app
cp .env.example .env.local
# Edit next-app\.env.local: set LOCAL_MODE=true and NEXT_PUBLIC_LOCAL_MODE=true
# Also set DATABASE_URL to your local Postgres if needed

# Start local Postgres (Docker Compose)
docker compose up -d

# Verify DB connectivity (quick Node check)
node -e "const {Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL||'postgresql://postgres:postgres@localhost:5432/bidding_system'});p.connect().then(c=>{console.log('connected');c.release();process.exit(0)}).catch(e=>{console.error(e);process.exit(1)})"

# Install deps, push schema and seed
npm ci
npx prisma db push
npx prisma db seed

# Start dev server
npm run dev
# Open http://localhost:3000

# Run checks before committing
npx tsc --noEmit
npx eslint . --ext .ts,.tsx,.js

# Commit, push, and open PR
git add .
git commit -m "feat(scope): short description"
git push -u origin feature/<short-desc>-<initials>

# Keep branch up-to-date if necessary
git fetch origin
git rebase origin/main
# resolve conflicts if any, then:
git push --force-with-lease
```

---

## Bash (macOS / Linux)

```bash
# Clone and create a feature branch
git clone <repo-url>
cd Bidding-System
git checkout -b feature/<short-desc>-<initials>

# Prepare environment
cd next-app
cp .env.example .env.local
# Edit next-app/.env.local: set LOCAL_MODE=true and NEXT_PUBLIC_LOCAL_MODE=true
# Also set DATABASE_URL to your local Postgres if needed

# Start local Postgres (Docker Compose)
docker compose up -d

# Verify DB connectivity (quick Node check)
node -e "const {Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL||'postgresql://postgres:postgres@localhost:5432/bidding_system'});p.connect().then(c=>{console.log('connected');c.release();process.exit(0)}).catch(e=>{console.error(e);process.exit(1)})"

# Install deps, push schema and seed
npm ci
npx prisma db push
npx prisma db seed

# Start dev server
npm run dev
# Open http://localhost:3000

# Run checks before committing
npx tsc --noEmit
npx eslint . --ext .ts,.tsx,.js

# Commit, push, and open PR
git add .
git commit -m "feat(scope): short description"
git push -u origin feature/<short-desc>-<initials>

# Keep branch up-to-date if necessary
git fetch origin
git rebase origin/main
# resolve conflicts if any, then:
git push --force-with-lease
```

---

## Pull Request Checklist (include in PR description)
- What changed and why (1–2 sentences)
- How to run locally (copy steps above including any DB/seed steps)
- Related DB migrations or seed required (list files)
- Tag reviewers

## Branch & Commit Conventions
- Branch names: `feature/...`, `fix/...`, `chore/...` with initials suffix
- Commit message style: `type(scope): short summary`

## Merge Policy
- Wait for at least one approving review and CI green (CI workflow runs `tsc` and `eslint`)
- Merge using GitHub UI; prefer `Squash and merge` for small features

If you'd like, I can also open a PR adding this `CONTRIBUTING.md` and the CI workflow changes I prepared earlier.
