import { useState, useRef, useCallback, useEffect } from "react";
import {
  chatApi,
  type ChatMessageRequest,
  type AgentMessageRequest,
} from "../api/chatApi";
import { showStreamingErrorToast } from "../utils/errorHandler";
import { toast } from "./use-toast";
import { type Message } from "@/types/message";
import { type ChatContext } from "@/types/aiConfig";
import { useAudioPlayer } from "./useAudioPlayer";
import {
  asStreamEvent,
  isRecord,
  type TextChunkEvent,
  type AudioChunkEvent,
  type ErrorEvent,
  type ProgressEvent,
  type AssistantMetadataEvent,
  type ChatCreatedEvent,
} from "../utils/sseEventParser";
import { useChatCache } from "./useChatCache";

// Re-export stream event types for consumers
export type {
  TextChunkEvent,
  AudioChunkEvent,
  CompleteEvent,
  ErrorEvent,
  ProgressEvent,
  AssistantMetadataEvent,
  ChatCreatedEvent,
  UnknownEvent,
  StreamEvent,
} from "../utils/sseEventParser";

type StreamRunner = (
  onMessage: (data: unknown) => void,
  onError: () => void,
  onClose: () => void,
  onOpen: () => void,
  signal: AbortSignal
) => Promise<void>;

interface UseChatStreamReturn {
  isLoading: boolean;
  streamingMessageId: string | null;
  progressMessage: string | null;
  isPlayingAudio: boolean;
  isAudioInitialized: boolean;
  initializeAudio: () => void;
  searchVectorial: (
    message: string,
    chatContext: ChatContext,
    tts: boolean,
    onComplete?: () => void
  ) => Promise<void>;
  searchVectorialSQL: (
    message: string,
    chatContext: ChatContext,
    token: string
  ) => Promise<void>;
  analyzeImages: (
    message: string,
    images: File[],
    chatContext: ChatContext,
    tts: boolean,
    onComplete?: () => void
  ) => Promise<void>;
  cancelMessage: () => void;
  stopAudio: () => void;
  resetAudio: () => void;
  currentChatId: number | null;
}

export const useChatStream = (): UseChatStreamReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef<string>("");
  const animationFrameRef = useRef<number | null>(null);
  const activeChatIdRef = useRef<number | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  const {
    isPlaying: isPlayingAudio,
    isInitialized: isAudioInitialized,
    initialize: initializeAudio,
    addAudioChunk,
    stop: stopAudio,
    reset: resetAudio,
  } = useAudioPlayer();

  const { addMessagesToCache, updateMessageInCache, migrateTempCache, addNewChatToList } =
    useChatCache();

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const cancelMessage = useCallback(() => {
    abortRef.current?.abort();
    stopAudio();
  }, [stopAudio]);

  const updateStreamingContent = useCallback(
    (chatId: number | null, messageId: string, content: string) => {
      streamingContentRef.current = content;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        updateMessageInCache(chatId, messageId, { message: streamingContentRef.current });
        animationFrameRef.current = null;
      });
    },
    [updateMessageInCache]
  );

  // Shared SSE stream orchestrator. Both searchVectorial and searchVectorialSQL
  // delegate here; the only difference between them is the `runner` they pass in.
  const executeStream = useCallback(
    async (
      messageContent: string,
      chatContext: ChatContext,
      runner: StreamRunner,
      options?: { onComplete?: () => void; attachmentUrls?: string[] }
    ) => {
      if (!messageContent.trim() && !options?.attachmentUrls?.length) return;

      setIsLoading(true);
      setProgressMessage(null);
      streamingContentRef.current = "";
      activeChatIdRef.current = chatContext.chat_id ?? null;

      const userMessage: Message = {
        id: Date.now().toString(),
        sender: 0,
        message: messageContent,
        created_at: Date.now().toString(),
        ...(options?.attachmentUrls?.length ? { attachment_urls: options.attachmentUrls } : {}),
      };
      addMessagesToCache(activeChatIdRef.current, [userMessage]);

      const controller = new AbortController();
      abortRef.current = controller;

      const onMessage = (data: unknown) => {
        const evt = asStreamEvent(data);
        if (!evt) return;

        switch (evt.type) {
          case "progress":
            setProgressMessage((evt as ProgressEvent).message);
            break;

          case "metadata":
            if (isRecord(evt) && typeof evt.chat_id === "number") {
              const newChatId = evt.chat_id;
              setCurrentChatId(newChatId);
              if (activeChatIdRef.current === null) {
                migrateTempCache(newChatId);
                activeChatIdRef.current = newChatId;
              }
            }
            break;

          case "chat_created":
            addNewChatToList((evt as ChatCreatedEvent).chat);
            break;

          case "assistant_metadata": {
            const meta = evt as AssistantMetadataEvent;
            const assistantMessage: Message = {
              id: meta.created_at,
              sender: meta.sender,
              message: "",
              created_at: meta.created_at,
            };
            addMessagesToCache(activeChatIdRef.current, [assistantMessage]);
            setStreamingMessageId(assistantMessage.id);
            streamingMessageIdRef.current = assistantMessage.id;
            break;
          }

          case "text_chunk":
            if (streamingMessageIdRef.current) {
              updateStreamingContent(
                activeChatIdRef.current,
                streamingMessageIdRef.current,
                (evt as TextChunkEvent).content
              );
            } else {
              console.warn("[STREAM] Received text_chunk but no streaming message ID!");
            }
            break;

          case "audio_chunk":
            addAudioChunk((evt as AudioChunkEvent).content);
            break;

          case "complete":
            setProgressMessage(null);
            controller.abort();
            break;

          case "error": {
            const errorEvt = evt as ErrorEvent;
            showStreamingErrorToast(errorEvt);
            const errorMessage =
              errorEvt.result?.mensaje || errorEvt.message || "Error en el streaming";
            if (streamingMessageIdRef.current) {
              updateMessageInCache(activeChatIdRef.current, streamingMessageIdRef.current, {
                message: `Error: ${errorMessage}`,
              });
            }
            setProgressMessage(null);
            controller.abort();
            break;
          }
        }
      };

      const onError = () => {
        if (streamingMessageIdRef.current) {
          updateMessageInCache(activeChatIdRef.current, streamingMessageIdRef.current, {
            message: "Error de conexión con el servidor",
          });
        }
        controller.abort();
      };

      const onClose = () => {
        if (controller.signal.aborted) {
          if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          if (streamingMessageIdRef.current) {
            updateMessageInCache(activeChatIdRef.current, streamingMessageIdRef.current, {
              message: streamingContentRef.current || "Petición detenida por el usuario",
            });
          }
        }
        setStreamingMessageId(null);
        streamingMessageIdRef.current = null;
      };

      try {
        await runner(onMessage, onError, onClose, () => {}, controller.signal);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          if (streamingMessageIdRef.current) {
            updateMessageInCache(activeChatIdRef.current, streamingMessageIdRef.current, {
              message: err instanceof Error ? "Error al consultar la API" : "Error inesperado",
            });
          }
        }
      } finally {
        setIsLoading(false);
        setStreamingMessageId(null);
        streamingMessageIdRef.current = null;
        options?.onComplete?.();
      }
    },
    [
      addMessagesToCache,
      updateMessageInCache,
      updateStreamingContent,
      migrateTempCache,
      addNewChatToList,
      addAudioChunk,
    ]
  );

  const searchVectorial = useCallback(
    async (
      messageContent: string,
      chatContext: ChatContext,
      tts: boolean,
      onComplete?: () => void
    ) => {
      if (tts) resetAudio();

      const payload = {
        message: messageContent,
        created_at: Date.now().toString(),
        request_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        user_id: chatContext.user_id,
        user: chatContext.user,
        company_id: chatContext.company_id,
        area_id: chatContext.area_id,
        chat_id: chatContext.chat_id,
        tts,
      };

      await executeStream(
        messageContent,
        chatContext,
        (onMessage, onError, onClose, onOpen, signal) =>
          chatApi.sendStreamingMessage(payload as ChatMessageRequest, onMessage, onError, onClose, onOpen, signal),
        { onComplete }
      );
    },
    [executeStream, resetAudio]
  );

  const analyzeImages = useCallback(
    async (
      messageContent: string,
      images: File[],
      chatContext: ChatContext,
      tts: boolean,
      onComplete?: () => void
    ) => {
      if (!messageContent.trim() && images.length === 0) return;
      if (tts) resetAudio();

      const timestamp = Date.now().toString();
      const filenames = images.map((f) => f.name);

      // Steps 1 & 2: Get presigned URLs and upload images
      try {
        const { uploads } = await chatApi.getAttachmentUploadUrls({
          company_id: chatContext.company_id,
          area_id: chatContext.area_id,
          filenames,
          timestamp,
        });

        await Promise.all(
          images.map(async (file, index) => {
            const res = await fetch(uploads[index].presigned_url, {
              method: "PUT",
              body: file,
              // No Content-Type header — avoids CORS preflight on S3
            });
            if (!res.ok) {
              throw new Error(`"${file.name}": HTTP ${res.status}`);
            }
          })
        );
      } catch (err) {
        toast({
          title: "Error al subir imágenes",
          description: err instanceof Error ? err.message : "Error inesperado",
          variant: "destructive",
        });
        return;
      }

      // Step 3: Stream VLM response
      const payload = {
        message: messageContent,
        user_id: chatContext.user_id,
        company_id: chatContext.company_id,
        area_id: chatContext.area_id,
        created_at: timestamp,
        filenames,
        chat_id: chatContext.chat_id ?? null,
        request_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      const attachmentUrls = images.map((f) => URL.createObjectURL(f));

      await executeStream(
        messageContent,
        chatContext,
        (onMessage, onError, onClose, onOpen, signal) =>
          chatApi.sendVlmStreaming(payload, onMessage, onError, onClose, onOpen, signal),
        { onComplete, attachmentUrls }
      );
    },
    [executeStream, resetAudio]
  );

  // NOTE: This function is pending replacement. Keep it decoupled from the rest.
  const searchVectorialSQL = useCallback(
    async (messageContent: string, chatContext: ChatContext, token: string) => {
      const payload = {
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

      await executeStream(messageContent, chatContext, (onMessage, onError, onClose, onOpen, signal) =>
        chatApi.sendStreamingMessageAgent(payload as AgentMessageRequest, onMessage, onError, onClose, onOpen, signal)
      );
    },
    [executeStream]
  );

  return {
    isLoading,
    streamingMessageId,
    progressMessage,
    isPlayingAudio,
    isAudioInitialized,
    initializeAudio,
    searchVectorial,
    searchVectorialSQL,
    analyzeImages,
    cancelMessage,
    stopAudio,
    resetAudio,
    currentChatId,
  };
};
