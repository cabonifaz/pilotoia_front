import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteRagDocuments } from '@/api/uploadApi';
import { useCurrentUser } from '@/hooks/useUserQueries';
import { toast } from '@/hooks/use-toast';

interface DeleteRagDocumentsParams {
  idDocumentos: number[];
  idEmpresa: number;
}

export const useDeleteRagDocuments = () => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const companyId = user?.actual_company_area?.ID_EMPRESA;
  const areaId = user?.actual_company_area?.ID_AREA;

  return useMutation({
    mutationFn: ({ idDocumentos, idEmpresa }: DeleteRagDocumentsParams) =>
      deleteRagDocuments(idDocumentos, idEmpresa),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['rag-documents-paginated', companyId, areaId],
      });
      toast({
        title: 'Documentos eliminados',
        description: `${data.deleted_count} documento(s) eliminado(s) exitosamente`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al eliminar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
