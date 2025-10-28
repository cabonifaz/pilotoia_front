import { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeApi, type TranscribeConfig, type TranscriptResult } from '../api/transcribeApi';
import { toast } from './use-toast';

interface UseTranscribeReturn {
    isRecording: boolean;
    isConnecting: boolean;
    transcript: string;
    partialTranscript: string;
    startRecording: (config?: Partial<TranscribeConfig>) => Promise<void>;
    stopRecording: () => void;
    clearTranscript: () => void;
}

export const useTranscribe = (): UseTranscribeReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [partialTranscript, setPartialTranscript] = useState('');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
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

            // Default configuration
            const transcribeConfig: TranscribeConfig = {
                language_code: config.language_code || 'es-ES',
                sample_rate: config.sample_rate || 16000,
                media_encoding: config.media_encoding || 'pcm',
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
                        console.log('🎙️ Transcripción iniciada');
                        setIsConnecting(false);
                        setIsRecording(true);

                        // Start media recorder once WebSocket is ready
                        const mediaRecorder = new MediaRecorder(stream, {
                            mimeType: 'audio/webm;codecs=opus'
                        });

                        mediaRecorder.ondataavailable = (event) => {
                            if (event.data.size > 0 && client.isConnected()) {
                                client.sendAudioChunk(event.data);
                            }
                        };

                        mediaRecorder.start(100); // Send chunks every 100ms
                        mediaRecorderRef.current = mediaRecorder;
                    },
                    onPartialResult: (result: TranscriptResult) => {
                        console.log('📝 Partial:', result.transcript);
                        setPartialTranscript(result.transcript);
                    },
                    onFinalResult: (result: TranscriptResult) => {
                        console.log('✅ Final:', result.transcript);
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
                    onStatus: (status: string) => {
                        console.log('📡 Estado:', status);
                    },
                    onComplete: (summary: any) => {
                        console.log('✅ Sesión completada:', summary);
                        if (summary?.full_transcript) {
                            setTranscript(summary.full_transcript);
                        }
                    },
                    onClose: () => {
                        console.log('🔌 Conexión cerrada');
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
        // Stop media recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            mediaRecorderRef.current = null;
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
        startRecording,
        stopRecording,
        clearTranscript
    };
};
