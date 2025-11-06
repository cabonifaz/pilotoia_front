import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

interface TranscriptionContextType {
  // Configuration
  transcribeProvider: string;

  // Voice recording (AWS)
  isRecording: boolean;
  isConnecting: boolean;
  onMicrophoneClick: () => void;

  // File transcription (OpenAI)
  isFileRecording: boolean;
  isFileTranscribing: boolean;
  onPrepareRecording: () => void;
  onCancelPrepareRecording: () => void;
  onStartRecording: () => void | Promise<void>;
  onStopRecording: () => void;
}

const TranscriptionContext = createContext<TranscriptionContextType | undefined>(undefined);

interface TranscriptionProviderProps {
  children: ReactNode;

  // Configuration
  transcribeProvider: string;

  // Voice recording (AWS)
  isRecording: boolean;
  isConnecting: boolean;
  onMicrophoneClick: () => void;

  // File transcription (OpenAI)
  isFileRecording: boolean;
  isFileTranscribing: boolean;
  onPrepareRecording: () => void;
  onCancelPrepareRecording: () => void;
  onStartRecording: () => void | Promise<void>;
  onStopRecording: () => void;
}

export const TranscriptionProvider = ({
  children,
  transcribeProvider,
  isRecording,
  isConnecting,
  onMicrophoneClick,
  isFileRecording,
  isFileTranscribing,
  onPrepareRecording,
  onCancelPrepareRecording,
  onStartRecording,
  onStopRecording,
}: TranscriptionProviderProps) => {
  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<TranscriptionContextType>(
    () => ({
      transcribeProvider,
      isRecording,
      isConnecting,
      onMicrophoneClick,
      isFileRecording,
      isFileTranscribing,
      onPrepareRecording,
      onCancelPrepareRecording,
      onStartRecording,
      onStopRecording,
    }),
    [
      transcribeProvider,
      isRecording,
      isConnecting,
      onMicrophoneClick,
      isFileRecording,
      isFileTranscribing,
      onPrepareRecording,
      onCancelPrepareRecording,
      onStartRecording,
      onStopRecording,
    ]
  );

  return (
    <TranscriptionContext.Provider value={value}>
      {children}
    </TranscriptionContext.Provider>
  );
};

export const useTranscription = () => {
  const context = useContext(TranscriptionContext);
  if (!context) {
    throw new Error('useTranscription must be used within TranscriptionProvider');
  }
  return context;
};
