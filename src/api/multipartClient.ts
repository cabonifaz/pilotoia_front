import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { MensajeResponse } from '@/types/Mensaje';
import { toast } from '../hooks/use-toast';

// JWT is now stored in sessionStorage and sent via Authorization header

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

interface ApiResponse {
    result: MensajeResponse;
    [key: string]: unknown;
}

const esApiResponse = (data: unknown): data is ApiResponse => {
    return (
        typeof data === 'object' &&
        data !== null &&
        'result' in data &&
        typeof (data as Record<string, unknown>).result === 'object' &&
        (data as Record<string, unknown>).result !== null &&
        typeof ((data as Record<string, unknown>).result as Record<string, unknown>).idTipoMensaje === 'number' &&
        typeof ((data as Record<string, unknown>).result as Record<string, unknown>).mensaje === 'string'
    );
};

const extraerMensaje = (data: unknown): MensajeResponse | null => {
    if (esApiResponse(data)) {
        return data.result;
    }

    return null;
};

// Create axios instance for multipart/form-data requests
const multipartClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        // Don't set Content-Type for multipart/form-data - browser will set it with boundary
    },
    withCredentials: false,  // No cookies needed - using Authorization header
    timeout: 300000, // 5 minutes timeout for large file uploads
});

// Request interceptor
multipartClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Get JWT from sessionStorage and add to Authorization header
        const token = sessionStorage.getItem('jwt_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // For multipart/form-data, let the browser set Content-Type with boundary
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor - same error handling as apiClient
multipartClient.interceptors.response.use(
    (response: AxiosResponse) => {
        const mensaje = extraerMensaje(response.data);

        if (mensaje && mensaje.idTipoMensaje !== 2) {
            toast({
                title: "Advertencia",
                description: mensaje.mensaje,
                variant: "warning"
            });
        }

        return response;
    },
    (error: AxiosError) => {
        if (error.response) {
            const { status, data } = error.response;
            const mensaje = extraerMensaje(data);

            switch (status) {
                case 401:
                    // Clear JWT from sessionStorage
                    sessionStorage.removeItem('jwt_token');

                    // Show error message
                    if (mensaje) {
                        toast({
                            title: "Error de autenticación",
                            description: mensaje.mensaje,
                            variant: "destructive"
                        });
                    } else {
                        toast({
                            title: "Error de autenticación",
                            description: "Sesión expirada",
                            variant: "destructive"
                        });
                    }

                    // Redirect to login after a brief delay for toast to show
                    setTimeout(() => {
                        window.location.href = '/#/';
                    }, 1000);
                    break;

                case 403:
                    // Prohibido
                    if (mensaje) {
                        toast({
                            title: "Acceso prohibido",
                            description: mensaje.mensaje,
                            variant: "destructive"
                        });
                    } else {
                        toast({
                            title: "Acceso prohibido",
                            description: "No tienes permisos para realizar esta acción",
                            variant: "destructive"
                        });
                    }
                    break;

                case 413:
                    // Payload too large
                    if (mensaje) {
                        toast({
                            title: "Archivo demasiado grande",
                            description: mensaje.mensaje,
                            variant: "destructive"
                        });
                    } else {
                        toast({
                            title: "Archivo demasiado grande",
                            description: "El archivo excede el tamaño máximo permitido",
                            variant: "destructive"
                        });
                    }
                    break;

                case 415:
                    // Unsupported media type
                    if (mensaje) {
                        toast({
                            title: "Tipo de archivo no soportado",
                            description: mensaje.mensaje,
                            variant: "destructive"
                        });
                    } else {
                        toast({
                            title: "Tipo de archivo no soportado",
                            description: "El tipo de archivo no está permitido",
                            variant: "destructive"
                        });
                    }
                    break;

                case 422:
                    // Error de validación
                    if (mensaje) {
                        toast({
                            title: "Error de validación",
                            description: mensaje.mensaje,
                            variant: "destructive"
                        });
                    } else {
                        toast({
                            title: "Error de validación",
                            description: "Error de validación de archivos",
                            variant: "destructive"
                        });
                    }
                    break;

                case 500:
                    // Error del servidor
                    if (mensaje) {
                        toast({
                            title: "Error del servidor",
                            description: mensaje.mensaje,
                            variant: "destructive"
                        });
                    } else {
                        toast({
                            title: "Error del servidor",
                            description: "Error interno del servidor",
                            variant: "destructive"
                        });
                    }
                    break;

                default:
                    // Otros errores HTTP
                    if (mensaje) {
                        toast({
                            title: "Error",
                            description: mensaje.mensaje,
                            variant: "destructive"
                        });
                    } else {
                        toast({
                            title: "Error",
                            description: `Error: ${status}`,
                            variant: "destructive"
                        });
                    }
            }
        } else if (error.request) {
            // Error de red/conexión
            toast({
                title: "Error de conexión",
                description: "Error de conexión. Verifica tu internet.",
                variant: "destructive"
            });
        } else {
            // Otro tipo de error
            toast({
                title: "Error inesperado",
                description: "Error inesperado durante la subida",
                variant: "destructive"
            });
        }

        return Promise.reject(error);
    }
);

export default multipartClient;