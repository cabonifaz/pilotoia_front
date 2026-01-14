import { useMemo } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils';

interface OpenAIVoiceRecordButtonProps {
  isRecording: boolean;
  isConnecting: boolean;
  isDisabled?: boolean;
  onClick?: () => void; // Optional for 'click' mode
  onStart: () => void; // For 'hold' mode
  onStop: () => void;  // For 'hold' mode
}

/**
 * Voice Record Button for OpenAI Realtime API transcription
 *
 * Features:
 * - Auto language detection (no language selection needed)
 * - PCM16 mono audio at 16kHz
 * - Streaming partial and final results
 * - Dual mode: Click (desktop) or Hold (mobile)
 */
export const OpenAIVoiceRecordButton = ({
  isRecording,
  isConnecting,
  isDisabled = false,
  onClick,
  onStart,
  onStop,
}: OpenAIVoiceRecordButtonProps) => {
  // Detect device type based on window width and select recording mode (once, doesn't change during session)
  // Mobile (hold mode): width <= 768px
  // Web (click mode): width > 768px
  const recordMode = useMemo(() => {
    if (typeof window === 'undefined') return 'click' as const;
    return (window.innerWidth <= 768 ? 'hold' : 'click') as 'click' | 'hold';
  }, []);

  const handlePress = (e: React.MouseEvent | React.TouchEvent) => {
    if (recordMode === 'hold') {
      e.preventDefault();
      e.stopPropagation();
      onStart();
    }
  };

  const handleRelease = (e: React.MouseEvent | React.TouchEvent) => {
    if (recordMode === 'hold') {
      e.preventDefault();
      e.stopPropagation();
      onStop();
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    if (recordMode === 'click' && onClick) {
      onClick();
    } else if (recordMode === 'hold') {
      // In hold mode, prevent the click handler from doing anything
      e.preventDefault();
      e.stopPropagation();
    }
  };

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
      onClick={handleButtonClick}
      onMouseDown={handlePress as React.MouseEventHandler}
      onMouseUp={handleRelease as React.MouseEventHandler}
      onMouseLeave={handleRelease as React.MouseEventHandler} // Stop if mouse leaves while holding
      onTouchStart={handlePress as React.TouchEventHandler}
      onTouchEnd={handleRelease as React.TouchEventHandler}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      disabled={isDisabled || (isConnecting && !isRecording)}
      variant="ghost"
      size="icon"
      className={cn(
        "rounded-full hover:bg-transparent",
        recordMode === 'hold' && isRecording && "active:scale-95"
      )}
      title={
        recordMode === 'hold'
          ? (isRecording ? "Suelta para detener" : "Presiona y mantén para grabar (OpenAI)")
          : (isRecording ? "Detener grabación (OpenAI)" : "Grabar audio con OpenAI")
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
