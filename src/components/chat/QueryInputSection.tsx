import { useRef, useEffect } from 'react';
import { Button } from '@/components/shadcn/button';
import { Textarea } from '@/components/shadcn/textarea';
import { VoiceRecordButton } from './VoiceRecordButton';
import { FileTranscribeButton } from './FileTranscribeButton';
import { CommandMenu } from './CommandMenu';
import { CommandProvider } from '../../contexts/CommandContext';

interface QueryInputSectionProps {
  // Query state
  userQuery: string;
  onQueryChange: (value: string) => void;

  // Loading state
  isLoading: boolean;
  onCancel: () => void;

  // Context
  company: string;
  transcribeProvider: string;
  isAuthenticated: boolean;
  onMainActionChange: (action: () => void) => void;

  // VoiceRecordButton props
  isRecording: boolean;
  isConnecting: boolean;
  onMicrophoneClick: () => void;

  // FileTranscribeButton props
  isFileRecording: boolean;
  isFileTranscribing: boolean;
  onPrepareRecording: () => void;
  onCancelPrepareRecording: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;

  // Command context props
  onSend: () => void;
  onAgentSend: () => void;
}

export const QueryInputSection = ({
  userQuery,
  onQueryChange,
  isLoading,
  onCancel,
  company,
  transcribeProvider,
  onMainActionChange,
  isRecording,
  isConnecting,
  onMicrophoneClick,
  isFileRecording,
  isFileTranscribing,
  onPrepareRecording,
  onCancelPrepareRecording,
  onStartRecording,
  onStopRecording,
  isAuthenticated,
  onSend,
  onAgentSend,
}: QueryInputSectionProps) => {
  const currentMainActionRef = useRef<() => void>(() => {});

  useEffect(() => {
    onMainActionChange(currentMainActionRef.current);
  }, [onMainActionChange]);

  return (
    <CommandProvider
      onSend={onSend}
      onAgentSend={onAgentSend}
      isAuthenticated={isAuthenticated}
      onMainActionChange={(action) => {
        currentMainActionRef.current = action;
      }}
    >
      <div className="border-t p-4">
      <div className="flex gap-2 items-end">
        {/* Input with Transcribe Buttons and Command Menu */}
        <div className="relative flex-1">
          {/* Command Menu (Left side inside textarea) */}
          {!isLoading && (
            <div className="absolute left-2 bottom-2 z-10">
              <CommandMenu disabled={isLoading} />
            </div>
          )}

          <Textarea
            value={userQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={`Escribe tu consulta sobre ${company}...`}
            disabled={isLoading}
            rows={2}
            className="resize-none pr-28 pl-12"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                currentMainActionRef.current();
              }
            }}
          />
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

        {/* Cancel Button */}
        {isLoading && (
          <Button onClick={onCancel} variant="destructive" size="sm">
            ⏹️ Detener
          </Button>
        )}
      </div>
    </div>
    </CommandProvider>
  );
};
