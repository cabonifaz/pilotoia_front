import type { MensajeResponse } from './Mensaje';
import type { Message } from './message';

export interface MessageListResponse {
    messages: Message[];
    last_evaluated_key?: Record<string, any>;
}

export interface ChatMessageRequest {
    message: string;
    user_id: number;
    user: string;
    company_id: number;
    area_id: number;
    id_ia_area: number;
    similarity_threshold: number;
    alpha: number;
    temperature: number;
    max_tokens: number;
    top_k: number;
}

export interface AgentMessageRequest {
    message: string;
    user_id: number;
    user: string;
    company_id: number;
    area_id: number;
    id_ia_area: number;
    similarity_threshold: number;
    alpha: number;
    temperature: number;
    max_tokens: number;
    top_k: number;
    external_token: string;
}

export interface ChatMessageResponse {
    response: string;
    metadata?: {
        sources?: string[];
        similarity_scores?: number[];
        processing_time?: number;
    };
    result: MensajeResponse;
}

export interface ChatHistoryResponse {
    messages: ChatHistoryMessage[];
    result: MensajeResponse;
}

export interface ChatHistoryMessage {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}

export interface ClearHistoryResponse {
    result: MensajeResponse;
}

export interface AreasResponse {
    areas: string[];
    result: MensajeResponse;
}

export interface ChatConfigRequest {
    user_id: string;
    company_id: string;
    area: string;
    similarity_threshold: number;
    temperature: number;
    max_tokens: number;
}

export interface ConfigValidationResponse {
    isValid: boolean;
    errors?: string[];
    result: MensajeResponse;
}
