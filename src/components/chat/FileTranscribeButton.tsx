import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils';

interface FileTranscribeButtonProps {
  isRecording: boolean;
  isTranscribing: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

export const FileTranscribeButton = ({
  isRecording,
  isTranscribing,
  isDisabled = false,
  onClick,
}: FileTranscribeButtonProps) => {
  // Always use click mode: press once to start, press again to stop (or auto-stop on silence)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Space from triggering the button, but let Enter propagate
    if (e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    // Prevent Space from triggering the button, but let Enter propagate
    if (e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <Button
      type="button"
      tabIndex={-1}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      disabled={isDisabled || isTranscribing}
      variant="ghost"
      size="icon"
      className="rounded-full hover:bg-transparent"
      title={
        isTranscribing
          ? "Transcribiendo archivo..."
          : isRecording
          ? "Detener grabación"
          : "Grabar audio"
      }
    >
      {isTranscribing ? (
        <Loader2 className={cn("w-4 h-4 animate-spin", isRecording && "text-destructive")} />
      ) : isRecording ? (
        <Square className={cn("w-4 h-4 text-destructive", isRecording && "animate-pulse")} />
      ) : (
        <Mic className="w-4 h-4 text-primary" />
      )}
    </Button>
  );
};
