import apiClient from './apiClient';
import type { GetUsuariosResponse, CreateUserRequest, CreateUserResponse, UpdateUserRequest, UpdateUserResponse, UpdateUserStatusRequest, UpdateUserStatusResponse } from '@/types/users';

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

export const updateUsuario = async (
  request: UpdateUserRequest
): Promise<UpdateUserResponse> => {
  const response = await apiClient.put<UpdateUserResponse>(
    '/v1/users/update_usuario',
    request
  );
  return response.data;
};

export const updateUsuarioStatus = async (
  request: UpdateUserStatusRequest
): Promise<UpdateUserStatusResponse> => {
  const response = await apiClient.put<UpdateUserStatusResponse>(
    '/v1/users/update_usuario_status',
    request
  );
  return response.data;
};
