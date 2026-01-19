import apiClient from './apiClient';
import type { 
  CreateAreaRequest, 
  CreateAreaResponse, 
  GetAreasResponse, 
  GetAreasPaginatedResponse,
  UpdateAreaStatusRequest, 
  UpdateAreaNameRequest,
  GetAreasParams 
} from '@/types/area';
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

export const getAreasPaginated = async (
  params: GetAreasParams
): Promise<GetAreasPaginatedResponse> => {
  const queryParams = new URLSearchParams({
    num_pagina: params.num_pagina.toString(),
    tam_pagina: params.tam_pagina.toString(),
    campo_orden: params.campo_orden,
    dir_orden: params.dir_orden
  });

  if (params.term_busqueda) {
    queryParams.append('term_busqueda', params.term_busqueda);
  }

  if (params.filtro_estado !== null) {
    queryParams.append('filtro_estado', params.filtro_estado.toString());
  }

  const response = await apiClient.get<GetAreasPaginatedResponse>(
    `/v1/area/get_areas_paginated/${params.id_empresa}?${queryParams.toString()}`
  );
  return response.data;
};