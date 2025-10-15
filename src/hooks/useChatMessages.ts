import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import type { Message } from '../types/message';
import { queryKeys } from '../lib/queryClient';

export const useChatMessages = (chatId: number | null | undefined) => {
  return useQuery<Message[], Error>({
    queryKey: queryKeys.chat.messages(chatId ?? null),
    queryFn: () => {
      if (!chatId) {
        return Promise.resolve([]);
      }
      return chatApi.getMessagesByChat(chatId.toString());
    },
    enabled: !!chatId, // The query will only run if chatId is not null or undefined
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });
};