import { toast } from '../hooks/use-toast';

// Base WebSocket URL configuration (reuse from wsClient pattern)
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL?.replace('http', 'ws')}/api`;

export interface TranscribeConfig {
    language_code?: string;
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

/**
 * Transcribe WebSocket client adapted from wsClient pattern
 * Handles both JSON messages and binary audio chunks
 */
class TranscribeWebSocketClient {
    private websocket: WebSocket | null = null;
    private callbacks: TranscribeCallbacks = {};

    /**
     * Connect to transcription WebSocket endpoint
     */
    connect(token: string, config: TranscribeConfig, callbacks: TranscribeCallbacks): void {
        this.callbacks = callbacks;

        const endpoint = '/v1/transcribe/ws/transcribe';
        const url = `${API_BASE_URL}${endpoint}?token=${encodeURIComponent(token)}`;

        try {
            this.websocket = new WebSocket(url);

            // Handle connection open
            this.websocket.onopen = () => {
                console.log('✅ WebSocket Transcribe conectado');
            };

            // Handle incoming messages
            this.websocket.onmessage = (event) => {
                try {
                    const response: TranscribeResponse = JSON.parse(event.data);
                    this.handleMessage(response, config);
                } catch (parseError) {
                    console.error('Error parseando mensaje:', parseError);
                }
            };

            // Handle errors
            this.websocket.onerror = (error) => {
                console.error('❌ Error WebSocket:', error);
                toast({
                    title: "Error de conexión",
                    description: "Error al conectar con el servicio de transcripción",
                    variant: "destructive"
                });
            };

            // Handle connection close
            this.websocket.onclose = (event) => {
                console.log('🔌 WebSocket cerrado:', event.code, event.reason);

                if (event.code === 1006) {
                    toast({
                        title: "Conexión perdida",
                        description: "Se perdió la conexión con el servicio de transcripción",
                        variant: "destructive"
                    });
                } else if (event.code === 1008) {
                    toast({
                        title: "Error de autenticación",
                        description: "Token inválido o expirado",
                        variant: "destructive"
                    });
                }

                if (this.callbacks.onClose) {
                    this.callbacks.onClose();
                }

                this.websocket = null;
            };

        } catch (error) {
            console.error('Error creando WebSocket:', error);
            toast({
                title: "Error de WebSocket",
                description: "Error al crear la conexión de transcripción",
                variant: "destructive"
            });
            throw error;
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(response: TranscribeResponse, config: TranscribeConfig): void {
        switch (response.type) {
            case 'status':
                console.log(`📡 Estado: ${response.status}`);

                if (response.status === 'connected') {
                    this.sendConfiguration(config);
                } else if (response.status === 'configured') {
                    if (this.callbacks.onOpen) {
                        this.callbacks.onOpen();
                    }
                }

                if (this.callbacks.onStatus) {
                    this.callbacks.onStatus(response.status!);
                }
                break;

            case 'partial':
                if (response.result && this.callbacks.onPartialResult) {
                    this.callbacks.onPartialResult(response.result);
                }
                break;

            case 'final':
                if (response.result && this.callbacks.onFinalResult) {
                    this.callbacks.onFinalResult(response.result);
                }
                break;

            case 'error':
                console.error('❌ Error de transcripción:', response.error);
                if (this.callbacks.onError) {
                    this.callbacks.onError(response.error!);
                } else {
                    toast({
                        title: "Error de transcripción",
                        description: response.error,
                        variant: "destructive"
                    });
                }
                break;

            case 'complete':
                console.log('✅ Sesión completada');
                if (this.callbacks.onComplete && response.summary) {
                    this.callbacks.onComplete(response.summary);
                }
                break;

            default:
                console.warn('Tipo de mensaje desconocido:', response.type);
        }
    }

    /**
     * Send configuration message (JSON)
     */
    private sendConfiguration(config: TranscribeConfig): void {
        if (!this.isConnected()) return;

        const configMessage = {
            type: 'config',
            data: {
                language_code: config.language_code || 'es-ES',
                sample_rate: config.sample_rate || 16000,
                media_encoding: config.media_encoding || 'pcm',
                vocabulary_name: config.vocabulary_name || null,
                enable_partial_results: config.enable_partial_results ?? true,
                show_speaker_label: config.show_speaker_label ?? false,
                enable_channel_identification: config.enable_channel_identification ?? false,
                number_of_channels: config.number_of_channels || null
            }
        };

        console.log('📤 Enviando configuración:', configMessage);
        this.websocket!.send(JSON.stringify(configMessage));
    }

    /**
     * Send audio chunk as binary data (Blob)
     */
    sendAudioChunk(audioChunk: Blob): void {
        if (!this.isConnected()) {
            console.error('WebSocket no está conectado');
            return;
        }

        // Send binary data directly (no JSON stringify)
        this.websocket!.send(audioChunk);
    }

    /**
     * Send stop signal (JSON)
     */
    sendStop(): void {
        if (this.isConnected()) {
            const stopMessage = { type: 'stop' };
            this.websocket!.send(JSON.stringify(stopMessage));
        }
    }

    /**
     * Disconnect from WebSocket
     */
    disconnect(): void {
        if (this.websocket) {
            this.sendStop();
            this.websocket.close(1000, 'Client disconnecting');
            this.websocket = null;
        }
    }

    /**
     * Check if WebSocket is connected
     */
    isConnected(): boolean {
        return this.websocket?.readyState === WebSocket.OPEN;
    }

    /**
     * Get current connection state
     */
    getReadyState(): number | null {
        return this.websocket ? this.websocket.readyState : null;
    }
}

/**
 * Transcribe API
 */
export const transcribeApi = {
    /**
     * Start transcription session
     */
    startTranscription: (
        token: string,
        config: TranscribeConfig,
        callbacks: TranscribeCallbacks
    ): TranscribeWebSocketClient => {
        const client = new TranscribeWebSocketClient();
        client.connect(token, config, callbacks);
        return client;
    }
};

export default transcribeApi;
