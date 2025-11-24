import type { MensajeResponse } from '@/types/Mensaje';
import apiClient from './apiClient';
import type { PresignedUrlRequest, PresignedUrlResponse, KnowledgeLogsResponse } from '@/types/upload';

export const getPresignedUrls = async (
  request: PresignedUrlRequest
): Promise<PresignedUrlResponse[]> => {
  const response = await apiClient.post<PresignedUrlResponse[]>(
    '/v1/knowledge/get_presigned_urls',
    request
  );
  return response.data;
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
  limit: number = 100,
  areaId: number
): Promise<KnowledgeLogsResponse[]> => {
  const response = await apiClient.post<KnowledgeLogsResponse[]>(
    '/v1/knowledge/get_company_uploads',
    {
      company_id: companyId,
      limit: limit,
      area_id: areaId
    }
  );
  return response.data;
};

export const uploadPdfToS3 = async (
  presignedUrl: string,
  file: File
): Promise<void> => {
  // Use fetch for S3 presigned URL upload (not axios)
  // S3 presigned URLs require specific headers
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/pdf',
    },
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
  userId: number,
  embeddingModel: string
): Promise<PresignedUrlResponse[]> => {
  // Get presigned URLs for all files
  const request: PresignedUrlRequest = {
    company_id: companyId,
    area_id: areaId,
    user_id: userId,
    embedding_model: embeddingModel,
    pdf_keys: files.map(file => file.name),
  };

  const presignedResponses = await getPresignedUrls(request);

  // Upload each file to S3 using its presigned URL
  const uploadPromises = presignedResponses.map((response, index) => {
    return uploadPdfToS3(response.presigned_url, files[index]);
  });

  await Promise.all(uploadPromises);

  return presignedResponses;
};
