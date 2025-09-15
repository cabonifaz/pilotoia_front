import { toast } from '../hooks/use-toast';

// Base SSE client configuration
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

interface SSEConfig {
    endpoint: string;
    onMessage: (data: any) => void;
    onError?: (error: Event) => void;
    onClose?: (event: CloseEvent) => void;
    onOpen?: () => void;
}

interface SSERequestBody {
    [key: string]: any;
}

class SSEClient {
    private eventSource: EventSource | null = null;

    /**
     * Create an SSE connection with POST request support
     * Since EventSource only supports GET, we'll use fetch with streaming for POST requests
     */
    async connect(config: SSEConfig, requestBody?: SSERequestBody): Promise<void> {
        const { endpoint, onMessage, onError, onOpen, onClose } = config;

        try {
            // Use the same header logic as the original getStreamingConfig
            const token = sessionStorage.getItem('jwt_token');
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            };

            // Add Authorization header if token exists
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            let url = `${API_BASE_URL}${endpoint}`;
            let fetchOptions: RequestInit = {
                method: 'GET',
                headers,
                credentials: 'omit', // No cookies needed
            };

            // If we have a request body, use POST with fetch streaming
            if (requestBody) {
                fetchOptions = {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(requestBody),
                    credentials: 'omit',
                };
            }

            const response = await fetch(url, fetchOptions);

            if (!response.ok) {
                await this.handleHttpError(response);
                return;
            }

            if (!response.body) {
                throw new Error('Response body is null');
            }

            // Signal connection opened
            if (onOpen) {
                onOpen();
            }

            // Read the streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();

                    if (done) {
                        // Process any remaining data in buffer
                        if (buffer.trim()) {
                            this.processSSEBuffer(buffer, onMessage);
                        }
                        // Stream ended normally
                        if (onClose) {
                            onClose(new CloseEvent('close', { code: 1000, reason: 'Stream completed' }));
                        }
                        break;
                    }

                    // Decode the chunk and add to buffer
                    buffer += decoder.decode(value, { stream: true });

                    // Process complete SSE messages (ending with \n\n)
                    const parts = buffer.split('\n\n');
                    buffer = parts.pop() ?? ''; // Keep the last incomplete part

                    // Process each complete message
                    for (const part of parts) {
                        if (part.trim()) {
                            this.processSSEBuffer(part, onMessage);
                        }
                    }
                }
            } finally {
                reader.releaseLock();
            }

        } catch (error) {
            if (onError) {
                onError(error as Event);
            } else {
                // Default error handling
                toast({
                    title: "Error de conexión",
                    description: "Error al conectar con el servidor de eventos",
                    variant: "destructive"
                });
            }
        }
    }

    /**
     * Process SSE buffer and extract data lines
     */
    private processSSEBuffer(buffer: string, onMessage: (data: any) => void): void {
        const lines = buffer.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const jsonData = line.substring(6); // Remove "data: "
                    if (jsonData.trim()) {
                        const parsedData = JSON.parse(jsonData);
                        onMessage(parsedData);
                    }
                } catch (parseError) {
                    // Ignore parse errors for incomplete JSON chunks
                }
            }
        }
    }

    /**
     * Handle HTTP errors from the initial request
     */
    private async handleHttpError(response: Response): Promise<void> {
        const { status } = response;
        let errorMessage = `Error HTTP ${status}`;

        try {
            const errorData = await response.json();
            if (errorData.result?.mensaje) {
                errorMessage = errorData.result.mensaje;
            }
        } catch {
            // If we can't parse error data, use default message
        }

        switch (status) {
            case 401:
                // Clear JWT from sessionStorage
                sessionStorage.removeItem('jwt_token');
                toast({
                    title: "Error de autenticación",
                    description: "Sesión expirada",
                    variant: "destructive"
                });
                // Redirect to login after a brief delay
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
                break;

            case 403:
                toast({
                    title: "Acceso prohibido",
                    description: errorMessage,
                    variant: "destructive"
                });
                break;

            case 404:
                toast({
                    title: "No encontrado",
                    description: errorMessage,
                    variant: "destructive"
                });
                break;

            case 422:
                toast({
                    title: "Error de validación",
                    description: errorMessage,
                    variant: "destructive"
                });
                break;

            case 500:
                toast({
                    title: "Error del servidor",
                    description: errorMessage,
                    variant: "destructive"
                });
                break;

            default:
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive"
                });
        }

        throw new Error(errorMessage);
    }

    /**
     * Close the SSE connection
     */
    disconnect(): void {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }
}

// Create and export a singleton instance
export const sseClient = new SSEClient();

// Helper function for creating SSE connections
export const createSSEConnection = async (config: SSEConfig, requestBody?: SSERequestBody): Promise<void> => {
    return sseClient.connect(config, requestBody);
};

export default sseClient;