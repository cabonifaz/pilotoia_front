import apiClient from './apiClient';
import type { CreateCompanyRequest, CreateCompanyResponse, UpdateCompanyStatusRequest, UpdateCompanyStatusResponse, CompanyLogin, GetCompaniesPaginatedResponse } from '@/types/company';

export const createCompany = async (
  request: CreateCompanyRequest
): Promise<CreateCompanyResponse> => {
  const response = await apiClient.post<CreateCompanyResponse>(
    '/v1/company/create_company',
    request
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

export const generateLogoPresignedUrl = async (
  id_empresa: number,
  logo_filename: string
): Promise<{ presigned_url: string; s3_key: string; logo_filename: string }> => {
  const response = await apiClient.post(
    '/v1/company/upload_logo',
    {
      id_empresa,
      logo_filename
    }
  );
  return response.data;
};

export const uploadLogoToS3 = async (
  presignedUrl: string,
  file: File
): Promise<void> => {
  // Use fetch for S3 presigned URL upload (not axios)
  // Do not add Content-Type header - it triggers CORS preflight
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload logo to S3: ${response.statusText}`);
  }
};


export const getCompaniesPaginated = async (
  page: number,
  page_size: number,
  search?: string,
  order_field: 'ID_EMPRESA' | 'RUC' | 'RAZON_SOCIAL' | 'FCHCRE' | 'ID_ESTADO_REGISTRO' = 'RAZON_SOCIAL',
  order_direction: 'ASC' | 'DESC' = 'ASC',
  status_filter: number | null = null  
): Promise<GetCompaniesPaginatedResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: page_size.toString(),
    order_field: order_field,
    order_direction: order_direction
  });

  if (search) {
    params.append('search', search);
  }

  if (status_filter !== null) {  // ✅ Solo agregar si no es null
    params.append('status_filter', status_filter.toString());
  }

  const response = await apiClient.get<GetCompaniesPaginatedResponse>(
    `/v1/company/get_companies_paginated?${params.toString()}`
  );
  return response.data;
};