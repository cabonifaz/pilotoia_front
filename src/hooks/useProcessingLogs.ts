import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { batchDeleteKnowledge, getCompanyRagDocumentsPaginated } from '@/api/uploadApi';
import { useCurrentUser } from '@/hooks/useUserQueries';
import { toast } from '@/hooks/use-toast';
import type { RagDocumentRecord } from '@/types/upload';

export const useProcessingLogsPaginated = (
  page: number,
  pageSize: number,
  searchTerm: string,
  orderField: 'NOMBRE_DOCUMENTO' | 'FCHCRE' | 'ID_ESTADO_PROCESO' | 'FCH_INICIO' | 'FCH_FIN' | 'DURACION_SEG',
  orderDirection: 'ASC' | 'DESC',
  statusFilter: number | null,
  showDisabled: boolean = false,
) => {
  const { user } = useCurrentUser();
  const companyId = user?.actual_company_area?.ID_EMPRESA;
  const areaId = user?.actual_company_area?.ID_AREA;

  const pollingInterval = Number(import.meta.env.VITE_POLLING_INTERVAL) || 30000;

  return useQuery({
    queryKey: ['rag-documents-paginated', companyId, areaId, page, pageSize, searchTerm, orderField, orderDirection, statusFilter, showDisabled],
    queryFn: () =>
      getCompanyRagDocumentsPaginated(
        companyId!,
        areaId!,
        page,
        pageSize,
        searchTerm,
        orderField,
        orderDirection,
        statusFilter !== null ? statusFilter : undefined,
        showDisabled,
      ),
    enabled: !!companyId && !!areaId,
    retry: false,
    placeholderData: (prev) => prev,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasProcessing = data?.registros?.some(
        (doc: RagDocumentRecord) => doc.ID_ESTADO_PROCESO !== 7 && doc.ID_ESTADO_PROCESO !== 8
      );
      return hasProcessing ? pollingInterval : false;
    }
  });
};

export const useDeleteKnowledge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (idCargas: number[]) => batchDeleteKnowledge(idCargas),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['knowledge-paginated'],
        refetchType: 'active'
      });

      toast({
        title: "Documentos eliminados",
        description: `${data.deleted_count} documento(s) eliminado(s) exitosamente`,
        variant: "default"
      });
    },
    onError: (error: Error) => {
      console.error('Error deleting knowledge:', error);
    }
  });
};
