import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../api/chatApi";
import type { Message } from "../types/message";
import { queryKeys } from "../lib/queryClient";
import { useEffect, useRef } from "react";

const MAX_RECENT_CHATS = 10;

export const useChatMessages = (
  chatId: number | null | undefined,
  company_id: number,
  area_id: number
) => {
  const queryClient = useQueryClient();
  const recentChatsRef = useRef<(number | null)[]>([]);

  // Track and cleanup old chat message caches
  useEffect(() => {
    if (chatId !== undefined) {
      const currentChatId = chatId ?? null;

      // Add chat to recent list (remove if already exists to update position)
      const updatedRecent = [
        currentChatId,
        ...recentChatsRef.current.filter((id) => id !== currentChatId),
      ];

      // Keep only the MAX_RECENT_CHATS most recent
      const chatsToKeep = updatedRecent.slice(0, MAX_RECENT_CHATS);
      const chatsToRemove = updatedRecent.slice(MAX_RECENT_CHATS);

      // Update the ref
      recentChatsRef.current = chatsToKeep;

      // Remove message caches for old chats
      chatsToRemove.forEach((oldChatId) => {
        queryClient.removeQueries({
          queryKey: queryKeys.chat.messages(oldChatId),
          exact: true,
        });
      });
    }
  }, [chatId, queryClient]);

  return useQuery<Message[], Error>({
    queryKey: queryKeys.chat.messages(chatId ?? null),
    queryFn: async () => {
      if (!chatId) return [];
      const response = await chatApi.getMessagesByChat(
        chatId.toString(),
        company_id,
        area_id
      );
      return response.messages; // <-- asegúrate de devolver Message[]
    },
    enabled: !!chatId, // The query will only run if chatId is not null or undefined
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });
};
