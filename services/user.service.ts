// ============================================================
// User / Profile Service
// Endpoints: PATCH /clients/profile, POST /uploads/profile-picture
// ============================================================

import api from './api';
import type { User, UpdateProfileRequest, ProfilePictureResponse } from '@/types';

class UserService {
  /** PATCH /clients/profile — CLIENT role */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const res = await api.patch<User>('/clients/profile', data);
    return res.data!;
  }

  /** POST /uploads/profile-picture — multipart/form-data */
  async uploadProfilePicture(formData: FormData): Promise<string> {
    const res = await api.upload<ProfilePictureResponse>(
      '/uploads/profile-picture',
      formData,
    );
    return res.data!.url;
  }
}

export const userService = new UserService();
export default userService;
