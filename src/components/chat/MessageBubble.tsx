import { memo } from 'react';
import { User, Bot, Loader2 } from 'lucide-react';
import { Card, CardHeaderCompact, CardContentCompact } from '@/components/shadcn/card';
import { Avatar, AvatarFallback } from '@/components/shadcn/avatar';
import { Badge } from '@/components/shadcn/badge';
import { type Message, parseMessageTimestamp, getMessageType } from '@/types/message';
import { MessageContent, fixTableMarkdown, addDisplayStyle } from './MessageContent';

interface MessageBubbleProps {
  message: Message;
  streamingMessageId?: string | null;
  progressMessage?: string | null;
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

export const MessageBubble = memo(({ message, streamingMessageId, progressMessage, user }: MessageBubbleProps) => {
  const messageType = getMessageType(message.sender);
  const timestamp = parseMessageTimestamp(message.created_at);
  const isTableOrList = hasTableOrList(message.message);

  // Remove <br> tags and add displaystyle to formulas
  const cleanContent = message.message.replace(/<br\s*\/?>/gi, '');
  const withDisplayStyle = addDisplayStyle(cleanContent);
  const processedContent = isTableOrList ? fixTableMarkdown(withDisplayStyle) : withDisplayStyle;

  // Determine what to show when message is empty (streaming placeholder)
  const getPlaceholderText = () => {
    if (messageType === 'user') return '';
    // Show progress message if available and this is the streaming message
    if (streamingMessageId === message.id && progressMessage) {
      return progressMessage;
    }
    return 'Pensando...';
  };

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
    <div className="flex flex-col max-w-[80%] gap-1">
    {message.attachment_urls && message.attachment_urls.length > 0 && (
      <div className={`flex flex-wrap gap-2 ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
        {message.attachment_urls.map((url, i) => (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer">
            <img
              src={url}
              alt={`attachment-${i + 1}`}
              className="h-20 w-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
            />
          </a>
        ))}
      </div>
    )}
    <Card className={`border-0 shadow-none ${isUserMessage ? 'bg-muted' : 'bg-background'}`}>
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
            content={processedContent || getPlaceholderText()}
            isTableOrList={isTableOrList}
          />
          {streamingMessageId === message.id && <Loader2 className="inline-block ml-0.5 h-3 w-3 animate-spin" />}
        </div>
      </CardContentCompact>
    </Card>
    </div>
  </div>
  );
});