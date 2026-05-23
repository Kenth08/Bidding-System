# Supplier Role — User Workflow & Behavior

## Overview

Suppliers are external companies that register on the platform, get approved by an Admin, then browse active procurement projects and submit competitive bids. They track their bid status and view blockchain-verified results.

**Role value:** `supplier`  
**Default status:** `pending` (on registration)  
**Route:** `/supplier/*`  
**Layout:** `SupplierLayout`

---

## Authentication & Registration

### Registration Flow

1. Supplier visits the landing page and clicks "Register as Supplier".
2. Fills in the registration form:
   - **Full Name** (required)
   - **Email Address** (required)
   - **Password** + Confirm Password (min 6 characters)
   - **Company Name** (required)
   - **Company Address**
   - **Phone Number**
   - **Business Type** — Construction, IT Services, Healthcare, Logistics, Consulting, or Other
3. Uploads required documents (all mandatory, max 5MB each, PDF/JPG/PNG):
   - Business Permit Document
   - PhilGEPS Registration
   - Tax Clearance
   - Valid ID
4. Submits registration → account created with status `pending`.
5. Sees confirmation: "Your account is pending admin approval."
6. Admin reviews and approves/rejects the registration.
7. Once approved (status → `active`/`approved`), supplier can log in and bid.

### Login

- Logs in via `/login` with email and password.
- On successful login, redirected to `/supplier` (Supplier Dashboard).
- JWT access token stored in `sessionStorage`.
- **Cannot bid if status is not `active` or `approved`** — enforced by `IsSupplier` permission class.

---

## Navigation (Sidebar Pages)

| Page | URL Path | Description |
|------|----------|-------------|
| Dashboard | `/supplier` | Overview stats, active opportunities |
| Available Projects | `/supplier/projects` | Browse open-for-bidding projects |
| My Bids | `/supplier/bids` | Track submitted bids and their status |
| Results | `/supplier/results` | View blockchain-verified outcomes for own bids |
| Profile | `/supplier/profile` | Manage profile info and uploaded documents |

---

## Key Workflows

### 1. Browsing Available Projects

1. Supplier navigates to **Available Projects** page.
2. Sees only projects with status `active` (open for bidding).
3. Each project shows: title, budget, deadline, procurement type, technical specifications.
4. Supplier can view full project details before deciding to bid.

### 2. Submitting a Bid

1. From an available project, supplier clicks to submit a bid.
2. Fills in bid form:
   - **Bid Amount** — the proposed price (decimal, up to 12 digits).
   - **Company Name** — auto-filled or manually entered.
   - **Proposal** — text description of their approach.
   - **Quotation File** — uploaded document (PDF/image).
   - **Technical Proposal** — uploaded document.
   - **Supporting Documents** — additional files.
3. Submits via `bidsAPI.create(formData)` with `multipart/form-data`.
4. Bid is created with status `submitted`.
5. **Constraint:** One bid per supplier per project (`unique_together: project + supplier`).
6. Admin receives `new_bid` notification.

### 3. Tracking Bid Status

1. Supplier navigates to **My Bids** page.
2. Views all their submitted bids with current status:
   - **Submitted** — bid received, awaiting evaluation.
   - **Under Evaluation** — admin is reviewing the bid.
   - **Won** — bid was selected as the winner.
   - **Lost** — another supplier won.
3. Can see evaluation remarks and rank once evaluation is complete.

### 4. Viewing Results

1. Supplier navigates to **Results** page.
2. Views blockchain-verified procurement outcomes for their own bids.
3. Uses supplier-specific endpoint (`/blockchain/supplier/`) — no hash exposed.
4. Can see: project title, bid amount, winner info, recorded timestamp.

### 5. Managing Profile

1. Supplier navigates to **Profile** page.
2. Can view and update:
   - Full name, email, phone.
   - Company name, company address, business type.
3. Can view uploaded documents (business permit, etc.).
4. Profile modal and settings modal also accessible from the header.

---

## Dashboard

The Supplier Dashboard displays:
- Number of available projects (open for bidding).
- Number of bids submitted.
- Bid outcomes (won/lost/pending).
- Quick links to browse projects or view bids.

---

## Notifications Received

| Type | Trigger |
|------|---------|
| `supplier_approved` | Admin approves their registration |
| `supplier_rejected` | Admin rejects their registration |
| `bid_won` | Their bid is selected as winner |
| `bid_lost` | Another supplier's bid won on a project they bid on |
| `project_published` | A new project is published (open for bidding) |

---

## Permissions

- Can browse active projects (read-only).
- Can submit one bid per project (create only — no edit/delete after submission).
- Can view their own bids and results.
- Can update their own profile.
- **Cannot** bid unless account status is `active` or `approved`.
- **Cannot** access admin pages, procurement requests, user management, or blockchain hash details.
- Permission enforced by `IsSupplier` class which checks both role and status.
