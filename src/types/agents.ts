export interface Agente {
  ID_AGENTE_EMPR_AREA: number;
  ID_AGENTE: number;
  NUMERO_TELF?: string | null;
  ID_TIPO_AGENTE: number;
  ACCESO_GENERAL: number;
  ESTADO_OPERATIVO: number;
  ID_ESTADO_REGISTRO: number;
  ID_EMPRESA: number;
  ID_AREA: number;
  AREA: string;
}

export interface GetAgentesResponse {
  agentes: Agente[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export interface CreateAgentRequest {
  numero_telf: string;
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