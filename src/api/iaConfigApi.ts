import apiClient from './apiClient';
import type { UpdateIaAreaConfigRequest, IaConfigResponse, GetIaAreaConfigResponse } from '@/types/aiConfig';

export const getIaAreaConfig = async (
  id_empresa: number,
  id_area: number
): Promise<GetIaAreaConfigResponse> => {
  const response = await apiClient.post<GetIaAreaConfigResponse>(
    '/v1/ia_config/get_ia_area_config',
    { id_empresa, id_area }
  );
  return response.data;
};

export const updateIaAreaConfig = async (
  request: UpdateIaAreaConfigRequest
): Promise<IaConfigResponse> => {
  const response = await apiClient.post<IaConfigResponse>(
    '/v1/ia_config/update_ia_area_config',
    request
  );
  return response.data;
};
