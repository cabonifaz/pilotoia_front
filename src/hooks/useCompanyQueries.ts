import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCompany, updateCompanyStatus, getCompaniesLogin, generateLogoPresignedUrl, uploadLogoToS3, getCompaniesPaginated } from '../api/companyApi';
import type { CreateCompanyRequest, UpdateCompanyStatusRequest } from '@/types/company';
import { toast } from './use-toast';

export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateCompanyRequest) => {
      return await createCompany(request);
    },
    retry: false,
    onSuccess: (data) => {
      // Invalidate user and company-areas queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'company-areas'] });
      queryClient.invalidateQueries({ queryKey: ['companies-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['companies-login'] });

      // Get message from results array (SP response) or from result wrapper
      const successMessage = data.results?.[0]?.MENSAJE || data.result?.mensaje || 'Empresa creada exitosamente';

      toast({
        title: 'Éxito',
        description: successMessage,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error?.result?.mensaje || 'Error al crear la empresa';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};



export const useUpdateCompanyStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateCompanyStatusRequest) => {
      return await updateCompanyStatus(request);
    },
    retry: false,
    onSuccess: (data) => {
      // Invalidate companies and company-areas queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['companies-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'company-areas'] });
      queryClient.invalidateQueries({ queryKey: ['companies-login'] });

      // Get message from results array (SP response) or from result wrapper
      const successMessage = data.results?.[0]?.MENSAJE || data.result?.mensaje || 'Estado de empresa actualizado exitosamente';

      toast({
        title: 'Éxito',
        description: successMessage,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error?.result?.mensaje || 'Error al actualizar el estado de la empresa';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

export const useGetCompaniesLogin = () => {
  return useQuery({
    queryKey: ['companies-login'],
    queryFn: getCompaniesLogin,
    staleTime: 60 * 60 * 1000, // 1 hour - backend caches for 1 day
    gcTime: 2 * 60 * 60 * 1000, // 2 hours - keep in memory longer
  });
};

export const useUploadCompanyLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id_empresa, logoFile }: { id_empresa: number; logoFile: File }) => {
      try {
        // Step 1: Get presigned URL from backend (this also updates DB)
        const presignedResponse = await generateLogoPresignedUrl(id_empresa, logoFile.name);

        // Step 2: Upload file to S3 using presigned URL
        await uploadLogoToS3(presignedResponse.presigned_url, logoFile);

        return presignedResponse;
      } catch (error) {
        console.error('Logo upload error:', error);
        throw error;
      }
    },
    retry: false,
    onSuccess: () => {
      // Invalidate queries to refetch with updated logo
      queryClient.invalidateQueries({ queryKey: ['companies-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'company-areas'] });
      queryClient.invalidateQueries({ queryKey: ['companies-login'] });

      toast({
        title: 'Éxito',
        description: 'Logo subido correctamente',
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.result?.mensaje || error.message || 'Error al subir el logo';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

export const useGetCompaniesPaginated = (
  page: number,
  pageSize: number,
  search: string,
  orderField: 'ID_EMPRESA' | 'RUC' | 'RAZON_SOCIAL' | 'FCHCRE' | 'ID_ESTADO_REGISTRO' = 'RAZON_SOCIAL',
  orderDirection: 'ASC' | 'DESC' = 'ASC',
  statusFilter: number | null = null  
) => {
  return useQuery({
    queryKey: ['companies-paginated', page, pageSize, search, orderField, orderDirection, statusFilter],
    queryFn: async () => {
      return await getCompaniesPaginated(page, pageSize, search, orderField, orderDirection, statusFilter);
    },
    retry: false,
    placeholderData: (previousData) => previousData,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
};
