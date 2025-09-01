import { useState, useRef, useCallback } from 'react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIConfig {
  user_id: string;
  company_id: string;
  area: string;
  similarity_threshold: number;
  temperature: number;
  max_tokens: number;
}

interface UseChatStreamReturn {
  messages: Message[];
  isLoading: boolean;
  streamingMessageId: string | null;
  sendMessage: (message: string, config: AIConfig) => Promise<void>;
  cancelMessage: () => void;
}

export const useChatStream = (): UseChatStreamReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

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
      const res = await fetch('http://127.0.0.1:8000/api/v1/chat-streaming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' ,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        },
        body: JSON.stringify({
          message: messageContent,
          user_id: aiConfig.user_id,
          company_id: aiConfig.company_id,
          area: aiConfig.area,
          similarity_threshold: aiConfig.similarity_threshold,
          temperature: aiConfig.temperature,
          max_tokens: aiConfig.max_tokens,
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      const flushBlock = (block: string) => {
        const lines = block.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;

          try {
            const evt = JSON.parse(jsonStr);
            if (evt.type === 'chunk' && typeof evt.content === 'string') {
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: evt.content }
                  : msg
              ));
            } else if (evt.type === 'complete') {
              controller.abort();
            }
          } catch {
            // ignoramos frames inválidos
          }
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) flushBlock(part);
      }

      if (buffer.trim()) flushBlock(buffer);
    } catch (err) {
      if (err instanceof DOMException && err?.name !== 'AbortError') {
        console.error(err);
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: 'Error al consultar la API' }
            : msg
        ));
      }
    } finally {
      setIsLoading(false);
      setStreamingMessageId(null);
    }
  }, []);

  const cancelMessage = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    messages,
    isLoading,
    streamingMessageId,
    sendMessage,
    cancelMessage
  };
};