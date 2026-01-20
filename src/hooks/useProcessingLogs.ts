import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCompanyUploads, batchDeleteKnowledge, getCompanyUploadsPaginated } from '@/api/uploadApi';
import { useCurrentUser } from '@/hooks/useUserQueries';
import type { KnowledgeLoadResponse } from '@/types/upload';
import { toast } from '@/hooks/use-toast';


interface UseProcessingLogsOptions {
  enabled?: boolean;
  refetchInterval?: number | false | ((query: { state: { data: KnowledgeLoadResponse[] | undefined } }) => number | false);
}

export const useProcessingLogs = ({
  enabled = true,
  refetchInterval
}: UseProcessingLogsOptions) => {
  // Get company_id from current user's actual_company_area
  const { user } = useCurrentUser();
  const companyId = user?.actual_company_area?.ID_EMPRESA;
  const areaId = user?.actual_company_area?.ID_AREA;

  return useQuery<KnowledgeLoadResponse[], Error>({
    queryKey: ['knowledge', companyId, areaId],
    queryFn: () => getCompanyUploads(companyId!, areaId!),
    enabled: enabled && !!companyId && !!areaId,
    refetchInterval,
    staleTime: 20 * 60 * 1000, // 20 minutes
  });
};

export const useProcessingLogsPaginated = (
  page: number,
  pageSize: number,
  searchTerm: string,
  orderField: 'NOMBRE_DOCUMENTO' | 'FCHMOD' | 'FCHCRE' | 'ID_ESTADO_PROCESO' | 'AREA' | 'USUARIO_CARGA' | 'EMBEDDING_MODEL' | 'FCH_EXTRACCION' | 'FCH_SEGMENTACION' | 'FCH_VECTORIZACION',
  orderDirection: 'ASC' | 'DESC',
  statusFilter: number | null
) => {
  const { user } = useCurrentUser();
  const companyId = user?.actual_company_area?.ID_EMPRESA;
  const areaId = user?.actual_company_area?.ID_AREA;

  return useQuery({
    queryKey: ['knowledge-paginated', companyId, areaId, page, pageSize, searchTerm, orderField, orderDirection, statusFilter],
    queryFn: () =>
      getCompanyUploadsPaginated(
        companyId!,
        areaId,
        page,
        pageSize,
        searchTerm,
        orderField,
        orderDirection,
        statusFilter !== null ? statusFilter : undefined
      ),
    enabled: !!companyId,
    retry: false,
    placeholderData: (prev) => prev,
    staleTime: 0,
    gcTime: 0
  });
};

export const useDeleteKnowledge = () => {
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  const companyId = user?.actual_company_area?.ID_EMPRESA;
  const areaId = user?.actual_company_area?.ID_AREA;

  return useMutation({
    mutationFn: (idCargas: number[]) => batchDeleteKnowledge(idCargas),
    onSuccess: (data) => {
      // Invalidate and refetch knowledge query
      queryClient.invalidateQueries({ queryKey: ['knowledge', companyId, areaId] });

      // Show success toast
      toast({
        title: "Documentos eliminados",
        description: `${data.deleted_count} documento(s) eliminado(s) exitosamente`,
        variant: "default"
      });
    },
    onError: (error: Error) => {
      // Error toast is already shown by apiClient interceptor
      console.error('Error deleting knowledge:', error);
    }
  });
};
