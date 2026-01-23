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
import { getDefaultLanguage } from "../../constants/languages";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get transcription provider from environment
  const transcribeProvider = import.meta.env.VITE_TRANSCRIBE_PROVIDER;

  // Initialize with provider-aware default language
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    getDefaultLanguage(transcribeProvider === "aws" ? "aws" : "openai")
  );

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

  // Reference to detect scroll top (for pagination)
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

  // Ref to track if we should auto-submit on final transcript (continuous mode - AWS)
  const isContinuousModeRef = useRef(false);
  const submitActionRef = useRef<(() => void) | null>(null);
  // Refs for stop/start recording in continuous mode (AWS)
  const stopRecordingRef = useRef<(() => void) | null>(null);
  const startRecordingRef = useRef<((config?: any) => Promise<void>) | null>(null);
  const prepareRecordingRef = useRef<(() => void) | null>(null);
  // Track the language for restarting recording
  const selectedLanguageRef = useRef<string>('es-ES');
  // Guard to prevent double submit in continuous mode (for in-flight transcripts)
  const isProcessingContinuousRef = useRef(false);

  // Refs for continuous file mode (OpenAI)
  const isContinuousFileModeRef = useRef(false);
  const stopFileRecordingRef = useRef<(() => void) | null>(null);
  const startFileRecordingRef = useRef<((language: string) => Promise<void>) | null>(null);
  const prepareFileRecordingRef = useRef<(() => void) | null>(null);
  // Guard to prevent double submit in continuous file mode
  const isProcessingContinuousFileRef = useRef(false);

  // Get transcription functions (streaming - AWS)
  const {
    isRecording,
    isConnecting,
    transcript,
    partialTranscript,
    prepareRecording,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useTranscribe({
    onFinalTranscript: (finalTranscript) => {

      // Guard: Skip if we're already processing a request (prevents double messages from in-flight transcripts)
      if (isProcessingContinuousRef.current) return;

      if (isContinuousModeRef.current && finalTranscript.trim() && submitActionRef.current) {
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
    []
  );

  // Get file transcription functions (OpenAI)
  const {
    isRecording: isFileRecording,
    isTranscribing: isFileTranscribing,
    transcriptionResult: fileTranscriptionResult,
    prepareRecording: prepareFileRecording,
    startRecording: startFileRecording,
    stopRecording: stopFileRecording,
  } = useFileTranscribe({
    onTranscriptionComplete: (transcript) => {

      // Guard: Skip if we're already processing a request
      if (isProcessingContinuousFileRef.current) return;

      if (isContinuousFileModeRef.current && transcript.trim() && submitActionRef.current) {
        // Set guard immediately to prevent any subsequent transcripts
        isProcessingContinuousFileRef.current = true;

        // Recording already stopped (transcription happens after stop)
        setTimeout(() => {
          submitActionRef.current?.();
        }, 50);
      }
    },
  });

  // Track continuous mode state (reuses the same hooks)
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [isContinuousFileMode, setIsContinuousFileMode] = useState(false);

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
  }, [messages.length, isFetchingNextPage, streamingMessageId, scrollToBottom, shouldAutoScroll]);

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
      if (isUserSendingRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

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


  // Handle microphone click for AWS transcription
  const handleMicrophoneClick = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
      clearTranscript();
      await startRecording({ language_code: selectedLanguage as any });
    }
  }, [isRecording, stopRecording, clearTranscript, startRecording, selectedLanguage]);

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
      await startRecording({ language_code: selectedLanguage as any, continuous: true });
    }
  }, [isRecording, isContinuousMode, stopRecording, clearTranscript, startRecording, selectedLanguage]);

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
  }, [isFileRecording, isContinuousFileMode, stopFileRecording, startFileRecording, selectedLanguage]);

  // TTS toggle handler - initializes audio on enable, resets on disable
  const handleTtsToggle = (enabled: boolean) => {
    if (enabled) {
      initializeAudio();
    } else {
      resetAudio();
    }
    setTtsEnabled(enabled);
  };

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
    const shouldRestartOnComplete = isProcessingContinuousRef.current && isContinuousModeRef.current;
    // Determine if we need to restart file recording after completion (continuous file mode - OpenAI)
    const shouldRestartFileOnComplete = isProcessingContinuousFileRef.current && isContinuousFileModeRef.current;

    // Pre-request microphone permissions (runs in parallel with searchVectorial)
    if (shouldRestartOnComplete) {
      prepareRecordingRef.current?.();
    }
    if (shouldRestartFileOnComplete) {
      prepareFileRecordingRef.current?.();
    }

    // Determine which onComplete callback to use
    const onComplete = (shouldRestartOnComplete || shouldRestartFileOnComplete) ? () => {
      if (shouldRestartOnComplete) {
        // Restart AWS streaming recording after search completes
        setTimeout(async () => {
          // Clear the processing guard
          isProcessingContinuousRef.current = false;

          // Only restart if still in continuous mode
          if (isContinuousModeRef.current) {
            await startRecordingRef.current?.({
              language_code: selectedLanguageRef.current,
              continuous: true
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
            await startFileRecordingRef.current?.(selectedLanguageRef.current);
          }
        }, 100);
      }
    } : undefined;

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
        isFileTranscribing={isFileTranscribing}
        onStartRecording={handleStartFileRecording}
        onStopRecording={stopFileRecording}
        isContinuousRecording={isRecording && isContinuousMode}
        isContinuousConnecting={isConnecting && isContinuousMode}
        onContinuousVoiceClick={handleContinuousVoiceClick}
        isContinuousFileRecording={isFileRecording && isContinuousFileMode}
        isContinuousFileTranscribing={isFileTranscribing && isContinuousFileMode}
        onContinuousFileClick={handleContinuousFileClick}
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
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-hidden flex">
                <div
                  ref={scrollContainerRef}
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
