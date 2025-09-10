import apiClient from './apiClient';
import type { MensajeResponse } from './interfaces/Mensaje';

export const authApi = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/v1/auth/login', credentials);  
        return response.data;
    },

    logout: async (userId?: number): Promise<LogoutResponse | void> => {
        try {
            if (userId) {
                const response = await apiClient.post<LogoutResponse>('/v1/auth/logout', { user_id: userId });
                authApi.clearUserSession();
                return response.data;
            } else {
                // Clear session if no user ID provided
                authApi.clearUserSession();
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Clear local session even if API call fails
            authApi.clearUserSession();
        }
    },

    getUserInfo: async (userId: number): Promise<UserInfo> => {
        const response = await apiClient.get<UserInfo>(`/v1/auth/user/${userId}`);
        return response.data;
    },


    // Session management now handled by React Context
    clearUserSession: (): void => {
        // Clear JWT from sessionStorage
        sessionStorage.removeItem('jwt_token');
        // Trigger storage event to notify other tabs
        window.dispatchEvent(new Event('storage'));
    }
};

export interface LoginRequest {
    usuario: string;
    clave_acceso: string;
}


export interface LoginResponse {
    token: string;  // JWT token containing all user information
    status: string;
}

export interface UserInfo {
    id_usuario: number;
    usuario: string;
    nombres: string;
    apellidos: string;
    email?: string;
    ultimo_ingreso?: string;
    id_estado_registro: number;
}

export interface LogoutResponse {
    result: MensajeResponse;
}