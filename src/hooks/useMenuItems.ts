import { useQuery } from '@tanstack/react-query';
import { getMenuItems } from '../api/menuItemsApi';
import type { MenuItem } from '@/types/menuItems';
import { useCurrentUser } from './useUserQueries';

// Query key factory
export const menuItemsKeys = {
  all: ['menu-items'] as const,
  list: () => [...menuItemsKeys.all, 'list'] as const,
};

// Hook to fetch menu items for current user
export const useMenuItemsQuery = () => {
  const { user, isAuthenticated } = useCurrentUser();

  return useQuery({
    queryKey: menuItemsKeys.list(),
    queryFn: async (): Promise<MenuItem[]> => {
      const response = await getMenuItems();
      return response.menu_items;
    },
    enabled: isAuthenticated && !!user, // Only fetch if user is logged in
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: 2, // Retry failed requests twice
  });
};

// Hook to get menu items with loading state
export const useMenuItems = () => {
  const { data: menuItems = [], isLoading, error } = useMenuItemsQuery();

  return {
    menuItems,
    isLoading,
    error,
    hasMenuItems: menuItems.length > 0,
  };
};