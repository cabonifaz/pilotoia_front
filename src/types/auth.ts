import type { MensajeResponse } from './Mensaje';

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
