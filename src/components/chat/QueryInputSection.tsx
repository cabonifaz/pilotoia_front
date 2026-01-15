import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/shadcn/button';
import { Textarea } from '@/components/shadcn/textarea';
import { Square, Languages } from 'lucide-react';
import { OpenAIVoiceRecordButton } from './OpenAIVoiceRecordButton';
import { CommandMenu } from './CommandMenu';
import { useCommand } from '../../contexts/CommandContext';
import { useOpenAITranscribe } from '../../hooks/useOpenAITranscribe';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/select';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '@/constants/languages';

interface QueryInputSectionProps {
  company: string;
  area: string;
  onOpenConfigSidebar?: () => void;
}

export const QueryInputSection = ({ company, area }: QueryInputSectionProps) => {
  const currentMainActionRef = useRef<() => void>(() => {});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Language selection state for voice transcription
  const [selectedLanguage, setSelectedLanguage] = useState<string>(DEFAULT_LANGUAGE);

  // Get command state from context
  const { userQuery, onQueryChange, isLoading, onCancel, onSearchVectorial, selectedAction, onSearchVectorialSQL } = useCommand();

  // Get OpenAI transcription hook
  const {
    isRecording,
    isConnecting,
    transcript,
    startRecording,
    stopRecording,
    clearTranscript
  } = useOpenAITranscribe();

  // Resize textarea to fit content
  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = Math.min(textareaRef.current.scrollHeight, 80); // 80px = ~3 rows
      textareaRef.current.style.height = scrollHeight + 'px';
    }
  };

  // Auto-grow textarea on keyboard input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onQueryChange(e.target.value);
    resizeTextarea();
  };

  const focusTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Resize textarea whenever userQuery changes (e.g., from transcription)
  useEffect(() => {
    resizeTextarea();
  }, [userQuery]);

  // Update query when transcript is available from OpenAI
  useEffect(() => {
    if (transcript) {
      onQueryChange(transcript);
      clearTranscript(); // Clear after using it
    }
  }, [transcript, onQueryChange, clearTranscript]);

  // Handle microphone click (for click mode on desktop)
  const handleMicrophoneClick = () => {
    if (isRecording) {
      stopRecording();
      focusTextarea();
    } else {
      // Start recording with selected language
      startRecording({ language: selectedLanguage });
    }
  };

  // Update ref based on selected action
  useEffect(() => {
    if (selectedAction === 'vectorial') {
      currentMainActionRef.current = onSearchVectorial;
    } /*else if (selectedAction === 'vectorial+sql') {
      currentMainActionRef.current = onSearchVectorialSQL;
    }
    else login - handle when implemented*/
  }, [selectedAction, onSearchVectorial, onSearchVectorialSQL]);

  return (
    <div className="p-1">
      <div className="flex gap-2 items-end">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={userQuery}
            onChange={handleInput}
            placeholder={`Escribe tu consulta sobre ${company} • ${area}`}
            disabled={isLoading}
            rows={1}
            className="resize-none min-h-[2.8rem] max-h-[3.8rem] w-full overflow-y-auto !border-1 !border-muted-foreground/30 rounded-3xl text-xs px-10 py-3"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                currentMainActionRef.current();
              }
            }}
          />
          {/* Left side - Command Menu */}
          {!isLoading && (
            <div className="absolute left-1 bottom-1">
              <CommandMenu disabled={isLoading} />
            </div>
          )}

          {isLoading && (
            <Button
              onClick={onCancel}
              variant="destructive"
              size="icon"
              className="absolute right-3 bottom-1 rounded-full"
              title="Detener"
            >
              <Square className="w-4 h-4" />
            </Button>
          )}
          {!isLoading && (
            <div className="absolute right-3 bottom-1 flex gap-1 items-center">
              {/* Language selector - hidden when recording */}
              {!isRecording && (
                <div className="hidden md:block">
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="h-8 w-[140px] text-xs border-muted-foreground/30">
                      <Languages className="w-3 h-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code} className="text-xs">
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Voice record button */}
              <div className="hidden md:block">
                <OpenAIVoiceRecordButton
                  isRecording={isRecording}
                  isConnecting={isConnecting}
                  isDisabled={isLoading}
                  onClick={handleMicrophoneClick}
                  onStart={() => startRecording({ language: selectedLanguage })}
                  onStop={() => {
                    stopRecording();
                    focusTextarea();
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
