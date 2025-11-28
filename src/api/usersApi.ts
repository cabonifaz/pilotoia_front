import apiClient from './apiClient';
import type { GetUsuariosResponse, CreateUserRequest, CreateUserResponse, UpdateUserRequest, UpdateUserResponse, UpdateUserStatusRequest, UpdateUserStatusResponse, UpdateUserPasswordRequest, UpdateUserPasswordResponse, UpdateUserAccessRequest, UpdateUserAccessResponse } from '@/types/users';

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

export const updateUsuarioPassword = async (
  request: UpdateUserPasswordRequest
): Promise<UpdateUserPasswordResponse> => {
  const response = await apiClient.put<UpdateUserPasswordResponse>(
    '/v1/users/update_usuario_password',
    request
  );
  return response.data;
};

export const updateUsuarioAccess = async (
  request: UpdateUserAccessRequest
): Promise<UpdateUserAccessResponse> => {
  const response = await apiClient.put<UpdateUserAccessResponse>(
    '/v1/users/update_usuario_access',
    request
  );
  return response.data;
};
