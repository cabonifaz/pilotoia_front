import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getIaAreaConfig, updateIaAreaConfig } from '../api/iaConfigApi';
import type { UpdateIaAreaConfigRequest } from '@/types/aiConfig';
import { toast } from './use-toast';

export const useGetIaAreaConfig = (id_empresa: number, id_area: number) => {
  return useQuery({
    queryKey: ['ia_config', id_empresa, id_area],
    queryFn: async () => {
      return await getIaAreaConfig(id_empresa, id_area);
    },
    enabled: id_area !== null && id_area !== undefined,
    retry: false,
    staleTime: 1000 * 60 * 60, // 1 hour in milliseconds
  });
};

export const useUpdateIaAreaConfig = (id_empresa: number, id_area: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateIaAreaConfigRequest) => {
      return await updateIaAreaConfig(request);
    },
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ia_config', id_empresa, id_area] });
      queryClient.invalidateQueries({ queryKey: ['user', 'company-areas'] });

      const successMessage = data.result?.mensaje || 'Configuración del área IA actualizada exitosamente';

      toast({
        title: 'Éxito',
        description: successMessage,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.result?.mensaje || 'Error al actualizar la configuración del área IA';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};
