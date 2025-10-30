# Connectify Backend

A modern NestJS + Prisma backend for a social app with auth, posts, messaging, calls, notifications, and media.

## Setup instructions

1. Prerequisites
   - Node.js 18+
   - PostgreSQL 14+
   - npm 9+
2. Install dependencies
   ```bash
   npm install
   ```
3. Configure environment
   ```bash
   cp .env.example .env
   # Edit .env to match your local environment
   ```
4. Database setup
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
5. Seed data (optional)
   ```bash
   npx ts-node prisma/seed.ts
   ```
6. Run the server
   ```bash
   npm run start:dev
   # Prod
   npm run build && npm run start:prod
   ```

## Environment variables

- DATABASE_URL: PostgreSQL connection string
- JWT_SECRET: Secret key for access tokens
- JWT_EXPIRES_IN: Access token TTL (e.g. 7d)
- PORT: HTTP port (default 3001)
- NODE_ENV: development | production
- CORS_ORIGIN: Allowed frontend origin
- MAX_FILE_SIZE: Max upload size in bytes
- UPLOAD_PATH: Local uploads directory
- SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM: Email settings
- FRONTEND_URL: Used in email links
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET: Google OAuth login

See `.env.example` for defaults.

## Key features and libraries

- Authentication and Authorization
  - JWT access tokens, refresh token storage (Prisma)
  - Local and Google OAuth (`@nestjs/jwt`, `passport`, `passport-google-oauth20`)
- User Profiles and Social Graph
  - Profiles with avatar/cover, follow requests, connections
- Posts, Comments, Reactions
  - Media attachments, nested comments, reaction types
- Real-time Messaging and Calls
  - Socket.IO gateways for chat and call events (`@nestjs/websockets`, `socket.io`)
- Notifications
  - Event-driven notifications with read/unread states
- Media Uploads
  - Multer-based uploads, usage linking (posts/messages/profiles)
- Validation & Security
  - `class-validator`, `class-transformer`, bcrypt password hashing, guards
- Tech stack
  - NestJS 11, Prisma 6, PostgreSQL, RxJS

## Architecture & business logic

- Modular structure
  - `src/modules/*`: Feature modules (`auth`, `user-profile`, `posts`, `follow`, `media`, `notifications`, `messaging`, `calls`)
  - `src/shared/*`: Cross-cutting concerns (`config`, `database`, `decorators`, `dto`, `exceptions`, `guards`, `services`)
- Data layer
  - Prisma schema models: `User`, `Profile`, `Post`, `Media`, `Comment`, `Reaction`, `FollowRequest`, `Connection`, `Notification`, `Conversation`, `ConversationParticipant`, `Message`, `MessageMedia`, `CallSession`, `RefreshToken`
  - Soft-deletes and indexes where appropriate
- Auth flow
  - Register/login -> issue JWT access + persist refresh tokens; guards protect routes; Google OAuth supported
- Posts and interactions
  - Posts with media; reactions/comments with uniqueness constraints and indexes
- Messaging & calls
  - Conversations with participants; messages of types TEXT/IMAGE/AUDIO/VIDEO/SYSTEM/CALL_LOG; Socket.IO gateways for realtime updates; call sessions tracked with type/status/timestamps
- Notifications
  - Typed notifications (new like/comment/follow/message, etc.) with payloads and read state
- Configuration
  - Centralized ConfigModule sourcing `.env`; CORS; upload size limits; SMTP for email/OTP

For endpoint details, refer to `API_Documentation.md`.
