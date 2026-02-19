// ============================================================
// Document Service
// Endpoints: GET /documents/application/:id, GET /documents/:id/download
// ============================================================

import api from './api';
import type { Document } from '@/types';

class DocumentService {
  /** GET /documents/application/:applicationId */
  async getApplicationDocuments(applicationId: string): Promise<Document[]> {
    const res = await api.get<Document[]>(
      `/documents/application/${applicationId}`,
    );
    return res.data!;
  }

  /**
   * GET /documents/:id/download
   * Returns the download URL. Actual file download should use
   * RNFetchBlob or expo-file-system with the authorization header.
   */
  getDownloadUrl(documentId: string): string {
    const baseUrl =
      process.env.EXPO_PUBLIC_API_URL || 'https://fourzeeproperties-backend.onrender.com';
    return `${baseUrl}/documents/${documentId}/download`;
  }
}

export const documentService = new DocumentService();
export default documentService;
