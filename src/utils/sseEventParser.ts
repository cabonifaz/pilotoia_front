export type JsonRecord = Record<string, unknown>;

export type TextChunkEvent = { type: "text_chunk"; content: string };
export type AudioChunkEvent = { type: "audio_chunk"; content: string };
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
  | TextChunkEvent
  | AudioChunkEvent
  | CompleteEvent
  | ErrorEvent
  | ProgressEvent
  | AssistantMetadataEvent
  | ChatCreatedEvent
  | UnknownEvent;

export function isRecord(v: unknown): v is JsonRecord {
  return typeof v === "object" && v !== null;
}

export function isString(v: unknown): v is string {
  return typeof v === "string";
}

export function asStreamEvent(u: unknown): StreamEvent | undefined {
  if (!isRecord(u)) return undefined;
  const t = u["type"];
  if (!isString(t)) return undefined;

  if (t === "text_chunk") {
    if (isString(u["content"])) {
      return { type: "text_chunk", content: u["content"] };
    }
    return undefined;
  }

  if (t === "audio_chunk") {
    if (isString(u["content"])) {
      return { type: "audio_chunk", content: u["content"] };
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
    const sender = typeof u["sender"] === "number" ? u["sender"] : 1;
    const created_at = isString(u["created_at"])
      ? u["created_at"]
      : Date.now().toString();
    return { type: "assistant_metadata", sender, created_at };
  }

  return { ...(u as JsonRecord), type: t } as StreamEvent;
}
