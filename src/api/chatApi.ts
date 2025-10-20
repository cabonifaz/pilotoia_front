import apiClient from './apiClient';
import { createSSEConnection } from './sseClient';
import type { Message } from './../types/message';
import type {
    ChatMessageRequest,
    AgentMessageRequest,
    ChatMessageResponse,
    ChatHistoryResponse,
    ClearHistoryResponse,
    AreasResponse,
    ChatConfigRequest,
    ConfigValidationResponse,
    MessageListResponse
} from '@/types/chat';

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
        onOpen?: () => void,
        signal?: AbortSignal
    ): Promise<void> => {
        return createSSEConnection({
            endpoint: '/v1/rag/chat-streaming',
            onMessage,
            onError,
            onClose,
            onOpen,
            signal
        }, messageRequest);
    },

    // For agent streaming chat using SSE client with external token
    sendStreamingMessageAgent: async (
        messageRequest: AgentMessageRequest,
        onMessage: (data: any) => void,
        onError?: (error: Event) => void,
        onClose?: (event: CloseEvent) => void,
        onOpen?: () => void,
        signal?: AbortSignal
    ): Promise<void> => {
        return createSSEConnection({
            endpoint: '/v1/rag/agent-streaming',
            onMessage,
            onError,
            onClose,
            onOpen,
            signal
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
                console.error('Error al obtener las áreas:', error);
            }
            throw error;
        }
    },

    validateConfig: async (config: ChatConfigRequest): Promise<ConfigValidationResponse> => {
        const response = await apiClient.post<ConfigValidationResponse>('/v1/rag/chat/validate-config', config);
        return response.data;
    },

    getUserChats: async (): Promise<any[]> => {
        const response = await apiClient.get<{ chats: any[] }>('/v1/chats/get_chats');
        return response.data.chats || [];
    },

    getMessagesByChat: async (chatId: string): Promise<Message[]> => {
        const response = await apiClient.get<MessageListResponse>(`/v1/messages/chat/${chatId}`);
        return response.data.messages;
    },

    updateChatTitle: async (chatId: number, titulo: string): Promise<{ ID_TIPO_MENSAJE: number; MENSAJE: string }> => {
        const response = await apiClient.patch(`/v1/chats/${chatId}`, { titulo });
        return response.data;
    },

    deleteChat: async (chatId: number): Promise<{ ID_TIPO_MENSAJE: number; MENSAJE: string }> => {
        const response = await apiClient.delete(`/v1/chats/${chatId}`);
        return response.data;
    }
};

// Re-export types for backwards compatibility
export type {
    ChatMessageRequest,
    AgentMessageRequest,
    ChatMessageResponse,
    ChatHistoryResponse,
    ClearHistoryResponse,
    AreasResponse,
    ChatConfigRequest,
    ConfigValidationResponse,
    MessageListResponse
};