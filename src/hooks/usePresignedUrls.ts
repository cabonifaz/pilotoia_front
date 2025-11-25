import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadMultiplePdfs } from '../api/uploadApi';
import type { BatchUploadKnowledgeResponse } from '../types/upload';
import { useCurrentUser } from './useUserQueries';
import { useCreatedKnowledgeIds } from './useCreatedKnowledgeIds';
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
  const { setCreatedIds } = useCreatedKnowledgeIds();
  const batchUpdateMutation = useBatchUpdateKnowledgeState();

  return useMutation({
    mutationFn: async ({ files, areaId: selectedAreaId, embeddingModel: selectedEmbeddingModel }: UploadPdfsParams): Promise<BatchUploadKnowledgeResponse> => {
      const companyId = user?.actual_company_area?.ID_EMPRESA;
      const areaId = selectedAreaId || user?.actual_company_area?.ID_AREA;
      const embeddingModel = selectedEmbeddingModel || user?.actual_company_area?.ID_EMBEDDINGS?.toString() || '4';

      if (!companyId || !areaId) {
        throw new Error('Información de empresa/área incompleta');
      }

      try {
        // Use the uploadMultiplePdfs function which handles presigned URLs and S3 uploads
        const response = await uploadMultiplePdfs(
          files,
          companyId,
          areaId,
          embeddingModel
        );

        // Store the created IDs for batch update later
        setCreatedIds(response.created_ids);

        // Invalidate knowledge query when URLs are consumed and files uploaded to S3
        queryClient.invalidateQueries({ queryKey: ['knowledge'] });

        return response;
      } catch (error) {
        console.error('Upload error:', error);
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
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Error en la carga: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
