import { useState, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryClient";
import {
  chatApi,
  type ChatMessageRequest,
  type AgentMessageRequest,
} from "../api/chatApi";
import { showStreamingErrorToast } from "../utils/errorHandler";
import { type Message } from "@/types/message";
import { type ChatContext } from "@/types/aiConfig";

type JsonRecord = Record<string, unknown>;

export type ChunkEvent = { type: "chunk"; content: string };
export type CompleteEvent = { type: "complete" } & JsonRecord;
export type ErrorEvent = {
  type: "error";
  message: string;
  result?: {
    idTipoMensaje: number;
    mensaje: string;
  };
};
export type ProgressEvent = {
  type: "progress";
  message: string;
};
export type AssistantMetadataEvent = {
  type: "assistant_metadata";
  sender: number;
  created_at: string;
};
export type ChatCreatedEvent = {
  type: "chat_created";
  chat: {
    ID_CHAT: number;
    ID_AREA: number;
    ID_EMPRESA: number;
    TITULO: string;
    ULTIMO_MENSAJE_FECHA: string;
    ID_ESTADO_REGISTRO: number;
  };
};
export type UnknownEvent = { type: string } & JsonRecord;

export type StreamEvent =
  | ChunkEvent
  | CompleteEvent
  | ErrorEvent
  | ProgressEvent
  | AssistantMetadataEvent
  | ChatCreatedEvent
  | UnknownEvent;

interface UseChatStreamReturn {
  isLoading: boolean;
  streamingMessageId: string | null;
  progressMessage: string | null;
  searchVectorial: (message: string, chatContext: ChatContext) => Promise<void>;
  searchVectorialSQL: (
    message: string,
    chatContext: ChatContext,
    token: string
  ) => Promise<void>;
  cancelMessage: () => void;
  currentChatId: number | null;
}

function isRecord(v: unknown): v is JsonRecord {
  return typeof v === "object" && v !== null;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function asStreamEvent(u: unknown): StreamEvent | undefined {
  if (!isRecord(u)) return undefined;
  const t = u["type"];
  if (!isString(t)) return undefined;

  if (t === "chunk") {
    if (isString(u["content"])) {
      return { type: "chunk", content: u["content"] };
    }
    return undefined;
  }

  if (t === "error") {
    const message = isString(u["message"]) ? u["message"] : "Error desconocido";
    const result = isRecord(u["result"])
      ? (u["result"] as { idTipoMensaje: number; mensaje: string })
      : undefined;
    return { type: "error", message, result };
  }

  if (t === "progress") {
    const message = isString(u["message"]) ? u["message"] : "Procesando...";
    return { type: "progress", message };
  }

  if (t === "assistant_metadata") {
    const sender = typeof u["sender"] === "number" ? u["sender"] : 1; // default to AI
    const created_at = isString(u["created_at"])
      ? u["created_at"]
      : Date.now().toString();
    return { type: "assistant_metadata", sender, created_at };
  }

  // complete u otros: los aceptamos como JsonRecord
  return { ...(u as JsonRecord), type: t } as StreamEvent;
}

export const useChatStream = (): UseChatStreamReturn => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef<string>("");
  const animationFrameRef = useRef<number | null>(null);
  const activeChatIdRef = useRef<number | null>(null); // Track the active chat_id for cache operations
  const streamingMessageIdRef = useRef<string | null>(null); // Track the streaming message ID for cache operations

  // Track recently accessed chats (max 10)
  const recentChatsRef = useRef<(number | null)[]>([]);

  // Helper to manage recent chats and cleanup old message caches
  const trackRecentChat = useCallback(
    (chatId: number | null) => {
      const MAX_RECENT_CHATS = 10;

      // Add chat to recent list (remove if already exists to update position)
      const updatedRecent = [
        chatId,
        ...recentChatsRef.current.filter((id) => id !== chatId),
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
    },
    [queryClient]
  );

  // Helper to update chat's last message date in the chat list
  const updateChatLastMessageDate = useCallback(
    (chatId: number | null) => {
      if (chatId === null) return; // Don't update for temp chats

      // Get all chat list query keys and update the matching chat
      const queries = queryClient.getQueriesData({
        queryKey: ["user", "chats"],
      });

      queries.forEach(([queryKey, chatsData]) => {
        if (Array.isArray(chatsData)) {
          const updatedChats = chatsData.map((chat: any) => {
            if (chat.ID_CHAT === chatId) {
              return {
                ...chat,
                ULTIMO_MENSAJE_FECHA: new Date().toISOString(),
              };
            }
            return chat;
          });
          queryClient.setQueryData(queryKey, updatedChats);
        }
      });
    },
    [queryClient]
  );

  // Helper to add messages to cache
  const addMessagesToCache = useCallback(
    (chatId: number | null, messages: Message[]) => {
      trackRecentChat(chatId);

      queryClient.setQueryData<Message[]>(
        queryKeys.chat.messages(chatId),
        (old = []) => {
          const map = new Map<string, Message>();

          // 1️⃣ carga mensajes existentes
          old.forEach((m) => {
            map.set(m.id, m);
          });

          // 2️⃣ agrega nuevos SOLO si no existen
          messages.forEach((m) => {
            if (!map.has(m.id)) {
              map.set(m.id, m);
            }
          });

          return Array.from(map.values());
        }
      );

      updateChatLastMessageDate(chatId);
    },
    [queryClient, trackRecentChat, updateChatLastMessageDate]
  );

  // Helper to update a message in cache
  const updateMessageInCache = useCallback(
    (chatId: number | null, messageId: string, updates: Partial<Message>) => {
      queryClient.setQueryData<Message[]>(
        queryKeys.chat.messages(chatId),
        (old = []) =>
          old.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          )
      );
    },
    [queryClient]
  );

  const cancelMessage = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Update streaming message content on animation frame
  const updateStreamingContent = useCallback(
    (chatId: number | null, messageId: string, content: string) => {
      streamingContentRef.current = content;

      // Cancel previous animation frame if exists
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Schedule update on next animation frame for smooth rendering
      animationFrameRef.current = requestAnimationFrame(() => {
        updateMessageInCache(chatId, messageId, {
          message: streamingContentRef.current,
        });
        animationFrameRef.current = null;
      });
    },
    [updateMessageInCache]
  );

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const searchVectorial = useCallback(
    async (messageContent: string, chatContext: ChatContext) => {
      if (!messageContent.trim()) return;

      setIsLoading(true);
      setProgressMessage(null); // Reset progress message

      // Reset streaming content ref
      streamingContentRef.current = "";

      // Initialize active chat_id with the current chat_id from context
      activeChatIdRef.current = chatContext.chat_id ?? null;

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        sender: 0, // 0 = user
        message: messageContent,
        created_at: Date.now().toString(),
      };

      // Add messages to TanStack Query cache (only user message initially)
      addMessagesToCache(activeChatIdRef.current, [userMessage]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Only send titulo when creating a new chat (chat_id === null)
        const requestPayload = {
          message: messageContent,
          created_at: Date.now().toString(),
          request_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          user_id: chatContext.user_id,
          user: chatContext.user,
          company_id: chatContext.company_id,
          area_id: chatContext.area_id,
          chat_id: chatContext.chat_id,
        };

        // Remove titulo if chat_id is not null (existing chat)
        if (chatContext.chat_id !== null && "titulo" in requestPayload) {
          delete (requestPayload as any).titulo;
        }

        await chatApi.sendStreamingMessage(
          requestPayload as ChatMessageRequest,
          (data) => {
            // Handle incoming SSE message
            const evt = asStreamEvent(data);
            if (!evt) return;

            switch (evt.type) {
              case "progress":
                // Update progress message
                const progressEvt = evt as ProgressEvent;
                setProgressMessage(progressEvt.message);
                break;
              case "metadata":
                // Extract chat_id from metadata if present
                if (isRecord(evt) && typeof evt.chat_id === "number") {
                  const newChatId = evt.chat_id as number;
                  setCurrentChatId(newChatId);

                  // If chat was just created (was null, now has ID), migrate messages
                  if (activeChatIdRef.current === null && newChatId !== null) {
                    // Get messages from null cache
                    const messagesFromNull =
                      queryClient.getQueryData<Message[]>(
                        queryKeys.chat.messages(null)
                      ) || [];

                    // Copy to new chat_id cache
                    if (messagesFromNull.length > 0) {
                      queryClient.setQueryData<Message[]>(
                        queryKeys.chat.messages(newChatId),
                        messagesFromNull
                      );
                    }

                    // Clear the null cache to prevent stale messages from appearing
                    queryClient.removeQueries({
                      queryKey: queryKeys.chat.messages(null),
                      exact: true,
                    });

                    // Update active chat_id for all subsequent operations
                    activeChatIdRef.current = newChatId;
                  }
                }
                break;
              case "chat_created":
                // Add the new chat to the chats list cache
                const chatCreatedEvt = evt as ChatCreatedEvent;
                queryClient.setQueryData<any[]>(
                  ["user", "chats"],
                  (old = []) => {
                    return [chatCreatedEvt.chat, ...old];
                  }
                );
                break;
              case "assistant_metadata":
                // Create AI/Agent message placeholder when backend sends metadata
                const assistantMetadataEvt = evt as AssistantMetadataEvent;
                const assistantMessage: Message = {
                  id: assistantMetadataEvt.created_at, // Use backend timestamp as ID
                  sender: assistantMetadataEvt.sender, // Use sender from backend (1=AI, 2=Agent)
                  message: "",
                  created_at: assistantMetadataEvt.created_at, // Use backend timestamp
                };
                addMessagesToCache(activeChatIdRef.current, [assistantMessage]);
                setStreamingMessageId(assistantMessage.id);
                streamingMessageIdRef.current = assistantMessage.id; // Also update ref for callback access
                break;
              case "chunk":
                // Only update if we have a streaming message ID
                if (streamingMessageIdRef.current) {
                  updateStreamingContent(
                    activeChatIdRef.current,
                    streamingMessageIdRef.current,
                    (evt as ChunkEvent).content
                  );
                } else {
                  console.warn(
                    "[STREAM] Received chunk but no streaming message ID!"
                  );
                }
                break;
              case "complete":
                setProgressMessage(null); // Clear progress message on completion
                controller.abort();
                break;
              case "error":
                const errorEvt = evt as ErrorEvent;

                // Show centralized error toast
                showStreamingErrorToast(errorEvt);

                // Use the result message if available, otherwise use the message field
                const errorMessage =
                  errorEvt.result?.mensaje ||
                  errorEvt.message ||
                  "Error en el streaming";

                // Update the AI message to show error (only if we have a streaming message ID)
                if (streamingMessageIdRef.current) {
                  updateMessageInCache(
                    activeChatIdRef.current,
                    streamingMessageIdRef.current,
                    { message: `Error: ${errorMessage}` }
                  );
                }

                setProgressMessage(null); // Clear progress message on error
                controller.abort();
                break;
              default:
                break;
            }
          },
          () => {
            // Handle connection errors
            const errorMessage = "Error de conexión con el servidor";

            // Only update if we have a streaming message ID
            if (streamingMessageIdRef.current) {
              updateMessageInCache(
                activeChatIdRef.current,
                streamingMessageIdRef.current,
                { message: `Error: ${errorMessage}` }
              );
            }

            controller.abort();
          },
          () => {
            // Handle connection close
            // Check if it was aborted by user
            if (controller.signal.aborted) {
              // Cancel any pending animation frame
              if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
              }

              const currentContent = streamingContentRef.current;
              // Only update if we have a streaming message ID
              if (streamingMessageIdRef.current) {
                updateMessageInCache(
                  activeChatIdRef.current,
                  streamingMessageIdRef.current,
                  {
                    message:
                      currentContent || "Petición detenida por el usuario",
                  }
                );
              }
            }

            setStreamingMessageId(null);
            streamingMessageIdRef.current = null; // Reset ref on close
          },
          () => {
            // Handle connection open
          },
          controller.signal
        );
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Handled in onClose callback
        } else {
          // Only update if we have a streaming message ID
          if (streamingMessageIdRef.current) {
            const errorMsg =
              err instanceof Error
                ? "Error al consultar la API"
                : "Error inesperado";
            updateMessageInCache(
              activeChatIdRef.current,
              streamingMessageIdRef.current,
              { message: errorMsg }
            );
          }
        }
      } finally {
        setIsLoading(false);
        setStreamingMessageId(null);
        streamingMessageIdRef.current = null; // Reset ref
      }
    },
    [
      addMessagesToCache,
      queryClient,
      updateStreamingContent,
      updateMessageInCache,
    ]
  );

  const searchVectorialSQL = useCallback(
    async (messageContent: string, chatContext: ChatContext, token: string) => {
      if (!messageContent.trim()) return;

      setIsLoading(true);
      setProgressMessage(null); // Reset progress message

      // Reset streaming content ref
      streamingContentRef.current = "";

      // Initialize active chat_id with the current chat_id from context
      activeChatIdRef.current = chatContext.chat_id ?? null;

      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        sender: 0, // 0 = user
        message: messageContent,
        created_at: Date.now().toString(),
      };

      // Add messages to TanStack Query cache (only user message initially)
      addMessagesToCache(activeChatIdRef.current, [userMessage]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        // Only send titulo when creating a new chat (chat_id === null)
        const requestPayload = {
          message: messageContent,
          created_at: Date.now().toString(),
          request_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          external_token: token,
          user_id: chatContext.user_id,
          user: chatContext.user,
          company_id: chatContext.company_id,
          area_id: chatContext.area_id,
          chat_id: chatContext.chat_id,
        };

        // Remove titulo if chat_id is not null (existing chat)
        if (chatContext.chat_id !== null && "titulo" in requestPayload) {
          delete (requestPayload as any).titulo;
        }

        await chatApi.sendStreamingMessageAgent(
          requestPayload as AgentMessageRequest,
          (data) => {
            // Handle incoming SSE message
            const evt = asStreamEvent(data);
            if (!evt) return;

            switch (evt.type) {
              case "progress":
                // Update progress message
                const progressEvt = evt as ProgressEvent;
                setProgressMessage(progressEvt.message);
                break;
              case "metadata":
                // Extract chat_id from metadata if present
                if (isRecord(evt) && typeof evt.chat_id === "number") {
                  const newChatId = evt.chat_id as number;
                  setCurrentChatId(newChatId);

                  // If chat was just created (was null, now has ID), migrate messages
                  if (activeChatIdRef.current === null && newChatId !== null) {
                    // Get messages from null cache
                    const messagesFromNull =
                      queryClient.getQueryData<Message[]>(
                        queryKeys.chat.messages(null)
                      ) || [];

                    // Copy to new chat_id cache
                    if (messagesFromNull.length > 0) {
                      queryClient.setQueryData<Message[]>(
                        queryKeys.chat.messages(newChatId),
                        messagesFromNull
                      );
                    }

                    // Clear the null cache to prevent stale messages from appearing
                    queryClient.removeQueries({
                      queryKey: queryKeys.chat.messages(null),
                      exact: true,
                    });

                    // Update active chat_id for all subsequent operations
                    activeChatIdRef.current = newChatId;
                  }
                }
                break;
              case "chat_created": // Add the new chat to the chats list cache
              {
                const chatCreatedEvt = evt as ChatCreatedEvent;
                queryClient.setQueryData<any[]>(
                  ["user", "chats"],
                  (old = []) => {
                    return [chatCreatedEvt.chat, ...old];
                  }
                );
                break;
              }
              case "assistant_metadata": // Create AI/Agent message placeholder when backend sends metadata
              {
                const assistantMetadataEvt = evt as AssistantMetadataEvent;
                const assistantMessage: Message = {
                  id: assistantMetadataEvt.created_at, // Use backend timestamp as ID
                  sender: assistantMetadataEvt.sender, // Use sender from backend (1=AI, 2=Agent)
                  message: "",
                  created_at: assistantMetadataEvt.created_at, // Use backend timestamp
                };
                addMessagesToCache(activeChatIdRef.current, [assistantMessage]);
                setStreamingMessageId(assistantMessage.id);
                streamingMessageIdRef.current = assistantMessage.id; // Also update ref for callback access
                break;
              }
              case "chunk":
                // Only update if we have a streaming message ID
                if (streamingMessageIdRef.current) {
                  updateStreamingContent(
                    activeChatIdRef.current,
                    streamingMessageIdRef.current,
                    (evt as ChunkEvent).content
                  );
                } else {
                  console.warn(
                    "[STREAM] Received chunk but no streaming message ID!"
                  );
                }
                break;
              case "complete":
                setProgressMessage(null); // Clear progress message on completion
                controller.abort();
                break;
              case "error": {
                const errorEvt = evt as ErrorEvent;

                // Show centralized error toast
                showStreamingErrorToast(errorEvt);

                // Use the result message if available, otherwise use the message field
                const errorMessage =
                  errorEvt.result?.mensaje ||
                  errorEvt.message ||
                  "Error en el streaming";

                // Update the AI message to show error (only if we have a streaming message ID)
                if (streamingMessageIdRef.current) {
                  updateMessageInCache(
                    activeChatIdRef.current,
                    streamingMessageIdRef.current,
                    { message: `Error: ${errorMessage}` }
                  );
                }

                setProgressMessage(null); // Clear progress message on error
                controller.abort();
                break;
              }
              default:
                break;
            }
          },
          () => {
            // Handle connection errors
            const errorMessage = "Error de conexión con el servidor";

            // Only update if we have a streaming message ID
            if (streamingMessageIdRef.current) {
              updateMessageInCache(
                activeChatIdRef.current,
                streamingMessageIdRef.current,
                { message: `Error: ${errorMessage}` }
              );
            }

            controller.abort();
          },
          () => {
            // Handle connection close
            // Check if it was aborted by user
            if (controller.signal.aborted) {
              // Cancel any pending animation frame
              if (animationFrameRef.current !== null) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
              }

              const currentContent = streamingContentRef.current;
              // Only update if we have a streaming message ID
              if (streamingMessageIdRef.current) {
                updateMessageInCache(
                  activeChatIdRef.current,
                  streamingMessageIdRef.current,
                  {
                    message:
                      currentContent || "Petición detenida por el usuario",
                  }
                );
              }
            }

            setStreamingMessageId(null);
            streamingMessageIdRef.current = null; // Reset ref on close
          },
          () => {
            // Handle connection open
          },
          controller.signal
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // Handled in onClose callback
        } else {
          // Only update if we have a streaming message ID
          if (streamingMessageId) {
            const errorMsg =
              error instanceof Error
                ? "Error al consultar la API"
                : "Error inesperado";
            updateMessageInCache(
              chatContext.chat_id ?? null,
              streamingMessageId,
              { message: errorMsg }
            );
          }
        }
      } finally {
        setIsLoading(false);
        setStreamingMessageId(null);
      }
    },
    [
      updateStreamingContent,
      addMessagesToCache,
      updateMessageInCache,
      streamingMessageId,
    ]
  );

  return {
    isLoading,
    streamingMessageId,
    progressMessage,
    searchVectorial,
    searchVectorialSQL,
    cancelMessage,
    currentChatId,
  };
};
