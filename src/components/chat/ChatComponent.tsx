import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useChatStream } from '../../hooks/useChatStream';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useExternalLogin } from '../../hooks/useExternalLogin';
import { useTranscribe } from '../../hooks/useTranscribe';
import { useFileTranscribe } from '../../hooks/useFileTranscribe';
import { MessageBubble } from './MessageBubble';
import { QueryInputSection } from './QueryInputSection';
import { CommandProvider } from '../../contexts/CommandContext';
import { TranscriptionProvider } from '../../contexts/TranscriptionContext';
import { type ChatContext } from '@/types/aiConfig';
import { Loader } from '@/components/loader/Loader';
import { useQueryAuthContext } from '../../contexts/QueryAuthContext';
import { Card, CardHeaderCompact, CardContentCompact } from '@/components/shadcn/card';
import { Avatar, AvatarFallback } from '@/components/shadcn/avatar';
import { Bot, Loader2 } from 'lucide-react';
import { DEFAULT_LANGUAGE } from '../../constants/languages';

interface ChatComponentProps {
  chatContext: ChatContext;
  onChatIdChange?: (chatId: number) => void;
  onStreamingStateChange?: (isStreaming: boolean) => void;
  onOpenConfigSidebar?: () => void;
}

const ChatComponent = ({ chatContext, onChatIdChange, onStreamingStateChange, onOpenConfigSidebar }: ChatComponentProps) => {
  const [userQuery, setUserQuery] = useState('');
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(DEFAULT_LANGUAGE);
  const currentMainActionRef = useRef<() => void>(() => {});
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Get current user data
  const { data: currentUser } = useQuery({
    queryKey: ['user', 'current'],
    queryFn: async () => {
      return null;
    },
    enabled: false
  });

  // Get transcription provider from environment
  const transcribeProvider = import.meta.env.VITE_TRANSCRIBE_PROVIDER;

  // Get messages from TanStack Query cache
  const { data: messages, isLoading: isLoadingMessages, error: errorMessages } = useChatMessages(
    chatContext.chat_id,
    chatContext.company_id,
    chatContext.area_id
  );

  // Get streaming functions
  const { isLoading, streamingMessageId, progressMessage, searchVectorial, searchVectorialSQL, cancelMessage, currentChatId } = useChatStream();
  const { isAuthenticated, token } = useExternalLogin();

// Get logo URL from actual company area
  const { user } = useQueryAuthContext();
  const actualCompanyArea = (user as any)?.actual_company_area;
  const logoUrl = actualCompanyArea?.LOGO
    ? `${import.meta.env.VITE_LOGO_URL_BASE}${actualCompanyArea.LOGO}?v=${Date.now()}`
    : '/fractal-logo.svg';

  // Get transcription functions (streaming - AWS)
  const {
    isRecording,
    isConnecting,
    transcript,
    partialTranscript,
    startRecording, // This is the start for AWS streaming
    stopRecording,  // This is the stop for AWS streaming
    clearTranscript
  } = useTranscribe();

  // Get file transcription functions (OpenAI)
  const {
    isRecording: isFileRecording,
    isTranscribing: isFileTranscribing,
    transcriptionResult: fileTranscriptionResult,
    startRecording: startFileRecording,
    stopRecording: stopFileRecording
  } = useFileTranscribe();

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

  // Debounced scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Capture values immediately before setTimeout to avoid null currentTarget
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    scrollTimeoutRef.current = setTimeout(() => {
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100; // 100px threshold
      setShouldAutoScroll(isAtBottom);
    }, 150);
  }, []);

  // Auto-scroll to bottom when messages change (only if user is at bottom)
  useEffect(() => {
    if (shouldAutoScroll) {
      const scrollContainer = document.querySelector('.messages-container');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, streamingMessageId, shouldAutoScroll]);

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
      await startRecording({ language_code: 'es-ES' });
    }
  };

  // Wrapper for file transcription that uses selected language
  const handleStartFileRecording = useCallback(async () => {
    console.log('Starting file recording with language:', selectedLanguage);
    await startFileRecording(selectedLanguage);
  }, [startFileRecording, selectedLanguage]);

  const chatQuery = async () => {
    if (!userQuery.trim()) return;

    const currentQuery = userQuery;
    setUserQuery('');

    await searchVectorial(currentQuery, chatContext);
  };

  const cancelar = () => {
    cancelMessage();
  };

  const agentQuery = async () => {
    if (!userQuery.trim() || !token) return;

    const currentQuery = userQuery;
    setUserQuery('');

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
  >
    <TranscriptionProvider
      transcribeProvider={transcribeProvider}
      selectedLanguage={selectedLanguage}
      setSelectedLanguage={setSelectedLanguage}
      isRecording={isRecording}
      isConnecting={isConnecting}
      onMicrophoneClick={handleMicrophoneClick}
      isFileRecording={isFileRecording}
      isFileTranscribing={isFileTranscribing}
      onStartRecording={handleStartFileRecording}
      onStopRecording={stopFileRecording}
    >
      <div className="h-full flex flex-col">
        {isLoadingMessages ? (
          <Loader text="Cargando mensajes..." />
        ) : errorMessages ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">Error al cargar los mensajes.</p>
          </div>
        ) : !messages || messages.length === 0 ? (
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
                Bueno verte, {(currentUser as any)?.nombres || 'Usuario'}
              </h3>
              <QueryInputSection company={chatContext.company} area={chatContext.area} onOpenConfigSidebar={onOpenConfigSidebar} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-hidden flex">
              <div className="w-full h-full overflow-y-auto messages-container" onScroll={handleScroll}>
                {messages?.map(message => (
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
                <QueryInputSection company={chatContext.company} area={chatContext.area} onOpenConfigSidebar={onOpenConfigSidebar} />
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