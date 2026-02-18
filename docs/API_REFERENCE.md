# 4Zee Properties - Complete API Reference

**Base URL:** `https://api.4zeeproperties.com`  
**API Version:** 1.0.0  
**Last Updated:** February 18, 2026

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Properties](#properties)
4. [Applications](#applications)
5. [Payments](#payments)
6. [Payment Plans](#payment-plans)
7. [Documents](#documents)
8. [KYC (Know Your Customer)](#kyc-know-your-customer)
9. [Bank Accounts](#bank-accounts)
10. [Commissions](#commissions)
11. [Payouts](#payouts)
12. [Referrals](#referrals)
13. [Notifications](#notifications)
14. [Messaging](#messaging)
15. [Support Tickets](#support-tickets)
16. [Dashboard](#dashboard)
17. [Clients](#clients)
18. [Realtors](#realtors)
19. [Admin Endpoints](#admin-endpoints)
20. [Uploads](#uploads)
21. [Settings](#settings)
22. [Reports](#reports)
23. [Activity Logs](#activity-logs)
24. [Analytics](#analytics)
25. [Enums Reference](#enums-reference)
26. [Error Codes](#error-codes)

---

## Overview

### Response Format

All API responses follow this standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-02-18T10:30:00.000Z",
    "version": "1.0.0",
    "pagination": {
      "limit": 20,
      "hasNext": true,
      "hasPrev": false,
      "nextCursor": "cursor_xyz",
      "total": 100
    }
  }
}
```

### Required Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | `application/json` |
| `Authorization` | For protected routes | `Bearer <accessToken>` |
| `X-Request-Id` | Recommended | UUID for request tracing |
| `X-Device-Id` | Recommended | Unique device identifier |
| `Idempotency-Key` | For POST/PUT/PATCH | UUID to prevent duplicate operations |

### Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Login/Register | 5 | 60 seconds |
| Forgot Password | 3 | 1 hour |
| General API | 100 | 60 seconds |
| Token Refresh | 10 | 60 seconds |

---

## Authentication

### POST /auth/register

Register a new user account.

**Authentication:** None  
**Rate Limit:** 5 requests per 60 seconds

**Request Body:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `email` | string | Yes | Valid email format | User's email address |
| `password` | string | Yes | Min 8 characters | Account password |
| `role` | enum | Yes | `CLIENT` or `REALTOR` | User role (ADMIN cannot self-register) |
| `referralCode` | string | No | Valid referral code | Recruiter's referral code (REALTOR only) |
| `dob` | string | No | ISO date (YYYY-MM-DD) | Date of birth (REALTOR only) |

**Example Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "CLIENT"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "rt_abc123def456...",
    "expiresIn": 900,
    "refreshExpiresIn": 2592000,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "role": "CLIENT",
      "emailVerified": false
    }
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_FAILED` | Invalid input data |
| 409 | `RESOURCE_ALREADY_EXISTS` | Email already registered |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |

---

### POST /auth/login

Authenticate user and receive tokens.

**Authentication:** None  
**Rate Limit:** 5 requests per 60 seconds

**Request Body:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `email` | string | Yes | Valid email | Registered email |
| `password` | string | Yes | Min 8 characters | Account password |

**Example Request:**
```json
{
  "email": "admin@4zee.com",
  "password": "Admin123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "rt_abc123def456...",
    "expiresIn": 900,
    "refreshExpiresIn": 2592000,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@4zee.com",
      "role": "ADMIN"
    }
  }
}
```

**2FA Required Response (200):**
```json
{
  "success": true,
  "data": {
    "requires2FA": true,
    "email": "admin@4zee.com",
    "message": "Please enter your 2FA code"
  }
}
```

**Force Password Change Response (200):**
```json
{
  "success": true,
  "data": {
    "requiresPasswordChange": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "message": "You must change your password"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `AUTH_INVALID_CREDENTIALS` | Invalid email or password |
| 423 | `AUTH_ACCOUNT_LOCKED` | Account locked due to failed attempts |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many login attempts |

---

### POST /auth/refresh

Refresh access token using refresh token.

**Authentication:** None  
**Rate Limit:** 10 requests per 60 seconds

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refreshToken` | string | Yes | Valid refresh token |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "rt_new_token...",
    "expiresIn": 900,
    "refreshExpiresIn": 2592000,
    "user": { ... }
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 401 | `AUTH_REFRESH_TOKEN_EXPIRED` | Refresh token expired |
| 401 | `AUTH_REFRESH_TOKEN_INVALID` | Invalid or revoked token |
| 401 | `AUTH_REFRESH_TOKEN_REUSED` | Token reuse detected (security) |

---

### POST /auth/logout

Logout and revoke tokens.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refreshToken` | string | No | Specific token to revoke |
| `logoutAll` | boolean | No | Set `true` to logout all devices |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### GET /auth/me

Get current authenticated user profile.

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "client@4zee.com",
    "role": "CLIENT",
    "emailVerified": true,
    "twoFactorEnabled": false,
    "createdAt": "2026-01-15T10:00:00.000Z",
    "client": {
      "id": "client-uuid",
      "phone": "+2348012345678",
      "address": "123 Victoria Island, Lagos",
      "dateOfBirth": "1990-05-15"
    }
  }
}
```

---

### GET /auth/sessions

List active login sessions.

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "session-uuid",
      "deviceId": "device-abc123",
      "deviceName": "iPhone 15 Pro",
      "lastActiveAt": "2026-02-18T10:30:00.000Z",
      "createdAt": "2026-02-15T08:00:00.000Z",
      "isCurrent": true
    }
  ]
}
```

---

### POST /auth/sessions/revoke

Revoke a specific device session.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `deviceId` | string | Yes | Device ID to revoke |

---

### POST /auth/forgot-password

Request password reset email.

**Authentication:** None  
**Rate Limit:** 3 requests per hour

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Registered email address |

**Note:** Always returns success to prevent email enumeration.

---

### POST /auth/reset-password

Reset password using token from email.

**Authentication:** None

**Request Body:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `token` | string | Yes | Valid reset token | Token from email link |
| `newPassword` | string | Yes | Min 8 characters | New password |

---

### PATCH /auth/change-password

Change password for authenticated user.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `currentPassword` | string | Yes | - | Current password |
| `newPassword` | string | Yes | Min 8 characters | New password |

---

### POST /auth/verify-email

Verify email address with token.

**Authentication:** None

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | string | Yes | Email verification token |

---

### POST /auth/resend-verification

Resend verification email.

**Authentication:** Required (Bearer Token)

---

### POST /auth/otp/send

Send OTP to user's email.

**Authentication:** None

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email address |

---

### POST /auth/otp/verify

Verify OTP code.

**Authentication:** None

**Request Body:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `email` | string | Yes | Valid email | User's email |
| `otp` | string | Yes | Exactly 6 digits | OTP code from email |

---

### GET /auth/otp/status

Check if OTP is required for email.

**Authentication:** None

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Email to check |

---

### POST /auth/2fa/setup

Initialize 2FA setup.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `password` | string | Yes | Current password for verification |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,..."
  }
}
```

---

### POST /auth/2fa/verify-setup

Complete 2FA setup with TOTP code.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `token` | string | Yes | Exactly 6 digits | TOTP code from authenticator |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "2FA enabled successfully",
    "backupCodes": ["ABC123", "DEF456", "GHI789", ...]
  }
}
```

---

### POST /auth/2fa/verify-login

Verify 2FA code during login.

**Authentication:** None

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User's email |
| `token` | string | Yes | 6-digit TOTP or backup code |
| `isBackupCode` | boolean | No | Set `true` if using backup code |

---

### POST /auth/2fa/disable

Disable 2FA.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `password` | string | Yes | Current password |
| `token` | string | Yes | 6-digit TOTP code |

---

### POST /auth/2fa/regenerate-backup-codes

Generate new backup codes.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `password` | string | Yes | Current password |
| `token` | string | Yes | 6-digit TOTP code |

---

### POST /auth/force-change-password

Change password when required (admin-created accounts).

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `currentPassword` | string | Yes | - | Temporary password |
| `newPassword` | string | Yes | Min 8, uppercase, lowercase, number | New password |
| `confirmPassword` | string | Yes | Must match newPassword | Confirm password |

---

## Properties

### GET /properties

List all properties (public).

**Authentication:** None

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Items per page (max 100) |
| `cursor` | string | - | Cursor for pagination |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "3 Bedroom Duplex with BQ",
      "description": "Beautiful duplex in serene environment...",
      "location": "Lekki Phase 1, Lagos",
      "address": "123 Admiralty Way",
      "city": "Lagos",
      "state": "Lagos State",
      "price": 75000000,
      "type": "HOUSE",
      "size": 500,
      "bedrooms": 3,
      "bathrooms": 4,
      "amenities": ["Swimming Pool", "Gym", "Security"],
      "features": { "Year Built": 2020, "Parking Spaces": 2 },
      "mediaUrls": ["https://example.com/image1.jpg"],
      "availability": "AVAILABLE",
      "isFeatured": true,
      "viewCount": 150,
      "createdAt": "2026-01-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "limit": 20,
      "hasNext": true,
      "nextCursor": "cursor_abc123"
    }
  }
}
```

---

### GET /properties/search

Search properties with filters.

**Authentication:** None

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search in title/description |
| `type` | enum | `LAND`, `HOUSE`, `APARTMENT`, `COMMERCIAL`, `INDUSTRIAL`, `MIXED_USE` |
| `availability` | enum | `AVAILABLE`, `RESERVED`, `SOLD` |
| `city` | string | Filter by city |
| `state` | string | Filter by state |
| `minPrice` | integer | Minimum price (Naira) |
| `maxPrice` | integer | Maximum price (Naira) |
| `minBedrooms` | integer | Minimum bedrooms |
| `maxBedrooms` | integer | Maximum bedrooms |
| `minSize` | integer | Minimum size (sqm) |
| `maxSize` | integer | Maximum size (sqm) |
| `featured` | boolean | Only featured properties |
| `sortBy` | string | `price`, `createdAt`, `viewCount` |
| `sortOrder` | string | `asc`, `desc` |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20, max: 100) |
| `cursor` | string | Cursor for pagination |

---

### GET /properties/featured

Get featured properties.

**Authentication:** None

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | Max properties to return |

---

### GET /properties/popular

Get popular properties by view count.

**Authentication:** None

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 10 | Max properties to return |

---

### GET /properties/:id

Get property details.

**Authentication:** None

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Property ID |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "3 Bedroom Duplex with BQ",
    "description": "Beautiful duplex...",
    "location": "Lekki Phase 1, Lagos",
    "price": 75000000,
    "type": "HOUSE",
    "availability": "AVAILABLE",
    "mediaUrls": [...],
    "amenities": [...],
    "features": {...},
    "createdAt": "2026-01-15T10:00:00.000Z",
    "updatedAt": "2026-02-10T14:30:00.000Z"
  }
}
```

---

### GET /properties/favorites

Get user's favorite properties.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

---

### POST /properties/favorites/:propertyId

Add property to favorites.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `propertyId` | string (UUID) | Property ID to favorite |

---

### DELETE /properties/favorites/:propertyId

Remove property from favorites.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

---

### GET /properties/favorites/:propertyId/check

Check if property is in favorites.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

---

## Applications

### POST /applications

Create property application.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT  
**Idempotency:** Required

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `propertyId` | string (UUID) | Yes | Property to apply for |
| `realtorId` | string (UUID) | No | Referring realtor |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "app-uuid",
    "status": "PENDING",
    "paymentStatus": "UNPAID",
    "property": {
      "id": "prop-uuid",
      "title": "3 Bedroom Duplex",
      "price": 75000000
    },
    "createdAt": "2026-02-18T10:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `APPLICATION_EXISTS` | Already applied for this property |
| 400 | `PROPERTY_NOT_AVAILABLE` | Property is sold or reserved |
| 404 | `PROPERTY_NOT_FOUND` | Property doesn't exist |

---

### GET /applications/me

Get my applications (client).

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | enum | Filter by status |
| `limit` | integer | Items per page |
| `cursor` | string | Pagination cursor |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "app-uuid",
      "status": "APPROVED",
      "paymentStatus": "UNPAID",
      "property": {
        "id": "prop-uuid",
        "title": "3 Bedroom Duplex",
        "price": 75000000,
        "location": "Lekki, Lagos"
      },
      "createdAt": "2026-02-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "pagination": { ... }
  }
}
```

---

### GET /applications/:id

Get application details.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT, REALTOR, ADMIN

---

## Payments

### POST /payments/initiate

Initiate payment for approved application.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT  
**Idempotency:** Required

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `applicationId` | string (UUID) | Yes | Approved application ID |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "authorization_url": "https://checkout.paystack.com/abc123",
    "access_code": "abc123xyz",
    "reference": "PAY-1708234567-abc123"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `PAYMENT_ALREADY_PENDING` | Payment already in progress |
| 400 | `PAYMENT_ALREADY_COMPLETED` | Application already paid |
| 400 | `APPLICATION_NOT_APPROVED` | Application must be approved first |
| 400 | `PROPERTY_NOT_AVAILABLE` | Property is no longer available |

---

### GET /payments/:reference

Get payment details by reference.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT (own), ADMIN (any)

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `reference` | string | Payment reference |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "payment-uuid",
    "reference": "PAY-1708234567-abc123",
    "amount": 7500000000,
    "status": "SUCCESS",
    "channel": "card",
    "paidAt": "2026-02-18T10:30:00.000Z",
    "application": {
      "id": "app-uuid",
      "property": {
        "title": "3 Bedroom Duplex",
        "price": 75000000
      }
    }
  }
}
```

---

### GET /payments/:reference/status

Poll payment status (lightweight endpoint for mobile).

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "reference": "PAY-1708234567-abc123",
    "status": "SUCCESS",
    "paidAt": "2026-02-18T10:30:00.000Z"
  }
}
```

---

## Payment Plans

### GET /payment-plans/templates

List available payment plan templates.

**Authentication:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "template-uuid",
      "name": "6-Month Installment Plan",
      "description": "Pay over 6 months with 30% down payment",
      "durationMonths": 6,
      "downPaymentPct": 0.3,
      "interestRate": 0,
      "lateFeeAmount": 500000,
      "lateFeePercent": 0.02,
      "gracePeriodDays": 3,
      "isActive": true
    }
  ]
}
```

---

### GET /payment-plans/templates/:id

Get payment plan template details.

**Authentication:** None

---

### POST /payment-plans/enroll

Enroll in a payment plan.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `applicationId` | string (UUID) | Yes | Application ID |
| `templateId` | string (UUID) | Yes | Payment plan template ID |
| `startDate` | string (ISO date) | No | Start date (defaults to today) |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "enrollment-uuid",
    "status": "ACTIVE",
    "totalAmount": 75000000,
    "downPayment": 22500000,
    "monthlyAmount": 8750000,
    "startDate": "2026-02-01",
    "endDate": "2026-08-01",
    "installments": [
      {
        "id": "inst-1",
        "dueDate": "2026-02-01",
        "amount": 22500000,
        "status": "PENDING",
        "isDownPayment": true
      },
      {
        "id": "inst-2",
        "dueDate": "2026-03-01",
        "amount": 8750000,
        "status": "PENDING"
      }
    ]
  }
}
```

---

### GET /payment-plans/my-enrollments

Get my payment plan enrollments.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

---

### GET /payment-plans/my-upcoming

Get upcoming installments.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

---

### GET /payment-plans/enrollments/:id

Get enrollment details.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT (own), ADMIN (any)

---

### GET /payment-plans/applications/:applicationId/schedule

Get payment schedule for application.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT, ADMIN

---

## Documents

### GET /documents/my-documents

Get my documents.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-uuid",
      "type": "ALLOCATION_LETTER",
      "status": "GENERATED",
      "fileName": "allocation_letter_prop123.pdf",
      "fileUrl": "https://storage.example.com/docs/...",
      "application": {
        "id": "app-uuid",
        "property": { "title": "3 Bedroom Duplex" }
      },
      "createdAt": "2026-02-18T10:00:00.000Z"
    }
  ]
}
```

---

### GET /documents/:id/download

Download document.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT, REALTOR, ADMIN

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string (UUID) | Document ID |

---

### PATCH /documents/:id/sign

Sign a document.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `signedByName` | string | Yes | Full legal name |
| `signatureImage` | string | No | Base64 signature image |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "doc-uuid",
    "status": "SIGNED",
    "signedAt": "2026-02-18T10:30:00.000Z",
    "signedByName": "John Adewale Okonkwo"
  }
}
```

---

### GET /documents/applications/:applicationId

Get documents for an application.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT, ADMIN

---

## KYC (Know Your Customer)

### GET /kyc/status

Get KYC verification status.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "PENDING",
    "info": {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+2348012345678",
      "address": "123 Victoria Island",
      "dateOfBirth": "1990-05-15"
    },
    "documents": [
      {
        "id": "doc-uuid",
        "type": "NATIONAL_ID",
        "status": "PENDING",
        "fileName": "national_id.pdf",
        "submittedAt": "2026-02-18T10:00:00.000Z"
      }
    ]
  }
}
```

---

### PUT /kyc/info

Update KYC personal information.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT  
**Idempotency:** Required

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | No | First name |
| `lastName` | string | No | Last name |
| `phone` | string | No | Phone number (+234...) |
| `address` | string | No | Residential address |
| `dateOfBirth` | string (ISO date) | No | Date of birth |

---

### POST /kyc/documents

Submit KYC document.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | enum | Yes | Document type (see enum below) |
| `fileUrl` | string | Yes | URL of uploaded document |
| `fileName` | string | Yes | Original file name |
| `expiryDate` | string (ISO date) | No | Document expiry date |

**KYC Document Types:**
- `NATIONAL_ID`
- `DRIVERS_LICENSE`
- `PASSPORT`
- `VOTERS_CARD`
- `NIN`
- `UTILITY_BILL`
- `BANK_STATEMENT`

---

### DELETE /kyc/documents/:id

Delete unverified KYC document.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

---

## Bank Accounts

### GET /bank-accounts/banks

List Nigerian banks from Paystack.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    { "name": "Access Bank", "code": "044" },
    { "name": "GTBank", "code": "058" },
    { "name": "First Bank", "code": "011" }
  ]
}
```

---

### POST /bank-accounts/verify

Verify bank account before adding.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

**Request Body:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `accountNumber` | string | Yes | Exactly 10 digits | Bank account number |
| `bankCode` | string | Yes | Valid bank code | Bank code from /banks endpoint |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "account_number": "0123456789",
    "account_name": "JOHN DOE",
    "bank_id": 9
  }
}
```

---

### POST /bank-accounts

Add a new bank account.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR  
**Idempotency:** Required

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountName` | string | Yes | Account holder name |
| `accountNumber` | string | Yes | 10-digit account number |
| `bankCode` | string | Yes | Bank code |
| `bankName` | string | Yes | Bank name |
| `isDefault` | boolean | No | Set as default (default: false) |

---

### GET /bank-accounts

List my bank accounts.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

---

### GET /bank-accounts/default

Get default bank account.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

---

### GET /bank-accounts/:id

Get bank account by ID.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

---

### PUT /bank-accounts/:id

Update bank account.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `accountName` | string | No | Updated account name |
| `isDefault` | boolean | No | Set as default |

---

### PUT /bank-accounts/:id/set-default

Set bank account as default.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

---

### DELETE /bank-accounts/:id

Delete bank account.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

---

## Commissions

### GET /commissions/my-commissions

Get my commissions (realtor).

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | enum | Filter by status |
| `type` | enum | `DIRECT` or `REFERRAL` |
| `limit` | integer | Items per page |
| `cursor` | string | Pagination cursor |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "comm-uuid",
      "type": "DIRECT",
      "status": "APPROVED",
      "amount": 3750000,
      "rate": 0.05,
      "sale": {
        "id": "sale-uuid",
        "amount": 75000000,
        "property": { "title": "3 Bedroom Duplex" }
      },
      "createdAt": "2026-02-15T10:00:00.000Z"
    }
  ]
}
```

---

### GET /commissions/my-summary

Get commission summary (realtor).

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalEarned": 15000000,
    "pendingApproval": 3750000,
    "approved": 7500000,
    "paid": 3750000,
    "availableForPayout": 7500000,
    "directCommissions": 10000000,
    "referralCommissions": 5000000
  }
}
```

---

### GET /commissions/:id

Get commission details.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR, ADMIN

---

## Payouts

### GET /payouts/balance

Get available balance for payout.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "availableBalance": 7500000,
    "pendingPayouts": 2000000,
    "totalPaidOut": 5000000
  }
}
```

---

### GET /payouts/summary

Get payout summary.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

---

### POST /payouts/request

Request a payout.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR  
**Idempotency:** Required

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `amount` | number | Yes | Amount in Naira (positive) |
| `bankAccountId` | string (UUID) | No | Bank account (uses default if not provided) |
| `notes` | string | No | Notes for request |

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "payout-uuid",
    "amount": 5000000,
    "status": "PENDING",
    "bankAccount": {
      "bankName": "GTBank",
      "accountNumber": "****6789"
    },
    "createdAt": "2026-02-18T10:00:00.000Z"
  }
}
```

**Error Responses:**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INSUFFICIENT_BALANCE` | Not enough available balance |
| 400 | `NO_BANK_ACCOUNT` | No bank account configured |

---

### GET /payouts/history

Get payout history.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

---

### PUT /payouts/:id/cancel

Cancel pending payout request.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

---

## Referrals

### GET /referrals

Get my referral links (realtor).

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

---

### GET /referrals/stats

Get referral statistics.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalLinks": 5,
    "totalVisits": 150,
    "totalConversions": 12,
    "conversionRate": 0.08,
    "referralEarnings": 2500000
  }
}
```

---

### POST /referrals

Create referral link.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Campaign name |
| `description` | string | No | Campaign description |
| `targetUrl` | string (URL) | No | Target URL |
| `propertyId` | string (UUID) | No | Related property |
| `expiresAt` | string (ISO date) | No | Link expiration |

---

### GET /referrals/:id

Get referral link details.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

---

### PUT /referrals/:id

Update referral link.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

---

### DELETE /referrals/:id

Delete referral link.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

---

### POST /referrals/track

Track referral visit (public).

**Authentication:** None

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | Referral code from URL |
| `ipAddress` | string | No | Visitor IP |
| `userAgent` | string | No | User agent |
| `referrer` | string | No | Referrer URL |

---

### POST /referrals/convert

Record referral conversion.

**Authentication:** None

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | Yes | Referral code |
| `convertedUserId` | string (UUID) | No | Converted user ID |
| `conversionType` | string | No | Type: signup, application, sale |

---

## Notifications

### GET /notifications

Get my notifications.

**Authentication:** Required (Bearer Token)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `unreadOnly` | boolean | Filter unread only |
| `type` | enum | Filter by notification type |
| `limit` | integer | Items per page |
| `cursor` | string | Pagination cursor |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-uuid",
      "type": "PAYMENT_RECEIVED",
      "title": "Payment Confirmed",
      "message": "Your payment of ₦75,000,000 has been confirmed",
      "data": { "paymentId": "payment-uuid" },
      "isRead": false,
      "createdAt": "2026-02-18T10:00:00.000Z"
    }
  ]
}
```

---

### GET /notifications/unread-count

Get unread notification count.

**Authentication:** Required (Bearer Token)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### PATCH /notifications/:id/read

Mark notification as read.

**Authentication:** Required (Bearer Token)

---

### PATCH /notifications/read-all

Mark all notifications as read.

**Authentication:** Required (Bearer Token)

---

### DELETE /notifications/:id

Delete notification.

**Authentication:** Required (Bearer Token)

---

### GET /notifications/preferences

Get notification preferences.

**Authentication:** Required (Bearer Token)

---

### PATCH /notifications/preferences

Update notification preferences.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `emailNotifications` | boolean | No | Enable email notifications |
| `saleNotifications` | boolean | No | Enable sale notifications |
| `commissionNotifications` | boolean | No | Enable commission notifications |
| `applicationNotifications` | boolean | No | Enable application notifications |
| `paymentNotifications` | boolean | No | Enable payment notifications |
| `marketingEmails` | boolean | No | Enable marketing emails |

---

### POST /notifications/device

Register device for push notifications.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `deviceId` | string | Yes | Unique device identifier |
| `pushToken` | string | Yes | FCM or APNs token |
| `platform` | enum | Yes | `ios`, `android`, `web` |
| `deviceName` | string | No | Device name (e.g., "iPhone 15 Pro") |
| `appVersion` | string | No | App version |

---

### PATCH /notifications/device/:deviceId

Update push token.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pushToken` | string | Yes | New push token |

---

### DELETE /notifications/device/:deviceId

Unregister device.

**Authentication:** Required (Bearer Token)

---

### GET /notifications/devices

List registered devices.

**Authentication:** Required (Bearer Token)

---

## Messaging

### GET /messaging/unread-count

Get unread message count.

**Authentication:** Required (Bearer Token)

---

### GET /messaging/conversations

Get my conversations.

**Authentication:** Required (Bearer Token)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `propertyId` | string (UUID) | Filter by property |
| `unreadOnly` | boolean | Filter unread only |

---

### GET /messaging/conversations/:id

Get conversation with messages.

**Authentication:** Required (Bearer Token)

---

### POST /messaging/conversations

Start a new conversation.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipientId` | string (UUID) | Yes | Recipient user ID |
| `message` | string | Yes | Initial message |
| `propertyId` | string (UUID) | No | Related property |
| `subject` | string | No | Conversation subject |

---

### POST /messaging/conversations/:id/messages

Send message in conversation.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | Message content |
| `type` | enum | No | `INQUIRY`, `RESPONSE`, `SYSTEM` |
| `attachmentUrl` | string | No | Attachment URL |

---

### POST /messaging/inquiries

Send property inquiry (starts conversation with realtor).

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `propertyId` | string (UUID) | Yes | Property ID |
| `message` | string | Yes | Inquiry message |
| `phone` | string | No | Phone for callback |

---

## Support Tickets

### POST /support-tickets

Create support ticket.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subject` | string | Yes | Ticket subject |
| `description` | string | Yes | Issue description |
| `category` | string | No | Category: payment, property, technical, general |
| `priority` | enum | No | `LOW`, `MEDIUM`, `HIGH`, `URGENT` (default: MEDIUM) |

---

### GET /support-tickets

Get my tickets.

**Authentication:** Required (Bearer Token)

---

### GET /support-tickets/:id

Get ticket details.

**Authentication:** Required (Bearer Token)

---

### POST /support-tickets/:id/messages

Add message to ticket.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Message content |
| `attachmentUrls` | string[] | No | Attachment URLs |

---

## Dashboard

### GET /dashboard/quick-stats

Get quick stats for current user.

**Authentication:** Required (Bearer Token)

---

### GET /dashboard/client

Get client dashboard data.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "applications": {
      "total": 3,
      "pending": 1,
      "approved": 1,
      "rejected": 1
    },
    "payments": {
      "totalPaid": 75000000,
      "pending": 0
    },
    "recentApplications": [...],
    "favoriteProperties": [...]
  }
}
```

---

### GET /dashboard/realtor

Get realtor dashboard data.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "sales": {
      "total": 10,
      "thisMonth": 2,
      "totalValue": 500000000
    },
    "commissions": {
      "totalEarned": 25000000,
      "pending": 5000000,
      "available": 15000000
    },
    "recruits": {
      "total": 5,
      "active": 4
    },
    "referrals": {
      "totalVisits": 200,
      "conversions": 15
    },
    "recentSales": [...]
  }
}
```

---

### GET /dashboard/admin

Get admin dashboard data.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

---

## Clients

### GET /clients/me

Get my client profile.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

---

### PATCH /clients/me

Update my client profile.

**Authentication:** Required (Bearer Token)  
**Role:** CLIENT

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phone` | string | No | Phone number (+234...) |
| `address` | string | No | Residential address |

---

## Realtors

### GET /realtors/me/dashboard

Get realtor dashboard.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

---

### GET /realtors/me/recruits

Get my recruited realtors.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

---

### GET /realtors/me/sales

Get my sales.

**Authentication:** Required (Bearer Token)  
**Role:** REALTOR

---

## Admin Endpoints

### POST /admin/auth/create-user

Create user with temporary password.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | User email |
| `role` | enum | Yes | `ADMIN`, `SUPER_ADMIN`, `REALTOR`, `CLIENT` |
| `dob` | string (ISO date) | No | Date of birth (required for REALTOR) |
| `referralCode` | string | No | Recruiter's referral code |

---

### PATCH /admin/auth/unlock/:userId

Unlock locked user account.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

---

### GET /admin/applications

List all applications.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | enum | Filter by status |
| `clientId` | string (UUID) | Filter by client |
| `propertyId` | string (UUID) | Filter by property |
| `limit` | integer | Items per page |
| `cursor` | string | Pagination cursor |

---

### PATCH /admin/applications/:id/approve

Approve application.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### PATCH /admin/applications/:id/reject

Reject application.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | No | Rejection reason |

---

### POST /admin/properties

Create property.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Property title |
| `description` | string | No | Description |
| `location` | string | Yes | Location |
| `address` | string | No | Street address |
| `city` | string | No | City |
| `state` | string | No | State |
| `price` | integer | Yes | Price in Naira |
| `type` | enum | No | Property type |
| `size` | number | No | Size in sqm |
| `bedrooms` | integer | No | Bedroom count |
| `bathrooms` | integer | No | Bathroom count |
| `amenities` | string[] | No | Amenities list |
| `features` | object | No | Additional features |
| `mediaUrls` | string[] | Yes | Image/video URLs |
| `isFeatured` | boolean | No | Mark as featured |

---

### PATCH /admin/properties/:id

Update property.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### DELETE /admin/properties/:id

Delete property.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### POST /admin/sales/offline

Record offline sale.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN  
**Idempotency:** Required

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `propertyId` | string (UUID) | Yes | Property ID |
| `clientId` | string (UUID) | Yes | Client ID |
| `realtorId` | string (UUID) | No | Realtor ID (for commission) |
| `amount` | integer | Yes | Sale amount in kobo |

---

### GET /admin/sales

List all sales.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /admin/commissions

List all commissions.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /admin/commissions/settings

Get commission settings.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### PATCH /admin/commissions/settings

Update commission settings.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

**Request Body:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `directRate` | number | No | 0.0 - 1.0 | Direct commission rate |
| `referralRate` | number | No | 0.0 - 1.0 | Referral commission rate |

---

### POST /admin/commissions/approve

Bulk approve commissions.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `commissionIds` | string[] (UUIDs) | Yes | Commission IDs to approve |

---

### POST /admin/commissions/mark-paid

Mark commissions as paid.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### POST /admin/commissions/cancel

Cancel commissions.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /admin/commissions/reports/monthly/:year/:month

Get monthly commission report.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /admin/commissions/reports/realtor/:realtorId

Get realtor commission summary.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /admin/payouts

List all payouts.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | enum | Filter by status |
| `realtorId` | string (UUID) | Filter by realtor |
| `startDate` | string | Start date filter |
| `endDate` | string | End date filter |

---

### GET /admin/payouts/statistics

Get payout statistics.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

---

### GET /admin/payouts/:id

Get payout details.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

---

### POST /admin/payouts/:id/process

Process payout (approve/reject).

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN  
**Idempotency:** Required

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `approved` | boolean | Yes | Approve or reject |
| `rejectionReason` | string | No | Required if rejected |

---

### POST /admin/payouts

Create payout for realtor.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN  
**Idempotency:** Required

---

### GET /admin/kyc/pending

List pending KYC verifications.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | enum | Filter by status |

---

### GET /admin/kyc/statistics

Get KYC statistics.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

---

### GET /admin/kyc/clients/:clientId

Get client KYC details.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

---

### POST /admin/kyc/documents/:documentId/verify

Verify KYC document.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `documentId` | string (UUID) | Yes | Document to verify |
| `approved` | boolean | Yes | Approve or reject |
| `rejectionReason` | string | No | Required if rejected |

---

### GET /admin/documents

List all documents.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | enum | Filter by document type |
| `status` | enum | Filter by status |

---

### GET /admin/documents/templates

List document templates.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /admin/documents/templates/:id

Get template details.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### POST /admin/documents/templates

Create document template.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

**Request Body:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | string | Yes | Min 3 characters | Unique template name |
| `type` | enum | Yes | Valid DocumentType | Document type |
| `content` | string | Yes | Min 50 characters | HTML content with placeholders |
| `isActive` | boolean | No | - | Active status (default: true) |

---

### PATCH /admin/documents/templates/:id

Update document template.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### DELETE /admin/documents/templates/:id

Deactivate document template.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### POST /admin/documents/generate

Generate document for application.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `applicationId` | string (UUID) | Yes | Application ID |
| `type` | string | Yes | Document type |
| `templateId` | string (UUID) | No | Template ID (uses default if not specified) |

---

### GET /admin/documents/statistics

Get document statistics.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /admin/support-tickets

List all support tickets.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | enum | Filter by status |
| `priority` | enum | Filter by priority |
| `assigneeId` | string (UUID) | Filter by assignee |
| `userId` | string (UUID) | Filter by user |

---

### GET /admin/support-tickets/statistics

Get ticket statistics.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

---

### POST /admin/support-tickets/:id/messages

Reply to ticket.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Reply message |
| `attachmentUrls` | string[] | No | Attachments |
| `isInternal` | boolean | No | Internal note (not visible to user) |

---

### PUT /admin/support-tickets/:id/assign

Assign ticket to admin.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `assigneeId` | string (UUID) | Yes | Admin user ID |

---

### PUT /admin/support-tickets/:id/status

Update ticket status.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum | Yes | New status |
| `resolution` | string | No | Resolution notes |

---

### GET /admin/messaging/conversations

List all conversations.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

---

### GET /admin/messaging/statistics

Get messaging statistics.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

---

### GET /admin/referrals

List all referral links.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

---

### GET /admin/referrals/statistics

Get referral statistics.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

---

### GET /admin/payment-plans/templates

Admin list payment plan templates.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### POST /admin/payment-plans/templates

Create payment plan template.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

**Request Body:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | string | Yes | - | Plan name |
| `description` | string | No | - | Description |
| `durationMonths` | integer | Yes | 1-60 | Duration in months |
| `downPaymentPct` | number | Yes | 0.0-1.0 | Down payment percentage |
| `interestRate` | number | No | 0.0-1.0 | Interest rate (default: 0) |
| `lateFeeAmount` | integer | No | >= 0 | Late fee in kobo |
| `lateFeePercent` | number | No | 0.0-1.0 | Late fee percentage |
| `gracePeriodDays` | integer | No | 0-30 | Grace period (default: 3) |
| `isActive` | boolean | No | - | Active status (default: true) |

---

### PATCH /admin/payment-plans/templates/:id

Update payment plan template.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### DELETE /admin/payment-plans/templates/:id

Delete payment plan template.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /admin/payment-plans/enrollments

List all enrollments.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### POST /admin/payment-plans/enrollments

Create enrollment for client.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### PATCH /admin/payment-plans/enrollments/:id/cancel

Cancel enrollment.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /admin/payment-plans/overdue

Get overdue installments.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### PATCH /admin/payment-plans/installments/:id/waive

Waive late fee for installment.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /admin/payment-plans/statistics

Get payment plan statistics.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

## Uploads

### POST /uploads/generate-url

Generate presigned upload URL.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fileName` | string | Yes | Original filename |
| `mimeType` | string | Yes | MIME type (e.g., image/jpeg) |
| `category` | enum | Yes | File category |

**File Categories:**
- `PROPERTY_IMAGE`
- `KYC_DOCUMENT`
- `SIGNATURE`
- `DOCUMENT`
- `PROFILE_PHOTO`
- `OTHER`

---

### POST /uploads/direct

Direct file upload (multipart/form-data).

**Authentication:** Required (Bearer Token)

---

### POST /uploads/record

Create file record after upload.

**Authentication:** Required (Bearer Token)

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fileName` | string | Yes | Original filename |
| `fileUrl` | string | Yes | File URL after upload |
| `mimeType` | string | Yes | MIME type |
| `fileSize` | number | Yes | File size in bytes |
| `category` | enum | Yes | File category |
| `relatedId` | string (UUID) | No | Related entity ID |
| `relatedType` | string | No | Related entity type |

---

### GET /uploads

List my uploaded files.

**Authentication:** Required (Bearer Token)

---

### GET /uploads/:id

Get file details.

**Authentication:** Required (Bearer Token)

---

### DELETE /uploads/:id

Delete file.

**Authentication:** Required (Bearer Token)

---

### GET /admin/uploads

List all files (admin).

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

---

### GET /admin/uploads/statistics

Get upload statistics.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN, SUPER_ADMIN

---

## Settings

### GET /settings/public

Get public settings (no auth required).

**Authentication:** None

---

### GET /settings

Get all settings.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /settings/categories

Get settings categories.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /settings/category/:category

Get settings by category.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /settings/:key

Get setting by key.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### POST /settings

Create setting.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

**Request Body:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `key` | string | Yes | 3-100 chars | Unique setting key |
| `value` | string | Yes | - | Setting value |
| `description` | string | No | - | Human-readable description |
| `category` | string | No | - | Category (default: general) |
| `isPublic` | boolean | No | - | Public access (default: false) |

---

### PATCH /settings/:key

Update setting.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### PATCH /settings

Bulk update settings.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `settings` | object | Yes | Key-value pairs to update |

---

### DELETE /settings/:key

Delete setting.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### POST /settings/initialize

Initialize default settings.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### PATCH /settings/maintenance/enable

Enable maintenance mode.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### PATCH /settings/maintenance/disable

Disable maintenance mode.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### PATCH /settings/feature/:feature/toggle

Toggle feature flag.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### PATCH /settings/commission/rates

Update commission rates.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

## Reports

### GET /reports/summary

Get executive summary.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string (ISO) | Start date filter |
| `endDate` | string (ISO) | End date filter |

---

### GET /reports/sales

Get sales report.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Start date |
| `endDate` | string | End date |
| `realtorId` | string (UUID) | Filter by realtor |
| `propertyId` | string (UUID) | Filter by property |

---

### GET /reports/applications

Get applications report.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /reports/commissions

Get commissions report.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /reports/payment-plans

Get payment plans report.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /reports/properties

Get properties report.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /reports/realtors

Get realtor performance report.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /reports/export/sales

Export sales as CSV.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /reports/export/commissions

Export commissions as CSV.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

## Activity Logs

### GET /activity-logs

List activity logs.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string (UUID) | Filter by user |
| `action` | enum | Filter by action |
| `entity` | string | Entity type (e.g., Application, Property) |
| `entityId` | string (UUID) | Filter by entity ID |
| `startDate` | string | Start date |
| `endDate` | string | End date |
| `limit` | integer | Items per page (default: 50) |
| `offset` | integer | Offset (default: 0) |

---

### GET /activity-logs/recent

Get recent activity.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /activity-logs/user/:userId

Get user activity.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /activity-logs/entity/:entity/:entityId

Get entity activity.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /activity-logs/statistics

Get activity statistics.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### DELETE /activity-logs/cleanup

Cleanup old logs.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `daysToKeep` | integer | 90 | Days of logs to keep |

---

## Analytics

### GET /analytics/total-sales

Get total sales analytics.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /analytics/sales

Get sales analytics with breakdown.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

### GET /analytics/top-realtors

Get top performing realtors.

**Authentication:** Required (Bearer Token)  
**Role:** ADMIN

---

## Enums Reference

### Role
| Value | Description |
|-------|-------------|
| `ADMIN` | System administrator |
| `SUPER_ADMIN` | Super administrator |
| `REALTOR` | Real estate agent |
| `CLIENT` | Property buyer |

### PropertyType
| Value | Description |
|-------|-------------|
| `LAND` | Land/Plot |
| `HOUSE` | House/Duplex |
| `APARTMENT` | Apartment/Flat |
| `COMMERCIAL` | Commercial property |
| `INDUSTRIAL` | Industrial property |
| `MIXED_USE` | Mixed use property |

### PropertyAvailability
| Value | Description |
|-------|-------------|
| `AVAILABLE` | Available for purchase |
| `RESERVED` | Reserved/On hold |
| `SOLD` | Sold |

### ApplicationStatus
| Value | Description |
|-------|-------------|
| `PENDING` | Awaiting review |
| `APPROVED` | Approved for payment |
| `REJECTED` | Rejected |

### PaymentStatus
| Value | Description |
|-------|-------------|
| `INITIATED` | Payment started |
| `SUCCESS` | Payment successful |
| `FAILED` | Payment failed |

### DocumentType
| Value | Description |
|-------|-------------|
| `ALLOCATION_LETTER` | Property allocation letter |
| `RECEIPT` | Payment receipt |
| `AGREEMENT` | Sales agreement |
| `PAYMENT_SCHEDULE` | Payment schedule |
| `SITE_PLAN` | Site plan |
| `SURVEY` | Survey document |
| `CONTRACT` | Contract document |

### DocumentStatus
| Value | Description |
|-------|-------------|
| `DRAFT` | Draft document |
| `GENERATED` | Generated, awaiting signature |
| `PENDING_SIGNATURE` | Sent for signature |
| `SIGNED` | Signed |
| `EXPIRED` | Expired |

### CommissionStatus
| Value | Description |
|-------|-------------|
| `PENDING` | Awaiting approval |
| `APPROVED` | Approved for payout |
| `PAID` | Paid out |
| `CANCELLED` | Cancelled |

### CommissionType
| Value | Description |
|-------|-------------|
| `DIRECT` | Direct sale commission |
| `REFERRAL` | Referral commission |

### KycStatus
| Value | Description |
|-------|-------------|
| `NOT_SUBMITTED` | No KYC submitted |
| `PENDING` | Awaiting verification |
| `APPROVED` | Verified |
| `REJECTED` | Rejected |

### KycDocumentType
| Value | Description |
|-------|-------------|
| `NATIONAL_ID` | National ID card |
| `DRIVERS_LICENSE` | Driver's license |
| `PASSPORT` | International passport |
| `VOTERS_CARD` | Voter's card |
| `NIN` | National Identification Number |
| `UTILITY_BILL` | Utility bill |
| `BANK_STATEMENT` | Bank statement |

### PayoutStatus
| Value | Description |
|-------|-------------|
| `PENDING` | Awaiting processing |
| `PROCESSING` | Being processed |
| `COMPLETED` | Completed |
| `FAILED` | Failed |
| `CANCELLED` | Cancelled |

### TicketStatus
| Value | Description |
|-------|-------------|
| `OPEN` | Open |
| `IN_PROGRESS` | Being worked on |
| `WAITING_CUSTOMER` | Awaiting customer response |
| `RESOLVED` | Resolved |
| `CLOSED` | Closed |

### TicketPriority
| Value | Description |
|-------|-------------|
| `LOW` | Low priority |
| `MEDIUM` | Medium priority |
| `HIGH` | High priority |
| `URGENT` | Urgent |

### NotificationType
| Value | Description |
|-------|-------------|
| `SALE_COMPLETED` | Sale completed |
| `COMMISSION_EARNED` | Commission earned |
| `COMMISSION_APPROVED` | Commission approved |
| `COMMISSION_PAID` | Commission paid |
| `APPLICATION_STATUS` | Application status change |
| `PAYMENT_RECEIVED` | Payment received |
| `DOCUMENT_READY` | Document ready |
| `WELCOME` | Welcome notification |
| `GENERAL` | General notification |

### FileCategory
| Value | Description |
|-------|-------------|
| `PROPERTY_IMAGE` | Property image |
| `KYC_DOCUMENT` | KYC document |
| `SIGNATURE` | Signature image |
| `DOCUMENT` | General document |
| `PROFILE_PHOTO` | Profile photo |
| `OTHER` | Other file |

### EnrollmentStatus
| Value | Description |
|-------|-------------|
| `ACTIVE` | Active enrollment |
| `COMPLETED` | All payments complete |
| `DEFAULTED` | Defaulted |
| `CANCELLED` | Cancelled |

### InstallmentStatus
| Value | Description |
|-------|-------------|
| `PENDING` | Payment pending |
| `PAID` | Paid |
| `OVERDUE` | Overdue |
| `WAIVED` | Waived |

### DevicePlatform
| Value | Description |
|-------|-------------|
| `ios` | iOS device |
| `android` | Android device |
| `web` | Web browser |

---

## Error Codes

### Authentication Errors (AUTH_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_TOKEN_EXPIRED` | 401 | Access token has expired |
| `AUTH_TOKEN_INVALID` | 401 | Invalid access token |
| `AUTH_REFRESH_TOKEN_EXPIRED` | 401 | Refresh token has expired |
| `AUTH_REFRESH_TOKEN_INVALID` | 401 | Invalid refresh token |
| `AUTH_REFRESH_TOKEN_REUSED` | 401 | Token reuse detected (security violation) |
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password |
| `AUTH_ACCOUNT_LOCKED` | 423 | Account locked due to failed attempts |
| `AUTH_EMAIL_NOT_VERIFIED` | 403 | Email not verified |
| `AUTH_2FA_REQUIRED` | 403 | 2FA verification required |
| `AUTH_2FA_INVALID` | 401 | Invalid 2FA code |

### Validation Errors (VALIDATION_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_FAILED` | 400 | Input validation failed |
| `VALIDATION_MISSING_FIELD` | 400 | Required field missing |
| `VALIDATION_INVALID_FORMAT` | 400 | Invalid field format |

### Resource Errors (RESOURCE_*)

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `RESOURCE_NOT_FOUND` | 404 | Resource not found |
| `RESOURCE_ALREADY_EXISTS` | 409 | Resource already exists |
| `RESOURCE_CONFLICT` | 409 | Resource conflict |

### Business Logic Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `APPLICATION_EXISTS` | 400 | Application already exists |
| `PROPERTY_NOT_AVAILABLE` | 400 | Property not available |
| `PAYMENT_ALREADY_PENDING` | 400 | Payment already in progress |
| `PAYMENT_ALREADY_COMPLETED` | 400 | Payment already completed |
| `APPLICATION_NOT_APPROVED` | 400 | Application not approved |
| `INSUFFICIENT_BALANCE` | 400 | Insufficient balance |
| `NO_BANK_ACCOUNT` | 400 | No bank account configured |
| `KYC_NOT_VERIFIED` | 403 | KYC verification required |

### System Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |
| `MAINTENANCE_MODE` | 503 | System under maintenance |

---

## Webhooks

### POST /webhooks/paystack

Paystack payment webhook (internal).

**Note:** This endpoint is called by Paystack, not the frontend.

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@4zee.com | Admin123! |
| Realtor | realtor@4zee.com | Realtor123! |
| Client | client@4zee.com | Client123! |

---

## Changelog

### v1.0.0 (February 2026)
- Initial API release
- Complete authentication with 2FA support
- Property management
- Application workflow
- Payment integration (Paystack)
- Payment plans with installments
- Document generation and signing
- KYC verification
- Commission and payout system
- Referral tracking
- Push notifications
- Messaging system
- Support tickets
- Admin dashboard and reports
