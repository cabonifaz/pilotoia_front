export interface CreateAreaRequest {
  id_empresa: number;
  area: string;
}

export interface CreateAreaResult {
  ID_TIPO_MENSAJE: number;
  MENSAJE: string;
}

export interface CreateAreaResponse {
  results: CreateAreaResult[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export interface Area {
  ID_AREA: number;
  ID_EMPRESA: number;
  AREA: string;
  FCHCRE: string;
  ID_ESTADO_REGISTRO: number;
}

export interface GetAreasResponse {
  areas: Area[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export interface UpdateAreaStatusRequest {
  id_empresa: number;
  id_area: number;
  status: number;
}

export interface UpdateAreaNameRequest {
  id_empresa: number;
  id_area: number;
  area: string;
}
