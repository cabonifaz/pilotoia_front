import apiClient from './apiClient';
import type { GetMenuItemsResponse } from '@/types/menuItems';

export const getMenuItems = async (): Promise<GetMenuItemsResponse> => {
  const response = await apiClient.get<GetMenuItemsResponse>(
    '/v1/menu/get_menu_items'
  );
  return response.data;
};