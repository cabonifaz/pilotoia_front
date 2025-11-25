import { useMutation } from '@tanstack/react-query';
import { uploadMultiplePdfs } from '../api/uploadApi';
import type { BatchUploadKnowledgeResponse } from '../types/upload';
import { useCurrentUser } from './useUserQueries';
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

  return useMutation({
    mutationFn: async ({ files, areaId: selectedAreaId, embeddingModel: selectedEmbeddingModel }: UploadPdfsParams): Promise<BatchUploadKnowledgeResponse['uploads']> => {
      const companyId = user?.actual_company_area?.ID_EMPRESA;
      const areaId = selectedAreaId || user?.actual_company_area?.ID_AREA;
      const embeddingModel = selectedEmbeddingModel || user?.actual_company_area?.ID_EMBEDDINGS?.toString() || '4';

      if (!companyId || !areaId) {
        throw new Error('Información de empresa/área incompleta');
      }

      try {
        // Use the uploadMultiplePdfs function which handles presigned URLs and S3 uploads
        const presignedResponses = await uploadMultiplePdfs(
          files,
          companyId,
          areaId,
          embeddingModel
        );

        return presignedResponses;
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    },
    // Disable automatic retry for uploads to prevent duplicates
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
