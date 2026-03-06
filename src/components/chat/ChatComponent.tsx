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
import { getDefaultLanguage } from "../../constants/languages";
import { Skeleton } from "../shadcn/skeleton";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/shadcn/scroll-area";

interface ChatComponentProps {
  chatContext: ChatContext;
  onChatIdChange?: (chatId: number) => void;
  onStreamingStateChange?: (isStreaming: boolean) => void;
}

const ChatComponent = ({
  chatContext,
  onChatIdChange,
  onStreamingStateChange,
}: ChatComponentProps) => {
  const [userQuery, setUserQuery] = useState("");
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [isLogoLoading, setIsLogoLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get transcription provider from environment
  const transcribeProvider = import.meta.env.VITE_TRANSCRIBE_PROVIDER;

  // Initialize with provider-aware default language
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    getDefaultLanguage(transcribeProvider === "aws" ? "aws" : "openai"),
  );

  const currentMainActionRef = useRef<() => void>(() => {});
  const isUserSendingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Get current user data
  const { data: currentUser } = useQuery({
    queryKey: ["user", "current"],
    queryFn: async () => {
      return null;
    },
    enabled: false,
  });

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
    chatContext.area_id,
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

  // Get logo URL from actual company area
  const { user } = useQueryAuthContext();
  const actualCompanyArea = (user as any)?.actual_company_area;

  // MEMORIZAR la URL para evitar recargas infinitas por el Date.now()
  const logoUrl = useMemo(() => {
    if (!actualCompanyArea?.LOGO) return "/fractal-logo.svg";

    const baseUrl = import.meta.env.VITE_LOGO_URL_BASE;
    // Solo se recalcula si el LOGO de la empresa cambia
    return `${baseUrl}${actualCompanyArea.LOGO}?v=${Date.now()}`;
  }, [actualCompanyArea?.LOGO]);

  // Reiniciar el skeleton si la URL cambia (cambio de empresa)
  useEffect(() => {
    setIsLogoLoading(true);
  }, [logoUrl]);
  const previousScrollHeightRef = useRef<number>(0);

  // Ref to track if we should auto-submit on final transcript (continuous mode - AWS)
  const isContinuousModeRef = useRef(false);
  const submitActionRef = useRef<(() => void) | null>(null);
  // Refs for stop/start recording in continuous mode (AWS)
  const stopRecordingRef = useRef<(() => void) | null>(null);
  const startRecordingRef = useRef<((config?: any) => Promise<void>) | null>(
    null,
  );
  const prepareRecordingRef = useRef<(() => void) | null>(null);
  // Track the language for restarting recording
  const selectedLanguageRef = useRef<string>("es-ES");
  // Guard to prevent double submit in continuous mode (for in-flight transcripts)
  const isProcessingContinuousRef = useRef(false);

  // Refs for continuous file mode (OpenAI)
  const isContinuousFileModeRef = useRef(false);
  const stopFileRecordingRef = useRef<(() => void) | null>(null);
  const startFileRecordingRef = useRef<
    ((language: string) => Promise<void>) | null
  >(null);
  const prepareFileRecordingRef = useRef<(() => void) | null>(null);
  // Guard to prevent double submit in continuous file mode
  const isProcessingContinuousFileRef = useRef(false);

  // Get transcription functions (streaming - AWS)
  const {
    isRecording,
    isConnecting,
    isPaused: isAwsPaused,
    isSpeaking: isAwsSpeaking,
    mediaStream: awsMediaStream,
    transcript,
    partialTranscript,
    prepareRecording,
    startRecording,
    stopRecording,
    pauseRecording: pauseAwsRecording,
    resumeRecording: resumeAwsRecording,
    clearTranscript,
  } = useTranscribe({
    onFinalTranscript: (finalTranscript) => {
      // Guard: Skip if we're already processing a request (prevents double messages from in-flight transcripts)
      if (isProcessingContinuousRef.current) return;

      if (
        isContinuousModeRef.current &&
        finalTranscript.trim() &&
        submitActionRef.current
      ) {
        // Set guard immediately to prevent any subsequent transcripts
        isProcessingContinuousRef.current = true;

        // Stop recording (close WebSocket) while processing
        stopRecordingRef.current?.();

        // Small delay to ensure textarea is updated, then submit
        setTimeout(() => {
          submitActionRef.current?.();
        }, 50);
      }
    },
  });

  // Flatten paginated messages
  const messages = useMemo(() => {
    if (!data?.pages) return [];
    return [...data.pages].reverse().flatMap((page) => page.messages);
  }, [data]);

  // Centralized scroll to bottom function
  const scrollToBottom = useCallback(
    (behavior: "smooth" | "auto" = "smooth") => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior,
        });
      }
    },
    [],
  );

  // Get file transcription functions (OpenAI)
  const {
    isRecording: isFileRecording,
    isSpeaking: isFileSpeaking,
    isTranscribing: isFileTranscribing,
    isPaused: isFilePaused,
    mediaStream: fileMediaStream,
    transcriptionResult: fileTranscriptionResult,
    prepareRecording: prepareFileRecording,
    startRecording: startFileRecording,
    stopRecording: stopFileRecording,
    pauseRecording: pauseFileRecording,
    resumeRecording: resumeFileRecording,
  } = useFileTranscribe({
    onTranscriptionComplete: (transcript) => {
      // Guard: Skip if we're already processing a request
      if (isProcessingContinuousFileRef.current) return;

      // Handle continuous file mode
      if (isContinuousFileModeRef.current) {
        // If no voice detected (empty transcript), just restart recording
        if (!transcript.trim()) {
          console.log(
            "[CONTINUOUS-FILE] No voice detected, restarting recording...",
          );
          // Restart recording immediately
          startFileRecordingRef.current?.(selectedLanguageRef.current);
          return;
        }

        // Voice detected - submit the transcript
        if (submitActionRef.current) {
          // Set guard immediately to prevent any subsequent transcripts
          isProcessingContinuousFileRef.current = true;

          // Recording already stopped (transcription happens after stop)
          setTimeout(() => {
            submitActionRef.current?.();
          }, 50);
        }
      }
    },
  });

  // Track continuous mode state (reuses the same hooks)
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [isContinuousFileMode, setIsContinuousFileMode] = useState(false);

  // Reset scroll state when switching chats
  useEffect(() => {
    setShouldAutoScroll(true);
    previousScrollHeightRef.current = 0;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [chatContext.chat_id]);

  // Scroll management effect
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || isFetchingNextPage) return;

    // Priority 1: User sending message
    if (isUserSendingRef.current) {
      container.scrollTop = container.scrollHeight;
      previousScrollHeightRef.current = 0;
      setShouldAutoScroll(true);

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isUserSendingRef.current = false;
      }, 500);

      return;
    }

    // Priority 2: Adjust for loading older messages
    if (previousScrollHeightRef.current > 0) {
      const delta = container.scrollHeight - previousScrollHeightRef.current;
      container.scrollTop = delta;
      previousScrollHeightRef.current = 0;
      return;
    }

    // Priority 3: Auto-scroll during streaming
    if (shouldAutoScroll || !!streamingMessageId) {
      scrollToBottom("smooth");
    }
  }, [
    messages.length,
    isFetchingNextPage,
    streamingMessageId,
    scrollToBottom,
    shouldAutoScroll,
  ]);

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
  const handleScroll = useCallback(() => {
      if (isUserSendingRef.current || !scrollContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
      setShouldAutoScroll(isAtBottom);

      if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
        previousScrollHeightRef.current = scrollHeight;
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
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

  // Handle microphone click for AWS transcription
  const handleMicrophoneClick = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
      clearTranscript();
      await startRecording({ language_code: selectedLanguage as any });
    }
  }, [
    isRecording,
    stopRecording,
    clearTranscript,
    startRecording,
    selectedLanguage,
  ]);

  // Wrapper for file transcription that uses selected language
  const handleStartFileRecording = useCallback(async () => {
    await startFileRecording(selectedLanguage);
  }, [startFileRecording, selectedLanguage]);

  // Handle continuous voice mode click (AWS) - reuses useTranscribe with continuous=true
  const handleContinuousVoiceClick = useCallback(async () => {
    if (isRecording && isContinuousMode) {
      stopRecording();
      setIsContinuousMode(false);
      isContinuousModeRef.current = false;
      // Clear processing flag
      isProcessingContinuousRef.current = false;
    } else {
      clearTranscript();
      setIsContinuousMode(true);
      isContinuousModeRef.current = true;
      // Reset flag when starting
      isProcessingContinuousRef.current = false;
      await startRecording({
        language_code: selectedLanguage as any,
        continuous: true,
      });
    }
  }, [
    isRecording,
    isContinuousMode,
    stopRecording,
    clearTranscript,
    startRecording,
    selectedLanguage,
  ]);

  // Handle continuous file mode click (OpenAI) - reuses useFileTranscribe with continuous behavior
  const handleContinuousFileClick = useCallback(async () => {
    if (isFileRecording && isContinuousFileMode) {
      stopFileRecording();
      setIsContinuousFileMode(false);
      isContinuousFileModeRef.current = false;
      // Clear processing flag
      isProcessingContinuousFileRef.current = false;
    } else {
      setIsContinuousFileMode(true);
      isContinuousFileModeRef.current = true;
      // Reset flag when starting
      isProcessingContinuousFileRef.current = false;
      await startFileRecording(selectedLanguage);
    }
  }, [
    isFileRecording,
    isContinuousFileMode,
    stopFileRecording,
    startFileRecording,
    selectedLanguage,
  ]);

  // TTS toggle handler - initializes audio on enable, resets on disable
  const handleTtsToggle = (enabled: boolean) => {
    if (enabled) {
      initializeAudio();
    } else {
      resetAudio();
    }
    setTtsEnabled(enabled);
  };

  // Mute toggle handler - pauses/resumes VAD detection
  const handleMuteToggle = useCallback(() => {
    // Handle OpenAI continuous mode
    if (isContinuousFileMode) {
      if (isFilePaused) {
        resumeFileRecording();
      } else {
        pauseFileRecording();
      }
    }
    // Handle AWS continuous mode
    if (isContinuousMode) {
      if (isAwsPaused) {
        resumeAwsRecording();
      } else {
        pauseAwsRecording();
      }
    }
  }, [
    isContinuousFileMode,
    isFilePaused,
    pauseFileRecording,
    resumeFileRecording,
    isContinuousMode,
    isAwsPaused,
    pauseAwsRecording,
    resumeAwsRecording,
  ]);

  const chatQuery = useCallback(async () => {
    if (!userQuery.trim()) return;

    const currentQuery = userQuery;
    setUserQuery("");

    // Reset scroll state before sending
    previousScrollHeightRef.current = 0;
    isUserSendingRef.current = true;
    setShouldAutoScroll(true);

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }

    // Determine if we need to restart recording after completion (continuous mode - AWS)
    const shouldRestartOnComplete =
      isProcessingContinuousRef.current && isContinuousModeRef.current;
    // Determine if we need to restart file recording after completion (continuous file mode - OpenAI)
    const shouldRestartFileOnComplete =
      isProcessingContinuousFileRef.current && isContinuousFileModeRef.current;

    // Pre-request microphone permissions (runs in parallel with searchVectorial)
    if (shouldRestartOnComplete) {
      prepareRecordingRef.current?.();
    }
    if (shouldRestartFileOnComplete) {
      prepareFileRecordingRef.current?.();
    }

    // Determine which onComplete callback to use
    const onComplete =
      shouldRestartOnComplete || shouldRestartFileOnComplete
        ? () => {
            if (shouldRestartOnComplete) {
              // Restart AWS streaming recording after search completes
              setTimeout(async () => {
                // Clear the processing guard
                isProcessingContinuousRef.current = false;

                // Only restart if still in continuous mode
                if (isContinuousModeRef.current) {
                  await startRecordingRef.current?.({
                    language_code: selectedLanguageRef.current,
                    continuous: true,
                  });
                }
              }, 100);
            }

            if (shouldRestartFileOnComplete) {
              // Restart OpenAI file recording after search completes
              setTimeout(async () => {
                // Clear the processing guard
                isProcessingContinuousFileRef.current = false;

                // Only restart if still in continuous file mode
                if (isContinuousFileModeRef.current) {
                  await startFileRecordingRef.current?.(
                    selectedLanguageRef.current,
                  );
                }
              }, 100);
            }
          }
        : undefined;

    await searchVectorial(currentQuery, chatContext, ttsEnabled, onComplete);
  }, [userQuery, searchVectorial, chatContext, ttsEnabled]);

  // Keep submitActionRef updated for continuous mode auto-submit
  useEffect(() => {
    submitActionRef.current = chatQuery;
  }, [chatQuery]);

  // Keep stopRecordingRef updated for continuous mode
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  // Keep startRecordingRef updated for continuous mode
  useEffect(() => {
    startRecordingRef.current = startRecording;
  }, [startRecording]);

  // Keep prepareRecordingRef updated for continuous mode
  useEffect(() => {
    prepareRecordingRef.current = prepareRecording;
  }, [prepareRecording]);

  // Keep selectedLanguageRef updated
  useEffect(() => {
    selectedLanguageRef.current = selectedLanguage;
  }, [selectedLanguage]);

  // Keep stopFileRecordingRef updated for continuous file mode
  useEffect(() => {
    stopFileRecordingRef.current = stopFileRecording;
  }, [stopFileRecording]);

  // Keep startFileRecordingRef updated for continuous file mode
  useEffect(() => {
    startFileRecordingRef.current = startFileRecording;
  }, [startFileRecording]);

  // Keep prepareFileRecordingRef updated for continuous file mode
  useEffect(() => {
    prepareFileRecordingRef.current = prepareFileRecording;
  }, [prepareFileRecording]);

  const cancelar = () => {
    cancelMessage();
  };

  const agentQuery = async () => {
    if (!userQuery.trim() || !token) return;

    const currentQuery = userQuery;
    setUserQuery("");

    // Reset scroll state before sending
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
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        isRecording={isRecording && !isContinuousMode}
        isConnecting={isConnecting && !isContinuousMode}
        onMicrophoneClick={handleMicrophoneClick}
        isFileRecording={isFileRecording && !isContinuousFileMode}
        isFileSpeaking={isFileSpeaking && !isContinuousFileMode}
        isFileTranscribing={isFileTranscribing}
        fileMediaStream={
          transcribeProvider === "aws" ? awsMediaStream : fileMediaStream
        }
        onPrepareRecording={prepareFileRecording}
        onStartRecording={handleStartFileRecording}
        onStopRecording={stopFileRecording}
        isContinuousRecording={isRecording && isContinuousMode}
        isContinuousConnecting={isConnecting && isContinuousMode}
        isContinuousSpeaking={
          transcribeProvider === "aws" ? isAwsSpeaking : isFileSpeaking
        }
        onContinuousVoiceClick={handleContinuousVoiceClick}
        isContinuousFileRecording={isFileRecording && isContinuousFileMode}
        isContinuousFileSpeaking={isFileSpeaking && isContinuousFileMode}
        isContinuousFileTranscribing={
          isFileTranscribing && isContinuousFileMode
        }
        onContinuousFileClick={handleContinuousFileClick}
        isMuted={transcribeProvider === "aws" ? isAwsPaused : isFilePaused}
        onMuteToggle={handleMuteToggle}
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
                  {/* Contenedor relativo con altura mínima para evitar saltos */}
                  <div className="w-[148px] min-h-[48px] relative flex items-center justify-center">
                    {/* Skeleton: Se muestra mientras isLogoLoading sea true */}
                    {isLogoLoading && (
                      <Skeleton className="w-full h-12 rounded-md" />
                    )}

                    <img
                      key={logoUrl} // Forzar re-montado si cambia la empresa
                      src={logoUrl}
                      alt={actualCompanyArea?.RAZON_SOCIAL || "Logo Fractal"}
                      className={cn(
                        "w-auto h-auto max-h-12 max-w-full object-contain transition-opacity duration-300",
                        isLogoLoading ? "opacity-0 absolute" : "opacity-100",
                      )}
                      onLoad={() => setIsLogoLoading(false)}
                      onError={() => setIsLogoLoading(false)} // Evitar skeleton infinito en error
                    />
                  </div>
                </div>
                <h3 className="text-3xl font-semibold text-center">
                  Bueno verte, {(currentUser as any)?.nombres || "Usuario"}
                </h3>
                <QueryInputSection
                  company={chatContext.company}
                  area={chatContext.area}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-hidden flex">
                <ScrollArea
                  className="w-full h-full min-w-0"
                  viewportRef={scrollContainerRef}
                  onScrollCapture={handleScroll}
                >
                  {isFetchingNextPage && (
                    <div className="h-4 w-full flex justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
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
                </ScrollArea>
              </div>
              <div className="flex-shrink-0 flex">
                <div className="w-full">
                  <QueryInputSection
                    company={chatContext.company}
                    area={chatContext.area}
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
