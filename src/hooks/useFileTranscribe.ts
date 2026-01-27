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
    /** Preload microphone stream and VAD model to eliminate startup delay */
    prepareRecording: () => void;
    /** Cancel and cleanup preloaded resources */
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
    const muteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasDetectedSpeechRef = useRef<boolean>(false);
    const wasSpeakingBeforePauseRef = useRef<boolean>(false);

    // Callback refs for VAD (allows reusing preloaded VAD without recreating)
    const speechStartCallbackRef = useRef<(() => void) | null>(null);
    const speechEndCallbackRef = useRef<(() => void) | null>(null);

    // Pre-warming refs
    const pendingStreamRequestRef = useRef<Promise<MediaStream> | null>(null);
    const preloadedVadRef = useRef<any>(null);
    const preloadedStreamRef = useRef<MediaStream | null>(null);
    const isPreloadingRef = useRef<boolean>(false);

    // Get silence thresholds from env
    const SILENCE_THRESHOLD = parseInt(import.meta.env.VITE_SILENCE_THRESHOLD || '3000', 10);
    const INITIAL_SPEECH_TIMEOUT = parseInt(import.meta.env.VITE_INITIAL_SPEECH_TIMEOUT || '10000', 10);
    const MUTE_TIMEOUT = parseInt(import.meta.env.VITE_MUTE_TIMEOUT || '30000', 10);

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
            try {
                vadRef.current.pause();
                vadRef.current.destroy();
            } catch (e) {
                // Ignore if already destroyed
            }
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
            try {
                vadRef.current.pause();
                vadRef.current.destroy();
            } catch (e) {
                // Ignore if already destroyed
            }
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

        // Clear callback refs
        speechStartCallbackRef.current = null;
        speechEndCallbackRef.current = null;

        // Clear silence timeout
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }

        // Clear mute timeout
        if (muteTimeoutRef.current) {
            clearTimeout(muteTimeoutRef.current);
            muteTimeoutRef.current = null;
        }

        // Stop MediaRecorder (triggers transcription if recording)
        if (isMediaRecordingRef.current) {
            stopMediaRecorder();
        }

        // Stop VAD
        if (vadRef.current) {
            try {
                vadRef.current.pause();
                vadRef.current.destroy();
            } catch (e) {
                // Ignore if already destroyed
            }
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
     * Abort recording silently - stops everything without triggering callbacks
     */
    const abortRecording = useCallback(() => {
        isActiveRef.current = false;

        // Clear callback refs
        speechStartCallbackRef.current = null;
        speechEndCallbackRef.current = null;

        // Clear all timeouts
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
        if (muteTimeoutRef.current) {
            clearTimeout(muteTimeoutRef.current);
            muteTimeoutRef.current = null;
        }

        // Stop MediaRecorder without triggering onstop callback
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = null; // Remove callback
            if (mediaRecorderRef.current.state === 'recording') {
                try {
                    mediaRecorderRef.current.stop();
                } catch (e) {
                    // Ignore
                }
            }
            mediaRecorderRef.current = null;
        }
        isMediaRecordingRef.current = false;
        audioChunksRef.current = [];

        // Stop VAD
        if (vadRef.current) {
            try {
                vadRef.current.pause();
                vadRef.current.destroy();
            } catch (e) {
                // Ignore if already destroyed
            }
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
    }, []);

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

        // Start mute timeout - abort recording if muted too long (no callback triggered)
        muteTimeoutRef.current = setTimeout(() => {
            abortRecording();
        }, MUTE_TIMEOUT);
    }, [isListening, isPaused, isSpeaking, MUTE_TIMEOUT, abortRecording]);

    /**
     * Resume VAD detection (unmute)
     */
    const resumeRecording = useCallback(() => {
        if (!isListening || !isPaused) return;

        // Clear mute timeout since we're resuming
        if (muteTimeoutRef.current) {
            clearTimeout(muteTimeoutRef.current);
            muteTimeoutRef.current = null;
        }

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

            // Set up callback refs (used by preloaded VAD)
            speechStartCallbackRef.current = handleSpeechStart;
            speechEndCallbackRef.current = handleSpeechEnd;

            let stream: MediaStream;
            let vad: any;

            // Use preloaded VAD and stream if available (instant start)
            if (preloadedVadRef.current && preloadedStreamRef.current) {
                stream = preloadedStreamRef.current;
                vad = preloadedVadRef.current;
                preloadedStreamRef.current = null;
                preloadedVadRef.current = null;
                // Callbacks already set via refs, no need to recreate VAD
            } else if (pendingStreamRequestRef.current) {
                // Use pre-warmed stream if available (partial preload)
                stream = await pendingStreamRequestRef.current;
                pendingStreamRequestRef.current = null;

                vad = await MicVAD.new({
                    stream,
                    positiveSpeechThreshold: 0.5,
                    negativeSpeechThreshold: 0.35,
                    redemptionFrames: 8,
                    minSpeechFrames: 4,
                    preSpeechPadFrames: 5,
                    onSpeechStart: () => speechStartCallbackRef.current?.(),
                    onSpeechEnd: () => speechEndCallbackRef.current?.(),
                });
            } else {
                // No preload available, do full initialization
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        channelCount: 1,
                        sampleRate: 16000,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                });

                vad = await MicVAD.new({
                    stream,
                    positiveSpeechThreshold: 0.5,
                    negativeSpeechThreshold: 0.35,
                    redemptionFrames: 8,
                    minSpeechFrames: 4,
                    preSpeechPadFrames: 5,
                    onSpeechStart: () => speechStartCallbackRef.current?.(),
                    onSpeechEnd: () => speechEndCallbackRef.current?.(),
                });
            }

            streamRef.current = stream;
            setMediaStream(stream);
            setIsListening(true);

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
            if (muteTimeoutRef.current) {
                clearTimeout(muteTimeoutRef.current);
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                try {
                    mediaRecorderRef.current.stop();
                } catch (e) {
                    // Ignore
                }
            }
            if (vadRef.current) {
                try {
                    vadRef.current.pause();
                    vadRef.current.destroy();
                } catch (e) {
                    // Ignore if already destroyed
                }
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            // Cleanup preloaded resources
            if (preloadedVadRef.current) {
                try {
                    preloadedVadRef.current.destroy();
                } catch (e) {
                    // Ignore if already destroyed
                }
            }
            if (preloadedStreamRef.current) {
                preloadedStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    /**
     * Prepare recording by requesting microphone access and preloading VAD model.
     * This eliminates the 1-2 second delay when starting recording.
     */
    const prepareRecording = useCallback(async () => {
        // Don't prepare if already listening or transcribing
        if (isListening || isTranscribing) {
            return;
        }

        // Don't create duplicate preload requests
        if (isPreloadingRef.current) {
            return;
        }

        // Already preloaded and ready
        if (preloadedVadRef.current && preloadedStreamRef.current) {
            return;
        }

        isPreloadingRef.current = true;

        try {
            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            preloadedStreamRef.current = stream;

            // Preload VAD with the stream (this loads the ONNX model)
            // Use refs for callbacks so they can be updated without recreating VAD
            const vad = await MicVAD.new({
                stream,
                positiveSpeechThreshold: 0.5,
                negativeSpeechThreshold: 0.35,
                redemptionFrames: 8,
                minSpeechFrames: 4,
                preSpeechPadFrames: 5,
                onSpeechStart: () => {
                    speechStartCallbackRef.current?.();
                },
                onSpeechEnd: () => {
                    speechEndCallbackRef.current?.();
                },
            });

            // Pause VAD immediately - it starts automatically on creation
            vad.pause();
            preloadedVadRef.current = vad;

        } catch (error) {
            console.warn('[FILE-TRANSCRIBE] Preload failed:', error);
            // Clean up on failure
            if (preloadedStreamRef.current) {
                preloadedStreamRef.current.getTracks().forEach(track => track.stop());
                preloadedStreamRef.current = null;
            }
        } finally {
            isPreloadingRef.current = false;
        }
    }, [isListening, isTranscribing]);

    /**
     * Cancel prepared recording if user decides not to record
     */
    const cancelPrepareRecording = useCallback(async () => {
        // Clean up preloaded VAD
        if (preloadedVadRef.current) {
            try {
                preloadedVadRef.current.destroy();
            } catch (e) {
                // Ignore errors if already destroyed
            }
            preloadedVadRef.current = null;
        }

        // Clean up preloaded stream
        if (preloadedStreamRef.current) {
            preloadedStreamRef.current.getTracks().forEach(track => track.stop());
            preloadedStreamRef.current = null;
        }

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
