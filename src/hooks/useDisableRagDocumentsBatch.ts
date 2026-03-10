import { useMutation, useQueryClient } from '@tanstack/react-query';
import { disableRagDocumentsBatch } from '@/api/uploadApi';
import { useCurrentUser } from '@/hooks/useUserQueries';
import { toast } from '@/hooks/use-toast';

interface DisableRagDocumentsBatchParams {
  idDocumentos: number[];
  idEmpresa: number;
}

export const useDisableRagDocumentsBatch = () => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const companyId = user?.actual_company_area?.ID_EMPRESA;
  const areaId = user?.actual_company_area?.ID_AREA;

  return useMutation({
    mutationFn: ({ idDocumentos, idEmpresa }: DisableRagDocumentsBatchParams) =>
      disableRagDocumentsBatch(idDocumentos, idEmpresa),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['rag-documents-paginated', companyId, areaId],
      });
      toast({
        title: 'Documentos deshabilitados',
        description: `${data.disabled_count} documento(s) deshabilitado(s) exitosamente`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al deshabilitar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
