# Viewer Role — User Workflow & Behavior

## Overview

The Viewer role provides read-only access to the system. Viewers can see public procurement results and verify blockchain records but cannot create, modify, or participate in any procurement activities. This role is intended for oversight personnel, auditors, or stakeholders who need transparency without operational access.

**Role value:** `viewer`  
**Default status:** `active`  
**Route:** No dedicated layout — uses public pages  
**Layout:** None (redirects to `/` on login)

---

## Authentication

- Account created by Admin via User Management (role assigned as `viewer`).
- Logs in via `/login` with email and password.
- On successful login, redirected to `/viewer` path (currently falls through to catch-all → `/`).
- JWT access token stored in `sessionStorage`.

---

## Accessible Pages

| Page | URL | Auth Required | Description |
|------|-----|---------------|-------------|
| Landing Page | `/` | No | System overview, live stats |
| Public Results | `/results` | No | Awarded procurement outcomes |
| Blockchain Verification | `/results` (inline) | No | Verify hash authenticity |

---

## Key Workflows

### 1. Viewing Public Procurement Results

1. Viewer navigates to `/results` (Public Results page).
2. Sees a table of all awarded procurement projects:
   - Project Title
   - Procurement Type
   - Budget (₱)
   - Winning Supplier name
   - Winning Bid Amount (₱)
   - Award Date
   - Public Result Visible Until (expiry date)
3. Can **search** results by project name, supplier, or procurement type.
4. Can click "Verify" on any record to see full details in a modal.

### 2. Verifying Blockchain Records

1. On the Public Results page, a **Verify Blockchain Record** section is available.
2. Viewer pastes a blockchain hash (e.g., `0x...`) into the input field.
3. Clicks "Verify" → system calls `/blockchain/verify/?hash=...` (public, no auth needed).
4. If valid: shows verified record details (project, winner, company, bid amount, recorded timestamp, reference ID).
5. If invalid: shows "Record Not Found — This hash may be invalid or tampered."

### 3. Viewing Landing Page Stats

1. Landing page displays live public statistics:
   - Total Projects
   - Total Bids
   - Active Bidding (currently open projects)
2. These stats are fetched from public endpoints (no authentication required).

---

## Dashboard

The Viewer role does not have a dedicated dashboard. The landing page serves as the primary entry point with system statistics and navigation to public results.

---

## Notifications Received

The Viewer role does not receive any notifications. No notification types are configured for this role.

---

## Permissions

- **Read-only access** to public procurement results.
- Can verify blockchain hashes (public endpoint, no auth needed).
- **Cannot** create or modify projects, bids, procurement requests, or users.
- **Cannot** access admin, supplier, or school head pages.
- **Cannot** view internal blockchain records with hash details (admin-only).
- **Cannot** view bid evaluation details, supplier documents, or audit logs.
- The `IsAdminOrReadOnly` permission class allows authenticated viewers to perform GET requests on certain endpoints.

---

## Current Implementation Notes

- The `viewer` role exists in the User model but has no dedicated frontend layout or protected route.
- `App.jsx` routing uses `getRolePath("viewer")` → `/viewer`, but no `<Route path="/viewer/*">` is defined, so it falls through to the catch-all redirect to `/`.
- All viewer-accessible features are available via public pages that require no authentication.
- Future enhancement: A dedicated Viewer layout could provide authenticated access to more detailed (but still read-only) procurement data.
