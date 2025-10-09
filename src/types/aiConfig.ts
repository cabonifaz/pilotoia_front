export interface AIConfig {
  user_id: string;
  company_id: string;
  area: string;
  similarity_threshold: number;
  alpha: number;
  temperature: number;
  max_tokens: number;
  top_k: number;
}
