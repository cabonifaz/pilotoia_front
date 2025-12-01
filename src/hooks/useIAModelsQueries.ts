import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getModels, createModel } from '../api/iaModelsApi';
import type { ModelCreateRequest } from '@/types/iaModels';
import { toast } from './use-toast';

export const useGetModels = () => {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      return await getModels();
    },
    retry: false,
  });
};

export const useCreateModel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: ModelCreateRequest) => {
      return await createModel(request);
    },
    retry: false,
    onSuccess: (data) => {
      // Invalidate models query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['models'] });

      const successMessage = data.result?.mensaje || 'Modelo creado exitosamente';

      toast({
        title: 'Éxito',
        description: successMessage,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.result?.mensaje || 'Error al crear el modelo';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};
