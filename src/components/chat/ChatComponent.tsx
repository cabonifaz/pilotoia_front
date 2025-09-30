import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/shadcn/button';
import { Textarea } from '@/components/shadcn/textarea';
import { Card, CardContent } from '@/components/shadcn/card';
import { useChatStream } from '../../hooks/useChatStream';
import { useExternalLogin } from '../../hooks/useExternalLogin';
import { LoginModal } from '../external-api/LoginModal';
import { MessageBubble } from './MessageBubble';

interface AIConfig {
  user_id: string;
  company_id: string;
  area: string;
  similarity_threshold: number;
  temperature: number;
  max_tokens: number;
  top_k: number;
}

interface ChatComponentProps {
  aiConfig: AIConfig;
}

const ChatComponent = ({ aiConfig }: ChatComponentProps) => {
  const [consulta, setConsulta] = useState('');
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { messages, isLoading, streamingMessageId, sendMessage, sendAgentMessage, cancelMessage } = useChatStream();
  const { isAuthenticated, token } = useExternalLogin();

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

  const manejarConsulta = async () => {
    if (!consulta.trim()) return;
    
    const currentConsulta = consulta;
    setConsulta('');
    await sendMessage(currentConsulta, aiConfig);
  };

  const cancelar = () => {
    cancelMessage();
  };

  const testAnalyzer = async () => {
    if (!consulta.trim() || !token) return;

    const currentConsulta = consulta;
    setConsulta('');
    await sendAgentMessage(currentConsulta, aiConfig, token);
  };


  return (
    <div className="h-full flex flex-col">
      {/* Messages Container */}
      <Card className="flex-1 flex flex-col overflow-hidden border-2 shadow-lg bg-card/50">
        <CardContent className="flex-1 overflow-y-auto p-4 messages-container min-h-0" onScroll={handleScroll}>
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Card className="p-8 text-center bg-muted/30 border shadow-md">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-2">¡Bienvenido al Piloto IA!</h3>
                <p className="text-muted-foreground">
                  Haz tu primera consulta sobre {aiConfig.company_id}
                </p>
              </Card>
            </div>
          ) : (
            <div>
              {messages.map(message => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  streamingMessageId={streamingMessageId}
                  userId={aiConfig.user_id}
                />
              ))}
            </div>
          )}
        </CardContent>
        
        {/* Input Section */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder={`Escribe tu consulta sobre ${aiConfig.company_id}...`}
              disabled={isLoading}
              rows={2}
              className="resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  manejarConsulta();
                }
              }}
            />
            <div className="flex flex-col gap-2">
              {isLoading ? (
                <Button onClick={cancelar} variant="destructive" size="sm">
                  ⏹️ Detener
                </Button>
              ) : (
                <>
                  <Button
                    onClick={manejarConsulta}
                    disabled={!consulta.trim()}
                    size="sm"
                  >
                    ▶️ Enviar
                  </Button>
                  {isAuthenticated ? (
                    <Button
                      onClick={testAnalyzer}
                      disabled={!consulta.trim() || isLoading}
                      variant="outline"
                      size="sm"
                    >
                      {isLoading ? '🔄 Analizando...' : '🔍 Agente'}
                    </Button>
                  ) : (
                    <LoginModal />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatComponent;