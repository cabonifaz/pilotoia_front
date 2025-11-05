import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/shadcn/button';
import { Textarea } from '@/components/shadcn/textarea';
import { Card, CardContent } from '@/components/shadcn/card';
import { useChatStream } from '../../hooks/useChatStream';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useExternalLogin } from '../../hooks/useExternalLogin';
import { useTranscribe } from '../../hooks/useTranscribe';
import { useFileTranscribe } from '../../hooks/useFileTranscribe';
import { MessageBubble } from './MessageBubble';
import { SendButtonGroup } from './SendButtonGroup';
import { VoiceRecordButton } from './VoiceRecordButton';
import { FileTranscribeButton } from './FileTranscribeButton';
import { type AIConfig, type ChatContext } from '@/types/aiConfig';

interface ChatComponentProps {
  aiConfig: AIConfig;
  chatContext: ChatContext;
  onChatIdChange?: (chatId: number) => void;
  onStreamingStateChange?: (isStreaming: boolean) => void;
}

const ChatComponent = ({ aiConfig, chatContext, onChatIdChange, onStreamingStateChange }: ChatComponentProps) => {
  const [userQuery, setUserQuery] = useState('');
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [selectedAction, setSelectedAction] = useState<'enviar' | 'agente' | 'login'>('enviar');
  const currentMainActionRef = useRef<() => void>(() => {});
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Get transcription provider from environment
  const transcribeProvider = import.meta.env.VITE_TRANSCRIBE_PROVIDER;

  // Get messages from TanStack Query cache
  const { data: messages, isLoading: isLoadingMessages, error: errorMessages } = useChatMessages(chatContext.chat_id);

  // Get streaming functions
  const { isLoading, streamingMessageId, sendMessage, sendAgentMessage, cancelMessage, currentChatId } = useChatStream();
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

    await sendMessage(currentQuery, aiConfig, chatContext);
  };

  const cancelar = () => {
    cancelMessage();
  };

  const agentQuery = async () => {
    if (!userQuery.trim() || !token) return;

    const currentQuery = userQuery;
    setUserQuery('');

    await sendAgentMessage(currentQuery, aiConfig, chatContext, token);
  };


  return (
    <div className="h-full flex flex-col">
      {/* Messages Container */}
      <Card className="flex-1 flex flex-col overflow-hidden border-2 shadow-lg bg-card/50">
        <CardContent className="flex-1 overflow-y-auto p-4 messages-container min-h-0" onScroll={handleScroll}>
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <p>Cargando mensajes...</p>
            </div>
          ) : errorMessages ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-red-500">Error al cargar los mensajes.</p>
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Card className="p-8 text-center bg-muted/30 border shadow-md">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-2">¡Bienvenido al Piloto IA!</h3>
                <p className="text-muted-foreground">
                  Haz tu primera consulta sobre {chatContext.company}
                </p>
              </Card>
            </div>
          ) : (
            <div>
              {messages?.map(message => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  streamingMessageId={streamingMessageId}
                  user={chatContext.user}
                />
              ))}
            </div>
          )}
        </CardContent>
        
        {/* Input Section */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Textarea
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder={`Escribe tu consulta sobre ${chatContext.company}...`}
                disabled={isLoading}
                rows={2}
                className="resize-none pr-28"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    currentMainActionRef.current();
                  }
                }}
              />
              {transcribeProvider === 'aws' ? (
                <VoiceRecordButton
                  isRecording={isRecording}
                  isConnecting={isConnecting}
                  isDisabled={isLoading}
                  onClick={handleMicrophoneClick}
                />
              ) : (
                <FileTranscribeButton
                  isRecording={isFileRecording}
                  isTranscribing={isFileTranscribing}
                  isDisabled={isLoading}
                  onPrepareRecording={prepareFileRecording}
                  onCancelPrepareRecording={cancelPrepareFileRecording}
                  onStartRecording={startFileRecording}
                  onStopRecording={stopFileRecording}
                />
              )}
            </div>
            <div className="flex gap-2">
              {isLoading && (
                <Button onClick={cancelar} variant="destructive" size="sm">
                  ⏹️ Detener
                </Button>
              )}
              {!isLoading && (
                <SendButtonGroup
                  onSend={chatQuery}
                  onAgentSend={agentQuery}
                  disabled={!userQuery.trim()}
                  isAuthenticated={isAuthenticated}
                  selectedAction={selectedAction}
                  onSelectedActionChange={setSelectedAction}
                  onMainActionChange={(action) => {
                    currentMainActionRef.current = action;
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatComponent;