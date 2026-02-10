import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createArea, getAreas, getAreasPaginated, updateAreaStatus, updateAreaName } from '../api/areaApi';
import type { CreateAreaRequest, UpdateAreaStatusRequest, UpdateAreaNameRequest } from '@/types/area';
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
      queryClient.invalidateQueries({ queryKey: ['areas-paginated'] });
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

export const useGetAreasPaginated = (
  id_empresa: number,
  page: number,
  pageSize: number,
  search: string,
  orderField: 'AREA' | 'FCHCRE' | 'ID_ESTADO_REGISTRO',
  orderDirection: 'ASC' | 'DESC',
  statusFilter: number | null
) => {
  return useQuery({
    queryKey: ['areas-paginated', id_empresa, page, pageSize, search, orderField, orderDirection, statusFilter],
    queryFn: () =>
      getAreasPaginated({
        id_empresa,
        num_pagina: page,
        tam_pagina: pageSize,
        term_busqueda: search,
        campo_orden: orderField,
        dir_orden: orderDirection,
        filtro_estado: statusFilter
      }),
    retry: false,

    placeholderData: (prev) => prev,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
};
