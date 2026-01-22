import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * Voice Activity Detection (VAD) Hook using Silero VAD
 *
 * This hook provides always-on microphone listening with ML-based speech detection.
 * It can detect when a user starts/stops speaking and trigger callbacks.
 *
 * Key features:
 * - Uses Silero VAD model for accurate human speech detection
 * - Distinguishes speech from background noise and TTS audio
 * - Low latency detection (~96ms frames)
 * - Configurable thresholds
 */

interface VADConfig {
  /** Probability threshold for speech detection (0-1, default 0.5) */
  positiveSpeechThreshold?: number;
  /** Probability threshold for silence detection (0-1, default 0.35) */
  negativeSpeechThreshold?: number;
  /** Number of speech frames before triggering onSpeechStart (default 6) */
  redemptionFrames?: number;
  /** Minimum speech duration in ms before callback fires (default 250) */
  minSpeechFrames?: number;
  /** Pre-speech padding in ms (default 300) */
  preSpeechPadFrames?: number;
}

interface UseVADReturn {
  /** Whether VAD is currently active and listening */
  isListening: boolean;
  /** Whether speech is currently detected */
  isSpeaking: boolean;
  /** Whether the VAD model is loaded and ready */
  isLoaded: boolean;
  /** Error message if VAD fails to initialize */
  error: string | null;
  /** Start listening for voice activity */
  start: () => Promise<void>;
  /** Stop listening */
  stop: () => void;
  /** Pause VAD without releasing microphone */
  pause: () => void;
  /** Resume VAD after pause */
  resume: () => void;
}

interface UseVADProps {
  /** Callback when speech starts */
  onSpeechStart?: () => void;
  /** Callback when speech ends, receives audio data */
  onSpeechEnd?: (audio: Float32Array) => void;
  /** Callback for VAD frame events (for debugging) */
  onFrameProcessed?: (probabilities: { isSpeech: number; notSpeech: number }) => void;
  /** VAD configuration */
  config?: VADConfig;
  /** Whether to start automatically when component mounts */
  autoStart?: boolean;
}

export const useVAD = ({
  onSpeechStart,
  onSpeechEnd,
  onFrameProcessed,
  config = {},
  autoStart = false,
}: UseVADProps = {}): UseVADReturn => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for VAD instance and stream
  const vadRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isPausedRef = useRef(false);

  // Callbacks refs to avoid stale closures
  const onSpeechStartRef = useRef(onSpeechStart);
  const onSpeechEndRef = useRef(onSpeechEnd);
  const onFrameProcessedRef = useRef(onFrameProcessed);

  // Keep refs updated
  useEffect(() => {
    onSpeechStartRef.current = onSpeechStart;
    onSpeechEndRef.current = onSpeechEnd;
    onFrameProcessedRef.current = onFrameProcessed;
  }, [onSpeechStart, onSpeechEnd, onFrameProcessed]);

  /**
   * Initialize and start VAD
   */
  const start = useCallback(async () => {
    if (isListening) {
      console.warn('[VAD] Already listening');
      return;
    }

    try {
      setError(null);

      // Dynamically import vad-web to avoid SSR issues
      const { MicVAD } = await import('@ricky0123/vad-web');

      // Request microphone with AEC enabled
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Create VAD instance with configuration
      const vad = await MicVAD.new({
        stream,
        positiveSpeechThreshold: config.positiveSpeechThreshold ?? 0.5,
        negativeSpeechThreshold: config.negativeSpeechThreshold ?? 0.35,
        redemptionFrames: config.redemptionFrames ?? 6,
        minSpeechFrames: config.minSpeechFrames ?? 4,
        preSpeechPadFrames: config.preSpeechPadFrames ?? 5,
        onSpeechStart: () => {
          if (isPausedRef.current) return;
          console.log('[VAD] Speech started');
          setIsSpeaking(true);
          onSpeechStartRef.current?.();
        },
        onSpeechEnd: (audio: Float32Array) => {
          if (isPausedRef.current) return;
          console.log('[VAD] Speech ended');
          setIsSpeaking(false);
          onSpeechEndRef.current?.(audio);
        },
        onFrameProcessed: (probabilities: { isSpeech: number; notSpeech: number }) => {
          if (isPausedRef.current) return;
          onFrameProcessedRef.current?.(probabilities);
        },
      });

      vadRef.current = vad;
      vad.start();

      setIsListening(true);
      setIsLoaded(true);
      console.log('[VAD] Started successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize VAD';
      console.error('[VAD] Error starting:', errorMessage);
      setError(errorMessage);

      // Cleanup on error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  }, [isListening, config]);

  /**
   * Stop VAD and release resources
   */
  const stop = useCallback(() => {
    console.log('[VAD] Stopping...');

    if (vadRef.current) {
      vadRef.current.pause();
      vadRef.current.destroy();
      vadRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsListening(false);
    setIsSpeaking(false);
    isPausedRef.current = false;
  }, []);

  /**
   * Pause VAD without releasing microphone
   */
  const pause = useCallback(() => {
    if (vadRef.current) {
      vadRef.current.pause();
      isPausedRef.current = true;
      console.log('[VAD] Paused');
    }
  }, []);

  /**
   * Resume VAD after pause
   */
  const resume = useCallback(() => {
    if (vadRef.current) {
      vadRef.current.start();
      isPausedRef.current = false;
      console.log('[VAD] Resumed');
    }
  }, []);

  // Auto-start if configured
  useEffect(() => {
    if (autoStart) {
      start();
    }
  }, [autoStart]); // Intentionally omit 'start' to prevent re-triggering

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isListening,
    isSpeaking,
    isLoaded,
    error,
    start,
    stop,
    pause,
    resume,
  };
};
