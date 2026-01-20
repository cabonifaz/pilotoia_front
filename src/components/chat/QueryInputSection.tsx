import { useRef, useEffect } from 'react';
import { Button } from '@/components/shadcn/button';
import { Textarea } from '@/components/shadcn/textarea';
import { Square, AudioLines } from 'lucide-react';
//import { VoiceRecordButton } from './VoiceRecordButton';
//import { FileTranscribeButton } from './FileTranscribeButton';
import { CommandMenu } from './CommandMenu';
import { useCommand } from '../../contexts/CommandContext';
//import { useTranscription } from '../../contexts/TranscriptionContext';

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

  /*const focusTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };*/

  // Resize textarea whenever userQuery changes (e.g., from transcription)
  useEffect(() => {
    resizeTextarea();
  }, [userQuery]);

  // Get transcription state from context
  /*const {
    transcribeProvider,
    isRecording,
    isConnecting,
    onMicrophoneClick,
    startMicrophoneRecording,
    stopMicrophoneRecording,
    isFileRecording,
    isFileTranscribing,
    onPrepareRecording,
    onCancelPrepareRecording,
    onStartRecording,
    onStopRecording,
  } = useTranscription();*/

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
          {/*!isLoading && (
            <div className="absolute right-3 bottom-1 flex gap-1">
              {transcribeProvider === 'aws' ? (
                <div className="hidden md:block">
                  <VoiceRecordButton
                    isRecording={isRecording}
                    isConnecting={isConnecting}
                    isDisabled={isLoading}
                    onClick={() => {
                      onMicrophoneClick();
                      focusTextarea();
                    }}
                    onStart={startMicrophoneRecording}
                    onStop={() => {
                      stopMicrophoneRecording();
                      focusTextarea();
                    }}
                  />
                </div>
              ) : (
                <div className="hidden md:block">
                  <FileTranscribeButton
                    isRecording={isFileRecording}
                    isTranscribing={isFileTranscribing}
                    isDisabled={isLoading}
                    onPrepareRecording={onPrepareRecording}
                    onCancelPrepareRecording={onCancelPrepareRecording}
                    onStartRecording={onStartRecording}
                    onStopRecording={() => {
                      onStopRecording();
                      focusTextarea();
                    }}
                  />
                </div>
              )}
            </div>
          )*/}
          {!isLoading && (
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
              className={`absolute right-3 bottom-1 rounded-full ${ttsEnabled ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
              title={ttsEnabled ? 'Desactivar texto a voz' : 'Activar texto a voz'}
            >
              <AudioLines className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
