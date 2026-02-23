# Mobile In-App Messaging API Documentation

## Overview

The messaging system enables real-time communication between clients and realtors about properties. When a client sends an inquiry about a property, it automatically routes to the realtor who posted that property.

**Base URL:** `https://fourzeeproperties-backend.onrender.com`

---

## Table of Contents

1. [Client Messaging Endpoints](#client-endpoints)
2. [Realtor Messaging Endpoints](#realtor-endpoints)
3. [Realtor Leads Screen API](#realtor-leads-api)
4. [Property Contact Info](#property-contact-info)
5. [Installment Payment API](#installment-payment-api)
6. [Push Notification Payloads](#push-notification-payloads)
7. [Mobile Implementation Flows](#mobile-implementation-flow)

---

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Client Endpoints

### 1. Create Property Inquiry

Start a conversation with the realtor who posted a property.

**Endpoint:** `POST /messaging/properties/:propertyId/inquiry`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| propertyId | UUID | The property ID to inquire about |

**Request Body:**
```json
{
  "content": "Hi, I'm interested in this property. Is it still available?"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "conversationId": "uuid-of-conversation",
    "conversation": {
      "id": "uuid-of-conversation",
      "subject": "Inquiry: Beautiful 3-Bedroom Apartment",
      "propertyId": "uuid-of-property",
      "participantIds": ["client-user-id", "realtor-user-id"],
      "createdAt": "2025-02-01T10:00:00Z",
      "messages": [
        {
          "id": "uuid-of-message",
          "content": "Hi, I'm interested in this property. Is it still available?",
          "senderId": "client-user-id",
          "receiverId": "realtor-user-id",
          "type": "INQUIRY",
          "isRead": false,
          "createdAt": "2025-02-01T10:00:00Z"
        }
      ]
    },
    "isNew": true,
    "recipientType": "realtor"
  },
  "meta": {
    "timestamp": "2025-02-01T10:00:00Z"
  }
}
```

**Notes:**
- If a conversation already exists for this property, it will return the existing conversation
- The realtor receives a push notification: "🏠 Property Inquiry: [Client Name] is asking about [Property Title]"

---

### 2. Check Existing Conversation for Property

Check if you already have a conversation about a specific property.

**Endpoint:** `GET /messaging/properties/:propertyId/conversation`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| propertyId | UUID | The property ID to check |

**Response (200 OK) - Conversation exists:**
```json
{
  "success": true,
  "data": {
    "exists": true,
    "conversationId": "uuid-of-conversation",
    "conversation": {
      "id": "uuid-of-conversation",
      "subject": "Inquiry: Beautiful 3-Bedroom Apartment",
      "participantIds": ["client-user-id", "realtor-user-id"],
      "messages": [...]
    }
  },
  "meta": {
    "timestamp": "2025-02-01T10:00:00Z"
  }
}
```

**Response (200 OK) - No conversation:**
```json
{
  "success": true,
  "data": {
    "exists": false,
    "conversationId": null,
    "conversation": null
  },
  "meta": {
    "timestamp": "2025-02-01T10:00:00Z"
  }
}
```

---

### 3. Get All My Conversations

List all conversations for the authenticated user.

**Endpoint:** `GET /messaging/conversations`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| propertyId | UUID | - | Filter by property |
| unreadOnly | boolean | false | Show only unread |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "uuid-of-conversation",
        "subject": "Inquiry: Beautiful 3-Bedroom Apartment",
        "propertyId": "uuid-of-property",
        "participantIds": ["client-user-id", "realtor-user-id"],
        "createdAt": "2025-02-01T10:00:00Z",
        "updatedAt": "2025-02-01T12:30:00Z",
        "lastMessage": {
          "content": "Yes, it's still available. When would you like to view?",
          "senderId": "realtor-user-id",
          "createdAt": "2025-02-01T12:30:00Z",
          "type": "RESPONSE"
        },
        "participants": [
          {
            "id": "realtor-user-id",
            "name": "John Realtor",
            "role": "REALTOR"
          }
        ],
        "property": {
          "id": "uuid-of-property",
          "title": "Beautiful 3-Bedroom Apartment",
          "images": ["https://..."],
          "price": 2500000,
          "location": "Victoria Island, Lagos"
        },
        "unreadCount": 1
      }
    ],
    "total": 5,
    "unreadTotal": 2
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5
    },
    "timestamp": "2025-02-01T10:00:00Z"
  }
}
```

---

### 4. Get Conversation Messages

Get all messages in a specific conversation.

**Endpoint:** `GET /messaging/conversations/:id`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Conversation ID |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-of-conversation",
    "subject": "Inquiry: Beautiful 3-Bedroom Apartment",
    "propertyId": "uuid-of-property",
    "participantIds": ["client-user-id", "realtor-user-id"],
    "property": {
      "id": "uuid-of-property",
      "title": "Beautiful 3-Bedroom Apartment",
      "images": ["https://..."],
      "price": 2500000
    },
    "messages": [
      {
        "id": "msg-1",
        "content": "Hi, I'm interested in this property",
        "senderId": "client-user-id",
        "receiverId": "realtor-user-id",
        "type": "INQUIRY",
        "isRead": true,
        "readAt": "2025-02-01T10:05:00Z",
        "createdAt": "2025-02-01T10:00:00Z"
      },
      {
        "id": "msg-2",
        "content": "Yes, it's still available!",
        "senderId": "realtor-user-id",
        "receiverId": "client-user-id",
        "type": "RESPONSE",
        "isRead": false,
        "createdAt": "2025-02-01T10:30:00Z"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-02-01T10:00:00Z"
  }
}
```

---

### 5. Send Message in Conversation

Send a message in an existing conversation.

**Endpoint:** `POST /messaging/conversations/:id/messages`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Conversation ID |

**Request Body:**
```json
{
  "content": "When can I schedule a viewing?",
  "type": "RESPONSE"
}
```

**Message Types:**
- `INQUIRY` - Initial inquiry
- `RESPONSE` - Reply to a message
- `OFFER` - Making an offer
- `COUNTER_OFFER` - Counter offer
- `NEGOTIATION` - Negotiation message
- `DOCUMENT` - Document sharing
- `SYSTEM` - System message

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-of-message",
    "conversationId": "uuid-of-conversation",
    "content": "When can I schedule a viewing?",
    "senderId": "client-user-id",
    "receiverId": "realtor-user-id",
    "type": "RESPONSE",
    "isRead": false,
    "createdAt": "2025-02-01T11:00:00Z"
  },
  "meta": {
    "timestamp": "2025-02-01T11:00:00Z"
  }
}
```

**Notes:**
- Recipient receives push notification: "New Message: [Sender Name]: [Message Preview]"

---

### 6. Mark Conversation as Read

Mark all messages in a conversation as read.

**Endpoint:** `PATCH /messaging/conversations/:id/read`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Conversation ID |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "markedAsRead": 3,
    "conversationId": "uuid-of-conversation"
  },
  "meta": {
    "timestamp": "2025-02-01T10:00:00Z"
  }
}
```

---

### 7. Get Unread Message Count

Get total count of unread messages.

**Endpoint:** `GET /messaging/unread-count`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  },
  "meta": {
    "timestamp": "2025-02-01T10:00:00Z"
  }
}
```

---

## Realtor Endpoints

These endpoints are specifically for realtors to manage their messages.

### 1. Get Realtor Messages

List all conversations for the realtor.

**Endpoint:** `GET /realtor/messages`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |
| propertyId | UUID | - | Filter by property |
| unreadOnly | boolean | false | Show only unread |

**Response:** Same format as `GET /messaging/conversations`

---

### 2. Get Specific Conversation

Get a specific conversation for the realtor.

**Endpoint:** `GET /realtor/messages/:conversationId`

**Response:** Same format as `GET /messaging/conversations/:id`

---

### 3. Reply to Client

Send a reply in a conversation.

**Endpoint:** `POST /realtor/messages/:conversationId/reply`

**Request Body:**
```json
{
  "content": "Thank you for your interest! The property is available for viewing on Saturday.",
  "type": "RESPONSE"
}
```

**Response:** Same format as `POST /messaging/conversations/:id/messages`

---

## Push Notification Payloads

### Property Inquiry Notification (to Realtor)
```json
{
  "title": "🏠 Property Inquiry",
  "body": "John Client is asking about \"Beautiful 3-Bedroom Apartment\"",
  "data": {
    "type": "property_inquiry",
    "conversationId": "uuid-of-conversation",
    "propertyId": "uuid-of-property",
    "senderId": "client-user-id"
  }
}
```

### New Message Notification
```json
{
  "title": "New Message",
  "body": "John Client: When can I schedule a viewing?",
  "data": {
    "type": "message",
    "conversationId": "uuid-of-conversation",
    "senderId": "sender-user-id"
  }
}
```

---

## Mobile Implementation Flow

### Client Flow:

1. **Property Detail Screen**
   - Show "Contact Realtor" / "Send Inquiry" button
   - First check: `GET /messaging/properties/:propertyId/conversation`
   - If conversation exists → Navigate to chat screen
   - If no conversation → Show inquiry composer

2. **Send Initial Inquiry**
   - `POST /messaging/properties/:propertyId/inquiry`
   - Navigate to conversation screen with returned `conversationId`

3. **Conversation Screen**
   - Load messages: `GET /messaging/conversations/:id`
   - Mark as read: `PATCH /messaging/conversations/:id/read`
   - Send message: `POST /messaging/conversations/:id/messages`

4. **Messages Tab/Screen**
   - List all conversations: `GET /messaging/conversations`
   - Show unread badge: `GET /messaging/unread-count`
   - Tap conversation → Navigate to conversation screen

### Realtor Flow:

1. **Messages Tab**
   - List all inquiries: `GET /realtor/messages`
   - Filter by property if needed

2. **Conversation Screen**
   - Load messages: `GET /realtor/messages/:conversationId`
   - Reply: `POST /realtor/messages/:conversationId/reply`

---

## Error Responses

### Property Not Found (404)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Property not found"
  }
}
```

### Conversation Not Found (404)
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Conversation not found"
  }
}
```

### Not a Participant (403)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not a participant in this conversation"
  }
}
```

---

## Testing with cURL

### Create Inquiry
```bash
curl -X POST "https://fourzeeproperties-backend.onrender.com/messaging/properties/PROPERTY_ID/inquiry" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hi, is this property still available?"}'
```

### Get Conversations
```bash
curl "https://fourzeeproperties-backend.onrender.com/messaging/conversations" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Send Message
```bash
curl -X POST "https://fourzeeproperties-backend.onrender.com/messaging/conversations/CONV_ID/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "When can I view the property?", "type": "RESPONSE"}'
```

### Mark as Read
```bash
curl -X PATCH "https://fourzeeproperties-backend.onrender.com/messaging/conversations/CONV_ID/read" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Summary of Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/messaging/properties/:propertyId/inquiry` | Start property inquiry |
| GET | `/messaging/properties/:propertyId/conversation` | Check existing conversation |
| GET | `/messaging/conversations` | List all conversations |
| GET | `/messaging/conversations/:id` | Get conversation messages |
| POST | `/messaging/conversations/:id/messages` | Send message |
| PATCH | `/messaging/conversations/:id/read` | Mark as read |
| GET | `/messaging/unread-count` | Get unread count |
| GET | `/realtor/messages` | Realtor: List conversations |
| GET | `/realtor/messages/:id` | Realtor: Get conversation |
| POST | `/realtor/messages/:id/reply` | Realtor: Reply to message |
| GET | `/realtor/leads` | Realtor: Get leads screen data |
| GET | `/realtor/leads/:id` | Realtor: Get lead detail |
| POST | `/payments/installment` | Pay installment |

---

## Realtor Leads API

The leads screen shows all property inquiries (leads) the realtor has received.

### Get All Leads

**Endpoint:** `GET /realtor/leads`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| status | string | all | Filter: `all`, `unread`, `read` |
| propertyId | UUID | - | Filter by specific property |
| page | number | 1 | Page number |
| limit | number | 20 | Items per page |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "id": "uuid-of-conversation",
        "status": "unread",
        "subject": "Inquiry: 3 Bedroom Duplex",
        "property": {
          "id": "uuid-of-property",
          "title": "3 Bedroom Duplex",
          "location": "Lekki Phase 1",
          "price": 75000000,
          "mediaUrls": ["https://..."]
        },
        "client": {
          "id": "uuid-of-client",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "+234801234567"
        },
        "lastMessage": {
          "content": "Hi, I'm interested in this property",
          "senderId": "client-user-id",
          "createdAt": "2026-02-23T10:00:00Z",
          "type": "INQUIRY"
        },
        "unreadCount": 2,
        "createdAt": "2026-02-23T10:00:00Z",
        "updatedAt": "2026-02-23T10:00:00Z"
      }
    ],
    "total": 15,
    "unreadCount": 5,
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalPages": 1,
      "hasNext": false,
      "hasPrevious": false
    }
  }
}
```

### Get Lead Details

**Endpoint:** `GET /realtor/leads/:id`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Lead/Conversation ID |

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-of-conversation",
    "subject": "Inquiry: 3 Bedroom Duplex",
    "property": {
      "id": "uuid-of-property",
      "title": "3 Bedroom Duplex",
      "location": "Lekki Phase 1",
      "price": 75000000,
      "mediaUrls": ["https://..."]
    },
    "client": {
      "id": "uuid-of-client",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+234801234567",
      "address": "123 Main Street, Lagos"
    },
    "messages": [
      {
        "id": "msg-1",
        "content": "Hi, I'm interested in this property",
        "senderId": "client-user-id",
        "isFromClient": true,
        "type": "INQUIRY",
        "isRead": true,
        "createdAt": "2026-02-23T10:00:00Z"
      },
      {
        "id": "msg-2",
        "content": "Yes, it's available! When would you like to view?",
        "senderId": "realtor-user-id",
        "isFromClient": false,
        "type": "RESPONSE",
        "isRead": true,
        "createdAt": "2026-02-23T10:30:00Z"
      }
    ],
    "createdAt": "2026-02-23T10:00:00Z",
    "updatedAt": "2026-02-23T10:30:00Z"
  }
}
```

**Notes:**
- Accessing this endpoint automatically marks all unread messages as read
- `isFromClient: true` means the message was sent by the client

---

## Property Contact Info

When viewing a property, the client can see the realtor's contact information.

### Get Property Details

**Endpoint:** `GET /properties/:id`

**Response includes `realtorContact`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-of-property",
    "title": "3 Bedroom Duplex with BQ",
    "location": "Lekki Phase 1, Lagos",
    "price": 75000000,
    "description": "Beautiful property...",
    "mediaUrls": ["https://..."],
    "availability": "AVAILABLE",
    "bedrooms": 3,
    "bathrooms": 4,
    "size": 350,
    "amenities": ["Pool", "Gym", "Security"],
    "realtorContact": {
      "id": "realtor-id",
      "userId": "realtor-user-id",
      "name": "Jane Realtor",
      "email": "jane@realtors.com",
      "phone": "+234809876543",
      "whatsapp": "+234809876543",
      "agency": "Premium Realtors Ltd"
    },
    "createdAt": "2026-02-01T10:00:00Z"
  }
}
```

**Notes:**
- `realtorContact` is `null` if the property was created by admin without a realtor
- Use `realtorContact.userId` to start a conversation via messaging API
- WhatsApp link: `https://wa.me/${realtorContact.whatsapp.replace('+', '')}`

---

## Installment Payment API

Clients enrolled in a payment plan can pay their installments.

### Get My Payment Plans

**Endpoint:** `GET /payment-plans/my-enrollments`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "enrollment-id",
      "totalAmount": 75000000,
      "downPayment": 22500000,
      "monthlyAmount": 8750000,
      "status": "ACTIVE",
      "startDate": "2026-02-01T00:00:00Z",
      "endDate": "2026-08-01T00:00:00Z",
      "template": {
        "name": "6-Month Installment Plan",
        "durationMonths": 6,
        "downPaymentPct": 0.3
      },
      "application": {
        "property": {
          "id": "property-id",
          "title": "3 Bedroom Duplex"
        }
      },
      "installments": [
        {
          "id": "installment-0",
          "installmentNo": 0,
          "amount": 22500000,
          "dueDate": "2026-02-01T00:00:00Z",
          "status": "PAID",
          "paidAt": "2026-02-01T10:00:00Z"
        },
        {
          "id": "installment-1",
          "installmentNo": 1,
          "amount": 8750000,
          "dueDate": "2026-03-01T00:00:00Z",
          "status": "PENDING",
          "lateFee": 0
        }
      ]
    }
  ]
}
```

### Get Upcoming Installments

**Endpoint:** `GET /payment-plans/my-upcoming?days=30`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "installment-1",
      "installmentNo": 1,
      "amount": 8750000,
      "dueDate": "2026-03-01T00:00:00Z",
      "status": "PENDING",
      "lateFee": 0,
      "enrollment": {
        "application": {
          "property": {
            "title": "3 Bedroom Duplex"
          }
        }
      }
    }
  ]
}
```

### Pay Installment

**Endpoint:** `POST /payments/installment`

**Request Body:**
```json
{
  "installmentId": "uuid-of-installment"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://checkout.paystack.com/abc123",
    "reference": "INST_1706612400_abc123",
    "accessCode": "abc123xyz",
    "installmentId": "uuid-of-installment",
    "installmentNo": 1,
    "amount": 8750000,
    "propertyTitle": "3 Bedroom Duplex"
  }
}
```

**Flow:**
1. Call `POST /payments/installment` with `installmentId`
2. Redirect user to `authorizationUrl` (Paystack checkout)
3. User completes payment
4. Webhook marks installment as PAID
5. If all installments paid → Property marked SOLD, enrollment COMPLETED

**Notes:**
- Amount includes late fees if installment is overdue
- Amount is in kobo (₦87,500 = 8750000 kobo)

---

## Mobile Implementation Flows

### Leads Screen (Realtor App)

1. **Leads Tab**
   - Call `GET /realtor/leads` on mount
   - Display unread badge from `data.unreadCount`
   - Show list with client name, property, last message preview

2. **Pull to Refresh**
   - Re-fetch `GET /realtor/leads`

3. **Filter Options**
   - `status=unread` - Show only unread leads
   - `propertyId=xxx` - Filter by property

4. **Tap Lead**
   - Navigate to lead detail screen
   - Call `GET /realtor/leads/:id`
   - Messages auto-marked as read

5. **Reply to Lead**
   - Use `POST /realtor/messages/:id/reply`
   - Or `POST /messaging/conversations/:id/messages`

### Client Property Screen

1. **View Property**
   - Call `GET /properties/:id`
   - Display `realtorContact` info

2. **Contact Realtor Button**
   - Options: "Message" | "Call" | "WhatsApp"
   - Message → Check existing conversation first
   - Call → `tel:${realtorContact.phone}`
   - WhatsApp → `https://wa.me/${phone}`

3. **Send First Message**
   - Check: `GET /messaging/properties/:propertyId/conversation`
   - If exists → Navigate to chat
   - If not → `POST /messaging/properties/:propertyId/inquiry`

### Installment Payment (Client App)

1. **Payments Tab**
   - Call `GET /payment-plans/my-enrollments`
   - Show payment progress (X of Y paid)

2. **View Upcoming**
   - Call `GET /payment-plans/my-upcoming?days=30`
   - Highlight overdue (status=OVERDUE)

3. **Pay Installment**
   - Call `POST /payments/installment`
   - Open WebView/Browser to `authorizationUrl`
   - On return, check payment status

4. **Push Notifications**
   - 3 days before due: "Payment Reminder"
   - After payment: "Payment Received"
   - All paid: "🎉 Plan Completed"
