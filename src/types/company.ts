export interface CreateCompanyRequest {
  ruc: string;
  razon_social: string;
}

export interface CreateCompanyResult {
  ID_TIPO_MENSAJE: number;
  MENSAJE: string;
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

export interface UpdateCompanyStatusRequest {
  id_empresa: number;
  status: number;
}

export interface UpdateCompanyStatusResult {
  ID_TIPO_MENSAJE: number;
  MENSAJE: string;
}

export interface UpdateCompanyStatusResponse {
  results: UpdateCompanyStatusResult[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export interface CompanyLogin {
  RAZON_SOCIAL: string;
  SECRET_KEY: string;
  LOGO: string | null;
}
