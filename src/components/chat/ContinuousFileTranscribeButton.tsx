import { Radio, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils';

interface ContinuousFileTranscribeButtonProps {
  isRecording: boolean;
  isTranscribing: boolean;
  isDisabled?: boolean;
  onMouseEnter?: () => void;
  onClick: () => void;
}

export const ContinuousFileTranscribeButton = ({
  isRecording,
  isTranscribing,
  isDisabled = false,
  onMouseEnter,
  onClick,
}: ContinuousFileTranscribeButtonProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Space from triggering the button
    if (e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    // Prevent Space from triggering the button
    if (e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <Button
      type="button"
      tabIndex={-1}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      disabled={isDisabled || isTranscribing}
      variant="ghost"
      size="icon"
      className="rounded-full hover:bg-transparent"
      title={
        isTranscribing
          ? "Transcribiendo..."
          : isRecording
          ? "Detener modo continuo"
          : "Modo continuo (manos libres)"
      }
    >
      {isTranscribing ? (
        <Loader2 className={cn("w-4 h-4 animate-spin", isRecording && "text-destructive")} />
      ) : isRecording ? (
        <Square className={cn("w-4 h-4 text-destructive", "animate-pulse")} />
      ) : (
        <Radio className="w-4 h-4 text-primary" />
      )}
    </Button>
  );
};
