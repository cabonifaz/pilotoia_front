import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { MensajeResponse } from './interfaces/Mensaje';
import { toast } from '../hooks/use-toast';

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

// Create axios instance with base configuration
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = sessionStorage.getItem('auth_token');

        // If token exists, add to headers
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor
apiClient.interceptors.response.use(
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
                    // Error de autenticación - mostrar mensaje del servidor
                    if (mensaje) {
                        toast({
                            title: "Error de autenticación",
                            description: mensaje.mensaje,
                            variant: "destructive"
                        });
                    } else {
                        toast({
                            title: "Error de autenticación",
                            description: "Datos inválidos",
                            variant: "destructive"
                        });
                    }
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

                case 404:
                    // No encontrado
                    if (mensaje) {
                        toast({
                            title: "No encontrado",
                            description: mensaje.mensaje,
                            variant: "destructive"
                        });
                    } else {
                        toast({
                            title: "No encontrado",
                            description: "Recurso no encontrado",
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
                            description: "Error de validación",
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
                description: "Error inesperado",
                variant: "destructive"
            });
        }

        return Promise.reject(error);
    }
);

export default apiClient;