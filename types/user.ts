// ============================================================
// User Profile Types
// Matches: PATCH /clients/profile, POST /uploads/profile-picture
// ============================================================

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  dateOfBirth?: string; // ISO date: "1990-01-15"
}

export interface ProfilePictureResponse {
  url: string;
}
