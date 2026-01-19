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
  total_paginas: number;
  total_registros: number;
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

export interface PaginationInfo {
  total_records: number;
  current_page: number;
  page_size: number;
  total_pages: number;
}

export interface GetAreasPaginatedResponse {
  areas: Area[];
  total_paginas: number;
  total_registros: number;
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export interface GetAreasParams {
  id_empresa: number;
  num_pagina: number;
  tam_pagina: number;
  term_busqueda: string;
  campo_orden: string;
  dir_orden: 'ASC' | 'DESC';
  filtro_estado: number | null;
}