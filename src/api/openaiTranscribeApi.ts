import { toast } from '../hooks/use-toast';
import type {
    OpenAITranscribeConfig,
    TranscriptResult,
    OpenAITranscribeResponse,
    OpenAITranscribeCallbacks,
} from '../types/openaiTranscribe';

// Base WebSocket URL configuration
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL?.replace('http', 'ws')}/api`;

/**
 * OpenAI Transcribe WebSocket client
 * Handles real-time transcription using OpenAI Realtime API
 *
 * Key differences from AWS Transcribe:
 * - Uses OpenAI Realtime API with gpt-4o-realtime-preview
 * - Auto language detection (no language config needed)
 * - PCM16 mono audio at 16kHz
 * - Client-side commit intervals for latency control
 * - No confidence scores or timestamps
 */
class OpenAITranscribeWebSocketClient {
    private websocket: WebSocket | null = null;
    private callbacks: OpenAITranscribeCallbacks = {};

    /**
     * Connect to OpenAI transcription WebSocket endpoint
     */
    connect(token: string, config: OpenAITranscribeConfig, callbacks: OpenAITranscribeCallbacks): void {
        this.callbacks = callbacks;

        const endpoint = '/v1/transcribe/ws/transcribe_streaming';
        const url = `${API_BASE_URL}${endpoint}?token=${encodeURIComponent(token)}`;

        try {
            this.websocket = new WebSocket(url);

            // Handle connection open
            this.websocket.onopen = () => {
                console.log('✅ OpenAI WebSocket connected');
            };

            // Handle incoming messages
            this.websocket.onmessage = (event) => {
                try {
                    const response: OpenAITranscribeResponse = JSON.parse(event.data);
                    this.handleMessage(response, config);
                } catch (parseError) {
                    console.error('Error parsing message:', parseError);
                }
            };

            // Handle errors
            this.websocket.onerror = (error) => {
                console.error('OpenAI WebSocket error:', error);
                toast({
                    title: "Error de conexión",
                    description: "Error al conectar con OpenAI Realtime API",
                    variant: "destructive"
                });
            };

            // Handle connection close
            this.websocket.onclose = (event) => {
                console.log(`🔌 OpenAI WebSocket closed (code: ${event.code})`);

                if (event.code === 1006) {
                    toast({
                        title: "Conexión perdida",
                        description: "Se perdió la conexión con OpenAI",
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
            console.error('Error creating OpenAI WebSocket:', error);
            toast({
                title: "Error de WebSocket",
                description: "Error al crear la conexión con OpenAI",
                variant: "destructive"
            });
            throw error;
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(response: OpenAITranscribeResponse, config: OpenAITranscribeConfig): void {
        switch (response.type) {
            case 'status':
                if (response.status === 'connected') {
                    this.sendConfiguration(config);
                } else if (response.status === 'configured') {
                    // Config confirmed, wait for streaming status
                } else if (response.status === 'streaming') {
                    // Server is ready to receive audio, start recording
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
                console.error('OpenAI transcription error:', response.error);
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
                if (this.callbacks.onComplete && response.summary) {
                    this.callbacks.onComplete(response.summary);
                }
                break;

            default:
                console.warn('Unknown message type:', response.type);
        }
    }

    /**
     * Send configuration message (JSON)
     */
    private sendConfiguration(config: OpenAITranscribeConfig): void {
        if (!this.isConnected()) return;

        const configMessage = {
            type: 'config',
            data: {
                sample_rate: config.sample_rate || 16000,
                transcription_model: config.transcription_model || 'gpt-4o-mini-transcribe',
                commit_interval_seconds: config.commit_interval_seconds || 1.5
            }
        };

        this.websocket!.send(JSON.stringify(configMessage));
    }

    /**
     * Send audio chunk as binary data (ArrayBuffer)
     */
    sendAudioChunk(audioChunk: Blob): void {
        if (!this.isConnected()) {
            return;
        }

        // Convert Blob to ArrayBuffer using FileReader
        const reader = new FileReader();

        reader.onload = (event) => {
            const result = event.target?.result;
            if (result instanceof ArrayBuffer && this.isConnected()) {
                try {
                    this.websocket!.send(result);
                } catch (error) {
                    console.error('Error sending audio chunk:', error);
                }
            }
        };

        reader.onerror = (error) => {
            console.error('Error reading audio chunk:', error);
        };

        reader.readAsArrayBuffer(audioChunk);
    }

    /**
     * Send stop signal (JSON)
     */
    sendStop(): void {
        if (this.isConnected()) {
            const stopMessage = { type: 'stop' };
            const messageStr = JSON.stringify(stopMessage);
            try {
                this.websocket!.send(messageStr);
            } catch (error) {
                console.error('Error sending stop message:', error);
            }
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
 * OpenAI Transcribe API
 */
export const openaiTranscribeApi = {
    /**
     * Start OpenAI transcription session
     */
    startTranscription: (
        token: string,
        config: OpenAITranscribeConfig,
        callbacks: OpenAITranscribeCallbacks
    ): OpenAITranscribeWebSocketClient => {
        const client = new OpenAITranscribeWebSocketClient();
        client.connect(token, config, callbacks);
        return client;
    }
};

export default openaiTranscribeApi;

// Re-export types
export type { OpenAITranscribeConfig, TranscriptResult, OpenAITranscribeResponse, OpenAITranscribeCallbacks };
