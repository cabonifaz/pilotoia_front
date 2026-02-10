import apiClient from './apiClient';
import type {
  CreateAgentRequest,
  CreateAgentResponse,
  GetAgentesPaginatedResponse,
  UpdateAgentRequest,
  UpdateAgentStatusRequest,
  UpdateAgentOperativoRequest,
  UpdateAgentSecretKeyRequest,
  UpdateAgentAccessRequest,
  UpdateAgentResponse,
} from '@/types/agents';

export const createAgente = async (
  request: CreateAgentRequest
): Promise<CreateAgentResponse> => {
  const response = await apiClient.post<CreateAgentResponse>(
    '/v1/agents/create_agente',
    request
  );
  return response.data;
};

export const updateDatosAgente = async (
  request: UpdateAgentRequest
): Promise<UpdateAgentResponse> => {
  const response = await apiClient.put<UpdateAgentResponse>(
    '/v1/agents/update_datos_agente',
    request
  );
  return response.data;
};

export const updateAgenteStatus = async (
  request: UpdateAgentStatusRequest
): Promise<UpdateAgentResponse> => {
  const response = await apiClient.put<UpdateAgentResponse>(
    '/v1/agents/update_agente_status',
    request
  );
  return response.data;
};

export const updateAgenteOperativo = async (
  request: UpdateAgentOperativoRequest
): Promise<UpdateAgentResponse> => {
  const response = await apiClient.put<UpdateAgentResponse>(
    '/v1/agents/update_agente_operativo',
    request
  );
  return response.data;
};

export const updateAgenteSecretKey = async (
  request: UpdateAgentSecretKeyRequest
): Promise<UpdateAgentResponse> => {
  const response = await apiClient.put<UpdateAgentResponse>(
    '/v1/agents/update_agente_secret_key',
    request
  );
  return response.data;
};

export const updateAgenteAccess = async (
  request: UpdateAgentAccessRequest
): Promise<UpdateAgentResponse> => {
  const response = await apiClient.put<UpdateAgentResponse>(
    '/v1/agents/update_agente_access',
    request
  );
  return response.data;
};

export const getAgentesPaginated = async (params: {
  id_empresa: number;
  num_pagina?: number;
  tam_pagina?: number;
  term_busqueda?: string;
  campo_orden?: string;
  dir_orden?: 'ASC' | 'DESC';
  filtro_estado?: number | null;
  filtro_operativo?: number | null;
}): Promise<GetAgentesPaginatedResponse> => {
  const response = await apiClient.get<GetAgentesPaginatedResponse>(
    '/v1/agents/get_agentes_paginated',
    { params }
  );
  return response.data;
};