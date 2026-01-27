import { useState, useRef, useCallback, useEffect } from 'react';
import { MicVAD } from '@ricky0123/vad-web';
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
    /** VAD is paused (muted) */
    isPaused: boolean;
    /** The active MediaStream (for visualization) */
    mediaStream: MediaStream | null;
    transcriptionResult: TranscriptionResult | null;
    /** No-op for backwards compatibility (VAD doesn't need preparation) */
    prepareRecording: () => void;
    /** No-op for backwards compatibility */
    cancelPrepareRecording: () => Promise<void>;
    startRecording: (language: string) => Promise<void>;
    stopRecording: () => void;
    /** Pause VAD detection (mute) */
    pauseRecording: () => void;
    /** Resume VAD detection (unmute) */
    resumeRecording: () => void;
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
    const [isPaused, setIsPaused] = useState(false);
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
    const wasSpeakingBeforePauseRef = useRef<boolean>(false);

    // Pre-warming refs
    const pendingStreamRequestRef = useRef<Promise<MediaStream> | null>(null);

    // Get silence thresholds from env
    const SILENCE_THRESHOLD = parseInt(import.meta.env.VITE_SILENCE_THRESHOLD || '3000', 10);
    const INITIAL_SPEECH_TIMEOUT = parseInt(import.meta.env.VITE_INITIAL_SPEECH_TIMEOUT || '10000', 10);

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

        if (audioFile.size < 5000) {
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
            mediaRecorderRef.current.stop();
        }
        mediaRecorderRef.current = null;
    }, []);

    /**
     * Handle initial timeout - stop if user never speaks
     */
    const handleInitialTimeout = useCallback(() => {
        if (hasDetectedSpeechRef.current) return; // Speech was detected, ignore

        silenceTimeoutRef.current = null;
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

        // Call callback with empty string to signal no speech
        if (onTranscriptionCompleteRef.current) {
            onTranscriptionCompleteRef.current('');
        }
    }, []);

    /**
     * Handle silence timeout - stop everything and transcribe
     */
    const handleSilenceTimeout = useCallback(() => {
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
        setIsPaused(false);
        hasDetectedSpeechRef.current = false;
    }, [stopMediaRecorder]);

    /**
     * Pause VAD detection (mute) - keeps recording session active but pauses detection
     */
    const pauseRecording = useCallback(() => {
        if (!isListening || isPaused) return;

        // Clear any active silence timeout
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }

        // Remember if we were speaking before pause
        wasSpeakingBeforePauseRef.current = isSpeaking;

        // Pause VAD
        if (vadRef.current) {
            vadRef.current.pause();
        }

        setIsPaused(true);
        setIsSpeaking(false);
    }, [isListening, isPaused, isSpeaking]);

    /**
     * Resume VAD detection (unmute)
     */
    const resumeRecording = useCallback(() => {
        if (!isListening || !isPaused) return;

        // Resume VAD
        if (vadRef.current) {
            vadRef.current.start();
        }

        setIsPaused(false);

        // If we weren't speaking before pause and haven't detected speech yet,
        // restart the initial timeout
        if (!hasDetectedSpeechRef.current) {
            silenceTimeoutRef.current = setTimeout(handleInitialTimeout, INITIAL_SPEECH_TIMEOUT);
        }
    }, [isListening, isPaused, handleInitialTimeout, INITIAL_SPEECH_TIMEOUT]);

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

            // Use pre-warmed stream if available, otherwise request microphone
            let stream: MediaStream;
            if (pendingStreamRequestRef.current) {
                stream = await pendingStreamRequestRef.current;
                pendingStreamRequestRef.current = null;
            } else {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        sampleRate: 16000,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                });
            }

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

            // Start initial timeout - stops if user never speaks
            silenceTimeoutRef.current = setTimeout(handleInitialTimeout, INITIAL_SPEECH_TIMEOUT);

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
    }, [isListening, isTranscribing, handleSpeechStart, handleSpeechEnd, handleInitialTimeout, INITIAL_SPEECH_TIMEOUT]);

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

    /**
     * Prepare recording by requesting microphone access early.
     * This reduces latency when starting recording.
     */
    const prepareRecording = useCallback(() => {
        // Don't prepare if already listening or transcribing
        if (isListening || isTranscribing) {
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
                noiseSuppression: true,
                autoGainControl: true,
            },
        });
    }, [isListening, isTranscribing]);

    /**
     * Cancel prepared recording if user decides not to record
     */
    const cancelPrepareRecording = useCallback(async () => {
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

    return {
        isListening,
        isSpeaking,
        isRecording: isListening,
        isTranscribing,
        isPaused,
        mediaStream,
        transcriptionResult,
        prepareRecording,
        cancelPrepareRecording,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        transcribeFile,
        clearResult
    };
};
