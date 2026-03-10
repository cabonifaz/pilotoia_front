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
  }>;
}

export interface DocumentoIngestItem {
  nombre_documento: string;
  ruta_documento: string;
  id_modelo_embedding: number;
  cant_paginas?: number;
  tamano_bytes?: number;
}

export interface RegisterIngestRequest {
  id_empresa: number;
  id_area: number;
  documentos: DocumentoIngestItem[];
}

export interface RegisterIngestResponse {
  registros: Array<{ id_documento: number; id_proceso: number }>;
  total: number;
}

export interface RagDocumentRecord {
  ID_DOCUMENTO: number;
  ID_ESTADO: number;
  NOMBRE_DOCUMENTO: string;
  RUTA_DOCUMENTO: string;
  FCHCRE: string;
  CANT_PAGINAS: number | null;
  TAMANO_BYTES: number | null;
  ID_PROCESO: number;
  NRO_INTENTO: number;
  ID_ESTADO_PROCESO: number;
  ESTADO_NOMBRE: string;
  FCH_INICIO: string | null;
  FCH_FIN: string | null;
  DURACION_SEG: number | null;
  MENSAJE_ERROR: string | null;
  ULTIMA_ETAPA_EXITOSA: number | null;
}

export interface PaginatedRagDocumentsResponse {
  registros: RagDocumentRecord[];
  total_registros: number;
  total_paginas: number;
  pagina_actual: number;
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
  en_ejecucion: number;
  ruta_documento: string;
}
