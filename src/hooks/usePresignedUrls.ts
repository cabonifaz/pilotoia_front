import { useMutation } from '@tanstack/react-query';
import { getPresignedUrls, uploadPdfToS3 } from '../api/uploadApi';
import type { PresignedUrlRequest, PresignedUrlResponse } from '../types/upload';
import { toast } from './use-toast';

interface UploadPdfsParams {
  request: PresignedUrlRequest;
  files: File[];
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const usePresignedUrls = () => {
  return useMutation({
    mutationFn: async ({ request, files }: UploadPdfsParams): Promise<PresignedUrlResponse[]> => {
      // Get presigned URLs
      const presignedUrls = await getPresignedUrls(request);

      // Upload each file to S3 using presigned URLs
      const uploadPromises = presignedUrls.map((response, index) => {
        return uploadPdfToS3(response.presigned_url, files[index]);
      });

      await Promise.all(uploadPromises);

      return presignedUrls;
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
