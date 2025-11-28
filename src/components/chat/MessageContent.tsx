import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Add \displaystyle to math formulas to prevent size reduction
export const addDisplayStyle = (text: string): string => {
  // Match both $...$ and $$...$$ patterns
  const displayPattern = /\$\$([^$]+)\$\$/g;
  const inlinePattern = /\$([^$]+)\$/g;

  // First handle display math $$...$$
  let result = text.replace(displayPattern, (match, formula) => {
    if (!formula.trim().startsWith('\\displaystyle')) {
      return `$$\\displaystyle ${formula}$$`;
    }
    return match;
  });

  // Then handle inline math $...$ but avoid double-processing
  result = result.replace(inlinePattern, (match, formula) => {
    if (!formula.trim().startsWith('\\displaystyle') && match.match(/^\$[^$]+\$$/)) {
      return match; // Skip if it's part of $$
    }
    if (!formula.trim().startsWith('\\displaystyle')) {
      return `$\\displaystyle ${formula}$`;
    }
    return match;
  });

  return result;
};

// Simplified table fix for remark-gfm
export const fixTableMarkdown = (text: string): string => {
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

interface MessageContentProps {
  content: string;
  isTableOrList: boolean;
}

export const MessageContent = ({ content, isTableOrList }: MessageContentProps) => {
  const processedContent = isTableOrList ? fixTableMarkdown(content) : content;

  return (
    <div className="text-xs">
      {isTableOrList ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            // Table styling
            table: ({ children }) => (
              <div className="overflow-x-auto mb-4 border border-gray-300 dark:border-gray-600">
                <table className="w-full min-w-max border-collapse">
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

            // Code block styling with outline variant
            code: ({ children }) => (
              <code className="bg-background border border-foreground px-1 py-0.5 rounded text-sm font-mono break-words">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-background border-2 border-foreground p-3 rounded overflow-x-auto max-h-96 mb-2">
                {children}
              </pre>
            ),
          }}
        >
          {processedContent}
        </ReactMarkdown>
      ) : (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={{
            p: ({ children }) => <span className="whitespace-pre-wrap break-words overflow-hidden">{children}</span>,
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
          }}
        >
          {content}
        </ReactMarkdown>
      )}
    </div>
  );
};
