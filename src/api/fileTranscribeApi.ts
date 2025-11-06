import multipartClient from './multipartClient';
import type { AxiosResponse } from 'axios';

/**
 * Transcription result from OpenAI
 */
export interface FileTranscriptionResult {
    transcript: string;
    language: string;
    duration: number;
    confidence: number | null;
    model: string;
    file_size: number;
}

/**
 * Transcription configuration
 */
export interface FileTranscribeConfig {
    language_code?: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
    status: string;
    service: string;
    provider: string;
    config: {
        model: string;
        base_url: string;
        max_file_size_mb: number;
    };
}

/**
 * File transcription API client
 */
class FileTranscribeApiClient {
    async transcribeFile(
        file: File,
        config?: FileTranscribeConfig
    ): Promise<FileTranscriptionResult> {
        // Validate inputs
        if (!file) {
            throw new Error('No file provided');
        }

        // Prepare form data
        const formData = new FormData();
        formData.append('file', file);

        if (config?.language_code) {
            formData.append('language_code', config.language_code);
        }

        console.log('FormData to send:', formData);
        console.log('FormData entries:', Array.from(formData.entries()));

        // Use multipartClient - it automatically handles:
        // - JWT token from sessionStorage
        // - Multipart/form-data headers
        // - Error handling with toast notifications
        // - 5-minute timeout for large uploads
        const response: AxiosResponse<FileTranscriptionResult> = await multipartClient.post(
            '/v1/transcribe/file',
            formData
        );

        return response.data;
    }

    /**
     * Check health of file transcription service
     */
    async checkHealth(): Promise<HealthCheckResponse> {
        const response: AxiosResponse<HealthCheckResponse> = await multipartClient.get(
            '/v1/transcribe/file/health'
        );

        return response.data;
    }

    /**
     * Validate file before upload
     */
    validateFile(file: File): {
        valid: boolean;
        error?: string;
    } {
        // Check file size (25MB for OpenAI)
        const maxSize = 25 * 1024 * 1024;
        if (file.size > maxSize) {
            return {
                valid: false,
                error: `Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB (máx. 25MB)`
            };
        }

        if (file.size === 0) {
            return {
                valid: false,
                error: 'El archivo está vacío'
            };
        }

        // Check file extension
        const supportedExtensions = ['.wav', '.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.ogg', '.webm', '.flac'];
        const fileName = file.name.toLowerCase();
        const hasValidExtension = supportedExtensions.some(ext => fileName.endsWith(ext));

        if (!hasValidExtension) {
            return {
                valid: false,
                error: `Formato no soportado. Formatos válidos: ${supportedExtensions.join(', ')}`
            };
        }

        return { valid: true };
    }

    /**
     * Get supported audio formats
     */
    getSupportedFormats(): string[] {
        return ['.wav', '.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.ogg', '.webm', '.flac'];
    }

    /**
     * Get supported languages
     */
    getSupportedLanguages(): Record<string, string> {
        return {
            'es-ES': 'Spanish (Spain)',
            'es-US': 'Spanish (United States)',
            'en-US': 'English (United States)',
            'pt-BR': 'Portuguese (Brazil)',
            'fr-FR': 'French (France)',
            'de-DE': 'German (Germany)',
            'it-IT': 'Italian (Italy)',
            'ja-JP': 'Japanese (Japan)',
            'ko-KR': 'Korean (Korea)',
            'zh-CN': 'Chinese (Simplified)',
        };
    }
}

/**
 * Singleton instance of file transcribe API client
 */
const fileTranscribeApiClient = new FileTranscribeApiClient();

/**
 * File Transcribe API
 *
 * Simplified API for file-based transcription using OpenAI
 * Uses multipartClient which automatically handles JWT authentication
 */
export const fileTranscribeApi = {
    /**
     * Transcribe an audio file
     * JWT token is automatically retrieved from sessionStorage by multipartClient
     */
    transcribeFile: (
        file: File,
        config?: FileTranscribeConfig
    ): Promise<FileTranscriptionResult> => {
        return fileTranscribeApiClient.transcribeFile(file, config);
    },

    /**
     * Check service health
     */
    checkHealth: (): Promise<HealthCheckResponse> => {
        return fileTranscribeApiClient.checkHealth();
    },

    /**
     * Validate file before upload
     */
    validateFile: (file: File): { valid: boolean; error?: string } => {
        return fileTranscribeApiClient.validateFile(file);
    },

    /**
     * Get supported audio formats
     */
    getSupportedFormats: (): string[] => {
        return fileTranscribeApiClient.getSupportedFormats();
    },

    /**
     * Get supported languages
     */
    getSupportedLanguages: (): Record<string, string> => {
        return fileTranscribeApiClient.getSupportedLanguages();
    }
};

export default fileTranscribeApi;