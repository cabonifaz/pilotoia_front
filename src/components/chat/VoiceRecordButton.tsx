import { Mic, MicOff, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils';

interface VoiceRecordButtonProps {
  isRecording: boolean;
  isConnecting: boolean;
  isDisabled?: boolean;
  onClick: () => void;
  // Mute mode props (when continuous recording is active)
  isMuteMode?: boolean;
  isMuted?: boolean;
  onMuteToggle?: () => void;
}

export const VoiceRecordButton = ({
  isRecording,
  isConnecting,
  isDisabled = false,
  onClick,
  isMuteMode = false,
  isMuted = false,
  onMuteToggle,
}: VoiceRecordButtonProps) => {
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

  // Mute mode: show simpler mute/unmute button
  if (isMuteMode) {
    return (
      <Button
        type="button"
        tabIndex={-1}
        onClick={onMuteToggle}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        disabled={isDisabled}
        variant="ghost"
        size="icon"
        className="rounded-full hover:bg-transparent"
        title={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
      >
        {isMuted ? (
          <MicOff className="w-4 h-4 text-destructive" />
        ) : (
          <Mic className="w-4 h-4 text-primary" />
        )}
      </Button>
    );
  }

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
      className="rounded-full hover:bg-transparent"
      title={isRecording ? "Detener grabación" : "Grabar audio"}
    >
      {isConnecting ? (
        <Loader2 className={cn("w-4 h-4 animate-spin", isRecording && "text-destructive")} />
      ) : isRecording ? (
        <Square className={cn("w-4 h-4 text-destructive", isRecording && "animate-pulse")} />
      ) : (
        <Mic className="w-4 h-4 text-primary" />
      )}
    </Button>
  );
};
