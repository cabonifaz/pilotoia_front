// AI/RAG configuration parameters only
export interface AIConfig {
  similarity_threshold: number;
  alpha: number;
  temperature: number;
  max_tokens: number;
  top_k: number;
}

// Request context data (user, company, area, chat)
export interface ChatContext {
  user_id: number;
  user: string;
  company_id: number;
  area_id: number;
  id_ia_area: number;
  chat_id?: number | null;
  titulo?: string;
}

// IA area configuration update request
export interface UpdateIaAreaConfigRequest {
  id_empresa: number;
  id_area: number;
  id_embeddings: number;
  id_llm: number;
  embeddings_dimensions: number;
  llm_max_tokens: number;
  llm_temperature: number;
  llm_top_p: number;
  rag_top_k_results: number;
  rag_similarity_threshold: number;
  rag_alpha: number;
  role_behavior: string;
}

// IA configuration API response (for update)
export interface IaConfigResponse {
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

// IA area configuration GET response
export interface GetIaAreaConfigResponse {
  result: {
    id_ia_area: number;
    id_area: number;
    id_embeddings: number;
    id_llm: number;
    embeddings_dimensions: number;
    llm_max_tokens: number;
    llm_temperature: number;
    llm_top_p: number;
    rag_top_k_results: number;
    rag_similarity_threshold: number;
    rag_alpha: number;
    role_behavior: string;
  };
}
