import apiClient from './apiClient';
import type { CreateAreaRequest, CreateAreaResponse, GetAreasResponse, UpdateAreaStatusRequest, UpdateAreaNameRequest } from '@/types/area';

export const createArea = async (
  request: CreateAreaRequest
): Promise<CreateAreaResponse> => {
  const response = await apiClient.post<CreateAreaResponse>(
    '/v1/area/create_area',
    request
  );
  return response.data;
};

export const getAreas = async (id_empresa: number): Promise<GetAreasResponse> => {
  const response = await apiClient.get<GetAreasResponse>(
    `/v1/area/get_areas/${id_empresa}`
  );
  return response.data;
};

export const updateAreaStatus = async (
  request: UpdateAreaStatusRequest
): Promise<CreateAreaResponse> => {
  const response = await apiClient.post<CreateAreaResponse>(
    '/v1/area/update_area_status',
    request
  );
  return response.data;
};

export const updateAreaName = async (
  request: UpdateAreaNameRequest
): Promise<CreateAreaResponse> => {
  const response = await apiClient.post<CreateAreaResponse>(
    '/v1/area/update_area_name',
    request
  );
  return response.data;
};
