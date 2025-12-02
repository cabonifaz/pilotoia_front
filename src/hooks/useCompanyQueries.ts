import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCompany, getCompanies, updateCompanyStatus, getCompaniesLogin } from '../api/companyApi';
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
      queryClient.invalidateQueries({ queryKey: ['companies'] });

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

export const useGetCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      return await getCompanies();
    },
    retry: false,
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
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'company-areas'] });

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
    queryFn: async () => {
      const data = await getCompaniesLogin();
      // Store in localStorage for persistence across page reloads
      localStorage.setItem('companies-login', JSON.stringify(data));
      return data;
    },
    initialData: () => {
      // Load from localStorage on initial load
      const stored = localStorage.getItem('companies-login');
      return stored ? JSON.parse(stored) : undefined;
    },
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    gcTime: 12 * 60 * 60 * 1000, // 12 hours
    retry: false,
  });
};
