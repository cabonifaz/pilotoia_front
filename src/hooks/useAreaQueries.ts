import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createArea, getAreas } from '../api/areaApi';
import type { CreateAreaRequest } from '@/types/area';
import { toast } from './use-toast';

export const useCreateArea = (id_empresa: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateAreaRequest) => {
      return await createArea(request);
    },
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['areas', id_empresa] });
      queryClient.invalidateQueries({ queryKey: ['user', 'company-areas'] });

      // Get message from results array (SP response) or from result wrapper
      const successMessage = data.results?.[0]?.MENSAJE || data.result?.mensaje || 'Area creada exitosamente';

      toast({
        title: 'Éxito',
        description: successMessage,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error?.result?.mensaje || 'Error al crear el area';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

export const useGetAreas = (id_empresa: number) => {
  return useQuery({
    queryKey: ['areas', id_empresa],
    queryFn: async () => {
      return await getAreas(id_empresa);
    },
    retry: false,
  });
};
