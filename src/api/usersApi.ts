import apiClient from './apiClient';
import type { GetUsuariosResponse, CreateUserRequest, CreateUserResponse } from '@/types/users';

export const getUsuarios = async (id_empresa: number): Promise<GetUsuariosResponse> => {
  const response = await apiClient.get<GetUsuariosResponse>(
    `/v1/users/get_usuarios/${id_empresa}`
  );
  return response.data;
};

export const createUsuario = async (
  request: CreateUserRequest
): Promise<CreateUserResponse> => {
  const response = await apiClient.post<CreateUserResponse>(
    '/v1/users/create_usuario',
    request
  );
  return response.data;
};
