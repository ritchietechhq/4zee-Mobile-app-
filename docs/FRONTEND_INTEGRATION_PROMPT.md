# 4ZEE Properties — Frontend Integration Prompt

> **Give this entire document to your frontend AI assistant (Claude, ChatGPT, Copilot, etc.) before building or fixing any screen that talks to the backend.**

---

## 🚨 CRITICAL RULES — READ FIRST

### 1. Base URL
```
https://fourzeeproperties-backend.onrender.com
```

### 2. Every Response Has This Shape (success AND error)
```typescript
// ✅ SUCCESS
{
  "success": true,
  "data": { ... },        // The actual payload
  "error": null,
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-02-18T17:00:00.000Z",
    "version": "1.0.0",
    "pagination": { ... } // Only when paginated
  }
}

// ❌ ERROR
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",      // Machine-readable code
    "message": "Validation failed",   // Human-readable message
    "details": { ... },               // Extra info (validation errors, etc.)
    "field": "email"                  // Optional: which field caused the error
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-02-18T17:00:00.000Z",
    "version": "1.0.0"
  }
}
```

**NEVER access `response.data` directly. ALWAYS access `response.data.data`** because Axios wraps the response in its own `data` property, then the API wraps the actual payload inside another `data` key.

```typescript
// ❌ WRONG
const user = response.data;

// ✅ CORRECT
const user = response.data.data;
```

### 3. The Backend Rejects Unknown Fields
The API uses `whitelist: true` and `forbidNonWhitelisted: true`. If you send a field that is NOT in the DTO, you'll get a 400 error like:
```json
"property firstName should not exist"
```
**Only send the exact fields listed in this document.**

### 4. JWT Token Payload
When a user logs in, the JWT access token contains:
```typescript
{
  userId: string;    // The User table ID
  role: string;      // "CLIENT" | "REALTOR" | "ADMIN" | "SUPER_ADMIN"
  clientId?: string; // Present for CLIENT users (the Client table ID)
  realtorId?: string; // Present for REALTOR users (the Realtor table ID)
}
```
**Users who logged in before Feb 18, 2026 will NOT have `clientId`/`realtorId` in their token.** They must log out and log back in to get a fresh token.

---

## 📋 REQUIRED HEADERS

### For Every Request
```typescript
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Device-Id': '<persistent-uuid>',  // Generate once, store in AsyncStorage
  'X-Request-Id': '<uuid>',            // Optional, auto-generated if missing
}
```

### For Authenticated Requests (add to above)
```typescript
headers: {
  'Authorization': 'Bearer <accessToken>',
}
```

### For Mutating Requests (POST/PUT/PATCH on critical endpoints)
```typescript
headers: {
  'Idempotency-Key': '<uuid>',  // Must be a valid UUID v4
}
```

**Idempotency is enforced on these endpoints:**
- `POST /applications`
- `POST /payments/initiate`
- `POST /admin/sales/offline`
- `POST /payouts/request`
- `POST /bank-accounts`
- `POST /kyc/documents`

Sending the same Idempotency-Key twice returns the cached response with header `X-Idempotency-Replayed: true`.

---

## 🔐 AUTHENTICATION FLOW

### Register — `POST /auth/register`

**Rate limit:** 5 requests per 60 seconds

#### CLIENT Registration
```typescript
// Request body — ONLY these fields
{
  "email": "user@example.com",       // Required, valid email, unique
  "password": "SecurePass123!",       // Required, min 8 characters
  "role": "CLIENT",                   // Required, exactly "CLIENT"
  "firstName": "John",               // Optional
  "lastName": "Doe",                 // Optional
  "phone": "+2348012345678"          // Optional
}

// ✅ Response
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "a1b2c3...",
    "expiresIn": 900,              // seconds (15 min)
    "refreshExpiresIn": 2592000,   // seconds (30 days)
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "CLIENT",
      "emailVerified": false,
      "createdAt": "...",
      "client": { "id": "uuid", "firstName": "John", ... }
    }
  }
}
```

#### REALTOR Registration
```typescript
{
  "email": "agent@example.com",
  "password": "SecurePass123!",
  "role": "REALTOR",                 // Required, exactly "REALTOR"
  "dob": "1990-01-15",              // REQUIRED for REALTOR (YYYY-MM-DD)
  "referralCode": "REF-ABC123"      // Optional, links to recruiting realtor
}
```

**⚠️ DO NOT send `firstName`, `lastName`, `phone` for REALTOR registration — only CLIENT supports those at registration.**

---

### Login — `POST /auth/login`

**Rate limit:** 5 requests per 60 seconds

```typescript
// Request body
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// ✅ Response — same structure as register
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "a1b2c3...",
    "expiresIn": 900,
    "refreshExpiresIn": 2592000,
    "user": { ... },
    "mustChangePassword": false  // If true, redirect to force-change-password
  }
}
```

**Possible error codes:**
| Code | Meaning |
|------|---------|
| `AUTH_INVALID_CREDENTIALS` | Wrong email or password |
| `AUTH_ACCOUNT_LOCKED` | Too many failed attempts (5 max, 15 min lockout) |
| `AUTH_2FA_REQUIRED` | User has 2FA enabled, send to 2FA verify screen |

---

### Token Refresh — `POST /auth/refresh`

**Rate limit:** 10 requests per 60 seconds

```typescript
// Request body
{
  "refreshToken": "the-refresh-token-from-login"
}

// ✅ Response — new token pair (old refresh token is invalidated)
{
  "success": true,
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token",
    "expiresIn": 900,
    "refreshExpiresIn": 2592000,
    "user": { ... }
  }
}
```

**Error codes:**
| Code | Meaning |
|------|---------|
| `AUTH_REFRESH_TOKEN_EXPIRED` | Refresh token expired, must re-login |
| `AUTH_REFRESH_TOKEN_INVALID` | Token was revoked or reused (possible theft) |

**⚠️ Token Reuse Detection:** If a refresh token is used twice, ALL of that user's tokens are revoked for security. The user must log in again.

---

### Logout — `POST /auth/logout` (Auth required)
```typescript
{
  "refreshToken": "current-refresh-token",
  "deviceId": "device-uuid"          // Optional
}
```

### Get Current User — `GET /auth/me` (Auth required)
```typescript
// ✅ Response
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "CLIENT",
    "emailVerified": true,
    "twoFactorEnabled": false,
    "createdAt": "...",
    "client": {                       // Only for CLIENT role
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+234...",
      "kycStatus": "NOT_SUBMITTED"
    },
    "realtor": {                      // Only for REALTOR role
      "id": "uuid",
      "referralCode": "REF-ABC123",
      "totalSales": 0,
      "totalRecruits": 0
    }
  }
}
```

---

### Forgot Password — `POST /auth/forgot-password`
**Rate limit:** 3 requests per 3600 seconds (1 hour)
```typescript
{ "email": "user@example.com" }
// Always returns 200 (doesn't reveal if email exists)
```

### Reset Password — `POST /auth/reset-password`
```typescript
{ "token": "reset-token-from-email", "newPassword": "NewSecure123!" }
```

### Change Password — `PATCH /auth/change-password` (Auth required)
```typescript
{ "currentPassword": "OldPass123!", "newPassword": "NewPass456!" }
```

---

## 📱 RECOMMENDED AXIOS SETUP

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const API_BASE = 'https://fourzeeproperties-backend.onrender.com';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor — attach auth token + device ID
api.interceptors.request.use(async (config) => {
  // Attach access token
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Attach persistent device ID
  let deviceId = await AsyncStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = uuidv4();
    await AsyncStorage.setItem('deviceId', deviceId);
  }
  config.headers['X-Device-Id'] = deviceId;
  
  // Auto-generate idempotency key for mutations
  if (['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
    config.headers['Idempotency-Key'] = uuidv4();
  }
  
  return config;
});

// Response interceptor — handle token refresh
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const errorCode = error.response?.data?.error?.code;
    
    // Handle expired access token
    if (error.response?.status === 401 && errorCode === 'AUTH_TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshToken = await AsyncStorage.getItem('refreshToken');
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          
          const newAccessToken = data.data.accessToken;
          const newRefreshToken = data.data.refreshToken;
          
          await AsyncStorage.setItem('accessToken', newAccessToken);
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
          
          refreshSubscribers.forEach(cb => cb(newAccessToken));
          refreshSubscribers = [];
          
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed — force re-login
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
          // Navigate to login screen
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      
      // Queue request while refresh is in progress
      return new Promise((resolve) => {
        refreshSubscribers.push((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

---

## 📊 DASHBOARD

### Client Dashboard — `GET /dashboard/client` (CLIENT role required)
```typescript
// ✅ Response
{
  "success": true,
  "data": {
    "profile": {
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "kycStatus": "NOT_SUBMITTED",
      "memberSince": "2026-02-18T..."
    },
    "applicationsSummary": {
      "PENDING": 2,
      "APPROVED": 1,
      "REJECTED": 0,
      "total": 3
    },
    "financials": {
      "totalSpent": 5000000,
      "activePaymentPlans": 1
    },
    "upcomingInstallments": [ ... ],
    "recentPayments": [ ... ],
    "kycDocuments": [ ... ],
    "unreadNotifications": 3,
    "unreadMessages": 1
  }
}
```

### Realtor Dashboard — `GET /dashboard/realtor` (REALTOR role required)
### Admin Dashboard — `GET /dashboard/admin` (ADMIN/SUPER_ADMIN required)
### Quick Stats — `GET /dashboard/quick-stats` (Any authenticated user)

---

## 🏠 PROPERTIES (Public — No Auth Required)

### List Properties — `GET /properties`
```
GET /properties?page=1&limit=20
```

### Search Properties — `GET /properties/search`
```
GET /properties/search?type=LAND&city=Lagos&minPrice=1000000&maxPrice=50000000&page=1&limit=20
```

Query parameters:
| Param | Type | Values |
|-------|------|--------|
| `type` | enum | `LAND`, `HOUSE`, `APARTMENT`, `COMMERCIAL`, `INDUSTRIAL`, `MIXED_USE` |
| `city` | string | Any city name |
| `state` | string | Any state name |
| `availability` | enum | `AVAILABLE`, `RESERVED`, `SOLD` |
| `minPrice` | number | Minimum price in kobo/lowest unit |
| `maxPrice` | number | Maximum price |
| `search` | string | Full-text search in title/description |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |

### Featured Properties — `GET /properties/featured?limit=10`
### Popular Properties — `GET /properties/popular?limit=10`
### Property Detail — `GET /properties/:id`

---

## ⭐ FAVORITES (CLIENT role required)

```
GET    /properties/favorites                    → List favorites
POST   /properties/favorites/:propertyId        → Add to favorites
DELETE /properties/favorites/:propertyId        → Remove from favorites
GET    /properties/favorites/:propertyId/check  → { isFavorite: true/false }
```

---

## 📝 APPLICATIONS (Auth required)

### Create Application — `POST /applications` (CLIENT only)
**Requires Idempotency-Key header**
```typescript
{
  "propertyId": "property-uuid",
  "realtorId": "realtor-uuid"      // Optional
}
```

### My Applications — `GET /applications/me`
```
GET /applications/me?cursor=<lastId>&limit=20&status=PENDING
```

### Application Detail — `GET /applications/:id`

---

## 💰 PAYMENTS

### Initiate Payment — `POST /payments/initiate`
**Requires Idempotency-Key header**
```typescript
{
  "applicationId": "application-uuid",
  "amount": 5000000,                // In kobo (₦50,000)
  "callbackUrl": "myapp://payment-callback"
}
```

### Verify Payment — `GET /payments/verify/:reference`
### Payment History — `GET /payments/history?page=1&limit=20`

---

## 📄 KYC (CLIENT role required)

### Get KYC Status — `GET /kyc/status`
```typescript
// ✅ Response
{
  "success": true,
  "data": {
    "kycStatus": "NOT_SUBMITTED",  // NOT_SUBMITTED | PENDING | APPROVED | REJECTED
    "documents": [ ... ]
  }
}
```

### Update Personal Info — `PUT /kyc/info`
```typescript
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+2348012345678",
  "address": "123 Victoria Island, Lagos",
  "dateOfBirth": "1990-01-15"
}
```

### Submit KYC Document — `POST /kyc/documents`
**Requires Idempotency-Key header**
```typescript
{
  "type": "NATIONAL_ID",     // See document types below
  "fileUrl": "https://...",  // URL from file upload
  "fileName": "national-id.jpg",
  "expiryDate": "2030-01-01" // Optional
}
```

**KYC Document Types:** `NATIONAL_ID`, `DRIVERS_LICENSE`, `PASSPORT`, `VOTERS_CARD`, `NIN`, `UTILITY_BILL`, `BANK_STATEMENT`

---

## 📤 FILE UPLOADS

### ⚠️ There Is NO `/uploads/profile-picture` Endpoint

Use the generic upload endpoint with the appropriate category:

### Direct Upload — `POST /uploads/direct`
```typescript
const formData = new FormData();
formData.append('file', {
  uri: imageUri,             // From image picker
  type: 'image/jpeg',       // MIME type
  name: 'photo.jpg',        // Filename
});
formData.append('category', 'PROFILE_PHOTO');  // See categories below

const response = await api.post('/uploads/direct', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// Response.data.data = { id, url, publicUrl, fileName, ... }
```

**File Categories:**
| Category | Use For |
|----------|---------|
| `PROFILE_PHOTO` | Profile pictures |
| `PROPERTY_IMAGE` | Property photos |
| `KYC_DOCUMENT` | ID cards, utility bills, etc. |
| `SIGNATURE` | Digital signatures |
| `DOCUMENT` | General documents |
| `OTHER` | Anything else |

### List My Files — `GET /uploads?category=PROFILE_PHOTO`
### Delete File — `DELETE /uploads/:id`

---

## 🔔 NOTIFICATIONS (Auth required)

### List Notifications — `GET /notifications`
```
GET /notifications?cursor=<lastId>&limit=20&type=PAYMENT_RECEIVED
```

### Unread Count — `GET /notifications/unread-count`
```typescript
// ✅ Response
{ "success": true, "data": { "count": 5 } }
```

### Mark As Read — `PATCH /notifications/:id/read`
### Mark All Read — `PATCH /notifications/mark-all-read`
### Delete — `DELETE /notifications/:id`

### Notification Preferences — `GET /notifications/preferences`
### Update Preferences — `PATCH /notifications/preferences`
```typescript
{
  "emailNotifications": true,
  "saleNotifications": true,
  "commissionNotifications": true,
  "applicationNotifications": true,
  "paymentNotifications": true,
  "marketingEmails": false
}
```

### Register Push Device — `POST /notifications/device`
```typescript
{
  "deviceId": "persistent-uuid",
  "pushToken": "expo-push-token-or-fcm-token",
  "deviceName": "iPhone 15 Pro",
  "deviceType": "ios",
  "appVersion": "1.0.0"
}
```

---

## 💬 MESSAGING (Auth required)

```
GET    /messaging/unread-count               → { count: N }
POST   /messaging/conversations              → Start conversation
GET    /messaging/conversations              → My conversations
GET    /messaging/conversations/:id          → Conversation detail + messages
POST   /messaging/conversations/:id/messages → Send message
POST   /messaging/inquiries                  → Property inquiry (creates convo)
```

---

## 🎫 SUPPORT TICKETS (Auth required)

```
POST   /support-tickets              → Create ticket
GET    /support-tickets              → My tickets
GET    /support-tickets/:id          → Ticket detail + messages
POST   /support-tickets/:id/messages → Add message to ticket
```

### Create Ticket
```typescript
{
  "subject": "Payment issue",
  "description": "My payment was deducted but not reflected...",
  "category": "payment"    // payment, technical, general, kyc, property, etc.
}
```

---

## 🏦 BANK ACCOUNTS (REALTOR role required)

```
GET    /bank-accounts/banks          → List Nigerian banks
POST   /bank-accounts/verify         → Verify account number
POST   /bank-accounts                → Add bank account
GET    /bank-accounts                → List my accounts
GET    /bank-accounts/default        → Get default account
GET    /bank-accounts/:id            → Account detail
PUT    /bank-accounts/:id            → Update account
PUT    /bank-accounts/:id/set-default → Set as default
DELETE /bank-accounts/:id            → Remove account
```

---

## 💸 PAYOUTS (REALTOR role required)

```
GET    /payouts/balance    → Available balance
GET    /payouts/summary    → Payout summary
POST   /payouts/request    → Request payout (Idempotency-Key required)
GET    /payouts/history    → Payout history
PUT    /payouts/:id/cancel → Cancel pending payout
```

---

## 📈 COMMISSIONS (REALTOR role required)

```
GET /commissions/me           → My commissions (paginated)
GET /commissions/summary      → Commission summary
```

---

## 🔗 REFERRALS

### Public (No Auth)
```
POST /referrals/track          → Track referral link click
POST /referrals/convert        → Convert referral visit
```

### Realtor (REALTOR role required)
```
POST   /my-referrals           → Create referral link
GET    /my-referrals           → List my links
GET    /my-referrals/stats     → Referral statistics
GET    /my-referrals/:id       → Link detail
PUT    /my-referrals/:id       → Update link
DELETE /my-referrals/:id       → Delete link
```

---

## 👤 CLIENT PROFILE

### Get My Profile — `GET /clients/me` (CLIENT role)
### Update Profile — `PATCH /clients/me` (CLIENT role)
```typescript
{
  "phone": "+2348012345678",
  "address": "123 Victoria Island, Lagos"
}
```
**Only `phone` and `address` can be updated via this endpoint.** Name updates go through `PUT /kyc/info`.

---

## 📊 PAYMENT PLANS

### List Templates — `GET /payment-plans/templates` (Public)
### Template Detail — `GET /payment-plans/templates/:id` (Public)
### Enroll — `POST /payment-plans/enroll` (CLIENT role)
### My Enrollments — `GET /payment-plans/my-enrollments` (CLIENT role)
### Upcoming Installments — `GET /payment-plans/my-upcoming?days=30` (CLIENT role)
### Enrollment Detail — `GET /payment-plans/enrollments/:id`
### Payment Schedule — `GET /payment-plans/applications/:applicationId/schedule`

---

## ⚠️ ERROR CODES REFERENCE

### Authentication Errors (401)
| Code | Action |
|------|--------|
| `AUTH_TOKEN_EXPIRED` | Auto-refresh using refresh token |
| `AUTH_TOKEN_INVALID` | Force re-login |
| `AUTH_REFRESH_TOKEN_EXPIRED` | Force re-login |
| `AUTH_REFRESH_TOKEN_INVALID` | Force re-login (possible token theft) |
| `AUTH_ACCOUNT_LOCKED` | Show "Account locked, try again in 15 minutes" |
| `AUTH_2FA_REQUIRED` | Navigate to 2FA verification screen |
| `AUTH_PASSWORD_CHANGE_REQUIRED` | Navigate to change password screen |

### Authorization Errors (403)
| Code | Action |
|------|--------|
| `AUTH_FORBIDDEN` | User doesn't have required role |
| `AUTH_EMAIL_NOT_VERIFIED` | Show "Verify your email" prompt |

### Validation Errors (400)
| Code | Action |
|------|--------|
| `VALIDATION_FAILED` | Show `error.details.errors` array to user |
| `RESOURCE_ALREADY_EXISTS` | "Email already in use" / "Already exists" |
| `RESOURCE_CONFLICT` | Conflicting operation |

### Not Found (404)
| Code | Action |
|------|--------|
| `RESOURCE_NOT_FOUND` | Show "Not found" or redirect |

### Rate Limiting (429)
| Code | Action |
|------|--------|
| `RATE_LIMIT_EXCEEDED` | Show "Too many requests, try again later" |

### Server Errors (500+)
| Code | Action |
|------|--------|
| `SERVER_INTERNAL_ERROR` | Show "Something went wrong" + retry button |

---

## 📱 PAGINATION PATTERN

The API uses two pagination styles:

### Offset-Based (most endpoints)
```
GET /properties?page=1&limit=20
```
Response meta:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### Cursor-Based (notifications, applications/me)
```
GET /notifications?cursor=<lastItemId>&limit=20
```
Response meta:
```json
{
  "pagination": {
    "nextCursor": "last-item-uuid",
    "hasNext": true,
    "limit": 20
  }
}
```

---

## 🗄️ COMPLETE ROUTE MAP

### Public (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check / API info |
| GET | `/docs` | Swagger documentation |
| GET | `/properties` | List properties |
| GET | `/properties/search` | Search properties |
| GET | `/properties/featured` | Featured properties |
| GET | `/properties/popular` | Popular properties |
| GET | `/properties/:id` | Property detail |
| POST | `/auth/register` | Register |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh tokens |
| POST | `/auth/forgot-password` | Forgot password |
| POST | `/auth/reset-password` | Reset password |
| POST | `/auth/verify-email` | Verify email |
| POST | `/auth/otp/send` | Send OTP |
| POST | `/auth/otp/verify` | Verify OTP |
| POST | `/auth/2fa/verify-login` | 2FA login verify |
| GET | `/payment-plans/templates` | List plan templates |
| GET | `/payment-plans/templates/:id` | Template detail |
| POST | `/referrals/track` | Track referral |
| POST | `/referrals/convert` | Convert referral |

### CLIENT Role
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/client` | Client dashboard |
| GET | `/clients/me` | My profile |
| PATCH | `/clients/me` | Update profile |
| POST | `/applications` | Create application |
| GET | `/applications/me` | My applications |
| GET | `/applications/:id` | Application detail |
| GET | `/kyc/status` | KYC status |
| PUT | `/kyc/info` | Update KYC info |
| POST | `/kyc/documents` | Submit KYC doc |
| DELETE | `/kyc/documents/:id` | Delete KYC doc |
| POST | `/payments/initiate` | Initiate payment |
| GET | `/payments/verify/:ref` | Verify payment |
| GET | `/payments/history` | Payment history |
| POST | `/payment-plans/enroll` | Enroll in plan |
| GET | `/payment-plans/my-enrollments` | My enrollments |
| GET | `/payment-plans/my-upcoming` | Upcoming installments |
| GET/POST/DELETE | `/properties/favorites/*` | Favorites |

### REALTOR Role
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/realtor` | Realtor dashboard |
| GET | `/commissions/me` | My commissions |
| GET | `/commissions/summary` | Commission summary |
| POST | `/bank-accounts` | Add bank account |
| GET | `/bank-accounts` | List accounts |
| GET | `/payouts/balance` | Available balance |
| POST | `/payouts/request` | Request payout |
| GET | `/payouts/history` | Payout history |
| POST/GET/PUT/DELETE | `/my-referrals/*` | Referral links |

### Any Authenticated User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/me` | Current user info |
| POST | `/auth/logout` | Logout |
| PATCH | `/auth/change-password` | Change password |
| GET | `/dashboard/quick-stats` | Quick stats |
| POST | `/uploads/direct` | Upload file |
| GET | `/uploads` | My files |
| DELETE | `/uploads/:id` | Delete file |
| GET | `/notifications` | Notifications |
| GET | `/notifications/unread-count` | Unread count |
| PATCH | `/notifications/:id/read` | Mark read |
| GET/PATCH | `/notifications/preferences` | Preferences |
| POST | `/notifications/device` | Register device |
| GET/POST | `/messaging/*` | Messaging |
| POST/GET | `/support-tickets/*` | Support tickets |

---

## 🔄 STATE MANAGEMENT RECOMMENDATIONS

### After Login/Register — Store These
```typescript
await AsyncStorage.setItem('accessToken', data.accessToken);
await AsyncStorage.setItem('refreshToken', data.refreshToken);
await AsyncStorage.setItem('user', JSON.stringify(data.user));
await AsyncStorage.setItem('tokenExpiresAt', String(Date.now() + data.expiresIn * 1000));
```

### On App Start — Check Token Validity
```typescript
const expiresAt = await AsyncStorage.getItem('tokenExpiresAt');
if (expiresAt && Date.now() > Number(expiresAt)) {
  // Token expired, try refresh
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  if (refreshToken) {
    try {
      const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
      // Save new tokens
    } catch {
      // Refresh failed, redirect to login
    }
  }
}
```

### On Logout — Clear Everything
```typescript
await AsyncStorage.multiRemove([
  'accessToken', 'refreshToken', 'user', 'tokenExpiresAt'
]);
```

---

## 🐛 COMMON MISTAKES TO AVOID

1. **Sending extra fields** → The API rejects unknown properties. Only send what's documented.
2. **Using `/uploads/profile-picture`** → This endpoint doesn't exist. Use `POST /uploads/direct` with `category: 'PROFILE_PHOTO'`.
3. **Accessing `response.data` instead of `response.data.data`** → Axios wraps response, API wraps payload.
4. **Not handling `mustChangePassword`** → After login, check if `true` and redirect.
5. **Not handling `AUTH_2FA_REQUIRED`** → Shows up as an error code during login.
6. **Forgetting `Content-Type: multipart/form-data`** for file uploads.
7. **Sending `role: "client"` lowercase** → Must be `"CLIENT"` (uppercase).
8. **Not refreshing tokens** → Access tokens expire in 15 minutes.
9. **Reusing Idempotency-Key** → Generate a new UUID for each unique request.
10. **Not sending `X-Device-Id`** → Needed for device session tracking.
