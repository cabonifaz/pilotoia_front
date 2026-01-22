import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// Add \displaystyle to math formulas to prevent size reduction
export const addDisplayStyle = (text: string | null | undefined): string => {
  if (!text || typeof text !== "string") return "";

  // 1. Limpieza inicial
  let cleanText = text
    .replace(/\\displaystyle/g, "")
    .replace(/\\\[/g, "$$")
    .replace(/\\\]/g, "$$")
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$")
    .replace(/([^\n])\s*(#{1,6}\s)/g, "$1\n\n$2")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0008]eta/g, "\\beta")
    .replace(/\\displaystyle/g, "");

  // 2. CORRECCIÓN DE ESPACIOS Y CIERRES
  cleanText = cleanText
    .split("\n")
    .map((line) => {
      let l = line;
      const dollarCount = (l.match(/(?<!\\)\$/g) || []).length;
      if (dollarCount % 2 !== 0) l = l + "$";

      l = l.replace(/\$\s+(?=\S)/g, "$").replace(/(?<=\S)\s+\$/g, "$");
      l = l
        .replace(/([a-zA-Záéíóúñ0-9.,:;)])\$/g, "$1 $")
        .replace(/\$([a-zA-Záéíóúñ0-9])/g, "$ $1");
      return l;
    })
    .join("\n");

  const lines = cleanText.split("\n");
  const processedLines: string[] = [];
  let mathBuffer: string[] = [];
  let isInBlockMath = false;

  const isMathLine = (line: string) => {
    const t = line.trim();

    if (t.startsWith("#")) return false;
    if (!t || t.includes("**") || t.includes("|")) return false;

    const hasStrongMath =
      /\\(frac|dfrac|sum|sqrt|aligned|left|right|begin|end)/.test(t);

    // --- CORRECCIÓN 3: LISTAS Y GUIONES (SOLUCIÓN A TU PROBLEMA) ---
    // 1. Si empieza con un guion de lista Markdown (- Texto)
    if (/^-\s/.test(t)) return false;

    // 2. Si empieza con signo menos matemático (−) o guion (-) seguido inmediatamente de letras
    // Esto evita que "−Caudales" sea detectado como $-Caudales$ (resta de variables)
    // Pero permite "-5" o "-x" (que suelen ser cortos o seguidos de números)
    if (/^[−-]\s*[a-zA-ZáéíóúñA-ZÁÉÍÓÚÑ]/.test(t) && !hasStrongMath) {
      // Si la línea es larga, es casi seguro texto con un guion al inicio
      if (t.length > 10) return false;
    }
    // ----------------------------------------------------------------

    // CORRECCIÓN 1: Detección de texto humano (Mantenemos esto del paso anterior)
    const startsWithText =
      /^(Si|No|En|El|La|Los|Las|Por|Para|Con|Una|Un|Se|Del|Al)\b/i.test(t);
    if (startsWithText && !hasStrongMath) return false;

    if (t.length > 60 && !hasStrongMath) return false;
    if (t === "$" || t === "$$") return true;

    const words = t.split(/\s+/);
    if (words.length > 4 && !hasStrongMath) return false;

    return /\\(frac|dfrac|sum|boxed|overline|sqrt|aligned|left|right)|[_^{}=+\-*/<>∑]/.test(
      t,
    );
  };

  // ... (El resto del bucle for y flushBuffer sigue idéntico al anterior)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("$$") || (trimmed === "$" && !isInBlockMath)) {
      if (mathBuffer.length > 0) {
        processedLines.push(flushBuffer(mathBuffer));
        mathBuffer = [];
      }
      isInBlockMath = !isInBlockMath;
      processedLines.push("$$");
      continue;
    }

    if (isInBlockMath) {
      if (trimmed === "$" || trimmed === "$$") {
        isInBlockMath = false;
        processedLines.push("$$");
        continue;
      }
      processedLines.push(line);
      continue;
    }

    if (isMathLine(line)) {
      mathBuffer.push(line.trim());
    } else {
      if (mathBuffer.length > 0) {
        processedLines.push(flushBuffer(mathBuffer));
        mathBuffer = [];
      }

      // CORRECCIÓN 2: Callback para excepciones de variables en español
      let inlineProcessed = line.replace(
        /\b([VNS])(\d+|[a-z])\b/g,
        (match, p1, p2) => {
          const fullWord = p1 + p2;
          const spanishExceptions = /^(Si|No|Ni|Na|Se|Su|Sa|So|Va|Ve|Vi|Vu)$/i;
          if (spanishExceptions.test(fullWord)) return match;
          return ` $ ${p1}_{${p2}} $ `;
        },
      );

      inlineProcessed = inlineProcessed.replace(/\s+/g, " ");
      processedLines.push(inlineProcessed);
    }
  }

  if (mathBuffer.length > 0) {
    processedLines.push(flushBuffer(mathBuffer));
  }

  return processedLines
    .map((line) => line.replace(/\\displaystyle/g, "").trim())
    .join("\n");
};

// ... flushBuffer igual
const flushBuffer = (buffer: string[]): string => {
  if (buffer.length === 0) return "";
  let combined = buffer.join("\n").trim();
  combined = combined.replace(/^\$|\$$/g, "").trim();
  if (combined.includes("\\begin{aligned}")) return `$$\n${combined}\n$$`;
  combined = combined
    .replace(/\\frac_/g, "\\frac")
    .replace(/\\sum\{/g, "\\sum_{");
  return `$$\n\\displaystyle ${combined}\n$$`;
};
// Simplified table fix for remark-gfm
export const fixTableMarkdown = (text: string): string => {
  // Split into lines and filter out empty/invalid rows
  const lines = text.split("\n");
  const filteredLines: string[] = [];
  let inTable = false;
  let skipFirstColumn = false;
  let tableStartIndex = -1;
  let foundSeparator = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableRow = line.trim().startsWith("|") && line.trim().endsWith("|");
    const isEmptyTableRow = /^\s*\|\s*(\|\s*)*\|?\s*$/.test(line);
    const isEmpty = !line.trim();
    const isSeparator = /^\s*\|[\s\-:|]+\|\s*$/.test(line);

    // Detect rows that look like table titles (mostly empty with one bold cell)
    // Example: | **Tabla de acopio y evacuación** | | |
    const cells = line.split("|");
    const nonEmptyCells = cells.filter((c) => c.trim() && c.trim() !== "");
    const isTableTitle =
      isTableRow &&
      !isSeparator &&
      line.includes("**") &&
      nonEmptyCells.length === 1 && // Only one non-empty cell
      cells.length >= 3; // But multiple columns

    // Check if first column is empty (indicates nested table pattern)
    const hasEmptyFirstColumn =
      isTableRow && !isSeparator && /^\s*\|\s*\|/.test(line);

    // If we hit a table title, convert it to plain text heading
    if (isTableTitle) {
      if (inTable) {
        // End current table
        filteredLines.push("");
        inTable = false;
      }
      // Extract the text from the table row and make it a heading
      const titleText = nonEmptyCells[0].trim();
      filteredLines.push("");
      filteredLines.push(`### ${titleText}`);
      filteredLines.push("");
      skipFirstColumn = true; // Next table should skip first column
      continue;
    }

    // Process table rows
    if (isTableRow && !isEmptyTableRow) {
      let processedLine = line;

      // If we're skipping first column and it's empty, remove it
      if (skipFirstColumn && hasEmptyFirstColumn) {
        // Split by pipes to get columns
        const parts = line.split("|");
        // Remove first empty element and second empty column, rejoin
        processedLine = "|" + parts.slice(2).join("|");
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
      const nextLine = i + 1 < lines.length ? lines[i + 1] : "";
      const nextIsSeparator = /^\s*\|[\s\-:|]+\|\s*$/.test(nextLine);
      const nextIsTableRow =
        nextLine.trim().startsWith("|") && nextLine.trim().endsWith("|");

      if (
        !foundSeparator &&
        nextIsTableRow &&
        !nextIsSeparator &&
        filteredLines.length === tableStartIndex + 1
      ) {
        // Insert separator after header row
        const columnCount = processedLine.split("|").filter((c) => c).length;
        const separator = "|" + " --- |".repeat(columnCount);
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
        filteredLines.push("");
        inTable = false;
        skipFirstColumn = false; // Reset when exiting table
        foundSeparator = false;
      }
      filteredLines.push(line);
    }
  }

  const result = filteredLines.join("\n");
  return result;
};

interface MessageContentProps {
  content: string;
  isTableOrList: boolean;
}

export const MessageContent = ({
  content,
  isTableOrList,
}: MessageContentProps) => {
  // 1. Aplicamos la limpieza. processedContent AHORA TIENE LOS $$ AGREGADOS
  const processedContent = isTableOrList
    ? fixTableMarkdown(addDisplayStyle(content))
    : addDisplayStyle(content);

  const commonPlugins = [remarkGfm, remarkMath];
  const commonRehype = [rehypeKatex];

  return (
    <div className="text-xs space-y-2">
      {isTableOrList ? (
        <ReactMarkdown
          remarkPlugins={commonPlugins}
          rehypePlugins={commonRehype as any}
          components={{
            // ... (Tus componentes de tabla existentes se mantienen igual)
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
            ul: ({ children }) => (
              <ul className="ml-4 mb-2 list-disc">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="ml-4 mb-2 list-decimal">{children}</ol>
            ),
            li: ({ children }) => <li className="mb-1">{children}</li>,
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
            // CORRECCIÓN: Usar p normal para evitar conflictos
            p: ({ children }) => (
              <div className="whitespace-pre-wrap break-words mb-2 last:mb-0">
                {children}
              </div>
            ),
          }}
        >
          {processedContent}
        </ReactMarkdown>
      ) : (
        <ReactMarkdown
          remarkPlugins={commonPlugins}
          rehypePlugins={commonRehype as any}
          components={{
            // 2. CORRECCIÓN CRÍTICA:
            // No usar 'span' para 'p'. Las fórmulas matemáticas de bloque ($$...$$)
            // generan un <div>. HTML no permite un <div> dentro de un <span>.
            // Usamos un <p> o <div> con whitespace-pre-wrap.
            p: ({ children }) => (
              <div className="whitespace-pre-wrap break-words mb-2 last:mb-0">
                {children}
              </div>
            ),
            strong: ({ children }) => (
              <strong className="font-bold">{children}</strong>
            ),
            em: ({ children }) => <em className="italic">{children}</em>,
          }}
        >
          {/* 3. ERROR ANTERIOR: Aquí tenías {content}, por eso ignoraba el arreglo */}
          {processedContent}
        </ReactMarkdown>
      )}
    </div>
  );
};
