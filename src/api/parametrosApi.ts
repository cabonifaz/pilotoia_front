import apiClient from './apiClient';

export interface Parametro {
  ID_PARAMETRO: number;
  ID_MAESTRO: number;
  ID_SUB_MAESTRO: number | null;
  NUM1: number;
  NUM2: number;
  NUM3: number;
  STRING1: string;
  STRING2: string;
  STRING3: string;
}

export interface GetParamByIdMaestroResponse {
  data: Parametro[];
  result: {
    idTipoMensaje: number;
    mensaje: string;
  };
}

export const getParamByIdMaestro = async (
  grp_id_maestro: string
): Promise<GetParamByIdMaestroResponse> => {
  const response = await apiClient.get<GetParamByIdMaestroResponse>(
    '/v1/parametros/get_param_by_id_maestro',
    { params: { grp_id_maestro } }
  );
  return response.data;
};
