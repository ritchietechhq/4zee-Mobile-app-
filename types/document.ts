// ============================================================
// Document Types
// Matches: GET /documents/application/:id, GET /documents/:id/download
// ============================================================

export type DocumentType = 'RECEIPT' | 'AGREEMENT' | 'DEED' | 'OTHER';

export interface Document {
  id: string;
  type: DocumentType;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}
