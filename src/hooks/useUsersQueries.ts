import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createUsuario, updateUsuario, updateUsuarioStatus, updateUsuarioPassword, updateUsuarioAccess, getUsuariosPaginated } from '../api/usersApi';
import type { CreateUserRequest, UpdateUserRequest, UpdateUserStatusRequest, UpdateUserPasswordRequest, UpdateUserAccessRequest } from '@/types/users';
import { toast } from './use-toast';

export const useGetUsuariosPaginated = (
  id_empresa: number,
  num_pagina: number,
  tam_pagina: number,
  term_busqueda: string,
  campo_orden: string,
  dir_orden: 'ASC' | 'DESC',
  filtro_estado: number | null
) => {
  return useQuery({
    queryKey: ['usuarios-paginated', id_empresa, num_pagina, tam_pagina, term_busqueda, campo_orden, dir_orden, filtro_estado],
    queryFn: async () => {
      return await getUsuariosPaginated({
        id_empresa,
        num_pagina,
        tam_pagina,
        term_busqueda: term_busqueda || undefined,
        campo_orden,
        dir_orden,
        filtro_estado: filtro_estado,
      });
    },
    enabled: !!id_empresa && id_empresa > 0,
    staleTime: 0,
    retry: false,
  });
};

export const useCreateUsuario = (id_empresa: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateUserRequest) => {
      return await createUsuario(request);
    },
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-paginated', id_empresa] });

      // Get message from results array (SP response) or from result wrapper
      const successMessage = data.results?.[0]?.MENSAJE || data.result?.mensaje || 'Usuario creado exitosamente';

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
                          'Error al crear el usuario';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateUsuario = (id_empresa: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateUserRequest) => {
      return await updateUsuario(request);
    },
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-paginated', id_empresa] });

      // Get message from results array (SP response) or from result wrapper
      const successMessage = data.results?.[0]?.MENSAJE || data.result?.mensaje || 'Usuario actualizado exitosamente';

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
                          'Error al actualizar el usuario';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateUsuarioStatus = (id_empresa: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateUserStatusRequest) => {
      return await updateUsuarioStatus(request);
    },
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-paginated', id_empresa] });

      // Get message from results array (SP response) or from result wrapper
      const successMessage = data.results?.[0]?.MENSAJE || data.result?.mensaje || 'Estado del usuario actualizado exitosamente';

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
                          'Error al actualizar el estado del usuario';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateUsuarioPassword = (id_empresa: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateUserPasswordRequest) => {
      return await updateUsuarioPassword(request);
    },
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-paginated', id_empresa] });

      // Get message from results array (SP response) or from result wrapper
      const successMessage = data.results?.[0]?.MENSAJE || data.result?.mensaje || 'Contraseña del usuario actualizada exitosamente';

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
                          'Error al actualizar la contraseña del usuario';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateUsuarioAccess = (id_empresa: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateUserAccessRequest) => {
      return await updateUsuarioAccess(request);
    },
    retry: false,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios-paginated', id_empresa] });

      // Get message from results array (SP response) or from result wrapper
      const successMessage = data.results?.[0]?.MENSAJE || data.result?.mensaje || 'Acceso del usuario actualizado exitosamente';

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
                          'Error al actualizar el acceso del usuario';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};
