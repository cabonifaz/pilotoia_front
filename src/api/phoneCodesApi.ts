import apiClient from './apiClient';
import type { GetPhoneCodesResponse } from '@/types/phoneCodes';

export const getPhoneCodes = async (): Promise<GetPhoneCodesResponse> => {
  const response = await apiClient.get<GetPhoneCodesResponse>(
    '/v1/phone_code/get_phone_codes'
  );
  return response.data;
};
