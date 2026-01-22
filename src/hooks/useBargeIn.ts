import { useCallback, useRef, useEffect, useState } from 'react';
import { useVAD } from './useVAD';

/**
 * Barge-In Hook
 *
 * Provides ChatGPT-like voice interaction where:
 * - Microphone is always listening (when enabled)
 * - When user starts speaking, TTS automatically stops
 * - Uses Silero VAD for accurate speech detection
 * - Distinguishes user speech from TTS audio output
 *
 * Usage:
 * ```tsx
 * const {
 *   isBargeInEnabled,
 *   isListening,
 *   isSpeaking,
 *   enableBargeIn,
 *   disableBargeIn,
 * } = useBargeIn({
 *   onBargeIn: () => {
 *     // Stop TTS playback
 *     audioPlayer.stop();
 *   },
 *   onSpeechEnd: (audio) => {
 *     // Optional: Start transcription with the captured audio
 *     transcribe(audio);
 *   },
 * });
 * ```
 */

interface UseBargeInConfig {
  /** Callback when user interrupts (barge-in detected) */
  onBargeIn?: () => void;
  /** Callback when speech ends, receives audio data */
  onSpeechEnd?: (audio: Float32Array) => void;
  /** Callback for each VAD frame (for debugging/visualization) */
  onVADFrame?: (probabilities: { isSpeech: number; notSpeech: number }) => void;
  /** Minimum speech duration in ms before triggering barge-in (default 150) */
  minSpeechDuration?: number;
  /** Whether to auto-start when enabled (default true) */
  autoStart?: boolean;
  /** Speech detection sensitivity (0-1, higher = more sensitive, default 0.5) */
  sensitivity?: number;
}

interface UseBargeInReturn {
  /** Whether barge-in feature is enabled */
  isBargeInEnabled: boolean;
  /** Whether VAD is currently listening */
  isListening: boolean;
  /** Whether user is currently speaking */
  isSpeaking: boolean;
  /** Whether VAD model is loaded */
  isVADLoaded: boolean;
  /** Error message if any */
  error: string | null;
  /** Enable barge-in feature (starts VAD) */
  enableBargeIn: () => Promise<void>;
  /** Disable barge-in feature (stops VAD) */
  disableBargeIn: () => void;
  /** Temporarily pause barge-in (e.g., during user recording) */
  pauseBargeIn: () => void;
  /** Resume barge-in after pause */
  resumeBargeIn: () => void;
}

export const useBargeIn = ({
  onBargeIn,
  onSpeechEnd,
  onVADFrame,
  minSpeechDuration = 150,
  autoStart = true,
  sensitivity = 0.5,
}: UseBargeInConfig = {}): UseBargeInReturn => {
  const [isBargeInEnabled, setIsBargeInEnabled] = useState(false);

  // Track speech start time to filter out very short sounds
  const speechStartTimeRef = useRef<number | null>(null);
  const hasTriggeredBargeInRef = useRef(false);

  // Refs for callbacks to avoid stale closures
  const onBargeInRef = useRef(onBargeIn);
  const onSpeechEndRef = useRef(onSpeechEnd);

  useEffect(() => {
    onBargeInRef.current = onBargeIn;
    onSpeechEndRef.current = onSpeechEnd;
  }, [onBargeIn, onSpeechEnd]);

  /**
   * Handle speech start from VAD
   */
  const handleSpeechStart = useCallback(() => {
    speechStartTimeRef.current = Date.now();
    hasTriggeredBargeInRef.current = false;
    console.log('[BargeIn] Speech detected, waiting for minimum duration...');
  }, []);

  /**
   * Handle speech end from VAD
   */
  const handleSpeechEnd = useCallback(
    (audio: Float32Array) => {
      const speechDuration = speechStartTimeRef.current
        ? Date.now() - speechStartTimeRef.current
        : 0;

      console.log(`[BargeIn] Speech ended, duration: ${speechDuration}ms`);

      // Only trigger if speech was long enough
      if (speechDuration >= minSpeechDuration) {
        // Trigger barge-in if not already triggered
        if (!hasTriggeredBargeInRef.current) {
          console.log('[BargeIn] Triggering barge-in callback');
          onBargeInRef.current?.();
          hasTriggeredBargeInRef.current = true;
        }

        // Call speech end callback
        onSpeechEndRef.current?.(audio);
      } else {
        console.log('[BargeIn] Speech too short, ignoring');
      }

      speechStartTimeRef.current = null;
    },
    [minSpeechDuration]
  );

  /**
   * Handle VAD frame for early barge-in detection
   */
  const handleFrameProcessed = useCallback(
    (probabilities: { isSpeech: number; notSpeech: number }) => {
      onVADFrame?.(probabilities);

      // Check if we should trigger early barge-in
      // (while still speaking, before speech ends)
      if (
        speechStartTimeRef.current &&
        !hasTriggeredBargeInRef.current &&
        probabilities.isSpeech > 0.8 // High confidence
      ) {
        const elapsed = Date.now() - speechStartTimeRef.current;
        if (elapsed >= minSpeechDuration) {
          console.log('[BargeIn] Early barge-in triggered');
          onBargeInRef.current?.();
          hasTriggeredBargeInRef.current = true;
        }
      }
    },
    [minSpeechDuration, onVADFrame]
  );

  // Initialize VAD with configuration
  const {
    isListening,
    isSpeaking,
    isLoaded: isVADLoaded,
    error,
    start: startVAD,
    stop: stopVAD,
    pause: pauseVAD,
    resume: resumeVAD,
  } = useVAD({
    onSpeechStart: handleSpeechStart,
    onSpeechEnd: handleSpeechEnd,
    onFrameProcessed: handleFrameProcessed,
    config: {
      // Adjust sensitivity based on config
      positiveSpeechThreshold: 1 - sensitivity * 0.5, // 0.5 at sensitivity=1, 0.75 at sensitivity=0.5
      negativeSpeechThreshold: 0.35,
      minSpeechFrames: Math.ceil(minSpeechDuration / 96), // Convert ms to frames (~96ms per frame)
      redemptionFrames: 6,
    },
    autoStart: false, // We control start/stop
  });

  /**
   * Enable barge-in feature
   */
  const enableBargeIn = useCallback(async () => {
    console.log('[BargeIn] Enabling...');
    setIsBargeInEnabled(true);

    if (autoStart) {
      await startVAD();
    }
  }, [autoStart, startVAD]);

  /**
   * Disable barge-in feature
   */
  const disableBargeIn = useCallback(() => {
    console.log('[BargeIn] Disabling...');
    setIsBargeInEnabled(false);
    stopVAD();
  }, [stopVAD]);

  /**
   * Temporarily pause barge-in
   */
  const pauseBargeIn = useCallback(() => {
    console.log('[BargeIn] Pausing...');
    pauseVAD();
  }, [pauseVAD]);

  /**
   * Resume barge-in after pause
   */
  const resumeBargeIn = useCallback(() => {
    console.log('[BargeIn] Resuming...');
    resumeVAD();
  }, [resumeVAD]);

  return {
    isBargeInEnabled,
    isListening,
    isSpeaking,
    isVADLoaded,
    error,
    enableBargeIn,
    disableBargeIn,
    pauseBargeIn,
    resumeBargeIn,
  };
};
