import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useChatStream } from "../../hooks/useChatStream";
import { useChatMessages } from "../../hooks/useChatMessages";
import { useExternalLogin } from "../../hooks/useExternalLogin";
import { useTranscribe } from "../../hooks/useTranscribe";
import { useFileTranscribe } from "../../hooks/useFileTranscribe";
import { MessageBubble } from "./MessageBubble";
import { QueryInputSection } from "./QueryInputSection";
import { CommandProvider } from "../../contexts/CommandContext";
import { TranscriptionProvider } from "../../contexts/TranscriptionContext";
import { type ChatContext } from "@/types/aiConfig";
import { Loader } from "@/components/loader/Loader";
import { useQueryAuthContext } from "../../contexts/QueryAuthContext";
import {
  Card,
  CardHeaderCompact,
  CardContentCompact,
} from "@/components/shadcn/card";
import { Avatar, AvatarFallback } from "@/components/shadcn/avatar";
import { Bot, Loader2 } from "lucide-react";
import { useInView } from "react-intersection-observer";
interface ChatComponentProps {
  chatContext: ChatContext;
  onChatIdChange?: (chatId: number) => void;
  onStreamingStateChange?: (isStreaming: boolean) => void;
  onOpenConfigSidebar?: () => void;
}

const ChatComponent = ({
  chatContext,
  onChatIdChange,
  onStreamingStateChange,
  onOpenConfigSidebar,
}: ChatComponentProps) => {
  const [userQuery, setUserQuery] = useState("");
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentMainActionRef = useRef<() => void>(() => {});
  const isUserSendingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  // Get current user data
  const { data: currentUser } = useQuery({
    queryKey: ["user", "current"],
    queryFn: async () => {
      return null;
    },
    enabled: false,
  });

  // Get transcription provider from environment
  const transcribeProvider = import.meta.env.VITE_TRANSCRIBE_PROVIDER;

  // Get messages from TanStack Query cache
  const {
    data,
    isLoading: isLoadingMessages,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: errorMessages,
  } = useChatMessages(
    chatContext.chat_id,
    chatContext.company_id,
    chatContext.area_id
  );

  // Get streaming functions
  const {
    isLoading,
    streamingMessageId,
    progressMessage,
    searchVectorial,
    searchVectorialSQL,
    cancelMessage,
    currentChatId,
    initializeAudio,
    resetAudio,
  } = useChatStream();
  const { isAuthenticated, token } = useExternalLogin();
  // 2. Referencia para detectar el tope del scroll (hacia arriba) 🕵️
  const { ref: topSentinelRef } = useInView({ threshold: 0 });
  // Get logo URL from actual company area
  const { user } = useQueryAuthContext();
  const actualCompanyArea = (user as any)?.actual_company_area;
  const logoUrl = actualCompanyArea?.LOGO
    ? `${import.meta.env.VITE_LOGO_URL_BASE}${
        actualCompanyArea.LOGO
      }?v=${Date.now()}`
    : "/fractal-logo.svg";
  const previousScrollHeightRef = useRef<number>(0);
  // Get transcription functions (streaming - AWS)

  const {
    isRecording,
    isConnecting,
    transcript,
    partialTranscript,
    startRecording, // This is the start for AWS streaming
    stopRecording, // This is the stop for AWS streaming
    clearTranscript,
  } = useTranscribe();
  // 1. Aseguramos que 'messages' reaccione a CUALQUIER cambio en 'data'
  const messages = useMemo(() => {
    if (!data?.pages) return [];
    // Invertimos las páginas (lo viejo primero), pero NO ordenamos manualmente
    // para no romper el orden que ya trae la API dentro de cada bloque.
    return [...data.pages].reverse().flatMap((page) => page.messages);
  }, [data]);
  // 2. Función única y centralizada para bajar el scroll
  const scrollToBottom = useCallback(
    (behavior: "smooth" | "auto" = "smooth") => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior,
        });
      }
    },
    []
  );

  // Get file transcription functions (OpenAI)
  const {
    isRecording: isFileRecording,
    isTranscribing: isFileTranscribing,
    transcriptionResult: fileTranscriptionResult,
    prepareRecording: prepareFileRecording,
    cancelPrepareRecording: cancelPrepareFileRecording,
    startRecording: startFileRecording,
    stopRecording: stopFileRecording,
  } = useFileTranscribe();

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || isFetchingNextPage) return;

    // 1. PRIORIDAD MÁXIMA: Envío del usuario
    if (isUserSendingRef.current) {
      container.scrollTop = container.scrollHeight;
      previousScrollHeightRef.current = 0;
      setShouldAutoScroll(true);

      // ⏱️ TIMEOUT CRÍTICO: Mantenemos la bandera 'true' un momento más
      // para evitar que el handleScroll capture este movimiento automático.
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isUserSendingRef.current = false;
      }, 500); // 500ms es suficiente seguridad

      return;
    }

    // 2. PRIORIDAD MEDIA: Ajuste por carga de mensajes antiguos
    if (previousScrollHeightRef.current > 0) {
      // ... (Tu lógica existente) ...
      const delta = container.scrollHeight - previousScrollHeightRef.current;
      container.scrollTop = delta;
      previousScrollHeightRef.current = 0;
      return;
    }

    // 3. PRIORIDAD NORMAL
    if (shouldAutoScroll || !!streamingMessageId) {
      scrollToBottom("smooth");
    }
  }, [messages.length, isFetchingNextPage, streamingMessageId]);

  // Update parent when chat_id is received from backend
  useEffect(() => {
    if (currentChatId && onChatIdChange) {
      onChatIdChange(currentChatId);
    }
  }, [currentChatId, onChatIdChange]);

  // Notify parent about streaming state changes
  useEffect(() => {
    if (onStreamingStateChange) {
      onStreamingStateChange(isLoading);
    }
  }, [isLoading, onStreamingStateChange]);
  const isChatEmpty = messages.length === 0;
  const isProcessing = isLoading || !!streamingMessageId;
  const showWelcomeScreen = isChatEmpty && !isProcessing;
  // Debounced scroll handler
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      // 🛡️ GUARDIA: Si el usuario está enviando, ignoramos cualquier evento de scroll
      if (isUserSendingRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      // ... resto de tu lógica ...
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
      setShouldAutoScroll(isAtBottom);

      if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
        previousScrollHeightRef.current = scrollHeight;
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Update textarea with transcript (final or partial) - AWS streaming
  useEffect(() => {
    const currentTranscript = transcript || partialTranscript;
    if (currentTranscript) {
      setUserQuery(currentTranscript);
    }
  }, [transcript, partialTranscript]);

  // Update textarea with file transcription result - OpenAI
  useEffect(() => {
    if (fileTranscriptionResult?.transcript) {
      setUserQuery(fileTranscriptionResult.transcript);
    }
  }, [fileTranscriptionResult]);

  const handleMicrophoneClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      clearTranscript();
      await startRecording({ language_code: "es-ES" });
    }
  };

  // TTS toggle handler - initializes audio on enable, resets on disable
  const handleTtsToggle = (enabled: boolean) => {
    if (enabled) {
      initializeAudio();
    } else {
      resetAudio();
    }
    setTtsEnabled(enabled);
  };

  const chatQuery = async () => {
    if (!userQuery.trim()) return;

    const currentQuery = userQuery;
    setUserQuery("");

    // 1. LIMPIEZA CRÍTICA: Reseteamos cualquier rastro de scroll histórico
    previousScrollHeightRef.current = 0;
    isUserSendingRef.current = true;
    setShouldAutoScroll(true);

    // 2. Forzado inmediato al fondo
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }

    await searchVectorial(currentQuery, chatContext, ttsEnabled);
  };

  const cancelar = () => {
    cancelMessage();
  };
  const agentQuery = async () => {
    if (!userQuery.trim() || !token) return;

    const currentQuery = userQuery;
    setUserQuery("");

    // Bloqueo de scroll histórico antes de la petición
    previousScrollHeightRef.current = 0;
    isUserSendingRef.current = true;
    setShouldAutoScroll(true);

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }

    await searchVectorialSQL(currentQuery, chatContext, token);
  };
  return (
    <CommandProvider
      userQuery={userQuery}
      onQueryChange={setUserQuery}
      isLoading={isLoading}
      onCancel={cancelar}
      isAuthenticated={isAuthenticated}
      token={token || undefined}
      onSearchVectorial={chatQuery}
      onSearchVectorialSQL={agentQuery}
      onMainActionChange={(action) => {
        currentMainActionRef.current = action;
      }}
      ttsEnabled={ttsEnabled}
      onTtsEnabledChange={handleTtsToggle}
    >
      <TranscriptionProvider
        transcribeProvider={transcribeProvider}
        isRecording={isRecording}
        isConnecting={isConnecting}
        onMicrophoneClick={handleMicrophoneClick}
        startMicrophoneRecording={async () => {
          clearTranscript();
          await startRecording({ language_code: "es-ES" });
        }}
        stopMicrophoneRecording={stopRecording}
        isFileRecording={isFileRecording}
        isFileTranscribing={isFileTranscribing}
        onPrepareRecording={prepareFileRecording}
        onCancelPrepareRecording={cancelPrepareFileRecording}
        onStartRecording={startFileRecording}
        onStopRecording={stopFileRecording}
      >
        <div className="h-full flex flex-col">
          {isLoadingMessages ? (
            <Loader text="Cargando mensajes..." />
          ) : errorMessages ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">Error al cargar los mensajes.</p>
            </div>
          ) : showWelcomeScreen ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-[148px] flex items-center justify-center">
                    <img
                      src={logoUrl}
                      alt={actualCompanyArea?.RAZON_SOCIAL || "Logo Fractal"}
                      className="w-auto h-auto min-h-6 max-h-12 max-w-full object-contain"
                    />
                  </div>
                </div>
                <h3 className="text-3xl font-semibold text-center">
                  Bueno verte, {(currentUser as any)?.nombres || "Usuario"}
                </h3>
                <QueryInputSection
                  company={chatContext.company}
                  area={chatContext.area}
                  onOpenConfigSidebar={onOpenConfigSidebar}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-hidden flex">
                <div
                  ref={scrollContainerRef} // Asegúrate de que la ref esté aquí
                  className="w-full h-full overflow-y-auto messages-container"
                  onScroll={handleScroll}
                >
                  <div
                    ref={topSentinelRef}
                    className="h-4 w-full flex justify-center py-2"
                  >
                    {isFetchingNextPage && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {messages?.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      streamingMessageId={streamingMessageId}
                      progressMessage={progressMessage}
                      user={chatContext.user}
                    />
                  ))}
                  {/* Show progress indicator before message bubble is created */}
                  {isLoading && progressMessage && !streamingMessageId && (
                    <div className="mb-6 flex justify-start">
                      <Card className="max-w-[80%] border-0 shadow-none bg-background">
                        <CardHeaderCompact className="pb-2">
                          <div className="flex items-center gap-2 text-xs">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                <Bot className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">AI</span>
                          </div>
                        </CardHeaderCompact>
                        <CardContentCompact>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{progressMessage}</span>
                            <Loader2 className="h-3 w-3 animate-spin" />
                          </div>
                        </CardContentCompact>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 flex">
                <div className="w-full">
                  <QueryInputSection
                    company={chatContext.company}
                    area={chatContext.area}
                    onOpenConfigSidebar={onOpenConfigSidebar}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </TranscriptionProvider>
    </CommandProvider>
  );
};

export default ChatComponent;
