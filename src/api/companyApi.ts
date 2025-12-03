import apiClient from './apiClient';
import type { CreateCompanyRequest, CreateCompanyResponse, GetCompaniesResponse, UpdateCompanyStatusRequest, UpdateCompanyStatusResponse, CompanyLogin } from '@/types/company';

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

export const updateCompanyStatus = async (
  request: UpdateCompanyStatusRequest
): Promise<UpdateCompanyStatusResponse> => {
  const response = await apiClient.post<UpdateCompanyStatusResponse>(
    '/v1/company/update_company_status',
    request
  );
  return response.data;
};

export const getCompaniesLogin = async (): Promise<CompanyLogin[]> => {
  const response = await apiClient.get<CompanyLogin[]>(
    '/v1/company/get_companies_login'
  );
  return response.data;
};
