import { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeApi } from '../api/transcribeApi';
import type { TranscribeConfig, TranscriptResult } from '../types/transcribe';
import { toast } from './use-toast';

interface UseTranscribeOptions {
    /** Callback when final transcript is received (useful for auto-submit in continuous mode) */
    onFinalTranscript?: (transcript: string) => void;
}

interface UseTranscribeReturn {
    isRecording: boolean;
    isConnecting: boolean;
    isPaused: boolean;
    transcript: string;
    partialTranscript: string;
    prepareRecording: () => void;
    cancelPrepareRecording: () => Promise<void>;
    startRecording: (config?: Partial<TranscribeConfig>) => Promise<void>;
    stopRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    clearTranscript: () => void;
}

export const useTranscribe = (options: UseTranscribeOptions = {}): UseTranscribeReturn => {
    const { onFinalTranscript } = options;
    const onFinalTranscriptRef = useRef(onFinalTranscript);

    useEffect(() => {
        onFinalTranscriptRef.current = onFinalTranscript;
    }, [onFinalTranscript]);
    const [isRecording, setIsRecording] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [partialTranscript, setPartialTranscript] = useState('');
    const isPausedRef = useRef(false);

    // Always use click mode: press once to start, press again to stop (or auto-stop on silence)
    const recordMode = 'click' as const;

    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const detectionFrameIdRef = useRef<number | null>(null);
    const transcribeClientRef = useRef<ReturnType<typeof transcribeApi.startTranscription> | null>(null);
    const transcriptBufferRef = useRef<string[]>([]);
    const isStoppingRef = useRef<boolean>(false);
    const recordingStartTimeRef = useRef<number>(0);
    const isWaitingForCloseRef = useRef<boolean>(false);
    const pendingStreamRequestRef = useRef<Promise<MediaStream> | null>(null);
    const shouldStartRecordingRef = useRef<boolean>(false);

    /**
     * Cleanup audio resources
     */
    const cleanupAudioResources = useCallback(() => {
        // Clean up Web Audio API resources
        if (detectionFrameIdRef.current !== null) {
            cancelAnimationFrame(detectionFrameIdRef.current);
            detectionFrameIdRef.current = null;
        }

        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }

        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }

        if (audioContextRef.current) {
            // Close audio context if it's still running
            if (audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {
                    // Ignore errors closing audio context
                });
            }
            audioContextRef.current = null;
        }

        // Disconnect WebSocket
        if (transcribeClientRef.current) {
            transcribeClientRef.current.disconnect();
            transcribeClientRef.current = null;
        }

        setIsRecording(false);
        setIsConnecting(false);
        setIsPaused(false);
        isPausedRef.current = false;
        setPartialTranscript('');
        isStoppingRef.current = false;
        isWaitingForCloseRef.current = false;
        recordingStartTimeRef.current = 0;
        pendingStreamRequestRef.current = null;
        shouldStartRecordingRef.current = false;
    }, []);

    /**
     * Prepare recording by requesting microphone access early.
     * This is called to reduce latency when restarting recording in continuous mode.
     */
    const prepareRecording = useCallback(() => {
        // Don't prepare if already recording or connecting
        if (isRecording || isConnecting) {
            return;
        }

        // Don't create duplicate requests
        if (pendingStreamRequestRef.current) {
            return;
        }

        // Start requesting microphone access immediately
        pendingStreamRequestRef.current = navigator.mediaDevices.getUserMedia({
            audio: {
                channelCount: 1,
                sampleRate: 16000,
                echoCancellation: true,
                noiseSuppression: true
            }
        });
    }, [isRecording, isConnecting]);

    /**
     * Cancel prepared recording if user decides not to record
     */
    const cancelPrepareRecording = useCallback(async () => {
        shouldStartRecordingRef.current = false;

        // If there's a pending stream request, wait for it and clean up
        if (pendingStreamRequestRef.current) {
            try {
                const stream = await pendingStreamRequestRef.current;
                stream.getTracks().forEach(track => track.stop());
            } catch (error) {
                // Ignore errors (user might have denied permission)
            }
            pendingStreamRequestRef.current = null;
        }
    }, []);

    /**
     * Pause recording (stops sending audio but keeps connection alive)
     * Useful for continuous mode when processing a request
     */
    const pauseRecording = useCallback(() => {
        if (isRecording && !isPausedRef.current) {
            isPausedRef.current = true;
            setIsPaused(true);
        }
    }, [isRecording]);

    /**
     * Resume recording after pause
     */
    const resumeRecording = useCallback(() => {
        if (isRecording && isPausedRef.current) {
            isPausedRef.current = false;
            setIsPaused(false);
        }
    }, [isRecording]);

    /**
     * Start recording and transcription
     */
    const startRecording = useCallback(async (config: Partial<TranscribeConfig> = {}) => {
        try {
            setIsConnecting(true);

            // Get JWT token from sessionStorage
            const token = sessionStorage.getItem('jwt_token');
            if (!token) {
                toast({
                    title: "Error de autenticación",
                    description: "No se encontró el token de autenticación",
                    variant: "destructive"
                });
                setIsConnecting(false);
                return;
            }

            // Get default values from environment
            const defaultSampleRate = parseInt(import.meta.env.VITE_TRANSCRIBE_SAMPLE_RATE || '16000', 10);
            const defaultAudioEncoding = import.meta.env.VITE_TRANSCRIBE_AUDIO_ENCODING || 'ogg-opus';

            // Mark that we want to record
            shouldStartRecordingRef.current = true;

            // Use pending stream request if available, otherwise create new one
            let streamPromise = pendingStreamRequestRef.current;
            if (!streamPromise) {
                streamPromise = navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        sampleRate: config.sample_rate || defaultSampleRate,
                        echoCancellation: true,
                        noiseSuppression: true
                    }
                });
            }

            // Wait for stream to be ready
            const stream = await streamPromise;

            // Clear pending request
            pendingStreamRequestRef.current = null;

            // Check if we should still record (user might have cancelled)
            if (!shouldStartRecordingRef.current) {
                stream.getTracks().forEach(track => track.stop());
                setIsConnecting(false);
                return;
            }

            // Determine audio format based on what MediaRecorder supports
            let audioEncoding = defaultAudioEncoding;
            let audioSampleRate = defaultAudioEncoding === 'pcm' ? 16000 : 48000;

            if (MediaRecorder.isTypeSupported('audio/wav')) {
                audioEncoding = 'pcm'; // WAV is PCM
                audioSampleRate = 16000; // Standard for PCM
            }

            // Default configuration
            const defaultEnablePartialResults = import.meta.env.VITE_TRANSCRIBE_ENABLE_PARTIAL_RESULTS === 'true';
            const defaultShowSpeakerLabel = import.meta.env.VITE_TRANSCRIBE_SHOW_SPEAKER_LABEL === 'true';

            const transcribeConfig: TranscribeConfig = {
                language_code: config.language_code || 'es-ES',
                language_codes: config.language_codes || [config.language_code || 'es-ES'],
                sample_rate: config.sample_rate || audioSampleRate,
                media_encoding: config.media_encoding || audioEncoding,
                enable_partial_results: config.enable_partial_results ?? defaultEnablePartialResults,
                show_speaker_label: config.show_speaker_label ?? defaultShowSpeakerLabel,
                ...config
            };

            // Start WebSocket connection
            const client = transcribeApi.startTranscription(
                token,
                transcribeConfig,
                {
                    onOpen: async () => {
                        setIsConnecting(false);
                        setIsRecording(true);
                        recordingStartTimeRef.current = Date.now();

                        try {
                            // Capture raw PCM from microphone using Web Audio API with AudioWorklet
                            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

                            // Load AudioWorklet processor module
                            await audioContext.audioWorklet.addModule('/audio-processor.js');

                            const source = audioContext.createMediaStreamSource(stream);

                            // Create AudioWorklet node (modern replacement for ScriptProcessorNode)
                            const workletNode = new AudioWorkletNode(audioContext, 'pcm-audio-processor');

                        // Store refs for cleanup
                        audioContextRef.current = audioContext;
                        sourceRef.current = source;
                        workletNodeRef.current = workletNode;

                        // Connect source to worklet node
                        source.connect(workletNode);
                        workletNode.connect(audioContext.destination);

                        // Variables para tracking de silencio (only used in 'click' mode)
                        let silenceTimeoutId: NodeJS.Timeout | null = null;
                        let stopSignalSent = false;
                        const SILENCE_THRESHOLD = parseInt(import.meta.env.VITE_SILENCE_THRESHOLD || '3000', 10);
                        const SILENCE_LEVEL = parseInt(import.meta.env.VITE_SILENCE_LEVEL || '15', 10);

                        // Create analyser for silence detection (only used in 'click' mode)
                        const analyser = audioContext.createAnalyser();
                        analyser.fftSize = 2048;
                        source.connect(analyser);
                        analyserRef.current = analyser;

                        const dataArray = new Uint8Array(analyser.frequencyBinCount);

                        // Listen to messages from AudioWorklet (PCM audio data)
                        let audioChunkCount = 0;
                        workletNode.port.onmessage = (event) => {
                            if (!client.isConnected()) return;
                            // Skip sending audio when paused (for continuous mode processing)
                            if (isPausedRef.current) {
                                return;
                            }

                            if (event.data.type === 'audio') {
                                audioChunkCount++;

                                // Send raw PCM bytes as binary (including silence)
                                const blob = new Blob([event.data.data], { type: 'application/octet-stream' });
                                client.sendAudioChunk(blob);
                            }
                        };

                        // Only enable silence detection in 'click' mode and not in continuous mode
                        if (recordMode === 'click' && !config.continuous) {
                            const detectSilence = () => {
                                analyser.getByteFrequencyData(dataArray);
                                const sum = dataArray.reduce((a, b) => a + b, 0);
                                const average = sum / dataArray.length;

                                // If average volume is very low, consider it silence
                                if (average < SILENCE_LEVEL) {
                                    if (!silenceTimeoutId) {
                                        silenceTimeoutId = setTimeout(() => {
                                            if (!stopSignalSent) {
                                                stopSignalSent = true;
                                                // Send stop signal but keep worklet running briefly
                                                // to ensure server receives it
                                                client.sendStop();

                                                // Cleanup after a brief delay to ensure stop signal is sent
                                                setTimeout(() => {
                                                    workletNode.disconnect();
                                                    source.disconnect();
                                                }, 500);
                                            }
                                        }, SILENCE_THRESHOLD);
                                    }
                                } else {
                                    // Clear timeout if sound detected
                                    if (silenceTimeoutId && !stopSignalSent) {
                                        clearTimeout(silenceTimeoutId);
                                        silenceTimeoutId = null;
                                    }
                                }

                                detectionFrameIdRef.current = requestAnimationFrame(detectSilence);
                            };

                            // Start silence detection
                            detectionFrameIdRef.current = requestAnimationFrame(detectSilence);
                        }
                        } catch (error) {
                            console.error('❌ Error initializing audio context:', error);
                            toast({
                                title: "Microphone Error",
                                description: "Could not initialize audio context",
                                variant: "destructive"
                            });
                            stopRecording();
                        }
                    },
                    onPartialResult: (result: TranscriptResult) => {
                        setPartialTranscript(result.transcript);
                    },
                    onFinalResult: (result: TranscriptResult) => {
                        // Add to transcript buffer
                        transcriptBufferRef.current.push(result.transcript);
                        const fullTranscript = transcriptBufferRef.current.join(' ');
                        setTranscript(fullTranscript);
                        setPartialTranscript(''); // Clear partial when we get final

                        // Call callback if provided (for auto-submit in continuous mode)
                        // Pass the new transcript only, and clear buffer if in continuous mode
                        if (onFinalTranscriptRef.current && result.transcript.trim()) {
                            onFinalTranscriptRef.current(result.transcript);
                            // In continuous mode, clear the buffer after callback so next transcript starts fresh
                            if (config.continuous) {
                                transcriptBufferRef.current = [];
                                setTranscript('');
                            }
                        }
                    },
                    onError: (error: string) => {
                        console.error('❌ Error:', error);
                        toast({
                            title: "Error de transcripción",
                            description: error,
                            variant: "destructive"
                        });
                        stopRecording();
                    },
                    onComplete: (summary: any) => {
                        if (summary?.full_transcript) {
                            setTranscript(summary.full_transcript);
                        }
                    },
                    onClose: () => {
                        // In click mode, always cleanup on close
                        cleanupAudioResources();
                    }
                }
            );

            transcribeClientRef.current = client;

        } catch (error) {
            console.error('Error starting transcription:', error);

            if (error instanceof DOMException && error.name === 'NotAllowedError') {
                toast({
                    title: "Acceso denegado",
                    description: "Por favor permite el acceso al micrófono",
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Error al iniciar grabación",
                    description: error instanceof Error ? error.message : "Error desconocido",
                    variant: "destructive"
                });
            }

            setIsRecording(false);
            setIsConnecting(false);
        }
    }, [cleanupAudioResources, recordMode]);

    /**
     * Stop recording and transcription
     */
    const stopRecording = useCallback(() => {
        // Prevent multiple simultaneous stops
        if (isStoppingRef.current) return;
        isStoppingRef.current = true;
        // In 'click' mode, cleanup is handled by silence detection or the onClose event
        cleanupAudioResources();
    }, [recordMode, cleanupAudioResources]);

    /**
     * Clear transcript
     */
    const clearTranscript = useCallback(() => {
        transcriptBufferRef.current = [];
        setTranscript('');
        setPartialTranscript('');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupAudioResources();
        };
    }, [cleanupAudioResources]);

    return {
        isRecording,
        isConnecting,
        isPaused,
        transcript,
        partialTranscript,
        prepareRecording,
        cancelPrepareRecording,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        clearTranscript
    };
};
