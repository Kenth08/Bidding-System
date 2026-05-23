# School Head Role — User Workflow & Behavior

## Overview

The School Head initiates the procurement process by creating procurement requests. They submit requests for goods, services, or infrastructure needs, then track the status of those requests through admin review. They can also view approved projects that resulted from their requests.

**Role value:** `school_head`  
**Default status:** `active`  
**Route:** `/school-head/*`  
**Layout:** `SchoolHeadLayout`

---

## Authentication

- Logs in via `/login` with email and password.
- On successful login, redirected to `/school-head` (School Head Dashboard).
- Account created by Admin via User Management (role assigned as `school_head`).
- JWT access token stored in `sessionStorage`.

---

## Navigation (Sidebar Pages)

| Page | URL Path | Description |
|------|----------|-------------|
| Dashboard | `/school-head` | Overview stats, request summaries |
| Procurement Requests | `/school-head/requests` | Create, edit, track procurement requests |
| Approved Records | `/school-head/history` | View projects created from approved requests |

---

## Key Workflows

### 1. Creating a Procurement Request

1. School Head navigates to **Procurement Requests** page.
2. Fills in request form:
   - **Project Title** — name of the procurement need.
   - **Budget** — estimated budget (up to 15 digits).
   - **Deadline** — target completion date.
   - **Procurement Type** — Goods, Services, or Infrastructure.
   - **Technical Specifications** — detailed requirements.
   - **Procurement Schedule** — timeline for procurement activities.
   - **Delivery Period** — expected delivery timeframe.
   - **Public Result Expiry Date** — how long results stay publicly visible.
3. Submits the request → status becomes `Pending Review`.
4. Admin is notified of the new procurement request.

### 2. Tracking Request Status

1. School Head views all their submitted requests on the **Procurement Requests** page.
2. Each request shows its current status:
   - **Pending Review** — awaiting admin decision.
   - **Approved** — admin approved; a project has been created.
   - **Rejected** — admin rejected; rejection reason visible.
   - **Revision Required** — admin returned it with revision notes.
3. School Head receives notifications when status changes.

### 3. Revising a Returned Request

1. If admin returns a request with `Revision Required` status, School Head sees revision notes.
2. School Head can **edit** the request to address the feedback.
3. Resubmits → status returns to `Pending Review`.

### 4. Deleting a Request

1. School Head can delete their own requests (typically only while in `Pending Review` or `Revision Required` status).
2. Uses `procurementAPI.delete(id)`.

### 5. Viewing Approved Records / History

1. School Head navigates to **Approved Records** page.
2. Views projects that were created from their approved procurement requests.
3. Can see project details: title, budget, status, deadline.
4. This is read-only — School Head cannot modify projects directly.

---

## Dashboard

The School Head Dashboard displays:
- Total procurement requests submitted.
- Requests by status (pending, approved, rejected, revision required).
- Quick actions to create new requests or view existing ones.

---

## Notifications Received

| Type | Trigger |
|------|---------|
| `request_approved` | Admin approves their procurement request |
| `request_rejected` | Admin rejects their procurement request |

---

## Permissions

- Can create, edit, and delete their own procurement requests.
- Can view approved projects (read-only).
- Cannot manage projects, bids, suppliers, or users.
- Cannot access bid evaluation, awarding, or blockchain records.
- Permission enforced by `IsSchoolHead` and `IsAdminOrSchoolHead` permission classes.
