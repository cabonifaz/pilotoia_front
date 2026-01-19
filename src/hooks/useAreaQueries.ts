import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createArea, getAreas, getAreasPaginated, updateAreaStatus, updateAreaName } from '../api/areaApi';
import type { CreateAreaRequest, UpdateAreaStatusRequest, UpdateAreaNameRequest, GetAreasParams } from '@/types/area';
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
    enabled: !!id_empresa && id_empresa > 0, // Only run when we have a valid company ID
    retry: false,
  });
};

export const useUpdateAreaStatus = (id_empresa: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateAreaStatusRequest) => {
      return await updateAreaStatus(request);
    },
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['areas', id_empresa] });
      queryClient.invalidateQueries({ queryKey: ['areas-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'company-areas'] });

      // Get message from results array (SP response) or from result wrapper
      const successMessage = data.results?.[0]?.MENSAJE || data.result?.mensaje || 'Estado del area actualizado exitosamente';

      toast({
        title: 'Éxito',
        description: successMessage,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error?.result?.mensaje || 'Error al actualizar el estado del area';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateAreaName = (id_empresa: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateAreaNameRequest) => {
      return await updateAreaName(request);
    },
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['areas', id_empresa] });
      queryClient.invalidateQueries({ queryKey: ['areas-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'company-areas'] });

      // Get message from results array (SP response) or from result wrapper
      const successMessage = data.results?.[0]?.MENSAJE || data.result?.mensaje || 'Nombre del area actualizado exitosamente';

      toast({
        title: 'Éxito',
        description: successMessage,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error?.result?.mensaje || 'Error al actualizar el nombre del area';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

export const useGetAreasPaginated = (params: GetAreasParams) => {
  return useQuery({
    queryKey: [
      'areas-paginated',
      params.id_empresa,
      params.num_pagina,
      params.tam_pagina,
      params.term_busqueda,
      params.campo_orden,
      params.dir_orden
    ],
    queryFn: async () => {
      return await getAreasPaginated(params);
    },
    enabled: !!params.id_empresa && params.id_empresa > 0,
    retry: false,
    staleTime: 0,
    gcTime: 60000,
  });
};