import { useRef, useEffect } from 'react';
import { Button } from '@/components/shadcn/button';
import { Textarea } from '@/components/shadcn/textarea';
import { Square } from 'lucide-react';
import { VoiceRecordButton } from './VoiceRecordButton';
import { FileTranscribeButton } from './FileTranscribeButton';
import { CommandMenu } from './CommandMenu';
import { useCommand } from '../../contexts/CommandContext';
import { useTranscription } from '../../contexts/TranscriptionContext';

interface QueryInputSectionProps {
  company: string;
  area: string;
  onOpenConfigSidebar?: () => void;
}

export const QueryInputSection = ({ company, area }: QueryInputSectionProps) => {
  const currentMainActionRef = useRef<() => void>(() => {});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get command state from context
  const { userQuery, onQueryChange, isLoading, onCancel, onSearchVectorial, selectedAction, onSearchVectorialSQL } = useCommand();

  // Auto-grow textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onQueryChange(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = Math.min(textareaRef.current.scrollHeight, 80); // 80px = ~3 rows
      textareaRef.current.style.height = scrollHeight + 'px';
    }
  };

  // Get transcription state from context
  const {
    transcribeProvider,
    isRecording,
    isConnecting,
    onMicrophoneClick,
    isFileRecording,
    isFileTranscribing,
    onPrepareRecording,
    onCancelPrepareRecording,
    onStartRecording,
    onStopRecording,
  } = useTranscription();

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

          {/* Right side - Stop button when loading */}
          {isLoading && (
            <Button
              onClick={onCancel}
              variant="destructive"
              size="icon"
              className="absolute right-3 bottom-1 rounded-full h-6 w-6"
              title="Detener"
            >
              <Square className="w-4 h-4" />
            </Button>
          )}

          {/* Right side - Transcription buttons when not loading */}
          {!isLoading && (
            <div className="absolute right-3 bottom-1 flex gap-1">
              {transcribeProvider === 'aws' ? (
                <VoiceRecordButton
                  isRecording={isRecording}
                  isConnecting={isConnecting}
                  isDisabled={isLoading}
                  onClick={onMicrophoneClick}
                />
              ) : (
                <FileTranscribeButton
                  isRecording={isFileRecording}
                  isTranscribing={isFileTranscribing}
                  isDisabled={isLoading}
                  onPrepareRecording={onPrepareRecording}
                  onCancelPrepareRecording={onCancelPrepareRecording}
                  onStartRecording={onStartRecording}
                  onStopRecording={onStopRecording}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
