export interface Agente {
  ID_AGENTE_EMPR_AREA: number;
  ID_AGENTE: number;
  NUMERO_TELF: string;
  CODIGO_PAIS: string;
  ID_TIPO_AGENTE: number;
  ACCESO_GENERAL: number;
  ESTADO_OPERATIVO: number;
  ID_ESTADO_REGISTRO: number;
  ID_EMPRESA: number;
  ID_AREA: number;
  AREA: string;
}

export interface CreateAgentRequest {
  numero_telf: string;
  codigo_pais: string;
  id_tipo_agente: number;
  id_empresa: number;
  acceso_general: number;
  areas_string: string;
}

export interface CreateAgentResult {
  ID_TIPO_MENSAJE: number;
  MENSAJE: string;
}

export interface CreateAgentResponse {
  results: CreateAgentResult[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export interface PaginationInfo {
  total_records: number;
  current_page: number;
  page_size: number;
  total_pages: number;
}

export interface GetAgentesPaginatedResponse {
  data: Agente[];
  pagination: PaginationInfo;
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

// Update requests
export interface UpdateAgentRequest {
  id_agente: number;
  numero_telf: string;
  codigo_pais: string;
  id_tipo_agente: number;
  acceso_general: number;
}

export interface UpdateAgentStatusRequest {
  id_agente: number;
  status: number;
}

export interface UpdateAgentOperativoRequest {
  id_agente: number;
  operativo: number;
}

export interface UpdateAgentSecretKeyRequest {
  id_agente: number;
}

export interface UpdateAgentAccessRequest {
  id_agente: number;
  id_empresa: number;
  areas_string: string;
}

// Shared response type for all update endpoints
export interface UpdateAgentResponse {
  results: CreateAgentResult[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}