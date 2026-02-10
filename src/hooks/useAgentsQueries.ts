import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAgente,
  getAgentesPaginated,
  updateDatosAgente,
  updateAgenteStatus,
  updateAgenteOperativo,
  updateAgenteSecretKey,
  updateAgenteAccess,
} from '../api/agentsApi';
import type {
  CreateAgentRequest,
  UpdateAgentRequest,
  UpdateAgentStatusRequest,
  UpdateAgentOperativoRequest,
  UpdateAgentSecretKeyRequest,
  UpdateAgentAccessRequest,
} from '@/types/agents';
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
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
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

const extractErrorMessage = (error: any, fallback: string): string => {
  return error.response?.data?.error?.mensaje ||
    error.response?.data?.detail?.mensaje ||
    error.response?.data?.detail?.result?.mensaje ||
    error.response?.data?.result?.mensaje ||
    fallback;
};

const extractSuccessMessage = (data: any, fallback: string): string => {
  return data.results?.[0]?.MENSAJE || data.result?.mensaje || fallback;
};

export const useUpdateDatosAgente = (id_empresa: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateAgentRequest) => {
      return await updateDatosAgente(request);
    },
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agentes-paginated', id_empresa] });
      toast({
        title: 'Éxito',
        description: extractSuccessMessage(data, 'Datos del agente actualizados exitosamente'),
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: extractErrorMessage(error, 'Error al actualizar los datos del agente'),
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateAgenteStatus = (id_empresa: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateAgentStatusRequest) => {
      return await updateAgenteStatus(request);
    },
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agentes-paginated', id_empresa] });
      toast({
        title: 'Éxito',
        description: extractSuccessMessage(data, 'Estado del agente actualizado exitosamente'),
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: extractErrorMessage(error, 'Error al actualizar el estado del agente'),
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateAgenteOperativo = (id_empresa: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateAgentOperativoRequest) => {
      return await updateAgenteOperativo(request);
    },
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agentes-paginated', id_empresa] });
      toast({
        title: 'Éxito',
        description: extractSuccessMessage(data, 'Estado operativo del agente actualizado exitosamente'),
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: extractErrorMessage(error, 'Error al actualizar el estado operativo del agente'),
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateAgenteSecretKey = (id_empresa: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateAgentSecretKeyRequest) => {
      return await updateAgenteSecretKey(request);
    },
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agentes-paginated', id_empresa] });
      toast({
        title: 'Éxito',
        description: extractSuccessMessage(data, 'Secret key del agente regenerada exitosamente'),
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: extractErrorMessage(error, 'Error al regenerar la secret key del agente'),
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateAgenteAccess = (id_empresa: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateAgentAccessRequest) => {
      return await updateAgenteAccess(request);
    },
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agentes-paginated', id_empresa] });
      toast({
        title: 'Éxito',
        description: extractSuccessMessage(data, 'Acceso del agente actualizado exitosamente'),
        variant: 'success',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: extractErrorMessage(error, 'Error al actualizar el acceso del agente'),
        variant: 'destructive',
      });
    },
  });
};