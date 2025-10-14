import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { type Message } from '@/types/message';

/**
 * Hook to manage chat messages using TanStack Query
 * Messages are stored in sessionStorage and cleared on tab close
 */
export const useChatMessages = (chatId: number | null) => {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: queryKeys.chat.messages(chatId),
    queryFn: async (): Promise<Message[]> => {
      // For now, return empty array since messages are only stored locally
      // In the future, this could fetch from backend: GET /api/chats/{chatId}/messages
      if (!chatId) {
        return [];
      }

      // TODO: Fetch messages from backend when implemented
      // const response = await chatApi.getMessages(chatId);
      // return response.messages;

      // Return cached messages or empty array
      return queryClient.getQueryData(queryKeys.chat.messages(chatId)) || [];
    },
    staleTime: Infinity, // Messages don't get stale - only updated by mutations
    gcTime: 8 * 60 * 60 * 1000, // Keep in cache for 8 hours
    enabled: chatId !== null, // Only run query if we have a chat_id
  });

  /**
   * Add a new message to the cache
   */
  const addMessage = (message: Message) => {
    queryClient.setQueryData<Message[]>(
      queryKeys.chat.messages(chatId),
      (old = []) => [...old, message]
    );
  };

  /**
   * Update an existing message in the cache
   */
  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    queryClient.setQueryData<Message[]>(
      queryKeys.chat.messages(chatId),
      (old = []) => old.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  };

  /**
   * Clear all messages for the current chat
   */
  const clearMessages = () => {
    queryClient.setQueryData<Message[]>(
      queryKeys.chat.messages(chatId),
      []
    );
  };

  /**
   * Remove messages query from cache entirely
   */
  const removeMessagesCache = () => {
    queryClient.removeQueries({
      queryKey: queryKeys.chat.messages(chatId)
    });
  };

  return {
    messages,
    isLoading,
    addMessage,
    updateMessage,
    clearMessages,
    removeMessagesCache,
  };
};
