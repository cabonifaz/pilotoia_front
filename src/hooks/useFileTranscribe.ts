import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from './use-toast';
import { fileTranscribeApi } from '../api/fileTranscribeApi';
import type { FileTranscriptionResult } from '../api/fileTranscribeApi';

// Re-export transcription result type
export type TranscriptionResult = FileTranscriptionResult;

interface UseFileTranscribeOptions {
    /** Callback when transcription is complete (useful for auto-submit in continuous mode) */
    onTranscriptionComplete?: (transcript: string) => void;
}

interface UseFileTranscribeReturn {
    /** VAD is active, waiting for speech */
    isListening: boolean;
    /** Speech detected, currently recording */
    isSpeaking: boolean;
    /** Alias for isListening (backwards compatibility) */
    isRecording: boolean;
    /** Audio is being transcribed */
    isTranscribing: boolean;
    /** The active MediaStream (for visualization) */
    mediaStream: MediaStream | null;
    transcriptionResult: TranscriptionResult | null;
    /** No-op for backwards compatibility (VAD doesn't need preparation) */
    prepareRecording: () => void;
    /** No-op for backwards compatibility */
    cancelPrepareRecording: () => Promise<void>;
    startRecording: (language: string) => Promise<void>;
    stopRecording: () => void;
    transcribeFile: (file: File, language: string) => Promise<void>;
    clearResult: () => void;
}

export const useFileTranscribe = (options: UseFileTranscribeOptions = {}): UseFileTranscribeReturn => {
    const { onTranscriptionComplete } = options;
    const onTranscriptionCompleteRef = useRef(onTranscriptionComplete);

    useEffect(() => {
        onTranscriptionCompleteRef.current = onTranscriptionComplete;
    }, [onTranscriptionComplete]);

    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

    // VAD refs
    const vadRef = useRef<any>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const recordingLanguageRef = useRef<string>('es');
    const isActiveRef = useRef<boolean>(false);

    // MediaRecorder refs
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const isMediaRecordingRef = useRef<boolean>(false);

    // Silence detection refs
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasDetectedSpeechRef = useRef<boolean>(false);

    // Get silence threshold from env
    const SILENCE_THRESHOLD = parseInt(import.meta.env.VITE_SILENCE_THRESHOLD || '3000', 10);

    /**
     * Transcribe an audio file using OpenAI API
     */
    const transcribeFile = useCallback(async (file: File, language: string) => {
        try {
            setIsTranscribing(true);

            const validation = fileTranscribeApi.validateFile(file);
            if (!validation.valid) {
                toast({
                    title: "Archivo inválido",
                    description: validation.error,
                    variant: "destructive"
                });
                return;
            }

            const result = await fileTranscribeApi.transcribeFile(file, {
                language_code: language
            });

            setTranscriptionResult(result);

            if (onTranscriptionCompleteRef.current && result.transcript?.trim()) {
                onTranscriptionCompleteRef.current(result.transcript);
            }

        } catch (error) {
            console.error('Error transcribing file:', error);
            setTranscriptionResult(null);
        } finally {
            setIsTranscribing(false);
        }
    }, []);

    /**
     * Process recorded audio and transcribe
     */
    const processRecordedAudio = useCallback(async () => {
        if (audioChunksRef.current.length === 0) {
            console.log('[FILE-TRANSCRIBE] No audio chunks to process');
            if (onTranscriptionCompleteRef.current) {
                onTranscriptionCompleteRef.current('');
            }
            return;
        }

        // Detect mime type from MediaRecorder
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        // Get file extension
        const getExtension = (mime: string): string => {
            if (mime.includes('mp4')) return 'mp4';
            if (mime.includes('mpeg')) return 'mp3';
            if (mime.includes('wav')) return 'wav';
            if (mime.includes('ogg')) return 'ogg';
            if (mime.includes('webm')) return 'webm';
            return 'webm';
        };

        const ext = getExtension(mimeType);
        const audioFile = new File([audioBlob], `recording.${ext}`, { type: mimeType });

        console.log(`[FILE-TRANSCRIBE] Processing audio: ${(audioFile.size / 1024).toFixed(2)}KB`);

        if (audioFile.size < 5000) {
            console.log('[FILE-TRANSCRIBE] Audio file too small, skipping');
            if (onTranscriptionCompleteRef.current) {
                onTranscriptionCompleteRef.current('');
            }
            return;
        }

        await transcribeFile(audioFile, recordingLanguageRef.current);
    }, [transcribeFile]);

    /**
     * Start MediaRecorder when speech is first detected
     */
    const startMediaRecorder = useCallback(() => {
        if (isMediaRecordingRef.current || !streamRef.current) return;

        console.log('[FILE-TRANSCRIBE] Starting MediaRecorder');

        const supportedTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg;codecs=opus',
            'audio/ogg',
        ];

        let selectedMimeType = '';
        for (const type of supportedTypes) {
            if (MediaRecorder.isTypeSupported(type)) {
                selectedMimeType = type;
                break;
            }
        }

        if (!selectedMimeType) {
            console.error('[FILE-TRANSCRIBE] No supported audio format');
            return;
        }

        const mediaRecorder = new MediaRecorder(streamRef.current, {
            mimeType: selectedMimeType
        });

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            console.log('[FILE-TRANSCRIBE] MediaRecorder stopped');
            isMediaRecordingRef.current = false;
            processRecordedAudio();
        };

        audioChunksRef.current = [];
        mediaRecorder.start(100); // Collect data every 100ms
        mediaRecorderRef.current = mediaRecorder;
        isMediaRecordingRef.current = true;
    }, [processRecordedAudio]);

    /**
     * Stop MediaRecorder
     */
    const stopMediaRecorder = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            console.log('[FILE-TRANSCRIBE] Stopping MediaRecorder');
            mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;
    }, []);

    /**
     * Handle silence timeout - stop everything and transcribe
     */
    const handleSilenceTimeout = useCallback(() => {
        console.log('[FILE-TRANSCRIBE] Silence threshold reached');
        silenceTimeoutRef.current = null;

        // Stop MediaRecorder (this triggers onstop which calls processRecordedAudio)
        stopMediaRecorder();

        // Stop VAD and stream
        isActiveRef.current = false;

        if (vadRef.current) {
            vadRef.current.pause();
            vadRef.current.destroy();
            vadRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setMediaStream(null);
        setIsListening(false);
        setIsSpeaking(false);
    }, [stopMediaRecorder]);

    /**
     * Handle speech start from VAD
     */
    const handleSpeechStart = useCallback(() => {
        if (!isActiveRef.current) return;

        console.log('[FILE-TRANSCRIBE] Speech detected');
        setIsSpeaking(true);

        // Cancel silence timer
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }

        // Start MediaRecorder on first speech detection
        if (!hasDetectedSpeechRef.current) {
            hasDetectedSpeechRef.current = true;
            startMediaRecorder();
        }
    }, [startMediaRecorder]);

    /**
     * Handle speech end from VAD - start silence timer
     */
    const handleSpeechEnd = useCallback(() => {
        if (!isActiveRef.current) return;

        console.log('[FILE-TRANSCRIBE] Speech ended, starting silence timer');
        setIsSpeaking(false);

        // Clear any existing timeout
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
        }

        // Start silence timer
        silenceTimeoutRef.current = setTimeout(handleSilenceTimeout, SILENCE_THRESHOLD);
    }, [SILENCE_THRESHOLD, handleSilenceTimeout]);

    /**
     * Stop everything
     */
    const stopRecording = useCallback(() => {
        console.log('[FILE-TRANSCRIBE] Stop requested');
        isActiveRef.current = false;

        // Clear silence timeout
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }

        // Stop MediaRecorder (triggers transcription if recording)
        if (isMediaRecordingRef.current) {
            stopMediaRecorder();
        }

        // Stop VAD
        if (vadRef.current) {
            vadRef.current.pause();
            vadRef.current.destroy();
            vadRef.current = null;
        }

        // Stop stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setMediaStream(null);
        setIsListening(false);
        setIsSpeaking(false);
        hasDetectedSpeechRef.current = false;
    }, [stopMediaRecorder]);

    /**
     * Start listening for voice using VAD
     */
    const startRecording = useCallback(async (language: string) => {
        if (isListening || isTranscribing) {
            console.warn('[FILE-TRANSCRIBE] Already listening or transcribing');
            return;
        }

        try {
            recordingLanguageRef.current = language;
            isActiveRef.current = true;
            hasDetectedSpeechRef.current = false;
            audioChunksRef.current = [];

            // Dynamically import vad-web
            const { MicVAD } = await import('@ricky0123/vad-web');

            // Request microphone
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
            setMediaStream(stream);
            setIsListening(true);

            // Create VAD instance
            const vad = await MicVAD.new({
                stream,
                positiveSpeechThreshold: 0.5,
                negativeSpeechThreshold: 0.35,
                redemptionFrames: 8,
                minSpeechFrames: 4,
                preSpeechPadFrames: 5,
                onSpeechStart: handleSpeechStart,
                onSpeechEnd: handleSpeechEnd,
            });

            vadRef.current = vad;
            vad.start();

            console.log('[FILE-TRANSCRIBE] VAD started, waiting for speech...');

        } catch (error) {
            console.error('[FILE-TRANSCRIBE] Error starting:', error);
            isActiveRef.current = false;
            setIsListening(false);

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
        }
    }, [isListening, isTranscribing, handleSpeechStart, handleSpeechEnd]);

    /**
     * Clear transcription result
     */
    const clearResult = useCallback(() => {
        setTranscriptionResult(null);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (silenceTimeoutRef.current) {
                clearTimeout(silenceTimeoutRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            if (vadRef.current) {
                vadRef.current.pause();
                vadRef.current.destroy();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // No-op functions for backwards compatibility
    const prepareRecording = useCallback(() => {}, []);
    const cancelPrepareRecording = useCallback(async () => {}, []);

    return {
        isListening,
        isSpeaking,
        isRecording: isListening,
        isTranscribing,
        mediaStream,
        transcriptionResult,
        prepareRecording,
        cancelPrepareRecording,
        startRecording,
        stopRecording,
        transcribeFile,
        clearResult
    };
};
