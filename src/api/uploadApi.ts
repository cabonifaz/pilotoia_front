import type { MensajeResponse } from '@/types/Mensaje';
import apiClient from './apiClient';
import type { KnowledgeLoadResponse, BatchUploadKnowledgeRequest, BatchUploadKnowledgeResponse, RegisterIngestRequest, RegisterIngestResponse, PaginatedRagDocumentsResponse } from '@/types/upload';

export const getPresignedUrls = async (
  batchRequest: BatchUploadKnowledgeRequest
): Promise<BatchUploadKnowledgeResponse> => {
  const response = await apiClient.post<BatchUploadKnowledgeResponse>(
    '/v1/knowledge/batch_upload_knowledge',
    batchRequest
  );
  return response.data;
};

// export const getCompanyUploads = async (
//   companyId: number,
//   areaId?: number
// ): Promise<KnowledgeLoadResponse[]> => {
//   const response = await apiClient.post<{ knowledge: KnowledgeLoadResponse[] }>(
//     '/v1/knowledge/get_knowledge',
//     {
//       id_empresa: companyId,
//       id_area: areaId
//     }
//   );
//   return response.data.knowledge;
// };


export interface PaginatedKnowledgeResponse {
  registros: KnowledgeLoadResponse[];
  total_registros: number;
  total_paginas: number;
  pagina_actual: number;
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export const getCompanyUploadsPaginated = async (
  companyId: number,
  areaId: number | undefined,
  numPagina: number,
  tamPagina: number,
  termBusqueda?: string,
  campoOrden?: string,
  dirOrden?: string,
  filtroEstado?: number
): Promise<PaginatedKnowledgeResponse> => {
  const params = new URLSearchParams({
    id_empresa: companyId.toString(),
    num_pagina: numPagina.toString(),
    tam_pagina: tamPagina.toString(),
    campo_orden: campoOrden || 'FCHMOD',
    dir_orden: dirOrden || 'DESC',
  });

  if (areaId !== undefined) {
    params.append('id_area', areaId.toString());
  }

  if (termBusqueda) {
    params.append('term_busqueda', termBusqueda);
  }

  if (filtroEstado !== undefined) {
    params.append('filtro_estado', filtroEstado.toString());
  }

  const response = await apiClient.get<PaginatedKnowledgeResponse>(
    `/v1/knowledge/get_knowledge_paginated?${params.toString()}`
  );
  return response.data;
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
): Promise<BatchUploadKnowledgeResponse & { uploadCompanyId: number; uploadAreaId: number }> => {
  // Get presigned URLs for all files
  const batchRequest: BatchUploadKnowledgeRequest = {
    id_empresa: companyId,
    id_area: areaId,
    pdf_keys: files.map(file => file.name),
    id_modelo_embedding: embeddingModel,
  };

  const fullResponse = await getPresignedUrls(batchRequest);

  // Upload each file to S3 using its presigned URL
  const uploadPromises = fullResponse.uploads.map((upload, index) => {
    return uploadPdfToS3(upload.presigned_url, files[index]);
  });

  await Promise.all(uploadPromises);

  // Return response with the company and area IDs attached
  return {
    ...fullResponse,
    uploadCompanyId: companyId,
    uploadAreaId: areaId,
  };
};

export const registerIngestion = async (
  request: RegisterIngestRequest
): Promise<RegisterIngestResponse> => {
  const response = await apiClient.post<RegisterIngestResponse>(
    '/v1/knowledge/register_ingestion',
    request
  );
  return response.data;
};

export const getCompanyRagDocumentsPaginated = async (
  companyId: number,
  areaId: number,
  numPagina: number,
  tamPagina: number,
  termBusqueda?: string,
  campoOrden?: string,
  dirOrden?: string,
  filtroEstado?: number,
  mostrarDeshabilitados?: boolean,
): Promise<PaginatedRagDocumentsResponse> => {
  const params = new URLSearchParams({
    id_empresa: companyId.toString(),
    id_area: areaId.toString(),
    num_pagina: numPagina.toString(),
    tam_pagina: tamPagina.toString(),
    campo_orden: campoOrden || 'FCHCRE',
    dir_orden: dirOrden || 'DESC',
  });
  if (termBusqueda) params.append('term_busqueda', termBusqueda);
  if (filtroEstado !== undefined) params.append('filtro_estado', filtroEstado.toString());
  if (mostrarDeshabilitados) params.append('mostrar_deshabilitados', 'true');

  const response = await apiClient.get<PaginatedRagDocumentsResponse>(
    `/v1/knowledge/get_rag_documents_paginated?${params.toString()}`
  );
  return response.data;
};

export const batchUpdateKnowledgeState = async (
  idCargas: number[],
  idEstadoProceso: number
): Promise<MensajeResponse> => {
  const response = await apiClient.patch<MensajeResponse>(
    '/v1/knowledge/batch_update_knowledge_state',
    {
      id_cargas: idCargas,
      id_estado_proceso: idEstadoProceso,
    }
  );
  return response.data;
};

export interface BatchDeleteKnowledgeResponse {
  message_result: {
    ID_TIPO_MENSAJE: number;
    MENSAJE: string;
  };
  deleted_count: number;
  deleted_records: Array<{
    id: number;
    documento: string;
  }>;
  weaviate_result: {
    success: boolean;
    deleted_count: number;
    errors?: string[];
  };
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export const batchDeleteKnowledge = async (
  idCargas: number[]
): Promise<BatchDeleteKnowledgeResponse> => {
  const response = await apiClient.delete<BatchDeleteKnowledgeResponse>(
    '/v1/knowledge',
    {
      data: {
        id_cargas: idCargas,
      }
    }
  );
  return response.data;
};

export interface RetryIngestionResponse {
  id_proceso: number;
  nro_intento: number;
  id_etapa: number;
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export interface DeleteRagDocumentsResponse {
  message_result: { ID_TIPO_MENSAJE: number; MENSAJE: string } | null;
  deleted_count: number;
  deleted_records: Array<{
    ID_DOCUMENTO: number;
    ID_EMPRESA: number;
    ID_AREA: number;
    ID_ESTADO_PROCESO: number;
    NOMBRE_DOCUMENTO: string;
  }>;
  weaviate_result: unknown;
  rollback_performed: boolean;
  result: { idTipoMensaje: number; mensaje: string };
}

export const deleteRagDocuments = async (
  idDocumentos: number[],
  idEmpresa: number
): Promise<DeleteRagDocumentsResponse> => {
  const response = await apiClient.delete<DeleteRagDocumentsResponse>(
    '/v1/knowledge/rag_documents',
    { data: { id_documentos: idDocumentos, id_empresa: idEmpresa } }
  );
  return response.data;
};

export interface ToggleRagDocumentResponse {
  id_documento: number;
  result: { idTipoMensaje: number; mensaje: string };
}

export const disableRagDocument = async (
  idDocumento: number,
  idEmpresa: number
): Promise<ToggleRagDocumentResponse> => {
  const response = await apiClient.patch<ToggleRagDocumentResponse>(
    `/v1/knowledge/rag_documents/${idDocumento}/disable`,
    { id_empresa: idEmpresa }
  );
  return response.data;
};

export const enableRagDocument = async (
  idDocumento: number,
  idEmpresa: number
): Promise<ToggleRagDocumentResponse> => {
  const response = await apiClient.patch<ToggleRagDocumentResponse>(
    `/v1/knowledge/rag_documents/${idDocumento}/enable`,
    { id_empresa: idEmpresa }
  );
  return response.data;
};

export const retryIngestion = async (
  idDocumento: number,
  idEtapa: number
): Promise<RetryIngestionResponse> => {
  const response = await apiClient.post<RetryIngestionResponse>(
    '/v1/knowledge/retry_ingestion',
    { id_documento: idDocumento, id_etapa: idEtapa }
  );
  return response.data;
};
