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
    CHAT_ID: number;
    AREA_ID: number;
    CREATED_AT: string;
    LAST_ACTIVITY_AT?: string;
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
