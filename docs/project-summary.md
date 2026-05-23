# Blockchain E-Procurement System — Project Summary

## About the Project

A web-based government procurement bidding platform developed as a BSIT Capstone Project for **Davao del Norte State College (DNSC)**. The system digitizes and secures the procurement process for government institutions by combining modern web technologies with blockchain-based audit trails for transparency and tamper-proof record-keeping.

---

## Problem Statement

Government procurement in the Philippines, particularly at the institutional level, faces several challenges:

1. **Lack of Transparency** — Traditional paper-based or manual bidding processes are opaque. Stakeholders and the public have limited visibility into how contracts are awarded, creating distrust.

2. **Vulnerability to Tampering** — Manual records can be altered after the fact. There is no immutable proof that bid evaluations and award decisions were conducted fairly.

3. **Inefficient Workflow** — Paper-based procurement involves slow document routing between school heads, BAC (Bids and Awards Committee) members, and suppliers. Tracking request status requires physical follow-ups.

4. **Disorganized Supplier Management** — Verifying supplier eligibility (permits, registrations, tax clearances) is manual and error-prone. There's no centralized system to manage supplier credentials.

5. **Limited Accountability** — Without a proper audit trail, it's difficult to trace who approved what, when decisions were made, and whether proper procedures were followed.

6. **Inaccessible Results** — The public and losing bidders often have no easy way to verify that the winning bid was legitimately selected.

---

## How It Solves These Problems

### 1. Blockchain-Verified Transparency

Every awarded contract is recorded as an immutable blockchain entry with a unique cryptographic hash. Anyone — the public, auditors, or losing bidders — can verify the authenticity of procurement results by checking the hash. Records cannot be altered or deleted after creation.

### 2. End-to-End Digital Workflow

The entire procurement lifecycle is digitized:
- **School Head** submits procurement requests online.
- **Admin (BAC)** reviews, approves, and publishes projects.
- **Suppliers** browse opportunities and submit bids electronically.
- **Admin** evaluates bids, selects winners, and generates award documents — all within the system.

This eliminates paper routing, reduces processing time, and provides real-time status tracking for all parties.

### 3. Role-Based Access Control

Four distinct roles (Admin, School Head, Supplier, Viewer) ensure that each user only sees and does what they're authorized to. Permissions are enforced at both the frontend (route protection) and backend (DRF permission classes) levels.

### 4. Centralized Supplier Verification

Suppliers must register with required government documents (Business Permit, PhilGEPS Registration, Tax Clearance, Valid ID). Admin reviews and approves registrations before suppliers can participate. This ensures only legitimate, verified businesses can bid.

### 5. Complete Audit Trail

Every significant action — project creation, bid submission, winner selection, blockchain recording, approvals, rejections — is logged in an `AuditLog` with timestamps and user attribution. This provides full accountability and traceability.

### 6. Public Results & Verification

Awarded procurement results are published on a public page accessible without login. Anyone can search results and verify blockchain hashes to confirm that records are authentic and untampered.

---

## Key Features

| Feature | Description |
|---------|-------------|
| JWT Authentication | Secure login with token refresh rotation |
| Procurement Request System | School heads initiate needs; admin reviews and converts to projects |
| Project Management | Full lifecycle: draft → active → closed → awarded |
| Electronic Bid Submission | Suppliers upload proposals, quotations, and supporting documents |
| Bid Evaluation & Ranking | Admin reviews compliance, ranks by amount, selects winner |
| Blockchain Recording | Immutable hash-based records of all awarded contracts |
| Public Verification | Anyone can verify a blockchain hash to confirm record authenticity |
| Award Document Generation | Auto-generate NOA, NTP, and BAC Resolution |
| Notification System | Real-time in-app notifications for all role-relevant events |
| Supplier Approval Flow | Document-based registration with admin verification gate |
| Audit Logging | Every action tracked with user, timestamp, and description |
| Reports & Analytics | Procurement and supplier performance dashboards |
| Rate Limiting | Throttling on login, signup, and API endpoints to prevent abuse |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 7 + Tailwind CSS 3.4 |
| Backend | Django 5.1 + Django REST Framework 3.15 |
| Database | Supabase PostgreSQL |
| Authentication | SimpleJWT (access + refresh tokens) |
| Icons | Lucide React |
| HTTP Client | Axios with interceptors |

---

## Target Users

| User | Role in System |
|------|---------------|
| BAC Members / Procurement Officers | Admin — manage the entire procurement process |
| School Heads / Department Heads | School Head — initiate procurement needs |
| Registered Suppliers / Contractors | Supplier — bid on government projects |
| Public / Auditors / Oversight Bodies | Viewer — verify transparency of awards |

---

## Procurement Workflow (End-to-End)

```
School Head creates Procurement Request
        ↓
Admin reviews request
        ↓
    ┌─── Approved ───→ Project created (draft)
    │                        ↓
    │                  Admin publishes → Project active (open for bidding)
    │                        ↓
    │                  Suppliers submit bids
    │                        ↓
    │                  Deadline passes → Project closed
    │                        ↓
    │                  Admin evaluates bids (compliance, ranking)
    │                        ↓
    │                  Admin selects winner → Project awarded
    │                        ↓
    │                  Blockchain record created (immutable hash)
    │                        ↓
    │                  Award documents generated (NOA, NTP, Resolution)
    │                        ↓
    │                  Results published publicly
    │
    ├─── Rejected ───→ School Head notified (with reason)
    │
    └─── Revision Required ───→ School Head revises and resubmits
```

---

## Alignment with Philippine Procurement Law

The system is designed with awareness of **RA 9184** (Government Procurement Reform Act) principles:
- Competitive bidding as the default method.
- Transparency through public posting of opportunities and results.
- BAC (Bids and Awards Committee) as the evaluating body (Admin role).
- Document-based supplier eligibility verification.
- Lowest Calculated Responsive Bid (LCRB) evaluation approach.

---

## Project Context

- **Institution:** Davao del Norte State College
- **Program:** Bachelor of Science in Information Technology (BSIT)
- **Type:** Capstone Project 2026
- **Repository:** github.com/Kenth08/Bidding-System
