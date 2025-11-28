import apiClient from './apiClient';
import type { GetModelsResponse, ModelCreateRequest, CreateModelResponse } from '@/types/iaModels';

export const getModels = async (): Promise<GetModelsResponse> => {
  const response = await apiClient.get<GetModelsResponse>(
    '/v1/ia_models/get_models'
  );
  return response.data;
};

export const createModel = async (request: ModelCreateRequest): Promise<CreateModelResponse> => {
  const response = await apiClient.post<CreateModelResponse>(
    '/v1/ia_models/create_model',
    request
  );
  return response.data;
};
