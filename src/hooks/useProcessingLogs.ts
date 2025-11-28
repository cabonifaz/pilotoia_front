import { useQuery } from '@tanstack/react-query';
import { getCompanyUploads } from '@/api/uploadApi';
import { useCurrentUser } from '@/hooks/useUserQueries';
import type { KnowledgeLoadResponse } from '@/types/upload';

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
