import { useMutation, useQueryClient } from '@tanstack/react-query';
import { retryIngestion } from '../api/uploadApi';
import { useCurrentUser } from './useUserQueries';
import { toast } from './use-toast';

interface RetryIngestionParams {
  idDocumento: number;
  idEtapa: number;
}

export const useRetryIngestion = () => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const companyId = user?.actual_company_area?.ID_EMPRESA;
  const areaId = user?.actual_company_area?.ID_AREA;

  return useMutation({
    mutationFn: ({ idDocumento, idEtapa }: RetryIngestionParams) =>
      retryIngestion(idDocumento, idEtapa),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['rag-documents-paginated', companyId, areaId],
      });
      toast({
        title: 'Éxito',
        description: 'Proceso reintentado exitosamente',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Error al reintentar: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
