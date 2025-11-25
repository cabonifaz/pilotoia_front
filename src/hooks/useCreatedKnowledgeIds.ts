import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useUserQueries';

export const useCreatedKnowledgeIds = () => {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const companyId = user?.actual_company_area?.ID_EMPRESA;
  const areaId = user?.actual_company_area?.ID_AREA;

  const query = useQuery<number[]>({
    queryKey: ['created_knowledge_ids', companyId, areaId],
    queryFn: async () => {
      // This query is only populated via setCreatedIds, never fetched from server
      return [];
    },
    enabled: false, // Never auto-fetch, only use stored data
  });

  const setCreatedIds = (ids: number[]) => {
    queryClient.setQueryData(['created_knowledge_ids', companyId, areaId], ids);
  };

  const clearCreatedIds = () => {
    // Completely remove the query from the cache
    queryClient.removeQueries({
      queryKey: ['created_knowledge_ids', companyId, areaId],
      exact: true,
      type: 'all'
    });
  };

  return {
    createdIds: query.data || [],
    setCreatedIds,
    clearCreatedIds,
  };
};
