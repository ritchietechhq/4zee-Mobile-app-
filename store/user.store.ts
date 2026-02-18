// ============================================================
// User Store — Zustand
// Profile management via PATCH /clients/profile
// ============================================================

import { create } from 'zustand';
import type { User, UpdateProfileRequest } from '@/types';
import { userService } from '@/services/user.service';

interface UserState {
  profile: User | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProfile: (profile: User) => void;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  uploadProfilePicture: (formData: FormData) => Promise<string>;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  setProfile: (profile: User) => set({ profile }),

  updateProfile: async (data: UpdateProfileRequest) => {
    set({ isLoading: true, error: null });
    try {
      await userService.updateProfile(data);
      set({ isLoading: false });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to update profile.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  uploadProfilePicture: async (formData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const url = await userService.uploadProfilePicture(formData);
      set((state) => ({
        profile: state.profile
          ? { ...state.profile, profilePicture: url }
          : null,
        isLoading: false,
      }));
      return url;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to upload picture.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  clearProfile: () => set({ profile: null, error: null }),
}));
