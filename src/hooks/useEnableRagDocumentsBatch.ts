import { useMutation, useQueryClient } from '@tanstack/react-query';
import { enableRagDocument } from '@/api/uploadApi';
import { useCurrentUser } from '@/hooks/useUserQueries';
import { toast } from '@/hooks/use-toast';

interface EnableRagDocumentsBatchParams {
  idDocumentos: number[];
  idEmpresa: number;
}

export const useEnableRagDocumentsBatch = () => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const companyId = user?.actual_company_area?.ID_EMPRESA;
  const areaId = user?.actual_company_area?.ID_AREA;

  return useMutation({
    mutationFn: async ({ idDocumentos, idEmpresa }: EnableRagDocumentsBatchParams) => {
      for (const id of idDocumentos) {
        await enableRagDocument(id, idEmpresa);
      }
      return { enabled_count: idDocumentos.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['rag-documents-paginated', companyId, areaId],
      });
      toast({
        title: 'Documentos habilitados',
        description: `${data.enabled_count} documento(s) habilitado(s) exitosamente`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al habilitar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
