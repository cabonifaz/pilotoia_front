import apiClient from './apiClient';
import type { CreateUserRequest, CreateUserResponse, UpdateUserRequest, UpdateUserResponse, UpdateUserStatusRequest, UpdateUserStatusResponse, UpdateUserPasswordRequest, UpdateUserPasswordResponse, UpdateUserAccessRequest, UpdateUserAccessResponse, GetUsuariosPaginatedResponse  } from '@/types/users';

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

export const getUsuariosPaginated = async (params: {
  id_empresa: number;
  num_pagina?: number;
  tam_pagina?: number;
  term_busqueda?: string;
  campo_orden?: string;
  dir_orden?: 'ASC' | 'DESC';
  filtro_estado?: number | null;
}): Promise<GetUsuariosPaginatedResponse> => {
  const response = await apiClient.get<GetUsuariosPaginatedResponse>(
    '/v1/users/get_usuarios_paginated',
    { params }
  );
  return response.data;
};