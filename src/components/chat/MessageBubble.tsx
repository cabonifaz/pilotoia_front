import { memo, useState, useEffect } from 'react';
import { ScrollArea, ScrollBar } from '@/components/shadcn/scroll-area';
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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!lightboxUrl) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxUrl(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxUrl]);

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
  <>
  <div className={`mb-6 ${isUserMessage ? 'flex justify-end' : 'flex justify-start'}`}>
    <div className="flex flex-col max-w-[80%]">
    {message.attachment_urls && message.attachment_urls.length > 0 && (
      <ScrollArea className="w-full whitespace-nowrap px-1 pb-1">
        <div className={`flex gap-2 pb-2 ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
          {message.attachment_urls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`attachment-${i + 1}`}
              className="h-20 w-20 object-cover rounded shrink-0 cursor-zoom-in hover:opacity-80 transition-opacity"
              onClick={() => setLightboxUrl(url)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
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

  {lightboxUrl && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm cursor-zoom-out"
      onClick={() => setLightboxUrl(null)}
    >
      <img
        src={lightboxUrl}
        alt="preview"
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )}
  </>
  );
});