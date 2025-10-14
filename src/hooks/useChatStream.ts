import { useState, useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { chatApi, type ChatMessageRequest, type AgentMessageRequest } from '../api/chatApi';
import { showStreamingErrorToast } from '../utils/errorHandler';
import { type Message } from '@/types/message';
import { type AIConfig, type ChatContext } from '@/types/aiConfig';

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
export type AssistantMetadataEvent = {
  type: "assistant_metadata";
  sender: number;
  created_at: string;
};
export type UnknownEvent = { type: string } & JsonRecord;

export type StreamEvent = ChunkEvent | CompleteEvent | ErrorEvent | AssistantMetadataEvent | UnknownEvent;

interface UseChatStreamReturn {
  isLoading: boolean;
  streamingMessageId: string | null;
  sendMessage: (message: string, config: AIConfig, chatContext: ChatContext) => Promise<void>;
  sendAgentMessage: (message: string, config: AIConfig, chatContext: ChatContext, token: string) => Promise<void>;
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
    const result = isRecord(u["result"]) ? u["result"] as { idTipoMensaje: number; mensaje: string } : undefined;
    return { type: "error", message, result };
  }

  if (t === "assistant_metadata") {
    const sender = typeof u["sender"] === "number" ? u["sender"] : 1; // default to AI
    const created_at = isString(u["created_at"]) ? u["created_at"] : Date.now().toString();
    return { type: "assistant_metadata", sender, created_at };
  }

  // complete u otros: los aceptamos como JsonRecord
  return { ...(u as JsonRecord), type: t } as StreamEvent;
}

export const useChatStream = (): UseChatStreamReturn => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef<string>('');
  const animationFrameRef = useRef<number | null>(null);
  const activeChatIdRef = useRef<number | null>(null); // Track the active chat_id for cache operations
  const streamingMessageIdRef = useRef<string | null>(null); // Track the streaming message ID for cache operations

  // Helper to add messages to cache
  const addMessagesToCache = useCallback((chatId: number | null, messages: Message[]) => {
    queryClient.setQueryData<Message[]>(
      queryKeys.chat.messages(chatId),
      (old = []) => [...old, ...messages]
    );
  }, [queryClient]);

  // Helper to update a message in cache
  const updateMessageInCache = useCallback((chatId: number | null, messageId: string, updates: Partial<Message>) => {
    queryClient.setQueryData<Message[]>(
      queryKeys.chat.messages(chatId),
      (old = []) => old.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, [queryClient]);

  const cancelMessage = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Update streaming message content on animation frame
  const updateStreamingContent = useCallback((chatId: number | null, messageId: string, content: string) => {
    streamingContentRef.current = content;

    // Cancel previous animation frame if exists
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Schedule update on next animation frame for smooth rendering
    animationFrameRef.current = requestAnimationFrame(() => {
      updateMessageInCache(chatId, messageId, { message: streamingContentRef.current });
      animationFrameRef.current = null;
    });
  }, [updateMessageInCache]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const sendMessage = useCallback(async (messageContent: string, aiConfig: AIConfig, chatContext: ChatContext) => {
    if (!messageContent.trim()) return;

    setIsLoading(true);

    // Reset streaming content ref
    streamingContentRef.current = '';

    // Initialize active chat_id with the current chat_id from context
    activeChatIdRef.current = chatContext.chat_id;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 0, // 0 = user
      message: messageContent,
      created_at: Date.now().toString()
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
        ...aiConfig,
        ...chatContext
      };

      // Remove titulo if chat_id is not null (existing chat)
      if (chatContext.chat_id !== null && 'titulo' in requestPayload) {
        delete (requestPayload as any).titulo;
      }

      await chatApi.sendStreamingMessage(
        requestPayload as ChatMessageRequest,
        (data) => {
          // Handle incoming SSE message
          const evt = asStreamEvent(data);
          if (!evt) return;

          switch (evt.type) {
            case "metadata":
              // Extract chat_id from metadata if present
              if (isRecord(evt) && typeof evt.chat_id === 'number') {
                const newChatId = evt.chat_id as number;
                setCurrentChatId(newChatId);

                // If chat was just created (was null, now has ID), migrate messages
                if (activeChatIdRef.current === null && newChatId !== null) {
                  // Get messages from null cache
                  const messagesFromNull = queryClient.getQueryData<Message[]>(queryKeys.chat.messages(null)) || [];

                  // Copy to new chat_id cache
                  if (messagesFromNull.length > 0) {
                    queryClient.setQueryData<Message[]>(
                      queryKeys.chat.messages(newChatId),
                      messagesFromNull
                    );
                  }

                  // Update active chat_id for all subsequent operations
                  activeChatIdRef.current = newChatId;
                }
              }
              break;
            case "assistant_metadata":
              // Create AI/Agent message placeholder when backend sends metadata
              const assistantMetadataEvt = evt as AssistantMetadataEvent;
              const assistantMessage: Message = {
                id: assistantMetadataEvt.created_at, // Use backend timestamp as ID
                sender: assistantMetadataEvt.sender, // Use sender from backend (1=AI, 2=Agent)
                message: '',
                created_at: assistantMetadataEvt.created_at // Use backend timestamp
              };
              addMessagesToCache(activeChatIdRef.current, [assistantMessage]);
              setStreamingMessageId(assistantMessage.id);
              streamingMessageIdRef.current = assistantMessage.id; // Also update ref for callback access
              break;
            case "chunk":
              // Only update if we have a streaming message ID
              if (streamingMessageIdRef.current) {
                updateStreamingContent(activeChatIdRef.current, streamingMessageIdRef.current, (evt as ChunkEvent).content);
              } else {
                console.warn('[STREAM] Received chunk but no streaming message ID!');
              }
              break;
            case "complete":
              controller.abort();
              break;
            case "error":
              const errorEvt = evt as ErrorEvent;

              // Show centralized error toast
              showStreamingErrorToast(errorEvt);

              // Use the result message if available, otherwise use the message field
              const errorMessage = errorEvt.result?.mensaje || errorEvt.message || "Error en el streaming";

              // Update the AI message to show error (only if we have a streaming message ID)
              if (streamingMessageIdRef.current) {
                updateMessageInCache(activeChatIdRef.current, streamingMessageIdRef.current, { message: `Error: ${errorMessage}` });
              }

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
            updateMessageInCache(activeChatIdRef.current, streamingMessageIdRef.current, { message: `Error: ${errorMessage}` });
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
              updateMessageInCache(activeChatIdRef.current, streamingMessageIdRef.current, {
                message: currentContent || 'Petición detenida por el usuario'
              });
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
          const errorMsg = err instanceof Error ? 'Error al consultar la API' : 'Error inesperado';
          updateMessageInCache(activeChatIdRef.current, streamingMessageIdRef.current, { message: errorMsg });
        }
      }
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
      streamingMessageIdRef.current = null; // Reset ref
    }
  }, [updateStreamingContent, addMessagesToCache, updateMessageInCache, streamingMessageId]);

  const sendAgentMessage = useCallback(async (messageContent: string, aiConfig: AIConfig, chatContext: ChatContext, token: string) => {
    if (!messageContent.trim()) return;

    setIsLoading(true);

    // Reset streaming content ref
    streamingContentRef.current = '';

    // Initialize active chat_id with the current chat_id from context
    activeChatIdRef.current = chatContext.chat_id;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 0, // 0 = user
      message: messageContent,
      created_at: Date.now().toString()
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
        external_token: token,
        ...aiConfig,
        ...chatContext
      };

      // Remove titulo if chat_id is not null (existing chat)
      if (chatContext.chat_id !== null && 'titulo' in requestPayload) {
        delete (requestPayload as any).titulo;
      }

      await chatApi.sendStreamingMessageAgent(
        requestPayload as AgentMessageRequest,
        (data) => {
          // Handle incoming SSE message
          const evt = asStreamEvent(data);
          if (!evt) return;

          switch (evt.type) {
            case "metadata":
              // Extract chat_id from metadata if present
              if (isRecord(evt) && typeof evt.chat_id === 'number') {
                const newChatId = evt.chat_id as number;
                setCurrentChatId(newChatId);

                // If chat was just created (was null, now has ID), migrate messages
                if (activeChatIdRef.current === null && newChatId !== null) {
                  // Get messages from null cache
                  const messagesFromNull = queryClient.getQueryData<Message[]>(queryKeys.chat.messages(null)) || [];

                  // Copy to new chat_id cache
                  if (messagesFromNull.length > 0) {
                    queryClient.setQueryData<Message[]>(
                      queryKeys.chat.messages(newChatId),
                      messagesFromNull
                    );
                  }

                  // Update active chat_id for all subsequent operations
                  activeChatIdRef.current = newChatId;
                }
              }
              break;
            case "assistant_metadata":
              // Create AI/Agent message placeholder when backend sends metadata
              const assistantMetadataEvt = evt as AssistantMetadataEvent;
              const assistantMessage: Message = {
                id: assistantMetadataEvt.created_at, // Use backend timestamp as ID
                sender: assistantMetadataEvt.sender, // Use sender from backend (1=AI, 2=Agent)
                message: '',
                created_at: assistantMetadataEvt.created_at // Use backend timestamp
              };
              addMessagesToCache(activeChatIdRef.current, [assistantMessage]);
              setStreamingMessageId(assistantMessage.id);
              streamingMessageIdRef.current = assistantMessage.id; // Also update ref for callback access
              break;
            case "chunk":
              // Only update if we have a streaming message ID
              if (streamingMessageIdRef.current) {
                updateStreamingContent(activeChatIdRef.current, streamingMessageIdRef.current, (evt as ChunkEvent).content);
              } else {
                console.warn('[STREAM] Received chunk but no streaming message ID!');
              }
              break;
            case "complete":
              controller.abort();
              break;
            case "error":
              const errorEvt = evt as ErrorEvent;

              // Show centralized error toast
              showStreamingErrorToast(errorEvt);

              // Use the result message if available, otherwise use the message field
              const errorMessage = errorEvt.result?.mensaje || errorEvt.message || "Error en el streaming";

              // Update the AI message to show error (only if we have a streaming message ID)
              if (streamingMessageIdRef.current) {
                updateMessageInCache(activeChatIdRef.current, streamingMessageIdRef.current, { message: `Error: ${errorMessage}` });
              }

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
            updateMessageInCache(activeChatIdRef.current, streamingMessageIdRef.current, { message: `Error: ${errorMessage}` });
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
              updateMessageInCache(activeChatIdRef.current, streamingMessageIdRef.current, {
                message: currentContent || 'Petición detenida por el usuario'
              });
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
      if (error instanceof DOMException && error.name === 'AbortError') {
        // Handled in onClose callback
      } else {
        // Only update if we have a streaming message ID
        if (streamingMessageId) {
          const errorMsg = error instanceof Error ? 'Error al consultar la API' : 'Error inesperado';
          updateMessageInCache(chatContext.chat_id, streamingMessageId, { message: errorMsg });
        }
      }
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  }, [updateStreamingContent, addMessagesToCache, updateMessageInCache, streamingMessageId]);

  return {
    isLoading,
    streamingMessageId,
    sendMessage,
    sendAgentMessage,
    cancelMessage,
    currentChatId
  };
};