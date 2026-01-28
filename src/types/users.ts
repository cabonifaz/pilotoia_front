export interface Usuario {
  ID_USUARIO_EMPR_AREA: number;
  ID_USUARIO: number;
  USUARIO: string;
  NOMBRES: string;
  APELLIDOS: string;
  TELEFONO?: string | null;
  ID_ESTADO_REGISTRO: number;
  ID_EMPRESA: number;
  ID_AREA: number;
  AREA: string;
  ID_TIPO_ROL: number;
  ROL: string;
}

export interface CreateUserRequest {
  nuevo_usuario: string;
  password: string;
  nombres: string;
  apellidos: string;
  codigo_pais: string;
  telefono: string;
  nuevo_rol: number;
  id_empresa: number;
  areas_string: string;
}

export interface UpdateUserRequest {
  id_usuario: number;
  usuario: string;
  nombres: string;
  apellidos: string;
  telefono?: string | null;
}

export interface CreateUserResult {
  ID_TIPO_MENSAJE: number;
  MENSAJE: string;
}

export interface CreateUserResponse {
  results: CreateUserResult[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export interface UpdateUserResponse {
  results: CreateUserResult[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export interface UpdateUserStatusRequest {
  id_usuario: number;
  status: number;
}

export interface UpdateUserStatusResponse {
  results: CreateUserResult[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export interface UpdateUserPasswordRequest {
  id_usuario: number;
  clave_acceso: string;
}

export interface UpdateUserPasswordResponse {
  results: CreateUserResult[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export interface UpdateUserAccessRequest {
  id_usuario: number;
  nuevo_rol: number;
  areas_string: string;
  id_empresa: number;
}

export interface UpdateUserAccessResponse {
  results: CreateUserResult[];
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

export interface GetUsuariosPaginatedResponse {
  data: Usuario[];
  pagination: PaginationInfo;
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}