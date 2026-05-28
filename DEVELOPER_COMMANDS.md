# Developer Commands — Owner & Partner

Main repository: https://github.com/Kenth08/Bidding-System

This file contains ready-to-copy commands for the repository owner (you) and for your partner. Replace placeholders like `<repo-url>`, `<your-github-username>`, and `<short-desc>`.

---

## Owner (You)

1) Commit and push `CONTRIBUTING.md` and open PR

```bash
git checkout -b chore/add-contributing
git add CONTRIBUTING.md
git commit -m "chore: add CONTRIBUTING.md"
git push -u origin chore/add-contributing
# Open a PR on GitHub from chore/add-contributing -> main and merge after CI passes
```

2) Add `CODEOWNERS` (optional)

```bash
printf "*    @your-github-username\n" > CODEOWNERS
git add CODEOWNERS
git commit -m "chore: add CODEOWNERS"
git push
```

3) Add GitHub secrets (via GitHub UI)

- Go to: Settings → Secrets and variables → Actions → New repository secret
- Add minimal required secrets for CI (if needed): `DATABASE_URL`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`.

4) Enable branch protection on `main` (via GitHub UI)

- Go to: Settings → Branches → Add rule for `main`
- Require pull request reviews before merging and require status checks (CI) to pass.

5) Merge policy

- Review incoming PRs; when CI is green and an approval is present, merge via GitHub UI (Squash/merge recommended for small changes).

---

## Partner (Copy-paste commands)

> Replace `<repo-url>` with `https://github.com/Kenth08/Bidding-System` or your fork URL and replace `<short-desc>` and `<initials>`.

### PowerShell (Windows)

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
# open http://localhost:3000

# Run checks before committing
npx tsc --noEmit
npx eslint . --ext .ts,.tsx,.js

# Commit, push, open PR
git add .
git commit -m "feat(<area>): short description"
git push -u origin feature/<short-desc>-<initials>

# Keep branch up-to-date (rebase)
git fetch origin
git rebase origin/main
# resolve conflicts if any, then:
git push --force-with-lease
```

### Bash (macOS / Linux)

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
# open http://localhost:3000

# Run checks before committing
npx tsc --noEmit
npx eslint . --ext .ts,.tsx,.js

# Commit, push, open PR
git add .
git commit -m "feat(<area>): short description"
git push -u origin feature/<short-desc>-<initials>

# Keep branch up-to-date (rebase)
git fetch origin
git rebase origin/main
# resolve conflicts if any, then:
git push --force-with-lease
```

---

## Quick PR checklist (copy into PR description)

- What changed and why (1–2 sentences)
- How to run locally (include any DB/seed steps from above)
- Any DB migrations or seed files required
- Test checklist completed (`npx tsc --noEmit`, `npx eslint`)

---

If you want I can push this file on a branch and open a PR for you.