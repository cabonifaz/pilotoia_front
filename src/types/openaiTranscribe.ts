/**
 * OpenAI Transcription API Types
 * Types for audio transcription via OpenAI Realtime API
 */

export interface OpenAITranscribeConfig {
    language: string; // REQUIRED: Language code (e.g., 'en', 'es', 'fr')
    sample_rate?: number; // Default: 16000 (PCM16 mono)
    silence_duration_ms?: number; // Default: 500ms (server-side VAD silence detection)
}

export interface TranscriptResult {
    transcript: string;
    is_partial: boolean;
    start_time: number; // Always 0 for OpenAI (not provided)
    end_time: number; // Always 0 for OpenAI (not provided)
    confidence?: number | null; // Always null for OpenAI (not provided)
    alternatives?: any[] | null;
    speaker_label?: string | null; // Always null for OpenAI (not supported)
}

export interface OpenAITranscribeResponse {
    type: 'partial' | 'final' | 'error' | 'status' | 'complete';
    result?: TranscriptResult;
    error?: string;
    status?: string;
    summary?: {
        duration_seconds: number;
        total_words: number;
        partial_result_count: number;
        final_result_count: number;
        full_transcript?: string;
        segment_count?: number;
        provider: string; // 'openai'
        model: string;
    };
}

export interface OpenAITranscribeCallbacks {
    onPartialResult?: (result: TranscriptResult) => void;
    onFinalResult?: (result: TranscriptResult) => void;
    onError?: (error: string) => void;
    onStatus?: (status: string) => void;
    onComplete?: (summary: any) => void;
    onOpen?: () => void;
    onClose?: () => void;
}
