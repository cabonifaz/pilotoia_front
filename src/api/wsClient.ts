import { toast } from '../hooks/use-toast';

// Base WebSocket client configuration
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL?.replace('http', 'ws')}/api`;

interface WSConfig {
    endpoint: string;
    params?: Record<string, string>;
    onMessage: (data: any) => void;
    onError?: (error: Event) => void;
    onClose?: (event: CloseEvent) => void;
    onOpen?: () => void;
}

class WSClient {
    private websocket: WebSocket | null = null;

    /**
     * Create a WebSocket connection with JWT authentication
     */
    connect(config: WSConfig): WebSocket {
        const { endpoint, params, onMessage, onError, onOpen, onClose } = config;

        try {
            // Build URL with query parameters
            let url = `${API_BASE_URL}${endpoint}`;
            if (params) {
                const searchParams = new URLSearchParams(params);
                url += `?${searchParams.toString()}`;
            }

            // Create WebSocket connection
            this.websocket = new WebSocket(url);

            // Handle connection open
            this.websocket.onopen = () => {
                if (onOpen) {
                    onOpen();
                }
            };

            // Handle incoming messages
            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    onMessage(data);
                } catch (parseError) {
                    // Ignore parse errors for malformed messages
                }
            };

            // Handle errors
            this.websocket.onerror = (error) => {
                if (onError) {
                    onError(error);
                } else {
                    // Default error handling
                    toast({
                        title: "Error de conexión WebSocket",
                        description: "Error al conectar con el servidor",
                        variant: "destructive"
                    });
                }
            };

            // Handle connection close
            this.websocket.onclose = (event) => {
                if (onClose) {
                    onClose(event);
                }

                // Handle specific close codes
                if (event.code === 1006) {
                    // Abnormal closure
                    toast({
                        title: "Conexión perdida",
                        description: "Se perdió la conexión con el servidor",
                        variant: "destructive"
                    });
                } else if (event.code === 1011) {
                    // Server error
                    toast({
                        title: "Error del servidor",
                        description: "Error interno del servidor WebSocket",
                        variant: "destructive"
                    });
                } else if (event.code === 1008) {
                    // Policy violation (could be auth error)
                    toast({
                        title: "Error de autenticación",
                        description: "Error de autenticación WebSocket",
                        variant: "destructive"
                    });
                }

                this.websocket = null;
            };

            return this.websocket;

        } catch (error) {
            // Default error handling for connection setup
            toast({
                title: "Error de WebSocket",
                description: "Error al crear la conexión WebSocket",
                variant: "destructive"
            });
            throw error;
        }
    }

    /**
     * Send a message through the WebSocket
     */
    send(data: any): void {
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            try {
                this.websocket.send(JSON.stringify(data));
            } catch (error) {
                toast({
                    title: "Error de envío",
                    description: "Error al enviar mensaje WebSocket",
                    variant: "destructive"
                });
            }
        }
    }

    /**
     * Close the WebSocket connection
     */
    disconnect(): void {
        if (this.websocket) {
            this.websocket.close(1000, 'Client disconnecting');
            this.websocket = null;
        }
    }

    /**
     * Get current connection state
     */
    getReadyState(): number | null {
        return this.websocket ? this.websocket.readyState : null;
    }

    /**
     * Check if WebSocket is connected
     */
    isConnected(): boolean {
        return this.websocket?.readyState === WebSocket.OPEN;
    }
}

// Create and export a singleton instance
export const wsClient = new WSClient();

// Helper function for creating WebSocket connections
export const createWSConnection = (config: WSConfig): WebSocket => {
    return wsClient.connect(config);
};

export default wsClient;