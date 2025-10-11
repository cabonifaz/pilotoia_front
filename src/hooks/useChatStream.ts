import { useState, useRef, useCallback, useEffect } from 'react';
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
export type UnknownEvent = { type: string } & JsonRecord;

export type StreamEvent = ChunkEvent | CompleteEvent | ErrorEvent | UnknownEvent;

interface UseChatStreamReturn {
  messages: Message[];
  isLoading: boolean;
  streamingMessageId: string | null;
  sendMessage: (message: string, config: AIConfig, chatContext: ChatContext, idIaArea: number) => Promise<void>;
  sendAgentMessage: (message: string, config: AIConfig, chatContext: ChatContext, token: string, idIaArea: number) => Promise<void>;
  cancelMessage: () => void;
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

  // complete u otros: los aceptamos como JsonRecord
  return { ...(u as JsonRecord), type: t } as StreamEvent;
}

export const useChatStream = (): UseChatStreamReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef<string>('');
  const animationFrameRef = useRef<number | null>(null);

  const cancelMessage = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Update streaming message content on animation frame
  const updateStreamingContent = useCallback((messageId: string, content: string) => {
    streamingContentRef.current = content;

    // Cancel previous animation frame if exists
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Schedule update on next animation frame for smooth rendering
    animationFrameRef.current = requestAnimationFrame(() => {
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, content: streamingContentRef.current }
          : msg
      ));
      animationFrameRef.current = null;
    });
  }, []);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const sendMessage = useCallback(async (messageContent: string, aiConfig: AIConfig, chatContext: ChatContext, idIaArea: number) => {
    if (!messageContent.trim()) return;

    setIsLoading(true);

    // Reset streaming content ref
    streamingContentRef.current = '';

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    // Add AI message placeholder
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      type: 'ai',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setStreamingMessageId(aiMessageId);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await chatApi.sendStreamingMessage(
        {
          message: messageContent,
          ...aiConfig,
          ...chatContext,
          id_ia_area: idIaArea
        } as ChatMessageRequest,
        (data) => {
          // Handle incoming SSE message
          const evt = asStreamEvent(data);
          if (!evt) return;

          switch (evt.type) {
            case "chunk":
              updateStreamingContent(aiMessageId, (evt as ChunkEvent).content);
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

              // Update the AI message to show error
              setMessages(prev => prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, content: `Error: ${errorMessage}` }
                  : msg
              ));

              controller.abort();
              break;
            default:
              break;
          }
        },
        () => {
          // Handle connection errors
          const errorMessage = "Error de conexión con el servidor";

          setMessages(prev => prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: `Error: ${errorMessage}` }
              : msg
          ));

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
            setMessages(prev => prev.map(msg => {
              if (msg.id === aiMessageId) {
                return {
                  ...msg,
                  content: currentContent || 'Petición detenida por el usuario'
                };
              }
              return msg;
            }));
          }

          setStreamingMessageId(null);
        },
        () => {
          // Handle connection open
        },
        controller.signal
      );
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Handled in onClose callback
      } else if (err instanceof Error) {
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: 'Error al consultar la API' }
            : msg
        ));
      } else {
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: 'Error inesperado' }
            : msg
        ));
      }
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  }, [updateStreamingContent]);

  const sendAgentMessage = useCallback(async (messageContent: string, aiConfig: AIConfig, chatContext: ChatContext, token: string, idIaArea: number) => {
    if (!messageContent.trim()) return;

    setIsLoading(true);

    // Reset streaming content ref
    streamingContentRef.current = '';

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    // Add AI message placeholder
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: Message = {
      id: aiMessageId,
      type: 'ai',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setStreamingMessageId(aiMessageId);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await chatApi.sendStreamingMessageAgent(
        {
          message: messageContent,
          external_token: token,
          ...aiConfig,
          ...chatContext,
          id_ia_area: idIaArea
        } as AgentMessageRequest,
        (data) => {
          // Handle incoming SSE message
          const evt = asStreamEvent(data);
          if (!evt) return;

          switch (evt.type) {
            case "chunk":
              updateStreamingContent(aiMessageId, (evt as ChunkEvent).content);
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

              // Update the AI message to show error
              setMessages(prev => prev.map(msg =>
                msg.id === aiMessageId
                  ? { ...msg, content: `Error: ${errorMessage}` }
                  : msg
              ));

              controller.abort();
              break;
            default:
              break;
          }
        },
        () => {
          // Handle connection errors
          const errorMessage = "Error de conexión con el servidor";

          setMessages(prev => prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: `Error: ${errorMessage}` }
              : msg
          ));

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
            setMessages(prev => prev.map(msg => {
              if (msg.id === aiMessageId) {
                return {
                  ...msg,
                  content: currentContent || 'Petición detenida por el usuario'
                };
              }
              return msg;
            }));
          }

          setStreamingMessageId(null);
        },
        () => {
          // Handle connection open
        },
        controller.signal
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        // Handled in onClose callback
      } else if (error instanceof Error) {
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: 'Error al consultar la API' }
            : msg
        ));
      } else {
        setMessages(prev => prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: 'Error inesperado' }
            : msg
        ));
      }
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  }, [updateStreamingContent]);

  return {
    messages,
    isLoading,
    streamingMessageId,
    sendMessage,
    sendAgentMessage,
    cancelMessage
  };
};