import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

interface TranscriptionContextType {
  // Configuration
  transcribeProvider: string;
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;

  // Voice recording (AWS)
  isRecording: boolean;
  isConnecting: boolean;
  onMicrophoneClick: () => void;

  // File transcription (OpenAI)
  isFileRecording: boolean;
  isFileTranscribing: boolean;
  onStartRecording: () => void | Promise<void>;
  onStopRecording: () => void;

  // Continuous voice mode - AWS (hands-free)
  isContinuousRecording: boolean;
  isContinuousConnecting: boolean;
  onContinuousVoiceClick: () => void;

  // Continuous file mode - OpenAI (hands-free)
  isContinuousFileRecording: boolean;
  isContinuousFileTranscribing: boolean;
  onContinuousFileClick: () => void;
}

const TranscriptionContext = createContext<TranscriptionContextType | undefined>(undefined);

interface TranscriptionProviderProps {
  children: ReactNode;

  // Configuration
  transcribeProvider: string;
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;

  // Voice recording (AWS)
  isRecording: boolean;
  isConnecting: boolean;
  onMicrophoneClick: () => void;

  // File transcription (OpenAI)
  isFileRecording: boolean;
  isFileTranscribing: boolean;
  onStartRecording: () => void | Promise<void>;
  onStopRecording: () => void;

  // Continuous voice mode - AWS (hands-free)
  isContinuousRecording: boolean;
  isContinuousConnecting: boolean;
  onContinuousVoiceClick: () => void;

  // Continuous file mode - OpenAI (hands-free)
  isContinuousFileRecording: boolean;
  isContinuousFileTranscribing: boolean;
  onContinuousFileClick: () => void;
}

export const TranscriptionProvider = ({
  children,
  transcribeProvider,
  selectedLanguage,
  setSelectedLanguage,
  isRecording,
  isConnecting,
  onMicrophoneClick,
  isFileRecording,
  isFileTranscribing,
  onStartRecording,
  onStopRecording,
  isContinuousRecording,
  isContinuousConnecting,
  onContinuousVoiceClick,
  isContinuousFileRecording,
  isContinuousFileTranscribing,
  onContinuousFileClick,
}: TranscriptionProviderProps) => {
  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<TranscriptionContextType>(
    () => ({
      transcribeProvider,
      selectedLanguage,
      setSelectedLanguage,
      isRecording,
      isConnecting,
      onMicrophoneClick,
      isFileRecording,
      isFileTranscribing,
      onStartRecording,
      onStopRecording,
      isContinuousRecording,
      isContinuousConnecting,
      onContinuousVoiceClick,
      isContinuousFileRecording,
      isContinuousFileTranscribing,
      onContinuousFileClick,
    }),
    [
      transcribeProvider,
      selectedLanguage,
      setSelectedLanguage,
      isRecording,
      isConnecting,
      onMicrophoneClick,
      isFileRecording,
      isFileTranscribing,
      onStartRecording,
      onStopRecording,
      isContinuousRecording,
      isContinuousConnecting,
      onContinuousVoiceClick,
      isContinuousFileRecording,
      isContinuousFileTranscribing,
      onContinuousFileClick,
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
