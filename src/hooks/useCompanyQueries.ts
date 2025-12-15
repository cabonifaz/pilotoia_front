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
  const CACHE_DURATION = import.meta.env.VITE_COMPANIES_CACHE_DURATION
    ? Number(import.meta.env.VITE_COMPANIES_CACHE_DURATION)
    : 2 * 60 * 60 * 1000; // Default: 2 hours in milliseconds
  const STORAGE_KEY = 'companies-login';

  return useQuery({
    queryKey: ['companies-login'],
    queryFn: async () => {
      const data = await getCompaniesLogin();
      // Store in localStorage with timestamp for expiration tracking
      const cacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
      return data;
    },
    initialData: () => {
      // Load from localStorage on initial load
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return undefined;

      try {
        const cacheData = JSON.parse(stored);

        // Check if cache has expired (older than 2 hours)
        const isExpired = Date.now() - cacheData.timestamp > CACHE_DURATION;

        if (isExpired) {
          // Clean up expired data
          localStorage.removeItem(STORAGE_KEY);
          return undefined;
        }

        return cacheData.data;
      } catch {
        // Invalid cache data, remove it
        localStorage.removeItem(STORAGE_KEY);
        return undefined;
      }
    },
    staleTime: CACHE_DURATION, // 2 hours
    gcTime: CACHE_DURATION, // 2 hours
    retry: false,
  });
};
