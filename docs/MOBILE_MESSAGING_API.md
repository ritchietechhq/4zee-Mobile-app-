# Mobile In-App Messaging API Documentation

## Overview

The messaging system enables real-time communication between clients and realtors about properties. When a client sends an inquiry about a property, it automatically routes to the realtor who posted that property.

**Base URL:** `https://fourzeeproperties-backend.onrender.com`

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
