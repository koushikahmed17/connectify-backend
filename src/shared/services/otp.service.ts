import { Injectable } from '@nestjs/common';

interface OTPData {
  otp: string;
  email: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class OtpService {
  private otpStore: Map<string, OTPData> = new Map();
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 3;

  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  storeOTP(email: string, otp: string): void {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    this.otpStore.set(email, {
      otp,
      email,
      expiresAt,
      attempts: 0,
    });

    // Clean up expired OTPs
    this.cleanupExpiredOTPs();
  }

  verifyOTP(
    email: string,
    providedOTP: string,
  ): { isValid: boolean; message: string } {
    const otpData = this.otpStore.get(email);

    if (!otpData) {
      return { isValid: false, message: 'OTP not found or expired' };
    }

    if (otpData.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(email);
      return {
        isValid: false,
        message: 'Maximum attempts exceeded. Please request a new OTP.',
      };
    }

    if (new Date() > otpData.expiresAt) {
      this.otpStore.delete(email);
      return {
        isValid: false,
        message: 'OTP has expired. Please request a new one.',
      };
    }

    if (otpData.otp !== providedOTP) {
      otpData.attempts++;
      this.otpStore.set(email, otpData);
      return {
        isValid: false,
        message: `Invalid OTP. ${this.MAX_ATTEMPTS - otpData.attempts} attempts remaining.`,
      };
    }

    // OTP is valid, remove it from store
    this.otpStore.delete(email);
    return { isValid: true, message: 'OTP verified successfully' };
  }

  isOTPValid(email: string): boolean {
    const otpData = this.otpStore.get(email);
    if (!otpData) return false;
    return (
      new Date() <= otpData.expiresAt && otpData.attempts < this.MAX_ATTEMPTS
    );
  }

  getOTP(email: string): string | null {
    const otpData = this.otpStore.get(email);
    if (!otpData || new Date() > otpData.expiresAt) return null;
    return otpData.otp;
  }

  private cleanupExpiredOTPs(): void {
    const now = new Date();
    for (const [email, otpData] of this.otpStore.entries()) {
      if (now > otpData.expiresAt) {
        this.otpStore.delete(email);
      }
    }
  }

  // Method to get remaining time for OTP (in seconds)
  getRemainingTime(email: string): number {
    const otpData = this.otpStore.get(email);
    if (!otpData) return 0;

    const now = new Date();
    const remainingMs = otpData.expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.floor(remainingMs / 1000));
  }
}

