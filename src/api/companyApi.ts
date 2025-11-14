import apiClient from './apiClient';
import type { CreateCompanyRequest, CreateCompanyResponse } from '@/types/company';

export const createCompany = async (
  request: CreateCompanyRequest
): Promise<CreateCompanyResponse> => {
  const response = await apiClient.post<CreateCompanyResponse>(
    '/v1/company/create_company',
    request
  );
  return response.data;
};
