import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils';

interface VoiceRecordButtonProps {
  isRecording: boolean;
  isConnecting: boolean;
  isDisabled?: boolean;
  onClick?: () => void; // Optional for 'click' mode
  onStart: () => void; // For 'hold' mode
  onStop: () => void;  // For 'hold' mode
}

export const VoiceRecordButton = ({
  isRecording,
  isConnecting,
  isDisabled = false,
  onClick,
  onStart,
  onStop,
}: VoiceRecordButtonProps) => {
  const recordMode = (import.meta.env.VITE_RECORD_MODE || 'click') as 'click' | 'hold';

  const handlePress = () => {
    if (recordMode === 'hold') {
      onStart();
    }
  };

  const handleRelease = () => {
    if (recordMode === 'hold') {
      onStop();
    }
  };

  const handleButtonClick = () => {
    if (recordMode === 'click' && onClick) {
      onClick();
    }
  };

  return (
    <Button
      type="button"
      onClick={handleButtonClick}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease} // Stop if mouse leaves while holding
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      disabled={isDisabled || (isConnecting && !isRecording)}
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-full hover:bg-transparent",
        recordMode === 'hold' && isRecording && "active:scale-95"
      )}
      title={
        recordMode === 'hold'
          ? (isRecording ? "Suelta para detener" : "Presiona y mantén para grabar")
          : (isRecording ? "Detener grabación" : "Grabar audio")
      }
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
