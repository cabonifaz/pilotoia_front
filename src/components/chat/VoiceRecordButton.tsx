import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/shadcn/button';
import { cn } from '@/lib/utils';

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
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={isDisabled || isConnecting}
      variant={isRecording ? "destructive" : "default"}
      size="icon"
      className={cn(
        "absolute right-2 bottom-2 rounded-full",
        isRecording && "animate-pulse"
      )}
      title={isRecording ? "Detener grabación" : "Grabar audio"}
    >
      {isConnecting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isRecording ? (
        <Square className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
};
