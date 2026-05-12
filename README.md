# Blockchain E-Procurement System

BSIT Capstone Project 2026 for Davao del Norte State College.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS
- Backend: Django REST Framework
- Database: Supabase PostgreSQL
- Auth: Supabase and backend JWT endpoints

## Setup

### 1. Clone the repo
```bash
git clone https://github.com/Kenth08/Bidding-System
cd Bidding-System
```

### 2. Backend setup
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver
```

### 3. Frontend setup
```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

### 4. Open the app
```text
http://localhost:5173
```

## Environment files
- Commit [backend/.env.example](backend/.env.example) and [frontend/.env.example](frontend/.env.example).
- Keep [backend/.env](backend/.env) and [frontend/.env](frontend/.env) local only.

## Development credentials
Admin: admin@gmail.com / admin123
