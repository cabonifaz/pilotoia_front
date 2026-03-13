import { useQuery } from '@tanstack/react-query';
import { getDocumentProcesses } from '@/api/uploadApi';
import type { RagProcessesPageResponse } from '@/types/upload';

export const useDocumentProcesses = (
  idDocumento: number | null,
  enabled: boolean,
  page = 1,
) =>
  useQuery<RagProcessesPageResponse>({
    queryKey: ['rag-document-procesos', idDocumento, page],
    queryFn: () => getDocumentProcesses(idDocumento!, page),
    enabled: idDocumento !== null && enabled,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
