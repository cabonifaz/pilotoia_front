import { memo, useState, useEffect } from 'react';
import 'katex/dist/katex.min.css';
import { User, Bot } from 'lucide-react';
import { Card, CardHeaderCompact, CardContentCompact } from '@/components/shadcn/card';
import { Avatar, AvatarFallback } from '@/components/shadcn/avatar';
import { Badge } from '@/components/shadcn/badge';
import { type Message, parseMessageTimestamp, getMessageType } from '@/types/message';
import { MessageContent, fixTableMarkdown } from './MessageContent';

interface MessageBubbleProps {
  message: Message;
  streamingMessageId?: string | null;
  user: string;
}

// Simplified detection for tables and lists
const hasTableOrList = (text: string): boolean => {
  const patterns = [
    /\|.*?\|/,              // Tables with pipes (at least one column)
    /^\s*[-*+]\s/m,         // Unordered lists (-, *, +)
    /^\s*\d+\.\s/m,         // Ordered lists (1. 2. 3.)
  ];

  return patterns.some(pattern => pattern.test(text));
};

// Animated spinner component for streaming indicator
const SpinnerCursor = () => {
  const frames = ['◐', '◓', '◑', '◒'];
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(prev => (prev + 1) % frames.length);
    }, 150); // Change frame every 150ms

    return () => clearInterval(interval);
  }, []);

  return <span className="inline-block ml-0.5">{frames[frame]}</span>;
};


export const MessageBubble = memo(({ message, streamingMessageId, user }: MessageBubbleProps) => {
  console.log('Raw message:', message.message);

  const messageType = getMessageType(message.sender);
  const timestamp = parseMessageTimestamp(message.created_at);
  const isTableOrList = hasTableOrList(message.message);

  // Remove <br> tags
  const cleanContent = message.message.replace(/<br\s*\/?>/gi, '');
  const processedContent = isTableOrList ? fixTableMarkdown(cleanContent) : cleanContent;

  // Get display name based on sender
  const getDisplayName = () => {
    if (message.sender === 0) return user; // Show actual user value from context
    if (message.sender === 1) return 'AI';
    if (message.sender === 2) return 'Agent';
    // Default for any other sender types (3, 4, etc.)
    return 'AI';
  };

  // Get icon based on sender
  const getIcon = () => {
    if (message.sender === 0) return <User className="h-4 w-4" />;
    else return <Bot className="h-4 w-4" />;
  };

  // Sender 0 (user) = right side, all others = left side
  const isUserMessage = message.sender === 0;

  return (
  <div className={`mb-6 ${isUserMessage ? 'flex justify-end' : 'flex justify-start'}`}>
    <Card className={`max-w-[80%] border-0 shadow-none ${isUserMessage ? 'bg-muted' : 'bg-background'}`}>
      <CardHeaderCompact className="pb-2">
        <div className="flex items-center gap-2 text-xs">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {getIcon()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium">
            {getDisplayName()}
          </span>
          <Badge variant={isUserMessage ? 'secondary' : 'outline'} className="text-xs">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Badge>
        </div>
      </CardHeaderCompact>
      <CardContentCompact>
        <div className="overflow-hidden">
          <MessageContent
            content={processedContent || (messageType !== 'user' ? 'Pensando...' : '')}
            isTableOrList={isTableOrList}
          />
          {streamingMessageId === message.id && <SpinnerCursor />}
        </div>
      </CardContentCompact>
    </Card>
  </div>
  );
});