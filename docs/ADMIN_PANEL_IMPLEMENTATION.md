# 🏢 4Zee Properties — Admin Panel Frontend Implementation Guide

> **Last Updated:** 20 February 2026
> **Backend Version:** NestJS + Prisma + PostgreSQL (Supabase)
> **Total Admin Endpoints:** 89
> **Base URL:** `https://your-api-domain.com` (no global prefix — routes are at root)

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [API Response Envelope](#2-api-response-envelope)
3. [Pagination Pattern](#3-pagination-pattern)
4. [Dashboard](#4-dashboard)
5. [User Management (Auth)](#5-user-management-auth)
6. [KYC Management](#6-kyc-management)
7. [Properties](#7-properties)
8. [Applications](#8-applications)
9. [Sales](#9-sales)
10. [Payment Plans](#10-payment-plans)
11. [Commissions](#11-commissions)
12. [Payouts](#12-payouts)
13. [Analytics](#13-analytics)
14. [Reports & Exports](#14-reports--exports)
15. [Settings](#15-settings)
16. [Support Tickets](#16-support-tickets)
17. [Activity Logs](#17-activity-logs)
18. [Documents & Templates](#18-documents--templates)
19. [Referrals](#19-referrals)
20. [Messaging](#20-messaging)
21. [Uploads & Storage](#21-uploads--storage)
22. [Suggested Admin Sidebar Navigation](#22-suggested-admin-sidebar-navigation)
23. [Recommended Tech Stack](#23-recommended-tech-stack)

---

## 1. Authentication & Authorization

### Login Flow

Admin users log in via the same auth endpoint as other users:

```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "admin@4zee.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": {
      "id": "uuid",
      "email": "admin@4zee.com",
      "role": "ADMIN",
      "isEmailVerified": true,
      "mustChangePassword": false,
      "twoFactorEnabled": false
    }
  }
}
```

### Token Refresh

```
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

### Required Headers (All Authenticated Requests)

| Header | Value | Required |
|--------|-------|----------|
| `Authorization` | `Bearer <accessToken>` | ✅ Yes |
| `X-Request-Id` | UUID (auto-generated if omitted) | Optional |
| `Idempotency-Key` | UUID for write operations | Recommended for POST/PUT/PATCH |

### Roles

| Role | Value | Access Level |
|------|-------|-------------|
| `SUPER_ADMIN` | `SUPER_ADMIN` | Full system access + user creation |
| `ADMIN` | `ADMIN` | Full admin panel access |
| `REALTOR` | `REALTOR` | Realtor dashboard only |
| `CLIENT` | `CLIENT` | Client dashboard only |

### Force Password Change

If `user.mustChangePassword === true` (new admin created with temp password):

```
POST /auth/force-change-password
```

**Body:**
```json
{
  "currentPassword": "tempPassword123",
  "newPassword": "NewSecureP@ssw0rd"
}
```

> ⚠️ **Frontend should check `mustChangePassword` on login and redirect to a password change screen before allowing access to the admin panel.**

---

## 2. API Response Envelope

Every response from the API follows this consistent structure:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-02-20T10:30:00.000Z",
    "version": "1.0.0",
    "pagination": { ... }
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Unauthorized" | ["field must be a string"],
  "path": "/admin/kyc/pending",
  "timestamp": "2026-02-20T10:30:00.000Z"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (token expired/missing) |
| `403` | Forbidden (insufficient role) |
| `404` | Not Found |
| `409` | Conflict (duplicate) |
| `429` | Rate Limited |
| `500` | Internal Server Error |

---

## 3. Pagination Pattern

Most list endpoints support **cursor-based pagination** with an **offset fallback**.

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer | `20` | Items per page (1–100) |
| `cursor` | string | — | ID of last item from previous page |
| `page` | integer | `1` | Offset fallback (used when no cursor) |

### Paginated Response Shape

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 20,
      "totalPages": 8,
      "hasNext": true,
      "hasPrev": false,
      "nextCursor": "uuid-of-last-item",
      "prevCursor": null
    }
  }
}
```

### Frontend Implementation

```typescript
// First page
const res = await api.get('/admin/applications?limit=20');

// Next page (cursor-based — preferred)
const res = await api.get(`/admin/applications?limit=20&cursor=${pagination.nextCursor}`);

// Or offset-based
const res = await api.get('/admin/applications?limit=20&page=2');
```

---

## 4. Dashboard

The admin dashboard provides a unified overview of platform KPIs.

### `GET /dashboard/admin`

**Roles:** `ADMIN`, `SUPER_ADMIN`

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 256,
      "usersByRole": {
        "ADMIN": 3,
        "REALTOR": 48,
        "CLIENT": 205
      },
      "totalProperties": 32,
      "propertiesByAvailability": {
        "AVAILABLE": 18,
        "RESERVED": 8,
        "SOLD": 6
      }
    },
    "applications": {
      "total": 89,
      "byStatus": {
        "PENDING": 12,
        "APPROVED": 45,
        "REJECTED": 32
      }
    },
    "financials": {
      "totalSalesValue": 450000000,
      "completedSales": 6,
      "totalPaymentsReceived": 320000000,
      "totalPayments": 45
    },
    "pendingActions": {
      "kycPending": 5,
      "payoutsPending": {
        "count": 3,
        "amount": 2500000
      },
      "openSupportTickets": 7
    },
    "recentActivity": [
      {
        "id": "uuid",
        "action": "CREATE",
        "entityType": "APPLICATION",
        "entityId": "uuid",
        "description": "New application submitted",
        "createdAt": "2026-02-20T09:15:00.000Z"
      }
    ]
  }
}
```

> 💡 **All monetary amounts are in kobo (₦1 = 100 kobo).** Divide by 100 to display in Naira.

### `GET /dashboard/quick-stats`

**Roles:** Any authenticated user (returns role-specific stats)

**Response (Admin):**
```json
{
  "success": true,
  "data": {
    "unreadNotifications": 5,
    "unreadMessages": 2,
    "pendingKyc": 5,
    "pendingPayouts": 3,
    "openTickets": 7
  }
}
```

> 💡 Use this for header badges/notification counts. Poll every 30–60 seconds or use SSE.

---

## 5. User Management (Auth)

### 5.1 Create User

```
POST /admin/auth/create-user
```

**Roles:** `ADMIN`, `SUPER_ADMIN`

Creates a new user with a temporary password. The user will receive an email with the temp password and must change it on first login.

**Request Body:**
```json
{
  "email": "newrealtor@email.com",
  "role": "REALTOR",
  "firstName": "John",
  "lastName": "Adewale"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | ✅ | Must be unique |
| `role` | enum | ✅ | `ADMIN`, `REALTOR`, or `CLIENT` |
| `firstName` | string | Optional | Pre-fill profile |
| `lastName` | string | Optional | Pre-fill profile |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "newrealtor@email.com",
    "role": "REALTOR",
    "mustChangePassword": true,
    "message": "User created. Temporary password sent to newrealtor@email.com"
  }
}
```

### 5.2 Unlock User Account

```
PATCH /admin/auth/unlock/:userId
```

**Roles:** `ADMIN`, `SUPER_ADMIN`

Unlocks a user account that was locked after 5 failed login attempts.

| Param | Type | Description |
|-------|------|-------------|
| `userId` | UUID (path) | The locked user's ID |

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User account unlocked successfully"
  }
}
```

---

## 6. KYC Management

KYC uses **manual admin approval**. Clients/realtors submit documents, which land in a PENDING queue for admin review.

### 6.1 List Pending KYC

```
GET /admin/kyc/pending
```

**Roles:** `ADMIN`, `SUPER_ADMIN`

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `status` | enum | `PENDING` | `NOT_SUBMITTED`, `PENDING`, `APPROVED`, `REJECTED` |

**Response:**
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "uuid",
        "firstName": "Chukwuemeka",
        "lastName": "Obi",
        "phone": "+2348012345678",
        "kycStatus": "PENDING",
        "user": { "email": "client@email.com" },
        "kycDocuments": [
          {
            "id": "uuid",
            "type": "NIN",
            "idNumber": "12345678901",
            "fileUrl": "https://storage.../doc.pdf",
            "fileName": "nin_front.pdf",
            "status": "PENDING",
            "createdAt": "2026-02-19T14:00:00.000Z"
          }
        ]
      }
    ],
    "realtors": [ ... ]
  }
}
```

### 6.2 Get Client KYC Details

```
GET /admin/kyc/clients/:clientId
```

**Roles:** `ADMIN`, `SUPER_ADMIN`

Returns full client profile, all KYC documents, and recent applications.

| Param | Type | Description |
|-------|------|-------------|
| `clientId` | UUID (path) | Client ID |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "Chukwuemeka",
    "lastName": "Obi",
    "phone": "+2348012345678",
    "address": "123 Victoria Island",
    "dateOfBirth": "1990-05-15",
    "kycStatus": "PENDING",
    "user": {
      "email": "client@email.com",
      "createdAt": "2026-01-15T10:00:00.000Z"
    },
    "kycDocuments": [ ... ],
    "applications": [
      {
        "id": "uuid",
        "status": "APPROVED",
        "property": { "title": "Lekki Phase 1 - Plot 12" },
        "createdAt": "2026-02-01T10:00:00.000Z"
      }
    ]
  }
}
```

### 6.3 Verify/Reject KYC Document

```
POST /admin/kyc/documents/:documentId/verify
```

**Roles:** `ADMIN`, `SUPER_ADMIN`

| Param | Type | Description |
|-------|------|-------------|
| `documentId` | UUID (path) | The KYC document to review |

**Request Body:**
```json
{
  "documentId": "uuid",
  "approved": true,
  "rejectionReason": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `documentId` | UUID | ✅ | Document ID |
| `approved` | boolean | ✅ | `true` to approve, `false` to reject |
| `rejectionReason` | string | Required if `approved: false` | Reason shown to user |

**Behavior:**
- **Approve:** Sets document to `APPROVED`. If all documents for the client/realtor are approved (none pending), their overall `kycStatus` becomes `APPROVED` and a notification is sent.
- **Reject:** Sets document to `REJECTED`, updates client/realtor status to `REJECTED`, and sends notification with the reason.

### 6.4 KYC Statistics

```
GET /admin/kyc/statistics
```

**Roles:** `ADMIN`, `SUPER_ADMIN`

**Response:**
```json
{
  "success": true,
  "data": {
    "byStatus": {
      "NOT_SUBMITTED": 120,
      "PENDING": 15,
      "APPROVED": 98,
      "REJECTED": 5
    },
    "clients": {
      "PENDING": 10,
      "APPROVED": 80,
      "REJECTED": 3
    },
    "realtors": {
      "PENDING": 5,
      "APPROVED": 18,
      "REJECTED": 2
    },
    "submissionsLast24h": 4
  }
}
```

> 💡 **UI Suggestion:** Show a KYC overview card on the dashboard with a badge for pending count. Link to a detailed KYC review page with side-by-side document viewer and approve/reject buttons.

---

## 7. Properties

### 7.1 Create Property

```
POST /properties
```

**Roles:** `ADMIN`

**Request Body:**
```json
{
  "title": "Lekki Phase 1 - Plot 12",
  "description": "Premium 500sqm plot in the heart of Lekki Phase 1...",
  "price": 45000000,
  "location": "Lekki Phase 1, Lagos",
  "type": "LAND",
  "bedrooms": 0,
  "bathrooms": 0,
  "area": 500,
  "address": "Plot 12, Road 5, Lekki Phase 1",
  "city": "Lagos",
  "state": "Lagos",
  "features": ["Fenced", "Gated", "C of O"],
  "images": ["https://storage.../img1.jpg", "https://storage.../img2.jpg"],
  "coordinates": {
    "lat": 6.4281,
    "lng": 3.4219
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Property title |
| `description` | string | ✅ | Full description |
| `price` | integer | ✅ | Price in **Naira** (not kobo) |
| `location` | string | ✅ | General location |
| `type` | enum | Optional | `LAND`, `HOUSE`, `APARTMENT`, `COMMERCIAL`, `MIXED_USE` |
| `bedrooms` | integer | Optional | Number of bedrooms |
| `bathrooms` | integer | Optional | Number of bathrooms |
| `area` | number | Optional | Area in sqm |
| `address` | string | Optional | Full address |
| `city` | string | Optional | City |
| `state` | string | Optional | State |
| `features` | string[] | Optional | Feature tags |
| `images` | string[] | Optional | Image URLs (upload first via `/uploads`) |
| `coordinates` | object | Optional | `{ lat: number, lng: number }` |

### 7.2 Update Property

```
PATCH /properties/:id
```

**Roles:** `ADMIN`

Partial update — only send fields you want to change.

**Request Body (example):**
```json
{
  "price": 50000000,
  "availability": "RESERVED"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `availability` | enum | `AVAILABLE`, `RESERVED`, `SOLD` |
| All create fields | — | Any field from create can be updated |

### 7.3 Delete Property

```
DELETE /properties/:id
```

**Roles:** `ADMIN`

Permanently deletes the property. Use with caution.

> ⚠️ **Cannot delete a property that has active applications or sales.**

---

## 8. Applications

### 8.1 List All Applications

```
GET /admin/applications
```

**Roles:** `ADMIN`

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `status` | enum | — | `PENDING`, `APPROVED`, `REJECTED` |
| `limit` | integer | `20` | Items per page |
| `cursor` | string | — | Cursor for pagination |
| `page` | integer | `1` | Offset fallback |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "status": "PENDING",
        "createdAt": "2026-02-18T10:00:00.000Z",
        "client": {
          "id": "uuid",
          "firstName": "Ade",
          "lastName": "Johnson",
          "user": { "email": "ade@email.com" }
        },
        "property": {
          "id": "uuid",
          "title": "Lekki Phase 1 - Plot 12",
          "price": 45000000
        },
        "realtor": {
          "id": "uuid",
          "firstName": "Emeka",
          "lastName": "Obi"
        }
      }
    ],
    "pagination": { ... }
  }
}
```

### 8.2 Approve Application

```
PATCH /admin/applications/:id/approve
```

**Roles:** `ADMIN`

Sets application status to `APPROVED`. The client can now proceed to payment.

### 8.3 Reject Application

```
PATCH /admin/applications/:id/reject
```

**Roles:** `ADMIN`

Sets application status to `REJECTED`.

> 💡 **UI Suggestion:** Show applications in a table with status chips (color-coded). Clicking a row opens a detail panel with client info, property info, and approve/reject buttons.

---

## 9. Sales

### 9.1 Record Offline Sale

```
POST /admin/sales/offline
```

**Roles:** `ADMIN`

For sales that happened outside the platform (cash, bank transfer, etc.).

**Request Body:**
```json
{
  "propertyId": "uuid",
  "clientId": "uuid",
  "amount": 4500000000,
  "realtorId": "uuid"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `propertyId` | UUID | ✅ | Property being sold |
| `clientId` | UUID | ✅ | Buyer client |
| `amount` | integer | ✅ | Sale amount in **kobo** |
| `realtorId` | UUID | ✅ | Referring realtor (for commission) |

**Side Effects:**
- Property marked as `SOLD`
- Sale record created
- Commission calculated for the realtor
- Allocation documents generated
- Email notifications sent

### 9.2 List All Sales

```
GET /admin/sales
```

**Roles:** `ADMIN`

| Query Param | Type | Description |
|-------------|------|-------------|
| `startDate` | YYYY-MM-DD | Filter from date |
| `endDate` | YYYY-MM-DD | Filter to date |
| `realtorId` | UUID | Filter by realtor |
| `type` | enum | `ONLINE` or `OFFLINE` |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": 4500000000,
      "type": "ONLINE",
      "createdAt": "2026-02-15T10:00:00.000Z",
      "property": { "id": "uuid", "title": "Lekki Plot 12" },
      "client": { "id": "uuid", "firstName": "Ade", "lastName": "Johnson" },
      "realtor": { "id": "uuid", "firstName": "Emeka", "lastName": "Obi" }
    }
  ]
}
```

---

## 10. Payment Plans

### 10.1 Create Template

```
POST /admin/payment-plans/templates
```

**Roles:** `ADMIN`

**Request Body:**
```json
{
  "name": "6-Month Installment Plan",
  "durationMonths": 6,
  "interestRate": 0.05,
  "description": "Spread payment over 6 months with 5% interest",
  "isActive": true,
  "minimumDownPayment": 5000000,
  "maxEnrollments": 100,
  "terms": "Full payment required within 6 months. Late fees apply after 7 days."
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Plan name |
| `durationMonths` | integer | ✅ | Duration (1–60 months) |
| `interestRate` | decimal | ✅ | Rate as decimal (0–1), e.g. `0.05` = 5% |
| `description` | string | Optional | Shown to clients |
| `isActive` | boolean | Optional | Default `true` |
| `minimumDownPayment` | integer | Optional | In kobo |
| `maxEnrollments` | integer | Optional | Enrollment cap |
| `terms` | string | Optional | Terms and conditions |

### 10.2 Update Template

```
PATCH /admin/payment-plans/templates/:id
```

**Roles:** `ADMIN`

Partial update — send only fields to change.

### 10.3 Deactivate Template

```
DELETE /admin/payment-plans/templates/:id
```

**Roles:** `ADMIN`

Soft-deletes (deactivates). Existing enrollments are unaffected.

### 10.4 List All Enrollments

```
GET /admin/payment-plans/enrollments
```

**Roles:** `ADMIN`

| Query Param | Type | Description |
|-------------|------|-------------|
| `status` | enum | `ACTIVE`, `COMPLETED`, `CANCELLED`, `DEFAULTED` |

### 10.5 Admin-Enroll Application

```
POST /admin/payment-plans/enrollments
```

**Roles:** `ADMIN`

Enroll any approved application into a payment plan.

**Request Body:**
```json
{
  "applicationId": "uuid",
  "templateId": "uuid",
  "startDate": "2026-03-01T00:00:00.000Z"
}
```

### 10.6 Cancel Enrollment

```
PATCH /admin/payment-plans/enrollments/:id/cancel
```

**Roles:** `ADMIN`

**Request Body:**
```json
{
  "reason": "Client requested cancellation"
}
```

### 10.7 Get Overdue Installments

```
GET /admin/payment-plans/overdue
```

**Roles:** `ADMIN`

Returns all overdue installments across all enrollments. Useful for follow-up actions.

### 10.8 Waive Installment

```
PATCH /admin/payment-plans/installments/:id/waive
```

**Roles:** `ADMIN`

**Request Body:**
```json
{
  "reason": "Goodwill gesture — first-time buyer"
}
```

### 10.9 Payment Plan Statistics

```
GET /admin/payment-plans/statistics
```

**Roles:** `ADMIN`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEnrollments": 45,
    "activeEnrollments": 30,
    "completedEnrollments": 12,
    "cancelledEnrollments": 3,
    "totalPaidAmount": 250000000,
    "totalPendingAmount": 180000000,
    "totalOverdueAmount": 15000000,
    "overdueInstallments": 8
  }
}
```

---

## 11. Commissions

### 11.1 Get Commission Rates

```
GET /commissions/rates
```

**Roles:** `ADMIN`

**Response:**
```json
{
  "success": true,
  "data": {
    "directRate": 0.05,
    "referralRate": 0.02
  }
}
```

### 11.2 Update Commission Rates

```
PATCH /commissions/rates
```

**Roles:** `ADMIN`

**Request Body:**
```json
{
  "directRate": 0.05,
  "referralRate": 0.02
}
```

| Field | Type | Description |
|-------|------|-------------|
| `directRate` | decimal | 0–1 (e.g. `0.05` = 5%) |
| `referralRate` | decimal | 0–1 (e.g. `0.02` = 2%) |

### 11.3 List All Commissions

```
GET /commissions
```

**Roles:** `ADMIN`

| Query Param | Type | Description |
|-------------|------|-------------|
| `limit` | integer | Items per page |
| `cursor` | string | Pagination cursor |
| `page` | integer | Offset fallback |
| `status` | enum | `PENDING`, `APPROVED`, `PAID`, `CANCELLED` |
| `type` | enum | `DIRECT`, `REFERRAL` |
| `realtorId` | UUID | Filter by realtor |
| `startDate` | date | Filter from date |
| `endDate` | date | Filter to date |

### 11.4 Get Commission Detail

```
GET /commissions/:id
```

**Roles:** `ADMIN`, `REALTOR` (own only)

### 11.5 Bulk Approve Commissions

```
POST /commissions/approve
```

**Roles:** `ADMIN`

**Request Body:**
```json
{
  "commissionIds": ["uuid1", "uuid2", "uuid3"]
}
```

### 11.6 Bulk Mark as Paid

```
POST /commissions/mark-paid
```

**Roles:** `ADMIN`

**Request Body:**
```json
{
  "commissionIds": ["uuid1", "uuid2"]
}
```

### 11.7 Bulk Cancel Commissions

```
POST /commissions/cancel
```

**Roles:** `ADMIN`

**Request Body:**
```json
{
  "commissionIds": ["uuid1"]
}
```

### 11.8 Monthly Commission Report

```
GET /commissions/report/:year/:month
```

**Roles:** `ADMIN`

| Param | Type | Example |
|-------|------|---------|
| `year` | integer | `2026` |
| `month` | integer | `2` (February) |

### 11.9 Realtor Commission Summary

```
GET /commissions/realtor-summary/:realtorId
```

**Roles:** `ADMIN`

---

## 12. Payouts

### 12.1 List All Payouts

```
GET /admin/payouts
```

**Roles:** `ADMIN`, `SUPER_ADMIN`

| Query Param | Type | Description |
|-------------|------|-------------|
| `status` | enum | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `REJECTED` |
| `realtorId` | UUID | Filter by realtor |
| `startDate` | date | From date |
| `endDate` | date | To date |

### 12.2 Payout Statistics

```
GET /admin/payouts/statistics
```

**Roles:** `ADMIN`, `SUPER_ADMIN`

### 12.3 Get Payout Detail

```
GET /admin/payouts/:id
```

**Roles:** `ADMIN`, `SUPER_ADMIN`

### 12.4 Process Payout (Approve/Reject)

```
POST /admin/payouts/:id/process
```

**Roles:** `ADMIN`, `SUPER_ADMIN`

**Request Body:**
```json
{
  "approved": true,
  "rejectionReason": null
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `approved` | boolean | ✅ | `true` to approve, `false` to reject |
| `rejectionReason` | string | Required if `false` | Reason for rejection |

> 💡 **UI Suggestion:** Payout approval should show the realtor's bank account details, commission breakdown, and a confirmation dialog before processing.

---

## 13. Analytics

### 13.1 Sales Metrics

```
GET /admin/analytics/sales-metrics
```

**Roles:** `ADMIN`

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 45,
    "totalAmount": 2250000000,
    "averageAmount": 50000000
  }
}
```

### 13.2 Sales by Date Range

```
GET /admin/analytics/sales
```

**Roles:** `ADMIN`

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `startDate` | YYYY-MM-DD | Optional | From date |
| `endDate` | YYYY-MM-DD | Optional | To date |

### 13.3 Top Realtors Leaderboard

```
GET /admin/analytics/top-realtors
```

**Roles:** `ADMIN`

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `metric` | enum | `sales` | `sales` or `recruits` |
| `limit` | integer | `10` | Max 100 |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "firstName": "Emeka",
      "lastName": "Obi",
      "salesCount": 12,
      "totalSalesValue": 540000000
    }
  ]
}
```

---

## 14. Reports & Exports

All report endpoints support date range filtering.

### 14.1 Executive Summary

```
GET /admin/reports/overview
```

**Roles:** `ADMIN`

| Query Param | Type | Description |
|-------------|------|-------------|
| `startDate` | ISO date | Filter from |
| `endDate` | ISO date | Filter to |

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": { ... },
    "salesCount": 45,
    "applicationStats": { ... },
    "propertyInventory": { ... },
    "userCounts": { ... },
    "alerts": [ ... ]
  }
}
```

### 14.2 Sales Report

```
GET /admin/reports/sales
```

| Query Param | Type | Description |
|-------------|------|-------------|
| `startDate` | ISO date | From |
| `endDate` | ISO date | To |
| `realtorId` | UUID | Filter by realtor |
| `type` | enum | `ONLINE` / `OFFLINE` |

### 14.3 Applications Report

```
GET /admin/reports/applications
```

| Query Param | Type | Description |
|-------------|------|-------------|
| `startDate` | ISO date | From |
| `endDate` | ISO date | To |
| `propertyId` | UUID | Filter by property |
| `status` | enum | Filter by status |

### 14.4 Commissions Report

```
GET /admin/reports/commissions
```

### 14.5 Payment Plans Report

```
GET /admin/reports/payment-plans
```

### 14.6 Properties Report

```
GET /admin/reports/properties
```

### 14.7 Realtors Performance Report

```
GET /admin/reports/realtors
```

### 14.8 Export Sales CSV

```
GET /admin/reports/export/sales
```

**Roles:** `ADMIN`

Returns a CSV file download.

| Query Param | Type | Description |
|-------------|------|-------------|
| `startDate` | ISO date | From |
| `endDate` | ISO date | To |

**Response:** Binary CSV file with `Content-Disposition: attachment; filename="sales-report.csv"`

```typescript
// Frontend download implementation
const response = await fetch('/admin/reports/export/sales?startDate=2026-01-01&endDate=2026-02-20', {
  headers: { Authorization: `Bearer ${token}` }
});
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'sales-report.csv';
a.click();
```

### 14.9 Export Commissions CSV

```
GET /admin/reports/export/commissions
```

Same pattern as sales export.

---

## 15. Settings

System-wide configuration with categorized key-value settings.

### 15.1 Initialize Default Settings

```
POST /admin/settings/initialize
```

**Roles:** `ADMIN`

Idempotent — safe to call multiple times. Creates default settings if they don't exist.

### 15.2 Get All Settings

```
GET /admin/settings
```

**Roles:** `ADMIN`

Returns settings grouped by category.

**Response:**
```json
{
  "success": true,
  "data": {
    "commission": [
      { "key": "commission.direct.rate", "value": "0.05", "type": "NUMBER", "description": "..." },
      { "key": "commission.referral.rate", "value": "0.02", "type": "NUMBER", "description": "..." }
    ],
    "payment": [ ... ],
    "general": [ ... ]
  }
}
```

### 15.3 Get Setting Categories

```
GET /admin/settings/categories
```

### 15.4 Get Settings by Category

```
GET /admin/settings/category/:category
```

### 15.5 Get Single Setting

```
GET /admin/settings/:key
```

Example: `GET /admin/settings/commission.direct.rate`

### 15.6 Create Setting

```
POST /admin/settings
```

**Request Body:**
```json
{
  "key": "payment.late.fee.percentage",
  "value": "0.02",
  "type": "NUMBER",
  "category": "payment",
  "description": "Late payment fee as a percentage of the installment amount"
}
```

### 15.7 Update Setting

```
PATCH /admin/settings/:key
```

**Request Body:**
```json
{
  "value": "0.03",
  "description": "Updated late fee"
}
```

### 15.8 Bulk Update Settings

```
PATCH /admin/settings/bulk
```

**Request Body:**
```json
{
  "settings": [
    { "key": "commission.direct.rate", "value": "0.06" },
    { "key": "commission.referral.rate", "value": "0.025" }
  ]
}
```

### 15.9 Delete Setting

```
DELETE /admin/settings/:key
```

### 15.10 Enable Maintenance Mode

```
PATCH /admin/settings/maintenance/enable
```

**Request Body:**
```json
{
  "message": "System under maintenance. Expected back at 10:00 AM WAT."
}
```

### 15.11 Disable Maintenance Mode

```
PATCH /admin/settings/maintenance/disable
```

### 15.12 Toggle Feature Flag

```
PATCH /admin/settings/feature/:feature/toggle
```

**Request Body:**
```json
{
  "enabled": true
}
```

Example: `PATCH /admin/settings/feature/payment-plans/toggle`

### 15.13 Update Commission Rates (Shortcut)

```
PATCH /admin/settings/commission/rates
```

**Request Body:**
```json
{
  "directRate": 0.05,
  "referralRate": 0.02
}
```

---

## 16. Support Tickets

### 16.1 List All Tickets

```
GET /admin/support-tickets
```

**Roles:** `ADMIN`, `SUPER_ADMIN`

| Query Param | Type | Description |
|-------------|------|-------------|
| `status` | enum | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `priority` | enum | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `limit` | integer | Items per page |
| `cursor` | string | Pagination cursor |

### 16.2 Ticket Statistics

```
GET /admin/support-tickets/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "byStatus": { "OPEN": 5, "IN_PROGRESS": 3, "RESOLVED": 12, "CLOSED": 45 },
    "byPriority": { "LOW": 10, "MEDIUM": 30, "HIGH": 15, "URGENT": 2 },
    "averageResponseTime": "2h 15m",
    "averageResolutionTime": "18h 30m"
  }
}
```

### 16.3 Get Ticket Detail

```
GET /admin/support-tickets/:id
```

Returns full ticket with messages, including internal (staff-only) notes.

### 16.4 Reply to Ticket

```
POST /admin/support-tickets/:id/messages
```

**Request Body:**
```json
{
  "content": "We're looking into this issue. Can you provide more details?",
  "attachmentUrl": "https://storage.../screenshot.png",
  "isInternal": false
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | ✅ | Message text |
| `attachmentUrl` | string | Optional | Attachment URL |
| `isInternal` | boolean | Optional | `true` = staff-only note, not visible to user |

### 16.5 Assign Ticket

```
PUT /admin/support-tickets/:id/assign
```

**Request Body:**
```json
{
  "adminId": "uuid"
}
```

### 16.6 Update Ticket Status

```
PUT /admin/support-tickets/:id/status
```

**Request Body:**
```json
{
  "status": "RESOLVED",
  "note": "Issue resolved — client was using wrong payment reference"
}
```

---

## 17. Activity Logs

### 17.1 List Activity Logs

```
GET /admin/activity-logs
```

**Roles:** `ADMIN`

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `action` | enum | — | `CREATE`, `UPDATE`, `DELETE`, `VIEW`, `LOGIN`, `LOGOUT`, `APPROVE`, `REJECT`, `PAYMENT`, `DOWNLOAD`, `SIGN`, `EXPORT` |
| `entityType` | string | — | e.g. `APPLICATION`, `PROPERTY`, `SALE` |
| `userId` | UUID | — | Filter by user |
| `startDate` | ISO date | — | From |
| `endDate` | ISO date | — | To |
| `limit` | integer | `50` | Items per page |
| `offset` | integer | `0` | Offset |

### 17.2 Recent Activity

```
GET /admin/activity-logs/recent
```

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `limit` | integer | `20` | Number of items |

### 17.3 User Activity

```
GET /admin/activity-logs/user/:userId
```

### 17.4 Entity Activity History

```
GET /admin/activity-logs/entity/:entityType/:entityId
```

Example: `GET /admin/activity-logs/entity/PROPERTY/uuid-here`

### 17.5 Activity Statistics

```
GET /admin/activity-logs/statistics
```

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `days` | integer | `30` | Lookback period |

**Response:**
```json
{
  "success": true,
  "data": {
    "byAction": { "CREATE": 120, "UPDATE": 85, "LOGIN": 450, ... },
    "byEntityType": { "APPLICATION": 89, "PROPERTY": 32, ... },
    "byDay": [ { "date": "2026-02-20", "count": 45 }, ... ],
    "topUsers": [ { "userId": "uuid", "count": 120 }, ... ]
  }
}
```

### 17.6 Cleanup Old Logs

```
DELETE /admin/activity-logs/cleanup
```

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `olderThanDays` | integer | `90` | Delete logs older than X days |

---

## 18. Documents & Templates

### 18.1 List Templates

```
GET /admin/documents/templates
```

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `activeOnly` | boolean | `true` | Only show active templates |

### 18.2 Get Template

```
GET /admin/documents/templates/:id
```

### 18.3 Create Template

```
POST /admin/documents/templates
```

**Request Body:**
```json
{
  "name": "Allocation Letter",
  "type": "ALLOCATION_LETTER",
  "content": "<html><body><h1>Allocation Letter</h1><p>Dear {{clientName}},</p><p>This confirms your allocation of {{propertyTitle}} at {{propertyLocation}}...</p></body></html>",
  "isActive": true
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Template name (min 3 chars) |
| `type` | enum | ✅ | Document type (e.g. `ALLOCATION_LETTER`, `RECEIPT`, `AGREEMENT`) |
| `content` | string | ✅ | HTML with `{{placeholder}}` variables (min 50 chars) |
| `isActive` | boolean | Optional | Default `true` |

### 18.4 Update Template

```
PATCH /admin/documents/templates/:id
```

### 18.5 Deactivate Template

```
DELETE /admin/documents/templates/:id
```

### 18.6 List All Documents

```
GET /admin/documents
```

| Query Param | Type | Description |
|-------------|------|-------------|
| `type` | enum | Document type filter |
| `status` | enum | Document status filter |

### 18.7 Generate Document

```
POST /admin/documents/generate
```

**Request Body:**
```json
{
  "applicationId": "uuid",
  "type": "ALLOCATION_LETTER",
  "templateId": "uuid"
}
```

### 18.8 Document Statistics

```
GET /admin/documents/statistics
```

---

## 19. Referrals

### 19.1 List All Referrals

```
GET /admin/referrals
```

**Roles:** `ADMIN`, `SUPER_ADMIN`

| Query Param | Type | Description |
|-------------|------|-------------|
| `realtorId` | UUID | Filter by realtor |
| `limit` | integer | Items per page |
| `cursor` | string | Pagination cursor |
| `page` | integer | Offset fallback |

### 19.2 Referral Statistics

```
GET /admin/referrals/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLinks": 48,
    "totalVisits": 1250,
    "totalConversions": 85,
    "conversionRate": 0.068,
    "topPerformers": [
      { "realtorId": "uuid", "name": "Emeka Obi", "conversions": 15 }
    ]
  }
}
```

---

## 20. Messaging

### 20.1 List All Conversations

```
GET /admin/messaging/conversations
```

**Roles:** `ADMIN`, `SUPER_ADMIN`

| Query Param | Type | Description |
|-------------|------|-------------|
| `propertyId` | UUID | Filter by property |
| `userId` | UUID | Filter by user |

### 20.2 Messaging Statistics

```
GET /admin/messaging/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalConversations": 120,
    "totalMessages": 890,
    "averageResponseTime": "45m"
  }
}
```

---

## 21. Uploads & Storage

### 21.1 List All Uploads

```
GET /admin/uploads
```

**Roles:** `ADMIN`, `SUPER_ADMIN`

| Query Param | Type | Description |
|-------------|------|-------------|
| `category` | enum | `PROPERTY_IMAGE`, `KYC_DOCUMENT`, `PROFILE_PHOTO`, `DOCUMENT`, `SIGNATURE`, `OTHER` |
| `userId` | UUID | Filter by uploader |
| `limit` | integer | Items per page |
| `cursor` | string | Pagination cursor |

### 21.2 Upload Statistics

```
GET /admin/uploads/statistics
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFiles": 450,
    "totalSizeBytes": 2147483648,
    "byCategory": {
      "PROPERTY_IMAGE": { "count": 200, "size": 1073741824 },
      "KYC_DOCUMENT": { "count": 150, "size": 536870912 },
      "PROFILE_PHOTO": { "count": 100, "size": 268435456 }
    }
  }
}
```

---

## 22. Suggested Admin Sidebar Navigation

```
📊 Dashboard
    └── Overview

👥 User Management
    ├── Create User
    └── Unlock Accounts

🏠 Properties
    ├── All Properties
    └── Create Property

📋 Applications
    └── All Applications (with status tabs)

💰 Sales
    ├── All Sales
    └── Record Offline Sale

📅 Payment Plans
    ├── Templates
    ├── Enrollments
    └── Overdue Installments

🏆 Commissions
    ├── All Commissions
    ├── Commission Rates
    └── Monthly Reports

💸 Payouts
    └── Payout Requests

🪪 KYC Verification
    ├── Pending Review
    └── Statistics

📄 Documents
    ├── Templates
    ├── All Documents
    └── Generate Document

📈 Analytics
    ├── Sales Metrics
    └── Top Realtors

📊 Reports
    ├── Executive Overview
    ├── Sales Report
    ├── Applications Report
    ├── Commissions Report
    ├── Payment Plans Report
    ├── Properties Report
    ├── Realtors Performance
    └── Export (CSV)

🔗 Referrals
    └── Overview & Stats

💬 Messaging
    └── Conversations

🎫 Support Tickets
    └── All Tickets

📁 Uploads
    └── File Manager

📝 Activity Logs
    └── System Logs

⚙️ Settings
    ├── General
    ├── Commission Rates
    ├── Feature Flags
    └── Maintenance Mode
```

---

## 23. Recommended Tech Stack

| Layer | Recommendation | Why |
|-------|---------------|-----|
| **Framework** | Next.js 14+ (App Router) or React + Vite | SSR for dashboard, fast builds |
| **UI Library** | shadcn/ui + Tailwind CSS | Clean admin UI, highly customizable |
| **State Management** | TanStack Query (React Query) | Server state caching, auto-refetch |
| **Tables** | TanStack Table | Sorting, filtering, pagination built-in |
| **Charts** | Recharts or Chart.js | Dashboard visualizations |
| **Forms** | React Hook Form + Zod | Type-safe form validation |
| **Auth** | NextAuth.js or custom JWT handler | Token management, refresh flow |
| **Date Handling** | date-fns or dayjs | Lightweight date formatting |
| **File Downloads** | Native fetch + Blob | CSV export handling |
| **Notifications** | Sonner or react-hot-toast | Toast notifications |

### API Client Setup (Axios Example)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res.data, // Unwrap { success, data } envelope
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const { data } = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
          refreshToken,
        });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        error.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(error.config);
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
```

### Key Notes for Frontend Team

1. **Money is in kobo** — Always divide by 100 before displaying: `₦${(amount / 100).toLocaleString()}`
2. **Dates are ISO 8601** — Parse with `new Date()` or `dayjs()`
3. **UUIDs everywhere** — All IDs are UUIDs (v4)
4. **Cursor > Offset** — Prefer cursor-based pagination for performance
5. **Idempotency** — Send `Idempotency-Key: <uuid>` header on all write operations to prevent duplicates on retry
6. **CORS is open** — No restrictions, but always send `Authorization` header
7. **File uploads** — Upload files first via the uploads module, then reference the returned URL in create/update calls
8. **Role check** — After login, check `user.role` is `ADMIN` or `SUPER_ADMIN` before rendering admin UI
9. **Force password change** — Check `user.mustChangePassword` and redirect to password change before any other page
10. **Error messages** — The `message` field in error responses can be a string or array of strings (validation errors)

---

> 📌 **Swagger UI** is available at `GET /api` on the running server for interactive API exploration.
