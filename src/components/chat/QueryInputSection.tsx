import { useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/shadcn/button';
import { Textarea } from '@/components/shadcn/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/select';
import { Square, Languages, AudioLines } from 'lucide-react';
import { VoiceRecordButton } from './VoiceRecordButton';
import { FileTranscribeButton } from './FileTranscribeButton';
import { CommandMenu } from './CommandMenu';
import { useCommand } from '../../contexts/CommandContext';
import { useTranscription } from '../../contexts/TranscriptionContext';
import { getAvailableLanguages, getLanguageCode } from '../../constants/languages';

interface QueryInputSectionProps {
  company: string;
  area: string;
  onOpenConfigSidebar?: () => void;
}

export const QueryInputSection = ({ company, area }: QueryInputSectionProps) => {
  const currentMainActionRef = useRef<() => void>(() => {});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get command state from context
  const { userQuery, onQueryChange, isLoading, onCancel, onSearchVectorial, selectedAction, onSearchVectorialSQL, ttsEnabled, onTtsEnabledChange } = useCommand();

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

  // Get transcription state from context
  const {
    transcribeProvider,
    selectedLanguage,
    setSelectedLanguage,
    isRecording,
    isConnecting,
    onMicrophoneClick,
    isFileRecording,
    isFileTranscribing,
    onStartRecording,
    onStopRecording,
  } = useTranscription();

  // Get available languages based on provider
  const availableLanguages = useMemo(() => {
    const provider = transcribeProvider === 'aws' ? 'aws' : 'openai';
    return getAvailableLanguages(provider);
  }, [transcribeProvider]);

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
            <div className="absolute right-3 bottom-1 flex items-center gap-1">
              {/* Language selector */}
              <Select
                value={selectedLanguage}
                onValueChange={(value) => {
                  setSelectedLanguage(value);
                }}
              >
                <SelectTrigger className="h-8 w-[100px] text-xs border-muted-foreground/30">
                  <Languages className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableLanguages.map((lang) => {
                    const provider = transcribeProvider === 'aws' ? 'aws' : 'openai';
                    const code = getLanguageCode(lang, provider);
                    if (!code) return null;
                    return (
                      <SelectItem key={code} value={code} className="text-xs">
                        {lang.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Transcription button (STT) */}
              {transcribeProvider === 'aws' ? (
                <VoiceRecordButton
                  isRecording={isRecording}
                  isConnecting={isConnecting}
                  isDisabled={isLoading}
                  onClick={() => {
                    onMicrophoneClick();
                    focusTextarea();
                  }}
                />
              ) : (
                <FileTranscribeButton
                  isRecording={isFileRecording}
                  isTranscribing={isFileTranscribing}
                  isDisabled={isLoading}
                  onClick={() => {
                    if (isFileRecording) {
                      onStopRecording();
                    } else {
                      onStartRecording();
                    }
                    focusTextarea();
                  }}
                />
              )}

              {/* TTS toggle button */}
              <Button
                onClick={() => {
                  onTtsEnabledChange(!ttsEnabled);
                  requestAnimationFrame(() => {
                    textareaRef.current?.focus();
                  });
                }}
                variant="ghost"
                size="icon"
                tabIndex={-1}
                className={`rounded-full ${ttsEnabled ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                title={ttsEnabled ? 'Desactivar texto a voz' : 'Activar texto a voz'}
              >
                <AudioLines className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
