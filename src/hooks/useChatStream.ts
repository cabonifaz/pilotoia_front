import { useState, useRef, useCallback } from 'react';
import { chatApi, type ChatMessageRequest } from '../api/chatApi';
import { showStreamingErrorToast } from '../utils/errorHandler';

type JsonRecord = Record<string, unknown>;

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export interface AIConfig {
  user_id: string;
  company_id: string;
  area: string;
  similarity_threshold: number;
  temperature: number;
  max_tokens: number;
  top_k: number;
}

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
  sendMessage: (message: string, config: AIConfig) => Promise<void>;
  cancelMessage: () => void;
}

function isRecord(v: unknown): v is JsonRecord {
  return typeof v === "object" && v !== null;
}

function isString(v: unknown): v is string {
  return typeof v === "string";
}

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return undefined;
  }
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

  const cancelMessage = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const sendMessage = useCallback(async (messageContent: string, aiConfig: AIConfig) => {
    if (!messageContent.trim()) return;

    setIsLoading(true);
    
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
      const streamingConfig = chatApi.getStreamingConfig();
      
      const res = await fetch(streamingConfig.url, {
        method: 'POST',
        headers: streamingConfig.headers,
        body: JSON.stringify({
          message: messageContent,
          ...aiConfig
        } as ChatMessageRequest),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      const flushChunk = (block: string) => {
        for (const line of block.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim(); // quita "data:"
          if (!jsonStr) continue;

          const parsed = safeJsonParse(jsonStr);
          const evt = asStreamEvent(parsed);
          if (!evt) continue;

          switch (evt.type) {
            case "chunk":
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: (evt as ChunkEvent).content }
                  : msg
              ));
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
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';
        for (const part of parts) flushChunk(part);
      }

      if (buffer.trim()) flushChunk(buffer);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
      } else if (err instanceof Error) {
        console.error(err);
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
  }, []);

  return {
    messages,
    isLoading,
    streamingMessageId,
    sendMessage,
    cancelMessage
  };
};