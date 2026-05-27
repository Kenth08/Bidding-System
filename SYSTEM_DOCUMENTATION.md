# Blockchain E-Procurement System - Complete Documentation

**Project Type:** BSIT Capstone Project 2026  
**Institution:** Davao del Norte State College  
**Repository:** https://github.com/Kenth08/Bidding-System  
**Current Branch:** feature/partner-work  
**Date:** May 26, 2026

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [User Roles & Permissions](#user-roles--permissions)
6. [Core Features](#core-features)
7. [API Endpoints](#api-endpoints)
8. [Authentication System](#authentication-system)
9. [Blockchain Integration](#blockchain-integration)
10. [Setup & Development](#setup--development)
11. [Key Components](#key-components)
12. [Services & Utilities](#services--utilities)
13. [Environment Configuration](#environment-configuration)

---

## System Overview

The **Blockchain E-Procurement System** is a comprehensive web-based platform designed to streamline and secure government procurement processes. It leverages blockchain technology to ensure transparency, immutability, and auditability of bidding and procurement activities.

### Purpose
- Enable government agencies (School Heads) to create and manage procurement projects
- Allow suppliers to submit bids for procurement opportunities
- Implement blockchain verification for transparency
- Automate bid evaluation and award process
- Maintain detailed audit trails of all transactions

### Key Objectives
1. **Transparency:** All procurement activities are recorded and verifiable
2. **Security:** Blockchain ensures immutable records of bids and awards
3. **Efficiency:** Automated workflows reduce manual processing time
4. **Accountability:** Complete audit logs for compliance and verification
5. **Fair Competition:** Standardized bidding process for all suppliers

---

## Technology Stack

### Frontend & Runtime
- **Framework:** Next.js 16 (App Router with TypeScript)
- **Runtime:** Node.js 18+
- **UI Library:** React 19.2.4
- **Styling:** Tailwind CSS 4 + PostCSS 4
- **Icons:** Lucide React 1.16.0

### Backend & API
- **Language:** TypeScript
- **ORM:** Prisma 7 (with PostgreSQL adapter)
- **Database:** Supabase PostgreSQL
- **Authentication:** JWT (jose 6.2.3)
- **API Client:** Axios 1.16.1

### State Management & Data
- **State:** Zustand 5.0.13
- **Data Fetching:** TanStack React Query 5.100.13
- **Validation:** Zod 4.4.3
- **Encryption:** bcryptjs 3.0.3
- **IDs:** UUID 14.0.0

### Database
- **Provider:** PostgreSQL (Supabase)
- **Connection:** pg 8.21.0
- **Migration Tool:** Prisma Migrations

### Development Tools
- **Linting:** ESLint 9
- **Bundler:** Next.js internal bundler (Webpack)
- **Build Tool:** tsx 4.22.3
- **Runtime TypeScript:** tsx

---

## Project Structure

```
next-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── bids/          # Bid management endpoints
│   │   │   ├── blockchain/    # Blockchain verification endpoints
│   │   │   ├── create-admin/  # Admin creation endpoint
│   │   │   ├── dashboard/     # Dashboard data endpoints
│   │   │   ├── debug/         # Debug endpoints
│   │   │   ├── notifications/ # Notification endpoints
│   │   │   ├── procurement-requests/ # Procurement request endpoints
│   │   │   ├── projects/      # Project management endpoints
│   │   │   ├── public/        # Public endpoints
│   │   │   ├── reports/       # Report generation endpoints
│   │   │   └── test/          # Testing endpoints
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── auth/              # Auth pages (login, register)
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── results/           # Bid results pages
│   │   ├── school-head/       # School head/Procuring entity pages
│   │   ├── supplier/          # Supplier pages
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   ├── globals.css        # Global styles
│   │   └── favicon.ico        # Site favicon
│   │
│   ├── components/            # React Components
│   │   ├── admin/            # Admin-specific components
│   │   ├── school_head/      # School head-specific components
│   │   ├── supplier/         # Supplier-specific components
│   │   ├── shared/           # Shared components (reusable)
│   │   └── ui/               # UI component library
│   │
│   ├── hooks/                 # Custom React Hooks
│   │   └── (auth, data fetching, etc.)
│   │
│   ├── lib/                   # Utility & Service Functions
│   │   ├── auth.ts           # JWT authentication utilities
│   │   ├── db.ts             # Primary database access layer
│   │   ├── db-direct.ts      # Direct database queries
│   │   ├── db-supabase.ts    # Supabase-specific queries
│   │   ├── supabase.ts       # Supabase client setup (client-side)
│   │   ├── supabase-server.ts # Supabase client setup (server-side)
│   │   ├── api-utils.ts      # API utility functions
│   │   ├── actions.ts        # Server actions
│   │   ├── procurementStatus.ts # Procurement status utilities
│   │   └── debug-token.js    # Token debugging utility
│   │
│   ├── services/              # Business Logic Services
│   │   └── (bidding, procurement, blockchain, etc.)
│   │
│   ├── stores/                # Zustand State Stores
│   │   └── (auth store, UI state, etc.)
│   │
│   ├── types/                 # TypeScript Type Definitions
│   │   └── (User, Project, Bid, etc.)
│   │
│   └── proxy.ts              # Proxy configuration
│
├── prisma/
│   ├── schema.prisma         # Database schema definition
│   ├── migrations/           # Database migration history
│   └── seed.ts              # Database seed script
│
├── public/                   # Static assets
├── package.json             # Project dependencies
├── tsconfig.json            # TypeScript configuration
├── next.config.ts           # Next.js configuration
├── eslint.config.mjs        # ESLint configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.mjs       # PostCSS configuration
├── AGENTS.md                # Agent specifications
├── CLAUDE.md                # Claude AI guidelines
└── README.md                # Quick start guide
```

---

## Database Schema

### Core Tables

#### 1. **users** (User Model)
Central table for all system users with multi-role support.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(128) NOT NULL,
  role VARCHAR(20) DEFAULT 'supplier',  -- admin, school_head, supplier
  status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected, active
  
  -- Company Information
  company_name VARCHAR(255),
  company_address VARCHAR(255),
  phone VARCHAR(50),
  business_type VARCHAR(100),
  representative_name VARCHAR(255),
  
  -- Documentation
  tin VARCHAR(50),
  company_profile TEXT,
  business_permit_document TEXT,
  philgeps_registration TEXT,
  tax_clearance TEXT,
  valid_id TEXT,
  supporting_documents TEXT,
  
  -- Verification
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_at TIMESTAMP,
  verified_by_id UUID REFERENCES users(id),
  verification_notes TEXT,
  
  -- System Flags
  is_staff BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_superuser BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Roles:**
- `admin` - System administrator
- `school_head` - Procuring entity (typically government agency)
- `supplier` - Vendor/supplier submitting bids

#### 2. **procurements** (Procurement Model)
Procurement requests submitted by school heads for review.

```sql
CREATE TABLE procurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_title VARCHAR(255) NOT NULL,
  budget DECIMAL(15, 2),
  deadline DATE,
  public_result_expiry_date DATE,
  procurement_type VARCHAR(50),
  
  -- Specifications
  technical_specifications TEXT,
  procurement_schedule VARCHAR(255),
  delivery_period VARCHAR(255),
  
  -- Status & Review
  status VARCHAR(30) DEFAULT 'Pending Review',  
  -- 'Pending Review', 'Approved', 'Rejected', 'In Progress', 'Completed'
  rejection_reason TEXT,
  revision_notes TEXT,
  review_remarks TEXT,
  
  -- Review Info
  reviewed_by_id UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_by_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Statuses:**
- `Pending Review` - Awaiting admin/school head review
- `Approved` - Approved and ready for bidding
- `Rejected` - Rejected with revision notes
- `In Progress` - Active bidding phase
- `Completed` - Procurement finished

#### 3. **projects_project** (Project Model)
Active procurement projects with bid information.

```sql
CREATE TABLE projects_project (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procurement_request_id UUID UNIQUE REFERENCES procurements(id),
  title VARCHAR(255) NOT NULL,
  budget DECIMAL(15, 2),
  deadline DATE NOT NULL,
  procurement_schedule DATE,
  public_result_expiry_date DATE,
  
  -- Specifications
  requirements TEXT,
  procurement_type VARCHAR(50) DEFAULT 'Services',
  delivery_period INT DEFAULT 0,
  technical_specifications TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft',
  -- 'draft', 'published', 'bidding', 'evaluation', 'awarded', 'completed'
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMP,
  archived_reason VARCHAR(255),
  published_at TIMESTAMP,
  awarded_at TIMESTAMP,
  
  -- Tracking
  created_by_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Project Statuses:**
- `draft` - Not yet published
- `published` - Published to suppliers
- `bidding` - Actively accepting bids
- `evaluation` - Evaluating submitted bids
- `awarded` - Winner selected
- `completed` - Project finished

#### 4. **bids_bid** (Bid Model)
Individual supplier bids for projects.

```sql
CREATE TABLE bids_bid (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects_project(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255),
  
  -- Bid Details
  bid_amount DECIMAL(12, 2) NOT NULL,
  proposal TEXT,
  quotation_file TEXT,
  technical_proposal TEXT,
  supporting_documents TEXT,
  quotation_document TEXT,
  technical_document TEXT,
  
  -- Bid Declarations
  no_conflict_of_interest BOOLEAN DEFAULT false,
  conflict_of_interest_person TEXT,
  no_past_scm_issues BOOLEAN DEFAULT false,
  
  -- Evaluation
  status VARCHAR(50) DEFAULT 'submitted',
  -- 'submitted', 'received', 'qualified', 'disqualified', 'awarded'
  technical_compliance BOOLEAN DEFAULT false,
  evaluation_remarks TEXT,
  rank INT,
  recorded BOOLEAN DEFAULT false,
  
  -- Timestamps
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(project_id, supplier_id)
);
```

**Bid Statuses:**
- `submitted` - Initial submission
- `received` - Confirmed received
- `qualified` - Passed technical evaluation
- `disqualified` - Failed evaluation
- `awarded` - Selected as winner

#### 5. **blockchain_blockchainrecord** (BlockchainRecord Model)
Immutable blockchain records of bid awards.

```sql
CREATE TABLE blockchain_blockchainrecord (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects_project(id) ON DELETE CASCADE,
  bid_id UUID NOT NULL REFERENCES bids_bid(id) ON DELETE CASCADE,
  winner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bid_amount DECIMAL(15, 2),
  hash VARCHAR NOT NULL UNIQUE,
  project_ref_id VARCHAR,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## User Roles & Permissions

### 1. **Admin**
**Responsibilities:**
- Manage user accounts and verify supplier credentials
- Review procurement requests from school heads
- Approve/reject procurement requests
- Monitor system activities
- Generate reports and analytics
- Manage system settings

**Permissions:**
- ✅ Create admin accounts
- ✅ View all users
- ✅ Approve/reject suppliers
- ✅ Review procurements
- ✅ Access all projects
- ✅ View all bids
- ✅ Generate reports
- ✅ Access audit logs
- ✅ Manage blockchain records

**Dashboard:** Admin panel with system statistics and user management

### 2. **School Head / Procuring Entity**
**Responsibilities:**
- Create procurement requests
- Submit projects for bidding
- Publish projects to suppliers
- Review and evaluate bids
- Select bid winners
- Award contracts

**Permissions:**
- ✅ Create procurement requests
- ✅ View own procurements
- ✅ Create projects
- ✅ Publish projects
- ✅ View received bids
- ✅ Evaluate bids
- ✅ Award projects
- ✅ Access bid results
- ✅ View own project history
- ❌ View other school heads' projects
- ❌ Manage users

**Dashboard:** School head panel with procurement and project management

### 3. **Supplier**
**Responsibilities:**
- Register and complete profile
- View available procurement opportunities
- Submit bids on projects
- Track bid status
- Receive notifications about bid results

**Permissions:**
- ✅ Complete registration
- ✅ Update company profile
- ✅ View published projects
- ✅ Submit bids
- ✅ View own bids
- ✅ Access bid results
- ✅ View bid history
- ❌ Edit bids after submission
- ❌ View other suppliers' bids
- ❌ Create projects

**Dashboard:** Supplier portal with available projects and bid tracking

---

## Core Features

### 1. **User Management**

**Registration & Onboarding**
- Public registration for suppliers
- Email-based account creation
- Multi-step profile completion
- Document upload support
- Account verification by admin

**Authentication**
- JWT-based token authentication
- Secure password hashing (bcryptjs)
- Token refresh mechanism
- Session management
- Role-based access control

**Supplier Verification**
- Document validation system
- Required documents:
  - Valid ID
  - Business Permit
  - PhilGEPS Registration
  - Tax Clearance
  - Company Profile
- Verification status tracking
- Admin approval workflow

### 2. **Procurement Management**

**Procurement Request Workflow**
1. School Head creates procurement request
2. Admin reviews for completeness
3. Admin approves/rejects with remarks
4. Approved requests convert to projects
5. Projects published to suppliers

**Request Information**
- Project title and description
- Budget allocation
- Deadline for bidding
- Technical specifications
- Delivery period
- Procurement type (Goods/Services)
- Procurement schedule

**Status Tracking**
- Real-time status updates
- Notification system
- Revision history
- Admin review comments

### 3. **Project Management**

**Project Lifecycle**
- **Draft:** Initial creation, not visible to suppliers
- **Published:** Visible to all suppliers
- **Bidding:** Actively accepting bids
- **Evaluation:** Bids under review
- **Awarded:** Winner selected
- **Completed:** Project finished

**Project Features**
- Budget management
- Deadline enforcement
- Technical specifications
- Requirement tracking
- Document management
- Participant tracking

### 4. **Bidding System**

**Bid Submission**
- Suppliers can submit bids on published projects
- Required information:
  - Bid amount
  - Quotation document
  - Technical proposal
  - Supporting documents
  - Conflict of interest declaration
  - Past SCM issues declaration

**Bid Management**
- One bid per supplier per project (enforced by unique constraint)
- Automatic timestamp recording
- Document storage
- Status tracking
- Evaluation capabilities

**Bid Evaluation Process**
1. Technical compliance check
2. Administrative compliance review
3. Financial evaluation
4. Comparative analysis
5. Winner selection
6. Award confirmation

### 5. **Blockchain Integration**

**Purpose**
- Create immutable records of bid awards
- Ensure transparency
- Prevent tampering with results
- Provide audit trail

**Implementation**
- Hash generation for bid records
- Record creation upon award
- Project reference tracking
- Timestamp verification
- Blockchain record storage

**Benefits**
- Transparency & auditability
- Fraud prevention
- Dispute resolution capability
- Public verification

### 6. **Notification System**

**Notification Types**
- Registration confirmation
- Account approval/rejection
- Procurement request status changes
- Project publication alerts
- Bid submission confirmations
- Bid evaluation updates
- Award notifications
- System alerts

**Delivery**
- In-system notifications
- Email notifications (future)
- Real-time updates via WebSocket (future)

---

## API Endpoints

### Authentication Endpoints (`/api/auth/`)
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - New user registration
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get current user profile

### Project Endpoints (`/api/projects/`)
- `GET /api/projects/` - List all projects
- `GET /api/projects/[id]` - Get project details
- `POST /api/projects/` - Create new project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `POST /api/projects/[id]/publish` - Publish project
- `POST /api/projects/[id]/award` - Award project to supplier

### Bid Endpoints (`/api/bids/`)
- `GET /api/bids/` - List all bids
- `GET /api/bids/[id]` - Get bid details
- `POST /api/bids/` - Submit new bid
- `PUT /api/bids/[id]` - Update bid
- `GET /api/bids/project/[projectId]` - Get project bids
- `POST /api/bids/[id]/evaluate` - Evaluate bid

### Procurement Request Endpoints (`/api/procurement-requests/`)
- `GET /api/procurement-requests/` - List requests
- `POST /api/procurement-requests/` - Create request
- `PUT /api/procurement-requests/[id]` - Update request
- `POST /api/procurement-requests/[id]/approve` - Admin approve
- `POST /api/procurement-requests/[id]/reject` - Admin reject

### Blockchain Endpoints (`/api/blockchain/`)
- `GET /api/blockchain/verify/[hash]` - Verify blockchain record
- `POST /api/blockchain/record` - Create blockchain record
- `GET /api/blockchain/project/[projectId]` - Get project blockchain records

### Dashboard Endpoints (`/api/dashboard/`)
- `GET /api/dashboard/stats` - System statistics
- `GET /api/dashboard/admin/stats` - Admin dashboard stats
- `GET /api/dashboard/school-head/stats` - School head stats
- `GET /api/dashboard/supplier/stats` - Supplier stats

### Notification Endpoints (`/api/notifications/`)
- `GET /api/notifications/` - Get user notifications
- `POST /api/notifications/[id]/read` - Mark as read
- `DELETE /api/notifications/[id]` - Delete notification

### Report Endpoints (`/api/reports/`)
- `GET /api/reports/procurement` - Procurement report
- `GET /api/reports/bids` - Bid summary report
- `GET /api/reports/blockchain` - Blockchain verification report

---

## Authentication System

### JWT Implementation

**Token Structure**
```typescript
{
  sub: string;           // User ID
  email: string;         // User email
  role: string;          // User role (admin, school_head, supplier)
  iat: number;           // Issued at (Unix timestamp)
  exp: number;           // Expiration time (Unix timestamp)
}
```

**Token Expiry**
- **Access Token:** 15 minutes
- **Refresh Token:** 7 days

**Token Generation**
- Uses `jose` library for cryptographic signing
- Secret key stored in `JWT_SECRET` environment variable
- Secure algorithm (HS256 recommended)

**Token Validation**
- Verified on each API request
- Checked in middleware
- Signature validation
- Expiry verification

### Security Features
- Password hashing with bcryptjs (salt rounds: 10)
- JWT secret rotation capability
- Token refresh mechanism
- Session expiry enforcement
- Secure cookie storage (httpOnly, Secure flags)
- CORS protection
- CSRF protection (future)
- Rate limiting (future)

---

## Blockchain Integration

### Purpose & Benefits

**Immutability**
- Records cannot be altered after creation
- Ensures data integrity
- Provides proof of authenticity

**Transparency**
- All transactions publicly verifiable
- Audit trail available
- Public result verification

**Auditability**
- Complete history of bids
- Track award decisions
- Compliance verification

### Implementation Details

**Hash Generation**
- Combines project ID, bid ID, winner ID, and bid amount
- Uses cryptographic hashing algorithm
- Creates unique identifier for each record

**Record Storage**
- Stores in `blockchain_blockchainrecord` table
- Links to project and bid
- Includes winner information
- Timestamp of recording

**Verification Process**
1. Generate hash from stored data
2. Compare with blockchain record
3. Verify timestamp
4. Confirm project and bid existence
5. Validate winner selection

---

## Setup & Development

### Prerequisites
- Node.js 18+ (check version: `node --version`)
- npm 8+ (check version: `npm --version`)
- Git (for version control)
- Access to Supabase PostgreSQL database

### Installation Steps

**1. Clone Repository**
```bash
git clone https://github.com/Kenth08/Bidding-System.git
cd "c:\bids and rewards"
```

**2. Install Dependencies**
```bash
cd next-app
npm install
```

The `postinstall` script automatically runs `prisma generate`.

**3. Configure Environment Variables**
Create `.env` file in `next-app/` directory:

```env
# Database Connection
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Supabase Client (public)
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Server (private)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**4. Database Setup**
```bash
# Pull existing schema from Supabase
npm run db:pull

# Or push local schema to database
npm run db:push

# Create migration
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

**5. Run Development Server**
```bash
npm run dev
```

Access application at `http://localhost:3000`

### Development Credentials
- **Email:** admin@gmail.com
- **Password:** admin123

---

## Key Components

### User Interface Components

**Admin Components** (`/src/components/admin/`)
- User management dashboard
- Verification panels
- Report generators
- Analytics displays

**School Head Components** (`/src/components/school_head/`)
- Procurement form
- Project management
- Bid evaluation dashboard
- Award selection interface

**Supplier Components** (`/src/components/supplier/`)
- Project listing
- Bid submission form
- Bid tracker
- Result viewer

**Shared Components** (`/src/components/shared/`)
- Navigation bar
- Sidebar
- Forms
- Tables
- Modals
- Alerts

**UI Library** (`/src/components/ui/`)
- Basic UI elements
- Form inputs
- Buttons
- Cards
- Dialogs

### State Management

**Zustand Stores** (`/src/stores/`)
- Authentication store (user, token, role)
- UI state store (modals, notifications)
- Form state management
- Pagination state
- Filter preferences

### Custom Hooks (`/src/hooks/`)
- `useAuth()` - Authentication utilities
- `useProject()` - Project data operations
- `useBid()` - Bid management
- `useNotification()` - Notification handling
- `useForm()` - Form state management

---

## Services & Utilities

### Authentication Service (`/src/lib/auth.ts`)
```typescript
- generateToken(userId, role, email)
- verifyToken(token)
- refreshToken(refreshToken)
- decodeToken(token)
- hashPassword(password)
- comparePassword(password, hash)
```

### Database Layer (`/src/lib/db*.ts`)
- **db.ts** - Main database access point
- **db-direct.ts** - Direct PostgreSQL queries
- **db-supabase.ts** - Supabase-specific operations

### Supabase Integration
- **supabase.ts** - Client-side configuration
- **supabase-server.ts** - Server-side configuration
- Real-time database access
- File storage integration
- Row-level security (RLS)

### API Utilities (`/src/lib/api-utils.ts`)
```typescript
- apiRequest(method, endpoint, data)
- handleApiError(error)
- formatResponse(data, status)
- validateRequest(schema)
```

### Server Actions (`/src/lib/actions.ts`)
- Database mutations
- File uploads
- Email sending
- Async operations

---

## Environment Configuration

### Required Environment Variables

```env
# MANDATORY - Database
DATABASE_URL=postgresql://...

# MANDATORY - JWT
JWT_SECRET=any-secret-string
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# MANDATORY - Supabase (Client)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# MANDATORY - Supabase (Server)
SUPABASE_SERVICE_ROLE_KEY=...

# OPTIONAL - Application
NODE_ENV=development|production
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Environment Files
- **Commit:** `.env.example` only (template)
- **Local:** `.env` (local machine only, never commit)
- Use `.env.local` for local overrides

---

## Available NPM Scripts

```json
{
  "dev": "next dev",                    // Start dev server
  "build": "next build",                // Build for production
  "start": "next start",                // Start production server
  "lint": "eslint",                     // Run linter
  "db:generate": "Prisma disabled",     // Using Supabase
  "db:pull": "Prisma disabled",         // Using Supabase
  "db:push": "Prisma disabled",         // Using Supabase
  "db:migrate": "Prisma disabled",      // Using Supabase
  "db:studio": "Prisma disabled",       // Using Supabase
  "db:seed": "Prisma disabled"          // Using Supabase
}
```

---

## Workflow & Process Flows

### Supplier Registration & Verification Flow
```
1. Supplier registers with email
2. System sends confirmation email
3. Supplier completes profile and uploads documents
4. Status: "pending" verification
5. Admin reviews documents
6. Admin approves/rejects with notes
7. Supplier receives notification
8. If approved: status = "active"
9. Supplier can now submit bids
```

### Procurement Request Flow
```
1. School Head creates procurement request
2. Submits with details and specifications
3. Status: "Pending Review"
4. Admin receives request for review
5. Admin verifies completeness
6. Admin approves OR requests revisions
7. If approved: Creates project, sends notification
8. School Head publishes project
9. Project visible to suppliers
```

### Bidding & Award Flow
```
1. Project published to suppliers
2. Suppliers submit bids before deadline
3. Bid stored with timestamp
4. School Head evaluates bids
   - Technical compliance check
   - Financial evaluation
   - Comparative analysis
5. School Head selects winner
6. System creates blockchain record
7. Winning supplier receives notification
8. Other suppliers notified (optional)
9. Project marked as "awarded"
```

---

## Security Considerations

### Authentication & Authorization
- ✅ JWT token validation on all protected routes
- ✅ Role-based access control (RBAC)
- ✅ Secure password hashing (bcryptjs)
- ✅ Token expiry enforcement
- ✅ Refresh token mechanism

### Data Protection
- ✅ Encrypted passwords in database
- ✅ HTTPS enforcement (production)
- ✅ Supabase Row-Level Security (RLS)
- ✅ Database connection pooling
- ✅ Secure credential storage

### API Security
- ✅ Input validation with Zod
- ✅ Request logging for audit trail
- ✅ Error handling without data leakage
- ✅ CORS configuration
- ⚠️ Rate limiting (not yet implemented)
- ⚠️ CSRF protection (not yet implemented)

### Future Security Enhancements
- API rate limiting
- CSRF token validation
- Helmet.js security headers
- 2FA/MFA implementation
- End-to-end encryption for sensitive documents
- Web Application Firewall (WAF)

---

## Common Issues & Troubleshooting

### Database Connection Issues
**Problem:** `PrismaClientInitializationError`
**Solution:**
1. Verify DATABASE_URL in .env
2. Check Supabase connection string format
3. Ensure database is active
4. Verify network connectivity to Supabase

### JWT Token Issues
**Problem:** "Token expired" or "Invalid token"
**Solution:**
1. Clear browser cookies/localStorage
2. Re-login to get new token
3. Check JWT_SECRET in environment
4. Verify token expiry settings

### Missing Environment Variables
**Problem:** `Error: Missing environment variable`
**Solution:**
1. Copy `.env.example` to `.env`
2. Fill in all required values
3. Restart dev server
4. Verify all keys are set

---

## Development Tips

### Local Testing
- Use dev credentials (admin@gmail.com / admin123)
- Test different user roles
- Monitor console for errors
- Use browser DevTools for debugging
- Check Supabase logs for database issues

### Database Inspection
```bash
# Open Prisma Studio
npm run db:studio

# Connect to Supabase directly
psql postgresql://postgres:[password]@[host]:5432/postgres
```

### Debugging
- Check `/src/app/api/debug/` endpoints
- Use console.log() for debugging
- Check Next.js server logs
- Verify JWT tokens with debug endpoint
- Review database queries in Supabase

---

## Future Enhancements

1. **Email Notifications** - Integrated email system
2. **SMS Alerts** - Text message notifications
3. **Advanced Analytics** - Dashboard metrics and insights
4. **Document Management** - Centralized document handling
5. **Audit Reports** - Comprehensive compliance reports
6. **2FA/MFA** - Multi-factor authentication
7. **API Rate Limiting** - Prevent abuse
8. **Webhook Support** - Third-party integrations
9. **Mobile App** - React Native mobile application
10. **Advanced Blockchain** - Full blockchain integration (currently simplified)

---

## Support & Contact

For issues, questions, or contributions:
- **Repository:** https://github.com/Kenth08/Bidding-System
- **Issues:** GitHub Issues page
- **Documentation:** See AGENTS.md and CLAUDE.md files

---

**Last Updated:** May 26, 2026  
**Status:** Active Development  
**Version:** 0.1.0
