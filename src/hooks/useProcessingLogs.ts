import { useQuery } from '@tanstack/react-query';
import { getCompanyUploads } from '@/api/uploadApi';
import { useCurrentUser } from '@/hooks/useUserQueries';
import type { KnowledgeLoadResponse } from '@/types/upload';

interface UseProcessingLogsOptions {
  limit?: number;
  enabled?: boolean;
  refetchInterval?: number;
}

export const useProcessingLogs = ({
  limit = 100,
  enabled = true,
  refetchInterval
}: UseProcessingLogsOptions) => {
  // Get company_id from current user's actual_company_area
  const { user } = useCurrentUser();
  const companyId = user?.actual_company_area?.ID_EMPRESA;
  const areaId = user?.actual_company_area?.ID_AREA;

  return useQuery<KnowledgeLoadResponse[], Error>({
    queryKey: ['company-uploads', companyId, limit],
    queryFn: () => getCompanyUploads(companyId!, limit, areaId!),
    enabled: enabled && !!companyId && !!areaId,
    refetchInterval,
    staleTime: 5 * 60 * 1000,
  });
};
