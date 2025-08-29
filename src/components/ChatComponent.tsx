import { useState, useEffect } from 'react';
import { Button } from '@/ui/button';
import { Textarea } from '@/ui/textarea';
import { Card, CardContent, CardHeader } from '@/ui/card';
import { Avatar, AvatarFallback } from '@/ui/avatar';
import { Badge } from '@/ui/badge';
import { useChatStream } from '../hooks/useChatStream';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface AIConfig {
  user_id: string;
  company_id: string;
  similarity_threshold: number;
  temperature: number;
  max_tokens: number;
}

interface ChatComponentProps {
  aiConfig: AIConfig;
}

const ChatComponent = ({ aiConfig }: ChatComponentProps) => {
  const [consulta, setConsulta] = useState('');
  const { messages, isLoading, streamingMessageId, sendMessage, cancelMessage } = useChatStream();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollContainer = document.querySelector('.messages-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages, streamingMessageId]);

  const manejarConsulta = async () => {
    if (!consulta.trim()) return;
    
    const currentConsulta = consulta;
    setConsulta('');
    await sendMessage(currentConsulta, aiConfig);
  };

  const cancelar = () => {
    cancelMessage();
  };

  const MessageBubble = ({ message }: { message: Message }) => (
    <div className={`mb-6 ${message.type === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
      <Card className={`max-w-[80%] ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-xs">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {message.type === 'user' ? '👤' : '🤖'}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">
              {message.type === 'user' ? aiConfig.user_id : 'Piloto IA'}
            </span>
            <Badge variant={message.type === 'user' ? 'default' : 'outline'} className="text-xs">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="whitespace-pre-wrap">
            {message.content || (message.type === 'ai' ? 'Pensando...' : '')}
            {streamingMessageId === message.id && (
              <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse">▊</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="mb-2 px-2">
        <h1 className="text-3xl font-bold text-foreground">Piloto IA</h1>
      </div>

      {/* Messages Container */}
      <Card className="flex-1 flex flex-col overflow-hidden border-2 shadow-lg bg-card/50">
        <CardContent className="flex-1 overflow-y-auto p-4 messages-container">
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
                <MessageBubble key={message.id} message={message} />
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
                <Button 
                  onClick={manejarConsulta} 
                  disabled={!consulta.trim()}
                  size="sm"
                >
                  ▶️ Enviar
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatComponent;