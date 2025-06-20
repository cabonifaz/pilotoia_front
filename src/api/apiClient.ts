import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = 'https://pilotoiabackendapis-ctfgcmc9hwdja4d6.canadacentral-01.azurewebsites.net';

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
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config;

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && originalRequest) {
            // Redirect to login page
            window.location.href = '/';
            return Promise.reject(error);
        }

        // Handle other errors
        return Promise.reject(error);
    }
);

export default apiClient;