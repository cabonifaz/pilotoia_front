import apiClient from './apiClient';
import { createSSEConnection } from './sseClient';
import type { MensajeResponse } from './interfaces/Mensaje';

export const chatApi = {
    sendMessage: async (messageRequest: ChatMessageRequest): Promise<ChatMessageResponse> => {
        const response = await apiClient.post<ChatMessageResponse>('/v1/rag/chat', messageRequest);
        return response.data;
    },

    // For streaming chat using SSE client with integrated config
    sendStreamingMessage: async (
        messageRequest: ChatMessageRequest,
        onMessage: (data: any) => void,
        onError?: (error: Event) => void,
        onClose?: (event: CloseEvent) => void,
        onOpen?: () => void
    ): Promise<void> => {
        return createSSEConnection({
            endpoint: '/v1/rag/chat-streaming',
            onMessage,
            onError,
            onClose,
            onOpen
        }, messageRequest);
    },

    // For agent streaming chat using SSE client with external token
    sendStreamingMessageAgent: async (
        messageRequest: AgentMessageRequest,
        onMessage: (data: any) => void,
        onError?: (error: Event) => void,
        onClose?: (event: CloseEvent) => void,
        onOpen?: () => void
    ): Promise<void> => {
        return createSSEConnection({
            endpoint: '/v1/rag/agent-streaming',
            onMessage,
            onError,
            onClose,
            onOpen
        }, messageRequest);
    },

    getChatHistory: async (userId: string, companyId?: string): Promise<ChatHistoryResponse> => {
        const params = new URLSearchParams({ user_id: userId });
        if (companyId) {
            params.append('company_id', companyId);
        }

        const response = await apiClient.get<ChatHistoryResponse>(`/v1/rag/chat/history?${params.toString()}`);
        return response.data;
    },

    clearChatHistory: async (userId: string, companyId?: string): Promise<ClearHistoryResponse> => {
        const response = await apiClient.delete<ClearHistoryResponse>('/v1/rag/chat/history', {
            data: { user_id: userId, company_id: companyId }
        });
        return response.data;
    },

    getAvailableAreas: async (): Promise<AreasResponse> => {
        try {
            const response = await apiClient.get<AreasResponse>('/v1/rag/chat/areas');
            return response.data;
        } catch (error) {
            if (!(error instanceof Error)) {
                console.error('Error al obtener las �reas:', error);
            }
            throw error;
        }
    },

    validateConfig: async (config: ChatConfigRequest): Promise<ConfigValidationResponse> => {
        const response = await apiClient.post<ConfigValidationResponse>('/v1/rag/chat/validate-config', config);
        return response.data;
    }
};

export interface ChatMessageRequest {
    message: string;
    user_id: string;
    company_id: string;
    area: string;
    similarity_threshold: number;
    alpha: number;
    temperature: number;
    max_tokens: number;
    top_k: number;
}

export interface AgentMessageRequest {
    message: string;
    user_id: string;
    company_id: string;
    area: string;
    similarity_threshold: number;
    alpha: number;
    temperature: number;
    max_tokens: number;
    top_k: number;
    external_token: string;
}

interface ChatMessageResponse {
    response: string;
    metadata?: {
        sources?: string[];
        similarity_scores?: number[];
        processing_time?: number;
    };
    result: MensajeResponse;
}

interface ChatHistoryResponse {
    messages: ChatHistoryMessage[];
    result: MensajeResponse;
}

interface ChatHistoryMessage {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}

interface ClearHistoryResponse {
    result: MensajeResponse;
}

interface AreasResponse {
    areas: string[];
    result: MensajeResponse;
}

interface ChatConfigRequest {
    user_id: string;
    company_id: string;
    area: string;
    similarity_threshold: number;
    temperature: number;
    max_tokens: number;
}

interface ConfigValidationResponse {
    isValid: boolean;
    errors?: string[];
    result: MensajeResponse;
}