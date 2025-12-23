import apiClient from './apiClient';
import type { GetAgentesResponse, CreateAgentRequest, CreateAgentResponse } from '@/types/agents';

export const getAgentes = async (id_empresa: number): Promise<GetAgentesResponse> => {
  const response = await apiClient.get<GetAgentesResponse>(
    `/v1/agents/get_agentes/${id_empresa}`
  );
  return response.data;
};

export const createAgente = async (
  request: CreateAgentRequest
): Promise<CreateAgentResponse> => {
  const response = await apiClient.post<CreateAgentResponse>(
    '/v1/agents/create_agente',
    request
  );
  return response.data;
};