import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useChatStream } from "../../hooks/useChatStream";
import { useChatMessages } from "../../hooks/useChatMessages";
import { useExternalLogin } from "../../hooks/useExternalLogin";
import { useChatScroll } from "../../hooks/useChatScroll";
import { useContinuousTranscription } from "../../hooks/useContinuousTranscription";
import { MessageBubble } from "./MessageBubble";
import { QueryInputSection } from "./QueryInputSection";
import { ChatWelcome } from "./ChatWelcome";
import { StreamingProgress } from "./StreamingProgress";
import { CommandProvider } from "../../contexts/CommandContext";
import { TranscriptionProvider } from "../../contexts/TranscriptionContext";
import { type ChatContext } from "@/types/aiConfig";
import { Loader } from "@/components/loader/Loader";
import { useQueryAuthContext } from "../../contexts/QueryAuthContext";
import { Loader2 } from "lucide-react";

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
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const currentMainActionRef = useRef<() => void>(() => {});

  const { data: currentUser } = useQuery({
    queryKey: ["user", "current"],
    queryFn: async () => null,
    enabled: false,
  });

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
  const { user } = useQueryAuthContext();
  const actualCompanyArea = (user as any)?.actual_company_area;

  const logoUrl = useMemo(() => {
    if (!actualCompanyArea?.LOGO) return "/fractal-logo.svg";
    const baseUrl = import.meta.env.VITE_LOGO_URL_BASE;
    return `${baseUrl}${actualCompanyArea.LOGO}?v=${Date.now()}`;
  }, [actualCompanyArea?.LOGO]);

  const messages = useMemo(() => {
    if (!data?.pages) return [];
    return [...data.pages].reverse().flatMap((page) => page.messages);
  }, [data]);

  const { scrollContainerRef, handleScroll, signalUserSending } = useChatScroll({
    chatId: chatContext.chat_id,
    messagesLength: messages.length,
    isFetchingNextPage,
    streamingMessageId,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
  });

  const transcription = useContinuousTranscription({ onTranscript: setUserQuery });
  const { setSubmitCallback, prepareBeforeSubmit, buildOnComplete } = transcription;

  const isChatEmpty = messages.length === 0;
  const isProcessing = isLoading || !!streamingMessageId;
  const showWelcomeScreen = isChatEmpty && !isProcessing;

  useEffect(() => {
    if (currentChatId && onChatIdChange) onChatIdChange(currentChatId);
  }, [currentChatId, onChatIdChange]);

  useEffect(() => {
    if (onStreamingStateChange) onStreamingStateChange(isLoading);
  }, [isLoading, onStreamingStateChange]);

  const handleTtsToggle = (enabled: boolean) => {
    if (enabled) initializeAudio(); else resetAudio();
    setTtsEnabled(enabled);
  };

  const chatQuery = useCallback(async () => {
    if (!userQuery.trim()) return;
    const currentQuery = userQuery;
    setUserQuery("");
    signalUserSending();
    prepareBeforeSubmit();
    const onComplete = buildOnComplete();
    await searchVectorial(currentQuery, chatContext, ttsEnabled, onComplete);
  }, [userQuery, searchVectorial, chatContext, ttsEnabled, signalUserSending, prepareBeforeSubmit, buildOnComplete]);

  const agentQuery = useCallback(async () => {
    if (!userQuery.trim() || !token) return;
    const currentQuery = userQuery;
    setUserQuery("");
    signalUserSending();
    await searchVectorialSQL(currentQuery, chatContext, token);
  }, [userQuery, searchVectorialSQL, chatContext, token, signalUserSending]);

  // Keep submit callback updated for continuous mode auto-submit
  useEffect(() => {
    setSubmitCallback(chatQuery);
  }, [chatQuery, setSubmitCallback]);

  return (
    <CommandProvider
      userQuery={userQuery}
      onQueryChange={setUserQuery}
      isLoading={isLoading}
      onCancel={cancelMessage}
      isAuthenticated={isAuthenticated}
      token={token || undefined}
      onSearchVectorial={chatQuery}
      onSearchVectorialSQL={agentQuery}
      onMainActionChange={(action) => { currentMainActionRef.current = action; }}
      ttsEnabled={ttsEnabled}
      onTtsEnabledChange={handleTtsToggle}
    >
      <TranscriptionProvider
        transcribeProvider={transcription.transcribeProvider}
        selectedLanguage={transcription.selectedLanguage}
        setSelectedLanguage={transcription.setSelectedLanguage}
        isRecording={transcription.isRecording && !transcription.isContinuousMode}
        isConnecting={transcription.isConnecting && !transcription.isContinuousMode}
        onMicrophoneClick={transcription.onMicrophoneClick}
        isFileRecording={transcription.isFileRecording && !transcription.isContinuousFileMode}
        isFileSpeaking={transcription.isFileSpeaking && !transcription.isContinuousFileMode}
        isFileTranscribing={transcription.isFileTranscribing}
        fileMediaStream={
          transcription.transcribeProvider === "aws"
            ? transcription.awsMediaStream
            : transcription.fileMediaStream
        }
        onPrepareRecording={transcription.onPrepareRecording}
        onStartRecording={transcription.onStartRecording}
        onStopRecording={transcription.onStopRecording}
        isContinuousRecording={transcription.isRecording && transcription.isContinuousMode}
        isContinuousConnecting={transcription.isConnecting && transcription.isContinuousMode}
        isContinuousSpeaking={
          transcription.transcribeProvider === "aws"
            ? transcription.isAwsSpeaking
            : transcription.isFileSpeaking
        }
        onContinuousVoiceClick={transcription.onContinuousVoiceClick}
        isContinuousFileRecording={transcription.isFileRecording && transcription.isContinuousFileMode}
        isContinuousFileSpeaking={transcription.isFileSpeaking && transcription.isContinuousFileMode}
        isContinuousFileTranscribing={transcription.isFileTranscribing && transcription.isContinuousFileMode}
        onContinuousFileClick={transcription.onContinuousFileClick}
        isMuted={transcription.isMuted}
        onMuteToggle={transcription.onMuteToggle}
      >
        <div className="h-full flex flex-col">
          {isLoadingMessages ? (
            <Loader text="Cargando mensajes..." />
          ) : errorMessages ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">Error al cargar los mensajes.</p>
            </div>
          ) : showWelcomeScreen ? (
            <ChatWelcome
              logoUrl={logoUrl}
              userName={(currentUser as any)?.nombres || "Usuario"}
              company={chatContext.company}
              area={chatContext.area}
            />
          ) : (
            <>
              <div className="flex-1 min-h-0 overflow-hidden flex">
                <div
                  ref={scrollContainerRef}
                  className="w-full h-full overflow-y-auto chat-scroll"
                  onScroll={handleScroll}
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
                  {isLoading && progressMessage && !streamingMessageId && (
                    <StreamingProgress message={progressMessage} />
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
