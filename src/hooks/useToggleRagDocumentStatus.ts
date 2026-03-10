import { useMutation, useQueryClient } from '@tanstack/react-query';
import { disableRagDocument, enableRagDocument } from '@/api/uploadApi';
import { useCurrentUser } from '@/hooks/useUserQueries';
import { toast } from '@/hooks/use-toast';

interface ToggleRagDocumentParams {
  idDocumento: number;
  idEmpresa: number;
  action: 'disable' | 'enable';
}

export const useToggleRagDocumentStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const companyId = user?.actual_company_area?.ID_EMPRESA;
  const areaId = user?.actual_company_area?.ID_AREA;

  return useMutation({
    mutationFn: ({ idDocumento, idEmpresa, action }: ToggleRagDocumentParams) =>
      action === 'disable'
        ? disableRagDocument(idDocumento, idEmpresa)
        : enableRagDocument(idDocumento, idEmpresa),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['rag-documents-paginated', companyId, areaId],
      });
      const label = variables.action === 'disable' ? 'deshabilitado' : 'habilitado';
      toast({
        title: 'Éxito',
        description: `Documento ${label} exitosamente`,
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
