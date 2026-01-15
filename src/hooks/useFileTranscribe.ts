import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from './use-toast';
import { fileTranscribeApi } from '../api/fileTranscribeApi';
import type { FileTranscriptionResult } from '../api/fileTranscribeApi';

// Re-export supported languages from API
export const SUPPORTED_LANGUAGES = fileTranscribeApi.getSupportedLanguages();
export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;

// Re-export supported formats from API
export const SUPPORTED_FORMATS = fileTranscribeApi.getSupportedFormats();

// Re-export transcription result type
export type TranscriptionResult = FileTranscriptionResult;

interface UseFileTranscribeReturn {
    isRecording: boolean;
    isTranscribing: boolean;
    transcriptionResult: TranscriptionResult | null;
    prepareRecording: () => void;
    cancelPrepareRecording: () => Promise<void>;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    transcribeFile: (file: File) => Promise<void>;
    clearResult: () => void;
    supportedLanguages: typeof SUPPORTED_LANGUAGES;
    supportedFormats: typeof SUPPORTED_FORMATS;
}

export const useFileTranscribe = (): UseFileTranscribeReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const detectionFrameIdRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recordingStartTimeRef = useRef<number>(0);
    const pendingStreamRequestRef = useRef<Promise<MediaStream> | null>(null);
    const shouldStartRecordingRef = useRef<boolean>(false);
    const stopRecordingRef = useRef<(() => void) | null>(null);
    const recordingLanguageRef = useRef<string>('es');

    /**
     * Transcribe an audio file using OpenAI API
     */
    const transcribeFile = useCallback(async (file: File, language: string) => {
        try {
            setIsTranscribing(true);

            // Validate file using API client
            const validation = fileTranscribeApi.validateFile(file);
            if (!validation.valid) {
                toast({
                    title: "Archivo inválido",
                    description: validation.error,
                    variant: "destructive"
                });
                return;
            }

            // Transcribe file using API client
            // multipartClient automatically handles JWT token from sessionStorage
            const result = await fileTranscribeApi.transcribeFile(file, {
                language_code: language
            });

            setTranscriptionResult(result);

        } catch (error) {
            console.error('Error transcribing file:', error);

            // multipartClient already shows toast notifications for errors
            // Just clear any partial results
            setTranscriptionResult(null);

        } finally {
            setIsTranscribing(false);
        }
    }, [currentLanguage]);

    /**
     * Prepare recording by requesting microphone access early.
     * This is called immediately on button press to reduce latency.
     */
    const prepareRecording = useCallback(() => {
        // Don't prepare if already recording or transcribing
        if (isRecording || isTranscribing) {
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
    }, [isRecording, isTranscribing]);

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
     * Start recording from microphone
     */
    const startRecording = useCallback(async (language: string) => {
        try {
            // Safety check: ensure we're not already recording
            if (isRecording) {
                console.warn('Already recording, ignoring start request');
                return;
            }

            // Don't start recording while transcribing
            if (isTranscribing) {
                console.warn('Cannot start recording while transcribing');
                return;
            }

            // Store language for use in onstop handler
            recordingLanguageRef.current = language;

            // Mark that we want to record
            shouldStartRecordingRef.current = true;

            // Use pending stream request if available, otherwise create new one
            let streamPromise = pendingStreamRequestRef.current;
            if (!streamPromise) {
                streamPromise = navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        sampleRate: 16000,
                        echoCancellation: true,
                        noiseSuppression: true
                    }
                });
            }

            // Wait for stream to be ready
            const stream = await streamPromise;

            // Clear pending request
            pendingStreamRequestRef.current = null;

            // Check again if we should still record (user might have cancelled)
            if (!shouldStartRecordingRef.current) {
                // User cancelled, clean up stream
                stream.getTracks().forEach(track => track.stop());
                return;
            }


            streamRef.current = stream;
            audioChunksRef.current = [];

            // Detect best supported audio format
            // Note: Browser-generated files often have issues with OpenAI
            // WebM/Opus works well with AWS, let's try it
            const supportedTypes = [
                'audio/webm;codecs=opus', // WebM with Opus - works with AWS
                'audio/webm',          // WebM fallback
                'audio/wav',           // WAV - most compatible but large
                'audio/ogg;codecs=opus', // OGG with Opus
                'audio/ogg',           // OGG fallback
                'audio/mp4',           // MP4
                'audio/mpeg'           // MP3
            ];

            let selectedMimeType = '';
            for (const type of supportedTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    selectedMimeType = type;
                    break;
                }
            }

            if (!selectedMimeType) {
                throw new Error('No supported audio format found');
            }

            // Create MediaRecorder with supported format
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: selectedMimeType
            });

            mediaRecorderRef.current = mediaRecorder;

            // Get file extension from mime type
            const getExtension = (mimeType: string): string => {
                if (mimeType.includes('mp4')) return 'mp4';
                if (mimeType.includes('mpeg')) return 'mp3';
                if (mimeType.includes('wav')) return 'wav';
                if (mimeType.includes('ogg')) return 'ogg';
                if (mimeType.includes('webm')) return 'webm';
                return 'mp4'; // default to mp4
            };

            const fileExtension = getExtension(selectedMimeType);
            const actualMimeType = mediaRecorder.mimeType; // Get actual mimeType used

            // Collect audio chunks
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            // Handle recording stop - transcribe the audio
            mediaRecorder.onstop = async () => {
                // Calculate recording duration
                const recordingDuration = Date.now() - recordingStartTimeRef.current;

                // Validate minimum recording duration (500ms = 0.5 seconds)
                const MIN_DURATION_MS = 500;
                if (recordingDuration < MIN_DURATION_MS) {
                    // Cleanup on validation failure
                    audioChunksRef.current = [];
                    recordingStartTimeRef.current = 0;
                    setIsRecording(false);

                    toast({
                        title: "Grabación muy corta",
                        description: `La grabación debe durar al menos ${MIN_DURATION_MS / 1000} segundos. Duración: ${(recordingDuration / 1000).toFixed(2)}s`,
                        variant: "destructive"
                    });
                    return;
                }

                // Validate that we have audio chunks
                if (audioChunksRef.current.length === 0) {
                    // Cleanup on validation failure
                    audioChunksRef.current = [];
                    recordingStartTimeRef.current = 0;
                    setIsRecording(false);

                    toast({
                        title: "Sin audio grabado",
                        description: "No se capturó audio. Por favor intenta nuevamente.",
                        variant: "destructive"
                    });
                    return;
                }

                // Use the actual mimeType from the recorder
                const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });

                // Validate blob size (minimum ~5KB for meaningful audio)
                if (audioBlob.size < 5000) {
                    // Cleanup on validation failure
                    audioChunksRef.current = [];
                    recordingStartTimeRef.current = 0;
                    setIsRecording(false);

                    toast({
                        title: "Audio insuficiente",
                        description: `El archivo de audio es muy pequeño (${audioBlob.size} bytes). Por favor graba por más tiempo.`,
                        variant: "destructive"
                    });
                    return;
                }

                const audioFile = new File([audioBlob], `recording.${fileExtension}`, { type: actualMimeType });

                // Clear audio chunks for next recording
                audioChunksRef.current = [];

                // Transcribe the recorded file with error handling
                try {
                    await transcribeFile(audioFile, recordingLanguageRef.current);
                } catch (error) {
                    // Ensure transcription errors don't break future recordings
                    console.error('Error in onstop handler:', error);

                    // Full cleanup on transcription failure
                    setIsTranscribing(false);
                    setIsRecording(false);
                    audioChunksRef.current = []; // Safety clear
                    recordingStartTimeRef.current = 0; // Reset timer

                    toast({
                        title: "Error en transcripción",
                        description: "No se pudo transcribir el audio. Intenta nuevamente.",
                        variant: "destructive"
                    });
                }
            };

            // Start recording
            recordingStartTimeRef.current = Date.now();
            mediaRecorder.start(100); // Collect data every 100ms
            setIsRecording(true);

            // Reset the flag since we're now recording
            shouldStartRecordingRef.current = false;

            // Setup silence detection
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);

            analyser.fftSize = 2048;
            source.connect(analyser);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            sourceRef.current = source;

            const SILENCE_THRESHOLD = parseInt(import.meta.env.VITE_SILENCE_THRESHOLD || '5000', 10);
            const SILENCE_LEVEL = parseInt(import.meta.env.VITE_SILENCE_LEVEL || '15', 10);
            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const detectSilence = () => {
                if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
                    return;
                }

                analyser.getByteFrequencyData(dataArray);
                const sum = dataArray.reduce((a, b) => a + b, 0);
                const average = sum / dataArray.length;

                // If average volume is very low, consider it silence
                if (average < SILENCE_LEVEL) {
                    if (!silenceTimeoutRef.current) {
                        silenceTimeoutRef.current = setTimeout(() => {
                            // Stop recording after 5 seconds of silence
                            // Use ref to always get the latest stopRecording function
                            if (stopRecordingRef.current) {
                                stopRecordingRef.current();
                            }
                        }, SILENCE_THRESHOLD);
                    }
                } else {
                    // Clear timeout if sound detected
                    if (silenceTimeoutRef.current) {
                        clearTimeout(silenceTimeoutRef.current);
                        silenceTimeoutRef.current = null;
                    }
                }

                detectionFrameIdRef.current = requestAnimationFrame(detectSilence);
            };

            // Start silence detection
            detectionFrameIdRef.current = requestAnimationFrame(detectSilence);

        } catch (error) {
            console.error('Error starting recording:', error);

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
        }
    }, [transcribeFile, isRecording, isTranscribing]);

    /**
     * Stop recording
     */
    const stopRecording = useCallback(() => {
        // Stop silence detection
        if (detectionFrameIdRef.current !== null) {
            cancelAnimationFrame(detectionFrameIdRef.current);
            detectionFrameIdRef.current = null;
        }

        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }

        // Stop MediaRecorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        // Clear MediaRecorder ref
        mediaRecorderRef.current = null;

        // Stop media stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Clean up audio context
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }

        if (analyserRef.current) {
            analyserRef.current.disconnect();
            analyserRef.current = null;
        }

        if (audioContextRef.current) {
            if (audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {
                    // Ignore errors closing audio context
                });
            }
            audioContextRef.current = null;
        }

        // Reset recording start time - CRITICAL for subsequent recordings
        // Note: audioChunksRef is cleared by the onstop handler, not here
        recordingStartTimeRef.current = 0;
        shouldStartRecordingRef.current = false;
        pendingStreamRequestRef.current = null;

        setIsRecording(false);
    }, []);

    // Update ref whenever stopRecording changes
    useEffect(() => {
        stopRecordingRef.current = stopRecording;
    }, [stopRecording]);

    /**
     * Clear transcription result
     */
    const clearResult = useCallback(() => {
        setTranscriptionResult(null);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, [stopRecording]);

    return {
        isRecording,
        isTranscribing,
        transcriptionResult,
        currentLanguage,
        setLanguage: setCurrentLanguage,
        prepareRecording,
        cancelPrepareRecording,
        startRecording,
        stopRecording,
        transcribeFile,
        clearResult,
        supportedLanguages: SUPPORTED_LANGUAGES,
        supportedFormats: SUPPORTED_FORMATS
    };
};
