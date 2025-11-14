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
