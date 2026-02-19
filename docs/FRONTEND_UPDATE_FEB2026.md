# Frontend Update - February 2026

## Summary
- Realtor signup now requires **firstName** and **lastName**
- Realtors can now **create and manage property listings**
- KYC verification added (manual admin review for now, auto-verification ready)

---

## 1. Realtor Registration Update

### Request
```http
POST /auth/register
```

```json
{
  "email": "agent@example.com",
  "password": "SecurePass123!",
  "role": "REALTOR",
  "firstName": "John",      // ← REQUIRED for REALTOR
  "lastName": "Adewale",    // ← REQUIRED for REALTOR
  "dob": "1990-05-15",
  "phone": "+2348012345678", // optional
  "referralCode": "REF-XXX"  // optional
}
```

### Validation
- `firstName` and `lastName` are **required** for REALTOR registration
- Returns `400 Bad Request` if missing

---

## 2. Realtor Property Listings (NEW)

Realtors can now add and manage their own property listings.

### Get My Listings
```http
GET /realtor/listings
Authorization: Bearer {token}
```

### Get Listing Stats
```http
GET /realtor/listings/stats
Authorization: Bearer {token}
```

**Response:**
```json
{
  "total": 5,
  "available": 3,
  "reserved": 1,
  "sold": 1,
  "totalViews": 234
}
```

### Create Listing
```http
POST /realtor/listings
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "title": "3 Bedroom Duplex in Lekki",
  "description": "Luxury duplex with modern finishes...",
  "location": "Lekki Phase 1, Lagos",
  "price": 75000000,
  "type": "DUPLEX",
  "mediaUrls": [
    "https://your-bucket.supabase.co/uploads/properties/img1.jpg",
    "https://your-bucket.supabase.co/uploads/properties/img2.jpg"
  ],
  "bedrooms": 3,
  "bathrooms": 4,
  "size": 250,
  "amenities": ["Swimming Pool", "Generator", "Security"]
}
```

**Property Types:** `LAND`, `APARTMENT`, `DUPLEX`, `BUNGALOW`, `TERRACE`, `COMMERCIAL`

### Update My Listing
```http
PATCH /realtor/listings/{propertyId}
Authorization: Bearer {token}
```

### Delete My Listing
```http
DELETE /realtor/listings/{propertyId}
Authorization: Bearer {token}
```

---

## 3. KYC Document Submission

### Submit KYC Document
```http
POST /kyc/documents
Authorization: Bearer {token}
```

```json
{
  "type": "NIN",
  "idNumber": "12345678901",
  "fileUrl": "https://bucket.supabase.co/kyc/nin_doc.pdf",
  "fileName": "nin_slip.pdf"
}
```

**Document Types:** `NIN`, `NATIONAL_ID`, `DRIVERS_LICENSE`, `PASSPORT`, `VOTERS_CARD`, `UTILITY_BILL`, `BANK_STATEMENT`

**Response:**
```json
{
  "id": "doc-uuid",
  "status": "PENDING",
  "autoVerified": false,
  "message": "Document submitted for review. An admin will verify it shortly."
}
```

> **Note:** Auto-verification is configured but requires Prembly live credentials. For now, documents go to manual admin review.

---

## 4. UI Updates Required

### Realtor Signup Form
Add required fields:
- First Name (text input, required)
- Last Name (text input, required)

### Realtor Dashboard
Add new section/tab: **"My Listings"**
- List of properties created by realtor
- Stats card showing total/available/sold counts
- "Add Listing" button

### Add Listing Screen
Form with fields:
- Title (required)
- Description
- Location (required)
- Price (required, number)
- Property Type (dropdown)
- Bedrooms, Bathrooms, Size
- Amenities (multi-select or tags)
- Media upload (use `/uploads/direct` first, then pass URLs)

### KYC Screen
- ID Type dropdown
- ID Number input
- Document upload
- Submit button

---

## 5. Upload Flow for Property Images

```typescript
// 1. Upload each image
const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'properties');
  
  const res = await fetch('/api/uploads/direct', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  
  const { url } = await res.json();
  return url;
};

// 2. Upload all images and collect URLs
const mediaUrls = await Promise.all(files.map(uploadImage));

// 3. Create listing with URLs
await fetch('/api/realtor/listings', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'My Property',
    location: 'Lagos',
    price: 50000000,
    mediaUrls,
  }),
});
```

---

## Quick Reference

| Feature | Endpoint | Method |
|---------|----------|--------|
| Register Realtor | `/auth/register` | POST |
| Get My Listings | `/realtor/listings` | GET |
| Create Listing | `/realtor/listings` | POST |
| Update Listing | `/realtor/listings/:id` | PATCH |
| Delete Listing | `/realtor/listings/:id` | DELETE |
| Listing Stats | `/realtor/listings/stats` | GET |
| Submit KYC | `/kyc/documents` | POST |
| KYC Status | `/kyc/status` | GET |
