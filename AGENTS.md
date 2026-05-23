http://127.0.0.1:8000/# AGENTS.md

## Project Overview

Blockchain E-Procurement System — a BSIT Capstone Project for Davao del Norte State College. Government procurement bidding platform with blockchain-based audit trail for transparency.

## Tech Stack

- **Backend:** Django 5.1 + Django REST Framework 3.15 + SimpleJWT
- **Frontend:** React 19 + Vite 7 + Tailwind CSS 3.4
- **Database:** Supabase PostgreSQL (via `dj-database-url`)
- **Auth:** JWT (access in sessionStorage, refresh token rotation)
- **Icons:** Lucide React
- **HTTP Client:** Axios with interceptors

## Project Structure

```
├── backend/
│   ├── config/
│   │   ├── settings/base.py      # Main Django settings
│   │   ├── settings/development.py
│   │   ├── settings/production.py
│   │   ├── urls.py               # Root URL config (api/v1/ prefix)
│   │   └── throttling.py         # Rate limiting classes
│   ├── apps/
│   │   ├── accounts/             # Auth endpoints (login, register, token refresh)
│   │   ├── users/                # User model, permissions, admin user management
│   │   ├── projects/             # Projects, Procurement requests, AuditLog, Documents
│   │   ├── bids/                 # Bid submission, evaluation, winner selection
│   │   ├── blockchain/           # Blockchain record storage and verification
│   │   └── notifications/        # In-app notification system
│   ├── media/                    # Uploaded files (bids, documents, permits)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # Root component, state-based screen routing
│   │   ├── main.jsx              # Entry point with ErrorBoundary + ProcurementProvider
│   │   ├── services/api.js       # Axios instance + all API endpoint functions
│   │   ├── lib/
│   │   │   ├── ProcurementContext.jsx  # Global state context
│   │   │   ├── procurementStatus.js    # Status constants and helpers
│   │   │   └── supabase.js             # Supabase client init
│   │   ├── layouts/              # AdminLayout, SupplierLayout, SchoolHeadLayout
│   │   ├── pages/
│   │   │   ├── admin/            # Admin dashboard, projects, bids, users, reports
│   │   │   ├── supplier/         # Supplier dashboard, projects, bids, profile
│   │   │   ├── school_head/      # School head dashboard, requests, approvals
│   │   │   ├── public/           # Landing page, public results
│   │   │   └── auth/             # Login, Register
│   │   ├── components/
│   │   │   ├── shared/           # Modal, StatusBadge, StatCard, Toast, etc.
│   │   │   ├── admin/            # AdminHeader, AdminSidebar, AdminSearchDropdown
│   │   │   ├── supplier/         # SupplierHeader, SupplierSidebar, modals
│   │   │   ├── school_head/      # SchoolHeadHeader, SchoolHeadSidebar
│   │   │   └── ui/               # Skeleton, LoadingButton
│   │   ├── context/DataContext.jsx
│   │   ├── hooks/                # useOutsideClick
│   │   └── constants/
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## User Roles

| Role | Value | Description |
|------|-------|-------------|
| Admin | `admin` | Full system access, manages projects/bids/users |
| School Head | `school_head` | Reviews and approves procurement requests |
| Supplier | `supplier` | Submits bids, views results (must be approved) |
| Viewer | `viewer` | Read-only access |

## Key Models

- **User** (`apps.users`) — Custom user with UUID PK, email auth, role/status fields
- **Project** (`apps.projects`) — Procurement projects (draft → active → closed → awarded)
- **Procurement** (`apps.projects`) — Procurement requests from school heads (pending → approved/rejected)
- **Bid** (`apps.bids`) — Supplier bids on projects (submitted → under_evaluation → won/lost)
- **BlockchainRecord** (`apps.blockchain`) — Immutable hash records of awarded bids
- **AuditLog** (`apps.projects`) — Action audit trail
- **DocumentUpload** (`apps.projects`) — Uploaded verification documents
- **Notification** (`apps.notifications`) — In-app notifications per user

## API Conventions

- All endpoints under `/api/v1/`
- Authentication: `Authorization: Bearer <access_token>`
- Token refresh: `POST /api/v1/auth/token/refresh/`
- Responses use DRF standard format (JSON)
- File uploads use `multipart/form-data`
- UUIDs for all primary keys
- Throttling: login (5/min), signup (10/hour), anon (100/hour), user (1000/hour)

## Frontend Conventions

- **No router library** — navigation is state-based via `currentScreen` in `App.jsx`
- **Styling:** Tailwind utility classes only, no CSS modules or styled-components
- **State management:** React Context (`ProcurementProvider`) + local component state
- **Auth tokens:** stored in `sessionStorage` (not localStorage)
- **API calls:** always use functions from `services/api.js`, never raw axios
- **Icons:** import from `lucide-react`
- **Components:** functional components with hooks, no class components (except ErrorBoundary)
- **File naming:** PascalCase for components (e.g., `AdminDashboard.jsx`), camelCase for utilities

## Backend Conventions

- **Settings:** split into `base.py`, `development.py`, `production.py`
- **Custom user model:** `AUTH_USER_MODEL = "users.User"`
- **Permissions:** custom classes in `apps/users/permissions.py` (IsAdmin, IsSchoolHead, IsSupplier, etc.)
- **Serializers:** one per app in `serializers.py`
- **URL patterns:** each app has its own `urls.py`, included in `config/urls.py`
- **Time zone:** `Asia/Manila`
- **File uploads:** stored in `backend/media/`

## Development Setup

```bash
# Backend (from project root)
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # fill in DATABASE_URL and keys
python manage.py migrate
python manage.py runserver  # runs on :8000

# Frontend (from project root)
cd frontend
npm install
copy .env.example .env
npm run dev  # runs on :5174, proxies /api to backend
```

## Environment Variables

### Backend (`backend/.env`)
- `SECRET_KEY` — Django secret key
- `DEBUG` — True/False
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ALLOWED_ORIGINS` — comma-separated frontend URLs

### Frontend (`frontend/.env`)
- `VITE_API_URL` — backend API base URL (default: `http://localhost:8000/api/v1`)
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase public anon key

## Important Notes for AI Agents

1. **Never commit `.env` files** — only `.env.example` files are tracked
2. **UUID primary keys everywhere** — don't use integer IDs
3. **Role-based access** — always check user role before allowing actions
4. **No React Router** — to add a new screen, add state case in `App.jsx` and pass via layout props
5. **Supplier approval flow** — suppliers must be approved (status: active/approved) before they can bid
6. **Procurement workflow:** School Head creates request → Admin reviews → If approved, becomes a Project
7. **Bid workflow:** Supplier submits → Admin evaluates → Winner selected → Blockchain record created
8. **Frontend API module** — all API functions are centralized in `frontend/src/services/api.js`
9. **Tailwind only** — no inline styles or external CSS frameworks
10. **Django admin** available at `/admin/` for direct DB management
