// ============================================================
// Bank Account Types
// Matches: GET /bank-accounts, POST /bank-accounts, etc.
// ============================================================

export interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
  isVerified: boolean;
  createdAt: string;
}

export interface Bank {
  name: string;
  code: string;
}

export interface AddBankAccountRequest {
  bankCode: string;
  accountNumber: string;
  isDefault?: boolean;
}

export interface VerifyAccountRequest {
  bankCode: string;
  accountNumber: string;
}

export interface VerifyAccountResponse {
  accountNumber: string;
  accountName: string;
  bankCode: string;
}
