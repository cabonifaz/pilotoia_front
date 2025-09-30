import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader } from '@/components/shadcn/card';
import { Avatar, AvatarFallback } from '@/components/shadcn/avatar';
import { Badge } from '@/components/shadcn/badge';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
  streamingMessageId?: string | null;
  userId: string;
}

// Simplified detection for tables and lists
const hasTableOrList = (text: string): boolean => {
  const patterns = [
    /\|.*?\|.*?\|/,         // Tables with multiple pipes
    /^\s*[-*+]\s/m,         // Unordered lists (-, *, +)
    /^\s*\d+\.\s/m,         // Ordered lists (1. 2. 3.)
  ];

  return patterns.some(pattern => pattern.test(text));
};

// Simplified table fix for remark-gfm
const fixTableMarkdown = (text: string): string => {
  // remark-gfm is more forgiving, just add basic line breaks
  let fixed = text.replace(/(\|[^|]+\|[^|]+\|[^|]*\|[^|]*\|)\s+(\|)/g, '$1\n$2');

  // Split into lines and filter out empty rows
  const lines = fixed.split('\n');
  const filteredLines = lines.filter(line => {
    // Skip empty lines
    if (!line.trim()) return false;

    // Skip table rows that are essentially empty (only pipes and whitespace)
    const tableRowPattern = /^\s*\|\s*(\|\s*)*\|?\s*$/;
    if (tableRowPattern.test(line)) {
      return false;
    }

    return true;
  });

  return filteredLines.join('\n');
};

export const MessageBubble = ({ message, streamingMessageId, userId }: MessageBubbleProps) => {
  const isTableOrList = hasTableOrList(message.content);
  const processedContent = isTableOrList ? fixTableMarkdown(message.content) : message.content;

  return (
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
            {message.type === 'user' ? userId : 'Piloto IA'}
          </span>
          <Badge variant={message.type === 'user' ? 'default' : 'outline'} className="text-xs">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div>
          {isTableOrList ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Table styling with horizontal scroll container
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full min-w-max border-collapse border border-gray-300 dark:border-gray-600 text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-200 dark:bg-gray-700">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-bold text-gray-900 dark:text-gray-100">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 dark:border-gray-600 px-3 py-2">
                    {children}
                  </td>
                ),

                // List styling
                ul: ({ children }) => <ul className="ml-4 mb-2 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="ml-4 mb-2 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="mb-1">{children}</li>,

                // Keep paragraphs clean
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              }}
            >
              {processedContent || (message.type === 'ai' ? 'Pensando...' : '')}
            </ReactMarkdown>
          ) : (
            <div className="whitespace-pre-wrap">
              {message.content || (message.type === 'ai' ? 'Pensando...' : '')}
            </div>
          )}
          {streamingMessageId === message.id && (
            <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse">▊</span>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
  );
};