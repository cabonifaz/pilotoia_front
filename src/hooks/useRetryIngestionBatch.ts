import { useMutation, useQueryClient } from '@tanstack/react-query';
import { retryIngestionBatch } from '@/api/uploadApi';
import { useCurrentUser } from '@/hooks/useUserQueries';
import { toast } from '@/hooks/use-toast';

interface RetryIngestionBatchParams {
  idDocumentos: number[];
  idEmpresa: number;
  idEtapa: number;
}

export const useRetryIngestionBatch = () => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const companyId = user?.actual_company_area?.ID_EMPRESA;
  const areaId = user?.actual_company_area?.ID_AREA;

  return useMutation({
    mutationFn: ({ idDocumentos, idEmpresa, idEtapa }: RetryIngestionBatchParams) =>
      retryIngestionBatch(idDocumentos, idEmpresa, idEtapa),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['rag-documents-paginated', companyId, areaId],
      });
      const failed = data.failed_count ?? 0;
      const total = data.results?.length ?? 0;
      toast({
        title: 'Reintento iniciado',
        description: failed > 0
          ? `${total - failed} de ${total} documento(s) encolados. ${failed} fallaron.`
          : `${total} documento(s) enviados a reintento exitosamente`,
        variant: failed > 0 ? 'default' : 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al reintentar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
