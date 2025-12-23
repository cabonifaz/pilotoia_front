export interface PhoneCode {
  CODIGO_NUMERICO: number;
  CODIGO_ISO: string;
  NOMBRE_PAIS: string;
  PREFIJO_TELEFONICO: string;
}

export interface GetPhoneCodesResponse {
  phone_codes: PhoneCode[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}
