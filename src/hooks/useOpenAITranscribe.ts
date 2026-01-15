import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { openaiTranscribeApi } from '../api/openaiTranscribeApi';
import type { OpenAITranscribeConfig, TranscriptResult } from '../types/openaiTranscribe';
import { toast } from './use-toast';

interface UseOpenAITranscribeReturn {
    isRecording: boolean;
    isConnecting: boolean;
    transcript: string;
    partialTranscript: string;
    startRecording: (config?: Partial<OpenAITranscribeConfig>) => Promise<void>;
    stopRecording: () => void;
    clearTranscript: () => void;
}

export const useOpenAITranscribe = (): UseOpenAITranscribeReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [partialTranscript, setPartialTranscript] = useState('');

    /**
     * RECORDING MODE DETECTION AND BEHAVIOR:
     *
     * The hook supports two modes based on window width at initialization:
     * - Click mode (width > 768px): Click to start, click to stop
     * - Hold mode (width <= 768px): Press and hold to record
     *
     * DIAGNOSTIC LOGGING ENABLED:
     * Console logs are included to help diagnose premature connection closes.
     * Look for these emoji markers in console:
     * 📱 = Mode detection
     * 🛑 = Stop initiated
     * ⏱️ = Duration check
     * 🖱️/📤 = Click/Hold mode specific actions
     * ✋ = Stop signal sent
     * 🔌 = WebSocket close
     * 🧹 = Cleanup
     */

    // Detect device type and select record mode (once, doesn't change during session)
    // Mobile (hold mode): width <= 768px
    // Web (click mode): width > 768px
    const recordMode = useMemo(() => {
        if (typeof window === 'undefined') return 'click' as const;
        const mode = (window.innerWidth <= 768 ? 'hold' : 'click') as 'click' | 'hold';
        console.log(`📱 Recording mode: ${mode} (window width: ${window.innerWidth}px)`);
        return mode;
    }, []);

    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const transcribeClientRef = useRef<ReturnType<typeof openaiTranscribeApi.startTranscription> | null>(null);
    const transcriptBufferRef = useRef<string[]>([]);
    const isStoppingRef = useRef<boolean>(false);
    const recordingStartTimeRef = useRef<number>(0);
    const isWaitingForCloseRef = useRef<boolean>(false);

    /**
     * Cleanup audio resources
     */
    const cleanupAudioResources = useCallback(() => {
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

        // Disconnect WebSocket
        if (transcribeClientRef.current) {
            transcribeClientRef.current.disconnect();
            transcribeClientRef.current = null;
        }

        setIsRecording(false);
        setIsConnecting(false);
        setPartialTranscript('');
        isStoppingRef.current = false;
        isWaitingForCloseRef.current = false;
        recordingStartTimeRef.current = 0;
    }, []);

    /**
     * Stop recording and transcription
     */
    const stopRecording = useCallback(() => {
        // Prevent multiple simultaneous stops
        if (isStoppingRef.current) {
            console.log('⚠️ Stop already in progress, ignoring duplicate call');
            return;
        }

        // For hold mode, we need to check if recording has actually started
        if (recordMode === 'hold' && !recordingStartTimeRef.current) {
            // User released button before connection was established.
            // We can simply clean up without sending signals.
            console.log('🛑 Hold mode: Connection not established yet, cleaning up');
            cleanupAudioResources();
            return;
        }

        console.log(`🛑 Stopping recording in ${recordMode} mode`);
        isStoppingRef.current = true;

        if (recordMode === 'hold') {
            const duration = Date.now() - recordingStartTimeRef.current;
            const SHORT_RECORDING_THRESHOLD = 1500; // 1.5 seconds

            console.log(`⏱️ Hold mode: Recording duration ${duration}ms (threshold: ${SHORT_RECORDING_THRESHOLD}ms)`);

            if (duration < SHORT_RECORDING_THRESHOLD) {
                // Hard stop for short recordings
                console.log('⚡ Short recording detected, hard stop (cleanup immediately)');
                cleanupAudioResources();
            } else {
                // Graceful stop for longer recordings: send stop and wait for onClose
                console.log('📤 Longer recording, initiating graceful stop');
                if (transcribeClientRef.current && transcribeClientRef.current.isConnected()) {
                    // Mark that we're waiting for server to close the connection
                    isWaitingForCloseRef.current = true;

                    // Force worklet to send any remaining buffered audio
                    if (workletNodeRef.current) {
                        console.log('🔄 Flushing remaining audio buffer');
                        workletNodeRef.current.port.postMessage({ type: 'flush' });
                    }

                    // Wait for buffered audio to be sent before sending stop signal
                    setTimeout(() => {
                        // Send stop signal to server
                        if (transcribeClientRef.current && transcribeClientRef.current.isConnected()) {
                            console.log('✋ Sending stop signal to server');
                            transcribeClientRef.current.sendStop();
                        }

                        // Disconnect audio sources after stop is sent
                        if (sourceRef.current) {
                            sourceRef.current.disconnect();
                        }
                        if (workletNodeRef.current) {
                            workletNodeRef.current.disconnect();
                        }
                    }, 100);

                    // Safety timeout: if server doesn't close within 10 seconds, force cleanup
                    setTimeout(() => {
                        if (isWaitingForCloseRef.current) {
                            console.warn('⚠️ Server did not close connection within timeout, forcing cleanup');
                            cleanupAudioResources();
                        }
                    }, 10000);
                } else {
                    // If client is already disconnected, just clean up
                    cleanupAudioResources();
                }
            }
        } else {
            // In 'click' mode, manually stopped by user
            // Send stop signal and cleanup
            console.log('🖱️ Click mode: User manually stopped, sending stop signal');
            if (transcribeClientRef.current && transcribeClientRef.current.isConnected()) {
                console.log('✋ Sending stop signal to server');
                transcribeClientRef.current.sendStop();
            }
            // Cleanup immediately since user manually stopped
            console.log('🧹 Cleaning up resources immediately');
            cleanupAudioResources();
        }
    }, [recordMode, cleanupAudioResources]);

    /**
     * Start recording and transcription with OpenAI
     */
    const startRecording = useCallback(async (config: Partial<OpenAITranscribeConfig> = {}) => {
        try {
            setIsConnecting(true);

            // Validate language is provided (REQUIRED)
            if (!config.language) {
                toast({
                    title: "Error de configuración",
                    description: "Se requiere especificar el idioma de transcripción",
                    variant: "destructive"
                });
                setIsConnecting(false);
                return;
            }

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

            // Request microphone access - OpenAI requires PCM16 mono at 16kHz
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000, // PCM16 standard
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            // Default configuration for OpenAI
            const transcribeConfig: OpenAITranscribeConfig = {
                language: config.language, // REQUIRED
                sample_rate: config.sample_rate || 16000, // PCM16 standard
                silence_duration_ms: config.silence_duration_ms || 500
            };

            console.log(`🎤 Starting OpenAI transcription with language: ${transcribeConfig.language}, silence: ${transcribeConfig.silence_duration_ms}ms`);

            // Start WebSocket connection
            const client = openaiTranscribeApi.startTranscription(
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
                            workletNode.port.onmessage = (event) => {
                                if (!client.isConnected()) return;

                                if (event.data.type === 'audio') {
                                    // Send raw PCM bytes as binary (including silence)
                                    const blob = new Blob([event.data.data], { type: 'application/octet-stream' });
                                    client.sendAudioChunk(blob);
                                }
                            };

                            // Note: Silence detection is DISABLED for OpenAI
                            // OpenAI Realtime API has server-side VAD that handles silence detection
                            // Users must manually click the button to stop recording
                        } catch (error) {
                            console.error('❌ Error initializing audio context:', error);
                            toast({
                                title: "Error de micrófono",
                                description: "No se pudo inicializar el contexto de audio",
                                variant: "destructive"
                            });
                            stopRecording();
                        }
                    },
                    onPartialResult: (result: TranscriptResult) => {
                        // OpenAI delta events are incremental - append to build full partial transcript
                        setPartialTranscript(prev => prev + result.transcript);
                    },
                    onFinalResult: (result: TranscriptResult) => {
                        // Add to transcript buffer
                        transcriptBufferRef.current.push(result.transcript);
                        setTranscript(transcriptBufferRef.current.join(' '));
                        setPartialTranscript(''); // Clear partial when we get final
                    },
                    onError: (error: string) => {
                        console.error('❌ OpenAI Error:', error);
                        toast({
                            title: "Error de transcripción",
                            description: error,
                            variant: "destructive"
                        });
                        stopRecording();
                    },
                    onComplete: (summary: any) => {
                        console.log('📊 OpenAI Session Summary:', summary);
                        if (summary?.full_transcript) {
                            setTranscript(summary.full_transcript);
                        }
                    },
                    onClose: () => {
                        console.log(`🔌 WebSocket onClose triggered - mode: ${recordMode}, waiting: ${isWaitingForCloseRef.current}`);
                        // In hold mode, only cleanup if we were waiting for close
                        // Otherwise, let stopRecording handle the cleanup timing
                        if (recordMode === 'hold' && isWaitingForCloseRef.current) {
                            console.log('🧹 Hold mode: Cleaning up after waiting for close');
                            cleanupAudioResources();
                        } else if (recordMode === 'click') {
                            // In click mode, cleanup on close from server
                            console.log('🧹 Click mode: Server closed connection, cleaning up');
                            cleanupAudioResources();
                        } else {
                            console.log('⏭️ Not cleaning up yet (hold mode, not waiting for close)');
                        }
                    }
                }
            );

            transcribeClientRef.current = client;

        } catch (error) {
            console.error('Error starting OpenAI transcription:', error);

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
    }, [cleanupAudioResources, recordMode, stopRecording]);

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
        transcript,
        partialTranscript,
        startRecording,
        stopRecording,
        clearTranscript
    };
};
