import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

interface VoiceRecordButtonProps {
  isRecording: boolean;
  isConnecting: boolean;
  isDisabled?: boolean;
  onClick: () => void;
}

export const VoiceRecordButton = ({
  isRecording,
  isConnecting,
  isDisabled = false,
  onClick
}: VoiceRecordButtonProps) => {
  const recordMode = (import.meta.env.VITE_RECORD_MODE || 'click') as 'click' | 'hold';
  const isHoldModeRef = useRef(false);

  const handleMouseDown = () => {
    if (recordMode === 'hold' && !isRecording) {
      isHoldModeRef.current = true;
      onClick(); // Start recording
    }
  };

  const handleMouseUp = () => {
    if (recordMode === 'hold' && isHoldModeRef.current && isRecording) {
      isHoldModeRef.current = false;
      onClick(); // Stop recording
    }
  };

  const handleTouchStart = () => {
    if (recordMode === 'hold' && !isRecording) {
      isHoldModeRef.current = true;
      onClick(); // Start recording
    }
  };

  const handleTouchEnd = () => {
    if (recordMode === 'hold' && isHoldModeRef.current && isRecording) {
      isHoldModeRef.current = false;
      onClick(); // Stop recording
    }
  };

  const handleClick = () => {
    if (recordMode === 'click') {
      onClick();
    }
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // Stop if mouse leaves while holding
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={isDisabled || isConnecting}
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
