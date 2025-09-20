# Connectify API Documentation

## Base URL

```
http://localhost:3000
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

## Endpoints

### Authentication

#### Register User

- **POST** `/auth/register`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "username": "testuser",
    "password": "password123"
  }
  ```

#### Login User

- **POST** `/auth/login`
- **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response:** Returns JWT token and user data

#### Get Current User

- **GET** `/auth/me`
- **Headers:** `Authorization: Bearer <token>`

#### Logout User

- **POST** `/auth/logout`
- **Headers:** `Authorization: Bearer <token>`

### Posts

#### Get All Posts

- **GET** `/posts?page=1&limit=10`
- **Query Parameters:**
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page (default: 10)

#### Get Post by ID

- **GET** `/posts/:id`

#### Get User Posts

- **GET** `/posts/user/:userId?page=1&limit=10`

#### Get My Posts

- **GET** `/posts/my-posts?page=1&limit=10`
- **Headers:** `Authorization: Bearer <token>`

#### Create Post

- **POST** `/posts`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "content": "This is my first post!",
    "mediaIds": [1, 2]
  }
  ```

#### Update Post

- **PUT** `/posts/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "content": "Updated post content",
    "isDraft": false,
    "isPinned": false,
    "mediaIds": [1, 2]
  }
  ```

#### Delete Post

- **DELETE** `/posts/:id`
- **Headers:** `Authorization: Bearer <token>`

#### Like/Unlike Post

- **POST** `/posts/:id/like`
- **Headers:** `Authorization: Bearer <token>`

#### Add Comment

- **POST** `/posts/:id/comment`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "content": "Great post!"
  }
  ```

#### Get Comments

- **GET** `/posts/:id/comments?page=1&limit=10`

### User Profile

#### Get Profile

- **GET** `/user/profile`
- **Headers:** `Authorization: Bearer <token>`

#### Create Profile

- **POST** `/user/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `multipart/form-data`
  - `displayName` (string, optional)
  - `bio` (string, optional)
  - `website` (string, optional)
  - `location` (string, optional)
  - `avatar` (file, optional)
  - `coverPhoto` (file, optional)

#### Update Profile

- **PUT** `/user/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `multipart/form-data` (same as create)

#### Get User Files

- **GET** `/user/profile/files`
- **Headers:** `Authorization: Bearer <token>`

#### Upload Media File

- **POST** `/user/profile/files`
- **Headers:** `Authorization: Bearer <token>`
- **Body:** `multipart/form-data`
  - `file` (file, required)

### Media

#### Get My Files

- **GET** `/media/my-files`
- **Headers:** `Authorization: Bearer <token>`

#### Delete File

- **DELETE** `/media/:id`
- **Headers:** `Authorization: Bearer <token>`

### Notifications

#### Get Notifications

- **GET** `/notifications?page=1&limit=10`
- **Headers:** `Authorization: Bearer <token>`

#### Get Unread Count

- **GET** `/notifications/unread-count`
- **Headers:** `Authorization: Bearer <token>`

#### Mark Notification as Read

- **PUT** `/notifications/:id/read`
- **Headers:** `Authorization: Bearer <token>`

#### Mark All Notifications as Read

- **PUT** `/notifications/mark-all-read`
- **Headers:** `Authorization: Bearer <token>`

#### Delete Notification

- **DELETE** `/notifications/:id`
- **Headers:** `Authorization: Bearer <token>`

## Data Models

### User

```json
{
  "id": 1,
  "username": "testuser",
  "email": "user@example.com",
  "profile": {
    "displayName": "John Doe",
    "avatar": {
      "url": "/uploads/avatar.jpg"
    }
  }
}
```

### Post

```json
{
  "id": 1,
  "content": "This is a post",
  "isDraft": false,
  "isPinned": false,
  "createdAt": "2025-09-17T08:24:47.212Z",
  "updatedAt": "2025-09-17T08:24:47.212Z",
  "authorId": 1,
  "author": {
    "id": 1,
    "username": "testuser",
    "email": "user@example.com",
    "profile": {
      "displayName": "John Doe",
      "avatar": {
        "url": "/uploads/avatar.jpg"
      }
    }
  },
  "medias": [
    {
      "id": 1,
      "order": 0,
      "altText": "Image description",
      "media": {
        "id": 1,
        "url": "/uploads/image.jpg",
        "mimeType": "image/jpeg"
      }
    }
  ],
  "reactions": [
    {
      "id": 1,
      "type": "LIKE",
      "userId": 2,
      "user": {
        "id": 2,
        "username": "anotheruser"
      }
    }
  ],
  "comments": [
    {
      "id": 1,
      "content": "Great post!",
      "createdAt": "2025-09-17T08:25:00.000Z",
      "author": {
        "id": 2,
        "username": "anotheruser",
        "profile": {
          "displayName": "Jane Doe",
          "avatar": {
            "url": "/uploads/avatar2.jpg"
          }
        }
      }
    }
  ],
  "_count": {
    "reactions": 1,
    "comments": 1
  }
}
```

### Profile

```json
{
  "id": 1,
  "userId": 1,
  "displayName": "John Doe",
  "bio": "Software Developer",
  "website": "https://johndoe.com",
  "location": "New York, USA",
  "avatar": {
    "id": 1,
    "url": "/uploads/avatar.jpg",
    "mimeType": "image/jpeg"
  },
  "coverPhoto": {
    "id": 2,
    "url": "/uploads/cover.jpg",
    "mimeType": "image/jpeg"
  },
  "createdAt": "2025-09-17T08:24:47.212Z",
  "updatedAt": "2025-09-17T08:24:47.212Z"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

## File Upload Guidelines

- **Supported formats:** JPG, JPEG, PNG, GIF, WEBP, MP4, MOV, AVI, MKV
- **Maximum file size:** 20MB per file
- **Maximum files per request:** 10 files
- **Use multipart/form-data** for file uploads

## Pagination

All list endpoints support pagination:

- `page`: Page number (starts from 1)
- `limit`: Items per page (default: 10)

Response includes pagination metadata:

```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "data": [...],
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```






