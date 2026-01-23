import { Radio, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils';

/**
 * Continuous Voice Button Component
 *
 * Similar to VoiceRecordButton but for continuous/hands-free mode:
 * - Uses Radio icon to indicate continuous listening
 * - Microphone stays open until manually stopped
 * - Auto-submits when transcription is finalized
 */

interface ContinuousVoiceButtonProps {
  isRecording: boolean;
  isConnecting: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

export const ContinuousVoiceButton = ({
  isRecording,
  isConnecting,
  isDisabled = false,
  onClick,
}: ContinuousVoiceButtonProps) => {
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
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      disabled={isDisabled || (isConnecting && !isRecording)}
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-full hover:bg-transparent",
        isRecording && "bg-destructive/10"
      )}
      title={isRecording ? "Detener modo continuo" : "Modo continuo (manos libres)"}
    >
      {isConnecting ? (
        <Loader2 className={cn("w-4 h-4 animate-spin", isRecording && "text-destructive")} />
      ) : isRecording ? (
        <Square className={cn("w-4 h-4 text-destructive", "animate-pulse")} />
      ) : (
        <Radio className="w-4 h-4 text-primary" />
      )}
    </Button>
  );
};
