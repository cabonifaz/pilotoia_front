export interface IAModel {
  ID_MODELO: number;
  NOMBRE: string;
  IDENTIFICADOR: string;
  PROVEEDOR: string;
  EXTRA: number; // Type-specific parameter (vector_size for Embeddings, max_tokens for Text/Vision, etc.)
  ID_TIPO: number;
  TIPO: string;
  ID_ESTADO_REGISTRO: number;
}

export interface GetModelsResponse {
  models: IAModel[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export interface ModelCreateRequest {
  model: string;
  id_model: string;
  provider: string;
  type_id: number;
  extra_parameter: number;
}

export interface CreateModelResponse {
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}
