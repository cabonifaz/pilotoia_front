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
  company: string;
  area_id: number;
  area: string;
  id_ia_area: number;
  chat_id?: number | null;
  titulo?: string;
}
