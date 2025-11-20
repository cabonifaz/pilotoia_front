export interface Usuario {
  ID_USUARIO_EMPR_AREA: number;
  ID_USUARIO: number;
  USUARIO: string;
  NOMBRES: string;
  APELLIDOS: string;
  ID_ESTADO_REGISTRO: number;
  ID_EMPRESA: number;
  ID_AREA: number;
  AREA: string;
  ID_TIPO_ROL: number;
  ROL: string;
}

export interface GetUsuariosResponse {
  usuarios: Usuario[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export interface CreateUserRequest {
  nuevo_usuario: string;
  password: string;
  nombres: string;
  apellidos: string;
  id_tipo_rol: number;
  id_empresa: number;
  areas_string: string;
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
