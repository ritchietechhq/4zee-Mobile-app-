// ============================================================
// User / Profile Service
// Endpoints: PATCH /clients/me, PUT /kyc/info, POST /uploads/direct
// ============================================================

import api from './api';
import type { User, UpdateProfileRequest, ProfilePictureResponse } from '@/types';

class UserService {
  /** PATCH /clients/me — CLIENT role (only phone + address) */
  async updateClientProfile(data: { phone?: string; address?: string }): Promise<User> {
    const res = await api.patch<User>('/clients/me', data);
    return res.data!;
  }

  /** PUT /kyc/info — CLIENT role (firstName, lastName, phone, address, dateOfBirth) */
  async updateProfile(data: UpdateProfileRequest): Promise<void> {
    await api.put('/kyc/info', data);
  }

  /** POST /uploads/direct — multipart/form-data with category */
  async uploadProfilePicture(formData: FormData): Promise<string> {
    const res = await api.upload<ProfilePictureResponse>(
      '/uploads/direct',
      formData,
    );
    // Prefer publicUrl (permanent/displayable) over url (may be signed/internal)
    const url = res.data!.publicUrl || res.data!.url;
    return url;
  }

  /**
   * GET /uploads?category=PROFILE_PHOTO — fetch user's profile photo from server.
   * Returns the URL of the most recently uploaded profile photo, or null.
   * This allows the profile picture to persist across devices and sessions.
   */
  async getProfilePictureFromServer(): Promise<string | null> {
    try {
      const res = await api.get<ProfilePictureResponse[]>(
        '/uploads',
        { category: 'PROFILE_PHOTO' },
      );
      const files = res.data;
      if (files && files.length > 0) {
        // Take the last uploaded file (most recent)
        const latest = files[files.length - 1];
        return latest.publicUrl || latest.url;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const userService = new UserService();
export default userService;
