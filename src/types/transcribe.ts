/**
 * Transcription API Types
 * Shared types for audio transcription via WebSocket
 */

export interface TranscribeConfig {
    language_code?: string;
    language_codes?: string[];
    sample_rate?: number;
    media_encoding?: string;
    vocabulary_name?: string;
    enable_partial_results?: boolean;
    show_speaker_label?: boolean;
    enable_channel_identification?: boolean;
    number_of_channels?: number;
}

export interface TranscriptResult {
    transcript: string;
    is_partial: boolean;
    start_time: number;
    end_time: number;
    confidence?: number;
    alternatives?: any[];
    speaker_label?: string;
}

export interface TranscribeResponse {
    type: 'partial' | 'final' | 'error' | 'status' | 'complete';
    result?: TranscriptResult;
    error?: string;
    status?: string;
    summary?: {
        duration_seconds: number;
        total_words: number;
        average_confidence?: number;
        full_transcript?: string;
        segment_count?: number;
    };
}

export interface TranscribeCallbacks {
    onPartialResult?: (result: TranscriptResult) => void;
    onFinalResult?: (result: TranscriptResult) => void;
    onError?: (error: string) => void;
    onStatus?: (status: string) => void;
    onComplete?: (summary: any) => void;
    onOpen?: () => void;
    onClose?: () => void;
}
