import axios from 'axios';
import apiClient from './apiClient';

export const authApi = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        try {
            const response = await apiClient.post('/login', credentials);

            if (response.data.token) {
                sessionStorage.setItem('auth_token', response.data.token);
                return response.data;
            }

            return response.data;
        } catch (error) {
            console.error('Error durante el login:', error);
            throw error;
        }
    },

    logout: async () => {
        sessionStorage.removeItem('auth_token');
        window.dispatchEvent(new Event('storage'));
    },

    validateToken: async (token: string) => {
        try {
            const response = await axios.get('/api/auth/validate', {
                headers: { Authorization: `Bearer ${token}` },
            });
            return response.data.isValid;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            console.error('Error al validar el token:');
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
    user: {
        id: string;
        username: string;
        email: string;
        role: string;
    };
}