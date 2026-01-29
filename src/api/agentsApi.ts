import apiClient from './apiClient';
import type { CreateAgentRequest, CreateAgentResponse, GetAgentesPaginatedResponse } from '@/types/agents';

export const createAgente = async (
  request: CreateAgentRequest
): Promise<CreateAgentResponse> => {
  const response = await apiClient.post<CreateAgentResponse>(
    '/v1/agents/create_agente',
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