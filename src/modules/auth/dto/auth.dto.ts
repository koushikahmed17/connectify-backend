import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(20, { message: 'Username must not exceed 20 characters' })
  username: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class AuthResponseDto {
  success: boolean;
  message: string;
  access_token: string;
  user: {
    id: number;
    username: string;
    email: string;
    profile?: {
      displayName?: string;
      avatar?: {
        url: string;
      };
    };
  };
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

export class VerifyOTPDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  @MinLength(6, { message: 'OTP must be 6 digits' })
  @MaxLength(6, { message: 'OTP must be 6 digits' })
  otp: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  @MinLength(6, { message: 'OTP must be 6 digits' })
  @MaxLength(6, { message: 'OTP must be 6 digits' })
  otp: string;

  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty({ message: 'Google token is required' })
  token: string;
}
