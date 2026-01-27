import { toast } from '../hooks/use-toast';
import type {
    TranscribeConfig,
    TranscriptResult,
    TranscribeResponse,
    TranscribeCallbacks,
} from '../types/transcribe';

// Base WebSocket URL configuration (reuse from wsClient pattern)
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL?.replace('http', 'ws')}/api`;

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
                // Connection established
            };

            // Handle incoming messages
            this.websocket.onmessage = (event) => {
                try {
                    const response: TranscribeResponse = JSON.parse(event.data);
                    this.handleMessage(response, config);
                } catch (parseError) {
                    console.error('Error parsing message:', parseError);
                }
            };

            // Handle errors
            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                toast({
                    title: "Error de conexión",
                    description: "Error al conectar con el servicio de transcripción",
                    variant: "destructive"
                });
            };

            // Handle connection close
            this.websocket.onclose = (event) => {
                // Connection closed

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
            console.error('Error creating WebSocket:', error);
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
                if (response.status === 'connected') {
                    this.sendConfiguration(config);
                } else if (response.status === 'configured') {
                    // Config confirmed, wait for streaming status
                } else if (response.status === 'streaming') {
                    // Server is ready to receive audio, start recording
                    if (this.callbacks.onOpen) {
                        this.callbacks.onOpen();
                    }
                } else if (response.status === 'muted') {
                    // Server confirmed mute - AWS not being charged
                    console.log('Server confirmed mute - AWS not charged');
                } else if (response.status === 'unmuted') {
                    // Server confirmed unmute - audio resumed
                    console.log('Server confirmed unmute - audio resumed');
                } else if (response.status === 'mute_timeout') {
                    // Muted for too long, stream will close
                    console.warn('Mute timeout - stream closing');
                    if (this.callbacks.onError) {
                        this.callbacks.onError('Muted for too long, stream closed');
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
                console.error('Transcription error:', response.error);
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
    private sendConfiguration(config: TranscribeConfig): void {
        if (!this.isConnected()) return;

        const configMessage = {
            type: 'config',
            data: {
                language_code: config.language_code || 'es-ES',
                language_codes: config.language_codes || [config.language_code || 'es-ES'],
                sample_rate: config.sample_rate || 16000,
                media_encoding: config.media_encoding || 'pcm',
                vocabulary_name: config.vocabulary_name || null,
                enable_partial_results: config.enable_partial_results ?? true,
                show_speaker_label: config.show_speaker_label ?? false,
                enable_channel_identification: config.enable_channel_identification ?? false,
                number_of_channels: config.number_of_channels || null
            }
        };

        this.websocket!.send(JSON.stringify(configMessage));
    }

    /**
     * Send audio chunk as binary data (Blob)
     */
    sendAudioChunk(audioChunk: Blob): void {
        if (!this.isConnected()) {
            return;
        }

        // Convert Blob to ArrayBuffer using FileReader (more compatible)
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
     * Send mute signal (JSON) - pauses audio forwarding to AWS (no charges while muted)
     */
    sendMute(): void {
        if (this.isConnected()) {
            const muteMessage = { type: 'mute' };
            try {
                this.websocket!.send(JSON.stringify(muteMessage));
            } catch (error) {
                console.error('Error sending mute message:', error);
            }
        }
    }

    /**
     * Send unmute signal (JSON) - resumes audio forwarding to AWS
     */
    sendUnmute(): void {
        if (this.isConnected()) {
            const unmuteMessage = { type: 'unmute' };
            try {
                this.websocket!.send(JSON.stringify(unmuteMessage));
            } catch (error) {
                console.error('Error sending unmute message:', error);
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
     * Force disconnect without sending stop signal (silent abort)
     */
    forceDisconnect(): void {
        if (this.websocket) {
            this.websocket.close(1000, 'Client aborting');
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

// Re-export types for backward compatibility
export type { TranscribeConfig, TranscriptResult, TranscribeResponse, TranscribeCallbacks };
