import type { MensajeResponse } from './Mensaje';

export interface JWTPayload {
  ID_USUARIO: number;
  USUARIO: string;
  NOMBRES: string;
  APELLIDOS: string;
  ID_TIPO_ROL: number;
  ROL: string;
  company_areas: Array<{
    ID_EMPRESA: number;
    EMPRESA: string;
    ID_AREA: number;
    AREA: string;
  }>;
  exp: number;
  iat: number;
  iss: string;
}

export interface DecodedUserData {
  user_id: number;
  user: string;
  nombres: string;
  apellidos: string;
  id_tipo_rol: number;
  rol_nombre: string;
  company_areas: Array<{
    ID_EMPRESA: number;
    EMPRESA: string;
    ID_AREA: number;
    AREA: string;
  }>;
  actual_company_area?: {
    ID_EMPRESA: number;
    EMPRESA: string;
    ID_AREA: number;
    AREA: string;
  } | null;
  status: string;
}

export interface LoginRequest {
    usuario: string;
    clave_acceso: string;
}

export interface LoginResponse {
    token: string;  // JWT token containing all user information
    status: string;
    chats: ChatData[];  // User's chats data for TanStack storage
}

export interface ChatData {
    ID_CHAT: number;
    ID_AREA: number;
    ID_EMPRESA: number;
    TITULO: string;
    ULTIMO_MENSAJE_FECHA?: string;
}

export interface UserInfo {
    id_usuario: number;
    usuario: string;
    nombres: string;
    apellidos: string;
    email?: string;
    ultimo_ingreso?: string;
    id_estado_registro: number;
}

export interface LogoutResponse {
    result: MensajeResponse;
}
