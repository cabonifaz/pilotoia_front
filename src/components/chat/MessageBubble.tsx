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
  const filteredLines: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');
    const isEmptyTableRow = /^\s*\|\s*(\|\s*)*\|?\s*$/.test(line);
    const isEmpty = !line.trim();

    // Track if we're in a table
    if (isTableRow && !isEmptyTableRow) {
      inTable = true;
      filteredLines.push(line);
    } else if (isEmptyTableRow) {
      // Skip empty table rows (only pipes and whitespace)
      continue;
    } else if (isEmpty) {
      // Keep empty lines after table or between regular lines
      if (inTable) {
        // Transitioning out of table
        filteredLines.push(line);
        inTable = false;
      } else if (filteredLines.length > 0) {
        // Empty line between regular content - preserve it
        filteredLines.push(line);
      }
    } else {
      // Regular content line (not a table row)
      if (inTable) {
        // Add blank line to separate table from following text
        filteredLines.push('');
        inTable = false;
      }
      filteredLines.push(line);
    }
  }

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
                // Table styling
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-4 border border-gray-300 dark:border-gray-600">
                    <table className="w-full min-w-max border-collapse text-sm">
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