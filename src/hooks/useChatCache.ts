import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryClient";
import { type Message } from "@/types/message";
import { type ChatCreatedEvent } from "../utils/sseEventParser";

export const useChatCache = () => {
  const queryClient = useQueryClient();

  const updateChatLastMessageDate = useCallback(
    (chatId: number | null) => {
      if (chatId === null) return;
      const queries = queryClient.getQueriesData({ queryKey: ["user", "chats"] });
      queries.forEach(([queryKey, chatsData]) => {
        if (Array.isArray(chatsData)) {
          const updatedChats = chatsData.map((chat: any) =>
            chat.ID_CHAT === chatId
              ? { ...chat, ULTIMO_MENSAJE_FECHA: new Date().toISOString() }
              : chat
          );
          queryClient.setQueryData(queryKey, updatedChats);
        }
      });
    },
    [queryClient]
  );

  const addMessagesToCache = useCallback(
    (chatId: number | null, messages: Message[]) => {
      queryClient.setQueryData<any>(
        queryKeys.chat.messages(chatId),
        (old: { pages: any }) => {
          if (!old) {
            return {
              pages: [{ messages, last_evaluated_key: null }],
              pageParams: [null],
            };
          }
          const newPages = [...old.pages];
          newPages[0] = {
            ...newPages[0],
            messages: [...newPages[0].messages, ...messages],
          };
          return { ...old, pages: newPages };
        }
      );
      updateChatLastMessageDate(chatId);
    },
    [queryClient, updateChatLastMessageDate]
  );

  const updateMessageInCache = useCallback(
    (chatId: number | null, messageId: string, updates: Partial<Message>) => {
      queryClient.setQueryData<any>(
        queryKeys.chat.messages(chatId),
        (old: { pages: any[] }) => {
          if (!old || !old.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              messages: page.messages.map((msg: Message) =>
                msg.id === messageId ? { ...msg, ...updates } : msg
              ),
            })),
          };
        }
      );
    },
    [queryClient]
  );

  // Migrates messages from the temporary null-chat cache to a newly created chat's cache
  const migrateTempCache = useCallback(
    (newChatId: number) => {
      const tempCacheData = queryClient.getQueryData<any>(
        queryKeys.chat.messages(null)
      );
      if (tempCacheData) {
        queryClient.setQueryData(queryKeys.chat.messages(newChatId), tempCacheData);
        queryClient.removeQueries({ queryKey: queryKeys.chat.messages(null) });
      }
    },
    [queryClient]
  );

  const addNewChatToList = useCallback(
    (chat: ChatCreatedEvent["chat"]) => {
      queryClient.setQueryData<any[]>(["user", "chats"], (old = []) => [chat, ...old]);
    },
    [queryClient]
  );

  return {
    addMessagesToCache,
    updateMessageInCache,
    migrateTempCache,
    addNewChatToList,
  };
};
