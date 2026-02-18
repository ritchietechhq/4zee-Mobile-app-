# 4Zee Properties - Complete API Documentation for React Native

**Base URL**: `https://api.4zeeproperties.com` (Production)  
**API Version**: 1.0.0  
**Last Updated**: February 2026

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [Properties](#properties)
4. [Applications](#applications)
5. [Payments](#payments)
6. [Documents](#documents)
7. [Notifications](#notifications)
8. [User Profile](#user-profile)
9. [KYC](#kyc)
10. [Bank Accounts](#bank-accounts)
11. [Commissions (Realtor)](#commissions-realtor)
12. [Payouts (Realtor)](#payouts-realtor)
13. [Referrals (Realtor)](#referrals-realtor)
14. [Support Tickets](#support-tickets)
15. [Messaging](#messaging)
16. [Dashboard](#dashboard)
17. [Admin Endpoints](#admin-endpoints)
18. [Error Codes Reference](#error-codes-reference)
19. [TypeScript Interfaces](#typescript-interfaces)

---

## Getting Started

### Required Headers

```typescript
// All requests
const headers = {
  'Content-Type': 'application/json',
  'X-Request-Id': uuid(), // Optional but recommended for debugging
  'X-Device-Id': deviceId, // Unique device identifier
};

// Authenticated requests (add after login)
const authHeaders = {
  ...headers,
  'Authorization': `Bearer ${accessToken}`,
};

// Write operations (POST, PUT, PATCH)
const writeHeaders = {
  ...authHeaders,
  'Idempotency-Key': uuid(), // Prevents duplicate operations
};
```

### Response Envelope

All responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: {
    code: string;      // Stable error code (e.g., "AUTH_TOKEN_EXPIRED")
    message: string;   // Human-readable message
    field?: string;    // Field name for validation errors
    details?: object;  // Additional error context
  } | null;
  meta: {
    requestId: string;
    timestamp: string; // ISO 8601
    version: string;
    pagination?: {
      limit: number;
      hasNext: boolean;
      hasPrev: boolean;
      nextCursor?: string;
      total?: number;
      page?: number;
      totalPages?: number;
    };
  };
}
```

### Axios Setup Example

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';

const API_BASE_URL = 'https://api.4zeeproperties.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  const deviceId = await AsyncStorage.getItem('deviceId');
  
  config.headers['X-Request-Id'] = uuid();
  config.headers['X-Device-Id'] = deviceId;
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add idempotency key for write operations
  if (['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
    config.headers['Idempotency-Key'] = uuid();
  }
  
  return config;
});

// Response interceptor with token refresh
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.data?.error?.code === 'AUTH_TOKEN_EXPIRED' && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        
        await AsyncStorage.setItem('accessToken', data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
        
        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        // Navigate to login screen
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

export default api;
```

---

## Authentication

### Register New User

```
POST /auth/register
```

**Headers**: `Content-Type`, `Idempotency-Key`

**Request Body**:
```typescript
{
  email: string;          // Valid email
  password: string;       // Min 8 chars, 1 uppercase, 1 number
  firstName: string;      // Min 2 chars
  lastName: string;       // Min 2 chars
  phone: string;          // Nigerian format: +234XXXXXXXXXX
  role: 'CLIENT' | 'REALTOR';
  referralCode?: string;  // Optional: referrer's code (for realtors)
}
```

**Example**:
```typescript
const register = async (userData) => {
  const response = await api.post('/auth/register', {
    email: 'john@example.com',
    password: 'SecurePass123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+2348012345678',
    role: 'CLIENT',
  });
  
  // Store tokens
  await AsyncStorage.setItem('accessToken', response.data.accessToken);
  await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
  
  return response.data.user;
};
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "a1b2c3d4e5f6...",
    "expiresIn": 900,
    "refreshExpiresIn": 2592000,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+2348012345678",
      "role": "CLIENT",
      "isEmailVerified": false,
      "is2FAEnabled": false
    }
  }
}
```

**Error Response** (409):
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_ALREADY_EXISTS",
    "message": "User with this email already exists"
  }
}
```

---

### Login

```
POST /auth/login
```

**Headers**: `Content-Type`, `X-Device-Id`

**Request Body**:
```typescript
{
  email: string;
  password: string;
}
```

**Example**:
```typescript
const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  
  if (response.data.requires2FA) {
    // Navigate to 2FA screen
    return { requires2FA: true, userId: response.data.userId };
  }
  
  await AsyncStorage.setItem('accessToken', response.data.accessToken);
  await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
  
  return response.data.user;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "a1b2c3d4e5f6...",
    "expiresIn": 900,
    "refreshExpiresIn": 2592000,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CLIENT"
    }
  }
}
```

**2FA Required Response** (200):
```json
{
  "success": true,
  "data": {
    "requires2FA": true,
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Please enter your 2FA code"
  }
}
```

---

### Verify 2FA Login

```
POST /auth/2fa/verify-login
```

**Request Body**:
```typescript
{
  userId: string;
  code: string;  // 6-digit TOTP code
}
```

**Example**:
```typescript
const verify2FA = async (userId: string, code: string) => {
  const response = await api.post('/auth/2fa/verify-login', { userId, code });
  
  await AsyncStorage.setItem('accessToken', response.data.accessToken);
  await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
  
  return response.data.user;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "a1b2c3d4e5f6...",
    "expiresIn": 900,
    "refreshExpiresIn": 2592000,
    "user": { ... }
  }
}
```

---

### Refresh Token

```
POST /auth/refresh
```

**Request Body**:
```typescript
{
  refreshToken: string;
}
```

**Example**:
```typescript
const refreshTokens = async () => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
  
  await AsyncStorage.setItem('accessToken', response.data.data.accessToken);
  await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
  
  return response.data.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "x9y8z7w6v5u4...",
    "expiresIn": 900,
    "refreshExpiresIn": 2592000,
    "user": { ... }
  }
}
```

**Error Response** (401):
```json
{
  "success": false,
  "error": {
    "code": "AUTH_REFRESH_TOKEN_EXPIRED",
    "message": "Refresh token has expired. Please login again."
  }
}
```

---

### Logout

```
POST /auth/logout
```

**Headers**: `Authorization`

**Request Body**:
```typescript
{
  refreshToken?: string;  // Logout specific session
  logoutAll?: boolean;    // Logout all devices
}
```

**Example**:
```typescript
const logout = async (logoutAll = false) => {
  const refreshToken = await AsyncStorage.getItem('refreshToken');
  
  await api.post('/auth/logout', logoutAll ? { logoutAll: true } : { refreshToken });
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
};
```

---

### Get Current User

```
GET /auth/me
```

**Headers**: `Authorization`

**Example**:
```typescript
const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+2348012345678",
    "role": "CLIENT",
    "isEmailVerified": true,
    "is2FAEnabled": false,
    "profilePicture": "https://...",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### List Active Sessions

```
GET /auth/sessions
```

**Headers**: `Authorization`

**Example**:
```typescript
const getSessions = async () => {
  const response = await api.get('/auth/sessions');
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "session-uuid",
      "deviceInfo": "iPhone 15 Pro - iOS 17.2",
      "deviceId": "device-uuid",
      "lastActiveAt": "2024-01-20T15:30:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "isCurrent": true
    },
    {
      "id": "session-uuid-2",
      "deviceInfo": "Samsung Galaxy S24",
      "deviceId": "device-uuid-2",
      "lastActiveAt": "2024-01-18T12:00:00.000Z",
      "createdAt": "2024-01-10T08:00:00.000Z",
      "isCurrent": false
    }
  ]
}
```

---

### Revoke Session

```
POST /auth/sessions/revoke
```

**Headers**: `Authorization`

**Request Body**:
```typescript
{
  sessionId?: string;  // Revoke specific session
  deviceId?: string;   // Revoke by device ID
}
```

**Example**:
```typescript
const revokeSession = async (sessionId: string) => {
  await api.post('/auth/sessions/revoke', { sessionId });
};
```

---

### Request OTP (Email Verification)

```
POST /auth/otp/request
```

**Headers**: `Authorization`

**Request Body**:
```typescript
{
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION';
}
```

**Example**:
```typescript
const requestOTP = async () => {
  await api.post('/auth/otp/request', { type: 'EMAIL_VERIFICATION' });
};
```

---

### Verify OTP

```
POST /auth/otp/verify
```

**Request Body**:
```typescript
{
  code: string;  // 6-digit OTP
  type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION';
}
```

---

### Setup 2FA

```
POST /auth/2fa/setup
```

**Headers**: `Authorization`

**Example**:
```typescript
const setup2FA = async () => {
  const response = await api.post('/auth/2fa/setup');
  // Display QR code to user
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "otpauth://totp/4zeeproperties:john@example.com?secret=JBSWY3DPEHPK3PXP&issuer=4zeeproperties"
  }
}
```

---

### Enable 2FA

```
POST /auth/2fa/enable
```

**Headers**: `Authorization`

**Request Body**:
```typescript
{
  code: string;  // 6-digit TOTP from authenticator app
}
```

---

### Disable 2FA

```
POST /auth/2fa/disable
```

**Headers**: `Authorization`

**Request Body**:
```typescript
{
  code: string;  // 6-digit TOTP
}
```

---

### Forgot Password

```
POST /auth/forgot-password
```

**Request Body**:
```typescript
{
  email: string;
}
```

---

### Reset Password

```
POST /auth/reset-password
```

**Request Body**:
```typescript
{
  token: string;      // From email link
  newPassword: string;
}
```

---

## Properties

### Search Properties

```
GET /properties/search
```

**Headers**: None required (public endpoint)

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | No | Search query (title, location) |
| `city` | string | No | Filter by city |
| `state` | string | No | Filter by state |
| `type` | string | No | LAND, HOUSE, APARTMENT, COMMERCIAL |
| `minPrice` | number | No | Minimum price in kobo |
| `maxPrice` | number | No | Maximum price in kobo |
| `bedrooms` | number | No | Number of bedrooms |
| `bathrooms` | number | No | Number of bathrooms |
| `availability` | string | No | AVAILABLE, SOLD, RESERVED |
| `limit` | number | No | Items per page (default: 20, max: 100) |
| `cursor` | string | No | Cursor for next page |
| `page` | number | No | Page number (fallback) |
| `sortBy` | string | No | price, createdAt, viewCount |
| `sortOrder` | string | No | asc, desc |

**Example**:
```typescript
interface PropertyFilters {
  q?: string;
  city?: string;
  state?: string;
  type?: 'LAND' | 'HOUSE' | 'APARTMENT' | 'COMMERCIAL';
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  limit?: number;
  cursor?: string;
}

const searchProperties = async (filters: PropertyFilters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, String(value));
  });
  
  const response = await api.get(`/properties/search?${params}`);
  return response.data;
};

// Usage with infinite scroll
const [properties, setProperties] = useState([]);
const [cursor, setCursor] = useState<string | null>(null);
const [hasMore, setHasMore] = useState(true);

const loadMore = async () => {
  const result = await searchProperties({ 
    city: 'Lagos', 
    type: 'APARTMENT',
    limit: 20,
    cursor: cursor || undefined 
  });
  
  setProperties(prev => [...prev, ...result.items]);
  setCursor(result.pagination.nextCursor);
  setHasMore(result.pagination.hasNext);
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "prop-uuid-1",
        "title": "3 Bedroom Apartment in Lekki",
        "description": "Luxury apartment with ocean view...",
        "type": "APARTMENT",
        "price": 45000000,
        "location": "Lekki Phase 1",
        "city": "Lagos",
        "state": "Lagos",
        "address": "123 Admiralty Way",
        "bedrooms": 3,
        "bathrooms": 3,
        "area": 150,
        "amenities": ["Swimming Pool", "Gym", "24/7 Security"],
        "images": [
          "https://storage.4zeeproperties.com/properties/img1.jpg",
          "https://storage.4zeeproperties.com/properties/img2.jpg"
        ],
        "availability": "AVAILABLE",
        "isFeatured": true,
        "viewCount": 156,
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "pagination": {
      "limit": 20,
      "hasNext": true,
      "hasPrev": false,
      "nextCursor": "prop-uuid-20",
      "total": 150
    }
  }
}
```

---

### Get Property Details

```
GET /properties/:id
```

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Property UUID |

**Example**:
```typescript
const getProperty = async (id: string) => {
  const response = await api.get(`/properties/${id}`);
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "prop-uuid-1",
    "title": "3 Bedroom Apartment in Lekki",
    "description": "Luxury apartment with ocean view. Features include:\n- Modern kitchen\n- Spacious living room\n- Master bedroom with ensuite",
    "type": "APARTMENT",
    "price": 45000000,
    "location": "Lekki Phase 1",
    "city": "Lagos",
    "state": "Lagos",
    "address": "123 Admiralty Way, Lekki Phase 1",
    "coordinates": {
      "lat": 6.4281,
      "lng": 3.4219
    },
    "bedrooms": 3,
    "bathrooms": 3,
    "toilets": 4,
    "area": 150,
    "amenities": ["Swimming Pool", "Gym", "24/7 Security", "CCTV", "Parking"],
    "images": [
      "https://storage.4zeeproperties.com/properties/img1.jpg",
      "https://storage.4zeeproperties.com/properties/img2.jpg",
      "https://storage.4zeeproperties.com/properties/img3.jpg"
    ],
    "videoUrl": "https://youtube.com/watch?v=...",
    "virtualTourUrl": "https://matterport.com/...",
    "availability": "AVAILABLE",
    "isFeatured": true,
    "viewCount": 156,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-20T15:00:00.000Z"
  }
}
```

---

### Get Featured Properties

```
GET /properties/featured
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Max items to return |

**Example**:
```typescript
const getFeaturedProperties = async (limit = 10) => {
  const response = await api.get(`/properties/featured?limit=${limit}`);
  return response.data;
};
```

---

### List All Properties

```
GET /properties
```

**Query Parameters**: Same as search

---

## Applications

### Create Application

```
POST /applications
```

**Headers**: `Authorization`, `Idempotency-Key`

**Required Role**: CLIENT

**Request Body**:
```typescript
{
  propertyId: string;
  realtorId?: string;  // Optional: if referred by a realtor
}
```

**Example**:
```typescript
const createApplication = async (propertyId: string, realtorId?: string) => {
  const response = await api.post('/applications', {
    propertyId,
    realtorId,
  });
  return response.data;
};
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "app-uuid-1",
    "status": "PENDING",
    "paymentStatus": "UNPAID",
    "propertyId": "prop-uuid-1",
    "clientId": "client-uuid-1",
    "realtorId": "realtor-uuid-1",
    "createdAt": "2024-01-20T10:00:00.000Z",
    "property": {
      "id": "prop-uuid-1",
      "title": "3 Bedroom Apartment in Lekki",
      "price": 45000000
    }
  }
}
```

**Error Response** (400):
```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_OPERATION_FAILED",
    "message": "Property is not available"
  }
}
```

---

### Get My Applications

```
GET /applications/me
```

**Headers**: `Authorization`

**Required Role**: CLIENT

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Items per page |
| `cursor` | string | - | Cursor for pagination |

**Example**:
```typescript
const getMyApplications = async (cursor?: string) => {
  const params = cursor ? `?cursor=${cursor}&limit=20` : '?limit=20';
  const response = await api.get(`/applications/me${params}`);
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "app-uuid-1",
        "status": "APPROVED",
        "paymentStatus": "UNPAID",
        "createdAt": "2024-01-20T10:00:00.000Z",
        "property": {
          "id": "prop-uuid-1",
          "title": "3 Bedroom Apartment in Lekki",
          "price": 45000000,
          "images": ["https://..."],
          "availability": "AVAILABLE"
        },
        "realtor": {
          "id": "realtor-uuid-1",
          "user": {
            "firstName": "Jane",
            "lastName": "Smith"
          }
        }
      }
    ],
    "pagination": {
      "limit": 20,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### Get Application Details

```
GET /applications/:id
```

**Headers**: `Authorization`

**Required Role**: CLIENT (own), REALTOR (assigned), ADMIN

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Application UUID |

**Example**:
```typescript
const getApplication = async (id: string) => {
  const response = await api.get(`/applications/${id}`);
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "app-uuid-1",
    "status": "APPROVED",
    "paymentStatus": "UNPAID",
    "createdAt": "2024-01-20T10:00:00.000Z",
    "updatedAt": "2024-01-21T09:00:00.000Z",
    "property": {
      "id": "prop-uuid-1",
      "title": "3 Bedroom Apartment in Lekki",
      "price": 45000000,
      "type": "APARTMENT",
      "location": "Lekki Phase 1",
      "images": ["https://..."]
    },
    "client": {
      "id": "client-uuid-1",
      "user": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+2348012345678"
      }
    },
    "realtor": {
      "id": "realtor-uuid-1",
      "user": {
        "firstName": "Jane",
        "lastName": "Smith"
      }
    },
    "payment": null
  }
}
```

---

## Payments

### Initiate Payment

```
POST /payments/initiate
```

**Headers**: `Authorization`, `Idempotency-Key`

**Required Role**: CLIENT

**Request Body**:
```typescript
{
  applicationId: string;
}
```

**Example**:
```typescript
import { WebView } from 'react-native-webview';

const initiatePayment = async (applicationId: string) => {
  const response = await api.post('/payments/initiate', { applicationId });
  return response.data;
};

// Usage
const PaymentScreen = ({ applicationId }) => {
  const [paymentUrl, setPaymentUrl] = useState(null);
  
  const handlePayment = async () => {
    const { authorizationUrl, reference } = await initiatePayment(applicationId);
    setPaymentUrl(authorizationUrl);
    // Store reference for polling
    await AsyncStorage.setItem('pendingPaymentRef', reference);
  };
  
  if (paymentUrl) {
    return (
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={(navState) => {
          if (navState.url.includes('callback') || navState.url.includes('close')) {
            // Payment completed or cancelled
            setPaymentUrl(null);
            pollPaymentStatus();
          }
        }}
      />
    );
  }
  
  return <Button onPress={handlePayment} title="Pay Now" />;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/abc123xyz",
    "reference": "PAY-1706612400-abc123",
    "accessCode": "abc123xyz"
  }
}
```

---

### Poll Payment Status

```
GET /payments/:reference/status
```

**Headers**: `Authorization`

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `reference` | string | Payment reference |

**Example**:
```typescript
const pollPaymentStatus = async (reference: string): Promise<PaymentStatus> => {
  const maxAttempts = 30;
  const delayMs = 2000;
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await api.get(`/payments/${reference}/status`);
    const { status, saleId, failureReason } = response.data;
    
    if (status === 'SUCCESS') {
      return { success: true, saleId };
    }
    
    if (status === 'FAILED') {
      return { success: false, error: failureReason };
    }
    
    // Status is still INITIATED, wait and retry
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  return { success: false, error: 'Payment verification timeout' };
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "reference": "PAY-1706612400-abc123",
    "status": "SUCCESS",
    "saleId": "sale-uuid-1",
    "paidAt": "2024-01-20T10:05:00.000Z",
    "failureReason": null
  }
}
```

**Pending Response** (200):
```json
{
  "success": true,
  "data": {
    "reference": "PAY-1706612400-abc123",
    "status": "INITIATED",
    "saleId": null,
    "paidAt": null,
    "failureReason": null
  }
}
```

---

### Get Payment Details

```
GET /payments/:reference
```

**Headers**: `Authorization`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "payment-uuid-1",
    "reference": "PAY-1706612400-abc123",
    "amount": 45000000,
    "status": "SUCCESS",
    "channel": "card",
    "paidAt": "2024-01-20T10:05:00.000Z",
    "application": {
      "id": "app-uuid-1",
      "property": {
        "title": "3 Bedroom Apartment in Lekki"
      }
    }
  }
}
```

---

### Get My Payments

```
GET /payments/me
```

**Headers**: `Authorization`

**Required Role**: CLIENT

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 20 | Items per page |
| `cursor` | string | - | Cursor for pagination |

---

## Documents

### Get Application Documents

```
GET /documents/application/:applicationId
```

**Headers**: `Authorization`

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `applicationId` | string | Application UUID |

**Example**:
```typescript
const getApplicationDocuments = async (applicationId: string) => {
  const response = await api.get(`/documents/application/${applicationId}`);
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-uuid-1",
      "type": "RECEIPT",
      "filename": "receipt_PAY-1706612400-abc123.pdf",
      "mimeType": "application/pdf",
      "size": 125000,
      "createdAt": "2024-01-20T10:10:00.000Z"
    },
    {
      "id": "doc-uuid-2",
      "type": "AGREEMENT",
      "filename": "sales_agreement_app-uuid-1.pdf",
      "mimeType": "application/pdf",
      "size": 250000,
      "createdAt": "2024-01-20T10:10:00.000Z"
    }
  ]
}
```

---

### Download Document

```
GET /documents/:id/download
```

**Headers**: `Authorization`

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Document UUID |

**Example (React Native)**:
```typescript
import RNFetchBlob from 'rn-fetch-blob';
import { Platform, PermissionsAndroid } from 'react-native';

const downloadDocument = async (documentId: string, filename: string) => {
  const accessToken = await AsyncStorage.getItem('accessToken');
  const { dirs } = RNFetchBlob.fs;
  
  // Request permission on Android
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Storage permission denied');
    }
  }
  
  const downloadDir = Platform.OS === 'ios' ? dirs.DocumentDir : dirs.DownloadDir;
  const filePath = `${downloadDir}/${filename}`;
  
  const response = await RNFetchBlob.config({
    fileCache: true,
    path: filePath,
    addAndroidDownloads: {
      useDownloadManager: true,
      notification: true,
      title: filename,
      description: 'Downloading document...',
      path: filePath,
    },
  }).fetch('GET', `${API_BASE_URL}/documents/${documentId}/download`, {
    Authorization: `Bearer ${accessToken}`,
  });
  
  return response.path();
};
```

---

## Notifications

### Get My Notifications

```
GET /notifications
```

**Headers**: `Authorization`

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `unreadOnly` | boolean | false | Filter unread only |
| `limit` | number | 20 | Items per page (max 50) |
| `cursor` | string | - | Cursor for pagination |

**Example**:
```typescript
const getNotifications = async (unreadOnly = false, cursor?: string) => {
  const params = new URLSearchParams({
    unreadOnly: String(unreadOnly),
    limit: '20',
  });
  if (cursor) params.append('cursor', cursor);
  
  const response = await api.get(`/notifications?${params}`);
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif-uuid-1",
        "type": "APPLICATION_STATUS",
        "title": "Application Approved",
        "message": "Your application for '3 Bedroom Apartment in Lekki' has been approved.",
        "data": {
          "applicationId": "app-uuid-1",
          "status": "APPROVED",
          "propertyTitle": "3 Bedroom Apartment in Lekki"
        },
        "isRead": false,
        "createdAt": "2024-01-21T09:00:00.000Z"
      }
    ],
    "unreadCount": 5
  }
}
```

---

### Get Unread Count

```
GET /notifications/unread-count
```

**Headers**: `Authorization`

**Example**:
```typescript
const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data.unreadCount;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

---

### Mark as Read

```
PATCH /notifications/:id/read
```

**Headers**: `Authorization`

**Example**:
```typescript
const markAsRead = async (notificationId: string) => {
  await api.patch(`/notifications/${notificationId}/read`);
};
```

---

### Mark All as Read

```
PATCH /notifications/read-all
```

**Headers**: `Authorization`

**Example**:
```typescript
const markAllAsRead = async () => {
  await api.patch('/notifications/read-all');
};
```

---

### Delete Notification

```
DELETE /notifications/:id
```

**Headers**: `Authorization`

---

### Get Notification Preferences

```
GET /notifications/preferences
```

**Headers**: `Authorization`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "emailNotifications": true,
    "pushNotifications": true,
    "smsNotifications": false,
    "applicationUpdates": true,
    "paymentAlerts": true,
    "promotionalEmails": false
  }
}
```

---

### Update Notification Preferences

```
PATCH /notifications/preferences
```

**Headers**: `Authorization`

**Request Body**:
```typescript
{
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  applicationUpdates?: boolean;
  paymentAlerts?: boolean;
  promotionalEmails?: boolean;
}
```

---

### Register Device for Push Notifications

```
POST /notifications/device
```

**Headers**: `Authorization`

**Request Body**:
```typescript
{
  deviceId: string;       // Unique device identifier
  pushToken: string;      // FCM (Android) or APNs (iOS) token
  platform: 'ios' | 'android' | 'web';
  deviceName?: string;    // e.g., "iPhone 15 Pro"
  appVersion?: string;    // e.g., "1.0.0"
}
```

**Example**:
```typescript
import messaging from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';

const registerDevice = async () => {
  // Get FCM token
  const pushToken = await messaging().getToken();
  const deviceId = await DeviceInfo.getUniqueId();
  const deviceName = await DeviceInfo.getDeviceName();
  const appVersion = DeviceInfo.getVersion();
  
  await api.post('/notifications/device', {
    deviceId,
    pushToken,
    platform: Platform.OS,
    deviceName,
    appVersion,
  });
};

// Call after login and when token refreshes
useEffect(() => {
  registerDevice();
  
  // Listen for token refresh
  const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
    const deviceId = await DeviceInfo.getUniqueId();
    await api.patch(`/notifications/device/${deviceId}`, { pushToken: newToken });
  });
  
  return unsubscribe;
}, []);
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "deviceId": "device-uuid",
    "deviceType": "ios",
    "deviceName": "iPhone 15 Pro",
    "isActive": true,
    "createdAt": "2024-01-20T10:00:00.000Z"
  }
}
```

---

### Update Push Token

```
PATCH /notifications/device/:deviceId
```

**Headers**: `Authorization`

**Request Body**:
```typescript
{
  pushToken: string;
}
```

---

### Unregister Device

```
DELETE /notifications/device/:deviceId
```

**Headers**: `Authorization`

Call this when user logs out or disables notifications.

**Example**:
```typescript
const unregisterDevice = async () => {
  const deviceId = await DeviceInfo.getUniqueId();
  await api.delete(`/notifications/device/${deviceId}`);
};

// Call during logout
const logout = async () => {
  await unregisterDevice();
  await api.post('/auth/logout', { logoutAll: false });
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
};
```

---

### List Registered Devices

```
GET /notifications/devices
```

**Headers**: `Authorization`

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "deviceId": "device-uuid-1",
      "deviceType": "ios",
      "deviceName": "iPhone 15 Pro",
      "appVersion": "1.0.0",
      "lastActiveAt": "2024-01-20T15:00:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

## User Profile

### Update Profile

```
PATCH /clients/profile
```

**Headers**: `Authorization`

**Required Role**: CLIENT

**Request Body**:
```typescript
{
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  dateOfBirth?: string;  // ISO date: "1990-01-15"
}
```

**Example**:
```typescript
const updateProfile = async (data: Partial<Profile>) => {
  const response = await api.patch('/clients/profile', data);
  return response.data;
};
```

---

### Upload Profile Picture

```
POST /uploads/profile-picture
```

**Headers**: `Authorization`, `Content-Type: multipart/form-data`

**Request Body**: FormData with `file` field

**Example**:
```typescript
import { launchImageLibrary } from 'react-native-image-picker';

const uploadProfilePicture = async () => {
  const result = await launchImageLibrary({
    mediaType: 'photo',
    maxWidth: 500,
    maxHeight: 500,
    quality: 0.8,
  });
  
  if (result.assets?.[0]) {
    const asset = result.assets[0];
    const formData = new FormData();
    formData.append('file', {
      uri: asset.uri,
      type: asset.type,
      name: asset.fileName || 'profile.jpg',
    });
    
    const response = await api.post('/uploads/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data.url;
  }
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "url": "https://storage.4zeeproperties.com/profiles/user-uuid.jpg"
  }
}
```

---

## KYC

### Get KYC Status

```
GET /kyc
```

**Headers**: `Authorization`

**Example**:
```typescript
const getKYCStatus = async () => {
  const response = await api.get('/kyc');
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "kyc-uuid-1",
    "status": "PENDING",
    "idType": "NIN",
    "idNumber": "12345678901",
    "idDocumentUrl": "https://storage.4zeeproperties.com/kyc/...",
    "selfieUrl": "https://storage.4zeeproperties.com/kyc/...",
    "proofOfAddressUrl": null,
    "rejectionReason": null,
    "submittedAt": "2024-01-20T10:00:00.000Z",
    "verifiedAt": null
  }
}
```

---

### Submit KYC

```
PUT /kyc
```

**Headers**: `Authorization`, `Idempotency-Key`

**Request Body**:
```typescript
{
  idType: 'NIN' | 'BVN' | 'DRIVERS_LICENSE' | 'INTERNATIONAL_PASSPORT' | 'VOTERS_CARD';
  idNumber: string;
  idDocumentUrl: string;     // Upload first via /uploads
  selfieUrl: string;         // Upload first via /uploads
  proofOfAddressUrl?: string; // Optional
}
```

**Example**:
```typescript
const submitKYC = async (kycData: KYCSubmission) => {
  // First upload documents
  const idDocUrl = await uploadDocument(idDocumentFile, 'kyc');
  const selfieUrl = await uploadDocument(selfieFile, 'kyc');
  
  const response = await api.put('/kyc', {
    idType: 'NIN',
    idNumber: '12345678901',
    idDocumentUrl: idDocUrl,
    selfieUrl: selfieUrl,
  });
  
  return response.data;
};
```

---

### Upload KYC Document

```
POST /uploads/kyc
```

**Headers**: `Authorization`, `Content-Type: multipart/form-data`

**Request Body**: FormData with `file` field

**Example**:
```typescript
const uploadKYCDocument = async (file: Asset) => {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    type: file.type || 'image/jpeg',
    name: file.fileName || 'document.jpg',
  });
  
  const response = await api.post('/uploads/kyc', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  
  return response.data.url;
};
```

---

## Bank Accounts

### List My Bank Accounts

```
GET /bank-accounts
```

**Headers**: `Authorization`

**Required Role**: REALTOR

**Example**:
```typescript
const getBankAccounts = async () => {
  const response = await api.get('/bank-accounts');
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "bank-uuid-1",
      "bankName": "GTBank",
      "bankCode": "058",
      "accountNumber": "0123456789",
      "accountName": "John Doe",
      "isDefault": true,
      "isVerified": true,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### Add Bank Account

```
POST /bank-accounts
```

**Headers**: `Authorization`, `Idempotency-Key`

**Required Role**: REALTOR

**Request Body**:
```typescript
{
  bankCode: string;       // Bank code (e.g., "058" for GTBank)
  accountNumber: string;  // 10-digit account number
  isDefault?: boolean;    // Set as default for payouts
}
```

**Example**:
```typescript
const addBankAccount = async (bankCode: string, accountNumber: string) => {
  const response = await api.post('/bank-accounts', {
    bankCode,
    accountNumber,
    isDefault: true,
  });
  return response.data;
};
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "bank-uuid-1",
    "bankName": "GTBank",
    "bankCode": "058",
    "accountNumber": "0123456789",
    "accountName": "John Doe",
    "isDefault": true,
    "isVerified": true
  }
}
```

---

### Get Bank List

```
GET /bank-accounts/banks
```

**Headers**: `Authorization`

**Example**:
```typescript
const getBankList = async () => {
  const response = await api.get('/bank-accounts/banks');
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    { "name": "Access Bank", "code": "044" },
    { "name": "First Bank", "code": "011" },
    { "name": "GTBank", "code": "058" },
    { "name": "UBA", "code": "033" },
    { "name": "Zenith Bank", "code": "057" }
  ]
}
```

---

### Verify Account Number

```
POST /bank-accounts/verify
```

**Headers**: `Authorization`

**Request Body**:
```typescript
{
  bankCode: string;
  accountNumber: string;
}
```

**Example**:
```typescript
const verifyAccount = async (bankCode: string, accountNumber: string) => {
  const response = await api.post('/bank-accounts/verify', {
    bankCode,
    accountNumber,
  });
  return response.data.accountName;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "accountNumber": "0123456789",
    "accountName": "JOHN DOE",
    "bankCode": "058"
  }
}
```

---

### Set Default Bank Account

```
PATCH /bank-accounts/:id/default
```

**Headers**: `Authorization`

---

### Delete Bank Account

```
DELETE /bank-accounts/:id
```

**Headers**: `Authorization`

---

## Commissions (Realtor)

### Get My Commissions

```
GET /commissions/my-commissions
```

**Headers**: `Authorization`

**Required Role**: REALTOR

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | PENDING, APPROVED, PAID, CANCELLED |
| `type` | string | DIRECT, REFERRAL |
| `limit` | number | Items per page |
| `cursor` | string | Cursor for pagination |

**Example**:
```typescript
const getMyCommissions = async (status?: string, cursor?: string) => {
  const params = new URLSearchParams({ limit: '20' });
  if (status) params.append('status', status);
  if (cursor) params.append('cursor', cursor);
  
  const response = await api.get(`/commissions/my-commissions?${params}`);
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "comm-uuid-1",
        "amount": 2250000,
        "rate": 0.05,
        "type": "DIRECT",
        "status": "APPROVED",
        "createdAt": "2024-01-20T10:00:00.000Z",
        "sale": {
          "id": "sale-uuid-1",
          "amount": 45000000,
          "property": {
            "title": "3 Bedroom Apartment in Lekki"
          },
          "client": {
            "user": {
              "firstName": "John",
              "lastName": "Doe"
            }
          }
        }
      }
    ],
    "pagination": {
      "limit": 20,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### Get Commission Summary

```
GET /commissions/my-summary
```

**Headers**: `Authorization`

**Required Role**: REALTOR

**Example**:
```typescript
const getCommissionSummary = async () => {
  const response = await api.get('/commissions/my-summary');
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "pending": {
      "count": 2,
      "amount": 4500000
    },
    "approved": {
      "count": 3,
      "amount": 6750000
    },
    "paid": {
      "count": 10,
      "amount": 22500000
    },
    "total": {
      "count": 15,
      "amount": 33750000
    }
  }
}
```

---

### Get Commission Details

```
GET /commissions/:id
```

**Headers**: `Authorization`

**Required Role**: REALTOR (own), ADMIN

---

## Payouts (Realtor)

### Get My Payouts

```
GET /payouts/me
```

**Headers**: `Authorization`

**Required Role**: REALTOR

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | PENDING, PROCESSING, COMPLETED, FAILED |
| `limit` | number | Items per page |
| `cursor` | string | Cursor for pagination |

**Example**:
```typescript
const getMyPayouts = async (cursor?: string) => {
  const params = cursor ? `?cursor=${cursor}&limit=20` : '?limit=20';
  const response = await api.get(`/payouts/me${params}`);
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "payout-uuid-1",
        "amount": 6750000,
        "status": "COMPLETED",
        "bankAccount": {
          "bankName": "GTBank",
          "accountNumber": "0123456789",
          "accountName": "John Doe"
        },
        "processedAt": "2024-01-25T14:00:00.000Z",
        "createdAt": "2024-01-25T10:00:00.000Z"
      }
    ],
    "pagination": {
      "limit": 20,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### Request Payout

```
POST /payouts
```

**Headers**: `Authorization`, `Idempotency-Key`

**Required Role**: REALTOR

**Request Body**:
```typescript
{
  amount: number;          // Amount in kobo
  bankAccountId?: string;  // Optional: defaults to default bank account
}
```

**Example**:
```typescript
const requestPayout = async (amount: number, bankAccountId?: string) => {
  const response = await api.post('/payouts', {
    amount,
    bankAccountId,
  });
  return response.data;
};
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "payout-uuid-1",
    "amount": 6750000,
    "status": "PENDING",
    "bankAccount": {
      "bankName": "GTBank",
      "accountNumber": "0123456789"
    },
    "createdAt": "2024-01-25T10:00:00.000Z"
  }
}
```

**Error Response** (400):
```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_OPERATION_FAILED",
    "message": "Insufficient approved commission balance"
  }
}
```

---

### Get Payout Balance

```
GET /payouts/balance
```

**Headers**: `Authorization`

**Required Role**: REALTOR

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "availableBalance": 6750000,
    "pendingPayouts": 0,
    "totalEarned": 33750000,
    "totalPaidOut": 27000000
  }
}
```

---

## Referrals (Realtor)

### Get My Referral Info

```
GET /referrals/my-info
```

**Headers**: `Authorization`

**Required Role**: REALTOR

**Example**:
```typescript
const getMyReferralInfo = async () => {
  const response = await api.get('/referrals/my-info');
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "referralCode": "JOHN123",
    "referralLink": "https://4zeeproperties.com/register?ref=JOHN123",
    "totalReferrals": 5,
    "activeReferrals": 3,
    "totalReferralEarnings": 4500000
  }
}
```

---

### Get My Referrals

```
GET /referrals/my-referrals
```

**Headers**: `Authorization`

**Required Role**: REALTOR

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "realtor-uuid-2",
      "user": {
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com"
      },
      "totalSales": 3,
      "totalSalesAmount": 135000000,
      "yourEarnings": 2700000,
      "joinedAt": "2024-01-10T10:00:00.000Z"
    }
  ]
}
```

---

## Support Tickets

### Create Support Ticket

```
POST /support-tickets
```

**Headers**: `Authorization`, `Idempotency-Key`

**Request Body**:
```typescript
{
  subject: string;
  message: string;
  category: 'GENERAL' | 'PAYMENT' | 'PROPERTY' | 'ACCOUNT' | 'TECHNICAL';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  attachments?: string[];  // URLs from uploads
}
```

**Example**:
```typescript
const createTicket = async (data: TicketData) => {
  const response = await api.post('/support-tickets', data);
  return response.data;
};
```

**Success Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "ticket-uuid-1",
    "ticketNumber": "TKT-2024-0001",
    "subject": "Payment Issue",
    "status": "OPEN",
    "priority": "HIGH",
    "category": "PAYMENT",
    "createdAt": "2024-01-20T10:00:00.000Z"
  }
}
```

---

### Get My Tickets

```
GET /support-tickets/me
```

**Headers**: `Authorization`

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | OPEN, IN_PROGRESS, RESOLVED, CLOSED |
| `limit` | number | Items per page |
| `cursor` | string | Cursor for pagination |

---

### Get Ticket Details

```
GET /support-tickets/:id
```

**Headers**: `Authorization`

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "ticket-uuid-1",
    "ticketNumber": "TKT-2024-0001",
    "subject": "Payment Issue",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "category": "PAYMENT",
    "createdAt": "2024-01-20T10:00:00.000Z",
    "messages": [
      {
        "id": "msg-uuid-1",
        "content": "I made a payment but it's not reflecting...",
        "isStaff": false,
        "createdAt": "2024-01-20T10:00:00.000Z"
      },
      {
        "id": "msg-uuid-2",
        "content": "Thank you for contacting us. We're looking into this...",
        "isStaff": true,
        "staffName": "Support Team",
        "createdAt": "2024-01-20T11:00:00.000Z"
      }
    ]
  }
}
```

---

### Reply to Ticket

```
POST /support-tickets/:id/reply
```

**Headers**: `Authorization`

**Request Body**:
```typescript
{
  message: string;
  attachments?: string[];
}
```

---

### Close Ticket

```
PATCH /support-tickets/:id/close
```

**Headers**: `Authorization`

---

## Messaging

### Get Conversations

```
GET /messaging/conversations
```

**Headers**: `Authorization`

**Success Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "conv-uuid-1",
      "participant": {
        "id": "user-uuid-2",
        "firstName": "Jane",
        "lastName": "Smith",
        "profilePicture": "https://..."
      },
      "lastMessage": {
        "content": "Thank you for your interest!",
        "createdAt": "2024-01-20T15:00:00.000Z",
        "isRead": true
      },
      "unreadCount": 0
    }
  ]
}
```

---

### Get Conversation Messages

```
GET /messaging/conversations/:id/messages
```

**Headers**: `Authorization`

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Items per page |
| `cursor` | string | Cursor for pagination |

---

### Send Message

```
POST /messaging/conversations/:id/messages
```

**Headers**: `Authorization`

**Request Body**:
```typescript
{
  content: string;
  attachments?: string[];
}
```

---

### Start Conversation

```
POST /messaging/conversations
```

**Headers**: `Authorization`

**Request Body**:
```typescript
{
  participantId: string;
  message: string;
}
```

---

## Dashboard

### Client Dashboard

```
GET /dashboard/client
```

**Headers**: `Authorization`

**Required Role**: CLIENT

**Example**:
```typescript
const getClientDashboard = async () => {
  const response = await api.get('/dashboard/client');
  return response.data;
};
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "applications": {
      "total": 5,
      "pending": 1,
      "approved": 2,
      "rejected": 2
    },
    "purchases": {
      "total": 2,
      "totalAmount": 90000000
    },
    "recentApplications": [
      {
        "id": "app-uuid-1",
        "status": "APPROVED",
        "property": {
          "title": "3 Bedroom Apartment in Lekki",
          "price": 45000000,
          "images": ["https://..."]
        },
        "createdAt": "2024-01-20T10:00:00.000Z"
      }
    ],
    "featuredProperties": [...]
  }
}
```

---

### Realtor Dashboard

```
GET /dashboard/realtor
```

**Headers**: `Authorization`

**Required Role**: REALTOR

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "sales": {
      "total": 15,
      "thisMonth": 3,
      "totalAmount": 675000000
    },
    "commissions": {
      "pending": 4500000,
      "approved": 6750000,
      "paid": 22500000,
      "total": 33750000
    },
    "referrals": {
      "total": 5,
      "active": 3,
      "earnings": 4500000
    },
    "recentSales": [...],
    "performanceChart": {
      "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      "data": [2, 3, 1, 4, 2, 3]
    }
  }
}
```

---

## Admin Endpoints

*Note: These endpoints require ADMIN role*

### List All Applications

```
GET /admin/applications
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | PENDING, APPROVED, REJECTED |
| `limit` | number | Items per page |
| `cursor` | string | Cursor for pagination |

---

### Approve Application

```
PATCH /admin/applications/:id/approve
```

---

### Reject Application

```
PATCH /admin/applications/:id/reject
```

---

### Create Offline Sale

```
POST /admin/sales/offline
```

**Headers**: `Authorization`, `Idempotency-Key`

**Request Body**:
```typescript
{
  propertyId: string;
  clientId: string;
  realtorId?: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE';
  paymentReference?: string;
  notes?: string;
}
```

---

### List Users

```
GET /admin/users
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `role` | string | CLIENT, REALTOR, ADMIN |
| `search` | string | Search by name/email |
| `limit` | number | Items per page |
| `cursor` | string | Cursor for pagination |

---

### Create Property

```
POST /admin/properties
```

**Request Body**:
```typescript
{
  title: string;
  description: string;
  type: 'LAND' | 'HOUSE' | 'APARTMENT' | 'COMMERCIAL';
  price: number;
  location: string;
  city: string;
  state: string;
  address: string;
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  area?: number;
  amenities?: string[];
  images: string[];
  isFeatured?: boolean;
}
```

---

### Update Property

```
PATCH /admin/properties/:id
```

---

### Delete Property

```
DELETE /admin/properties/:id
```

---

### Verify KYC

```
PATCH /admin/kyc/:id/verify
```

---

### Reject KYC

```
PATCH /admin/kyc/:id/reject
```

**Request Body**:
```typescript
{
  reason: string;
}
```

---

### Approve Commission

```
POST /commissions/approve
```

**Request Body**:
```typescript
{
  commissionIds: string[];
}
```

---

### Mark Commission as Paid

```
POST /commissions/mark-paid
```

**Request Body**:
```typescript
{
  commissionIds: string[];
}
```

---

### Process Payout

```
PATCH /admin/payouts/:id/process
```

---

### Analytics

```
GET /analytics/overview
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | string | Start date (ISO) |
| `to` | string | End date (ISO) |

---

## Error Codes Reference

### Authentication Errors

| Code | HTTP | Description | Action |
|------|------|-------------|--------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Wrong email/password | Show error message |
| `AUTH_TOKEN_EXPIRED` | 401 | Access token expired | Refresh token |
| `AUTH_TOKEN_INVALID` | 401 | Malformed token | Logout and redirect |
| `AUTH_REFRESH_TOKEN_EXPIRED` | 401 | Refresh token expired | Force re-login |
| `AUTH_ACCOUNT_LOCKED` | 401 | Too many failed attempts | Show lockout message |
| `AUTH_2FA_REQUIRED` | 401 | 2FA code needed | Navigate to 2FA screen |
| `AUTH_2FA_INVALID` | 401 | Invalid 2FA code | Show error, allow retry |
| `AUTH_FORBIDDEN` | 403 | Insufficient permissions | Show forbidden message |

### Validation Errors

| Code | HTTP | Description | Action |
|------|------|-------------|--------|
| `VALIDATION_FAILED` | 400 | Input validation failed | Show field errors |

### Resource Errors

| Code | HTTP | Description | Action |
|------|------|-------------|--------|
| `RESOURCE_NOT_FOUND` | 404 | Entity doesn't exist | Navigate back |
| `RESOURCE_ALREADY_EXISTS` | 409 | Duplicate record | Show conflict message |
| `RESOURCE_CONFLICT` | 409 | Concurrent modification | Refresh and retry |

### Business Logic Errors

| Code | HTTP | Description | Action |
|------|------|-------------|--------|
| `BUSINESS_OPERATION_FAILED` | 422 | Business rule violation | Show specific message |
| `BUSINESS_PAYMENT_FAILED` | 422 | Payment error | Show payment error |
| `BUSINESS_KYC_REQUIRED` | 422 | KYC not verified | Navigate to KYC |
| `BUSINESS_INSUFFICIENT_BALANCE` | 422 | Not enough funds | Show balance error |

### Rate Limiting

| Code | HTTP | Description | Action |
|------|------|-------------|--------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Show cooldown message |

### Idempotency

| Code | HTTP | Description | Action |
|------|------|-------------|--------|
| `IDEMPOTENCY_KEY_INVALID` | 400 | Bad key format | Generate new key |
| `IDEMPOTENCY_KEY_REUSED` | 409 | Request in progress | Wait and retry |

### Server Errors

| Code | HTTP | Description | Action |
|------|------|-------------|--------|
| `SERVER_INTERNAL_ERROR` | 500 | Unexpected error | Show generic error |

---

## TypeScript Interfaces

```typescript
// User & Auth
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'CLIENT' | 'REALTOR' | 'ADMIN';
  isEmailVerified: boolean;
  is2FAEnabled: boolean;
  profilePicture?: string;
  createdAt: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  user: User;
}

// Properties
interface Property {
  id: string;
  title: string;
  description: string;
  type: 'LAND' | 'HOUSE' | 'APARTMENT' | 'COMMERCIAL';
  price: number;
  location: string;
  city: string;
  state: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  area?: number;
  amenities: string[];
  images: string[];
  videoUrl?: string;
  virtualTourUrl?: string;
  availability: 'AVAILABLE' | 'SOLD' | 'RESERVED';
  isFeatured: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

// Applications
interface Application {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  paymentStatus: 'UNPAID' | 'PAID';
  propertyId: string;
  clientId: string;
  realtorId?: string;
  property: Property;
  client?: Client;
  realtor?: Realtor;
  payment?: Payment;
  createdAt: string;
  updatedAt: string;
}

// Payments
interface Payment {
  id: string;
  reference: string;
  amount: number;
  status: 'INITIATED' | 'SUCCESS' | 'FAILED';
  channel?: string;
  paidAt?: string;
  createdAt: string;
}

interface PaymentStatus {
  reference: string;
  status: 'INITIATED' | 'SUCCESS' | 'FAILED';
  saleId?: string;
  paidAt?: string;
  failureReason?: string;
}

// Documents
interface Document {
  id: string;
  type: 'RECEIPT' | 'AGREEMENT' | 'DEED' | 'OTHER';
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

// Notifications
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// KYC
interface KYC {
  id: string;
  status: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  idType?: 'NIN' | 'BVN' | 'DRIVERS_LICENSE' | 'INTERNATIONAL_PASSPORT' | 'VOTERS_CARD';
  idNumber?: string;
  idDocumentUrl?: string;
  selfieUrl?: string;
  proofOfAddressUrl?: string;
  rejectionReason?: string;
  submittedAt?: string;
  verifiedAt?: string;
}

// Bank Accounts
interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

// Commissions
interface Commission {
  id: string;
  amount: number;
  rate: number;
  type: 'DIRECT' | 'REFERRAL';
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  sale: Sale;
  createdAt: string;
}

// Payouts
interface Payout {
  id: string;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  bankAccount: BankAccount;
  processedAt?: string;
  createdAt: string;
}

// Pagination
interface PaginationMeta {
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  total?: number;
  page?: number;
  totalPages?: number;
}

interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// API Response
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: {
    requestId: string;
    timestamp: string;
    version: string;
    pagination?: PaginationMeta;
  };
}

interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}
```

---

## Quick Reference

### Common Patterns

```typescript
// Infinite scroll with cursor pagination
const useInfiniteList = <T>(fetchFn: (cursor?: string) => Promise<PaginatedResponse<T>>) => {
  const [items, setItems] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const result = await fetchFn(cursor);
      setItems(prev => [...prev, ...result.items]);
      setCursor(result.pagination.nextCursor);
      setHasMore(result.pagination.hasNext);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setItems([]);
    setCursor(undefined);
    setHasMore(true);
    await loadMore();
  };

  return { items, loading, hasMore, loadMore, refresh };
};

// Error handling
const handleApiError = (error: ApiError) => {
  switch (error.code) {
    case 'AUTH_TOKEN_EXPIRED':
      // Handled by interceptor
      break;
    case 'AUTH_REFRESH_TOKEN_EXPIRED':
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      break;
    case 'VALIDATION_FAILED':
      // Show field errors
      break;
    case 'RATE_LIMIT_EXCEEDED':
      Alert.alert('Too Many Requests', 'Please wait a moment and try again.');
      break;
    default:
      Alert.alert('Error', error.message);
  }
};
```

---

**Document Version**: 1.0.0  
**API Version**: 1.0.0  
**Generated**: February 2026
