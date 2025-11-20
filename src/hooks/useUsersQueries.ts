import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUsuarios, createUsuario } from '../api/usersApi';
import type { CreateUserRequest } from '@/types/users';
import { toast } from './use-toast';

export const useGetUsuarios = (id_empresa: number) => {
  return useQuery({
    queryKey: ['usuarios', id_empresa],
    queryFn: async () => {
      return await getUsuarios(id_empresa);
    },
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
      queryClient.invalidateQueries({ queryKey: ['usuarios', id_empresa] });

      // Get message from results array (SP response) or from result wrapper
      const successMessage = data.results?.[0]?.MENSAJE || data.result?.mensaje || 'Usuario creado exitosamente';

      toast({
        title: 'Éxito',
        description: successMessage,
        variant: 'success',
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error?.result?.mensaje || 'Error al crear el usuario';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};
