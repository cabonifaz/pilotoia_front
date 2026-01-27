import { useState, useRef, useCallback, useEffect } from 'react';
import { MicVAD } from '@ricky0123/vad-web';
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
    /** VAD detected speech - user is currently speaking */
    isSpeaking: boolean;
    /** The active MediaStream (for visualization) */
    mediaStream: MediaStream | null;
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
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [transcript, setTranscript] = useState('');
    const [partialTranscript, setPartialTranscript] = useState('');
    const isPausedRef = useRef(false);

    // Always use click mode: press once to start, press again to stop (or auto-stop on silence)
    const recordMode = 'click' as const;

    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const transcribeClientRef = useRef<ReturnType<typeof transcribeApi.startTranscription> | null>(null);
    const transcriptBufferRef = useRef<string[]>([]);
    const isStoppingRef = useRef<boolean>(false);
    const recordingStartTimeRef = useRef<number>(0);
    const isWaitingForCloseRef = useRef<boolean>(false);
    const pendingStreamRequestRef = useRef<Promise<MediaStream> | null>(null);
    const shouldStartRecordingRef = useRef<boolean>(false);
    const streamRef = useRef<MediaStream | null>(null);

    // VAD refs
    const vadRef = useRef<any>(null);
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const muteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasDetectedSpeechRef = useRef<boolean>(false);
    const stopSignalSentRef = useRef<boolean>(false);


    /**
     * Cleanup audio resources
     */
    const cleanupAudioResources = useCallback(() => {
        // Clean up VAD
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }

        // Clean up mute timeout
        if (muteTimeoutRef.current) {
            clearTimeout(muteTimeoutRef.current);
            muteTimeoutRef.current = null;
        }

        if (vadRef.current) {
            try {
                vadRef.current.pause();
                vadRef.current.destroy();
            } catch (e) {
                // Ignore VAD cleanup errors
            }
            vadRef.current = null;
        }

        // Clean up Web Audio API resources
        if (workletNodeRef.current) {
            workletNodeRef.current.disconnect();
            workletNodeRef.current = null;
        }

        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
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

        // Stop media stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Disconnect WebSocket
        if (transcribeClientRef.current) {
            transcribeClientRef.current.disconnect();
            transcribeClientRef.current = null;
        }

        setMediaStream(null);
        setIsRecording(false);
        setIsConnecting(false);
        setIsPaused(false);
        setIsSpeaking(false);
        isPausedRef.current = false;
        setPartialTranscript('');
        isStoppingRef.current = false;
        isWaitingForCloseRef.current = false;
        recordingStartTimeRef.current = 0;
        pendingStreamRequestRef.current = null;
        shouldStartRecordingRef.current = false;
        hasDetectedSpeechRef.current = false;
        stopSignalSentRef.current = false;
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

        // Don't create duplicate stream requests
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
     * Pause recording - sends mute to backend, AWS won't charge
     * VAD keeps running locally, backend just skips forwarding to AWS
     */
    const pauseRecording = useCallback(() => {
        if (isRecording && !isPausedRef.current) {
            isPausedRef.current = true;
            setIsPaused(true);

            // Clear any silence timers - we don't want to auto-stop while muted
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
                silenceTimeoutRef.current = null;
            }

            // Send mute signal to backend - AWS won't charge while muted
            // Don't pause VAD - let it keep running, backend handles the mute
            if (transcribeClientRef.current?.isConnected()) {
                transcribeClientRef.current.sendMute();
            }

            // Start mute timeout - silently abort if muted too long (no callback triggered)
            const MUTE_TIMEOUT = parseInt(import.meta.env.VITE_MUTE_TIMEOUT || '30000', 10);
            muteTimeoutRef.current = setTimeout(() => {
                if (isPausedRef.current) {
                    // Force disconnect without sending stop - this avoids triggering onComplete callback
                    if (transcribeClientRef.current) {
                        transcribeClientRef.current.forceDisconnect();
                        transcribeClientRef.current = null;
                    }
                    // Clean up remaining resources (VAD, audio context, stream)
                    cleanupAudioResources();
                }
            }, MUTE_TIMEOUT);
        }
    }, [isRecording]);

    /**
     * Resume recording - sends unmute to backend to resume AWS processing
     */
    const resumeRecording = useCallback(() => {
        if (isRecording && isPausedRef.current) {
            isPausedRef.current = false;
            setIsPaused(false);

            // Clear mute timeout since we're resuming
            if (muteTimeoutRef.current) {
                clearTimeout(muteTimeoutRef.current);
                muteTimeoutRef.current = null;
            }

            // Send unmute signal to backend
            if (transcribeClientRef.current?.isConnected()) {
                transcribeClientRef.current.sendUnmute();
            }

            // Restart silence timer if user has spoken before and VAD is not currently detecting speech
            // This ensures we eventually auto-stop even after unmute
            if (hasDetectedSpeechRef.current && vadRef.current && !stopSignalSentRef.current) {
                const SILENCE_THRESHOLD = parseInt(import.meta.env.VITE_SILENCE_THRESHOLD || '3000', 10);
                silenceTimeoutRef.current = setTimeout(() => {
                    // VAD will cancel this timer if speech starts
                    if (transcribeClientRef.current?.isConnected() && !isPausedRef.current && !stopSignalSentRef.current) {
                        stopSignalSentRef.current = true;
                        transcribeClientRef.current.sendStop();
                    }
                }, SILENCE_THRESHOLD);
            }
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

            // Store stream for cleanup and expose for visualization
            streamRef.current = stream;
            setMediaStream(stream);

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

                        // Listen to messages from AudioWorklet (PCM audio data)
                        // Audio is always sent to backend - backend handles mute by skipping AWS forwarding
                        workletNode.port.onmessage = (event) => {
                            if (!client.isConnected()) return;

                            if (event.data.type === 'audio') {
                                // Send raw PCM bytes as binary (including silence)
                                const blob = new Blob([event.data.data], { type: 'application/octet-stream' });
                                client.sendAudioChunk(blob);
                            }
                        };

                        // Set up VAD for speech detection (in 'click' mode)
                        if (recordMode === 'click') {
                            const SILENCE_THRESHOLD = parseInt(import.meta.env.VITE_SILENCE_THRESHOLD || '3000', 10);
                            stopSignalSentRef.current = false;

                            const vad = await MicVAD.new({
                                stream,
                                positiveSpeechThreshold: 0.5,
                                negativeSpeechThreshold: 0.35,
                                redemptionFrames: 8,
                                minSpeechFrames: 4,
                                preSpeechPadFrames: 5,
                                onSpeechStart: () => {
                                    if (stopSignalSentRef.current) return;
                                    // Don't update speaking state if paused
                                    if (isPausedRef.current) return;

                                    setIsSpeaking(true);
                                    hasDetectedSpeechRef.current = true;

                                    // Cancel silence timer
                                    if (silenceTimeoutRef.current) {
                                        clearTimeout(silenceTimeoutRef.current);
                                        silenceTimeoutRef.current = null;
                                    }
                                },
                                onSpeechEnd: () => {
                                    if (stopSignalSentRef.current) return;
                                    // Don't start silence timer if paused - we handle this in pauseRecording
                                    if (isPausedRef.current) return;

                                    setIsSpeaking(false);

                                    // Clear any existing timeout
                                    if (silenceTimeoutRef.current) {
                                        clearTimeout(silenceTimeoutRef.current);
                                    }

                                    // Start silence timer - only stop if speech was detected
                                    if (hasDetectedSpeechRef.current) {
                                        silenceTimeoutRef.current = setTimeout(() => {
                                            // Double-check we're not paused when timer fires
                                            if (!stopSignalSentRef.current && !isPausedRef.current) {
                                                stopSignalSentRef.current = true;

                                                // Send stop signal - server will close connection after processing
                                                // Don't disconnect worklet here, let onClose handle full cleanup
                                                client.sendStop();
                                            }
                                        }, SILENCE_THRESHOLD);
                                    }
                                },
                            });

                            vadRef.current = vad;
                            vad.start();

                            // Start initial timeout - stops if user never speaks
                            const INITIAL_SPEECH_TIMEOUT = parseInt(import.meta.env.VITE_INITIAL_SPEECH_TIMEOUT || '10000', 10);
                            silenceTimeoutRef.current = setTimeout(() => {
                                // Don't stop if paused or if user has spoken
                                if (!stopSignalSentRef.current && !hasDetectedSpeechRef.current && !isPausedRef.current) {
                                    stopSignalSentRef.current = true;
                                    // Send stop signal - server will close connection
                                    // Don't disconnect worklet here, let onClose handle full cleanup
                                    client.sendStop();
                                }
                            }, INITIAL_SPEECH_TIMEOUT);
                        }
                        } catch (error) {
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

                        // In non-continuous mode, call callback on each final result
                        if (!config.continuous && onFinalTranscriptRef.current && result.transcript.trim()) {
                            onFinalTranscriptRef.current(result.transcript);
                        }
                    },
                    onError: (error: string) => {
                        toast({
                            title: "Error de transcripción",
                            description: error,
                            variant: "destructive"
                        });
                        stopRecording();
                    },
                    onComplete: (summary: any) => {
                        // Always use our accumulated buffer - it's more reliable than server summary
                        const finalTranscript = transcriptBufferRef.current.join(' ');

                        // Update UI with final transcript
                        if (summary?.full_transcript) {
                            setTranscript(summary.full_transcript);
                        }

                        // In continuous mode, call callback with complete transcript after session ends
                        if (config.continuous && onFinalTranscriptRef.current && finalTranscript.trim()) {
                            onFinalTranscriptRef.current(finalTranscript);
                            // Clear buffer for next session
                            transcriptBufferRef.current = [];
                            setTranscript('');
                        }
                    },
                    onClose: () => {
                        // Full cleanup on close
                        cleanupAudioResources();
                    }
                }
            );

            transcribeClientRef.current = client;

        } catch (error) {

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
        // Reset pause state
        isPausedRef.current = false;
        setIsPaused(false);
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
        // Also reset pause state when clearing
        isPausedRef.current = false;
        setIsPaused(false);
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
        isSpeaking,
        mediaStream,
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
