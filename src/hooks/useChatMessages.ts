import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../api/chatApi";
import { queryKeys } from "../lib/queryClient";
import { useEffect } from "react";

const MAX_RECENT_CHATS = 10;

// Module-level: persists across component mounts for the entire app session
const recentChats: (number | null)[] = [];

export const useChatMessages = (
  chatId: number | null | undefined,
  company_id: number,
  area_id: number,
) => {
  const queryClient = useQueryClient();

  // Track and cleanup old chat message caches
  useEffect(() => {
    if (chatId !== undefined) {
      const currentChatId = chatId ?? null;

      // Add chat to recent list (remove if already exists to update position)
      const updatedRecent = [
        currentChatId,
        ...recentChats.filter((id) => id !== currentChatId),
      ];

      // Keep only the MAX_RECENT_CHATS most recent
      const chatsToKeep = updatedRecent.slice(0, MAX_RECENT_CHATS);
      const chatsToRemove = updatedRecent.slice(MAX_RECENT_CHATS);

      // Update module-level array in place
      recentChats.length = 0;
      recentChats.push(...chatsToKeep);

      // Remove message caches for old chats
      chatsToRemove.forEach((oldChatId) => {
        queryClient.removeQueries({
          queryKey: queryKeys.chat.messages(oldChatId),
          exact: true,
        });
      });
    }
  }, [chatId, queryClient]);

  return useInfiniteQuery({
    queryKey: queryKeys.chat.messages(chatId ?? null),

    // 1. Especificamos que pageParam puede ser null o el objeto de Dynamo
    queryFn: async ({ pageParam }: { pageParam: any }) => {
      if (!chatId) return { messages: [], last_evaluated_key: null };

      return chatApi.getMessagesByChat(
        chatId.toString(),
        company_id,
        area_id,
        pageParam,
      );
    },

    // 3. Definimos el tipo del parámetro inicial explícitamente si es necesario
    initialPageParam: null as any,

    getNextPageParam: (lastPage) => lastPage.last_evaluated_key ?? undefined,
    enabled: !!chatId,
    staleTime: Infinity,
  });
};
