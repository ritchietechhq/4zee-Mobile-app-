// ============================================================
// Authentication Types
// Matches: POST /auth/register, /auth/login, /auth/refresh, etc.
// ============================================================

export type UserRole = 'CLIENT' | 'REALTOR' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  isEmailVerified: boolean;
  is2FAEnabled: boolean;
  profilePicture?: string;
  createdAt: string;
  // Role-specific IDs from the backend
  clientId?: string;   // Present for CLIENT users
  realtorId?: string;  // Present for REALTOR users
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  user: User;
}

/** 2FA required — returned when login needs second factor */
export interface Auth2FARequired {
  requires2FA: true;
  userId: string;
  message: string;
}

/** Login response can be either full tokens or 2FA challenge */
export type LoginResponse = AuthTokens | Auth2FARequired;

export function is2FARequired(response: LoginResponse): response is Auth2FARequired {
  return 'requires2FA' in response && response.requires2FA === true;
}

// ---- Request DTOs ----

export interface RegisterRequest {
  email: string;
  password: string;
  role: 'CLIENT' | 'REALTOR';
  // CLIENT only fields
  firstName?: string;
  lastName?: string;
  phone?: string;
  // REALTOR required field
  dob?: string; // ISO date: "YYYY-MM-DD" — required for REALTOR
  // Optional for both
  referralCode?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Verify2FARequest {
  userId: string;
  code: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken?: string;
  logoutAll?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export type OTPType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'PHONE_VERIFICATION';

export interface RequestOTPPayload {
  type: OTPType;
}

export interface VerifyOTPPayload {
  code: string;
  type: OTPType;
}

export interface RevokeSessionRequest {
  sessionId?: string;
  deviceId?: string;
}

export interface Session {
  id: string;
  deviceInfo: string;
  deviceId: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface TwoFASetupResponse {
  secret: string;
  qrCodeUrl: string;
}
