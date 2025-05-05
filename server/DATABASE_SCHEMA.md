# Handshake Database Schema

This document outlines the database schema for the Handshake application, using MongoDB with Mongoose ODM.

## Collections Overview

| Collection    | Description                                               | Relationships                                    |
|---------------|-----------------------------------------------------------|--------------------------------------------------|
| users         | Stores user authentication and basic profile information  | Referenced by professionals, coffeechats         |
| professionals | Stores professional user profiles with expertise details  | References users, Referenced by coffeechats      |
| coffeechats   | Stores coffee chat session details and status             | References users, professionals                   |

## Collection Details

### Users Collection

Stores basic user information and authentication details.

```typescript
{
  _id: ObjectId,
  email: String,          // Required, Unique
  linkedInId: String,     // Required, Unique
  firstName: String,      // Required
  lastName: String,       // Required
  profilePicture: String, // Optional
  isProfessional: Boolean,// Default: false
  isAnonymous: Boolean,   // Default: false
  createdAt: Date,        // Default: Date.now
  updatedAt: Date         // Default: Date.now
}
```

**Indexes:**
- `email`: Unique index
- `linkedInId`: Unique index

### Professionals Collection

Stores detailed information about professional users offering coffee chats.

```typescript
{
  _id: ObjectId,
  userId: ObjectId,         // References users collection, Required
  industry: String,         // Required
  seniority: String,        // Required
  expertise: [String],      // Array of expertise areas
  hourlyRate: Number,       // Required
  availability: {
    timezone: String,       // Required
    slots: [{
      day: String,          // Required (e.g., "Monday")
      startTime: String,    // Required (e.g., "09:00")
      endTime: String       // Required (e.g., "17:00")
    }]
  },
  linkedInProfile: String,  // Required
  bio: String,              // Required
  isVerified: Boolean,      // Default: false
  rating: Number,           // Default: 0
  totalSessions: Number,    // Default: 0
  createdAt: Date,          // Default: Date.now
  updatedAt: Date           // Default: Date.now
}
```

**Indexes:**
- `userId`: For efficient lookup of professional by user ID
- `industry, seniority`: For efficient filtering during searches

### CoffeeChats Collection

Stores information about coffee chat sessions between users and professionals.

```typescript
{
  _id: ObjectId,
  seekerId: ObjectId,       // References users collection, Required
  professionalId: ObjectId, // References professionals collection, Required
  status: String,           // Enum: ['pending', 'confirmed', 'completed', 'cancelled'], Default: 'pending'
  scheduledTime: Date,      // Required
  duration: Number,         // In minutes, Required
  price: Number,            // Required
  paymentIntentId: String,  // Required
  preferences: {
    industry: String,       // Required
    seniority: String,      // Required
    topics: [String]        // Array of topic strings
  },
  feedback: {               // Optional
    rating: Number,         // 1-5 scale
    comment: String
  },
  createdAt: Date,          // Default: Date.now
  updatedAt: Date           // Default: Date.now
}
```

**Indexes:**
- `seekerId`: For finding all coffee chats for a seeker
- `professionalId`: For finding all coffee chats for a professional
- `status, scheduledTime`: For filtering upcoming/past sessions
- `scheduledTime`: For chronological sorting

## Relationships

1. **User to Professional**: One-to-One
   - A user can have at most one professional profile
   - The professional collection references the user collection via `userId`

2. **User to CoffeeChat**: One-to-Many
   - A user can have many coffee chat sessions as a seeker
   - The coffeeChat collection references the user collection via `seekerId`

3. **Professional to CoffeeChat**: One-to-Many
   - A professional can have many coffee chat sessions
   - The coffeeChat collection references the professional collection via `professionalId`

## Data Validation Rules

1. **Email**: Valid email format (RFC 5322)
2. **Password**: Minimum 8 characters with at least one special character and one number
3. **Rating**: Values between 1-5
4. **ScheduledTime**: Must be a future date when creating a new coffee chat

## Future Schema Considerations

Potential additions to the schema as the application evolves:

1. **Messages Collection**: For direct messaging between users and professionals
2. **Notifications Collection**: For storing user notifications
3. **Payments Collection**: For detailed payment records
4. **Reviews Collection**: For more detailed feedback and reviews

## Best Practices for Schema Usage

1. Always use Mongoose models to interact with the database
2. Use population for related documents when needed (`populate()`)
3. Use transactions for operations that span multiple collections
4. Keep embedded documents (subdocuments) reasonably sized
5. Use projection (`select()`) to retrieve only needed fields 