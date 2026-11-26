import api from './api';
import {
  ApiResponse,
  UserProfile,
  AuthSessionResponse,
  AccountLookupResponse,
} from '@secure-save/shared-types';

export const authService = {
  /**
   * Look up whether an email is already registered/verified
   */
  async lookupAccount(email: string): Promise<AccountLookupResponse> {
    const res = await api.post<ApiResponse<AccountLookupResponse>>('/auth/session/lookup', {
      email: email.trim().toLowerCase(),
    });
    return res.data?.data || { exists: false };
  },

  /**
   * Request OTP verification email
   */
  async requestOtp(email: string, type: 'registration' | 'pin_reset' = 'registration'): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>('/auth/otp/send', {
      email: email.trim().toLowerCase(),
      type,
    });
    return res.data;
  },

  /**
   * Verify entered OTP code
   */
  async verifyOtp(email: string, otp: string, type: 'registration' | 'pin_reset' = 'registration'): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>('/auth/otp/verify', {
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
      type,
    });
    return res.data;
  },

  /**
   * Setup user PIN
   */
  async setPin(email: string, pin: string): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>('/auth/pin/setup', {
      email: email.trim().toLowerCase(),
      pin,
    });
    return res.data;
  },

  /**
   * Reset user PIN
   */
  async resetPin(email: string, pin: string): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>('/auth/pin/reset', {
      email: email.trim().toLowerCase(),
      pin,
    });
    return res.data;
  },

  /**
   * Authenticate session using Email + PIN
   */
  async loginWithPin(email: string, pin: string): Promise<AuthSessionResponse> {
    const res = await api.post<ApiResponse<AuthSessionResponse>>('/auth/session/login', {
      email: email.trim().toLowerCase(),
      pin,
    });
    if (!res.data?.data) {
      throw new Error(res.data?.message || 'Login failed');
    }
    return res.data.data;
  },

  /**
   * Verify existing JWT session validity
   */
  async getSession(): Promise<{ user: UserProfile }> {
    const res = await api.get<ApiResponse<{ user: UserProfile }>>('/auth/session/me');
    if (!res.data?.data) {
      throw new Error('Session invalid');
    }
    return res.data.data;
  },
};
