// ============================================================
// User Profile Types
// Matches: PUT /kyc/info, PATCH /clients/me, POST /uploads/direct
// ============================================================

/** PUT /kyc/info — update personal info (firstName, lastName, phone, address, dateOfBirth) */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string; // ISO date: "1990-01-15"
}

export interface ProfilePictureResponse {
  url: string;
}
