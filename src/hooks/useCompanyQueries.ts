import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCompany } from '../api/companyApi';
import type { CreateCompanyRequest } from '@/types/company';
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
      queryClient.invalidateQueries({ queryKey: ['company-areas'] });

      toast({
        title: 'Éxito',
        description: data.result.mensaje || 'Empresa creada exitosamente',
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
