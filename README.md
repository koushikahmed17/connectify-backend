# Connectify Backend

A modern, scalable social media backend built with NestJS, Prisma, and PostgreSQL.

## 🏗️ Architecture

This project follows clean architecture principles with a well-structured folder organization:

```
src/
├── shared/                 # Shared modules and utilities
│   ├── config/            # Configuration services
│   ├── database/          # Database connection and services
│   ├── decorators/        # Custom decorators
│   ├── dto/              # Shared DTOs
│   ├── exceptions/       # Custom exceptions and filters
│   └── guards/           # Authentication and authorization guards
├── modules/              # Feature modules
│   ├── auth/            # Authentication module
│   ├── user-profile/    # User profile management
│   ├── posts/           # Posts and content management
│   ├── notifications/   # Notification system
│   └── media/           # Media file handling
└── main.ts              # Application entry point
```

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **User Management**: Complete user profile system with avatars and cover photos
- **Posts System**: Create, read, update, delete posts with media support
- **Notifications**: Real-time notification system
- **Media Handling**: File upload and management
- **Validation**: Comprehensive input validation with class-validator
- **Error Handling**: Global exception filters and custom business exceptions
- **Configuration**: Environment-based configuration management
- **Database**: PostgreSQL with Prisma ORM

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: class-validator, class-transformer
- **File Upload**: Multer
- **Password Hashing**: bcrypt

## 📦 Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Set up the database:

   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. Start the development server:
   ```bash
   npm run start:dev
   ```

## 🔧 Configuration

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRES_IN`: JWT token expiration time
- `PORT`: Application port (default: 3000)
- `NODE_ENV`: Environment (development/production)

## 📚 API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### User Profile

- `GET /user/profile` - Get user profile
- `POST /user/profile` - Create user profile
- `PUT /user/profile` - Update user profile
- `GET /user/profile/files` - Get user's uploaded files
- `POST /user/profile/files` - Upload media files

### Posts

- `GET /posts` - Get all posts (paginated)
- `POST /posts` - Create a new post
- `GET /posts/:id` - Get post by ID
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post
- `GET /posts/user/:userId` - Get user's posts
- `GET /posts/my-posts` - Get current user's posts
- `POST /posts/:id/like` - Toggle like on post
- `POST /posts/:id/comment` - Add comment to post
- `GET /posts/:id/comments` - Get post comments

### Notifications

- `GET /notifications` - Get user notifications
- `GET /notifications/unread-count` - Get unread count
- `PUT /notifications/:id/read` - Mark notification as read
- `PUT /notifications/mark-all-read` - Mark all as read
- `DELETE /notifications/:id` - Delete notification

### Media

- `GET /media/my-files` - Get user's media files
- `DELETE /media/:id` - Delete media file

## 🏛️ Best Practices Implemented

1. **Clean Architecture**: Separation of concerns with clear module boundaries
2. **Dependency Injection**: Proper use of NestJS DI container
3. **Validation**: Comprehensive input validation with DTOs
4. **Error Handling**: Global exception filters and custom business exceptions
5. **Configuration**: Environment-based configuration management
6. **Security**: JWT authentication, password hashing, input sanitization
7. **Database**: Proper ORM usage with Prisma
8. **Code Organization**: Logical folder structure and naming conventions
9. **Type Safety**: Full TypeScript implementation
10. **Documentation**: Comprehensive code documentation

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Database Schema

The application uses Prisma for database management. Key models include:

- **User**: User accounts and authentication
- **Profile**: User profile information
- **Post**: Social media posts
- **Media**: File uploads and media management
- **Notification**: User notifications
- **Reaction**: Post likes and reactions
- **Comment**: Post comments

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS configuration
- File upload restrictions
- SQL injection prevention (Prisma ORM)

## 🚀 Deployment

1. Build the application:

   ```bash
   npm run build
   ```

2. Start in production:
   ```bash
   npm run start:prod
   ```

## 📄 License

This project is licensed under the MIT License.
