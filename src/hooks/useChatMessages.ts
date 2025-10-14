import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { type Message } from '@/types/message';

/**
 * Hook to manage chat messages using TanStack Query
 * Messages are managed in-memory and cleared on tab close or logout
 */
export const useChatMessages = (chatId: number | null) => {
  const queryClient = useQueryClient();

  // Directly read from cache - messages are added by useChatStream
  const messages = queryClient.getQueryData<Message[]>(queryKeys.chat.messages(chatId)) || [];

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
    isLoading: false, // Messages are read directly from cache, no async loading
    addMessage,
    updateMessage,
    clearMessages,
    removeMessagesCache,
  };
};
