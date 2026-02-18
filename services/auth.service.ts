// ============================================================
// Auth Service
// Endpoints: /auth/register, /auth/login, /auth/refresh, /auth/logout,
//            /auth/me, /auth/sessions, /auth/2fa/*, /auth/otp/*,
//            /auth/forgot-password, /auth/reset-password
// ============================================================

import api from './api';
import type {
  User,
  AuthTokens,
  Auth2FARequired,
  LoginResponse,
  RegisterRequest,
  LoginRequest,
  Verify2FARequest,
  LogoutRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  RequestOTPPayload,
  VerifyOTPPayload,
  RevokeSessionRequest,
  Session,
  TwoFASetupResponse,
} from '@/types';

/**
 * Normalize a raw user object from the backend.
 * Backend may return `userId` instead of `id`, and may nest
 * client/realtor profile data inside a `client` or `realtor` key.
 */
function normalizeUser(raw: any): User {
  // The backend uses `userId` as the primary key in some responses
  const id = raw.id || raw.userId;
  const role = raw.role;

  // Backend may nest profile fields inside `client` or `realtor`
  const nested = raw.client || raw.realtor || {};

  return {
    id,
    email: raw.email,
    firstName: raw.firstName || nested.firstName || '',
    lastName: raw.lastName || nested.lastName || '',
    phone: raw.phone || nested.phone || '',
    role,
    isEmailVerified: raw.isEmailVerified ?? raw.emailVerified ?? false,
    is2FAEnabled: raw.is2FAEnabled ?? raw.twoFactorEnabled ?? false,
    profilePicture: raw.profilePicture || nested.profilePicture || undefined,
    createdAt: raw.createdAt || '',
    // Role-specific sub-record IDs
    clientId: raw.clientId || raw.client?.id || undefined,
    realtorId: raw.realtorId || raw.realtor?.id || undefined,
  };
}

/** Normalize the tokens+user envelope from login/register/2fa */
function normalizeAuthTokens(raw: any): AuthTokens {
  return {
    accessToken: raw.accessToken,
    refreshToken: raw.refreshToken,
    expiresIn: raw.expiresIn,
    refreshExpiresIn: raw.refreshExpiresIn,
    user: normalizeUser(raw.user),
  };
}

class AuthService {
  /** POST /auth/register */
  async register(payload: RegisterRequest): Promise<AuthTokens> {
    const res = await api.post<any>('/auth/register', payload);
    const tokens = normalizeAuthTokens(res.data!);
    await api.setAccessToken(tokens.accessToken);
    await api.setRefreshToken(tokens.refreshToken);
    return tokens;
  }

  /** POST /auth/login — may return 2FA challenge or full tokens */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const res = await api.post<any>('/auth/login', credentials);
    const data = res.data!;
    // Only store tokens if this is NOT a 2FA challenge
    if ('accessToken' in data) {
      const tokens = normalizeAuthTokens(data);
      await api.setAccessToken(tokens.accessToken);
      await api.setRefreshToken(tokens.refreshToken);
      return tokens;
    }
    return data as Auth2FARequired;
  }

  /** POST /auth/2fa/verify-login */
  async verify2FA(payload: Verify2FARequest): Promise<AuthTokens> {
    const res = await api.post<any>('/auth/2fa/verify-login', payload);
    const tokens = normalizeAuthTokens(res.data!);
    await api.setAccessToken(tokens.accessToken);
    await api.setRefreshToken(tokens.refreshToken);
    return tokens;
  }

  /** POST /auth/logout */
  async logout(logoutAll = false): Promise<void> {
    try {
      const refreshToken = await api.getRefreshToken();
      const body: LogoutRequest = logoutAll
        ? { logoutAll: true }
        : { refreshToken: refreshToken || undefined };
      await api.post('/auth/logout', body);
    } catch {
      // Silently fail — we clear tokens regardless
    } finally {
      await api.clearTokens();
    }
  }

  /** GET /auth/me */
  async getMe(): Promise<User> {
    const res = await api.get<any>('/auth/me');
    const raw = res.data!;
    console.log('=== /auth/me RAW ===', JSON.stringify(raw, null, 2));
    return normalizeUser(raw);
  }

  /** GET /auth/sessions */
  async getSessions(): Promise<Session[]> {
    const res = await api.get<Session[]>('/auth/sessions');
    return res.data!;
  }

  /** POST /auth/sessions/revoke */
  async revokeSession(payload: RevokeSessionRequest): Promise<void> {
    await api.post('/auth/sessions/revoke', payload);
  }

  /** POST /auth/2fa/setup */
  async setup2FA(): Promise<TwoFASetupResponse> {
    const res = await api.post<TwoFASetupResponse>('/auth/2fa/setup');
    return res.data!;
  }

  /** POST /auth/2fa/enable */
  async enable2FA(code: string): Promise<void> {
    await api.post('/auth/2fa/enable', { code });
  }

  /** POST /auth/2fa/disable */
  async disable2FA(code: string): Promise<void> {
    await api.post('/auth/2fa/disable', { code });
  }

  /** POST /auth/otp/request */
  async requestOTP(payload: RequestOTPPayload): Promise<void> {
    await api.post('/auth/otp/request', payload);
  }

  /** POST /auth/otp/verify */
  async verifyOTP(payload: VerifyOTPPayload): Promise<void> {
    await api.post('/auth/otp/verify', payload);
  }

  /** POST /auth/forgot-password */
  async forgotPassword(payload: ForgotPasswordRequest): Promise<void> {
    await api.post('/auth/forgot-password', payload);
  }

  /** POST /auth/reset-password */
  async resetPassword(payload: ResetPasswordRequest): Promise<void> {
    await api.post('/auth/reset-password', payload);
  }
}

export const authService = new AuthService();
export default authService;
