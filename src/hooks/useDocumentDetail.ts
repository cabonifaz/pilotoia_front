import { useQuery } from '@tanstack/react-query';
import { getDocumentDetail } from '@/api/uploadApi';
import type { RagDocumentDetailResponse } from '@/types/upload';

export const useDocumentDetail = (idDocumento: number | null) =>
  useQuery<RagDocumentDetailResponse>({
    queryKey: ['rag-document-detail', idDocumento],
    queryFn: () => getDocumentDetail(idDocumento!),
    enabled: idDocumento !== null,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
