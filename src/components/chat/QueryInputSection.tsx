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
    <div className="p-4">
      <div className="flex gap-2 items-end">
        <div className="relative flex-1">
          {/* Command Menu (Left side inside textarea) */}
          {!isLoading && (
            <CommandMenu disabled={isLoading} />
          )}

          <Textarea
            ref={textareaRef}
            value={userQuery}
            onChange={handleInput}
            placeholder={`Escribe tu consulta sobre ${company} • ${area}...`}
            disabled={isLoading}
            rows={1}
            className="resize-none pr-9 pl-9 min-h-[2.5rem] max-h-[5rem] overflow-y-auto !border-1 !border-muted-foreground/30 rounded-3xl text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                currentMainActionRef.current();
              }
            }}
          />
          {isLoading && (
            <Button
              onClick={onCancel}
              variant="destructive"
              size="icon"
              className="absolute right-0.5 bottom-0.5 rounded-full"
              title="Detener"
            >
              <Square className="w-4 h-4" />
            </Button>
          )}
          {!isLoading && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
