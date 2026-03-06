import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranscribe } from './useTranscribe';
import { useFileTranscribe } from './useFileTranscribe';
import { getDefaultLanguage } from '../constants/languages';

interface UseContinuousTranscriptionOptions {
  onTranscript: (text: string) => void;
}

export function useContinuousTranscription({ onTranscript }: UseContinuousTranscriptionOptions) {
  const transcribeProvider = import.meta.env.VITE_TRANSCRIBE_PROVIDER as string;

  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    getDefaultLanguage(transcribeProvider === 'aws' ? 'aws' : 'openai'),
  );
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [isContinuousFileMode, setIsContinuousFileMode] = useState(false);

  // Refs so callbacks always see current values without re-subscribing
  const isContinuousModeRef = useRef(false);
  const isContinuousFileModeRef = useRef(false);
  const isProcessingContinuousRef = useRef(false);
  const isProcessingContinuousFileRef = useRef(false);
  const selectedLanguageRef = useRef(selectedLanguage);
  const submitActionRef = useRef<(() => void) | null>(null);

  // Recording function refs (kept in sync via effects below)
  const stopRecordingRef = useRef<(() => void) | null>(null);
  const startRecordingRef = useRef<((config?: any) => Promise<void>) | null>(null);
  const prepareRecordingRef = useRef<(() => void) | null>(null);
  const stopFileRecordingRef = useRef<(() => void) | null>(null);
  const startFileRecordingRef = useRef<((lang: string) => Promise<void>) | null>(null);
  const prepareFileRecordingRef = useRef<(() => void) | null>(null);

  /* ---- AWS streaming transcription ---- */
  const {
    isRecording,
    isConnecting,
    isPaused: isAwsPaused,
    isSpeaking: isAwsSpeaking,
    mediaStream: awsMediaStream,
    transcript,
    partialTranscript,
    prepareRecording,
    startRecording,
    stopRecording,
    pauseRecording: pauseAwsRecording,
    resumeRecording: resumeAwsRecording,
    clearTranscript,
  } = useTranscribe({
    onFinalTranscript: (finalTranscript) => {
      if (isProcessingContinuousRef.current) return;
      if (isContinuousModeRef.current && finalTranscript.trim() && submitActionRef.current) {
        isProcessingContinuousRef.current = true;
        stopRecordingRef.current?.();
        setTimeout(() => { submitActionRef.current?.(); }, 50);
      }
    },
  });

  /* ---- OpenAI file transcription ---- */
  const {
    isRecording: isFileRecording,
    isSpeaking: isFileSpeaking,
    isTranscribing: isFileTranscribing,
    isPaused: isFilePaused,
    mediaStream: fileMediaStream,
    transcriptionResult: fileTranscriptionResult,
    prepareRecording: prepareFileRecording,
    startRecording: startFileRecording,
    stopRecording: stopFileRecording,
    pauseRecording: pauseFileRecording,
    resumeRecording: resumeFileRecording,
  } = useFileTranscribe({
    onTranscriptionComplete: (result) => {
      if (isProcessingContinuousFileRef.current) return;
      if (isContinuousFileModeRef.current) {
        if (!result.trim()) {
          startFileRecordingRef.current?.(selectedLanguageRef.current);
          return;
        }
        if (submitActionRef.current) {
          isProcessingContinuousFileRef.current = true;
          setTimeout(() => { submitActionRef.current?.(); }, 50);
        }
      }
    },
  });

  /* ---- Sync transcripts to parent ---- */
  useEffect(() => {
    const current = transcript || partialTranscript;
    if (current) onTranscript(current);
  }, [transcript, partialTranscript]);

  useEffect(() => {
    if (fileTranscriptionResult?.transcript) {
      onTranscript(fileTranscriptionResult.transcript);
    }
  }, [fileTranscriptionResult]);

  /* ---- Keep refs in sync ---- */
  useEffect(() => { selectedLanguageRef.current = selectedLanguage; }, [selectedLanguage]);
  useEffect(() => { stopRecordingRef.current = stopRecording; }, [stopRecording]);
  useEffect(() => { startRecordingRef.current = startRecording; }, [startRecording]);
  useEffect(() => { prepareRecordingRef.current = prepareRecording; }, [prepareRecording]);
  useEffect(() => { stopFileRecordingRef.current = stopFileRecording; }, [stopFileRecording]);
  useEffect(() => { startFileRecordingRef.current = startFileRecording; }, [startFileRecording]);
  useEffect(() => { prepareFileRecordingRef.current = prepareFileRecording; }, [prepareFileRecording]);

  /* ---- Handlers ---- */
  const onMicrophoneClick = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
      clearTranscript();
      await startRecording({ language_code: selectedLanguage as any });
    }
  }, [isRecording, stopRecording, clearTranscript, startRecording, selectedLanguage]);

  const onStartRecording = useCallback(async () => {
    await startFileRecording(selectedLanguage);
  }, [startFileRecording, selectedLanguage]);

  const onContinuousVoiceClick = useCallback(async () => {
    if (isRecording && isContinuousMode) {
      stopRecording();
      setIsContinuousMode(false);
      isContinuousModeRef.current = false;
      isProcessingContinuousRef.current = false;
    } else {
      clearTranscript();
      setIsContinuousMode(true);
      isContinuousModeRef.current = true;
      isProcessingContinuousRef.current = false;
      await startRecording({ language_code: selectedLanguage as any, continuous: true });
    }
  }, [isRecording, isContinuousMode, stopRecording, clearTranscript, startRecording, selectedLanguage]);

  const onContinuousFileClick = useCallback(async () => {
    if (isFileRecording && isContinuousFileMode) {
      stopFileRecording();
      setIsContinuousFileMode(false);
      isContinuousFileModeRef.current = false;
      isProcessingContinuousFileRef.current = false;
    } else {
      setIsContinuousFileMode(true);
      isContinuousFileModeRef.current = true;
      isProcessingContinuousFileRef.current = false;
      await startFileRecording(selectedLanguage);
    }
  }, [isFileRecording, isContinuousFileMode, stopFileRecording, startFileRecording, selectedLanguage]);

  const onMuteToggle = useCallback(() => {
    if (isContinuousFileMode) {
      isFilePaused ? resumeFileRecording() : pauseFileRecording();
    }
    if (isContinuousMode) {
      isAwsPaused ? resumeAwsRecording() : pauseAwsRecording();
    }
  }, [
    isContinuousFileMode, isFilePaused, pauseFileRecording, resumeFileRecording,
    isContinuousMode, isAwsPaused, pauseAwsRecording, resumeAwsRecording,
  ]);

  /* ---- Continuous mode submit integration ---- */

  /** Register the current submit callback so continuous mode can trigger it. */
  const setSubmitCallback = useCallback((fn: () => void) => {
    submitActionRef.current = fn;
  }, []);

  /** Call before searchVectorial to pre-warm microphone permissions. */
  const prepareBeforeSubmit = useCallback(() => {
    if (isProcessingContinuousRef.current && isContinuousModeRef.current) {
      prepareRecordingRef.current?.();
    }
    if (isProcessingContinuousFileRef.current && isContinuousFileModeRef.current) {
      prepareFileRecordingRef.current?.();
    }
  }, []);

  /** Returns an onComplete callback that restarts recording after submit, or undefined. */
  const buildOnComplete = useCallback((): (() => void) | undefined => {
    const restartAws = isProcessingContinuousRef.current && isContinuousModeRef.current;
    const restartFile = isProcessingContinuousFileRef.current && isContinuousFileModeRef.current;
    if (!restartAws && !restartFile) return undefined;

    return () => {
      if (restartAws) {
        setTimeout(async () => {
          isProcessingContinuousRef.current = false;
          if (isContinuousModeRef.current) {
            await startRecordingRef.current?.({
              language_code: selectedLanguageRef.current,
              continuous: true,
            });
          }
        }, 100);
      }
      if (restartFile) {
        setTimeout(async () => {
          isProcessingContinuousFileRef.current = false;
          if (isContinuousFileModeRef.current) {
            await startFileRecordingRef.current?.(selectedLanguageRef.current);
          }
        }, 100);
      }
    };
  }, []);

  return {
    transcribeProvider,
    selectedLanguage,
    setSelectedLanguage,

    // AWS state
    isRecording,
    isConnecting,
    isContinuousMode,
    isAwsSpeaking,
    awsMediaStream,

    // OpenAI state
    isFileRecording,
    isFileSpeaking,
    isFileTranscribing,
    isContinuousFileMode,
    fileMediaStream,

    // Unified
    isMuted: transcribeProvider === 'aws' ? isAwsPaused : isFilePaused,

    // Handlers for TranscriptionProvider
    onMicrophoneClick,
    onContinuousVoiceClick,
    onPrepareRecording: prepareFileRecording,
    onStartRecording,
    onStopRecording: stopFileRecording,
    onContinuousFileClick,
    onMuteToggle,

    // Submit integration
    setSubmitCallback,
    prepareBeforeSubmit,
    buildOnComplete,
  };
}
