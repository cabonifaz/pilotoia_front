import { useRef, useCallback, useState, useEffect } from "react";

/**
 * PCM Audio Player Hook for TTS streaming
 *
 * - 24kHz
 * - 16-bit signed PCM (little-endian)
 * - Mono
 * - Proper scheduling
 * - Byte-aligned decoding (NO static / NO chirrido)
 */

const SAMPLE_RATE = 24000;
const MIN_CHUNKS_BEFORE_PLAY = 3;

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

  // Queue of decoded PCM samples
  const samplesQueueRef = useRef<Float32Array[]>([]);

  // 🔥 Pending byte for PCM alignment
  const pendingBytesRef = useRef<Uint8Array | null>(null);

  // Playback control
  const isPlaybackStartedRef = useRef(false);
  const playheadTimeRef = useRef(0);
  const chunksReceivedRef = useRef(0);

  /**
   * Get or create AudioContext
   */
  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContext({ sampleRate: SAMPLE_RATE });
      setIsInitialized(true);
    }

    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  /**
   * Initialize AudioContext (must be called from user interaction)
   */
  const initialize = useCallback(() => {
    getAudioContext();
  }, [getAudioContext]);

  /**
   * Decode base64 PCM16 → Float32Array
   * 🔥 Handles byte alignment correctly
   */
  const decodePCM = useCallback((base64Data: string): Float32Array => {
    const binary = atob(base64Data);
    const incoming = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      incoming[i] = binary.charCodeAt(i);
    }

    // Concatenate pending byte if exists
    let bytes: Uint8Array;

    if (pendingBytesRef.current) {
      bytes = new Uint8Array(
        pendingBytesRef.current.length + incoming.length
      );
      bytes.set(pendingBytesRef.current, 0);
      bytes.set(incoming, pendingBytesRef.current.length);
      pendingBytesRef.current = null;
    } else {
      bytes = incoming;
    }

    // If odd number of bytes, keep last one for next chunk
    if (bytes.length % 2 !== 0) {
      pendingBytesRef.current = bytes.slice(bytes.length - 1);
      bytes = bytes.slice(0, bytes.length - 1);
    }

    const samples = new Float32Array(bytes.length / 2);
    const view = new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength
    );

    for (let i = 0; i < samples.length; i++) {
      const int16 = view.getInt16(i * 2, true);
      samples[i] = Math.max(-1, Math.min(1, int16 / 32768));
    }

    return samples;
  }, []);

  /**
   * Schedule queued samples for playback
   */
  const schedulePlayback = useCallback(() => {
    const audioContext = getAudioContext();

    if (playheadTimeRef.current < audioContext.currentTime) {
      playheadTimeRef.current = audioContext.currentTime;
    }

    while (samplesQueueRef.current.length > 0) {
      const samples = samplesQueueRef.current.shift()!;

      const buffer = audioContext.createBuffer(
        1,
        samples.length,
        SAMPLE_RATE
      );

      buffer.getChannelData(0).set(samples);

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);

      source.start(playheadTimeRef.current);
      playheadTimeRef.current += buffer.duration;

      source.onended = () => {
        if (
          samplesQueueRef.current.length === 0 &&
          playheadTimeRef.current <= audioContext.currentTime + 0.01
        ) {
          setIsPlaying(false);
          isPlaybackStartedRef.current = false;
        }
      };
    }

    setIsPlaying(true);
  }, [getAudioContext]);

  /**
   * Add a base64 PCM chunk
   */
  const addAudioChunk = useCallback(
    (base64Chunk: string) => {
      if (!base64Chunk) return;

      try {
        getAudioContext();

        const samples = decodePCM(base64Chunk);
        if (samples.length === 0) return;

        samplesQueueRef.current.push(samples);
        chunksReceivedRef.current++;

        if (
          !isPlaybackStartedRef.current &&
          chunksReceivedRef.current >= MIN_CHUNKS_BEFORE_PLAY
        ) {
          isPlaybackStartedRef.current = true;
          playheadTimeRef.current = audioContextRef.current!.currentTime;
          schedulePlayback();
        } else if (isPlaybackStartedRef.current) {
          schedulePlayback();
        }
      } catch (err) {
        console.error("[AudioPlayer] Error adding audio chunk:", err);
      }
    },
    [decodePCM, getAudioContext, schedulePlayback]
  );

  /**
   * Stop playback immediately
   */
  const stop = useCallback(() => {
    samplesQueueRef.current = [];
    pendingBytesRef.current = null;
    chunksReceivedRef.current = 0;
    playheadTimeRef.current = 0;
    isPlaybackStartedRef.current = false;
    setIsPlaying(false);
  }, []);

  /**
   * Reset player completely
   */
  const reset = useCallback(() => {
    stop();

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsInitialized(false);
  }, [stop]);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return {
    isPlaying,
    isInitialized,
    initialize,
    addAudioChunk,
    stop,
    reset,
  };
};
