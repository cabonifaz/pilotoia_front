import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPresignedUrls, uploadPdfToS3, registerIngestion } from '../api/uploadApi';
import type { BatchUploadKnowledgeResponse, BatchUploadKnowledgeRequest } from '../types/upload';
import { useCurrentUser } from './useUserQueries';
import { toast } from './use-toast';

type FileStatus = 'idle' | 'uploading' | 'done' | 'error';

interface UploadPdfsParams {
  files: File[];
  fileIds: string[];
  pageCounts: (number | null)[];
  areaId?: number;
  embeddingModel?: string;
  onFileStatusChange?: (fileId: string, status: FileStatus) => void;
  onRegisterStart?: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const usePresignedUrls = () => {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UploadPdfsParams): Promise<BatchUploadKnowledgeResponse & { uploadCompanyId: number; uploadAreaId: number }> => {
      const { files, fileIds, pageCounts, areaId: selectedAreaId, embeddingModel: selectedEmbeddingModel, onFileStatusChange, onRegisterStart } = params;
      const companyId = user?.actual_company_area?.ID_EMPRESA;
      const areaId = selectedAreaId;
      const embeddingModel = selectedEmbeddingModel || '4';

      if (!companyId || !areaId) {
        throw new Error('Información de empresa/área incompleta');
      }

      try {
        // Step 1: Get presigned URLs from backend (no DB write)
        const batchRequest: BatchUploadKnowledgeRequest = {
          id_empresa: companyId,
          id_area: areaId,
          pdf_keys: files.map(file => file.name),
          id_modelo_embedding: embeddingModel,
        };

        const response = await getPresignedUrls(batchRequest);

        // Step 2: Upload files to S3 concurrently, tracking per-file status
        fileIds.forEach(id => onFileStatusChange?.(id, 'uploading'));

        const uploadPromises = response.uploads.map((upload, index) =>
          uploadPdfToS3(upload.presigned_url, files[index])
            .then(() => { onFileStatusChange?.(fileIds[index], 'done'); })
            .catch((err) => { onFileStatusChange?.(fileIds[index], 'error'); throw err; })
        );

        await Promise.all(uploadPromises);

        // Step 3: Register docs in DB and enqueue to SQS
        onRegisterStart?.();
        const documentos = response.uploads.map((upload, index) => ({
          nombre_documento: upload.document_name,
          ruta_documento: upload.s3_key,
          id_modelo_embedding: parseInt(embeddingModel),
          cant_paginas: pageCounts[index] ?? undefined,
          tamano_bytes: files[index].size,
        }));
        await registerIngestion({ id_empresa: companyId, id_area: areaId, documentos });

        // Step 4: Invalidate table cache
        queryClient.invalidateQueries({ queryKey: ['rag-documents-paginated'] });

        return {
          ...response,
          uploadCompanyId: companyId,
          uploadAreaId: areaId,
        };
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    },
    retry: false,
    onSuccess: () => {
      toast({
        title: 'Éxito',
        description: 'Documentos subidos correctamente',
        variant: 'success',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Error en la carga: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
