import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import type { MensajeResponse } from './interfaces/Mensaje';
import { toast } from '../components/Toast/ToastService';

const API_BASE_URL = 'https://pilotoia-backend-b3h0h7afg8aea3dz.canadacentral-01.azurewebsites.net/api';

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
            toast(mensaje.mensaje, { type: "warning" });
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
                        toast(mensaje.mensaje, { type: "warning" });
                    } else {
                        toast("Datos inválidas", { type: "warning" });
                    }
                    break;

                case 403:
                    // Prohibido
                    if (mensaje) {
                        toast(mensaje.mensaje, { type: "error" });
                    } else {
                        toast("No tienes permisos para realizar esta acción", { type: "error" });
                    }
                    break;

                case 404:
                    // No encontrado
                    if (mensaje) {
                        toast(mensaje.mensaje, { type: "error" });
                    } else {
                        toast("Recurso no encontrado", { type: "error" });
                    }
                    break;

                case 422:
                    // Error de validación
                    if (mensaje) {
                        toast(mensaje.mensaje, { type: "warning" });
                    } else {
                        toast("Error de validación", { type: "warning" });
                    }
                    break;

                case 500:
                    // Error del servidor
                    if (mensaje) {
                        toast(mensaje.mensaje, { type: "error" });
                    } else {
                        toast("Error interno del servidor", { type: "error" });
                    }
                    break;

                default:
                    // Otros errores HTTP
                    if (mensaje) {
                        toast(mensaje.mensaje, { type: "error" });
                    } else {
                        toast(`Error: ${status}`, { type: "error" });
                    }
            }
        } else if (error.request) {
            // Error de red/conexión
            toast("Error de conexión. Verifica tu internet.", { type: "error" });
        } else {
            // Otro tipo de error
            toast("Error inesperado", { type: "error" });
        }

        return Promise.reject(error);
    }
);

export default apiClient;