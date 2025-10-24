export interface PresignedUrlRequest {
  company_id: number;
  area_id: number;
  user_id: number;
  embedding_model: string;
  pdf_keys: string[];
}

export interface PresignedUrlResponse {
  process_id: string;
  pdf_key: string;
  presigned_url: string;
  process_stage: number;
  is_text_based: boolean;
  uploaded_by_id: number;
  company_id: number;
  area_id: number;
  embedding_model: string;
  created_at: string;
}

