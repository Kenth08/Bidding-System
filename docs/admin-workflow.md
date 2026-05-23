# Admin Role — User Workflow & Behavior

## Overview

The Admin has full system access and is responsible for managing the entire procurement lifecycle: reviewing supplier registrations, creating/managing projects, evaluating bids, selecting winners, recording blockchain entries, and managing all user accounts.

**Role value:** `admin`  
**Default status:** `active`  
**Route:** `/admin/*`  
**Layout:** `AdminLayout`

---

## Authentication

- Logs in via `/login` with email and password (e.g., `admin@gmail.com / admin123`).
- On successful login, redirected to `/admin` (Admin Dashboard).
- JWT access token stored in `sessionStorage`.
- Token auto-refreshes on 401 responses.

---

## Navigation (Sidebar Pages)

| Page | URL Path | Description |
|------|----------|-------------|
| Dashboard | `/admin` | Overview stats, recent activity |
| Projects | `/admin/projects` | Create, edit, publish, archive projects |
| Procurement Planning | `/admin/procurement` | Review procurement requests from School Heads |
| Suppliers | `/admin/suppliers` | Approve/reject supplier registrations |
| Bid Evaluation | `/admin/bid-evaluation` | Review bids, mark compliance, rank, select winner |
| Awarding | `/admin/awarding` | Generate NOA, NTP, Resolution documents |
| Users | `/admin/users` | CRUD all user accounts, assign roles |
| Blockchain Records | `/admin/blockchain` | View immutable hash records of awarded bids |
| Reports | `/admin/reports` | Procurement and supplier performance analytics |

---

## Key Workflows

### 1. Supplier Registration Approval

1. Supplier registers → status becomes `pending`.
2. Admin receives `new_supplier` notification.
3. Admin navigates to **Suppliers** page.
4. Reviews uploaded documents (Business Permit, PhilGEPS, Tax Clearance, Valid ID).
5. Approves → supplier status set to `active`/`approved` (can now bid).
6. Or Rejects → supplier status set to `rejected` (cannot bid).
7. Supplier receives `supplier_approved` or `supplier_rejected` notification.

### 2. Procurement Request Review

1. School Head submits a procurement request → status `Pending Review`.
2. Admin receives `procurement_request` notification.
3. Admin navigates to **Procurement Planning** page.
4. Reviews request details (title, budget, deadline, type, specs).
5. Actions available:
   - **Approve** → status becomes `Approved`, a Project is created from the request.
   - **Reject** → status becomes `Rejected`, with rejection reason.
   - **Return for Revision** → status becomes `Revision Required`, with revision notes.
6. School Head receives `request_approved` or `request_rejected` notification.

### 3. Project Management

1. Admin navigates to **Projects** page.
2. Can create a new project manually (or one is auto-created from approved procurement request).
3. Project fields: title, budget, deadline, procurement type, technical specifications, delivery period, procurement schedule, public result expiry date.
4. Project starts in `draft` status.
5. Admin **publishes** the project → status becomes `active`, `published_at` timestamp set.
6. Active projects are visible to approved suppliers for bidding.
7. When deadline passes, project auto-transitions to `closed`.
8. Admin can **archive** a project (with reason) or **unarchive** it.

### 4. Bid Evaluation

1. Suppliers submit bids on active projects → bid status `submitted`.
2. Admin receives `new_bid` notification.
3. Admin navigates to **Bid Evaluation** page, selects a project.
4. Reviews each bid: amount, proposal, quotation file, technical proposal, supporting documents.
5. Marks bids as `under_evaluation`.
6. Sets `technical_compliance` (pass/fail) and writes `evaluation_remarks`.
7. Bids are ranked by amount (lowest wins in government procurement).
8. Admin **selects winner** → winning bid status becomes `won`, others become `lost`.
9. Project status transitions to `awarded`, `awarded_at` timestamp set.
10. Winner receives `bid_won` notification; losers receive `bid_lost` notification.

### 5. Blockchain Recording

1. After winner is selected, Admin records the award on blockchain.
2. Uses `bidsAPI.recordBlockchain(bidId)` endpoint.
3. Creates a `BlockchainRecord` with: project, bid, winner, bid_amount, unique hash, project_ref_id.
4. Bid is marked as `recorded = true`.
5. Record is immutable and publicly verifiable.

### 6. Awarding (Document Generation)

1. Admin navigates to **Awarding** page.
2. For awarded projects, can generate:
   - **NOA** (Notice of Award)
   - **NTP** (Notice to Proceed)
   - **Resolution** (BAC Resolution)
3. Documents generated via `awardsAPI.generateNOA/NTP/Resolution(bidId)`.

### 7. User Management

1. Admin navigates to **Users** page.
2. Can view all users in the system.
3. Can **create** new users (assign role: admin, school_head, supplier, viewer).
4. Can **edit** user details (name, email, role, status).
5. Can **delete** user accounts.

### 8. Blockchain Records Inspection

1. Admin navigates to **Blockchain Records** page.
2. Views all blockchain records with full details including hash values.
3. Uses admin-only endpoint (`/blockchain/admin/`) that exposes hash data.

### 9. Reports & Analytics

1. Admin navigates to **Reports** page.
2. Views procurement reports (project stats, timelines, outcomes).
3. Views supplier performance reports (bid participation, win rates).

---

## Notifications Received

| Type | Trigger |
|------|---------|
| `new_supplier` | Supplier registers |
| `new_bid` | Supplier submits a bid |
| `procurement_request` | School Head submits procurement request |

---

## Permissions

- Full CRUD on projects, bids, users, procurement requests.
- Can approve/reject suppliers and procurement requests.
- Can select bid winners and record blockchain entries.
- Can generate award documents (NOA, NTP, Resolution).
- Can view all blockchain records with hash details.
- Can view audit logs and reports.
