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
import { type AIConfig, type ChatContext } from '@/types/aiConfig';

interface ChatComponentProps {
  aiConfig: AIConfig;
  chatContext: ChatContext;
  onChatIdChange?: (chatId: number) => void;
  onStreamingStateChange?: (isStreaming: boolean) => void;
  onOpenConfigSidebar?: () => void;
}

const ChatComponent = ({ aiConfig, chatContext, onChatIdChange, onStreamingStateChange, onOpenConfigSidebar }: ChatComponentProps) => {
  const [userQuery, setUserQuery] = useState('');
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const currentMainActionRef = useRef<() => void>(() => {});
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Get current user data
  const { data: currentUser } = useQuery({
    queryKey: ['user', 'current']
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
  const { isLoading, streamingMessageId, searchVectorial, searchVectorialSQL, cancelMessage, currentChatId } = useChatStream();
  const { isAuthenticated, token } = useExternalLogin();

  // Get transcription functions (streaming - AWS)
  const {
    isRecording,
    isConnecting,
    transcript,
    partialTranscript,
    startRecording,
    stopRecording,
    clearTranscript
  } = useTranscribe();

  // Get file transcription functions (OpenAI)
  const {
    isRecording: isFileRecording,
    isTranscribing: isFileTranscribing,
    transcriptionResult: fileTranscriptionResult,
    prepareRecording: prepareFileRecording,
    cancelPrepareRecording: cancelPrepareFileRecording,
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

  const chatQuery = async () => {
    if (!userQuery.trim()) return;

    const currentQuery = userQuery;
    setUserQuery('');

    await searchVectorial(currentQuery, aiConfig, chatContext);
  };

  const cancelar = () => {
    cancelMessage();
  };

  const agentQuery = async () => {
    if (!userQuery.trim() || !token) return;

    const currentQuery = userQuery;
    setUserQuery('');

    await searchVectorialSQL(currentQuery, aiConfig, chatContext, token);
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
      isRecording={isRecording}
      isConnecting={isConnecting}
      onMicrophoneClick={handleMicrophoneClick}
      isFileRecording={isFileRecording}
      isFileTranscribing={isFileTranscribing}
      onPrepareRecording={prepareFileRecording}
      onCancelPrepareRecording={cancelPrepareFileRecording}
      onStartRecording={startFileRecording}
      onStopRecording={stopFileRecording}
    >
      <div className="h-full flex flex-col">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <p>Cargando mensajes...</p>
          </div>
        ) : errorMessages ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">Error al cargar los mensajes.</p>
          </div>
        ) : !messages || messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full flex flex-col gap-3">
              <div className="flex items-center justify-center mb-2">
                <img
                  src="/fractal-logo.svg"
                  className="h-6 w-auto"
                  alt="Logo Fractal"
                />
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
                    user={chatContext.user}
                  />
                ))}
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