import { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeApi } from '../api/transcribeApi';
import type { TranscribeConfig, TranscriptResult } from '../types/transcribe';
import { toast } from './use-toast';

// Supported languages for transcription
export const SUPPORTED_LANGUAGES = {
    'es-ES': 'Spanish (Spain)',
    'es-US': 'Spanish (United States)',
    'en-US': 'English (United States)',
} as const;

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

interface UseTranscribeReturn {
    isRecording: boolean;
    isConnecting: boolean;
    transcript: string;
    partialTranscript: string;
    currentLanguage: LanguageCode;
    setLanguage: (language: LanguageCode) => void;
    startRecording: (config?: Partial<TranscribeConfig>) => Promise<void>;
    stopRecording: () => void;
    clearTranscript: () => void;
    supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

export const useTranscribe = (): UseTranscribeReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [partialTranscript, setPartialTranscript] = useState('');
    const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('es-ES');

    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const detectionFrameIdRef = useRef<number | null>(null);
    const transcribeClientRef = useRef<ReturnType<typeof transcribeApi.startTranscription> | null>(null);
    const transcriptBufferRef = useRef<string[]>([]);

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

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: config.sample_rate || 16000,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            // Determine audio format based on what MediaRecorder supports
            let audioEncoding = 'ogg-opus';
            let audioSampleRate = 48000;

            if (MediaRecorder.isTypeSupported('audio/wav')) {
                audioEncoding = 'pcm'; // WAV is PCM
                audioSampleRate = 16000; // Standard for PCM
            }

            // Default configuration
            const transcribeConfig: TranscribeConfig = {
                language_code: config.language_code || currentLanguage,
                sample_rate: config.sample_rate || audioSampleRate,
                media_encoding: config.media_encoding || audioEncoding,
                enable_partial_results: config.enable_partial_results ?? true,
                show_speaker_label: config.show_speaker_label ?? false,
                ...config
            };

            // Start WebSocket connection
            const client = transcribeApi.startTranscription(
                token,
                transcribeConfig,
                {
                    onOpen: () => {
                        console.log('🎙️ Transcripción iniciada - onOpen callback ejecutado');
                        setIsConnecting(false);
                        setIsRecording(true);

                        try {
                            // Capture raw PCM from microphone using Web Audio API
                            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

                            const source = audioContext.createMediaStreamSource(stream);

                            const processor = audioContext.createScriptProcessor(4096, 1, 1);

                        // Store refs for cleanup
                        audioContextRef.current = audioContext;
                        sourceRef.current = source;
                        processorRef.current = processor;

                        source.connect(processor);
                        processor.connect(audioContext.destination);

                        // Variables para tracking de silencio
                        let silenceTimeoutId: NodeJS.Timeout | null = null;
                        let stopSignalSent = false;
                        const SILENCE_THRESHOLD = parseInt(import.meta.env.VITE_SILENCE_THRESHOLD || '5000', 10); // Stop after N milliseconds of silence
                        const SILENCE_LEVEL = parseInt(import.meta.env.VITE_SILENCE_LEVEL || '15', 10); // Volume threshold for silence detection (byte frequency average: 0-20 = silence, 20+ = speech)

                        // Create analyser for silence detection
                        const analyser = audioContext.createAnalyser();
                        analyser.fftSize = 2048;
                        source.connect(analyser);
                        analyserRef.current = analyser;

                        const dataArray = new Uint8Array(analyser.frequencyBinCount);
                        let audioProcessCount = 0;

                        // Process raw PCM data
                        processor.onaudioprocess = (event) => {
                            if (!client.isConnected()) return;

                            audioProcessCount++;

                            const inputData = event.inputBuffer.getChannelData(0);
                            // Convert float32 to int16 PCM (little-endian)
                            const pcmData = new Int16Array(inputData.length);
                            for (let i = 0; i < inputData.length; i++) {
                                const s = Math.max(-1, Math.min(1, inputData[i]));
                                pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                            }

                            // Send raw PCM bytes as binary (including silence)
                            const blob = new Blob([pcmData.buffer], { type: 'application/octet-stream' });
                            client.sendAudioChunk(blob);
                        };

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
                                            // Send stop signal but keep processor running briefly
                                            // to ensure server receives it
                                            client.sendStop();

                                            // Cleanup after a brief delay to ensure stop signal is sent
                                            setTimeout(() => {
                                                processor.disconnect();
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
                        setTranscript(transcriptBufferRef.current.join(' '));
                        setPartialTranscript(''); // Clear partial when we get final
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
                        setIsRecording(false);
                        setIsConnecting(false);
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
    }, []);

    /**
     * Stop recording and transcription
     */
    const stopRecording = useCallback(() => {
        // Clean up Web Audio API resources
        if (detectionFrameIdRef.current !== null) {
            cancelAnimationFrame(detectionFrameIdRef.current);
            detectionFrameIdRef.current = null;
        }

        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
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
        setPartialTranscript('');
    }, []);

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
            stopRecording();
        };
    }, [stopRecording]);

    return {
        isRecording,
        isConnecting,
        transcript,
        partialTranscript,
        currentLanguage,
        setLanguage: setCurrentLanguage,
        startRecording,
        stopRecording,
        clearTranscript,
        supportedLanguages: SUPPORTED_LANGUAGES
    };
};
