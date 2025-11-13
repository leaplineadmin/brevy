import React, { useState, useRef, useEffect } from 'react';
import { Button } from './button';
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';

import { logger } from '@shared/logger';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Description",
  className = "",
  id 
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    insertUnorderedList: false,
    insertOrderedList: false
  });

  // Convert HTML to plain text for display in templates
  const stripHtml = (html: string) => {
    if (typeof document === 'undefined') return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  // Initialize editor with content
  useEffect(() => {
    if (editorRef.current) {
      if (!isInitialized) {
        editorRef.current.innerHTML = value || '';
        setIsInitialized(true);
      } else if (value !== editorRef.current.innerHTML) {
        // Update content when value changes (for loading existing CV data)
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, isInitialized]);

  const updateActiveFormats = () => {
    if (!editorRef.current || typeof document === 'undefined' || !document.getSelection()) return;
    
    // Utiliser setTimeout pour s'assurer que l'état DOM est à jour après les modifications
    setTimeout(() => {
      try {
        setActiveFormats({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          insertUnorderedList: document.queryCommandState('insertUnorderedList'),
          insertOrderedList: document.queryCommandState('insertOrderedList')
        });
      } catch (error) {
        // Ignorer les erreurs de queryCommandState qui peuvent survenir
        logger.warn('Error updating active formats', 'component');
      }
    }, 10);
  };

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      logger.debug(`RichTextEditor handleInput called with content length: ${content.length}`, 'component');
      onChange(content);
      updateActiveFormats();
    }
  };

  const handleSelectionChange = () => {
    // Only update if the selection is within our editor
    if (editorRef.current && document.getSelection()) {
      const selection = document.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (editorRef.current.contains(range.commonAncestorContainer)) {
          updateActiveFormats();
        }
      }
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
    // Mise à jour immédiate de l'état des boutons
    updateActiveFormats();
  };

  // Listen for selection changes
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Allow normal Enter behavior for line breaks
      return;
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    logger.debug('Paste event triggered', 'component');
    // The onInput event will be triggered automatically after paste
    // No need to manually call handleInput
  };

  return (
    <div className={`border border-lightGrey rounded-md ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-lightGrey p-2 flex gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${activeFormats.bold ? 'bg-primaryLight' : ''}`}
          onClick={() => execCommand('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${activeFormats.italic ? 'bg-primaryLight' : ''}`}
          onClick={() => execCommand('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${activeFormats.underline ? 'bg-primaryLight' : ''}`}
          onClick={() => execCommand('underline')}
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px bg-lightGrey mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${activeFormats.insertUnorderedList ? 'bg-primaryLight' : ''}`}
          onClick={() => execCommand('insertUnorderedList')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={`h-8 w-8 p-0 ${activeFormats.insertOrderedList ? 'bg-primaryLight' : ''}`}
          onClick={() => execCommand('insertOrderedList')}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        id={id}
        contentEditable
        className="min-h-[96px] p-3 focus:outline-none"
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        style={{ 
          borderColor: "var(--lightGrey)",
          wordWrap: "break-word"
        }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />


    </div>
  );
}