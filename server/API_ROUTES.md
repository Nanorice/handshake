# Handshake API Routes

This document outlines the API routes used in the Handshake application.

## Base URL

All API routes are prefixed with `/api`.

## Authentication Routes

| Method | Endpoint        | Description                | Request Body                              | Response                                |
|--------|-----------------|----------------------------|-------------------------------------------|----------------------------------------|
| POST   | `/auth/register`| Register a new user        | `{ email, password, firstName, lastName }`| `{ user, token }`                       |
| POST   | `/auth/login`   | Login an existing user     | `{ email, password }`                     | `{ user, token }`                       |
| GET    | `/auth/me`      | Get current user profile   | -                                         | `{ user }`                              |

## Professional Routes

| Method | Endpoint                | Description                      | Request Body                     | Response                      |
|--------|-------------------------|----------------------------------|----------------------------------|-------------------------------|
| POST   | `/professionals`        | Create professional profile      | Professional profile details     | `{ professional }`            |
| GET    | `/professionals`        | List all professionals           | -                                | `{ professionals: [] }`       |
| GET    | `/professionals/:id`    | Get professional details         | -                                | `{ professional }`            |
| PUT    | `/professionals/:id`    | Update professional profile      | Updated professional details     | `{ professional }`            |
| GET    | `/professionals/search` | Search professionals by criteria | Query params for search filters  | `{ professionals: [] }`       |

## Coffee Chat Routes

| Method | Endpoint                   | Description                     | Request Body                    | Response                     |
|--------|-----------------------------|----------------------------------|----------------------------------|------------------------------|
| POST   | `/coffee-chats`             | Create a new coffee chat request | Coffee chat details              | `{ coffeeChat }`             |
| GET    | `/coffee-chats`             | List user's coffee chats         | -                                | `{ coffeeChats: [] }`        |
| GET    | `/coffee-chats/:id`         | Get coffee chat details          | -                                | `{ coffeeChat }`             |
| PUT    | `/coffee-chats/:id/status`  | Update coffee chat status        | `{ status }`                     | `{ coffeeChat }`             |
| POST   | `/coffee-chats/:id/feedback`| Submit feedback for a chat       | `{ rating, comment }`            | `{ coffeeChat }`             |

## Payment Routes

| Method | Endpoint                      | Description                     | Request Body                    | Response                         |
|--------|-------------------------------|----------------------------------|----------------------------------|---------------------------------|
| POST   | `/payments/create-intent`     | Create a payment intent          | `{ coffeeChatId, amount }`      | `{ clientSecret, paymentIntentId }` |
| POST   | `/payments/webhook`           | Handle Stripe webhook events     | Stripe event payload            | `{ received: true }`             |

## Common Response Format

All API responses follow this structure:

### Success Response

```json
{
  "status": "success",
  "data": {
    // Response data goes here
  }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error message description"
}
```

## Authentication

All routes except for `/auth/register` and `/auth/login` require authentication using a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
``` 