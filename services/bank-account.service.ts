// ============================================================
// Bank Account Service (Realtor)
// Endpoints: GET /bank-accounts, POST /bank-accounts,
//            GET /bank-accounts/banks, POST /bank-accounts/verify, etc.
// ============================================================

import api from './api';
import type {
  BankAccount,
  Bank,
  AddBankAccountRequest,
  VerifyAccountRequest,
  VerifyAccountResponse,
} from '@/types';

class BankAccountService {
  /** GET /bank-accounts */
  async list(): Promise<BankAccount[]> {
    const res = await api.get<BankAccount[]>('/bank-accounts');
    return res.data!;
  }

  /** POST /bank-accounts — idempotent */
  async add(payload: AddBankAccountRequest): Promise<BankAccount> {
    const res = await api.post<BankAccount>('/bank-accounts', payload);
    return res.data!;
  }

  /** GET /bank-accounts/banks */
  async getBanks(): Promise<Bank[]> {
    const res = await api.get<Bank[]>('/bank-accounts/banks');
    return res.data!;
  }

  /** POST /bank-accounts/verify */
  async verifyAccount(
    payload: VerifyAccountRequest,
  ): Promise<VerifyAccountResponse> {
    const res = await api.post<VerifyAccountResponse>(
      '/bank-accounts/verify',
      payload,
    );
    return res.data!;
  }

  /** PATCH /bank-accounts/:id/default */
  async setDefault(id: string): Promise<void> {
    await api.patch(`/bank-accounts/${id}/default`);
  }

  /** DELETE /bank-accounts/:id */
  async remove(id: string): Promise<void> {
    await api.delete(`/bank-accounts/${id}`);
  }
}

export const bankAccountService = new BankAccountService();
export default bankAccountService;
