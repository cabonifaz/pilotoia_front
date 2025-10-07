import apiClient from './apiClient';

interface ExternalLoginCredentials {
  username: string;
  password: string;
}

interface ExternalLoginResponse {
  token: string;
  result: {
    idMensaje: number;
    mensaje: string;
  };
}

export const externalApi = {
  /**
   * Login to external system using the configured API client
   */
  async login(credentials: ExternalLoginCredentials): Promise<ExternalLoginResponse> {
    try {
      const response = await apiClient.post('/v1/external/login', credentials);
      const data = response.data;

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.token) {
        throw new Error('Invalid response: no token received');
      }

      return data;
    } catch (error: any) {
      // Re-throw axios errors as simple Error for consistency
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }
};

export type { ExternalLoginCredentials, ExternalLoginResponse };