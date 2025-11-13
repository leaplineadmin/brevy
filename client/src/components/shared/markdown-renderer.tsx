import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

/**
 * Converts markdown-like content to HTML with proper SEO structure (H1, H2, H3, etc.)
 * Handles:
 * - Headers (# H1, ## H2, ### H3, etc.)
 * - Paragraphs
 * - Lists (unordered and ordered)
 * - Bold (**text**)
 * - Italic (*text*)
 * - Blockquotes (> text)
 * - Links ([text](url))
 * - Tables
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const renderMarkdown = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];
    let inList = false;
    let listItems: string[] = [];
    let listType: 'ul' | 'ol' = 'ul';
    let inBlockquote = false;
    let blockquoteLines: string[] = [];
    let inTable = false;
    let tableRows: string[] = [];
    let tableHeaders: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const paragraphText = currentParagraph.join(' ').trim();
        if (paragraphText) {
          elements.push(
            <p key={`p-${elements.length}`} className="mb-4 text-gray-700 leading-relaxed">
              {renderInlineMarkdown(paragraphText)}
            </p>
          );
        }
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (listItems.length > 0) {
        const ListTag = listType === 'ul' ? 'ul' : 'ol';
        elements.push(
          <ListTag key={`list-${elements.length}`} className="mb-4 ml-6 list-disc space-y-2">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-gray-700 leading-relaxed">
                {renderInlineMarkdown(item.trim())}
              </li>
            ))}
          </ListTag>
        );
        listItems = [];
        inList = false;
      }
    };

    const flushBlockquote = () => {
      if (blockquoteLines.length > 0) {
        elements.push(
          <blockquote key={`blockquote-${elements.length}`} className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600">
            {blockquoteLines.map((line, idx) => (
              <p key={idx} className="mb-2">
                {renderInlineMarkdown(line.trim())}
              </p>
            ))}
          </blockquote>
        );
        blockquoteLines = [];
        inBlockquote = false;
      }
    };

    const flushTable = () => {
      if (tableRows.length > 0 && tableHeaders.length > 0) {
        elements.push(
          <div key={`table-${elements.length}`} className="my-6 overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  {tableHeaders.map((header, idx) => (
                    <th key={idx} className="border border-gray-300 px-4 py-2 bg-gray-100 font-bold text-left">
                      {renderInlineMarkdown(header.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, rowIdx) => {
                  const cells = row.split('|').map(cell => cell.trim()).filter(Boolean);
                  return (
                    <tr key={rowIdx}>
                      {cells.map((cell, cellIdx) => (
                        <td key={cellIdx} className="border border-gray-300 px-4 py-2">
                          {renderInlineMarkdown(cell.trim())}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        tableHeaders = [];
        inTable = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      // Headers
      if (trimmedLine.match(/^#{1,6}\s+/)) {
        flushParagraph();
        flushList();
        flushBlockquote();
        flushTable();
        
        const match = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          const level = match[1].length;
          const text = match[2];
          const HeaderTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements;
          const className = level === 1 
            ? "text-3xl font-bold text-[#1a1a2e] mb-6 mt-8" 
            : level === 2 
            ? "text-2xl font-bold text-[#1a1a2e] mb-4 mt-6"
            : "text-xl font-bold text-[#1a1a2e] mb-3 mt-4";
          
          elements.push(
            <HeaderTag key={`h${level}-${index}`} className={className}>
              {renderInlineMarkdown(text)}
            </HeaderTag>
          );
        }
        return;
      }

      // Blockquote
      if (trimmedLine.startsWith('>')) {
        flushParagraph();
        flushList();
        flushTable();
        inBlockquote = true;
        blockquoteLines.push(trimmedLine.substring(1).trim());
        return;
      }

      if (inBlockquote && trimmedLine) {
        blockquoteLines.push(trimmedLine);
        return;
      }

      // Tables
      if (trimmedLine.includes('|') && trimmedLine.split('|').length > 2) {
        flushParagraph();
        flushList();
        flushBlockquote();
        
        // Check if it's a header separator (|---|---|)
        if (trimmedLine.match(/^\|[\s\-:]+\|/)) {
          inTable = true;
          return;
        }

        if (inTable) {
          tableRows.push(trimmedLine);
        } else {
          // First row is headers
          tableHeaders = trimmedLine.split('|').map(cell => cell.trim()).filter(Boolean);
          inTable = true;
        }
        return;
      }

      if (inTable && !trimmedLine) {
        flushTable();
        return;
      }

      // Lists
      if (trimmedLine.match(/^[\*\-\+]\s+/) || trimmedLine.match(/^\d+\.\s+/)) {
        flushParagraph();
        flushBlockquote();
        flushTable();
        
        const isOrdered = /^\d+\.\s+/.test(trimmedLine);
        const newListType = isOrdered ? 'ol' : 'ul';
        
        if (!inList || listType !== newListType) {
          flushList();
          listType = newListType;
        }
        
        inList = true;
        const itemText = trimmedLine.replace(/^[\*\-\+]\s+/, '').replace(/^\d+\.\s+/, '');
        listItems.push(itemText);
        return;
      }

      if (inList && !trimmedLine) {
        flushList();
        return;
      }

      // Empty line
      if (!trimmedLine) {
        flushParagraph();
        flushList();
        flushBlockquote();
        flushTable();
        return;
      }

      // Regular paragraph
      flushList();
      flushBlockquote();
      flushTable();
      currentParagraph.push(trimmedLine);
    });

    // Flush remaining content
    flushParagraph();
    flushList();
    flushBlockquote();
    flushTable();

    return elements;
  };

  const renderInlineMarkdown = (text: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Process links first
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before link
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        parts.push(...processInlineFormatting(beforeText, key));
        key += 1000;
      }

      // Add link
      const linkText = match[1];
      const linkUrl = match[2];
      parts.push(
        <a
          key={`link-${key++}`}
          href={linkUrl}
          className="text-blue-600 hover:text-blue-800 underline"
          target={linkUrl.startsWith('http') ? '_blank' : undefined}
          rel={linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
          {processInlineFormatting(linkText, key)}
        </a>
      );
      key += 1000;
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(...processInlineFormatting(text.substring(lastIndex), key));
    }

    return parts.length > 0 ? parts : text;
  };

  const processInlineFormatting = (text: string, startKey: number): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = startKey;

    // Bold (**text** or __text__)
    const boldRegex = /(\*\*|__)(.+?)\1/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(...processItalic(text.substring(lastIndex, match.index), key));
        key += 100;
      }
      parts.push(
        <strong key={`bold-${key++}`} className="font-bold">
          {processItalic(match[2], key)}
        </strong>
      );
      key += 100;
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(...processItalic(text.substring(lastIndex), key));
    }

    return parts.length > 0 ? parts : [text];
  };

  const processItalic = (text: string, startKey: number): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    const italicRegex = /(\*|_)(.+?)\1/g;
    let lastIndex = 0;
    let key = startKey;
    let match;

    while ((match = italicRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <em key={`italic-${key++}`} className="italic">
          {match[2]}
        </em>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  return <div className="article-content">{renderMarkdown(content)}</div>;
};

