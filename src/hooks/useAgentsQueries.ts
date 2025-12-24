import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAgentes, createAgente } from '../api/agentsApi';
import type { CreateAgentRequest } from '@/types/agents';
import { toast } from './use-toast';

export const useGetAgentes = (id_empresa: number) => {
  return useQuery({
    queryKey: ['agentes', id_empresa],
    queryFn: async () => {
      return await getAgentes(id_empresa);
    },
    enabled: !!id_empresa && id_empresa > 0, // Only run when we have a valid company ID
    retry: false,
  });
};

export const useCreateAgente = (id_empresa: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateAgentRequest) => {
      return await createAgente(request);
    },
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agentes', id_empresa] });

      // Get message from results array (SP response) or from result wrapper
      const successMessage = data.results?.[0]?.MENSAJE || data.result?.mensaje || 'Agente creado exitosamente';

      toast({
        title: 'Éxito',
        description: successMessage,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error?.mensaje ||
                          error.response?.data?.detail?.mensaje ||
                          error.response?.data?.detail?.result?.mensaje ||
                          error.response?.data?.result?.mensaje ||
                          'Error al crear el agente';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};