import { useQueries } from '@tanstack/react-query';
import { getParamByIdMaestro } from '../api/parametrosApi';

const PARAMETROS_IDS = ['12'];

export const useGetParametros = () => {
  const results = useQueries({
    queries: PARAMETROS_IDS.map((id) => ({
      queryKey: ['parametros', id],
      queryFn: async () => {
        const response = await getParamByIdMaestro(id);
        return { id_maestro: id, data: response.data };
      },
      staleTime: 1000 * 60 * 60 * 8,
      gcTime: 1000 * 60 * 60 * 8,
      refetchOnWindowFocus: false,
      retry: false,
    })),
  });

  const parametrosMap = Object.fromEntries(
    results
      .filter((r) => r.isSuccess && r.data)
      .map((r) => [r.data!.id_maestro, r.data!.data])
  );

  return {
    parametrosMap,
    isLoading: results.some((r) => r.isLoading),
  };
};
