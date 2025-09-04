import apiClient from './apiClient';
import type { MensajeResponse } from './interfaces/Mensaje';

export const authApi = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        console.log('*** API CLIENT - SENDING LOGIN REQUEST ***', credentials);
        const response = await apiClient.post<LoginResponse>('/v1/auth/login', credentials);
        
        console.log('*** API CLIENT - LOGIN RESPONSE STATUS ***', response.status);
        console.log('*** API CLIENT - LOGIN RESPONSE DATA ***', response.data);
        console.log('*** API CLIENT - RESPONSE DATA TYPE ***', typeof response.data);
        
        // Login successful - user data will be stored in React Context
        // HttpOnly JWT cookie is set by server automatically
        
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
        // HttpOnly JWT cookie is cleared by server during logout automatically
        // Trigger storage event to notify other tabs
        window.dispatchEvent(new Event('storage'));
        console.log('*** SESSION CLEARED - USING REACT CONTEXT ***');
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
    // User role information for display
    id_tipo_rol: number;
    rol_nombre: string;  // STRING1 from the SP
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