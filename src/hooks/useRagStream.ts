// useRagStream.ts
import { useRef, useState, useCallback } from "react";

type JsonRecord = Record<string, unknown>;

export type ChatStreamingPayload = {
  user_id: string;
  message: string;
  company_id?: string;
  collection?: string | null;
  top_k?: number;
  similarity_threshold?: number;
  temperature?: number;
  max_tokens?: number;
};

export type MetadataEvent = { type: "metadata" } & JsonRecord;
export type ChunkEvent = { type: "chunk"; content: string };
export type CompleteEvent = { type: "complete" } & JsonRecord;
export type UnknownEvent = { type: string } & JsonRecord;

export type StreamEvent = MetadataEvent | ChunkEvent | CompleteEvent | UnknownEvent;

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

  // metadata / complete u otros: los aceptamos como JsonRecord
  return { ...(u as JsonRecord), type: t } as StreamEvent;
}

export function useRagStream(url: string) {
  const [answer, setAnswer] = useState<string>("");
  const [metadata, setMetadata] = useState<MetadataEvent | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const start = useCallback(
    async (payload: ChatStreamingPayload) => {
      setAnswer("");
      setMetadata(null);
      setIsStreaming(true);
      setError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status}: ${text}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let buffer = "";

        const flushChunk = (block: string) => {
          // Cada bloque puede tener varias líneas; nos quedamos con las que empiezan con "data:"
          for (const line of block.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const jsonStr = line.slice(5).trim(); // quita "data:"
            if (!jsonStr) continue;

            const parsed = safeJsonParse(jsonStr);
            const evt = asStreamEvent(parsed);
            if (!evt) continue;

            switch (evt.type) {
              case "metadata":
                setMetadata(evt as MetadataEvent);
                break;
              case "chunk":
                setAnswer((evt as ChunkEvent).content);
                break;
              case "complete":
                break;
              default:
                break;
            }
          }
        };

        // Lectura por streaming
         
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Los eventos SSE se separan por "\n\n"
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";
          for (const part of parts) flushChunk(part);
        }

        // Si quedó algo en buffer (sin \n\n final), intenta parsearlo
        if (buffer.trim()) flushChunk(buffer);
      } catch (err: unknown) {
        // AbortError: no lo tratamos como error de UI
        if (err instanceof DOMException && err.name === "AbortError") {
          // cancelado por el usuario
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Stream error");
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [url]
  );

  return { start, cancel, isStreaming, answer, metadata, error };
}
