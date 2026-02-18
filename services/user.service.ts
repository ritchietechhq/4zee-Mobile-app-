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
    const url = res.data!.url;
    return url;
  }
}

export const userService = new UserService();
export default userService;
