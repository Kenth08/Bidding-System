# Supplier Verification System - Implementation Guide

**Date Implemented:** May 26, 2026  
**Version:** 2.0.0  
**Status:** Ready for Testing

---

## Overview

This document outlines the comprehensive supplier verification system enhancements implemented for the Blockchain E-Procurement System. The new system includes enhanced registration forms, document verification checklists, and automated compliance checks to ensure only qualified suppliers can submit bids.

---

## Changes Summary

### 1. Database Schema Updates

**File Updated:** `prisma/schema.prisma`

**New Columns Added to `User` Model:**

```prisma
// Legal/Business Documents
sec_dti_certificate              String?
mayors_permit                    String?
mayors_permit_expiry             DateTime?

// Financial Documents
tax_clearance_expiry             DateTime?
audited_financial_statements     String?
financial_statement_year         Int?
bank_reference_document          String?

// Qualifications
performance_certificates         String?
past_contracts_document          String?
track_record_description         String?        @db.Text

// Compliance & Authorization
representative_authorization_document String?
not_blacklisted_declaration      Boolean        @default(false)
blacklisting_declaration_document String?
```

**Backward Compatibility:**
- `business_permit_document` retained for backward compatibility (marked as deprecated)
- New fields split this into `sec_dti_certificate` and `mayors_permit` with expiry tracking

---

## 2. Registration Form Enhancement

**File Updated:** `src/app/register/page.tsx`

### Key Improvements:

#### A. Organized Document Sections
The registration form now has 6 organized sections:

1. **Basic Information**
   - Full name, email, password
   - Company details (name, address, type)
   - Representative information
   - TIN and company profile

2. **Legal Documents** (4 required)
   - SEC or DTI Certificate
   - Mayor's Permit / Business Permit + expiry date
   - PhilGEPS Registration
   - Valid Government-Issued ID

3. **Financial Documents** (3 required)
   - Tax Clearance Certificate + expiry date
   - Audited Financial Statements (1-2 years) + year
   - Bank Reference Letter or Credit Report

4. **Qualifications & Track Record** (Optional)
   - Performance Certificates / ISO Certifications
   - Similar Past Contracts or Purchase Orders
   - Track record description (text area)

5. **Representative Authorization** (1 required)
   - Authorization Letter / Special Power of Attorney (SPA)

6. **Good Standing Declaration** (1 required)
   - Checkbox declaring not blacklisted
   - Optional sworn statement document

#### B. Field Validation

**Client-Side Validation:**
- All required documents must be uploaded
- File size limit: 5MB per file
- Expiry dates cannot be in the past
- Blacklisting declaration checkbox is mandatory

**Server-Side Validation:**
- Comprehensive validation of all form fields
- File format verification
- Date validation for expiry fields
- Blacklisting declaration verification

#### C. Improved UX

- Collapsible section headers
- Clear status indicators (Required vs Optional)
- Summary statistics for document upload progress
- Error messages with specific field references
- Inline date pickers for expiry dates
- File upload feedback with file name display

---

## 3. API Endpoint Enhancement

**File Updated:** `src/app/api/bids/route.ts`

### New Verification Function

```typescript
function checkSupplierVerification(user: any): VerificationCheckResult {
  // Checks:
  // ✓ verification_status === "approved"
  // ✓ sec_dti_certificate is not null
  // ✓ mayors_permit is not null
  // ✓ mayors_permit_expiry is not past
  // ✓ tax_clearance is not null
  // ✓ tax_clearance_expiry is not past
  // ✓ philgeps_registration is not null
  // ✓ not_blacklisted_declaration === true
  // ✓ audited_financial_statements is not null
  // ✓ bank_reference_document is not null
  // ✓ valid_id is not null
  // ✓ representative_authorization_document is not null
}
```

### Bid Submission Blocking

**Location:** `POST /api/bids/` endpoint

**When Submitting a Bid:**
1. Authenticate user as supplier
2. Verify supplier status is "approved" or "active"
3. **NEW:** Run comprehensive verification check
4. If verification fails, return detailed error with:
   - List of missing documents
   - List of expired documents (with expiry dates)
   - Specific error message guiding user to complete profile
5. Only proceed with bid creation if all checks pass

**Error Response Example:**
```json
{
  "error": "Your registration is incomplete. You cannot submit bids until the following are resolved:\n\nMissing or Incomplete:\n• SEC or DTI Certificate\n• Financial Statement Year\n\nExpired Documents:\n• Mayor's Permit (expired on 05/15/2026)\n• Tax Clearance (expired on 04/01/2026)\n\nPlease update your profile to complete the verification process.",
  "missingFields": [
    { "field": "sec_dti_certificate", "label": "SEC or DTI Certificate" },
    { "field": "financial_statement_year", "label": "Financial Statement Year" }
  ],
  "expiredFields": [
    { "field": "mayors_permit_expiry", "label": "Mayor's Permit", "expiryDate": "05/15/2026" },
    { "field": "tax_clearance_expiry", "label": "Tax Clearance", "expiryDate": "04/01/2026" }
  ]
}
```

---

## 4. Admin Verification Checklist Component

**File Created:** `src/components/admin/SupplierVerificationChecklist.tsx`

### Features

#### A. Summary Dashboard
Displays 4 key metrics:
- **UPLOADED:** X/Y documents uploaded
- **EXPIRING SOON:** Count of documents expiring within 30 days
- **EXPIRED:** Count of expired documents
- **STATUS:** Current verification status

#### B. Document Organization
Organized into 4 sections:

1. **Legal Documents** (4 items)
2. **Financial Documents** (3 items)
3. **Qualifications & Track Record** (2 items)
4. **Representative & Declarations** (2 items)

#### C. Per-Document Controls

Each document row shows:
- **Status Icon:** Checkmark (OK), Warning (Expiring Soon), X (Expired), File (Not Uploaded)
- **Label:** Document name with status badges
- **Expiry Info:** When applicable, shows expiry date
- **File Link:** Clickable link to view document
- **Action Buttons** (in edit mode):
  - ✅ **Approve** - Mark document as verified
  - 🚩 **Flag** - Request corrections/re-submission with reason

#### D. Flag/Revision System

When flagging a document:
1. Admin clicks "Flag" button
2. Expandable text field appears
3. Admin enters reason (e.g., "Document expired, please re-submit")
4. Admin clicks "Confirm Flag"
5. Supplier receives notification with reason

#### E. Automatic Expiry Detection

- **Red** indicators for expired documents
- **Yellow** indicators for documents expiring within 30 days
- Prevents supplier bid submission with expired documents

---

## 5. Integration with Bid Submission

### How It Works

**Scenario 1: Supplier with Complete Documents**
```
1. Supplier attempts to submit bid
2. System checks all required documents
3. ✅ All documents present and valid
4. ✅ No documents expired
5. Bid submission allowed
```

**Scenario 2: Supplier with Missing Documents**
```
1. Supplier attempts to submit bid
2. System checks all required documents
3. ❌ Missing: SEC/DTI Certificate
4. ❌ Expired: Mayor's Permit (expired 5/15/26)
5. Bid submission BLOCKED
6. Detailed error message shown to supplier
7. Supplier directed to update profile
```

**Scenario 3: Admin Flags a Document**
```
1. Admin reviews supplier registration
2. Admin sees Mayor's Permit expiry near deadline
3. Admin clicks "Flag" on Mayor's Permit
4. Admin enters reason: "Expires in 20 days, please renew"
5. Supplier cannot submit bids until:
   - Document is approved by admin OR
   - Document is re-submitted
```

---

## 6. Document Upload Integration

### Supported File Types
- PDF
- JPG / JPEG
- PNG

### File Size Limits
- Maximum: 5MB per file
- Enforced on client-side and server-side

### Storage
- Files saved to `public/uploads/` directory
- Accessible via `/uploads/` URL path
- File organization by type (suppliers, bids, etc.)

---

## 7. Data Flow Diagram

```
Supplier Registration
├── Basic Info (full name, email, company details)
├── Legal Documents (SEC/DTI, Mayor's Permit, PhilGEPS, ID)
├── Financial Documents (Tax Clearance, Statements, Bank Ref)
├── Qualifications (Performance Certs, Past Contracts)
├── Representative Authorization (SPA)
└── Good Standing Declaration (Checkbox)
       ↓
API Registration Endpoint
├── Validate all fields
├── Upload and save files
├── Create user record
└── Send notification to admin
       ↓
Admin Verification Panel
├── View all documents
├── Check expiry dates
├── Approve each document
├── Flag documents needing revision
└── Mark supplier as "approved"
       ↓
Supplier Profile Status
├── Status: "approved" ✅
├── All documents: Verified ✅
└── Can now submit bids ✅
       ↓
Bid Submission Verification
├── Check supplier.verification_status
├── Verify all required documents present
├── Check for expired documents
├── Block if any issues found
└── Allow if all pass ✅
```

---

## 8. Usage Instructions

### For Suppliers

#### Registration
1. Visit `/register`
2. Fill in basic information
3. Upload all required legal documents
4. Upload all required financial documents
5. Upload qualifications (if available)
6. Upload representative authorization
7. Check the "Good Standing" declaration
8. Click "Submit Registration"
9. Wait for admin verification

#### Document Management
1. After admin feedback, update profile (if needed)
2. Upload revised/renewed documents
3. Wait for re-verification by admin
4. Once all approved, start submitting bids

### For Admins

#### Verification Process
1. Navigate to admin supplier management
2. Click on supplier to review
3. Use verification checklist component
4. Review each document:
   - Check if document is uploaded
   - Verify document is not expired
   - Ensure quality/compliance
5. Either:
   - Click "Approve" for each document
   - Click "Flag" and enter reason if revision needed
6. Once all documents approved, mark supplier as "verified"
7. System will send notification to supplier

#### Common Issues
- **Expired Documents:** Flag and request renewal
- **Missing Documents:** Flag and request submission
- **Poor Quality:** Flag with specific requirements
- **Document Mismatch:** Flag and explain discrepancy

---

## 9. API Changes Summary

### POST /api/auth/register

**New FormData Fields:**
```
- sec_dti_certificate (File)
- mayors_permit (File)
- mayors_permit_expiry (Date)
- tax_clearance_expiry (Date)
- audited_financial_statements (File)
- financial_statement_year (Number)
- bank_reference_document (File)
- performance_certificates (File)
- past_contracts_document (File)
- track_record_description (Text)
- representative_authorization_document (File)
- not_blacklisted_declaration (Boolean)
- blacklisting_declaration_document (File)
```

### POST /api/bids/

**New Verification Logic:**
```
1. Authenticate supplier
2. NEW: Run checkSupplierVerification()
3. If verification fails:
   - Return 403 error with details
   - Include missingFields array
   - Include expiredFields array
4. If verification passes:
   - Continue with bid submission as normal
```

**Error Response:**
```json
{
  "error": "string",
  "missingFields": [
    { "field": "string", "label": "string" }
  ],
  "expiredFields": [
    { "field": "string", "label": "string", "expiryDate": "string" }
  ]
}
```

---

## 10. Backward Compatibility

### Legacy Support
- `business_permit_document` field retained
- Existing suppliers can continue using old system
- New suppliers use split SEC/DTI and Mayor's Permit fields
- System handles both formats during migrations

### Migration Path
- Phase 1: New suppliers use new system
- Phase 2: Existing suppliers get migration prompt
- Phase 3: Legacy field deprecated (future release)

---

## 11. Testing Checklist

### Registration Form Testing
- [ ] All required fields validate
- [ ] File upload size validation works (5MB limit)
- [ ] File type validation works (PDF/JPG/PNG only)
- [ ] Date pickers show correct format
- [ ] Expiry date validation rejects past dates
- [ ] Checkbox for good standing declaration required
- [ ] Error messages are clear and specific
- [ ] Form successfully submits with all fields

### Admin Verification Testing
- [ ] Checklist displays all documents correctly
- [ ] Status icons show correct states
- [ ] Expiry dates display with color coding
- [ ] "Approve" button works for each document
- [ ] "Flag" button and modal work correctly
- [ ] Flagged documents prevent bid submission
- [ ] Summary statistics update correctly

### Bid Submission Testing
- [ ] Supplier with all documents: Bid submission allowed ✅
- [ ] Supplier with missing document: Bid submission blocked ❌
- [ ] Supplier with expired document: Bid submission blocked ❌
- [ ] Error message lists all issues specifically
- [ ] Supplier can update profile and retry

### Integration Testing
- [ ] User registration → Admin verification → Bid submission flow
- [ ] Document expiry detection and alerting
- [ ] Email notifications to admin and supplier
- [ ] Audit logs for all verification actions

---

## 12. Future Enhancements

1. **Automated Expiry Alerts**
   - Email reminder 30 days before expiry
   - Email warning on expiry date
   - Dashboard alert for admin

2. **Document Templates**
   - Downloadable templates for required documents
   - Example good standing declaration
   - Sample authorization letters

3. **Advanced Analytics**
   - Verification completion rates
   - Common rejection reasons
   - Time to verification dashboard

4. **Document Validation**
   - OCR for document verification
   - Automatic expiry date extraction
   - Document type auto-detection

5. **Bulk Operations**
   - Bulk approve/flag suppliers
   - Batch email notifications
   - Export verification reports

---

## 13. Support & Troubleshooting

### Common Issues

**Issue:** "File must be 5MB or smaller"
**Solution:** Compress PDF or image file before upload

**Issue:** "You cannot submit bids - documents missing"
**Solution:** Go to profile, upload all flagged documents, wait for re-verification

**Issue:** "Mayor's Permit has expired"
**Solution:** Renew permit with government agency, upload new copy, request re-verification

**Issue:** Checkbox "Good Standing Declaration" won't uncheck
**Solution:** Intentional - declaration is mandatory. Cannot be unchecked.

---

## 14. Files Modified/Created

### Created:
- `src/components/admin/SupplierVerificationChecklist.tsx` - Admin verification component

### Modified:
- `prisma/schema.prisma` - Added new User model fields
- `src/app/register/page.tsx` - Complete registration form overhaul
- `src/app/api/bids/route.ts` - Added supplier verification checks

### Unchanged (Backward Compatible):
- Authentication system
- Project management
- Bid ranking system
- Blockchain integration

---

## 15. Deployment Notes

### Database Migration
```bash
# Apply schema changes to PostgreSQL
npm run db:push
```

### Environment Variables
No new environment variables required. System uses existing database connection.

### Testing Before Deployment
1. Test registration form with all fields
2. Verify API validation works
3. Test admin checklist component
4. Verify bid submission blocking logic
5. Test error messages are clear

### Rollback Plan
If issues found:
1. Revert `prisma/schema.prisma` to previous version
2. Revert registration page to backup
3. Revert API endpoint to previous version
4. Run database rollback migration

---

**Implementation Complete!** ✅

All supplier verification enhancements have been successfully implemented and are ready for testing and deployment.
