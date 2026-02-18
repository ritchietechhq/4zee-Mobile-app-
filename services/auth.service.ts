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

class AuthService {
  /** POST /auth/register */
  async register(payload: RegisterRequest): Promise<AuthTokens> {
    const res = await api.post<AuthTokens>('/auth/register', payload);
    const tokens = res.data!;
    await api.setAccessToken(tokens.accessToken);
    await api.setRefreshToken(tokens.refreshToken);
    return tokens;
  }

  /** POST /auth/login — may return 2FA challenge or full tokens */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>('/auth/login', credentials);
    const data = res.data!;
    // Only store tokens if this is NOT a 2FA challenge
    if ('accessToken' in data) {
      await api.setAccessToken(data.accessToken);
      await api.setRefreshToken(data.refreshToken);
    }
    return data;
  }

  /** POST /auth/2fa/verify-login */
  async verify2FA(payload: Verify2FARequest): Promise<AuthTokens> {
    const res = await api.post<AuthTokens>('/auth/2fa/verify-login', payload);
    const tokens = res.data!;
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
    const res = await api.get<User>('/auth/me');
    return res.data!;
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
