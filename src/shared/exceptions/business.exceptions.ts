import { HttpException, HttpStatus } from '@nestjs/common';

export class UserNotFoundException extends HttpException {
  constructor(message = 'User not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class PostNotFoundException extends HttpException {
  constructor(message = 'Post not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class ProfileNotFoundException extends HttpException {
  constructor(message = 'Profile not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class NotificationNotFoundException extends HttpException {
  constructor(message = 'Notification not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class MediaNotFoundException extends HttpException {
  constructor(message = 'Media file not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class UnauthorizedAccessException extends HttpException {
  constructor(message = 'Unauthorized access') {
    super(message, HttpStatus.FORBIDDEN);
  }
}

export class ResourceAlreadyExistsException extends HttpException {
  constructor(message = 'Resource already exists') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class InvalidCredentialsException extends HttpException {
  constructor(message = 'Invalid credentials') {
    super(message, HttpStatus.UNAUTHORIZED);
  }
}

export class ValidationException extends HttpException {
  constructor(message = 'Validation failed') {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

