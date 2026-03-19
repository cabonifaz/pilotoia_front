import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getParamByIdMaestro, type Parametro } from '../api/parametrosApi';

const PARAMETROS_IDS = ['2', '8', '12'];

export const useGetParametros = () => {
  const results = useQueries({
    queries: PARAMETROS_IDS.map((id) => ({
      queryKey: ['parametros', id],
      queryFn: async () => {
        return await getParamByIdMaestro(id);
      },
      staleTime: 1000 * 60 * 60 * 8,
      gcTime: 1000 * 60 * 60 * 8,
      refetchOnWindowFocus: false,
      retry: false,
    })),
  });

  // Stable dependency: only recompute when data actually changes
  const dataTimestamps = results.map((r) => r.dataUpdatedAt).join(',');

  const parametrosMap = useMemo(() => {
    const map: Record<string, Parametro[]> = {};

    for (const result of results) {
      if (!result.isSuccess || !result.data?.data) continue;

      // Rows come ordered by ID_MAESTRO from the SP
      let currentGroup: string | null = null;
      let currentList: Parametro[] = [];

      for (const row of result.data.data) {
        const groupKey = String(row.ID_MAESTRO);

        if (groupKey !== currentGroup) {
          if (currentGroup !== null) {
            map[currentGroup] = currentList;
          }
          currentGroup = groupKey;
          currentList = [row];
        } else {
          currentList.push(row);
        }
      }

      if (currentGroup !== null) {
        map[currentGroup] = currentList;
      }
    }

    return map;
  }, [dataTimestamps]);

  return {
    parametrosMap,
    isLoading: results.some((r) => r.isLoading),
  };
};
