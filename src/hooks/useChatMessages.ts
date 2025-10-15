import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { type Message } from '@/types/message';

/**
 * Hook to manage chat messages using TanStack Query
 * Messages are managed in-memory and cleared on tab close or logout
 */
export const useChatMessages = (chatId: number | null) => {
  const queryClient = useQueryClient();

  // Use useQuery to keep the cache entry active and prevent garbage collection
  const { data: messages = [] } = useQuery({
    queryKey: queryKeys.chat.messages(chatId),
    queryFn: () => {
      // Return existing cache data or empty array
      return queryClient.getQueryData<Message[]>(queryKeys.chat.messages(chatId)) || [];
    },
    staleTime: Infinity, // Messages are always fresh (managed by useChatStream)
    gcTime: Infinity, // Never garbage collect while component is mounted
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
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
    isLoading: false, // Messages are read directly from cache, no async loading
    addMessage,
    updateMessage,
    clearMessages,
    removeMessagesCache,
  };
};
