import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils';
import { useRef, useEffect } from 'react';

interface FileTranscribeButtonProps {
  isRecording: boolean;
  isTranscribing: boolean;
  isDisabled?: boolean;
  onPrepareRecording: () => void;
  onCancelPrepareRecording: () => void;
  onStartRecording: () => void | Promise<void>;
  onStopRecording: () => void;
}

export const FileTranscribeButton = ({
  isRecording,
  isTranscribing,
  isDisabled = false,
  onPrepareRecording,
  onCancelPrepareRecording,
  onStartRecording,
  onStopRecording
}: FileTranscribeButtonProps) => {
  const mouseDownTimeRef = useRef<number>(0);
  const isPushToTalkRef = useRef<boolean>(false);
  const pushToTalkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const justStoppedPushToTalkRef = useRef<boolean>(false);

  const handleMouseDown = () => {
    if (isDisabled || isTranscribing) return;

    mouseDownTimeRef.current = Date.now();
    justStoppedPushToTalkRef.current = false; // Reset flag

    if (!isRecording) {
      // Immediately start preparing (request mic access in background)
      onPrepareRecording();

      // Wait to see if it's a hold (push-to-talk) or click (toggle)
      // If user holds for > 100ms, start push-to-talk mode
      pushToTalkTimeoutRef.current = setTimeout(() => {
        // User is holding - start push-to-talk mode
        isPushToTalkRef.current = true;
        onStartRecording();
      }, 100);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDisabled || isTranscribing) return;

    // Cancel push-to-talk timeout if not yet fired
    if (pushToTalkTimeoutRef.current) {
      clearTimeout(pushToTalkTimeoutRef.current);
      pushToTalkTimeoutRef.current = null;

      // User released before timeout - this will be toggle mode
      // DON'T cancel the prepared recording - we'll use it in the click handler!
    }

    // If was in push-to-talk mode, stop recording
    // Note: Don't check isRecording here - it's async and might not have updated yet
    if (isPushToTalkRef.current) {
      isPushToTalkRef.current = false;
      justStoppedPushToTalkRef.current = true; // Mark that we just stopped push-to-talk
      onStopRecording();
      // Prevent click event from firing
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const handleMouseLeave = () => {
    // Cancel push-to-talk timeout if user drags away
    if (pushToTalkTimeoutRef.current) {
      clearTimeout(pushToTalkTimeoutRef.current);
      pushToTalkTimeoutRef.current = null;

      // User dragged away - they abandoned the action, cancel prepared recording
      onCancelPrepareRecording();
    }

    // If in push-to-talk mode and user drags away, stop recording
    // Note: Don't check isRecording here - it's async and might not have updated yet
    if (isPushToTalkRef.current) {
      isPushToTalkRef.current = false;
      onStopRecording();
    }
  };

  const handleClick = () => {
    if (isDisabled || isTranscribing) return;

    // Ignore click if we just stopped push-to-talk mode
    // (this prevents the click event from starting a new recording)
    if (justStoppedPushToTalkRef.current) {
      justStoppedPushToTalkRef.current = false;
      return;
    }

    // Only handle click if we're NOT in push-to-talk mode
    if (!isPushToTalkRef.current) {
      // Toggle recording
      if (isRecording) {
        onStopRecording();
      } else {
        // Start recording for toggle mode
        // Note: stream was already prepared in mouseDown, so just start!
        onStartRecording();
      }
    }
  };

  // Touch support for mobile
  const handleTouchStart = () => {
    if (isDisabled || isTranscribing) return;

    mouseDownTimeRef.current = Date.now();

    // Same logic as mouse: wait to see if it's a hold or tap
    if (!isRecording) {
      // Immediately start preparing (request mic access in background)
      onPrepareRecording();

      pushToTalkTimeoutRef.current = setTimeout(() => {
        isPushToTalkRef.current = true;
        onStartRecording();
      }, 100);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isDisabled || isTranscribing) return;

    // Cancel push-to-talk timeout if not yet fired
    if (pushToTalkTimeoutRef.current) {
      clearTimeout(pushToTalkTimeoutRef.current);
      pushToTalkTimeoutRef.current = null;

      // User released before timeout - will be toggle mode
      // DON'T cancel the prepared recording - tap handler will use it!
    }

    // If was in push-to-talk mode, stop recording
    // Note: Don't check isRecording here - it's async and might not have updated yet
    if (isPushToTalkRef.current) {
      isPushToTalkRef.current = false;
      onStopRecording();
      e.preventDefault();
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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (pushToTalkTimeoutRef.current) {
        clearTimeout(pushToTalkTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Button
      type="button"
      tabIndex={-1}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      disabled={isDisabled || isTranscribing}
      variant="ghost"
      size="icon"
      className={cn(
        "absolute right-0.5 bottom-0.5 rounded-full hover:bg-transparent"
      )}
      title={
        isTranscribing
          ? "Transcribiendo archivo..."
          : isRecording
          ? "Haz clic para detener (o suelta si mantenías presionado)"
          : "Haz clic para grabar (o mantén presionado)"
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
