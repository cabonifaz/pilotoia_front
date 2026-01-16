import { useRef, useCallback, useState } from "react";

/**
 * PCM Audio Player Hook for TTS streaming
 *
 * Handles base64-encoded PCM audio chunks from OpenAI TTS:
 * - 24kHz sample rate
 * - 16-bit signed integers (little-endian)
 * - Mono channel
 */

const SAMPLE_RATE = 24000;

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  isInitialized: boolean;
  initialize: () => void;
  addAudioChunk: (base64Chunk: string) => void;
  stop: () => void;
  reset: () => void;
}

export const useAudioPlayer = (): UseAudioPlayerReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isProcessingRef = useRef(false);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  /**
   * Initialize or get the AudioContext
   */
  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
      setIsInitialized(true);
    }

    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  /**
   * Initialize AudioContext proactively (call on user interaction)
   */
  const initialize = useCallback(() => {
    getAudioContext();
  }, [getAudioContext]);

  /**
   * Decode base64 PCM to Float32Array
   */
  const decodePCM = useCallback((base64Data: string): Float32Array => {
    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Convert 16-bit PCM to Float32
    const dataView = new DataView(bytes.buffer);
    const numSamples = bytes.length / 2; // 16-bit = 2 bytes per sample
    const floatData = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      // Read 16-bit signed integer (little-endian)
      const int16 = dataView.getInt16(i * 2, true);
      // Normalize to [-1, 1]
      floatData[i] = int16 / 32768;
    }

    return floatData;
  }, []);

  /**
   * Create AudioBuffer from Float32Array
   */
  const createAudioBuffer = useCallback(
    (floatData: Float32Array): AudioBuffer => {
      const audioContext = getAudioContext();
      const audioBuffer = audioContext.createBuffer(
        1, // mono
        floatData.length,
        SAMPLE_RATE
      );
      audioBuffer.getChannelData(0).set(floatData);
      return audioBuffer;
    },
    [getAudioContext]
  );

  /**
   * Process and play queued audio buffers
   */
  const processQueue = useCallback(() => {
    if (isProcessingRef.current) return;
    if (audioQueueRef.current.length === 0) {
      setIsPlaying(false);
      return;
    }

    isProcessingRef.current = true;
    const audioContext = getAudioContext();

    while (audioQueueRef.current.length > 0) {
      const buffer = audioQueueRef.current.shift()!;
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);

      // Schedule playback
      const startTime = Math.max(audioContext.currentTime, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + buffer.duration;

      // Track active sources for cleanup
      activeSourcesRef.current.add(source);
      source.onended = () => {
        activeSourcesRef.current.delete(source);
        if (activeSourcesRef.current.size === 0 && audioQueueRef.current.length === 0) {
          setIsPlaying(false);
        }
      };
    }

    isProcessingRef.current = false;
  }, [getAudioContext]);

  /**
   * Add a base64-encoded PCM audio chunk to the queue
   */
  const addAudioChunk = useCallback(
    (base64Chunk: string) => {
      if (!base64Chunk) return;

      try {
        const floatData = decodePCM(base64Chunk);
        const audioBuffer = createAudioBuffer(floatData);
        audioQueueRef.current.push(audioBuffer);
        setIsPlaying(true);
        processQueue();
      } catch (error) {
        console.error("[AudioPlayer] Error processing audio chunk:", error);
      }
    },
    [decodePCM, createAudioBuffer, processQueue]
  );

  /**
   * Stop all audio playback
   */
  const stop = useCallback(() => {
    // Stop all active sources
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop();
      } catch {
        // Ignore errors if already stopped
      }
    });
    activeSourcesRef.current.clear();

    // Clear the queue
    audioQueueRef.current = [];
    nextStartTimeRef.current = 0;
    isProcessingRef.current = false;
    setIsPlaying(false);
  }, []);

  /**
   * Reset the audio player (stop and close context)
   */
  const reset = useCallback(() => {
    stop();

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsInitialized(false);
  }, [stop]);

  return {
    isPlaying,
    isInitialized,
    initialize,
    addAudioChunk,
    stop,
    reset,
  };
};
