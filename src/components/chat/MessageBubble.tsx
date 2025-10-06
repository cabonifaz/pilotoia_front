import { memo, useState, useEffect } from 'react';
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

// Simplified table fix for remark-gfm
const fixTableMarkdown = (text: string): string => {
  // Split into lines and filter out empty/invalid rows
  const lines = text.split('\n');
  const filteredLines: string[] = [];
  let inTable = false;
  let skipFirstColumn = false;
  let tableStartIndex = -1;
  let foundSeparator = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');
    const isEmptyTableRow = /^\s*\|\s*(\|\s*)*\|?\s*$/.test(line);
    const isEmpty = !line.trim();
    const isSeparator = /^\s*\|[\s\-:|]+\|\s*$/.test(line);

    // Detect rows that look like table titles (mostly empty with one bold cell)
    // Example: | **Tabla de acopio y evacuación** | | |
    const cells = line.split('|');
    const nonEmptyCells = cells.filter(c => c.trim() && c.trim() !== '');
    const isTableTitle = isTableRow && !isSeparator &&
      line.includes('**') &&
      nonEmptyCells.length === 1 && // Only one non-empty cell
      cells.length >= 3; // But multiple columns

    // Check if first column is empty (indicates nested table pattern)
    const hasEmptyFirstColumn = isTableRow && !isSeparator && /^\s*\|\s*\|/.test(line);

    // If we hit a table title, convert it to plain text heading
    if (isTableTitle) {
      if (inTable) {
        // End current table
        filteredLines.push('');
        inTable = false;
      }
      // Extract the text from the table row and make it a heading
      const titleText = nonEmptyCells[0].trim();
      filteredLines.push('');
      filteredLines.push(`### ${titleText}`);
      filteredLines.push('');
      skipFirstColumn = true; // Next table should skip first column
      continue;
    }

    // Process table rows
    if (isTableRow && !isEmptyTableRow) {
      let processedLine = line;

      // If we're skipping first column and it's empty, remove it
      if (skipFirstColumn && hasEmptyFirstColumn) {
        // Split by pipes to get columns
        const parts = line.split('|');
        // Remove first empty element and second empty column, rejoin
        processedLine = '|' + parts.slice(2).join('|');
      }

      // Track if this is the start of a table
      if (!inTable) {
        tableStartIndex = filteredLines.length;
        foundSeparator = false;
      }

      if (isSeparator) {
        foundSeparator = true;
      }

      inTable = true;
      filteredLines.push(processedLine);

      // Check if next line is NOT a separator and we haven't found one yet
      // This means we need to insert a separator after the header row
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      const nextIsSeparator = /^\s*\|[\s\-:|]+\|\s*$/.test(nextLine);
      const nextIsTableRow = nextLine.trim().startsWith('|') && nextLine.trim().endsWith('|');

      if (!foundSeparator && nextIsTableRow && !nextIsSeparator && filteredLines.length === tableStartIndex + 1) {
        // Insert separator after header row
        const columnCount = processedLine.split('|').filter(c => c).length;
        const separator = '|' + ' --- |'.repeat(columnCount);
        filteredLines.push(separator);
        foundSeparator = true;
      }

    } else if (isEmptyTableRow) {
      // Skip empty table rows (only pipes and whitespace)
      continue;
    } else if (isEmpty) {
      // Keep empty lines after table or between regular lines
      if (inTable) {
        // Transitioning out of table
        filteredLines.push(line);
        inTable = false;
        skipFirstColumn = false; // Reset when exiting table
        foundSeparator = false;
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
        skipFirstColumn = false; // Reset when exiting table
        foundSeparator = false;
      }
      filteredLines.push(line);
    }
  }

  const result = filteredLines.join('\n');
  return result;
};

export const MessageBubble = memo(({ message, streamingMessageId, userId }: MessageBubbleProps) => {
  const isTableOrList = hasTableOrList(message.content);
  // Remove <br> tags
  const cleanContent = message.content.replace(/<br\s*\/?>/gi, '');
  const processedContent = isTableOrList ? fixTableMarkdown(cleanContent) : cleanContent;

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
            <>
              <span className="whitespace-pre-wrap">
                {message.content || (message.type === 'ai' ? 'Pensando...' : '')}
              </span>
              {streamingMessageId === message.id && <SpinnerCursor />}
            </>
          )}
          {streamingMessageId === message.id && isTableOrList && <SpinnerCursor />}
        </div>
      </CardContent>
    </Card>
  </div>
  );
});