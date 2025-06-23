import apiClient from './apiClient';
import type { MensajeResponse } from './interfaces/Mensaje';

export const authApi = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/auth/login', credentials);

        if (response.data.result.idTipoMensaje === 2) {
            sessionStorage.setItem('auth_token', response.data.token);
            return response.data;
        }

        return response.data;
    },

    logout: async () => {
        sessionStorage.removeItem('auth_token');
        window.dispatchEvent(new Event('storage'));
    },

    validateToken: async () => {
        try {
            const authToken = sessionStorage.getItem("auth_token");

            if (!authToken) return false;

            const response = await apiClient.get<ValidateTokenResponse>('/auth/validar-token', {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            return response.data;
        } catch (error) {
            if (!(error instanceof Error)) {
                console.error('Error al validar el token:', error);
            }
            return false;
        }
    },
};

interface LoginRequest {
    username: string;
    password: string;
}

interface LoginResponse {
    token: string;
    result: MensajeResponse;
}

interface ValidateTokenResponse {
    isValid: boolean;
    result: MensajeResponse;
}