import apiClient from './apiClient';
import type { CreateCompanyRequest, CreateCompanyResponse, GetCompaniesResponse } from '@/types/company';

export const createCompany = async (
  request: CreateCompanyRequest
): Promise<CreateCompanyResponse> => {
  const response = await apiClient.post<CreateCompanyResponse>(
    '/v1/company/create_company',
    request
  );
  return response.data;
};

export const getCompanies = async (): Promise<GetCompaniesResponse> => {
  const response = await apiClient.get<GetCompaniesResponse>(
    '/v1/company/get_companies'
  );
  return response.data;
};
