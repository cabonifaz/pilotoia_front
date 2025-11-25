export interface PresignedUrlRequest {
  company_id: number;
  area_id: number;
  user_id: number;
  embedding_model: string;
  pdf_keys: string[];
}

export interface BatchUploadKnowledgeRequest {
  id_empresa: number;
  id_area: number;
  pdf_keys: string[];
  id_modelo_embedding?: string;
}

export interface BatchUploadKnowledgeResponse {
  uploads: Array<{
    presigned_url: string;
    s3_key: string;
    document_name: string;
    results: Array<{
      ID_TIPO_MENSAJE: number;
      MENSAJE: string;
    }>;
  }>;
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export interface PresignedUrlResponse {
  process_id: string;
  pdf_key: string;
  presigned_url: string;
  process_stage: number;
  is_error: boolean;
  is_text_based: boolean;
  uploaded_by_id: number;
  company_id: number;
  area_id: number;
  embedding_model: string;
  created_at: string;
}

export interface KnowledgeLogsResponse {
  process_id: string;
  pdf_key: string;
  process_stage: number;
  is_error: boolean;
  uploaded_by_id: number;
  company_id: number;
  area_id: number;
  embedding_model: string;
  created_at: string;
}

export interface KnowledgeLoadResponse {
  id: string;
  id_usuario: number;
  usuario_carga: string;
  id_empresa: number;
  empresa: string;
  id_area: number;
  area: string;
  id_estado_proceso: number;
  estado_proceso: string;
  embedding_model_provider: string;
  embedding_model: string;
  documento: string;
  fecha_ultima_actualizacion: string;
  fecha_inicio: string;
  fecha_extraccion: string;
  fecha_segmentacion: string;
  fecha_vectorizacion: string;
  fecha_finalizado: string;
}
