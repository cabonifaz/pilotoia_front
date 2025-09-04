import apiClient from './apiClient';
import type { MensajeResponse } from './interfaces/Mensaje';

export const authApi = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/v1/auth/login', credentials);
        
        // Save user session if login successful
        if (response.data.status === 'success') {
            authApi.saveUserSession(response.data);
        }
        
        return response.data;
    },

    logout: async (userId?: number): Promise<LogoutResponse | void> => {
        try {
            const currentUser = authApi.getCurrentUser();
            const userIdToLogout = userId || currentUser?.user_id;
            
            if (userIdToLogout) {
                const response = await apiClient.post<LogoutResponse>('/v1/auth/logout', { user_id: userIdToLogout });
                authApi.clearUserSession();
                return response.data;
            } else {
                // Just clear local session if no user ID
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

    // Session management helpers
    saveUserSession: (loginResponse: LoginResponse): void => {
        sessionStorage.setItem('user_session', JSON.stringify(loginResponse));
        if (loginResponse.token) {
            sessionStorage.setItem('auth_token', loginResponse.token);
        }
    },

    getUserSession: (): LoginResponse | null => {
        const sessionData = sessionStorage.getItem('user_session');
        return sessionData ? JSON.parse(sessionData) : null;
    },

    clearUserSession: (): void => {
        sessionStorage.removeItem('user_session');
        sessionStorage.removeItem('auth_token');
        window.dispatchEvent(new Event('storage')); // Notify other components
    },

    isAuthenticated: (): boolean => {
        const session = authApi.getUserSession();
        return session !== null && session.status === 'success';
    },

    getCurrentUser: (): LoginResponse | null => {
        return authApi.getUserSession();
    }
};

export interface LoginRequest {
    usuario: string;
    clave_acceso: string;
}

export interface LoginResponse {
    user_id: number;
    usuario: string;
    nombres: string;
    apellidos: string;
    email?: string;
    id_empresa: number;
    id_sucursal?: number;
    ultimo_ingreso?: string;
    token?: string;
    status: string;
}

export interface UserInfo {
    id_usuario: number;
    usuario: string;
    nombres: string;
    apellidos: string;
    email?: string;
    id_empresa: number;
    id_sucursal?: number;
    ultimo_ingreso?: string;
    id_estado_registro: number;
}

export interface LogoutResponse {
    result: MensajeResponse;
}