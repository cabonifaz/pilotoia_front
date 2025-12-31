import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getPresignedUrls, uploadPdfToS3 } from '../api/uploadApi';
import type { BatchUploadKnowledgeResponse, BatchUploadKnowledgeRequest } from '../types/upload';
import { useCurrentUser } from './useUserQueries';
import { useBatchUpdateKnowledgeState } from './useBatchUpdateKnowledgeState';
import { toast } from './use-toast';

interface UploadPdfsParams {
  files: File[];
  areaId?: number;
  embeddingModel?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const usePresignedUrls = () => {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const batchUpdateMutation = useBatchUpdateKnowledgeState();

  return useMutation({
    mutationFn: async ({ files, areaId: selectedAreaId, embeddingModel: selectedEmbeddingModel }: UploadPdfsParams): Promise<BatchUploadKnowledgeResponse & { uploadCompanyId: number; uploadAreaId: number }> => {
      const companyId = user?.actual_company_area?.ID_EMPRESA;
      const areaId = selectedAreaId;
      const embeddingModel = selectedEmbeddingModel || '4';

      if (!companyId || !areaId) {
        throw new Error('Información de empresa/área incompleta');
      }

      try {
        // Step 1: Get presigned URLs from backend
        const batchRequest: BatchUploadKnowledgeRequest = {
          id_empresa: companyId,
          id_area: areaId,
          pdf_keys: files.map(file => file.name),
          id_modelo_embedding: embeddingModel,
        };

        const response = await getPresignedUrls(batchRequest);

        // Step 2: Store created IDs IMMEDIATELY (before S3 upload attempts)
        // This ensures IDs are available even if S3 uploads fail
        // Store with the actual upload company/area IDs to match retrieval
        queryClient.setQueryData(['created_knowledge_ids', companyId, areaId], response.created_ids);

        // Step 3: Upload files to S3 using presigned URLs
        const uploadPromises = response.uploads.map((upload, index) => {
          return uploadPdfToS3(upload.presigned_url, files[index]);
        });

        await Promise.all(uploadPromises);

        // Step 4: Invalidate cache after successful uploads
        queryClient.invalidateQueries({ queryKey: ['knowledge'] });

        // Return response with company/area IDs attached
        return {
          ...response,
          uploadCompanyId: companyId,
          uploadAreaId: areaId,
        };
      } catch (error) {
        console.error('Upload error:', error);
        // Re-throw with context to handle in onError
        throw error;
      }
    },
    // Disable automatic retry for uploads to prevent duplicates
    retry: false,
    onSuccess: (data) => {
      toast({
        title: 'Éxito',
        description: 'Documentos subidos correctamente',
        variant: 'success',
      });

      // Get the company and area IDs from the mutation data
      const mutationData = data as any;
      const companyId = mutationData.uploadCompanyId;
      const areaId = mutationData.uploadAreaId;

      // Trigger batch update with status 1 (in queue) using the upload's company/area
      batchUpdateMutation.mutate({
        idEstadoProceso: 1,
        companyId,
        areaId
      });
    },
    onError: (error: Error, variables: UploadPdfsParams) => {
      toast({
        title: 'Error',
        description: `Error en la carga: ${error.message}`,
        variant: 'destructive',
      });

      // Get company and area IDs from upload variables
      const companyId = user?.actual_company_area?.ID_EMPRESA;
      const areaId = variables.areaId;

      // Trigger batch update with status 7 (error) to mark failed uploads
      if (companyId && areaId) {
        batchUpdateMutation.mutate({
          idEstadoProceso: 7,
          companyId,
          areaId
        });
      }
    },
  });
};
