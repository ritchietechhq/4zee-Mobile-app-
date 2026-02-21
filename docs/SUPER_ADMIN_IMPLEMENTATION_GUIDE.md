# 🔐 Super Admin Implementation Guide — 4Zee Properties

> **Complete reference for all admin/super-admin endpoints, RBAC system, and frontend integration.**
> Last updated: February 2026

---

## Table of Contents

1. [Role Hierarchy & RBAC](#1-role-hierarchy--rbac)
2. [Authentication](#2-authentication)
3. [KYC Management](#3-kyc-management)
4. [Support Tickets](#4-support-tickets)
5. [Payouts](#5-payouts)
6. [Activity Logs](#6-activity-logs)
7. [Properties](#7-properties)
8. [Applications](#8-applications)
9. [Sales](#9-sales)
10. [Payment Plans](#10-payment-plans)
11. [Documents](#11-documents)
12. [Referrals](#12-referrals)
13. [Commissions](#13-commissions)
14. [Analytics](#14-analytics)
15. [Reports & CSV Exports](#15-reports--csv-exports)
16. [User Management](#16-user-management)
17. [Payments](#17-payments)
18. [Notifications & Messaging](#18-notifications--messaging)
19. [Dashboard](#19-dashboard)
20. [Settings](#20-settings)
21. [Uploads](#21-uploads)
22. [Super Admin Module](#22-super-admin-module)
23. [System Statistics](#23-system-statistics)

---

## 1. Role Hierarchy & RBAC

### Roles
| Role | Level | Description |
|------|-------|-------------|
| `SUPER_ADMIN` | Highest | Full system access. Created via SQL only. |
| `ADMIN` | High | Manages platform operations |
| `REALTOR` | Standard | Sells properties, earns commissions |
| `CLIENT` | Standard | Purchases properties |

### Key Rules
- **SUPER_ADMIN inherits ALL ADMIN permissions** automatically via `RolesGuard`
- SUPER_ADMIN cannot be created through the API — only via direct SQL:
  ```sql
  UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'admin@4zeeproperties.online';
  ```
- Every request validates `isActive` status via JWT Strategy DB lookup
- Inactive users are rejected with `401 Unauthorized`

### Authorization Header
All admin endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

## 2. Authentication

### Admin-Specific Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/admin/create-user` | Create new user (any role) |
| `POST` | `/auth/admin/unlock-account/:userId` | Unlock a locked account |
| `POST` | `/auth/admin/force-reset-password/:userId` | Force password reset (emails user) |

#### Create User
```
POST /auth/admin/create-user
Body: { "email": "user@example.com", "role": "CLIENT" | "REALTOR" | "ADMIN" }
```
A temporary password is generated and emailed to the user.

---

## 3. KYC Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/kyc/pending` | List pending KYC requests |
| `GET` | `/admin/kyc/pending?status=PENDING\|APPROVED\|REJECTED` | Filter by status |
| `GET` | `/admin/kyc/statistics` | KYC statistics overview |
| `GET` | `/admin/kyc/clients/:clientId` | Client KYC details |
| `GET` | `/admin/kyc/realtors/:realtorId` | Realtor KYC details |
| `POST` | `/admin/kyc/documents/:documentId/verify` | Approve/reject KYC document |

#### Verify KYC Document
```
POST /admin/kyc/documents/:documentId/verify
Body: { "status": "APPROVED" | "REJECTED", "adminNotes": "Optional reason" }
```

#### KYC Statistics Response
```json
{
  "totalClients": 150,
  "totalRealtors": 45,
  "clientsByStatus": { "PENDING": 12, "APPROVED": 130, "REJECTED": 8 },
  "realtorsByStatus": { "PENDING": 5, "APPROVED": 38, "REJECTED": 2 },
  "pendingDocuments": 17,
  "submissionsLast24h": 4
}
```

---

## 4. Support Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/support-tickets` | List all tickets |
| `GET` | `/admin/support-tickets?status=OPEN\|IN_PROGRESS\|RESOLVED\|CLOSED` | Filter by status |
| `GET` | `/admin/support-tickets/:id` | Ticket detail with messages |
| `POST` | `/admin/support-tickets/:id/assign` | Assign to admin |
| `PATCH` | `/admin/support-tickets/:id/status` | Update ticket status |
| `GET` | `/admin/support-tickets/statistics` | Ticket statistics |

### Email Forwarding
When any user creates a support ticket, it is **automatically emailed** to:
- `support@atlanticcommercial.online`
- All admin/super-admin email addresses

---

## 5. Payouts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/payouts` | List all payouts |
| `GET` | `/admin/payouts?status=PENDING\|PROCESSING\|COMPLETED\|FAILED` | Filter by status |
| `GET` | `/admin/payouts/statistics` | Payout statistics |
| `GET` | `/admin/payouts/:id` | Payout details |
| `POST` | `/admin/payouts/:id/process` | Process payout (Paystack transfer) |

### Payout Statuses
- `PENDING` — Awaiting admin approval
- `PROCESSING` — Transfer initiated
- `COMPLETED` — Successfully transferred
- `FAILED` — Transfer failed

---

## 6. Activity Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/activity-logs` | List all activity logs (paginated) |
| `GET` | `/admin/activity-logs/recent` | Most recent activity |
| `GET` | `/admin/activity-logs/user/:userId` | User's activity history |
| `GET` | `/admin/activity-logs/entity/:entityType/:entityId` | Entity activity |
| `GET` | `/admin/activity-logs/statistics` | Activity statistics |
| `DELETE` | `/admin/activity-logs/cleanup?before=2025-01-01` | Clean up old logs |

---

## 7. Properties

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/properties` | List all properties (public) |
| `GET` | `/properties/search?q=lagos&type=LAND` | Search properties |
| `GET` | `/properties/featured` | Featured properties |
| `GET` | `/properties/:id` | Property detail |
| `POST` | `/admin/properties` | Create property |
| `PATCH` | `/admin/properties/:id` | Update property |
| `DELETE` | `/admin/properties/:id` | Delete property |

---

## 8. Applications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/applications` | List all applications |
| `GET` | `/admin/applications?status=PENDING\|APPROVED\|REJECTED` | Filter by status |
| `POST` | `/admin/applications/:id/approve` | Approve application |
| `POST` | `/admin/applications/:id/reject` | Reject application |

---

## 9. Sales

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/sales` | List all sales (filterable) |
| `GET` | `/admin/sales?realtorId=xxx&from=2026-01-01&to=2026-02-01` | Filter sales |
| `POST` | `/admin/sales/offline` | Record offline sale |

---

## 10. Payment Plans

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/payment-plans/templates` | List plan templates |
| `POST` | `/admin/payment-plans/templates` | Create template |
| `PATCH` | `/admin/payment-plans/templates/:id` | Update template |
| `DELETE` | `/admin/payment-plans/templates/:id` | Delete template |
| `GET` | `/admin/payment-plans/enrollments` | List all enrollments |
| `POST` | `/admin/payment-plans/enrollments` | Create enrollment |
| `POST` | `/admin/payment-plans/enrollments/:id/cancel` | Cancel enrollment |
| `GET` | `/admin/payment-plans/overdue` | List overdue installments |
| `POST` | `/admin/payment-plans/installments/:id/waive` | Waive late fee |
| `GET` | `/admin/payment-plans/statistics` | Payment plan statistics |

---

## 11. Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/documents/templates` | List document templates |
| `POST` | `/admin/documents/templates` | Create template |
| `PATCH` | `/admin/documents/templates/:id` | Update template |
| `DELETE` | `/admin/documents/templates/:id` | Delete template |
| `GET` | `/admin/documents` | List all documents |
| `POST` | `/admin/documents/generate` | Generate document |
| `GET` | `/admin/documents/statistics` | Document statistics |

---

## 12. Referrals

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/referrals` | List all referral links |
| `GET` | `/admin/referrals/statistics` | Referral statistics |

---

## 13. Commissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/commissions/settings` | Get commission rate settings |
| `PUT` | `/admin/commissions/settings` | Update commission rates |
| `GET` | `/admin/commissions` | List all commissions |
| `GET` | `/admin/commissions?status=PENDING\|APPROVED\|PAID\|CANCELLED` | Filter by status |
| `POST` | `/admin/commissions/bulk/approve` | Bulk approve commissions |
| `POST` | `/admin/commissions/bulk/paid` | Bulk mark as paid |
| `POST` | `/admin/commissions/bulk/cancel` | Bulk cancel |
| `GET` | `/admin/commissions/report/monthly` | Monthly commission report |
| `GET` | `/admin/commissions/report/realtor/:realtorId` | Realtor commission report |

### Commission Settings
```json
{
  "directSaleRate": 0.05,      // 5% direct sale commission
  "referralRate": 0.02,        // 2% referral commission
  "secondTierRate": 0.01,      // 1% second-tier referral
  "minPayoutAmount": 1000000   // Minimum payout in kobo (₦10,000)
}
```

---

## 14. Analytics ⭐ NEW

All analytics endpoints support **time period filtering**:

| Period | Description |
|--------|-------------|
| `24h` | Last 24 hours |
| `7d` | Last 7 days |
| `28d` | Last 28 days (default) |
| `3m` | Last 3 months |
| `9m` | Last 9 months |
| `1y` | Last 1 year |
| `all` | All time |

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/analytics/dashboard?period=28d` | **Comprehensive dashboard** (30+ metrics) |
| `GET` | `/admin/analytics/charts/revenue?period=28d` | Revenue time-series chart data |
| `GET` | `/admin/analytics/charts/user-growth?period=28d` | User growth chart data |
| `GET` | `/admin/analytics/charts/applications?period=28d` | Applications chart data |
| `GET` | `/admin/analytics/charts/commissions?period=28d` | Commissions chart data |
| `GET` | `/admin/analytics/properties` | Property analytics (type, availability, top viewed) |
| `GET` | `/admin/analytics/kyc` | KYC analytics (client/realtor status breakdown) |
| `GET` | `/admin/analytics/payouts?period=28d` | Payout analytics |
| `GET` | `/admin/analytics/top-realtors/:period` | Top realtors for a specific period |
| `GET` | `/admin/analytics/full?period=28d` | **ALL analytics in one call** |
| `GET` | `/admin/analytics/total-sales` | Total sales (all time, legacy) |
| `GET` | `/admin/analytics/sales?from=&to=` | Sales by date range (legacy) |
| `GET` | `/admin/analytics/top-realtors?metric=sales` | Top realtors simple (legacy) |

### Dashboard Response Structure
```json
{
  "period": "28d",
  "revenue": { "total": 150000000, "salesCount": 25, "salesToday": 2 },
  "applications": { "total": 80, "pending": 12, "approved": 55, "rejected": 13, "conversionRate": 68.75 },
  "payments": { "success": 60, "failed": 5, "pending": 8 },
  "commissions": {
    "pending": { "count": 10, "amount": 5000000 },
    "approved": { "count": 15, "amount": 7500000 },
    "paid": { "count": 30, "amount": 15000000 }
  },
  "users": { "total": 500, "new": 45, "clients": 350, "realtors": 120 },
  "properties": { "total": 80, "available": 55, "sold": 25 },
  "payouts": {
    "pending": { "count": 5, "amount": 2500000 },
    "processed": { "count": 20, "amount": 10000000 }
  },
  "kyc": { "pendingClients": 8, "pendingRealtors": 3, "totalPending": 11 },
  "supportTickets": { "open": 4 },
  "paymentPlans": { "activeEnrollments": 15, "overdueInstallments": 3 }
}
```

### Chart Data Response (Revenue Example)
```json
{
  "period": "28d",
  "interval": "day",
  "data": [
    { "date": "2026-02-01T00:00:00.000Z", "salesCount": 3, "revenue": 22500000 },
    { "date": "2026-02-02T00:00:00.000Z", "salesCount": 1, "revenue": 7500000 }
  ]
}
```

### Full Analytics (`/admin/analytics/full`)
Returns everything in a single call — ideal for initial page load:
```json
{
  "overview": { /* dashboard data */ },
  "charts": {
    "revenue": { /* revenue chart */ },
    "userGrowth": { /* user growth chart */ },
    "applications": { /* applications chart */ },
    "commissions": { /* commissions chart */ }
  },
  "topRealtors": [ /* ranked realtors */ ],
  "properties": { /* property analytics */ },
  "kyc": { /* KYC analytics */ },
  "payouts": { /* payout analytics */ }
}
```

---

## 15. Reports & CSV Exports ⭐ ENHANCED

### Report Views

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/reports/summary` | Executive summary |
| `GET` | `/admin/reports/sales` | Sales report |
| `GET` | `/admin/reports/applications` | Applications report |
| `GET` | `/admin/reports/commissions` | Commissions report |
| `GET` | `/admin/reports/payment-plans` | Payment plans report |
| `GET` | `/admin/reports/properties` | Properties report |
| `GET` | `/admin/reports/realtors` | Realtor performance report |

All accept `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` for filtering.

### CSV Downloads (9 types)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/reports/export/sales` | Download sales CSV |
| `GET` | `/admin/reports/export/commissions` | Download commissions CSV |
| `GET` | `/admin/reports/export/applications` | Download applications CSV |
| `GET` | `/admin/reports/export/realtors` | Download realtors CSV |
| `GET` | `/admin/reports/export/clients` | Download clients CSV |
| `GET` | `/admin/reports/export/payments` | Download payments CSV |
| `GET` | `/admin/reports/export/properties` | Download properties CSV |
| `GET` | `/admin/reports/export/payment-plans` | Download payment plans CSV |
| `GET` | `/admin/reports/export/payouts` | Download payouts CSV |

### Email Report Delivery (9 types) ⭐ NEW

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/reports/email/sales` | Email sales report to admin |
| `POST` | `/admin/reports/email/commissions` | Email commissions report |
| `POST` | `/admin/reports/email/applications` | Email applications report |
| `POST` | `/admin/reports/email/realtors` | Email realtors report |
| `POST` | `/admin/reports/email/clients` | Email clients report |
| `POST` | `/admin/reports/email/payments` | Email payments report |
| `POST` | `/admin/reports/email/properties` | Email properties report |
| `POST` | `/admin/reports/email/payouts` | Email payouts report |
| `POST` | `/admin/reports/email/payment-plans` | Email payment plans report |

All accept `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`. The CSV report is generated and sent as an HTML email with CSV content to the requesting admin's email address.

#### Email Report Response
```json
{
  "message": "Sales Report has been sent to admin@4zeeproperties.online",
  "rows": 42,
  "dateRange": "2026-01-01 to 2026-02-28"
}
```

---

## 16. User Management

### Auth Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/admin/create-user` | Create user with temp password |
| `POST` | `/auth/admin/unlock-account/:userId` | Unlock locked account |
| `POST` | `/auth/admin/force-reset-password/:userId` | Force password reset |

### Super Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/super-admin/users` | List all users (paginated) |
| `GET` | `/super-admin/realtors` | List all realtors |
| `GET` | `/super-admin/clients` | List all clients |
| `PATCH` | `/super-admin/users/:id/role` | Change user role |
| `PATCH` | `/super-admin/users/:id/activate` | Activate user |
| `PATCH` | `/super-admin/users/:id/deactivate` | Deactivate user (soft-disable) |
| `GET` | `/super-admin/system-stats` | Full system statistics |

---

## 17. Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/payments` | List all payments |
| `GET` | `/admin/payments?status=SUCCESS\|FAILED\|INITIATED` | Filter by status |
| `GET` | `/admin/payments/statistics` | Payment statistics |

---

## 18. Notifications & Messaging

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/admin/notifications/broadcast` | Broadcast notification to all users |

### Messaging

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/messaging/conversations` | List all conversations |
| `GET` | `/admin/messaging/conversations/:id` | Read any conversation |
| `GET` | `/admin/messaging/statistics` | Messaging statistics |

---

## 19. Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/dashboard` | Admin dashboard overview |

---

## 20. Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/settings` | Get all system settings |
| `PUT` | `/admin/settings` | Update system settings |
| `GET` | `/admin/settings/features` | Get feature flags |
| `PUT` | `/admin/settings/features` | Update feature flags |
| `POST` | `/admin/settings/maintenance` | Toggle maintenance mode |
| `GET` | `/admin/settings/commission-rates` | Get commission rates |
| `PUT` | `/admin/settings/commission-rates` | Update commission rates |

---

## 21. Uploads

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/uploads` | List all uploaded files |
| `GET` | `/admin/uploads/statistics` | Storage statistics |

---

## 22. Super Admin Module

> **SUPER_ADMIN only** — these endpoints require `SUPER_ADMIN` role specifically.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/super-admin/users` | List all users with pagination |
| `GET` | `/super-admin/realtors` | List all realtors with details |
| `GET` | `/super-admin/clients` | List all clients with details |
| `PATCH` | `/super-admin/users/:id/role` | Change a user's role |
| `PATCH` | `/super-admin/users/:id/activate` | Re-activate a disabled user |
| `PATCH` | `/super-admin/users/:id/deactivate` | Soft-disable a user |
| `GET` | `/super-admin/system-stats` | Full system statistics |

---

## 23. System Statistics

**Endpoint:** `GET /super-admin/system-stats`

Returns comprehensive system-wide statistics:

```json
{
  "users": { "total": 500, "active": 485, "inactive": 15, "admins": 3, "realtors": 120, "clients": 377 },
  "properties": { "total": 80, "available": 55, "sold": 25 },
  "applications": { "total": 200, "pending": 25, "approved": 160, "rejected": 15 },
  "sales": { "total": 100, "totalRevenue": 750000000 },
  "commissions": { "pending": 5000000, "paid": 15000000 },
  "payouts": { "pending": 2500000, "processed": 10000000 },
  "kyc": { "pendingClients": 8, "pendingRealtors": 3 }
}
```

---

## Quick Start for Frontend

### 1. On Admin Login — Load Initial Data
```
GET /admin/analytics/full?period=28d       → All analytics + charts
GET /admin/kyc/statistics                   → KYC overview
GET /admin/support-tickets/statistics       → Ticket overview
```

### 2. Dashboard Page
```
GET /admin/analytics/dashboard?period=28d   → KPI cards
GET /admin/analytics/charts/revenue?period=28d  → Revenue chart
GET /admin/analytics/charts/user-growth?period=28d → User growth chart
```

### 3. Period Selector (Dropdown)
When user switches period, re-fetch:
```
GET /admin/analytics/dashboard?period=7d
GET /admin/analytics/charts/revenue?period=7d
GET /admin/analytics/top-realtors/7d
```

### 4. Reports Download
```
GET /admin/reports/export/sales?startDate=2026-01-01&endDate=2026-02-28
→ Returns CSV file download

POST /admin/reports/email/sales?startDate=2026-01-01&endDate=2026-02-28
→ Emails CSV to the admin
```

### 5. All Response Format
Every response is wrapped in:
```json
{
  "success": true,
  "data": { /* actual response */ },
  "timestamp": "2026-02-15T12:00:00.000Z",
  "path": "/admin/analytics/dashboard"
}
```

---

## Total Endpoint Count

| Category | Count |
|----------|-------|
| Analytics | 13 endpoints |
| Reports & Exports | 25 endpoints |
| KYC | 6 endpoints |
| Support Tickets | 6 endpoints |
| Payouts | 4 endpoints |
| Activity Logs | 6 endpoints |
| Properties | 7 endpoints |
| Applications | 4 endpoints |
| Sales | 3 endpoints |
| Payment Plans | 10 endpoints |
| Documents | 7 endpoints |
| Referrals | 2 endpoints |
| Commissions | 9 endpoints |
| User Management | 10 endpoints |
| Payments | 3 endpoints |
| Notifications & Messaging | 4 endpoints |
| Dashboard | 1 endpoint |
| Settings | 7 endpoints |
| Uploads | 2 endpoints |
| **Total** | **~122 admin endpoints** |
