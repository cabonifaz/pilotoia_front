import { useQuery } from '@tanstack/react-query';
import { getDocumentDetail } from '@/api/uploadApi';
import type { RagDocumentDetailResponse } from '@/types/upload';

export const useDocumentDetail = (idDocumento: number | null, idProceso?: number) =>
  useQuery<RagDocumentDetailResponse>({
    queryKey: ['rag-document-detail', idDocumento, idProceso ?? 'latest'],
    queryFn: () => getDocumentDetail(idDocumento!, idProceso),
    enabled: idDocumento !== null,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
