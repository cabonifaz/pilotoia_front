import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createAgente, getAgentesPaginated } from '../api/agentsApi';
import type { CreateAgentRequest } from '@/types/agents';
import { toast } from './use-toast';

export const useGetAgentesPaginated = (
  id_empresa: number,
  num_pagina: number,
  tam_pagina: number,
  term_busqueda: string,
  campo_orden: string,
  dir_orden: 'ASC' | 'DESC',
  filtro_estado: number | null,
  filtro_operativo: number | null
) => {
  return useQuery({
    queryKey: ['agentes-paginated', id_empresa, num_pagina, tam_pagina, term_busqueda, campo_orden, dir_orden, filtro_estado, filtro_operativo],
    queryFn: async () => {
      return await getAgentesPaginated({
        id_empresa,
        num_pagina,
        tam_pagina,
        term_busqueda: term_busqueda || undefined,
        campo_orden,
        dir_orden,
        filtro_estado,
        filtro_operativo,
      });
    },
    enabled: !!id_empresa && id_empresa > 0,
    staleTime: 30000, // 30 seconds
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
      queryClient.invalidateQueries({ queryKey: ['agentes-paginated', id_empresa] });

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