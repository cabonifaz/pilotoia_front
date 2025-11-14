export interface CreateCompanyRequest {
  ruc: string;
  razon_social: string;
}

export interface CreateCompanyResult {
  id_rol: number;
  message: string;
  id_company: number;
  id_area: number;
}

export interface CreateCompanyResponse {
  results: CreateCompanyResult[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export interface Company {
  ID_EMPRESA: number;
  RUC: string;
  RAZON_SOCIAL: string;
  FCHCRE: string;
  ID_ESTADO_REGISTRO: number;
}

export interface GetCompaniesResponse {
  companies: Company[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}
