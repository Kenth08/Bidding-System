# Data Flow Diagram (DFD) – Blockchain E-Procurement System
## Level 0 (Context Diagram) & Level 1 (Detailed DFD)

---

## External Entities

| Symbol | Entity |
|--------|--------|
| □ | **Supplier (Bidder)** – Registers, submits bids, uploads documents |
| □ | **Department Head (Requester)** – Submits procurement requests, receives status updates |
| □ | **Admin (BAC)** – Manages projects, evaluates bids, verifies suppliers |
| □ | **Public Viewer** – Views published results and blockchain records |

---

## Data Stores

| ID | Store | Database Table |
|----|-------|----------------|
| D1 | Users | `users` |
| D2 | Projects | `projects_project` |
| D3 | Bids | `bids_bid` |
| D4 | Blockchain Records | `blockchain_blockchainrecord` |
| D5 | Documents | `document_uploads` |
| D6 | Notifications | `notifications` |
| D7 | Procurement Requests | `procurements` |
| D8 | Audit Logs | `audit_logs` |
| D9 | Business Types | `business_types` |
| D10 | Bid Activity Logs | `bid_activity_logs` |
| D11 | Project Business Types | `project_business_types` |
| D12 | Supplier Business Types | `supplier_business_types` |

---

## Processes

### 1.0 – Authenticating User

```
┌─────────────┐                                    ┌──────┐
│  Supplier   │── Registration Data ──────────────▶│ 1.0  │
│  (Bidder)   │◀── Auth Token / Session ──────────│ Auth │
└─────────────┘                                    └──┬───┘
                                                      │
┌─────────────────┐                                   │
│  Department     │── Login Credentials ─────────────▶│
│  Head           │◀── Auth Token / Session ─────────│
└─────────────────┘                                   │
                                                      │
┌─────────────┐                                       │
│    Admin    │── Login Credentials ──────────────────▶│
│    (BAC)    │◀── Auth Token / Session ──────────────│
└─────────────┘                                       │
                                                      ▼
                                                 ┌─────────┐
                                                 │ D1 Users│
                                                 └─────────┘
```

**Data Flows:**
- Supplier → 1.0: Registration data (email, password, company info, business type)
- Department Head → 1.0: Login credentials (email, password)
- Admin → 1.0: Login credentials (email, password)
- 1.0 → D1: User record (hashed password, profile, verification status)
- 1.0 → D12: Supplier-business type associations
- 1.0 → Supplier/Department Head/Admin: JWT token, session info
- 1.0 → D6: Email verification notification

---

### 2.0 – Managing Supplier Documents

```
┌─────────────┐                                    ┌──────┐
│  Supplier   │── Document Upload ────────────────▶│ 2.0  │
│  (Bidder)   │◀── Verification Status ───────────│ Docs │
└─────────────┘                                    └──┬───┘
                                                      │
┌─────────────┐                                       │
│    Admin    │── Approval/Rejection ─────────────────▶│
│    (BAC)    │◀── Pending Documents List ────────────│
└─────────────┘                                       │
                                                      ▼
                                                 ┌─────────┐
                                                 │D5 Docs  │
                                                 └─────────┘
```

**Data Flows:**
- Supplier → 2.0: Document files (SEC/DTI cert, Mayor's permit, tax clearance, PhilGEPS, BIR, financial statements, bank reference, performance certificates)
- 2.0 → D5: Document record (file path, type, size, status)
- 2.0 → D1: Updated verification_status on user
- Admin → 2.0: Verification decision (approve/reject with notes)
- 2.0 → D6: Notification to supplier (approved/rejected)
- 2.0 → D8: Audit log entry

---

### 3.0 – Managing Procurement Requests

```
┌─────────────────┐                                ┌──────┐
│  Department     │── Procurement Request ────────▶│ 3.0  │
│  Head           │◀── Request Status ────────────│ Proc │
│  (Requester)    │                                └──┬───┘
└─────────────────┘                                   │
                                                      │
┌─────────────┐                                       │
│    Admin    │── Review (Approve/Reject) ────────────▶│
│    (BAC)    │◀── Pending Requests List ─────────────│
└─────────────┘                                       │
                                                      ▼
                                                 ┌─────────┐
                                                 │D7 Procur│
                                                 └─────────┘
```

**Data Flows:**
- Department Head → 3.0: Procurement request data (title, budget, deadline, type, specs, schedule, delivery period)
- Admin → 3.0: Review decision (approve/reject with remarks)
- 3.0 → D7: Procurement record (status: Pending Review → Approved/Rejected)
- 3.0 → D2: Creates Project from approved procurement request
- 3.0 → D6: Notification to Department Head (request approved/rejected)
- 3.0 → D6: Notification to Admin (new request pending review)
- 3.0 → D8: Audit log entry

---

### 4.0 – Managing Projects (Bidding Opportunities)

```
┌─────────────┐                                    ┌──────┐
│    Admin    │── Project Details ────────────────▶│ 4.0  │
│    (BAC)    │◀── Project List / Status ─────────│ Proj │
└─────────────┘                                    └──┬───┘
                                                      │
┌─────────────┐                                       │
│  Supplier   │◀── Published Projects ────────────────│
└─────────────┘                                       │
                                                      ▼
                                                 ┌─────────┐
                                                 │D2 Projct│
                                                 └─────────┘
```

**Data Flows:**
- Admin → 4.0: Project data (title, budget, deadline, requirements, procurement type, technical specs, business types)
- 4.0 → D2: Project record (status: draft → published → awarded → archived)
- 4.0 → D11: Project-business type associations
- 4.0 → D6: Notification to eligible suppliers (new project published)
- 4.0 → D8: Audit log (publish, archive, unarchive)
- D2 → Supplier: Published project details (filtered by business type eligibility via D11 & D12)

---

### 5.0 – Submitting & Managing Bids

```
┌─────────────┐                                    ┌──────┐
│  Supplier   │── Bid Submission ─────────────────▶│ 5.0  │
│  (Bidder)   │◀── Bid Status / Remarks ──────────│ Bids │
└─────────────┘                                    └──┬───┘
                                                      │
┌─────────────┐                                       │
│    Admin    │── Evaluation / Selection ─────────────▶│
│    (BAC)    │◀── Bid List & Rankings ───────────────│
└─────────────┘                                       │
                                                      ▼
                                                 ┌─────────┐
                                                 │ D3 Bids │
                                                 └─────────┘
```

**Data Flows:**
- Supplier → 5.0: Bid data (amount, proposal, quotation file, technical proposal, supporting docs, SBD declarations, digital signature)
- 5.0 → D3: Bid record (status: submitted → under_review → evaluated → selected/rejected)
- Admin → 5.0: Evaluation (technical compliance, remarks, rank, selection)
- 5.0 → D10: Bid activity log (submission, review, selection events)
- 5.0 → D6: Notification to supplier (bid reviewed, selected, rejected)
- 5.0 → D8: Audit log entry

---

### 6.0 – Anchoring to Blockchain

```
┌──────┐                                           ┌──────┐
│ 5.0  │── Winning Bid Data ──────────────────────▶│ 6.0  │
│ Bids │                                           │ BC   │
└──────┘                                           └──┬───┘
                                                      │
┌──────────────┐                                      │
│Public Viewer │◀── Blockchain Hash / Verification ───│
└──────────────┘                                      │
                                                      ▼
                                                 ┌─────────┐
                                                 │D4 BC Rec│
                                                 └─────────┘
```

**Data Flows:**
- 5.0 → 6.0: Winning bid details (project ID, bid ID, winner ID, bid amount)
- 6.0 → D4: Blockchain record (hash, project ref, recorded timestamp)
- 6.0 → D8: Audit log (blockchain record created)
- D4 → Public Viewer: Verification data (hash, bid amount, project reference)
- Admin → 6.0: Trigger record creation upon bid selection

---

### 7.0 – Verifying Authenticity (Public)

```
┌──────────────┐                                   ┌──────┐
│Public Viewer │── Verification Request ──────────▶│ 7.0  │
│              │◀── Verification Result ───────────│Verify│
└──────────────┘                                   └──┬───┘
                                                      │
                                                      ▼
                                                 ┌─────────┐
                                                 │D4 BC Rec│
                                                 └─────────┘
```

**Data Flows:**
- Public Viewer → 7.0: Hash or project reference to verify
- 7.0 → D4: Query blockchain records
- 7.0 → Public Viewer: Verification result (valid/invalid, bid details, timestamp)

---

### 8.0 – Managing Notifications

```
┌──────┐                                           ┌──────┐
│ All  │── Trigger Events ────────────────────────▶│ 8.0  │
│Procs │                                           │Notif │
└──────┘                                           └──┬───┘
                                                      │
┌─────────────────┐                                   │
│  Supplier       │◀── Notifications ─────────────────│
│  Department Head│◀── Notifications ─────────────────│
│  Admin          │◀── Notifications ─────────────────│
└─────────────────┘                                   │
                                                      ▼
                                                 ┌─────────┐
                                                 │D6 Notif │
                                                 └─────────┘
```

**Data Flows:**
- Processes (1.0–6.0) → 8.0: Trigger events (registration, document status, bid updates, project published, blockchain recorded, procurement request status)
- 8.0 → D6: Notification record (type, title, message, link, read status)
- D6 → Supplier/Department Head/Admin: Notification list, unread count
- Supplier/Department Head/Admin → 8.0: Mark as read / Mark all read

---

### 9.0 – Generating Reports & Dashboard

```
┌─────────────┐                                    ┌──────┐
│    Admin    │── Report Request ─────────────────▶│ 9.0  │
│    (BAC)    │◀── Report Data / Export ───────────│Report│
└─────────────┘                                    └──┬───┘
                                                      │
                                              ┌───────┼───────┐
                                              ▼       ▼       ▼
                                          ┌─────┐┌─────┐┌─────┐
                                          │D1   ││D2   ││D3   │
                                          │Users││Proj ││Bids │
                                          └─────┘└─────┘└─────┘
```

**Data Flows:**
- Admin → 9.0: Report parameters (date range, type, filters)
- D1, D2, D3, D5 → 9.0: Aggregated data (supplier stats, procurement stats, bid analytics, expiring documents)
- 9.0 → Admin: Dashboard stats, report exports (PDF/Excel), expiring document alerts

---

### 10.0 – Publishing Results (Public)

```
┌──────────────┐                                   ┌──────┐
│Public Viewer │── View Request ──────────────────▶│10.0  │
│              │◀── Awarded Project Results ───────│Public│
└──────────────┘                                   └──┬───┘
                                                      │
                                              ┌───────┼───────┐
                                              ▼       ▼       ▼
                                          ┌─────┐┌─────┐┌─────┐
                                          │D2   ││D3   ││D4   │
                                          │Proj ││Bids ││BC   │
                                          └─────┘└─────┘└─────┘
```

**Data Flows:**
- Public Viewer → 10.0: Request for published results
- D2 → 10.0: Awarded project details
- D3 → 10.0: Winning bid info (company, amount)
- D4 → 10.0: Blockchain verification hash
- 10.0 → Public Viewer: Public results page (project title, winner, amount, blockchain proof)

---

## Level 0 – Context Diagram (Summary)

```
                         ┌─────────────────────────────────────────┐
                         │                                         │
  ┌──────────┐           │     Blockchain E-Procurement System     │           ┌──────────┐
  │ Supplier │◀─────────▶│                                         │◀─────────▶│  Admin   │
  │ (Bidder) │           │   (Next.js + Prisma + Supabase + JWT)   │           │  (BAC)   │
  └──────────┘           │                                         │           └──────────┘
                         │                                         │
                         └───┬────────────────────────────────┬────┘
                             │                                │
                             ▼                                ▼
                     ┌──────────────┐              ┌─────────────────┐
                     │Public Viewer │              │ Department Head │
                     └──────────────┘              │  (Requester)    │
                                                   └─────────────────┘

  Supplier ──▶ System: Registration, Documents, Bids
  System ──▶ Supplier: Auth tokens, Notifications, Bid status, Project listings
  Department Head ──▶ System: Procurement requests
  System ──▶ Department Head: Auth tokens, Notifications, Request status
  Admin ──▶ System: Projects, Evaluations, Verifications, Reports, Request reviews
  System ──▶ Admin: Dashboard, Notifications, Bid rankings, Reports
  System ──▶ Public: Published results, Blockchain verification
  Public ──▶ System: Verification requests, View results
```

---

## Data Flow Summary Table

| From | To | Data | Process |
|------|----|------|---------|
| Supplier | 1.0 | Registration/Login credentials | Authenticating User |
| Department Head | 1.0 | Login credentials | Authenticating User |
| Admin | 1.0 | Login credentials | Authenticating User |
| 1.0 | D1 | User record | Authenticating User |
| 1.0 | D12 | Supplier-business type associations | Authenticating User |
| Supplier | 2.0 | Document files (SEC, Mayor's permit, etc.) | Managing Documents |
| Admin | 2.0 | Verification decision | Managing Documents |
| 2.0 | D5 | Document upload record | Managing Documents |
| Department Head | 3.0 | Procurement request details | Managing Procurement |
| Admin | 3.0 | Review decision (approve/reject) | Managing Procurement |
| 3.0 | D7 | Procurement record | Managing Procurement |
| 3.0 | D2 | Approved → Project | Managing Procurement |
| 3.0 | D6 | Notification to Department Head | Managing Procurement |
| Admin | 4.0 | Project details, publish action | Managing Projects |
| 4.0 | D2 | Project record | Managing Projects |
| 4.0 | D11 | Project-business type associations | Managing Projects |
| Supplier | 5.0 | Bid submission (amount, docs, signature) | Submitting Bids |
| Admin | 5.0 | Evaluation, ranking, selection | Submitting Bids |
| 5.0 | D3 | Bid record | Submitting Bids |
| 5.0 | D10 | Bid activity log | Submitting Bids |
| 5.0 | 6.0 | Winning bid data | Anchoring to Blockchain |
| 6.0 | D4 | Blockchain hash record | Anchoring to Blockchain |
| Public | 7.0 | Hash/reference to verify | Verifying Authenticity |
| 7.0 | D4 | Query blockchain records | Verifying Authenticity |
| All Processes | 8.0 | Trigger events | Managing Notifications |
| 8.0 | D6 | Notification records | Managing Notifications |
| Admin | 9.0 | Report parameters | Generating Reports |
| D1,D2,D3 | 9.0 | Aggregated data | Generating Reports |
| Public | 10.0 | View request | Publishing Results |
| D2,D3,D4 | 10.0 | Project/bid/blockchain data | Publishing Results |

---

*Diagram follows Yourdon-DeMarco DFD notation:*
- **Rectangles (□)** = External Entities
- **Rounded rectangles / Circles** = Processes (numbered X.0)
- **Open-ended rectangles** = Data Stores (DX)
- **Arrows (→)** = Data Flows with labels
