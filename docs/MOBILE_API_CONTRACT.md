# 4Zee Properties API - Mobile Integration Guide

## Version 1.0.0 (Mobile Optimized)

This document describes the mobile-optimized API contract for the 4Zee Properties React Native application.

---

## 📱 Core Principles

### 1. Consistent Response Envelope

All API responses follow this structure:

```json
{
  "success": boolean,
  "data": <response_data> | null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "field": "field_name",      // Optional: for validation errors
    "details": {}               // Optional: additional context
  } | null,
  "meta": {
    "requestId": "uuid",
    "timestamp": "2025-01-30T10:00:00.000Z",
    "version": "1.0.0",
    "pagination": {             // Only on list endpoints
      "limit": 20,
      "hasNext": true,
      "hasPrev": false,
      "nextCursor": "uuid"
    }
  }
}
```

### 2. Error Codes

Use these stable error codes for programmatic error handling:

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `AUTH_TOKEN_EXPIRED` | 401 | Access token expired, use refresh |
| `AUTH_TOKEN_INVALID` | 401 | Malformed or invalid token |
| `AUTH_REFRESH_TOKEN_EXPIRED` | 401 | Refresh token expired, re-login required |
| `AUTH_ACCOUNT_LOCKED` | 401 | Too many failed attempts |
| `AUTH_2FA_REQUIRED` | 401 | 2FA verification needed |
| `AUTH_FORBIDDEN` | 403 | Insufficient permissions |
| `VALIDATION_FAILED` | 400 | Input validation errors |
| `RESOURCE_NOT_FOUND` | 404 | Entity doesn't exist |
| `RESOURCE_ALREADY_EXISTS` | 409 | Duplicate record |
| `RESOURCE_CONFLICT` | 409 | Concurrent modification |
| `BUSINESS_OPERATION_FAILED` | 422 | Business rule violation |
| `BUSINESS_PAYMENT_FAILED` | 422 | Payment processing error |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVER_INTERNAL_ERROR` | 500 | Unexpected server error |
| `IDEMPOTENCY_KEY_INVALID` | 400 | Bad idempotency key format |
| `IDEMPOTENCY_KEY_REUSED` | 409 | Request in progress |

### 3. Required Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
X-Request-Id: <uuid>              # Optional: client-generated for tracing
X-Device-Id: <device_uuid>        # Recommended: for session tracking
Idempotency-Key: <uuid>           # Required for POST/PUT/PATCH write operations
```

---

## 🔐 Authentication Flow

### Login

```
POST /auth/login
```

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "abc123...",
    "expiresIn": 900,
    "refreshExpiresIn": 2592000,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "CLIENT"
    }
  }
}
```

**2FA Required Response:**
```json
{
  "success": true,
  "data": {
    "requires2FA": true,
    "userId": "uuid",
    "message": "Please enter your 2FA code"
  }
}
```

### Token Refresh

```
POST /auth/refresh
```

Call this when access token expires (before API calls or on 401 with `AUTH_TOKEN_EXPIRED`).

**Request:**
```json
{
  "refreshToken": "abc123..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "xyz789...",
    "expiresIn": 900,
    "refreshExpiresIn": 2592000,
    "user": { ... }
  }
}
```

### Logout

```
POST /auth/logout
```

**Request (logout current device):**
```json
{
  "refreshToken": "abc123..."
}
```

**Request (logout all devices):**
```json
{
  "logoutAll": true
}
```

### Session Management

```
GET /auth/sessions
```

Returns list of active login sessions/devices.

```
POST /auth/sessions/revoke
```

Revoke a specific device session.

---

## 📄 Pagination

### Cursor-Based (Recommended for Mobile)

All list endpoints support cursor-based pagination for efficient infinite scroll:

```
GET /applications/me?limit=20&cursor=<last_item_id>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "limit": 20,
      "hasNext": true,
      "hasPrev": true,
      "nextCursor": "uuid-of-last-item"
    }
  }
}
```

**Usage in React Native:**
```javascript
const loadMore = async () => {
  const res = await api.get('/applications/me', {
    params: { limit: 20, cursor: lastCursor }
  });
  setApplications(prev => [...prev, ...res.data.items]);
  setLastCursor(res.data.pagination.nextCursor);
  setHasMore(res.data.pagination.hasNext);
};
```

### Endpoints with Cursor Pagination

| Endpoint | Description |
|----------|-------------|
| `GET /applications/me` | Client's applications |
| `GET /admin/applications` | All applications (admin) |
| `GET /commissions` | All commissions (admin) |
| `GET /commissions/my-commissions` | Realtor's commissions |
| `GET /properties/search` | Property search results |
| `GET /notifications` | User notifications |

---

## 🔄 Idempotency

For all write operations, include an `Idempotency-Key` header with a UUID:

```javascript
const createApplication = async (data) => {
  const idempotencyKey = uuid.v4();
  
  return api.post('/applications', data, {
    headers: { 'Idempotency-Key': idempotencyKey }
  });
};
```

**Idempotent Endpoints:**
| Endpoint | Method |
|----------|--------|
| `/applications` | POST |
| `/payments/initiate` | POST |
| `/admin/sales/offline` | POST |
| `/payouts` | POST |
| `/admin/payouts` | POST |
| `/bank-accounts` | POST |
| `/kyc` | PUT |

**Benefits:**
- Safe retries on network failures
- Prevents duplicate operations
- Response cached for 24 hours

---

## 💳 Payment Flow

### 1. Initiate Payment

```
POST /payments/initiate
Headers: Idempotency-Key: <uuid>
```

**Request:**
```json
{
  "applicationId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/...",
    "reference": "PAY-1706612400-abc123",
    "accessCode": "abc123"
  }
}
```

### 2. Open Payment WebView

```javascript
// React Native WebView
<WebView 
  source={{ uri: authorizationUrl }}
  onNavigationStateChange={handleNavigation}
/>
```

### 3. Poll Payment Status

After WebView closes, poll for completion:

```
GET /payments/{reference}/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reference": "PAY-1706612400-abc123",
    "status": "SUCCESS",  // or "INITIATED", "FAILED"
    "saleId": "uuid",     // Present when SUCCESS
    "paidAt": "2025-01-30T10:00:00.000Z",
    "failureReason": null // Present when FAILED
  }
}
```

**Polling Implementation:**
```javascript
const pollPayment = async (reference) => {
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    const res = await api.get(`/payments/${reference}/status`);
    
    if (res.data.status === 'SUCCESS') {
      navigation.navigate('PaymentSuccess', { saleId: res.data.saleId });
      return;
    }
    
    if (res.data.status === 'FAILED') {
      showError(res.data.failureReason);
      return;
    }
    
    await sleep(2000); // Wait 2 seconds
  }
};
```

---

## 🔔 Push Notifications

### Register Device

Call after successful login and whenever push token refreshes:

```
POST /notifications/device
```

**Request:**
```json
{
  "deviceId": "unique-device-id",
  "pushToken": "fcm-or-apns-token",
  "platform": "ios",
  "deviceName": "iPhone 15 Pro",
  "appVersion": "1.0.0"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deviceId": "unique-device-id",
    "deviceType": "ios",
    "isActive": true
  }
}
```

### Update Push Token

When token refreshes (happens periodically on iOS/Android):

```
PATCH /notifications/device/{deviceId}
```

**Request:**
```json
{
  "pushToken": "new-fcm-or-apns-token"
}
```

### Unregister Device

Call on logout or when notifications disabled:

```
DELETE /notifications/device/{deviceId}
```

### List Registered Devices

```
GET /notifications/devices
```

---

## 📁 File Downloads

### Document Download

```
GET /documents/{id}/download
```

Returns file with appropriate headers:
- `Content-Type`: mime type
- `Content-Disposition`: attachment; filename="document.pdf"
- `Content-Length`: file size

**React Native Implementation:**
```javascript
import RNFetchBlob from 'rn-fetch-blob';

const downloadDocument = async (documentId, filename) => {
  const { dirs } = RNFetchBlob.fs;
  const path = `${dirs.DownloadDir}/${filename}`;
  
  await RNFetchBlob.config({ path, addAndroidDownloads: { ... } })
    .fetch('GET', `${API_URL}/documents/${documentId}/download`, {
      Authorization: `Bearer ${accessToken}`
    });
};
```

---

## ⚡ Performance Tips

1. **Compression**: All responses are gzip compressed
2. **Caching**: Use `Cache-Control` headers when present
3. **Batch Requests**: Combine related data in single requests where possible
4. **Prefetch**: Load next page data before user scrolls to bottom
5. **Offline Queue**: Queue failed write operations for retry
6. **Cursor Pagination**: Use cursor instead of page numbers for consistent results

---

## 🛡️ Security

1. **Token Storage**: Store tokens in secure storage (Keychain/Keystore)
2. **Certificate Pinning**: Implement SSL pinning for production
3. **Device Fingerprint**: Send `X-Device-Id` for session tracking
4. **Biometric Auth**: Use device biometrics before sensitive operations
5. **Token Rotation**: Refresh tokens are single-use and rotated on each refresh

---

## 📊 Network Error Handling

```javascript
const api = axios.create({ baseURL: API_URL });

api.interceptors.response.use(
  response => response,
  async error => {
    const { response, config } = error;
    
    if (response?.data?.error?.code === 'AUTH_TOKEN_EXPIRED') {
      // Attempt token refresh
      const newTokens = await refreshTokens();
      config.headers.Authorization = `Bearer ${newTokens.accessToken}`;
      return api(config);
    }
    
    if (!response) {
      // Network error - queue for retry
      return queueForRetry(config);
    }
    
    throw error;
  }
);
```

---

## 📍 Endpoints Summary

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh tokens |
| POST | /auth/logout | Logout |
| GET | /auth/me | Get current user |
| GET | /auth/sessions | List active sessions |
| POST | /auth/sessions/revoke | Revoke device |
| POST | /auth/2fa/verify-login | Complete 2FA login |

### Properties
| Method | Path | Description |
|--------|------|-------------|
| GET | /properties | List all |
| GET | /properties/search | Search with filters (cursor pagination) |
| GET | /properties/featured | Featured properties |
| GET | /properties/:id | Get details |

### Applications
| Method | Path | Description |
|--------|------|-------------|
| POST | /applications | Create application (idempotent) |
| GET | /applications/me | My applications (cursor pagination) |
| GET | /applications/:id | Get details |
| GET | /admin/applications | All applications (cursor pagination) |
| PATCH | /admin/applications/:id/approve | Approve |
| PATCH | /admin/applications/:id/reject | Reject |

### Payments
| Method | Path | Description |
|--------|------|-------------|
| POST | /payments/initiate | Start payment (idempotent) |
| GET | /payments/:ref | Get payment details |
| GET | /payments/:ref/status | Poll status (mobile) |

### Commissions
| Method | Path | Description |
|--------|------|-------------|
| GET | /commissions | All commissions (cursor pagination) |
| GET | /commissions/my-commissions | Realtor's commissions (cursor pagination) |
| GET | /commissions/my-summary | Realtor summary |
| GET | /commissions/:id | Get details |

### Notifications
| Method | Path | Description |
|--------|------|-------------|
| GET | /notifications | List notifications (cursor pagination) |
| GET | /notifications/unread-count | Get unread count |
| PATCH | /notifications/:id/read | Mark as read |
| PATCH | /notifications/read-all | Mark all as read |
| POST | /notifications/device | Register device |
| PATCH | /notifications/device/:id | Update push token |
| DELETE | /notifications/device/:id | Unregister device |
| GET | /notifications/devices | List devices |

### Documents
| Method | Path | Description |
|--------|------|-------------|
| GET | /documents/application/:id | List documents |
| GET | /documents/:id/download | Download file |

---

## 🚀 Changelog

### v1.0.0 (Mobile Optimized)
- Consistent response envelope with `success`, `data`, `error`, `meta`
- Stable error codes for programmatic handling
- Refresh token rotation with single-use tokens
- Cursor-based pagination on all list endpoints
- Idempotency support for write operations
- Payment status polling endpoint
- Device registration for push notifications
- Session management (list, revoke)
- Gzip compression for all responses
- Request ID tracking (`X-Request-Id`)
