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
      variant="ghost"
      size="icon"
      className={cn(
        "absolute right-0.5 bottom-0.5 rounded-full hover:bg-transparent"
      )}
      title={isRecording ? "Detener grabación" : "Grabar audio"}
    >
      {isConnecting ? (
        <Loader2 className={cn("w-4 h-4 animate-spin", isRecording && "text-red-500")} />
      ) : isRecording ? (
        <Square className={cn("w-4 h-4 text-red-500", isRecording && "animate-pulse")} />
      ) : (
        <Mic className="w-4 h-4 text-slate-500" />
      )}
    </Button>
  );
};
