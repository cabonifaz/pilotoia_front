import type { MensajeResponse } from '@/types/Mensaje';
import apiClient from './apiClient';
import type { KnowledgeLoadResponse, BatchUploadKnowledgeRequest, BatchUploadKnowledgeResponse } from '@/types/upload';

export const getPresignedUrls = async (
  batchRequest: BatchUploadKnowledgeRequest
): Promise<BatchUploadKnowledgeResponse['uploads']> => {
  const response = await apiClient.post<BatchUploadKnowledgeResponse>(
    '/v1/knowledge/batch_upload_knowledge',
    batchRequest
  );
  return response.data.uploads;
};

export const updateUploadInQueue = async (
  uploadId: number
): Promise<MensajeResponse> => {
  const response = await apiClient.patch<MensajeResponse>(
    `/v1/knowledge/get_company_uploads/${uploadId}/in_queue`
  );
  return response.data
}

export const getCompanyUploads = async (
  companyId: number,
  areaId?: number
): Promise<KnowledgeLoadResponse[]> => {
  const response = await apiClient.post<{ knowledge: KnowledgeLoadResponse[] }>(
    '/v1/knowledge/get_knowledge',
    {
      id_empresa: companyId,
      id_area: areaId
    }
  );
  return response.data.knowledge;
};

export const uploadPdfToS3 = async (
  presignedUrl: string,
  file: File
): Promise<void> => {
  // Use fetch for S3 presigned URL upload (not axios)
  // Do not add Content-Type header - it triggers CORS preflight
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file to S3: ${response.statusText}`);
  }
};

export const uploadMultiplePdfs = async (
  files: File[],
  companyId: number,
  areaId: number,
  embeddingModel: string
): Promise<BatchUploadKnowledgeResponse['uploads']> => {
  // Get presigned URLs for all files
  const batchRequest: BatchUploadKnowledgeRequest = {
    id_empresa: companyId,
    id_area: areaId,
    pdf_keys: files.map(file => file.name),
    id_modelo_embedding: embeddingModel,
  };

  const uploads = await getPresignedUrls(batchRequest);

  // Upload each file to S3 using its presigned URL
  const uploadPromises = uploads.map((upload, index) => {
    return uploadPdfToS3(upload.presigned_url, files[index]);
  });

  await Promise.all(uploadPromises);

  return uploads;
};
