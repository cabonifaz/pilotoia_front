import apiClient from './apiClient';
import type { LoginRequest, LoginResponse, LogoutResponse } from '@/types/auth';

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

    getCompanyAreas: async (): Promise<any[]> => {
        const response = await apiClient.get<{ company_areas: any[] }>('/v1/auth/company-areas');
        return response.data.company_areas;
    },

    // Session management now handled by React Context
    clearUserSession: (): void => {
        // Clear JWT from sessionStorage
        sessionStorage.removeItem('jwt_token');
        // Trigger storage event to notify other tabs
        window.dispatchEvent(new Event('storage'));
    }
} as const;